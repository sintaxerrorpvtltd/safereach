import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readFile } from 'node:fs/promises';
import { validateHello, edgeBounds, packageFileAllowed, connectedOrigins, REACTIONS } from './helpers.mjs';
test('desktop hello only accepts bounded names, avatar keys and small PNGs', async () => {
  const value = { from: 'Test Friend', avatarKey: 'test-friend', avatar: null };
  assert.deepEqual(validateHello(value), { ...value, reaction: 'hi' });
  for (const bad of [null, {}, { ...value, from: '<script>' }, { ...value, from: 'x'.repeat(41) }, { ...value, avatarKey: '../profile' }, { ...value, avatar: 'data:image/svg+xml;base64,AA==' }, { ...value, avatar: 'data:image/png;base64,' + 'A'.repeat(90001) }]) assert.throws(() => validateHello(bad));
  const png = await readFile(new URL('./tray.png', import.meta.url));
  assert.equal(validateHello({ ...value, avatar: `data:image/png;base64,${png.toString('base64')}` }).from, value.from);
  const large = Buffer.from(png); large.writeUInt32BE(513,16);
  assert.throws(() => validateHello({ ...value, avatar: `data:image/png;base64,${large.toString('base64')}` }));
});
test('desktop edge popup stays inside normal, negative-origin and small work areas', () => {
  for (const area of [{ x: 0, y: 0, width: 1440, height: 860 }, { x: -1600, y: 50, width: 1600, height: 900 }, { x: 0, y: 0, width: 200, height: 200 }]) {
    const bounds = edgeBounds(area);
    assert.ok(bounds.x >= area.x && bounds.y >= area.y);
    assert.ok(bounds.x + bounds.width <= area.x + area.width && bounds.y + bounds.height <= area.y + area.height);
  }
});

test('desktop package only includes runtime assets and dependencies', () => {
  for (const file of ['', '/desktop/main.mjs', '/web/overlay.html', '/dist/src/poke-server.js', '/node_modules/zod/index.js']) assert.equal(packageFileAllowed(file), true, file);
  for (const file of ['/output/private.png', '/.env', '/profile.private.json', '/desktop/secrets.json', '/desktop/helpers.test.mjs', '/dist/test/poke.test.js', '/web/photo.png', '/src/poke.ts', '/registry/india.json']) assert.equal(packageFileAllowed(file), false, file);
});

test('connected desktop only permits exact HTTPS Convex and Clerk development origins', () => {
  const config = { convexUrl: 'https://test-example-123.convex.cloud', clerkIssuer: 'https://test-example-123.clerk.accounts.dev' };
  assert.deepEqual(connectedOrigins(config), [config.convexUrl, 'wss://test-example-123.convex.cloud', config.clerkIssuer]);
  for (const convexUrl of ['http://test.convex.cloud', 'https://test.convex.cloud.evil.test', 'https://evil.test', 'https://test.convex.cloud/path', 'https://test.convex.cloud:444', 'https://name:secret@test.convex.cloud']) assert.throws(() => connectedOrigins({ ...config, convexUrl }));
  assert.throws(() => connectedOrigins({ ...config, clerkIssuer: 'https://evil.test' }));
  assert.throws(() => connectedOrigins(null));
  assert.equal(packageFileAllowed('/apps/connected/dist/runtime-config.json'), false);
  assert.equal(packageFileAllowed('/apps/connected/dist/runtime-config.json', true), true);
  assert.equal(packageFileAllowed('/apps/connected/dist/assets/index-safe.js', true), true);
  assert.equal(packageFileAllowed('/apps/connected/.env.local', true), false);
  assert.equal(packageFileAllowed('/apps/connected/convex/social.ts', true), false);
});

test('all twelve free desktop reactions validate and render fixed labels without arbitrary text', async () => {
  const value = { from: 'Test Friend', avatarKey: 'test-friend', avatar: null };
  assert.equal(REACTIONS.length, 12); assert.equal(new Set(REACTIONS).size, 12);
  for (const reaction of REACTIONS) assert.equal(validateHello({ ...value, reaction }).reaction, reaction);
  for (const reaction of ['__proto__', 'custom', '<script>', '', null, 42, {}]) assert.throws(() => validateHello({ ...value, reaction }));
  const elements = new Map(); let receive;
  const document = { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { textContent: '', hidden: false, offsetWidth: 1, classList: { remove() {}, add() {} }, addEventListener() {}, removeAttribute() {} });
    return elements.get(id);
  } };
  runInNewContext(await readFile(new URL('../web/overlay.js', import.meta.url), 'utf8'), { document, window: { pokiOverlay: { onHello(callback) { receive = callback; } } } });
  const labels = [];
  for (const reaction of REACTIONS) {
    receive(validateHello({ ...value, reaction }));
    assert.equal(elements.get('caption').textContent, 'Test Friend');
    assert.ok(elements.get('reaction-icon').textContent.length > 0);
    labels.push(elements.get('reaction-label').textContent);
  }
  assert.deepEqual(labels, ['Hi!', 'A little love', 'A wave', 'Tea?', 'Coffee?', 'Thank you', 'Cheering you on', 'A hug', 'High five!', 'A little sparkle', 'Thinking of you', 'Celebrate!']);
  receive(value); assert.equal(elements.get('reaction-label').textContent, 'Hi!');
  receive({ ...value, reaction: '__proto__' }); assert.equal(elements.get('reaction-label').textContent, 'Hi!');
  const css = await readFile(new URL('../web/overlay.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion/); assert.match(css, /object-fit:contain/);
  assert.doesNotMatch(css, /animation[^;{}]*\binfinite\b/);
});
