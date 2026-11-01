import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function configure(directory = new URL('./', import.meta.url)) {
  const config = JSON.parse(await readFile(new URL('service.development.json', directory), 'utf8'));
  const convex = new URL(config.convexUrl), clerk = new URL(config.clerkIssuer);
  if (config.environment !== 'development' || !/^pk_test_/.test(config.clerkPublishableKey)
    || convex.protocol !== 'https:' || convex.port || !/^[a-z0-9-]+\.convex\.cloud$/.test(convex.hostname) || convex.origin !== config.convexUrl
    || clerk.protocol !== 'https:' || clerk.port || !/^[a-z0-9-]+\.clerk\.accounts\.dev$/.test(clerk.hostname) || clerk.origin !== config.clerkIssuer
    || Buffer.from(config.clerkPublishableKey.slice(8), 'base64').toString().replace(/\$$/, '') !== clerk.hostname) throw new Error('Invalid public development settings.');
  const target = new URL('.env.local', directory);
  let text = '';
  try { text = await readFile(target, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const values = { VITE_CONVEX_URL: config.convexUrl, VITE_CLERK_PUBLISHABLE_KEY: config.clerkPublishableKey, VITE_CLERK_JWT_ISSUER_DOMAIN: config.clerkIssuer };
  for (const [key, value] of Object.entries(values)) {
    const line = text.split('\n').find(line => line.trim().startsWith(`${key}=`));
    if (line && line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') !== value) throw new Error('Existing account settings differ. Preserved them; use your own configuration or a fresh folder.');
  }
  for (const [key, value] of Object.entries(values)) if (!text.split('\n').some(line => line.trim().startsWith(`${key}=`))) text += `\n${key}=${value}\n`;
  await writeFile(target, text, { mode: 0o600 });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await configure();
  console.log('Configured Poki’s separate DEVELOPMENT service using public client settings. No admin key installed. Use test data; this is not a production service.');
}
