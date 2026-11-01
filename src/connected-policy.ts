// Clerk requires these security resources even when an email-code test succeeds.
// https://clerk.com/docs/guides/secure/best-practices/csp-headers
export function connectedContentPolicy(clerk: string, convex: string, frameAncestors = false) {
  for (const origin of [clerk, convex]) {
    const url = new URL(origin);
    if (url.origin !== origin || url.protocol !== 'https:') throw new Error('Use exact HTTPS service origins.');
  }
  return `default-src 'self'; script-src 'self' ${clerk} https://challenges.cloudflare.com https://*.protect.clerk.com; style-src 'self' 'unsafe-inline'; connect-src 'self' ${clerk} ${convex} ${convex.replace('https:', 'wss:')} https://*.protect.clerk.com:*; img-src 'self' data: https://img.clerk.com; font-src 'self' data:; worker-src 'self' blob:; frame-src ${clerk} https://challenges.cloudflare.com https://*.protect.clerk.com; base-uri 'none'; object-src 'none'; form-action 'self' ${clerk}${frameAncestors ? "; frame-ancestors 'none'" : ''}`;
}

export function isClerkProtectionUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password &&
      ((url.hostname === 'challenges.cloudflare.com' && !url.port) ||
       /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.protect\.clerk\.com$/.test(url.hostname));
  } catch { return false; }
}
