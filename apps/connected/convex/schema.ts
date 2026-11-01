import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
export const reaction = v.union(v.literal('hi'), v.literal('heart'), v.literal('wave'), v.literal('tea'), v.literal('coffee'), v.literal('thanks'), v.literal('cheer'), v.literal('hug'), v.literal('highfive'), v.literal('sparkle'), v.literal('thinking'), v.literal('celebrate'));
export const availability = v.union(v.literal('available'), v.literal('dnd'), v.literal('invisible'));
export default defineSchema({
    profiles: defineTable({ identity: v.string(), username: v.string(), name: v.string(), discoverable: v.boolean(), availability, lastRequestAt: v.number(), lastLookupAt: v.number(), lastPreviewAt: v.number(), lastHiAt: v.number() }).index('by_identity', ['identity']).index('by_username', ['username']),
    relationships: defineTable({ a: v.id('profiles'), b: v.id('profiles'), requester: v.id('profiles'), status: v.union(v.literal('pending'), v.literal('accepted')) }).index('by_a', ['a']).index('by_b', ['b']).index('by_a_and_b', ['a', 'b']),
    blocks: defineTable({ owner: v.id('profiles'), target: v.id('profiles') }).index('by_owner', ['owner']).index('by_owner_and_target', ['owner', 'target']),
    greetings: defineTable({ reaction: v.optional(reaction), sender: v.id('profiles'), recipient: v.id('profiles'), relationship: v.id('relationships'), expiresAt: v.number(), state: v.union(v.literal('preview'), v.literal('sent'), v.literal('read')), sentAt: v.optional(v.number()) }).index('by_recipient', ['recipient']).index('by_sender', ['sender']),
});
