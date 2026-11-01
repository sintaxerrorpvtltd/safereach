import { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen, session } from 'electron';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { startPokeServer } from '../dist/src/poke-server.js';
import { edgeBounds, validateHello, connectedOrigins } from './helpers.mjs';
import { isClerkProtectionUrl } from '../dist/src/connected-policy.js';

app.setName('Poki');
let dashboard, overlay, tray, relay, enabled = false, quitting = false, hideTimer, lastHello = 0;
const file = name => fileURLToPath(new URL(name, import.meta.url));
function secure(window) {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
}
function showDashboard() { if (dashboard && !dashboard.isDestroyed()) { dashboard.show(); dashboard.focus(); } }
app.whenReady().then(async () => {
  const connected = process.argv.includes('--connected') ? JSON.parse(await readFile(new URL('../apps/connected/dist/runtime-config.json', import.meta.url), 'utf8')) : undefined;
  const remoteOrigins = connected ? [...connectedOrigins(connected), 'https://img.clerk.com'] : [];
  relay = await startPokeServer({ port: 0, ...(connected ? { connected } : {}) });
  const dashboardUrl = `${relay.origin}/${connected ? 'connected/' : ''}`;
  const isolated = session.fromPartition('poki-local-desktop');
  isolated.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  isolated.setPermissionCheckHandler(() => false);
  isolated.webRequest.onBeforeRequest((details, callback) => {
    let allowedOrigin = false;
    try { allowedOrigin = remoteOrigins.includes(new URL(details.url).origin) || Boolean(connected && details.resourceType !== 'mainFrame' && isClerkProtectionUrl(details.url)); } catch {}
    callback({ cancel: !allowedOrigin && !details.url.startsWith(`${relay.origin}/`) && !details.url.startsWith('data:image/png;') && !details.url.startsWith(`blob:${relay.origin}/`) });
  });
  const preferences = { session: isolated, sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, backgroundThrottling: false };
  dashboard = new BrowserWindow({ width: 1080, height: 850, minWidth: 420, minHeight: 600, title: 'Poki — local workspace', webPreferences: { ...preferences, preload: file('preload.cjs') } });
  secure(dashboard);
  overlay = new BrowserWindow({ ...edgeBounds(screen.getPrimaryDisplay().workArea), show: false, transparent: true, frame: false, resizable: false, movable: false, focusable: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false, webPreferences: { ...preferences, preload: file('overlay-preload.cjs') } });
  secure(overlay); overlay.setIgnoreMouseEvents(true);
  const allowed = event => {
    if (event.sender !== dashboard.webContents || event.senderFrame !== dashboard.webContents.mainFrame) return false;
    try { const url = new URL(event.senderFrame.url); return url.origin === relay.origin && url.pathname === new URL(dashboardUrl).pathname; } catch { return false; }
  };
  ipcMain.handle('poki:enabled', (event, value) => {
    if (!allowed(event) || typeof value !== 'boolean') throw new Error('Unavailable.');
    enabled = value;
    if (!enabled) { clearTimeout(hideTimer); overlay.hide(); }
    return enabled;
  });
  ipcMain.handle('poki:show', (event, value) => {
    if (!allowed(event) || !enabled || Date.now() - lastHello < 5000) return false;
    const hello = validateHello(value); lastHello = Date.now();
    overlay.setBounds(edgeBounds(screen.getDisplayMatching(dashboard.getBounds()).workArea));
    overlay.webContents.send('poki:hello', hello); overlay.showInactive();
    clearTimeout(hideTimer); hideTimer = setTimeout(() => overlay.hide(), 5000);
    return true;
  });
  dashboard.on('close', event => { if (!quitting) { event.preventDefault(); if (enabled) dashboard.hide(); else app.quit(); } });
  dashboard.webContents.on('render-process-gone', () => app.quit());
  tray = new Tray(nativeImage.createFromPath(file('tray.png')));
  tray.setToolTip('Poki — local companion');
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Open Poki', click: showDashboard }, { label: 'Quit Poki', click: () => app.quit() }]));
  tray.on('click', showDashboard);
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'Poki', submenu: [{ label: 'Open Poki', click: showDashboard }, { role: 'quit', label: 'Quit Poki' }] }, { role: 'editMenu' }]));
  app.on('activate', () => { if (!dashboard.isDestroyed()) showDashboard(); });
  await overlay.loadURL(`${relay.origin}/overlay.html`);
  await dashboard.loadURL(dashboardUrl);
  console.log(`Poki desktop ${connected ? 'connected workspace' : 'local relay'}: ${dashboardUrl}`);
}).catch(error => { console.error('Poki desktop could not start:', error.message); app.quit(); });
app.on('before-quit', () => { quitting = true; clearTimeout(hideTimer); tray?.destroy(); relay?.server.close(); });
app.on('window-all-closed', () => app.quit());
