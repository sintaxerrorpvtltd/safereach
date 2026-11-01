import test from 'node:test';
import assert from 'node:assert/strict';
import { connectedContentPolicy, isClerkProtectionUrl } from '../src/connected-policy.js';

test('web and loopback CSP allow Clerk security checks without generic script access', () => {
  const policy = connectedContentPolicy('https://test.clerk.accounts.dev', 'https://test.convex.cloud');
  const directives = new Map(policy.split('; ').map(part => { const [key, ...values] = part.split(' '); return [key, values]; }));
  for (const key of ['script-src', 'frame-src']) {
    assert.ok(directives.get(key)?.includes('https://challenges.cloudflare.com'));
    assert.ok(directives.get(key)?.includes('https://*.protect.clerk.com'));
  }
  assert.ok(directives.get('connect-src')?.includes('https://*.protect.clerk.com:*'));
  assert.deepEqual(directives.get('worker-src'), ["'self'", 'blob:']);
  assert.ok(!directives.get('script-src')?.some(source => ['*', 'https:', "'unsafe-inline'", "'unsafe-eval'"].includes(source)));
  assert.equal(connectedContentPolicy('https://test.clerk.accounts.dev', 'https://test.convex.cloud', true), policy + "; frame-ancestors 'none'");
  assert.throws(() => connectedContentPolicy('https://evil.test/path', 'https://test.convex.cloud'));
});

test('desktop allows only HTTPS Clerk protection hosts, with documented nonstandard protection ports', () => {
  for (const url of ['https://cdn.protect.clerk.com/bootstrap.js', 'https://device.eu.protect.clerk.com:8443/check', 'https://challenges.cloudflare.com/turnstile/v0/api.js']) assert.equal(isClerkProtectionUrl(url), true, url);
  for (const url of ['garbage', 'http://cdn.protect.clerk.com/check', 'wss://cdn.protect.clerk.com', 'https://protect.clerk.com', 'https://evilprotect.clerk.com', 'https://cdn.protect.clerk.com.evil.test', 'https://cdn.protect.clerk.com@evil.test', 'https://user@cdn.protect.clerk.com', 'https://challenges.cloudflare.com:8443/check', 'https://evil.test/?host=cdn.protect.clerk.com']) assert.equal(isClerkProtectionUrl(url), false, url);
});
