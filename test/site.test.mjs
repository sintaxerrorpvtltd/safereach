import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { test } from 'node:test';
import { PokiDemo, nearestStoryBeat } from '../site/demo-state.mjs';

const paired = () => { const demo = new PokiDemo(); demo.pair('alex'); demo.pair('sam'); return demo; };
test('Poki requires two explicit fictional acceptances; preparation alone has no event', () => {
  const demo = new PokiDemo();
  assert.throws(() => demo.prepare('alex'), /both/);
  demo.pair('alex'); assert.throws(() => demo.prepare('alex'), /both/);
  demo.pair('sam'); const preview = demo.prepare('alex', 1000);
  assert.deepEqual([preview.sender, preview.recipient, preview.text, preview.expiresAt], ['alex', 'sam', 'Hi!', 61000]);
  assert.equal(demo.events.length, 0);
  assert.throws(() => demo.pair('real-contact-id'), /fictional/);
  assert.throws(() => demo.prepare('__proto__'), /fictional/);
});
test('Poki binds exact preview, expires it, and consumes approval once', () => {
  const demo = paired(); const old = demo.prepare('alex', 1000); const current = demo.prepare('sam', 1000);
  assert.throws(() => demo.approve(old.id, 1001), /no longer/);
  assert.deepEqual(demo.approve(current.id, 1001), { id: current.id, sender: 'sam', recipient: 'alex', text: 'Hi!' });
  assert.throws(() => demo.approve(current.id, 1002), /no longer/);
  const expired = demo.prepare('alex', 2000);
  assert.throws(() => demo.approve(expired.id, 62000), /expired/);
  assert.equal(demo.pending, null);
});
test('Poki decline, DND, either-side block and reset revoke pending previews', () => {
  const demo = paired(); const declined = demo.prepare('alex'); demo.decline();
  assert.throws(() => demo.approve(declined.id), /no longer/);
  const muted = demo.prepare('alex'); demo.setPreference('muted', 'sam', true);
  assert.throws(() => demo.approve(muted.id), /no longer/);
  assert.throws(() => demo.prepare('alex'), /Do Not Disturb/);
  demo.setPreference('muted', 'sam', false);
  for (const id of ['alex', 'sam']) {
    const blocked = demo.prepare('alex'); demo.setPreference('blocked', id, true);
    assert.throws(() => demo.prepare('sam'), /blocked/);
    demo.setPreference('blocked', id, false);
    assert.throws(() => demo.approve(blocked.id), /no longer/);
  }
  const reset = demo.prepare('alex'); demo.reset();
  assert.equal(demo.paired(), false); assert.equal(demo.events.length, 0);
  demo.pair('alex'); demo.pair('sam'); const next = demo.prepare('sam');
  assert.notEqual(next.id, reset.id); assert.throws(() => demo.approve(reset.id), /no longer/);
});
test('Poki history is bounded and refresh-equivalent construction carries no state', () => {
  const demo = paired();
  for (let i = 0; i < 15; i++) { const preview = demo.prepare(i % 2 ? 'alex' : 'sam'); demo.approve(preview.id); }
  assert.equal(demo.events.length, 6);
  const fresh = new PokiDemo(); assert.equal(fresh.events.length, 0); assert.equal(fresh.paired(), false);
  assert.throws(() => demo.setPreference('unknown', 'alex', true));
});
test('Pages artifact is a static allowlist with local assets and no visitor-data API', async () => {
  const root = new URL('../site/', import.meta.url);
  const files = (await readdir(root)).sort();
  assert.deepEqual(files, ['.nojekyll', 'assets', 'demo-state.mjs', 'index.html', 'poki.mjs', 'styles.css']);
  assert.deepEqual(await readdir(new URL('assets/', root)), ['poki.svg']);
  for (const file of files) assert.equal((await lstat(new URL(file, root))).isSymbolicLink(), false);
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /Poki — by Sintax Error/); assert.match(html, /connect-src 'none'/);
  assert.match(html, /Some1 stays a separate commercial product/);
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), `Missing section ${id}`);
  for (const asset of [...html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)].map(match => match[1])) await lstat(new URL(asset, root));
  const client = await readFile(new URL('poki.mjs', root), 'utf8');
  assert.doesNotMatch(client, /\b(?:fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|sendBeacon)\b|document\.cookie|innerHTML/);
  const css = await readFile(new URL('styles.css', root), 'utf8');
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /animation[^;{}]*\binfinite\b/);
});

test('story follows the closest reading beat in both scroll directions', () => {
  assert.equal(nearestStoryBeat([360, 700, 1040, 1380], 900), 0);
  assert.equal(nearestStoryBeat([-320, 20, 360, 700], 900), 2);
  assert.equal(nearestStoryBeat([-660, -320, 20, 360], 900), 3);
  assert.equal(nearestStoryBeat([20, 360, 700, 1040], 900), 1);
});
test('hero offers the documented safe setup and local app requires a preview', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  const prompt = html.split('spellcheck="false">')[1].split('</textarea>')[0];
  const guide = await readFile(new URL('../docs/INSTALL.md', import.meta.url), 'utf8');
  assert.ok(guide.includes(prompt));
  assert.match(prompt, /new isolated folder/);
  assert.match(prompt, /npm ci --ignore-scripts/);
  assert.match(prompt, /remote friends and automatic Codex popups are not enabled/);
  const client = await readFile(new URL('../web/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(client, /api\('poke'/);
  assert.match(client, /api\('preview', \{\}\)/);
});
