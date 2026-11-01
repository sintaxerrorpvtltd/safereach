import { cp, mkdir, rm, readFile } from 'node:fs/promises';
const source = new URL('../apps/connected/dist/', import.meta.url);
const target = new URL('../site/app/', import.meta.url);
// Only this generated output directory is replaced; never copy source, env or photos.
await readFile(new URL('index.html', source));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const file of ['index.html', 'assets', 'runtime-config.json']) await cp(new URL(file, source), new URL(file, target), { recursive: true, dereference: false });
console.log('Built the static landing page and connected DEVELOPMENT app.');
