import { z } from 'zod';

export const contactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N} .'-]+$/u),
  relationship: z.enum(['friend', 'family', 'other']),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  channel: z.literal('sms'),
  canMessage: z.boolean(),
  recipientAccepted: z.boolean(),
  canShareLocation: z.literal(false),
  canShareSensitive: z.literal(false)
}).strict();
export type Contact = z.infer<typeof contactSchema>;

export const CHECK_IN = 'Hey, can you check in on me?';
export const messages = { check_in: CHECK_IN, hi: 'Hi!', tea: 'Hey, want to come downstairs for tea?' } as const;
export type Template = keyof typeof messages;
export const draftSchema = z.object({
  id: z.string().uuid(), contactId: z.string().uuid(),
  message: z.enum([messages.check_in, messages.hi, messages.tea]), expiresAt: z.number().int(),
  status: z.enum(['pending', 'approved', 'cancelled', 'attempted', 'simulated', 'failed'])
}).strict();
export type Draft = z.infer<typeof draftSchema>;

export const auditSchema = z.object({
  at: z.number().int(),
  event: z.enum(['contact_added', 'contact_revoked', 'prepared', 'approved', 'cancelled', 'attempted', 'simulated', 'failed']),
  contactId: z.string().uuid(), actionId: z.string().uuid().optional()
}).strict();
export const stateSchema = z.object({
  version: z.literal(1), contacts: z.array(contactSchema).max(5),
  drafts: z.array(draftSchema).max(100), audit: z.array(auditSchema).max(1000)
}).strict();
export type State = z.infer<typeof stateSchema>;
export const emptyState = (): State => ({ version: 1, contacts: [], drafts: [], audit: [] });

export class SafeError extends Error {}
export function requireSafe(ok: unknown, message: string): asserts ok {
  if (!ok) throw new SafeError(message);
}
