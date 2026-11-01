const $ = id => document.getElementById(id);
let token = sessionStorage.getItem('safereach-poke-session');
let invitation = location.hash.startsWith('#invite=') ? location.hash.slice(8) : null;
history.replaceState(null, '', location.pathname);
let state;
let latest = sessionStorage.getItem('safereach-poke-latest');
let timer;
let busy = false;
let animationTimer;
let previewVersion = '';
let historyVersion = '';
if (invitation) { $('welcome').textContent = 'A little hello awaits.'; $('start').firstChild.textContent = 'Join this invitation '; }

async function api(action, data) {
  const response = await fetch(`/api/${action}`, { method: data === undefined ? 'GET' : 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Could not complete that action.');
  return result;
}
function animate(from) {
  $('inbox-event').textContent = `${from} says hi. No reply needed.`;
  $('scene-caption').textContent = `${from} dropped by to say hi.`;
  const scene = $('scene'); scene.classList.remove('received');
  void scene.offsetWidth;
  scene.classList.add('received');
  clearTimeout(animationTimer); animationTimer = setTimeout(() => scene.classList.remove('received'), 1100);
}
async function refresh() {
  if (!token) return;
  state = await api('state');
  $('onboarding').hidden = true; $('profile').hidden = false; $('profile-name').textContent = state.name; $('unpaired').hidden = !!state.peer; $('paired').hidden = !state.peer;
  $('connection-status').textContent = state.peer ? (state.muted ? 'CONNECTED · INCOMING MUTED' : 'CONNECTED · YOUR CHOSEN PERSON') : 'YOUR PRIVATE TEST INBOX';
  $('own-name').textContent = `Hello, ${state.name}.`;
  $('friend-name').textContent = state.peer?.name ?? '';
  $('poke').firstChild.textContent = `Preview hello to ${state.peer?.name ?? 'your friend'} `;
  $('mute').textContent = state.muted ? 'Unmute incoming' : 'Mute incoming';
  $('request').hidden = !state.incoming;
  $('invite').hidden = !!(state.incoming || state.waiting);
  $('cancel-connection').hidden = !(state.incoming || state.waiting);
  $('pair-description').textContent = state.waiting ? 'Waiting for your friend to accept. No pokes can be sent yet.' : 'Choose one person. Both of you have to agree.';
  $('request-text').textContent = state.incoming ? `${state.incoming.name} would like to connect. Accept pokes from them?` : '';
  if (state.incoming || state.waiting || state.peer) $('invitation').hidden = true;
  const nextPreviews = JSON.stringify(state.previews);
  if (nextPreviews !== previewVersion) {
    previewVersion = nextPreviews;
    const previews = $('previews'); previews.replaceChildren();
    for (const preview of state.previews) {
    const row = document.createElement('div'); row.className = 'preview';
    const text = document.createElement('p'); text.textContent = `To ${preview.recipient}: “Hi!” Only this hello is shared.`;
    const approve = document.createElement('button'); approve.className = 'secondary'; approve.textContent = `Send “Hi!” to ${preview.recipient}`;
    approve.addEventListener('click', () => act(async () => { const result = await api('approve', { id: preview.id }); queued(result); }));
    const cancel = document.createElement('button'); cancel.className = 'text-button'; cancel.textContent = 'Decline';
    cancel.addEventListener('click', () => act(() => api('cancel-preview', { id: preview.id })));
      row.append(text, approve, cancel); previews.append(row);
    }
  }
  const nextHistory = JSON.stringify(state.inbox);
  if (nextHistory !== historyVersion) {
    historyVersion = nextHistory;
    const history = $('poke-history'); history.replaceChildren();
    for (const event of [...state.inbox].reverse()) {
      const item = document.createElement('li'); item.textContent = `${event.from} said hi at ${new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; history.append(item);
    }
  }
  const event = state.inbox.at(-1);
  if (event && event.id !== latest) { latest = event.id; sessionStorage.setItem('safereach-poke-latest', latest); animate(event.from); }
}
function queued(result) { $('notice').textContent = `Queued for ${result.recipient}’s inbox. This does not mean they have seen it.`; }
async function act(work) {
  if (busy) return; busy = true;
  const buttons = [...document.querySelectorAll('button')]; buttons.forEach(button => { button.disabled = true; });
  $('notice').textContent = '';
  try { await work(); await refresh(); }
  catch (error) { $('notice').textContent = error.message; }
  finally { busy = false; buttons.forEach(button => { button.disabled = false; }); }
}
$('onboarding').addEventListener('submit', event => { event.preventDefault(); act(async () => {
  const result = await api('session', { name: $('name').value.trim() });
  token = result.token; sessionStorage.setItem('safereach-poke-session', token);
  if (invitation) { await api('join', { invitation, agree: true }); invitation = null; }
}); });
$('invite').addEventListener('click', () => act(async () => {
  const result = await api('invite', {}); $('invite-link').value = `${location.origin}/#invite=${result.invitation}`; $('invitation').hidden = false;
}));
$('copy').addEventListener('click', () => act(async () => {
  try { await navigator.clipboard.writeText($('invite-link').value); $('notice').textContent = 'Invitation copied. Share it through your usual channel.'; }
  catch { $('invite-link').select(); $('notice').textContent = 'Select and copy the invitation link.'; }
}));
$('accept').addEventListener('click', () => act(() => api('accept', { id: state.incoming.id })));
$('poke').addEventListener('click', () => act(async () => { await api('preview', {}); $('notice').textContent = 'Preview ready. Nothing sent. Choose Send or Decline below.'; }));
$('mute').addEventListener('click', () => act(() => api('mute', { muted: !state.muted })));
for (const id of ['disconnect', 'cancel-connection']) $(id).addEventListener('click', () => act(async () => {
  await api('disconnect', {}); $('notice').textContent = 'Connection ended. No more pokes can be sent between you.'; $('inbox-event').textContent = '';
}));
$('connector').addEventListener('click', () => act(async () => {
  const config = await api('connector', {});
  const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'safereach-poke.private.json'; link.click(); URL.revokeObjectURL(url);
  $('notice').textContent = 'Private settings downloaded. Keep this file outside Git. Setup instructions are in docs/POKE.md.';
}));
async function poll() {
  clearTimeout(timer);
  if (document.hidden) return;
  if (!busy) try { await refresh(); } catch (error) { $('notice').textContent = `${error.message} Refresh and create a new inbox if the session expired.`; }
  timer = setTimeout(poll, 2000);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else poll(); });
window.addEventListener('pagehide', () => { clearTimeout(timer); clearTimeout(animationTimer); });
poll();
