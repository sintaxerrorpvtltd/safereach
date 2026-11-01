import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { emptyState, requireSafe, stateSchema, type State } from './model.js';

export const defaultDirectory = () => process.env.SAFEREACH_HOME ?? join(homedir(), '.local', 'share', 'safereach');

// Local single-user vault. The key sits beside ciphertext; OS account isolation is required.
export class Store {
  constructor(readonly directory: string) { requireSafe(isAbsolute(directory), 'Use an absolute private data directory.'); }

  async transaction<T>(run: (state: State, save: () => Promise<void>) => Promise<T>): Promise<T> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    requireSafe((await lstat(this.directory)).isDirectory(), 'Private directory must not be a symlink.');
    await chmod(this.directory, 0o700);
    const lock = join(this.directory, 'lock');
    // Fail closed on a competing process or a crash; never guess whether a lock is stale.
    await mkdir(lock, { mode: 0o700 });
    try {
      const keyPath = join(this.directory, 'vault.key');
      const file = join(this.directory, 'vault.enc');
      let key: Buffer;
      try { key = await readFile(keyPath); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        try { await lstat(file); throw new Error('Vault key is missing.'); }
        catch (missing) { if ((missing as NodeJS.ErrnoException).code !== 'ENOENT') throw missing; }
        key = randomBytes(32);
        await writeFile(keyPath, key, { flag: 'wx', mode: 0o600 });
      }
      requireSafe(key.length === 32 && (await lstat(keyPath)).isFile(), 'Invalid vault key.');
      await chmod(keyPath, 0o600);
      let state = emptyState();
      try {
        requireSafe((await lstat(file)).isFile(), 'Invalid vault file.');
        const encrypted = await readFile(file);
        const decipher = createDecipheriv('aes-256-gcm', key, encrypted.subarray(0, 12));
        decipher.setAuthTag(encrypted.subarray(12, 28));
        state = stateSchema.parse(JSON.parse(Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]).toString('utf8')));
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      const save = async () => {
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        const body = Buffer.concat([cipher.update(JSON.stringify(stateSchema.parse(state))), cipher.final()]);
        const temp = join(this.directory, `${randomUUID()}.enc`);
        try {
          await writeFile(temp, Buffer.concat([iv, cipher.getAuthTag(), body]), { mode: 0o600, flag: 'wx' });
          await rename(temp, file);
        } finally { await rm(temp, { force: true }); }
      };
      return await run(state, save);
    } finally { await rm(lock, { recursive: true }); }
  }
}
