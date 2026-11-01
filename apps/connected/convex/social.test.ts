import { convexTest } from 'convex-test';
import { expect, test, vi, afterEach } from 'vitest';
import presence from '@convex-dev/presence/test';
import schema from './schema';
import { api } from './_generated/api';
const modules = import.meta.glob('./**/*.ts');
function setup() { const t = convexTest(schema, modules); presence.register(t); return t; }
afterEach(() => vi.useRealTimers());
async function people() { const t = setup(); const a = t.withIdentity({ subject: 'alice', issuer: 'https://poki.test', tokenIdentifier: 'https://poki.test|alice' }); const b = t.withIdentity({ subject: 'bob', issuer: 'https://poki.test', tokenIdentifier: 'https://poki.test|bob' }); const c = t.withIdentity({ subject: 'eve', issuer: 'https://poki.test', tokenIdentifier: 'https://poki.test|eve' }); for (const [user, username] of [[a, 'alice'], [b, 'bob'], [c, 'eve']] as const)
    await user.mutation(api.social.saveProfile, { username, name: username, discoverable: true, availability: 'available' }); const pa = (await a.query(api.social.profile))!; const pb = (await b.query(api.social.profile))!; const pc = (await c.query(api.social.profile))!; return { t, a, b, c, pa, pb, pc }; }
