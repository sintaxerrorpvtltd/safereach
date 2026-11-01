import { randomUUID } from 'node:crypto';
import { messages, contactSchema, requireSafe, type Contact, type Draft, type State, type Template } from './model.js';
import { MockSmsProvider, type SmsProvider } from './provider.js';
import { Store } from './store.js';

export function audit(state: State, at: number, event: State['audit'][number]['event'], contactId: string, actionId?: string) {
  state.audit.push({ at, event, contactId, ...(actionId ? { actionId } : {}) });
  const retained = state.audit.filter(row => row.at > at - 30 * 86400000);
  // Keep rate-limit evidence even if preview churn fills the bounded audit log.
  const keep = new Set([...retained.filter(row => row.event !== 'attempted').slice(-990),
    ...retained.filter(row => row.event === 'attempted').slice(-10)]);
  state.audit = retained.filter(row => keep.has(row));
}
function contact(state: State, id: string) {
  const found = state.contacts.find(row => row.id === id);
  requireSafe(found?.canMessage && found.recipientAccepted, 'Contact is unavailable or permission was revoked.');
  return found;
}
function current(state: State, id: string, now: number): Draft {
  const found = state.drafts.find(row => row.id === id);
  requireSafe(found && found.expiresAt > now, 'Preview is missing or expired. Prepare another.');
  contact(state, found.contactId);
  return found;
}
export class SafeReach {
  constructor(readonly store: Store, readonly provider: SmsProvider = new MockSmsProvider(), readonly now = Date.now) {
    requireSafe(provider.mode === 'mock', 'Live providers are disabled in this MVP.');
  }
  async listContacts() {
    return this.store.transaction(async state => state.contacts.filter(c => c.canMessage && c.recipientAccepted)
      .map(({ id, name, relationship }) => ({ id, name, relationship, channel: 'sms', sharing: 'check-in only' })));
  }
  async prepare(contactId: string, template: Template = 'check_in') {
    return this.store.transaction(async (state, save) => {
      const recipient = contact(state, contactId);
      const now = this.now();
      state.drafts = state.drafts.filter(d => d.expiresAt > now);
      requireSafe(state.drafts.length < 100, 'Too many previews. Wait for them to expire.');
      const draft: Draft = { id: randomUUID(), contactId, message: messages[template], expiresAt: now + 5 * 60000, status: 'pending' };
      state.drafts.push(draft);
      audit(state, now, 'prepared', contactId, draft.id);
      await save();
      return { ...draft, recipient: recipient.name, mode: 'mock', shares: ['plain check-in'], needsLocalApproval: true };
    });
  }
  async cancel(id: string) {
    return this.store.transaction(async (state, save) => {
      const draft = current(state, id, this.now());
      requireSafe(['pending', 'approved'].includes(draft.status), 'Action cannot be cancelled.');
      draft.status = 'cancelled';
      audit(state, this.now(), 'cancelled', draft.contactId, id);
      await save();
      return { status: 'cancelled' };
    });
  }
  async send(id: string) {
    return this.store.transaction(async (state, save) => {
      const now = this.now();
      const draft = current(state, id, now);
      requireSafe(draft.status === 'approved', 'Approve the exact preview in the local operator terminal first.');
      requireSafe(state.audit.filter(e => e.event === 'attempted' && e.at > now - 86400000).length < 3, 'Daily limit reached.');
      const recipient = contact(state, draft.contactId);
      draft.status = 'attempted';
      audit(state, now, 'attempted', recipient.id, id);
      await save(); // Consume consent before provider I/O; ambiguous attempts must not be retried.
      try {
        const result = await this.provider.send({ phone: recipient.phone, message: draft.message, idempotencyKey: id });
        requireSafe(result.status === 'simulated', 'Unexpected provider result.');
        draft.status = 'simulated';
        audit(state, now, 'simulated', recipient.id, id);
        await save();
        return { status: 'simulated', realMessageSent: false };
      } catch {
        draft.status = 'failed';
        audit(state, now, 'failed', recipient.id, id);
        await save();
        return { status: 'failed', realMessageSent: false, retry: 'Prepare and approve a new preview.' };
      }
    });
  }
}

// Operator-only functions: never registered as MCP tools. OS user is the trust boundary.
export async function addContact(store: Store, input: Omit<Contact, 'id'>) {
  const value = contactSchema.parse({ ...input, id: randomUUID() });
  return store.transaction(async (state, save) => {
    requireSafe(state.contacts.length < 5 && !state.contacts.some(c => c.phone === value.phone), 'Contact limit or duplicate.');
    state.contacts.push(value);
    audit(state, Date.now(), 'contact_added', value.id);
    await save();
    return value.id;
  });
}
export async function approve(store: Store, id: string, confirm: (draft: Draft, recipient: Contact) => Promise<boolean>, now = Date.now) {
  return store.transaction(async (state, save) => {
    const draft = current(state, id, now());
    requireSafe(draft.status === 'pending', 'Only pending previews can be approved.');
    requireSafe(await confirm(draft, contact(state, draft.contactId)), 'Approval declined.');
    requireSafe(draft.expiresAt > now(), 'Preview expired while awaiting approval.');
    draft.status = 'approved';
    audit(state, now(), 'approved', draft.contactId, id);
    await save();
  });
}
export async function revoke(store: Store, id: string) {
  return store.transaction(async (state, save) => {
    const recipient = state.contacts.find(c => c.id === id);
    requireSafe(recipient, 'Unknown contact.');
    recipient.canMessage = false;
    for (const d of state.drafts.filter(d => d.contactId === id && ['pending', 'approved'].includes(d.status))) d.status = 'cancelled';
    audit(state, Date.now(), 'contact_revoked', id);
    await save();
  });
}
