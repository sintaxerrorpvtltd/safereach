import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { z } from 'zod';
import { requireSafe, SafeError } from './model.js';

export async function pokeRequest(action: 'state' | 'preview') {
  const path = process.env.SAFEREACH_POKE_CONFIG;
  requireSafe(path && isAbsolute(path), 'Connect your Poke inbox first; set SAFEREACH_POKE_CONFIG to its private connector file.');
  const file = await lstat(path);
  requireSafe(file.isFile() && file.size <= 4096 && (file.mode & 0o077) === 0, 'Connector settings must be a small private regular file with mode 0600.');
  const config = z.object({ origin: z.url(), token: z.string().regex(/^[\w-]{32}$/), scope: z.array(z.string()).optional() }).strict()
    .parse(JSON.parse(await readFile(path, 'utf8')));
  const url = new URL(config.origin);
  requireSafe(url.origin === config.origin && !url.username && !url.password &&
    (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === '127.0.0.1')), 'Connector requires HTTPS or loopback.');
  try {
    const response = await fetch(`${config.origin}/api/${action}`, { method: action === 'state' ? 'GET' : 'POST', redirect: 'error',
      headers: { Authorization: `Bearer ${config.token}`, Origin: config.origin, 'Content-Type': 'application/json' },
      ...(action === 'preview' ? { body: '{}' } : {}), signal: AbortSignal.timeout(5000) });
    requireSafe(response.ok, 'Poke connection unavailable. Reconnect or check your pairing.');
    return await response.json();
  } catch (error) { if (error instanceof SafeError) throw error; throw new SafeError('Poke relay unavailable. No action was retried.'); }
}
