import { packager } from '@electron/packager';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageFileAllowed, connectedOrigins } from './helpers.mjs';
const platform = process.argv[2] ?? process.platform;
if (!['darwin', 'win32'].includes(platform)) throw new Error('Choose darwin or win32.');
const connected = process.argv.includes('--connected');
if (connected) connectedOrigins(JSON.parse(await readFile(new URL('../apps/connected/dist/runtime-config.json', import.meta.url), 'utf8')));
const paths = await packager({
  dir: '.', name: 'Poki', platform, arch: platform === 'win32' ? 'x64' : process.arch,
  download: { cacheRoot: fileURLToPath(new URL('../node_modules/.cache/electron/', import.meta.url)), checksums: JSON.parse(await readFile(new URL('../node_modules/electron/checksums.json', import.meta.url), 'utf8')) },
  out: connected ? 'output/desktop-connected' : 'output/desktop', appBundleId: 'com.sintaxerror.poki', appCategoryType: 'public.app-category.social-networking',
  asar: false, prune: true, derefSymlinks: false, overwrite: true,
  ignore: path => !packageFileAllowed(path, connected),
  afterCopy: connected ? [async ({ buildPath }) => {
    const path = join(buildPath, 'package.json'); const metadata = JSON.parse(await readFile(path, 'utf8'));
    metadata.main = 'desktop/connected-entry.mjs'; await writeFile(path, JSON.stringify(metadata));
  }] : []
});
console.log(paths.join('\n'));
