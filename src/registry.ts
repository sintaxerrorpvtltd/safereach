import { readFile } from 'node:fs/promises';
import { z } from 'zod';

export const resourceSchema = z.object({
  id: z.string().min(1).max(100), name: z.string().min(1).max(120), country: z.literal('IN'),
  category: z.enum(['official_emergency', 'community_support', 'hospital']),
  phone: z.string().regex(/^(?:112|\+[1-9]\d{7,14})$/),
  scope: z.enum(['national', 'local']), city: z.string().min(1).max(100).optional(),
  verification: z.enum(['A', 'B', 'C', 'D']), sources: z.array(z.url().startsWith('https://')).min(1).max(5),
  verifiedAt: z.iso.datetime(), expiresAt: z.iso.datetime(),
  verificationMethod: z.string().min(1).max(150), reviewers: z.array(z.string().min(1)).min(1),
  hours: z.enum(['unknown', '24/7'])
}).strict().refine(r => Date.parse(r.verifiedAt) < Date.parse(r.expiresAt), 'Invalid verification period');
export type Resource = z.infer<typeof resourceSchema>;
export async function loadRegistry(): Promise<Resource[]> {
  return z.array(resourceSchema).parse(JSON.parse(await readFile(new URL('../../registry/IN/national.json', import.meta.url), 'utf8')));
}
export function findResources(resources: Resource[], query: { category?: Resource['category']; city?: string; exploratory?: boolean }, now = Date.now()) {
  return resources.filter(r => (!query.category || r.category === query.category)
    && (r.scope === 'national' || (query.city && r.city?.toLowerCase() === query.city.toLowerCase())))
    .map(r => ({ ...r, stale: Date.parse(r.expiresAt) <= now || Date.parse(r.verifiedAt) > now }))
    .filter(r => query.exploratory || (!r.stale && ['A', 'B'].includes(r.verification)))
    .sort((a, b) => Number(a.stale) - Number(b.stale) || a.verification.localeCompare(b.verification))
    .map(r => ({ ...r, recommended: !r.stale && ['A', 'B'].includes(r.verification),
      warning: r.stale || ['C', 'D'].includes(r.verification) ? 'Exploratory only; verify independently.' : 'Source verification is not a guarantee of availability.',
      distance: null }));
}
