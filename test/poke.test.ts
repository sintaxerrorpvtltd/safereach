import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { get } from 'node:http';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { test } from 'node:test';
import { startPokeServer } from '../src/poke-server.js';
import { PokeRelay } from '../src/poke.js';
import { pokeRequest } from '../src/poke-client.js';

async function setup(t: { after(fn: () => Promise<void>): void }) {
  let now = Date.now();
  const relay = new PokeRelay(() => now);
  const app = await startPokeServer({ port: 0, relay });
  t.after(async () => { await new Promise<void>((resolve, reject) => app.server.close(error => error ? reject(error) : resolve())); });
  const api = async (path: string, token?: string, data?: unknown, origin = app.origin) => {
    const response = await fetch(`${app.origin}/api/${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    return { ok: response.ok, data: await response.json() as any };
  };
  const a = (await api('session', undefined, { name: 'Demo Alex' })).data.token;
  const b = (await api('session', undefined, { name: 'Demo Sam' })).data.token;
  const pair = async () => {
    const invite = (await api('invite', a, {})).data.invitation;
    assert.equal((await api('join', b, { invitation: invite, agree: true })).ok, true);
    const request = (await api('state', a)).data.incoming.id;
    assert.equal((await api('accept', a, { id: request })).ok, true);
    return invite;
  };
  return { ...app, api, a, b, pair, advance: (ms: number) => { now += ms; } };
}

test('mutual consent required; single-use invite, accepted peer-only poke and exact event', async t => {
  const s = await setup(t);
  assert.equal((await s.api('poke', s.a, {})).ok, false);
  const invite = (await s.api('invite', s.a, {})).data.invitation;
  assert.equal((await s.api('join', s.a, { invitation: invite, agree: true })).ok, false);
  assert.equal((await s.api('join', s.b, { invitation: invite, agree: false })).ok, false);
  assert.equal((await s.api('join', s.b, { invitation: invite, agree: true })).ok, true);
  assert.equal((await s.api('poke', s.b, {})).ok, false);
  const incoming = (await s.api('state', s.a)).data.incoming;
  assert.equal((await s.api('accept', s.a, { id: incoming.id })).ok, true);
  assert.equal((await s.api('join', s.b, { invitation: invite, agree: true })).ok, false);
  assert.equal((await s.api('poke', s.a, { message: 'private transcript' })).ok, false);
  assert.equal((await s.api('poke', s.a, {})).data.status, 'queued');
  const received = (await s.api('state', s.b)).data;
  assert.equal(received.inbox.length, 1); assert.equal(received.inbox[0].from, 'Demo Alex');
  assert.ok(!JSON.stringify(received).includes(s.a));
  assert.equal((await s.api('poke', s.a, {})).ok, false);
});
test('connector can only read own inbox and prepare; no browser actions or other-person approvals', async t => {
  const s = await setup(t); await s.pair();
  const connector = (await s.api('connector', s.a, {})).data.token;
  const preview = (await s.api('preview', connector, {})).data;
  assert.equal(preview.needsInboxApproval, true);
  for (const action of ['poke', 'connector', 'invite', 'disconnect']) assert.equal((await s.api(action, connector, {})).ok, false);
  assert.equal((await s.api('approve', connector, { id: preview.id })).ok, false);
  assert.equal((await s.api('approve', s.b, { id: preview.id })).ok, false);
  assert.equal((await s.api('state', connector)).data.previews.length, 0);
  assert.equal((await s.api('state', s.b)).data.inbox.length, 0);
  assert.equal((await s.api('approve', s.a, { id: preview.id })).data.status, 'queued');
  assert.equal((await s.api('approve', s.a, { id: preview.id })).ok, false);
  const replacement = (await s.api('connector', s.a, {})).data.token;
  assert.notEqual(replacement, connector); assert.equal((await s.api('state', connector)).ok, false);
});
test('preview expiry, recipient mute and disconnect revoke pending authority', async t => {
  const s = await setup(t); await s.pair();
  const expired = (await s.api('preview', s.a, {})).data.id;
  s.advance(120001);
  assert.equal((await s.api('approve', s.a, { id: expired })).ok, false);
  const preview = (await s.api('preview', s.a, {})).data.id;
  await s.api('mute', s.b, { muted: true });
  assert.equal((await s.api('approve', s.a, { id: preview })).ok, false);
  assert.equal((await s.api('poke', s.a, {})).ok, false);
  await s.api('mute', s.b, { muted: false });
  await s.api('disconnect', s.b, {});
  assert.equal((await s.api('approve', s.a, { id: preview })).ok, false);
  assert.equal((await s.api('state', s.a)).data.peer, null);
  assert.equal((await s.api('state', s.a)).data.previews.length, 0);
});
test('invitation/session lifetime and ten per hour bound', async t => {
  const s = await setup(t);
  const invitation = (await s.api('invite', s.a, {})).data.invitation;
  s.advance(600001);
  assert.equal((await s.api('join', s.b, { invitation, agree: true })).ok, false);
  await s.pair();
  for (let i = 0; i < 10; i++) { assert.equal((await s.api('poke', s.a, {})).ok, true); s.advance(30001); }
  assert.equal((await s.api('poke', s.a, {})).ok, false);
  s.advance(8 * 3600000);
  assert.equal((await s.api('state', s.a)).ok, false);
  assert.equal(s.relay.people.size, 0);
});
test('origin, host, body limit, strict fields and local default headers', async t => {
  const s = await setup(t);
  assert.equal((await s.api('invite', s.a, {}, 'https://other.example')).ok, false);
  assert.equal((await s.api('session', undefined, { name: '<script>bad()</script>' })).ok, false);
  assert.equal((await s.api('session', undefined, { name: 'A'.repeat(3000) })).ok, false);
  const wrongHost = await new Promise<number | undefined>((resolve, reject) => {
    get(`${s.origin}/api/state`, { headers: { Host: 'attacker.example', Authorization: `Bearer ${s.a}` } }, response => {
      response.resume(); resolve(response.statusCode);
    }).on('error', reject);
  });
  assert.equal(wrongHost, 400);
  const page = await fetch(s.origin);
  assert.match(page.headers.get('content-security-policy')!, /frame-ancestors 'none'/);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.match(await page.text(), /local prototype/);
  await assert.rejects(startPokeServer({ host: '0.0.0.0', port: 0 }), /HTTPS/);
});
test('limited connector uses operator-selected private config; no arbitrary destination arguments', async t => {
  const s = await setup(t); await s.pair();
  const config = (await s.api('connector', s.a, {})).data;
  const directory = await mkdtemp(join(tmpdir(), 'safereach-poke-config-'));
  const file = join(directory, 'test.private.json');
  await writeFile(file, JSON.stringify(config), { mode: 0o600 });
  const original = process.env.SAFEREACH_POKE_CONFIG; process.env.SAFEREACH_POKE_CONFIG = file;
  t.after(async () => { if (original === undefined) delete process.env.SAFEREACH_POKE_CONFIG; else process.env.SAFEREACH_POKE_CONFIG = original; await rm(directory, { recursive: true }); });
  assert.equal((await pokeRequest('state') as { name: string }).name, 'Demo Alex');
  assert.equal((await pokeRequest('preview') as { recipient: string }).recipient, 'Demo Sam');
  assert.equal((await s.api('state', s.b)).data.inbox.length, 0);
  const client = new Client({ name: 'poke-feasibility-test', version: '1.0.0' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve('dist/src/server.js')],
    env: { SAFEREACH_POKE_CONFIG: file }, stderr: 'pipe' }));
  t.after(() => client.close());
  await s.api('poke', s.b, {});
  const inbox = await client.callTool({ name: 'read_poke_inbox', arguments: {} });
  assert.match(JSON.stringify(inbox), /Demo Sam/);
  assert.match(JSON.stringify(inbox), /inbox/);
  const preview = await client.callTool({ name: 'prepare_poke', arguments: {} });
  assert.match(JSON.stringify(preview), /needsInboxApproval/);
  assert.equal((await s.api('state', s.b)).data.inbox.length, 0, 'MCP preparation must not send anything.');
});

test('personal avatars require browser consent, validate bounded PNG and stay out of MCP state', async t => {
  const s = await setup(t);
  const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
  const connector = (await s.api('connector', s.a, {})).data.token;
  for (const data of [{ avatar, agree: false }, { avatar }, { avatar: 'https://example.com/photo.png', agree: true }, { avatar: 'data:image/svg+xml;base64,PHN2Zz4=', agree: true }, { avatar: 'data:image/png;base64,AAAA', agree: true }]) {
    assert.equal((await s.api('avatar', s.a, data)).ok, false);
  }
  assert.equal((await s.api('avatar', connector, { avatar, agree: true })).ok, false);
  assert.equal((await s.api('avatar', s.a, { avatar, agree: true })).ok, true);
  assert.equal((await s.api('state', s.a)).data.avatar, avatar);
  assert.equal((await s.api('state', connector)).data.avatar, undefined);
  assert.equal(JSON.stringify((await s.api('state', s.b)).data).includes(avatar), false);
  await s.pair();
  assert.equal((await s.api('state', s.b)).data.peer.avatar, avatar);
  assert.equal((await s.api('preview', s.a, {})).ok, true);
  const preview = (await s.api('state', s.a)).data.previews[0].id;
  await s.api('avatar', s.a, { avatar: null, agree: true });
  assert.equal((await s.api('approve', s.a, { id: preview })).ok, false, 'changing avatar invalidates preview');
  assert.equal((await s.api('state', s.b)).data.peer.avatar, null);
});

test('received avatar comes from authenticated sender; removal and disconnect clear image access', async t => {
  const s = await setup(t); await s.pair();
  const avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
  await s.api('avatar', s.a, { avatar, agree: true });
  assert.equal((await s.api('poke', s.a, { from: 'Another person', avatar })).ok, false);
  const preview = (await s.api('preview', s.a, {})).data.id;
  await s.api('approve', s.a, { id: preview });
  const inbox = (await s.api('state', s.b)).data.inbox;
  assert.equal(inbox[0].from, 'Demo Alex'); assert.equal(inbox[0].avatar, avatar);
  const connector = (await s.api('connector', s.b, {})).data.token;
  assert.equal(JSON.stringify((await s.api('state', connector)).data).includes(avatar), false);
  await s.api('avatar', s.a, { avatar: null, agree: true });
  assert.equal((await s.api('state', s.b)).data.inbox[0].avatar, null);
  await s.api('disconnect', s.a, {});
  assert.equal((await s.api('state', s.b)).data.inbox.length, 0);
});

test('avatar payload dimensions and upload body remain bounded', async t => {
  const s = await setup(t);
  const bytes = Buffer.alloc(33); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.write('IHDR', 12); bytes.writeUInt32BE(10000, 16); bytes.writeUInt32BE(1, 20);
  assert.equal((await s.api('avatar', s.a, { avatar: `data:image/png;base64,${bytes.toString('base64')}`, agree: true })).ok, false);
  assert.equal((await s.api('avatar', s.a, { avatar: 'A'.repeat(100001), agree: true })).ok, false);
});

test('connected static serving fails closed without a build and rejects foreign service origins', async t => {
  const s = await setup(t);
  assert.equal((await fetch(`${s.origin}/connected/`)).status, 400);
  assert.equal((await fetch(`${s.origin}/connected/.env.local`)).status, 400);
  for (const convexUrl of ['https://evil.example', 'https://test.convex.cloud:444', 'https://test.convex.cloud/path']) {
    await assert.rejects(startPokeServer({ port: 0, connected: { convexUrl, clerkIssuer: 'https://test.clerk.accounts.dev' } }));
  }
});
