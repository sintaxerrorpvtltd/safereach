import { createServer, type IncomingMessage } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { SafeError, requireSafe } from './model.js';
import { PokeRelay } from './poke.js';

const name = z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N} .'-]+$/u);
async function body(request: IncomingMessage) {
  requireSafe(request.headers['content-type'] === 'application/json', 'Use JSON requests.');
  let text = '';
  for await (const data of request) { text += data.toString('utf8'); requireSafe(Buffer.byteLength(text) <= 2048, 'Request is too large.'); }
  return JSON.parse(text || '{}') as unknown;
}

export async function startPokeServer(options: { port?: number; host?: string; publicOrigin?: string; behindTlsProxy?: boolean; relay?: PokeRelay } = {}) {
  const relay = options.relay ?? new PokeRelay();
  const host = options.host ?? '127.0.0.1';
  requireSafe(host === '127.0.0.1' || (options.behindTlsProxy && options.publicOrigin?.startsWith('https://')),
    'Remote binding requires an explicit HTTPS origin and a trusted TLS reverse proxy.');
  let origin = options.publicOrigin ?? '';
  if (origin) { const url = new URL(origin); requireSafe(url.origin === origin && !url.username && !url.password, 'Use a bare public origin.'); }
  const assets = new Map(await Promise.all(['index.html', 'app.css', 'app.js'].map(async file =>
    [file, await readFile(new URL(`../../web/${file}`, import.meta.url))] as const)));
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
      if (request.method === 'GET' && ['/', '/app.css', '/app.js'].includes(path)) {
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
          const input = await body(request);
          if (path === '/api/join') {
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
