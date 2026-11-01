import { PokiDemo, PEOPLE } from './demo-state.mjs';

const demo = new PokiDemo();
const $ = id => document.getElementById(id);
const timers = new Map();
let expiryTimer;
const say = text => { $('demo-feedback').textContent = text; };

function render() {
  $('pair-status').textContent = demo.paired() ? 'Alex + Sam are paired in this tab.' : 'Both friends need to accept.';
  for (const id of Object.keys(PEOPLE)) {
    $(`pair-${id}`).disabled = demo.accepted[id];
    $(`pair-${id}`).textContent = demo.accepted[id] ? `${PEOPLE[id]} accepted ✓` : `${PEOPLE[id]} agrees to connect`;
    $(`${id}-connection`).textContent = demo.blocked[id] ? 'Blocked' : demo.muted[id] ? 'Do Not Disturb' : demo.paired() ? 'Paired' : demo.accepted[id] ? 'Waiting for friend' : 'Not paired';
    $(`prepare-${id}`).disabled = !demo.paired();
    $(`mute-${id}`).checked = demo.muted[id];
    $(`block-${id}`).checked = demo.blocked[id];
  }
  $('preview-panel').hidden = !demo.pending;
  if (demo.pending) {
    $('preview-title').textContent = `${PEOPLE[demo.pending.sender]} → ${PEOPLE[demo.pending.recipient]}`;
    $('preview-copy').textContent = '“Hi!”';
    $('approve-demo').textContent = `Approve demo hello to ${PEOPLE[demo.pending.recipient]}`;
  }
  const log = $('demo-events'); log.replaceChildren();
  if (!demo.events.length) { const item = document.createElement('li'); item.textContent = 'No demo hellos yet.'; log.append(item); }
  for (const event of [...demo.events].reverse()) {
    const item = document.createElement('li'); item.textContent = `${PEOPLE[event.sender]} → ${PEOPLE[event.recipient]}: “Hi!” — illustrated in this tab only.`; log.append(item);
  }
}
function run(action) {
  try { action(); } catch (error) { say(error.message); }
  if (!demo.pending) { clearTimeout(expiryTimer); expiryTimer = undefined; }
  render();
}
function wave(event) {
  const stage = $(`stage-${event.recipient}`);
  stage.classList.remove('received');
  void stage.offsetWidth;
  stage.classList.add('received');
  $(`${event.recipient}-inbox`).textContent = `${PEOPLE[event.sender]} says hi!`;
  clearTimeout(timers.get(event.recipient));
  timers.set(event.recipient, setTimeout(() => { stage.classList.remove('received'); timers.delete(event.recipient); }, 1200));
}
for (const id of Object.keys(PEOPLE)) {
  $(`pair-${id}`).addEventListener('click', () => run(() => {
    demo.pair(id); say(demo.paired() ? 'Both fictional friends accepted. Prepare a little hello from either side.' : `${PEOPLE[id]} accepted. The other fictional friend still needs to agree.`);
  }));
  $(`prepare-${id}`).addEventListener('click', () => run(() => {
    demo.prepare(id); clearTimeout(expiryTimer);
    expiryTimer = setTimeout(() => run(() => { if (demo.pending) { demo.decline(); say('That preview expired. Prepare a new demo hello.'); } }), 60000);
    say('Preview prepared. Nothing has happened yet. Approve or decline below.');
    render(); $('approve-demo').focus();
  }));
  for (const [prefix, kind] of [['mute', 'muted'], ['block', 'blocked']]) {
    $(`${prefix}-${id}`).addEventListener('change', event => run(() => {
      demo.setPreference(kind, id, event.target.checked);
      say(`${PEOPLE[id]}: ${prefix === 'mute' ? 'Do Not Disturb' : 'connection block'} ${event.target.checked ? 'on' : 'off'}. Any affected pending preview is cancelled.`);
    }));
  }
}
$('approve-demo').addEventListener('click', () => run(() => {
  const event = demo.approve(demo.pending?.id);
  wave(event); say(`${PEOPLE[event.sender]}’s fictional hello appeared in ${PEOPLE[event.recipient]}’s demo inbox. Nothing left this tab.`);
  $(`prepare-${event.sender}`).focus();
}));
$('decline-demo').addEventListener('click', () => run(() => {
  const sender = demo.pending?.sender; demo.decline(); say('Declined. No demo hello was delivered.');
  render(); if (sender) $(`prepare-${sender}`).focus();
}));
$('reset-demo').addEventListener('click', () => run(() => {
  demo.reset(); for (const timer of timers.values()) clearTimeout(timer); timers.clear();
  for (const id of Object.keys(PEOPLE)) { $(`stage-${id}`).classList.remove('received'); $(`${id}-inbox`).textContent = 'A quiet little corner.'; }
  say('Demo reset. Both fictional friends must agree again.');
}));
window.addEventListener('pagehide', () => { clearTimeout(expiryTimer); for (const timer of timers.values()) clearTimeout(timer); });
render();
