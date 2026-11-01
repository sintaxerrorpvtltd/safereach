import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const install = fileURLToPath(new URL('../node_modules/electron/install.js', import.meta.url));
const result = spawnSync(process.execPath, [install], {
  stdio: 'inherit', timeout: 180000, env: { ...process.env, electron_config_cache: fileURLToPath(new URL('../node_modules/.cache/electron', import.meta.url)) }
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
