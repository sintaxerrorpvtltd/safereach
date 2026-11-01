export const REACTIONS = Object.freeze(['hi', 'heart', 'wave', 'tea', 'coffee', 'thanks', 'cheer', 'hug', 'highfive', 'sparkle', 'thinking', 'celebrate']);

export function validateHello(value) {
  if (!value || typeof value !== 'object' || typeof value.from !== 'string' || !/^[\p{L}\p{N} ._'’-]{1,40}$/u.test(value.from)
    || typeof value.avatarKey !== 'string' || !/^[\w-]{1,64}$/.test(value.avatarKey)) throw new Error('Invalid hello.');
  const reaction = value.reaction === undefined ? 'hi' : value.reaction;
  if (!REACTIONS.includes(reaction)) throw new Error('Invalid reaction.');
  const avatar = value.avatar ?? null;
  if (avatar !== null) {
    if (typeof avatar !== 'string' || avatar.length > 90000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar)) throw new Error('Invalid avatar.');
    const bytes = Buffer.from(avatar.split(',')[1], 'base64');
    if (bytes.length < 33 || bytes.length > 65536 || !bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      || bytes.toString('ascii',12,16) !== 'IHDR' || bytes.readUInt32BE(16) > 512 || bytes.readUInt32BE(20) > 512
      || !bytes.readUInt32BE(16) || !bytes.readUInt32BE(20)) throw new Error('Invalid avatar.');
  }
  return { from: value.from, avatarKey: value.avatarKey, avatar, reaction };
}
export function edgeBounds(area) {
  const width = Math.min(280, area.width), height = Math.min(340, area.height);
  return { x: area.x + area.width - width, y: area.y + Math.max(0, area.height - height - 24), width, height };
}

export function packageFileAllowed(path, connected = false) {
  const clean = path.replace(/^[/\\]/, '').replaceAll('\\', '/');
  if (!clean) return true;
  if (connected && (['apps', 'apps/connected', 'apps/connected/dist', 'apps/connected/dist/assets'].includes(clean) || /^apps\/connected\/dist\/(index\.html|runtime-config\.json|assets\/[\w.-]+\.(js|css|svg|png|webp|woff2))$/.test(clean))) return true;
  if (['package.json', 'package-lock.json', 'LICENSE', 'NOTICE', 'desktop', 'web', 'dist', 'dist/src', 'node_modules'].includes(clean)) return true;
  if (clean === 'node_modules/.cache' || clean.startsWith('node_modules/.cache/')) return false;
  if (clean.startsWith('node_modules/')) return true;
  if (/^dist\/src\/[\w-]+\.js$/.test(clean)) return true;
  if (/^desktop\/(main\.mjs|helpers\.mjs|preload\.cjs|overlay-preload\.cjs|connected-entry\.mjs|tray\.png)$/.test(clean)) return true;
  return /^web\/(index\.html|app\.css|app\.js|overlay\.html|overlay\.css|overlay\.js)$/.test(clean);
}

export function connectedOrigins(config) {
  const exact = (raw, pattern) => {
    if (typeof raw !== 'string') throw new Error('Build connected settings first.');
    const value = new URL(raw);
    if (value.origin !== raw || value.protocol !== 'https:' || value.port || !pattern.test(value.hostname)) throw new Error('Unexpected connected service origin.');
    return value.origin;
  };
  const convex = exact(config?.convexUrl, /^[a-z0-9-]+\.convex\.cloud$/);
  const clerk = exact(config?.clerkIssuer, /^[a-z0-9-]+\.clerk\.accounts\.dev$/);
  return [convex, convex.replace('https:', 'wss:'), clerk];
}
