import { createInterface } from 'node:readline/promises';
import { z } from 'zod';
import { SafeError, requireSafe } from './model.js';
import { addContact, approve, revoke } from './service.js';
import { defaultDirectory, Store } from './store.js';

// This terminal belongs to the human operator, not the model's tool surface.
async function main() {
  requireSafe(process.stdin.isTTY && process.stdout.isTTY, 'Open an interactive terminal. Piped approval is disabled.');
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const store = new Store(defaultDirectory());
  const ask = async (prompt: string) => (await terminal.question(prompt)).trim();
  try {
    const [command, id] = process.argv.slice(2);
    if (command === 'add-contact') {
      const name = await ask('Trusted person’s name: ');
      const phone = await ask('SMS number including country code (stored locally): ');
      const accepted = await ask('Have you obtained this person’s permission to receive check-ins? Type YES: ');
      requireSafe(accepted === 'YES', 'Obtain recipient permission before adding them.');
      const contactId = await addContact(store, { name, phone, relationship: 'friend', channel: 'sms', canMessage: true,
        recipientAccepted: true, canShareLocation: false, canShareSensitive: false });
      console.log(`Contact added: ${contactId}. Mock mode only.`);
    } else if (command === 'approve') {
      await approve(store, z.string().uuid().parse(id), async (draft, recipient) => {
        console.log(`MOCK CHECK-IN\nTo: ${recipient.name} (${recipient.phone})\nMessage: ${draft.message}\nNo location or situation summary. Expires: ${new Date(draft.expiresAt).toISOString()}`);
        return await ask('Approve this exact simulated message? Type APPROVE: ') === 'APPROVE';
      });
      console.log('Approved for one simulation. No message sent.');
    } else if (command === 'revoke') {
      await revoke(store, z.string().uuid().parse(id)); console.log('Contact permission revoked.');
    } else if (command === 'audit') {
      console.log(await store.transaction(async state => JSON.stringify(state.audit, null, 2)));
    } else throw new SafeError('Use add-contact, approve <handoff-id>, revoke <contact-id>, or audit.');
  } finally { terminal.close(); }
}
main().catch(error => { console.error(error instanceof SafeError ? error.message : 'Operator action failed. Check local inputs, permissions or lock.'); process.exitCode = 1; });