async function friends() { const p = await people(); await p.a.mutation(api.social.requestFriend, { target: p.pb.id }); const r = (await p.b.query(api.social.connections))[0]; await p.b.mutation(api.social.accept, { relationship: r.relationship }); await p.b.mutation(api.social.heartbeat, {}); return p; }
test('all public operations reject unauthenticated clients', async () => { const t = setup(); await expect(t.query(api.social.profile)).rejects.toThrow('Sign in'); await expect(t.query(api.social.connections)).rejects.toThrow('Sign in'); await expect(t.query(api.social.inbox)).rejects.toThrow('Sign in'); await expect(t.mutation(api.social.heartbeat, {})).rejects.toThrow('Sign in'); await expect(t.mutation(api.social.saveProfile, { username: 'alice', name: 'Alice', discoverable: true, availability: 'available' })).rejects.toThrow('Sign in'); });
test('private exact-match discovery, unique usernames, and reciprocal consent', async () => { const { a, b, c, pb } = await people(); await b.mutation(api.social.saveProfile, { username: 'bob', name: 'Bob', discoverable: false, availability: 'available' }); expect(await a.mutation(api.social.findUsername, { username: 'bob' })).toBeNull(); await expect(c.mutation(api.social.saveProfile, { username: 'bob', name: 'Eve', discoverable: true, availability: 'available' })).rejects.toThrow('taken'); await b.mutation(api.social.saveProfile, { username: 'bob', name: 'Bob', discoverable: true, availability: 'available' }); await a.mutation(api.social.requestFriend, { target: pb.id }); const incoming = (await b.query(api.social.connections))[0]; expect(incoming.status).toBe('incoming'); await expect(a.mutation(api.social.accept, { relationship: incoming.relationship })).rejects.toThrow(); await expect(c.mutation(api.social.accept, { relationship: incoming.relationship })).rejects.toThrow(); expect(await c.query(api.social.connections)).toEqual([]); await b.mutation(api.social.accept, { relationship: incoming.relationship }); expect((await a.query(api.social.connections))[0].status).toBe('friend'); });
test('presence is friend-only, DND/invisible are unavailable and removal revokes presence', async () => { const { a, b, c, pb } = await friends(); expect((await a.query(api.social.connections))[0].online).toBe(true); expect(await c.query(api.social.connections)).toEqual([]); await b.mutation(api.social.saveProfile, { username: 'bob', name: 'Bob', discoverable: true, availability: 'dnd' }); expect((await a.query(api.social.connections))[0].online).toBe(false); await b.mutation(api.social.heartbeat, {}); expect((await a.query(api.social.connections))[0].online).toBe(false); await b.mutation(api.social.saveProfile, { username: 'bob', name: 'Bob', discoverable: true, availability: 'invisible' }); expect((await a.query(api.social.connections))[0].online).toBe(false); await a.mutation(api.social.remove, { target: pb.id }); expect(await a.query(api.social.connections)).toEqual([]); });
test('preview requires friendship and availability; approval is exact, owned and one-time', async () => { const { a, b, c, pb, pc } = await friends(); await expect(c.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' })).rejects.toThrow('both accept'); const preview = await a.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' }); expect(await b.query(api.social.inbox)).toEqual([]); await expect(c.mutation(api.social.sendHi, { preview: preview.id, recipient: pb.id, reaction: 'hi', text: 'Hi' })).rejects.toThrow(); await expect(a.mutation(api.social.sendHi, { preview: preview.id, recipient: pc.id, reaction: 'hi', text: 'Hi' })).rejects.toThrow(); await a.mutation(api.social.sendHi, { preview: preview.id, recipient: pb.id, reaction: 'hi', text: 'Hi' }); await expect(a.mutation(api.social.sendHi, { preview: preview.id, recipient: pb.id, reaction: 'hi', text: 'Hi' })).rejects.toThrow(); const inbox = await b.query(api.social.inbox); expect(inbox).toHaveLength(1); expect(await c.query(api.social.inbox)).toEqual([]); await expect(c.mutation(api.social.readHi, { id: inbox[0].id })).rejects.toThrow(); await b.mutation(api.social.readHi, { id: inbox[0].id }); expect((await b.query(api.social.inbox))[0].read).toBe(true); });
test('expired previews, send rate limits, blocking and removal revoke delivery', async () => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-01T12:00:00Z')); const { a, b, pb } = await friends(); const expired = await a.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' }); vi.setSystemTime(Date.now() + 61000); await expect(a.mutation(api.social.sendHi, { preview: expired.id, recipient: pb.id, reaction: 'hi', text: 'Hi' })).rejects.toThrow('expired'); await b.mutation(api.social.heartbeat, {}); const p = await a.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' }); await a.mutation(api.social.sendHi, { preview: p.id, recipient: pb.id, reaction: 'hi', text: 'Hi' }); await expect(a.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' })).rejects.toThrow('few seconds'); vi.setSystemTime(Date.now() + 4000); const p2 = await a.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' }); await expect(a.mutation(api.social.sendHi, { preview: p2.id, recipient: pb.id, reaction: 'hi', text: 'Hi' })).rejects.toThrow('30 seconds'); await b.mutation(api.social.block, { target: (await a.query(api.social.profile))!.id }); expect(await b.query(api.social.inbox)).toEqual([]); await expect(a.mutation(api.social.sendHi, { preview: p2.id, recipient: pb.id, reaction: 'hi', text: 'Hi' })).rejects.toThrow(); });
test('friend removal permanently invalidates pending previews and existing greetings', async () => { vi.useFakeTimers(); const { a, b, pb } = await friends(); const p = await a.mutation(api.social.previewHi, { recipient: pb.id, reaction: 'hi' }); await a.mutation(api.social.sendHi, { preview: p.id, recipient: pb.id, reaction: 'hi', text: 'Hi' }); await a.mutation(api.social.remove, { target: pb.id }); expect(await b.query(api.social.inbox)).toEqual([]); vi.setSystemTime(Date.now() + 6000); await a.mutation(api.social.requestFriend, { target: pb.id }); const r = (await b.query(api.social.connections))[0]; await b.mutation(api.social.accept, { relationship: r.relationship }); expect(await b.query(api.social.inbox)).toEqual([]); });

