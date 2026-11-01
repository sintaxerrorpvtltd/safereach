import { PokiDemo, PEOPLE, nearestStoryBeat } from './demo-state.mjs';

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
  $(`${event.recipient}-avatar`).textContent = PEOPLE[event.sender].slice(0, 1);
  $(`${event.recipient}-avatar`).dataset.person = event.sender;
  $(`${event.recipient}-avatar`).setAttribute('aria-label', `${PEOPLE[event.sender]}’s fictional avatar`);
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
  for (const id of Object.keys(PEOPLE)) { $(`stage-${id}`).classList.remove('received'); $(`${id}-inbox`).textContent = 'A quiet little corner.'; $(`${id}-avatar`).textContent = PEOPLE[id].slice(0, 1); $(`${id}-avatar`).dataset.person = id; $(`${id}-avatar`).setAttribute('aria-label', `${PEOPLE[id]}’s fictional avatar`); }
  say('Demo reset. Both fictional friends must agree again.');
}));
window.addEventListener('pagehide', () => { clearTimeout(expiryTimer); for (const timer of timers.values()) clearTimeout(timer); });
render();

const installPrompt = $('install-prompt');
$('copy-install').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(installPrompt.value);
    $('copy-status').textContent = 'Copied. Paste this into a new Codex chat to start local setup.';
  } catch {
    installPrompt.focus(); installPrompt.select();
    $('copy-status').textContent = 'Select the instruction and copy it manually with ⌘C or Ctrl+C.';
  }
});

const storyStage = document.querySelector('.story-stage');
const storyBeats = [...document.querySelectorAll('[data-story]')];
const storyLines = ['What if I could just say hi?', 'Both people choose to connect.', 'Preview → approve → a little hi!', 'Your idea could be next.'];
const storyLabels = ['01 / THE IDEA', '02 / MUTUAL CHOICE', '03 / THE LOCAL HELLO', '04 / BUILT IN THE OPEN'];
let storyFrame;
function updateStory() {
  storyFrame = undefined;
  const closest = nearestStoryBeat(storyBeats.map(beat => beat.getBoundingClientRect().top), innerHeight);
  storyStage.dataset.pose = String(closest);
  $('story-bubble').textContent = storyLines[closest];
  $('story-caption').textContent = storyLabels[closest];
  storyBeats.forEach((beat, i) => beat.classList.toggle('active', i === closest));
}
function scheduleStory() { if (storyFrame === undefined) storyFrame = requestAnimationFrame(updateStory); }
window.addEventListener('scroll', scheduleStory, { passive: true });
window.addEventListener('resize', scheduleStory);
window.addEventListener('pagehide', () => { if (storyFrame !== undefined) cancelAnimationFrame(storyFrame); });
updateStory();
