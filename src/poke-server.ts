import { createServer, type IncomingMessage } from 'node:http';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { SafeError, requireSafe } from './model.js';
import { PokeRelay } from './poke.js';
import { connectedContentPolicy } from './connected-policy.js';

const name = z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N} .'-]+$/u);
async function body(request: IncomingMessage, limit = 2048) {
  requireSafe(request.headers['content-type'] === 'application/json', 'Use JSON requests.');
  let text = '';
  for await (const data of request) { text += data.toString('utf8'); requireSafe(Buffer.byteLength(text) <= limit, 'Request is too large.'); }
  return JSON.parse(text || '{}') as unknown;
}

export async function startPokeServer(options: { port?: number; host?: string; publicOrigin?: string; behindTlsProxy?: boolean; relay?: PokeRelay; connected?: { convexUrl: string; clerkIssuer: string } } = {}) {
  const relay = options.relay ?? new PokeRelay();
  const host = options.host ?? '127.0.0.1';
  requireSafe(host === '127.0.0.1' || (options.behindTlsProxy && options.publicOrigin?.startsWith('https://')),
    'Remote binding requires an explicit HTTPS origin and a trusted TLS reverse proxy.');
  let origin = options.publicOrigin ?? '';
  if (origin) { const url = new URL(origin); requireSafe(url.origin === origin && !url.username && !url.password, 'Use a bare public origin.'); }
  const assets = new Map(await Promise.all(['index.html', 'app.css', 'app.js', 'overlay.html', 'overlay.css', 'overlay.js'].map(async file =>
    [file, await readFile(new URL(`../../web/${file}`, import.meta.url))] as const)));
  const connectedAssets = new Map<string, Buffer>();
  let connectedPolicy = '';
  if (options.connected) {
    const { convexUrl, clerkIssuer } = options.connected;
    const convex = new URL(convexUrl), clerk = new URL(clerkIssuer);
    requireSafe(convex.origin === convexUrl && convex.protocol === 'https:' && !convex.port && convex.hostname.endsWith('.convex.cloud') && !convex.username && !convex.password, 'Use a Convex HTTPS client origin.');
    requireSafe(clerk.origin === clerkIssuer && clerk.protocol === 'https:' && !clerk.port && clerk.hostname.endsWith('.clerk.accounts.dev') && !clerk.username && !clerk.password, 'Use the separate Clerk development issuer.');
    const root = new URL('../../apps/connected/dist/', import.meta.url);
    for (const file of ['index.html', 'runtime-config.json']) {
      requireSafe((await lstat(new URL(file, root))).isFile(), 'Connected build missing.');
      connectedAssets.set(`/connected/${file}`, await readFile(new URL(file, root)));
    }
    const names = await readdir(new URL('assets/', root));
    requireSafe(names.length <= 100, 'Connected build is too large.');
    for (const file of names) {
      requireSafe(/^[\w.-]+\.(js|css|svg|woff2|png|webp)$/.test(file), 'Unexpected connected asset.');
      const target = new URL(`assets/${file}`, root), stat = await lstat(target);
      requireSafe(stat.isFile() && stat.size <= 5000000, 'Unsafe connected asset.');
      connectedAssets.set(`/connected/assets/${file}`, await readFile(target));
    }
    connectedPolicy = connectedContentPolicy(clerkIssuer, convexUrl, true);
  }
  const rates = new Map<string, { at: number; count: number }>();
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      requireSafe(request.headers.host === new URL(origin).host, 'Unknown host.');
      requireSafe(!request.headers.origin || request.headers.origin === origin, 'Origin not allowed.');
      const key = request.socket.remoteAddress ?? 'unknown';
      const now = Date.now();
      for (const [ip, rate] of rates) if (now - rate.at >= 60000) rates.delete(ip);
      requireSafe(rates.size < 1000 || rates.has(key), 'Relay busy.');
      const rate = rates.get(key) ?? { at: now, count: 0 }; rate.count++; rates.set(key, rate);
      requireSafe(rate.count <= 240, 'Too many requests. Wait a minute.');
      const path = new URL(request.url ?? '/', origin).pathname;
      if (request.method === 'GET' && path.startsWith('/connected/')) {
        const asset = connectedAssets.get(path === '/connected/' ? '/connected/index.html' : path);
        requireSafe(asset, 'Connected build unavailable. Run its setup first.');
        response.setHeader('Content-Security-Policy', connectedPolicy);
        const extension = path.split('.').at(-1);
        response.setHeader('Content-Type', path.endsWith('/') || extension === 'html' ? 'text/html; charset=utf-8' : extension === 'js' ? 'text/javascript' : extension === 'css' ? 'text/css' : extension === 'json' ? 'application/json' : extension === 'svg' ? 'image/svg+xml' : extension === 'woff2' ? 'font/woff2' : `image/${extension}`);
        response.end(asset); return;
      }
      if (request.method === 'GET' && ['/', '/app.css', '/app.js', '/overlay.html', '/overlay.css', '/overlay.js'].includes(path)) {
        response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : path.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8');
        response.end(assets.get(path === '/' ? 'index.html' : path.slice(1))); return;
      }
      response.setHeader('Content-Type', 'application/json');
      requireSafe(path.startsWith('/api/') && ['GET', 'POST'].includes(request.method ?? ''), 'Unknown route.');
      let result: unknown;
      if (request.method === 'POST') requireSafe(request.headers.origin === origin, 'Explicit same-origin request required.');
      if (path === '/api/session' && request.method === 'POST') {
        const input = z.object({ name }).strict().parse(await body(request)); result = relay.register(input.name);
      } else {
        const token = (request.headers.authorization ?? '').replace(/^Bearer /, '');
        const browserOnly = !['/api/state', '/api/preview'].includes(path);
        const person = relay.authenticate(token, browserOnly);
        if (path === '/api/state' && request.method === 'GET') result = relay.state(person, token === person.browserToken);
        else {
          requireSafe(request.method === 'POST', 'Use POST for this action.');
          const input = await body(request, path === '/api/avatar' ? 100000 : 2048);
          if (path === '/api/avatar') {
            const value = z.object({ avatar: z.string().max(90000).nullable(), agree: z.literal(true) }).strict().parse(input);
            if (value.avatar !== null) {
              requireSafe(/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.avatar), 'Use a PNG avatar.');
              const bytes = Buffer.from(value.avatar.split(',')[1]!, 'base64');
              requireSafe(bytes.length >= 33 && bytes.length <= 65536 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii', 12, 16) === 'IHDR', 'Use a small PNG avatar.');
              requireSafe(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(16) <= 256 && bytes.readUInt32BE(20) > 0 && bytes.readUInt32BE(20) <= 256, 'Avatar dimensions must be at most 256 pixels.');
            }
            result = relay.setAvatar(person, value.avatar);
          } else if (path === '/api/join') {
            const value = z.object({ invitation: z.string().regex(/^[\w-]{32}$/), agree: z.literal(true) }).strict().parse(input);
            result = relay.join(person, value.invitation);
          } else if (path === '/api/accept') result = relay.accept(person, z.object({ id: z.string().uuid() }).strict().parse(input).id);
          else if (path === '/api/mute') {
            person.muted = z.object({ muted: z.boolean() }).strict().parse(input).muted; result = { muted: person.muted };
          } else if (path === '/api/approve') result = relay.send(person, z.object({ id: z.string().uuid() }).strict().parse(input).id);
          else if (path === '/api/cancel-preview') {
            const { id } = z.object({ id: z.string().uuid() }).strict().parse(input);
            person.previews = person.previews.filter(preview => preview.id !== id); result = { status: 'cancelled' };
          }
          else {
            z.object({}).strict().parse(input);
            if (path === '/api/invite') result = relay.invite(person);
            else if (path === '/api/disconnect') result = relay.disconnect(person);
            else if (path === '/api/poke') result = relay.send(person);
            else if (path === '/api/preview') result = relay.prepare(person);
            else if (path === '/api/connector') result = { ...relay.connector(person), origin };
            else throw new SafeError('Unknown route.');
          }
        }
      }
      response.end(JSON.stringify(result));
    } catch (error) {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ error: error instanceof SafeError ? error.message : 'Request unavailable. Check your input or reconnect.' }));
    }
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000; server.maxConnections = 100;
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(options.port ?? 4317, host, () => resolve()); });
  if (!origin) { const address = server.address(); requireSafe(address && typeof address !== 'string', 'No server address.'); origin = `http://127.0.0.1:${address.port}`; }
  return { server, origin, relay };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = z.coerce.number().int().min(1024).max(65535).parse(process.env.SAFEREACH_POKE_PORT ?? 4317);
  startPokeServer({ port, host: process.env.SAFEREACH_POKE_HOST, publicOrigin: process.env.SAFEREACH_POKE_ORIGIN,
    behindTlsProxy: process.env.SAFEREACH_POKE_BEHIND_TLS_PROXY === '1' })
    .then(({ origin }) => console.log(`SafeReach Poke local prototype: ${origin}\nRemote friend delivery and automatic Codex chat insertion are not configured.`))
    .catch(() => { console.error('Poke inbox could not start. Check port and secure origin configuration.'); process.exitCode = 1; });
}
