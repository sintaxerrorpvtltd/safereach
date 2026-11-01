import { randomBytes, randomUUID } from 'node:crypto';
import { requireSafe } from './model.js';

type Preview = { id: string; peerId: string; expiresAt: number };
type Poke = { id: string; from: string; fromId: string; at: number };
type Person = {
  id: string; name: string; avatar?: string; expiresAt: number; browserToken: string; connectorToken?: string;
  peerId?: string; incomingId?: string; waitingFor?: string; muted: boolean;
  previews: Preview[]; inbox: Poke[]; attempts: number[];
};
type Invite = { ownerId: string; expiresAt: number };
const secret = () => randomBytes(24).toString('base64url');

// Ephemeral relay prototype; no conversation text, phone numbers, or durable identity.
export class PokeRelay {
  readonly people = new Map<string, Person>();
  readonly invites = new Map<string, Invite>();
  constructor(readonly now = Date.now) {}
  cleanup() {
    for (const [id, person] of this.people) {
      person.previews = person.previews.filter(p => p.expiresAt > this.now());
      if (person.expiresAt <= this.now()) { this.disconnect(person); this.people.delete(id); }
    }
    for (const [token, invite] of this.invites) if (invite.expiresAt <= this.now()) this.invites.delete(token);
  }
  register(name: string) {
    this.cleanup();
    requireSafe(this.people.size < 100, 'This test relay is full. Try again after sessions expire.');
    const person: Person = { id: randomUUID(), name, browserToken: secret(), expiresAt: this.now() + 8 * 3600000,
      muted: false, previews: [], inbox: [], attempts: [] };
    this.people.set(person.id, person);
    return { token: person.browserToken };
  }
  authenticate(token: string, browserOnly = false) {
    this.cleanup();
    const person = [...this.people.values()].find(p => p.browserToken === token || (!browserOnly && p.connectorToken === token));
    requireSafe(person, 'Session unavailable. Open the inbox and connect again.');
    return person;
  }
  state(person: Person, browser: boolean) {
    const peer = person.peerId ? this.people.get(person.peerId) : undefined;
    const incoming = person.incomingId ? this.people.get(person.incomingId) : undefined;
    return { name: person.name, ...(browser ? { avatar: person.avatar ?? null, avatarKey: person.id } : {}), expiresAt: person.expiresAt, muted: person.muted,
      peer: peer ? { name: peer.name, ...(browser ? { avatar: peer.avatar ?? null, avatarKey: peer.id } : {}) } : null,
      incoming: browser && incoming ? { id: incoming.id, name: incoming.name } : null,
      waiting: !!person.waitingFor, inbox: person.inbox.map(event => ({ id: event.id, from: event.from, at: event.at, ...(browser ? { avatarKey: event.fromId, avatar: this.people.get(event.fromId)?.avatar ?? null } : {}) })),
      previews: browser ? person.previews.map(p => ({ id: p.id, recipient: this.people.get(p.peerId)?.name, expiresAt: p.expiresAt })) : [] };
  }
  setAvatar(person: Person, avatar: string | null) {
    if (avatar === null) delete person.avatar;
    else person.avatar = avatar;
    // A changed sender image needs a fresh send preview.
    person.previews = [];
    return { status: avatar ? 'avatar-saved' : 'avatar-removed' };
  }
  invite(person: Person) {
    requireSafe(!person.peerId && !person.incomingId && !person.waitingFor, 'Disconnect or finish your current connection first.');
    for (const [token, invitation] of this.invites) if (invitation.ownerId === person.id) this.invites.delete(token);
    const token = secret();
    this.invites.set(token, { ownerId: person.id, expiresAt: this.now() + 10 * 60000 });
    return { invitation: token, expiresAt: this.now() + 10 * 60000 };
  }
  join(person: Person, token: string) {
    const invite = this.invites.get(token);
    const owner = invite ? this.people.get(invite.ownerId) : undefined;
    requireSafe(invite && invite.expiresAt > this.now() && owner && owner.id !== person.id,
      'Invitation is unavailable or expired. Ask for a new one.');
    requireSafe(!person.peerId && !person.waitingFor && !person.incomingId && !owner.peerId && !owner.incomingId && !owner.waitingFor,
      'One of you already has an active or pending connection.');
    owner.incomingId = person.id;
    person.waitingFor = owner.id;
    this.invites.delete(token);
    return { status: 'waiting', inviter: owner.name };
  }
  accept(person: Person, id: string) {
    const requester = this.people.get(id);
    requireSafe(requester && person.incomingId === id && requester.waitingFor === person.id && !person.peerId && !requester.peerId,
      'Connection request is no longer available.');
    person.peerId = requester.id; requester.peerId = person.id;
    delete person.incomingId; delete requester.waitingFor;
    return { status: 'paired' };
  }
  disconnect(person: Person) {
    for (const other of this.people.values()) {
      if (other.peerId === person.id) { delete other.peerId; other.previews = []; other.inbox = []; }
      if (other.waitingFor === person.id) delete other.waitingFor;
      if (other.incomingId === person.id) delete other.incomingId;
    }
    delete person.peerId; delete person.incomingId; delete person.waitingFor;
    person.previews = []; person.inbox = [];
    for (const [token, invite] of this.invites) if (invite.ownerId === person.id) this.invites.delete(token);
    return { status: 'disconnected' };
  }
  peer(person: Person) {
    const peer = person.peerId ? this.people.get(person.peerId) : undefined;
    requireSafe(peer && peer.peerId === person.id && peer.expiresAt > this.now() && !peer.muted,
      'Your connection is not accepting pokes.');
    return peer;
  }
  prepare(person: Person) {
    const peer = this.peer(person);
    requireSafe(person.previews.length < 5, 'Review or wait for your existing previews to expire.');
    const preview = { id: randomUUID(), peerId: peer.id, expiresAt: this.now() + 120000 };
    person.previews.push(preview);
    return { id: preview.id, recipient: peer.name, expiresAt: preview.expiresAt, needsInboxApproval: true };
  }
  send(person: Person, previewId?: string) {
    const peer = this.peer(person);
    if (previewId) {
      const preview = person.previews.find(p => p.id === previewId);
      requireSafe(preview && preview.peerId === peer.id && preview.expiresAt > this.now(), 'Preview is unavailable or expired.');
    }
    person.attempts = person.attempts.filter(at => at > this.now() - 3600000);
    requireSafe(person.attempts.length < 10 && person.attempts.every(at => this.now() - at >= 30000),
      'Give them a moment. Pokes are limited to one per 30 seconds and ten per hour.');
    if (previewId) person.previews = person.previews.filter(p => p.id !== previewId);
    person.attempts.push(this.now());
    peer.inbox.push({ id: randomUUID(), from: person.name, fromId: person.id, at: this.now() });
    peer.inbox = peer.inbox.slice(-20);
    return { status: 'queued', recipient: peer.name, seen: false };
  }
  connector(person: Person) {
    person.connectorToken = secret();
    return { token: person.connectorToken, scope: ['inbox:read', 'poke:prepare'] };
  }
}
