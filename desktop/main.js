// SmartClinic Windows desktop shell: same backend & database as the web app (loads the hosted instance).
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const URL_ = process.env.SMARTCLINIC_URL || require('./config.json').url;

function create() {
  const win = new BrowserWindow({ width: 1366, height: 860, minWidth: 1024, minHeight: 640, title: 'SmartClinic', backgroundColor: '#071D2D', icon: path.join(__dirname, '../public/icons/icon-512.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  Menu.setApplicationMenu(null);
  win.loadURL(URL_ + '/login').catch(() => win.loadFile(path.join(__dirname, '../public/offline.html')));
  // external links (WhatsApp / Telegram / maps) open in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith(URL_)) shell.openExternal(url); return { action: url.startsWith(URL_) ? 'allow' : 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(URL_)) { e.preventDefault(); shell.openExternal(url); } });
}
const lock = app.requestSingleInstanceLock();
if (!lock) app.quit(); else { app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } }); app.whenReady().then(create); }
app.on('window-all-closed', () => app.quit());
