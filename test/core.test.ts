import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { CHECK_IN, contactSchema } from '../src/model.js';
import { MockSmsProvider, type SmsProvider } from '../src/provider.js';
import { findResources, loadRegistry, resourceSchema } from '../src/registry.js';
import { addContact, approve, audit, revoke, SafeReach } from '../src/service.js';
import { Store } from '../src/store.js';

async function setup(t: { after(fn: () => Promise<void>): void }, provider: SmsProvider = new MockSmsProvider()) {
  const directory = await mkdtemp(join(tmpdir(), 'safereach-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const store = new Store(directory);
  const id = await addContact(store, { name: 'Demo Friend', relationship: 'friend', phone: '+12025550123',
    channel: 'sms', canMessage: true, recipientAccepted: true, canShareLocation: false, canShareSensitive: false });
  let clock = Date.now();
  const service = new SafeReach(store, provider, () => clock);
  return { directory, store, id, service, now: () => clock, advance: (ms: number) => { clock += ms; } };
}

test('preview -> independent exact approval -> one simulation; replay denied', async t => {
  const s = await setup(t);
  assert.ok(!JSON.stringify(await s.service.listContacts()).includes('+1202'));
  const draft = await s.service.prepare(s.id);
  assert.equal(draft.message, CHECK_IN);
  await assert.rejects(s.service.send(draft.id), /Approve/);
  await assert.rejects(approve(s.store, draft.id, async () => false), /declined/);
  await approve(s.store, draft.id, async (shown, recipient) => {
    assert.equal(shown.id, draft.id); assert.equal(recipient.phone, '+12025550123'); return true;
  });
  assert.deepEqual(await s.service.send(draft.id), { status: 'simulated', realMessageSent: false });
  await assert.rejects(s.service.send(draft.id), /Approve/);
  const events = await s.store.transaction(async state => state.audit);
  assert.deepEqual(events.map(e => e.event), ['contact_added', 'prepared', 'approved', 'attempted', 'simulated']);
  assert.ok(!JSON.stringify(events).includes(CHECK_IN));
  assert.ok(!JSON.stringify(events).includes('+1202'));
});
test('expiry, cancellation, permission revocation, unknown IDs fail closed', async t => {
  const s = await setup(t);
  const expired = await s.service.prepare(s.id);
  s.advance(300001);
  await assert.rejects(approve(s.store, expired.id, async () => true, s.now), /expired/);
  const cancelled = await s.service.prepare(s.id);
  await s.service.cancel(cancelled.id);
  await assert.rejects(approve(s.store, cancelled.id, async () => true, s.now), /pending/);
  const revoked = await s.service.prepare(s.id);
  await approve(s.store, revoked.id, async () => true, s.now);
  await revoke(s.store, s.id);
  await assert.rejects(s.service.send(revoked.id), /revoked/);
  await assert.rejects(s.service.prepare(randomUUID()), /unavailable/);
});
test('ordinary hi and tea previews keep separate consent and immutable text', async t => {
  const s = await setup(t);
  const hi = await s.service.prepare(s.id, 'hi');
  const tea = await s.service.prepare(s.id, 'tea');
  assert.equal(hi.message, 'Hi!');
  assert.equal(tea.message, 'Hey, want to come downstairs for tea?');
  await approve(s.store, hi.id, async draft => draft.message === 'Hi!');
  await assert.rejects(s.service.send(tea.id), /Approve/);
  assert.equal((await s.service.send(hi.id)).status, 'simulated');
});
test('expiry is checked again after human approval delay', async t => {
  const s = await setup(t); const draft = await s.service.prepare(s.id);
  await assert.rejects(approve(s.store, draft.id, async () => { s.advance(300001); return true; }, s.now), /expired/);
});
test('contact consent defaults deny sensitive sharing and recipient opt-out blocks use', async t => {
  const s = await setup(t);
  const row = await s.store.transaction(async state => state.contacts[0]!);
  assert.equal(contactSchema.safeParse({ ...row, canShareLocation: true }).success, false);
  assert.equal(contactSchema.safeParse({ ...row, canShareSensitive: true }).success, false);
  assert.equal(contactSchema.safeParse({ ...row, name: '\u001b[31m' }).success, false);
  await s.store.transaction(async (state, save) => { state.contacts[0]!.recipientAccepted = false; await save(); });
  await assert.rejects(s.service.prepare(s.id), /unavailable/);
});
test('provider failures consume consent and never expose provider error text', async t => {
  let calls = 0;
  const s = await setup(t, { mode: 'mock', send: async () => { calls++; throw new Error('PRIVATE PROVIDER PAYLOAD'); },
    getDeliveryStatus: async providerId => ({ providerId, status: 'unknown' }) });
  const draft = await s.service.prepare(s.id);
  await approve(s.store, draft.id, async () => true);
  assert.equal((await s.service.send(draft.id)).status, 'failed');
  await assert.rejects(s.service.send(draft.id)); assert.equal(calls, 1);
});
test('live provider is rejected at construction', async t => {
  const s = await setup(t);
  assert.throws(() => new SafeReach(s.store, { ...new MockSmsProvider(), mode: 'live', send: async () => { throw new Error(); },
    getDeliveryStatus: async providerId => ({ providerId, status: 'unknown' }) }), /disabled/);
});
test('daily limit persists through audit churn and restart', async t => {
  const s = await setup(t);
  for (let i = 0; i < 3; i++) {
    const draft = await s.service.prepare(s.id); await approve(s.store, draft.id, async () => true);
    await s.service.send(draft.id);
  }
  await s.store.transaction(async (state, save) => {
    for (let i = 0; i < 1200; i++) audit(state, s.now(), 'prepared', s.id, randomUUID());
    await save();
  });
  const draft = await s.service.prepare(s.id); await approve(s.store, draft.id, async () => true);
  await assert.rejects(new SafeReach(new Store(s.directory)).send(draft.id), /Daily limit/);
});
test('vault ciphertext, modes, tamper rejection and process lock', async t => {
  const s = await setup(t);
  const ciphertext = await readFile(join(s.directory, 'vault.enc'));
  assert.ok(!ciphertext.includes(Buffer.from('+12025550123')));
  assert.equal((await stat(s.directory)).mode & 0o777, 0o700);
  assert.equal((await stat(join(s.directory, 'vault.key'))).mode & 0o777, 0o600);
  assert.equal((await stat(join(s.directory, 'vault.enc'))).mode & 0o777, 0o600);
  await s.store.transaction(async () => { await assert.rejects(s.service.listContacts(), /EEXIST/); });
  ciphertext[30] = ciphertext[30]! ^ 1;
  await writeFile(join(s.directory, 'vault.enc'), ciphertext);
  await assert.rejects(s.service.listContacts());
});
test('parallel attempts cannot execute twice', async t => {
  const s = await setup(t); const draft = await s.service.prepare(s.id);
  await approve(s.store, draft.id, async () => true);
  const results = await Promise.allSettled([s.service.send(draft.id), s.service.send(draft.id)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
});
test('registry validates provenance and excludes stale, C/D and wrong city by default', async () => {
  const [official] = await loadRegistry(); assert.ok(official);
  const unverified = { ...official, id: 'unverified', verification: 'D' as const };
  const stale = { ...official, id: 'expired', expiresAt: '2026-11-01T00:00:00.000Z', verifiedAt: '2025-11-01T00:00:00.000Z' };
  const local = { ...official, id: 'local', scope: 'local' as const, city: 'Example City' };
  const now = Date.parse('2026-11-03T00:00:00Z');
  assert.deepEqual(findResources([official, unverified, stale, local], {}, now).map(r => r.id), [official.id]);
  assert.equal(findResources([official, unverified, stale], { exploratory: true }, now).length, 3);
  assert.equal(findResources([local], { city: 'Example City' }, now).length, 1);
  assert.equal(resourceSchema.safeParse({ ...official, sources: ['http://insecure.example'] }).success, false);
  assert.equal(findResources([official], {}, Date.parse('2028-01-01')).length, 0);
});
