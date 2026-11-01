import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { configure } from './setup.mjs';
async function workspace(t) {
  const path = await mkdtemp('/tmp/poki-setup-'); const root = pathToFileURL(`${path}/`);
  await copyFile(new URL('service.development.json', import.meta.url), new URL('service.development.json', root));
  t.after(() => rm(path, { recursive: true, force: true })); return root;
}
test('public development setup is idempotent and retains unrelated settings', async t => {
  const root = await workspace(t); await writeFile(new URL('.env.local', root), 'UNRELATED=preserve\n');
  await configure(root); const once = await readFile(new URL('.env.local', root), 'utf8'); await configure(root);
  assert.equal(await readFile(new URL('.env.local', root), 'utf8'), once); assert.match(once, /UNRELATED=preserve/); assert.doesNotMatch(once, /SECRET|DEPLOY_KEY/);
});
test('setup never replaces an existing different backend', async t => {
  const root = await workspace(t); const old = 'VITE_CONVEX_URL=https://different.convex.cloud\n'; await writeFile(new URL('.env.local', root), old);
  await assert.rejects(configure(root), /Preserved/); assert.equal(await readFile(new URL('.env.local', root), 'utf8'), old);
});
test('setup rejects a public key and issuer mismatch before writing', async t => {
  const root = await workspace(t), file = new URL('service.development.json', root); const config = JSON.parse(await readFile(file, 'utf8')); config.clerkIssuer = 'https://different.clerk.accounts.dev'; await writeFile(file, JSON.stringify(config));
  await assert.rejects(configure(root), /Invalid/); await assert.rejects(readFile(new URL('.env.local', root)), { code: 'ENOENT' });
});
