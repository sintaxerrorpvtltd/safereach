import { v, ConvexError } from 'convex/values';
import { query, mutation, internalMutation, type QueryCtx, type MutationCtx } from './_generated/server';
import { components, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { Presence } from '@convex-dev/presence';
import { availability, reaction } from './schema';
import { REACTIONS } from './reactions';
const presence = new Presence(components.presence);
const profileView = v.object({ id: v.id('profiles'), username: v.string(), name: v.string() });
const view = (p: Doc<'profiles'>) => ({ id: p._id, username: p.username, name: p.name });
type Ctx = QueryCtx | MutationCtx;
async function identity(ctx: Ctx) { const user = await ctx.auth.getUserIdentity(); if (!user)
    throw new ConvexError('Sign in to Poki first.'); return user.tokenIdentifier; }
async function me(ctx: Ctx) { const key = await identity(ctx); const p = await ctx.db.query('profiles').withIndex('by_identity', q => q.eq('identity', key)).unique(); if (!p)
    throw new ConvexError('Choose your Poki username first.'); return p; }
function username(value: string) { const n = value.trim().toLowerCase(); if (!/^[a-z0-9_]{3,24}$/.test(n))
    throw new ConvexError('Use 3–24 lowercase letters, numbers or underscores.'); return n; }
async function blocked(ctx: Ctx, a: Id<'profiles'>, b: Id<'profiles'>) { const checks = await Promise.all([ctx.db.query('blocks').withIndex('by_owner_and_target', q => q.eq('owner', a).eq('target', b)).unique(), ctx.db.query('blocks').withIndex('by_owner_and_target', q => q.eq('owner', b).eq('target', a)).unique()]); return checks.some(Boolean); }
async function relationship(ctx: Ctx, a: Id<'profiles'>, b: Id<'profiles'>) { const [x, y] = [a, b].sort(); return ctx.db.query('relationships').withIndex('by_a_and_b', q => q.eq('a', x).eq('b', y)).unique(); }
async function links(ctx: Ctx, id: Id<'profiles'>) { const [a, b] = await Promise.all([ctx.db.query('relationships').withIndex('by_a', q => q.eq('a', id)).take(101), ctx.db.query('relationships').withIndex('by_b', q => q.eq('b', id)).take(101)]); return [...a, ...b]; }
async function friend(ctx: Ctx, a: Id<'profiles'>, b: Id<'profiles'>) { const r = await relationship(ctx, a, b); if (!r || r.status !== 'accepted' || await blocked(ctx, a, b))
    throw new ConvexError('You must both accept the friendship first.'); return r; }
async function online(ctx: Ctx, p: Doc<'profiles'>) { return p.availability === 'available' && (await presence.listRoom(ctx, p._id, true, 1)).some(s => s.online); }
export const profile = query({ args: {}, returns: v.union(v.null(), v.object({ ...profileView.fields, discoverable: v.boolean(), availability })), handler: async (ctx) => { const key = await identity(ctx); const p = await ctx.db.query('profiles').withIndex('by_identity', q => q.eq('identity', key)).unique(); return p ? { ...view(p), discoverable: p.discoverable, availability: p.availability } : null; } });
export const saveProfile = mutation({ args: { username: v.string(), name: v.string(), discoverable: v.boolean(), availability }, returns: v.null(), handler: async (ctx, args) => { const key = await identity(ctx); const n = username(args.username); const name = args.name.trim(); if (!name || name.length > 48)
        throw new ConvexError('Choose a display name of 1–48 characters.'); const existing = await ctx.db.query('profiles').withIndex('by_identity', q => q.eq('identity', key)).unique(); const taken = await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', n)).unique(); if (taken && taken._id !== existing?._id)
        throw new ConvexError('That username is already taken.'); const values = { username: n, name, discoverable: args.discoverable, availability: args.availability }; if (existing) {
        await ctx.db.patch(existing._id, values);
        if (args.availability !== 'available')
            await presence.removeRoomUser(ctx, existing._id, existing._id);
    }
    else
        await ctx.db.insert('profiles', { identity: key, ...values, lastRequestAt: 0, lastLookupAt: 0, lastPreviewAt: 0, lastHiAt: 0 }); return null; } });
export const findUsername = mutation({ args: { username: v.string() }, returns: v.union(v.null(), profileView), handler: async (ctx, args) => { const p = await me(ctx); if (Date.now() - p.lastLookupAt < 3000)
        throw new ConvexError('Wait a few seconds before searching again.'); await ctx.db.patch(p._id, { lastLookupAt: Date.now() }); const target = await ctx.db.query('profiles').withIndex('by_username', q => q.eq('username', username(args.username))).unique(); return target && target._id !== p._id && target.discoverable && !(await blocked(ctx, p._id, target._id)) ? view(target) : null; } });
export const requestFriend = mutation({ args: { target: v.id('profiles') }, returns: v.null(), handler: async (ctx, { target }) => { const p = await me(ctx); const other = await ctx.db.get(target); if (!other || !other.discoverable || target === p._id || await blocked(ctx, p._id, target))
        throw new ConvexError('This person is not accepting requests.'); if (await relationship(ctx, p._id, target))
        throw new ConvexError('There is already a request or friendship.'); if (Date.now() - p.lastRequestAt < 5000)
        throw new ConvexError('Wait five seconds before another friend request.'); if ((await links(ctx, p._id)).length >= 100 || (await links(ctx, target)).length >= 100)
        throw new ConvexError('This circle has reached its 100 connection limit.'); await ctx.db.patch(p._id, { lastRequestAt: Date.now() }); const [a, b] = [p._id, target].sort(); await ctx.db.insert('relationships', { a, b, requester: p._id, status: 'pending' }); return null; } });
export const connections = query({ args: {}, returns: v.array(v.object({ ...profileView.fields, relationship: v.id('relationships'), status: v.union(v.literal('incoming'), v.literal('outgoing'), v.literal('friend')), online: v.boolean() })), handler: async (ctx) => { const p = await me(ctx); const result = []; for (const r of await links(ctx, p._id)) {
        const target = r.a === p._id ? r.b : r.a;
        if (await blocked(ctx, p._id, target))
            continue;
        const other = await ctx.db.get(target);
        if (other)
            result.push({ ...view(other), relationship: r._id, status: r.status === 'accepted' ? 'friend' as const : r.requester === p._id ? 'outgoing' as const : 'incoming' as const, online: r.status === 'accepted' && await online(ctx, other) });
    } return result; } });
export const accept = mutation({ args: { relationship: v.id('relationships') }, returns: v.null(), handler: async (ctx, args) => { const p = await me(ctx); const r = await ctx.db.get(args.relationship); if (!r || r.status !== 'pending' || r.requester === p._id || (r.a !== p._id && r.b !== p._id) || await blocked(ctx, r.a, r.b))
        throw new ConvexError('This request is no longer available.'); await ctx.db.patch(r._id, { status: 'accepted' }); return null; } });
export const remove = mutation({ args: { target: v.id('profiles') }, returns: v.null(), handler: async (ctx, { target }) => { const p = await me(ctx); const r = await relationship(ctx, p._id, target); if (r)
        await ctx.db.delete(r._id); return null; } });
export const block = mutation({ args: { target: v.id('profiles') }, returns: v.null(), handler: async (ctx, { target }) => { const p = await me(ctx); const other = await ctx.db.get(target); const known = await relationship(ctx, p._id, target); if (target === p._id || !other || (!known && !other.discoverable))
        throw new ConvexError('Choose a discoverable person or an existing connection.'); if (!await ctx.db.query('blocks').withIndex('by_owner_and_target', q => q.eq('owner', p._id).eq('target', target)).unique()) {
        if ((await ctx.db.query('blocks').withIndex('by_owner', q => q.eq('owner', p._id)).take(100)).length >= 100)
            throw new ConvexError('Block list limit reached.');
        await ctx.db.insert('blocks', { owner: p._id, target });
    } const r = await relationship(ctx, p._id, target); if (r)
        await ctx.db.delete(r._id); return null; } });
export const blockedPeople = query({ args: {}, returns: v.array(profileView), handler: async (ctx) => { const p = await me(ctx); const result = []; for (const b of await ctx.db.query('blocks').withIndex('by_owner', q => q.eq('owner', p._id)).take(100)) {
        const other = await ctx.db.get(b.target);
        if (other)
            result.push(view(other));
    } return result; } });
export const unblock = mutation({ args: { target: v.id('profiles') }, returns: v.null(), handler: async (ctx, { target }) => { const p = await me(ctx); const b = await ctx.db.query('blocks').withIndex('by_owner_and_target', q => q.eq('owner', p._id).eq('target', target)).unique(); if (b)
        await ctx.db.delete(b._id); return null; } });
export const heartbeat = mutation({ args: {}, returns: v.null(), handler: async (ctx) => { const p = await me(ctx); if (p.availability === 'available')
        await presence.heartbeat(ctx, p._id, p._id, p._id, 10000); return null; } });
export const stopPresence = mutation({ args: {}, returns: v.null(), handler: async (ctx) => { const p = await me(ctx); await presence.removeRoomUser(ctx, p._id, p._id); return null; } });
export const previewHi = mutation({ args: { recipient: v.id('profiles'), reaction }, returns: v.object({ id: v.id('greetings'), recipient: profileView, reaction, text: v.string(), expiresAt: v.number() }), handler: async (ctx, { recipient, reaction }) => { const p = await me(ctx); const r = await friend(ctx, p._id, recipient); const other = await ctx.db.get(recipient); if (!other || !await online(ctx, other))
        throw new ConvexError('Your friend is not available right now.'); if (Date.now() - p.lastPreviewAt < 3000)
        throw new ConvexError('Wait a few seconds before another preview.'); await ctx.db.patch(p._id, { lastPreviewAt: Date.now() }); const history = await ctx.db.query('greetings').withIndex('by_sender', q => q.eq('sender', p._id)).order('desc').take(100); if (history.length >= 100)
        await ctx.db.delete(history[history.length - 1]._id); const expiresAt = Date.now() + 60000; const id = await ctx.db.insert('greetings', { sender: p._id, recipient, reaction, relationship: r._id, expiresAt, state: 'preview' }); await ctx.scheduler.runAt(expiresAt, internal.social.expireGreeting, { id }); return { id, recipient: view(other), reaction, text: REACTIONS[reaction].label, expiresAt }; } });
export const sendHi = mutation({ args: { preview: v.id('greetings'), recipient: v.id('profiles'), reaction, text: v.string() }, returns: v.null(), handler: async (ctx, args) => { const p = await me(ctx); const g = await ctx.db.get(args.preview); if (!g || g.sender !== p._id || g.recipient !== args.recipient || g.state !== 'preview' || g.expiresAt <= Date.now() || (g.reaction ?? 'hi') !== args.reaction || REACTIONS[args.reaction].label !== args.text)
        throw new ConvexError('This preview expired or was already used. Preview again.'); const r = await friend(ctx, p._id, g.recipient); if (r._id !== g.relationship)
        throw new ConvexError('The friendship changed. Preview again.'); const other = await ctx.db.get(g.recipient); if (!other || !await online(ctx, other))
        throw new ConvexError('Your friend is not available right now.'); if (Date.now() - p.lastHiAt < 30000)
        throw new ConvexError('You can send one greeting every 30 seconds.'); await ctx.db.patch(p._id, { lastHiAt: Date.now() }); const expiresAt = Date.now() + 300000; await ctx.db.patch(g._id, { state: 'sent', sentAt: Date.now(), expiresAt }); await ctx.scheduler.runAt(expiresAt, internal.social.expireGreeting, { id: g._id }); return null; } });
export const inbox = query({ args: {}, returns: v.array(v.object({ id: v.id('greetings'), sender: profileView, reaction, text: v.string(), sentAt: v.number(), read: v.boolean() })), handler: async (ctx) => { const p = await me(ctx); const result = []; for (const g of await ctx.db.query('greetings').withIndex('by_recipient', q => q.eq('recipient', p._id)).order('desc').take(100)) {
        if (g.state === 'preview' || g.expiresAt <= Date.now() || await blocked(ctx, p._id, g.sender))
            continue;
        const r = await ctx.db.get(g.relationship);
        if (!r || r.status !== 'accepted' || ![r.a, r.b].includes(p._id) || ![r.a, r.b].includes(g.sender))
            continue;
        const sender = await ctx.db.get(g.sender);
        if (sender)
            result.push({ id: g._id, sender: view(sender), reaction: g.reaction ?? 'hi', text: REACTIONS[g.reaction ?? 'hi'].label, sentAt: g.sentAt!, read: g.state === 'read' });
    } return result; } });
export const readHi = mutation({ args: { id: v.id('greetings') }, returns: v.null(), handler: async (ctx, { id }) => { const p = await me(ctx); const g = await ctx.db.get(id); if (!g || g.recipient !== p._id || g.state === 'preview' || g.expiresAt <= Date.now())
        throw new ConvexError('That greeting is not in your inbox.'); const r = await friend(ctx,p._id,g.sender); if(r._id!==g.relationship) throw new ConvexError('That greeting is no longer available.'); await ctx.db.patch(id, { state: 'read' }); return null; } });
export const expireGreeting = internalMutation({ args: { id: v.id('greetings') }, returns: v.null(), handler: async (ctx, { id }) => { const g = await ctx.db.get(id); if (g && g.expiresAt <= Date.now())
        await ctx.db.delete(id); return null; } });
