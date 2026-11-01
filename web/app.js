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
let avatarDraft = null;
let avatarSelection = 0;
let desktopEnabled = false;
let inboxLoaded = false;
if (invitation) { $('welcome').textContent = 'A little hello awaits.'; $('start').firstChild.textContent = 'Join this invitation '; }

async function api(action, data) {
  const response = await fetch(`/api/${action}`, { method: data === undefined ? 'GET' : 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Could not complete that action.');
  return result;
}
function paintAvatar(id, name, key, image) {
  const element = $(id);
  element.replaceChildren();
  element.dataset.color = String([...key].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 5);
  if (image && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
    const img = document.createElement('img'); img.src = image; img.alt = `${name}’s chosen avatar`; element.append(img);
  } else element.textContent = name.slice(0, 1).toUpperCase();
  element.setAttribute('aria-label', `${name}’s avatar`);
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
  paintAvatar('profile-avatar', state.name, state.avatarKey, state.avatar);
  $('remove-avatar').hidden = !state.avatar;
  if (state.peer) paintAvatar('friend-avatar', state.peer.name, state.peer.avatarKey, state.peer.avatar);
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
    const text = document.createElement('p'); text.textContent = `To ${preview.recipient}: “Hi!” Your name and current avatar are included.`;
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
  $('sender-avatar').hidden = !event; $('scene-avatar').hidden = !event; $('buddy').hidden = !!event;
  if (event) {
    paintAvatar('sender-avatar', event.from, event.avatarKey, event.avatar);
    paintAvatar('scene-avatar', event.from, event.avatarKey, event.avatar);
  }
  if (event && event.id !== latest) { latest = event.id; sessionStorage.setItem('safereach-poke-latest', latest); animate(event.from); if (inboxLoaded && desktopEnabled && !state.muted) window.pokiDesktop.showHello({ from: event.from, avatarKey: event.avatarKey, avatar: event.avatar }).catch(() => { $('notice').textContent = 'Desktop pop-in unavailable. Your hello is still in the inbox.'; }); }
  inboxLoaded = true;
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
  if (document.hidden && !desktopEnabled) return;
  if (!busy) try { await refresh(); } catch (error) { $('notice').textContent = `${error.message} Refresh and create a new inbox if the session expired.`; }
  timer = setTimeout(poll, 2000);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && !desktopEnabled) clearTimeout(timer); else poll(); });
window.addEventListener('pagehide', () => { clearTimeout(timer); clearTimeout(animationTimer); });
poll();

function clearAvatarDraft() {
  avatarSelection++; avatarDraft = null; $('avatar-file').value = ''; $('avatar-agree').checked = false;
  $('avatar-draft-image').removeAttribute('src'); $('avatar-draft').hidden = true;
}
$('avatar-file').addEventListener('change', async () => {
  const file = $('avatar-file').files[0];
  clearAvatarDraft();
  if (!file) return;
  const selection = avatarSelection;
  let bitmap;
  try {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a PNG, JPEG or WebP up to 5 MB.');
    bitmap = await createImageBitmap(file);
    if (bitmap.width > 8192 || bitmap.height > 8192) throw new Error('Choose an image smaller than 8192 pixels per side.');
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const scale = 128 / Math.max(bitmap.width, bitmap.height);
    const width = bitmap.width * scale, height = bitmap.height * scale;
    canvas.getContext('2d').drawImage(bitmap, (128 - width) / 2, (128 - height) / 2, width, height);
    const encoded = canvas.toDataURL('image/png');
    if (encoded.length > 85000) throw new Error('Choose a simpler or smaller image for this local prototype.');
    if (selection !== avatarSelection) return;
    avatarDraft = encoded;
    $('avatar-draft-image').src = avatarDraft; $('avatar-draft').hidden = false;
    $('notice').textContent = 'Preview only. Your image has not been sent to the local server or any AI provider.';
  } catch (error) { if (selection === avatarSelection) $('notice').textContent = error.message; }
  finally { bitmap?.close(); }
});
$('cancel-avatar').addEventListener('click', clearAvatarDraft);
$('save-avatar').addEventListener('click', () => act(async () => {
  if (!avatarDraft || !$('avatar-agree').checked) throw new Error('Review the image and agree to share this avatar with your connected test friend.');
  await api('avatar', { avatar: avatarDraft, agree: true }); clearAvatarDraft();
  $('notice').textContent = 'Avatar saved on this local test server. Prepare a fresh hello to use it.';
}));
$('remove-avatar').addEventListener('click', () => act(async () => {
  await api('avatar', { avatar: null, agree: true }); clearAvatarDraft();
  $('notice').textContent = 'Image removed from this local profile. Initials are used instead.';
}));

if (window.pokiDesktop) {
  $('desktop-settings').hidden = false;
  $('desktop-popins').addEventListener('change', async event => {
    try {
      desktopEnabled = await window.pokiDesktop.setEnabled(event.target.checked);
      event.target.checked = desktopEnabled;
      $('notice').textContent = desktopEnabled ? 'Desktop pop-ins enabled for new hellos while Poki runs.' : 'Desktop pop-ins disabled.';
      poll();
    } catch {
      desktopEnabled = false; event.target.checked = false;
      $('notice').textContent = 'Could not enable desktop pop-ins. Your browser inbox still works.';
    }
  });
}
