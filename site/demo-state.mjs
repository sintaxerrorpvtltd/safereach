export const PEOPLE = Object.freeze({ alex: 'Alex', sam: 'Sam' });

// Fictional in-tab illustration, not authentication or a messaging transport.
export class PokiDemo {
  constructor() { this.sequence = 0; this.reset(); }
  reset() {
    this.accepted = { alex: false, sam: false };
    this.muted = { alex: false, sam: false };
    this.blocked = { alex: false, sam: false };
    this.pending = null;
    this.events = [];
  }
  person(id) { if (!Object.hasOwn(PEOPLE, id)) throw new Error('Choose Alex or Sam from this fictional demo.'); }
  pair(id) { this.person(id); this.accepted[id] = true; }
  paired() { return this.accepted.alex && this.accepted.sam; }
  setPreference(kind, id, value) {
    this.person(id);
    if (!['muted', 'blocked'].includes(kind) || typeof value !== 'boolean') throw new Error('Unknown demo preference.');
    this[kind][id] = value;
    if (value && (kind === 'blocked' || this.pending?.recipient === id)) this.pending = null;
  }
  available(sender) {
    this.person(sender);
    if (!this.paired()) throw new Error('Alex and Sam both need to accept pairing first.');
    const recipient = sender === 'alex' ? 'sam' : 'alex';
    if (this.blocked[sender] || this.blocked[recipient]) throw new Error('This demo connection is blocked. Unblock both sides before trying again.');
    if (this.muted[recipient]) throw new Error(`${PEOPLE[recipient]} has Do Not Disturb on. No demo hello was delivered.`);
    return recipient;
  }
  prepare(sender, now = Date.now()) {
    const recipient = this.available(sender);
    this.pending = Object.freeze({ id: ++this.sequence, sender, recipient, text: 'Hi!', expiresAt: now + 60000 });
    return this.pending;
  }
  decline() { this.pending = null; }
  approve(id, now = Date.now()) {
    const preview = this.pending;
    if (!preview || preview.id !== id) throw new Error('That preview is no longer available. Prepare another hello.');
    if (preview.expiresAt <= now) { this.pending = null; throw new Error('That preview expired. Prepare another hello.'); }
    if (this.available(preview.sender) !== preview.recipient) throw new Error('The demo connection changed.');
    this.pending = null;
    const event = Object.freeze({ id: preview.id, sender: preview.sender, recipient: preview.recipient, text: preview.text });
    this.events.push(event);
    this.events = this.events.slice(-6);
    return event;
  }
}

// Select by reading position so scrolling backward follows the same story.
export function nearestStoryBeat(tops, viewportHeight) {
  return tops.reduce((closest, top, i) => Math.abs(top - viewportHeight * .4) < Math.abs(tops[closest] - viewportHeight * .4) ? i : closest, 0);
}