test('blocked people cannot rediscover or re-request, and unblocking never restores friendship', async () => {
 const {a,b,c,pa,pb}=await friends();
 await b.mutation(api.social.block,{target:pa.id});
 expect(await a.mutation(api.social.findUsername,{username:'bob'})).toBeNull();
 await expect(a.mutation(api.social.requestFriend,{target:pb.id})).rejects.toThrow();
 expect(await a.query(api.social.blockedPeople)).toEqual([]);
 expect(await c.query(api.social.blockedPeople)).toEqual([]);
 expect((await b.query(api.social.blockedPeople))[0].id).toBe(pa.id);
 await b.mutation(api.social.unblock,{target:pa.id});
 expect(await a.query(api.social.connections)).toEqual([]);
});
test('validation rejects arbitrary messages, presence impersonation and invalid profile fields', async () => {
 const {a,b,pb}=await friends();
 await expect(a.mutation(api.social.saveProfile,{username:'a/b',name:'Alice',discoverable:true,availability:'available'})).rejects.toThrow('3–24');
 await expect(a.mutation(api.social.saveProfile,{username:'alice',name:' '.repeat(3),discoverable:true,availability:'available'})).rejects.toThrow('display name');
 const p=await a.mutation(api.social.previewHi,{recipient:pb.id,reaction:'hi'});
 await expect(a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'hi',text:'arbitrary'} as never)).rejects.toThrow();
 await expect(a.mutation(api.social.heartbeat,{userId:pb.id} as never)).rejects.toThrow();
 await b.mutation(api.social.saveProfile,{username:'bob',name:'Bob',discoverable:true,availability:'invisible'});
 await expect(a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'hi',text:'Hi'})).rejects.toThrow('not available');
});
test('scheduled expiry removes greetings so reactive inboxes stop showing them',async()=>{
 vi.useFakeTimers();const {t,a,b,pb}=await friends();
 const p=await a.mutation(api.social.previewHi,{recipient:pb.id,reaction:'hi'});
 await a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'hi',text:'Hi'});
 expect(await b.query(api.social.inbox)).toHaveLength(1);
 await t.finishAllScheduledFunctions(()=>vi.runAllTimers());
 expect(await b.query(api.social.inbox)).toEqual([]);
});

test('only finite preset reactions are accepted and approval cannot change a heart preview',async()=>{
 const {a,b,pb}=await friends();
 await expect(a.mutation(api.social.previewHi,{recipient:pb.id,reaction:'custom'} as never)).rejects.toThrow();
 const p=await a.mutation(api.social.previewHi,{recipient:pb.id,reaction:'heart'});
 expect(p.text).toBe('A little love');
 expect(p.reaction).toBe('heart');
 await expect(a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'hi',text:'Hi'})).rejects.toThrow();
 await expect(a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'heart',text:'arbitrary'})).rejects.toThrow();
 await expect(a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'custom',text:p.text} as never)).rejects.toThrow();
 await a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:p.reaction,text:p.text});
 const inbox=await b.query(api.social.inbox);
 expect(inbox).toHaveLength(1);expect(inbox[0].reaction).toBe('heart');expect(inbox[0].text).toBe('A little love');
});
test('acknowledgement rejects a revoked friendship or expired greeting even with a known inbox ID',async()=>{
 vi.useFakeTimers();const {a,b,pa,pb}=await friends();
 const p=await a.mutation(api.social.previewHi,{recipient:pb.id,reaction:'hi'});
 await a.mutation(api.social.sendHi,{preview:p.id,recipient:pb.id,reaction:'hi',text:'Hi'});
 await b.mutation(api.social.block,{target:pa.id});
 await expect(b.mutation(api.social.readHi,{id:p.id})).rejects.toThrow();
 await b.mutation(api.social.unblock,{target:pa.id});
 vi.setSystemTime(Date.now()+301000);
 await expect(b.mutation(api.social.readHi,{id:p.id})).rejects.toThrow();
});

test('blocking cannot turn a guessed private profile ID into a profile lookup', async () => {
  const { a, b, pb } = await people();
  await b.mutation(api.social.saveProfile, { username: 'bob', name: 'Bob', discoverable: false, availability: 'invisible' });
  await expect(a.mutation(api.social.block, { target: pb.id })).rejects.toThrow('discoverable');
  expect(await a.query(api.social.blockedPeople)).toEqual([]);
});
