/**
 * main.js — Electron Main Process
 *
 * This is the entry point for the Electron desktop app.
 * It creates the browser window and handles all IPC (Inter-Process Communication)
 * between the frontend UI and the backend VPN logic.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const vpnManager = require('./backend/vpnManager');

// Keep a global reference to prevent garbage collection
let mainWindow;

/**
 * Creates the main application window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 700,
    minWidth: 380,
    minHeight: 620,
    resizable: true,
    frame: false,           // Frameless window for custom title bar
    transparent: false,
    backgroundColor: '#0d0f14',
    webPreferences: {
      preload: path.join(__dirname, 'frontend/js/preload.js'),
      contextIsolation: true,   // Security: isolate renderer from main
      nodeIntegration: false,   // Security: no Node in renderer
    },
    icon: path.join(__dirname, 'frontend/assets/icon.png'),
  });

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'));

  // Optional: open DevTools during development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Ensure VPN is disconnected on app close
  vpnManager.disconnect();
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ──────────────────────────────────────────────────────────────
// These handlers receive messages from the renderer (frontend)
// and call backend VPN logic, then reply back.

/**
 * Handle connection request from frontend.
 * Payload: { server: { id, name, country, ip } }
 */
ipcMain.handle('vpn:connect', async (event, payload) => {
  try {
    const result = await vpnManager.connect(payload.server);
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

/**
 * Handle disconnect request from frontend.
 */
ipcMain.handle('vpn:disconnect', async () => {
  try {
    const result = await vpnManager.disconnect();
    return { success: true, ...result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

/**
 * Get current VPN status (for app reload/refresh).
 */
ipcMain.handle('vpn:status', async () => {
  return vpnManager.getStatus();
});

/**
 * Get the user's current public IP address (mocked).
 */
ipcMain.handle('vpn:getIp', async () => {
  return vpnManager.getCurrentIp();
});

/**
 * Window controls (since we use frameless window).
 */
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:close', () => {
  vpnManager.disconnect();
  mainWindow?.close();
});

/**
 * Relay log events from backend to frontend renderer.
 * Called by vpnManager internally when it emits log events.
 */
vpnManager.onLog((logEntry) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('vpn:log', logEntry);
  }
});

/**
 * Relay status change events from backend to frontend.
 */
vpnManager.onStatusChange((status) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('vpn:statusChange', status);
  }
});
