/**
 * frontend/js/preload.js — Electron Preload Script
 *
 * This script runs in a privileged context (has access to Node.js APIs)
 * but is loaded before the renderer page. It creates a safe bridge
 * between the renderer (frontend) and the main process (backend).
 *
 * contextBridge exposes ONLY the functions we explicitly define,
 * keeping the renderer sandboxed and secure.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose a controlled "vpnAPI" object to the renderer's window
contextBridge.exposeInMainWorld('vpnAPI', {

  // ── VPN Actions ──────────────────────────────────────────────────────
  
  /**
   * Request a VPN connection to the given server object.
   * @param {Object} server - { id, name, country, flag, ping }
   * @returns {Promise<Object>} Result from the main process
   */
  connect: (server) => ipcRenderer.invoke('vpn:connect', { server }),

  /**
   * Request VPN disconnection.
   * @returns {Promise<Object>}
   */
  disconnect: () => ipcRenderer.invoke('vpn:disconnect'),

  /**
   * Get the current VPN status snapshot.
   * @returns {Promise<Object>}
   */
  getStatus: () => ipcRenderer.invoke('vpn:status'),

  /**
   * Get the currently displayed IP address.
   * @returns {Promise<Object>} { ip, isVpn }
   */
  getIp: () => ipcRenderer.invoke('vpn:getIp'),

  // ── Event Listeners ──────────────────────────────────────────────────

  /**
   * Listen for real-time log entries pushed from the main process.
   * @param {Function} callback - Called with a log entry object
   */
  onLog: (callback) => ipcRenderer.on('vpn:log', (event, entry) => callback(entry)),

  /**
   * Listen for VPN status changes pushed from the main process.
   * @param {Function} callback - Called with a status object
   */
  onStatusChange: (callback) => ipcRenderer.on('vpn:statusChange', (event, status) => callback(status)),

  // ── Window Controls ──────────────────────────────────────────────────

  /** Minimize the application window */
  minimizeWindow: () => ipcRenderer.send('window:minimize'),

  /** Close the application window */
  closeWindow: () => ipcRenderer.send('window:close'),
});
