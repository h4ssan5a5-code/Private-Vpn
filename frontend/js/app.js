/**
 * frontend/js/app.js — Renderer Process Logic
 *
 * All UI interactions, state management, and communication
 * with the Electron main process via window.vpnAPI (defined in preload.js).
 *
 * Structure:
 *   1. DOM references
 *   2. App state
 *   3. Server dropdown logic
 *   4. Connect / Disconnect actions
 *   5. UI update functions
 *   6. Log console
 *   7. Uptime timer
 *   8. Window controls
 *   9. Initialization
 */

// ─── 1. DOM References ─────────────────────────────────────────────────────────

const dom = {
  statusCard:     document.getElementById('statusCard'),
  statusBadge:    document.getElementById('statusBadge'),
  statusDot:      document.getElementById('statusDot'),
  statusText:     document.getElementById('statusText'),
  shieldIcon:     document.getElementById('shieldIcon'),
  ipAddress:      document.getElementById('ipAddress'),
  ipTag:          document.getElementById('ipTag'),
  statsRow:       document.getElementById('statsRow'),
  statServer:     document.getElementById('statServer'),
  statCountry:    document.getElementById('statCountry'),
  statUptime:     document.getElementById('statUptime'),
  selectTrigger:  document.getElementById('selectTrigger'),
  selectChevron:  document.getElementById('selectChevron'),
  serverList:     document.getElementById('serverList'),
  selectedFlag:   document.getElementById('selectedFlag'),
  selectedName:   document.getElementById('selectedName'),
  selectedDetail: document.getElementById('selectedDetail'),
  connectBtn:     document.getElementById('connectBtn'),
  connectBtnLabel:document.getElementById('connectBtnLabel'),
  connectLoader:  document.getElementById('connectLoader'),
  logConsole:     document.getElementById('logConsole'),
  logEmpty:       document.getElementById('logEmpty'),
  logClearBtn:    document.getElementById('logClearBtn'),
  btnMinimize:    document.getElementById('btnMinimize'),
  btnClose:       document.getElementById('btnClose'),
};

// ─── 2. App State ──────────────────────────────────────────────────────────────

const appState = {
  connected: false,
  connecting: false,
  selectedServer: null,
  connectedAt: null,
  uptimeInterval: null,
  dropdownOpen: false,
};

// ─── 3. Server Dropdown ────────────────────────────────────────────────────────

/**
 * Builds the server list items from the VPN_SERVERS array (servers.js).
 */
function buildServerList() {
  dom.serverList.innerHTML = '';

  VPN_SERVERS.forEach((server) => {
    const li = document.createElement('li');
    li.className = 'server-item';
    li.setAttribute('role', 'option');
    li.dataset.serverId = server.id;

    // Load bar color: green < 40%, yellow < 70%, red >= 70%
    const loadColor = server.load < 40 ? '#4ade80' : server.load < 70 ? '#facc15' : '#f87171';

    li.innerHTML = `
      <span class="server-item__flag">${server.flag}</span>
      <div class="server-item__meta">
        <span class="server-item__name">${server.name}</span>
        <div class="server-item__stats">
          <span class="server-item__ping">${server.ping}ms</span>
          <div class="server-item__load-bar">
            <div class="server-item__load-fill" style="width:${server.load}%; background:${loadColor}"></div>
          </div>
          <span class="server-item__protocol">${server.protocol}</span>
        </div>
      </div>
    `;

    li.addEventListener('click', () => selectServer(server));
    dom.serverList.appendChild(li);
  });
}

/**
 * Opens or closes the server dropdown.
 */
function toggleDropdown(forceClose = false) {
  appState.dropdownOpen = forceClose ? false : !appState.dropdownOpen;
  dom.serverList.classList.toggle('server-list--open', appState.dropdownOpen);
  dom.selectChevron.classList.toggle('select-chevron--open', appState.dropdownOpen);
}

/**
 * Selects a server and updates the trigger display.
 */
function selectServer(server) {
  appState.selectedServer = server;

  // Update trigger display
  dom.selectedFlag.textContent = server.flag;
  dom.selectedName.textContent = server.name;
  dom.selectedDetail.textContent = `${server.ping}ms · ${server.load}% load`;

  // Highlight selected item
  document.querySelectorAll('.server-item').forEach((el) => {
    el.classList.toggle('server-item--active', el.dataset.serverId === server.id);
  });

  // Enable connect button (only if not already connected)
  if (!appState.connected && !appState.connecting) {
    dom.connectBtn.disabled = false;
  }

  toggleDropdown(true);
}

// Toggle dropdown on trigger click
dom.selectTrigger.addEventListener('click', () => {
  if (!appState.connected && !appState.connecting) toggleDropdown();
});

// Close dropdown on keyboard ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleDropdown(true);
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#serverSelectWrap')) toggleDropdown(true);
});

// ─── 4. Connect / Disconnect ───────────────────────────────────────────────────

dom.connectBtn.addEventListener('click', async () => {
  if (appState.connecting) return; // Prevent double-click

  if (appState.connected) {
    await handleDisconnect();
  } else {
    await handleConnect();
  }
});

async function handleConnect() {
  if (!appState.selectedServer) return;

  setConnectingUI(true);

  const result = await window.vpnAPI.connect(appState.selectedServer);

  if (!result.success) {
    // Connection failed — show error in logs and reset
    addLog('error', `Connection failed: ${result.error}`);
    setConnectingUI(false);
    return;
  }

  // Success state is handled via onStatusChange event from main process
}

async function handleDisconnect() {
  setDisconnectingUI(true);

  const result = await window.vpnAPI.disconnect();

  if (!result.success) {
    addLog('error', `Disconnect failed: ${result.error}`);
    setDisconnectingUI(false);
  }

  // Final state handled via onStatusChange event
}

// ─── 5. UI Update Functions ────────────────────────────────────────────────────

/**
 * Updates all UI elements based on VPN status.
 */
function updateUI(status) {
  appState.connected = status.connected;
  appState.connecting = status.connecting;

  if (status.connected) {
    setConnectedUI(status);
  } else if (status.connecting) {
    setConnectingUI(true);
  } else {
    setDisconnectedUI();
  }

  // Update IP display
  dom.ipAddress.textContent = status.connected ? status.virtualIp : status.realIp;
  dom.ipTag.textContent = status.connected ? 'VPN' : 'REAL';
  dom.ipTag.className = 'ip-tag ' + (status.connected ? 'ip-tag--vpn' : '');
}

function setConnectedUI(status) {
  // Status card
  dom.statusCard.className = 'status-card status-card--connected';
  dom.statusDot.className = 'status-dot status-dot--connected';
  dom.statusText.textContent = 'Protected';
  dom.shieldIcon.className = 'shield-icon shield-icon--connected';

  // Stats row
  dom.statsRow.style.display = 'flex';
  dom.statServer.textContent = status.server?.name?.split('—')[1]?.trim() || '—';
  dom.statCountry.textContent = status.server?.country || '—';

  // Start uptime timer
  appState.connectedAt = status.connectedAt ? new Date(status.connectedAt) : new Date();
  startUptimeTimer();

  // Button
  dom.connectBtnLabel.textContent = 'Disconnect';
  dom.connectBtn.className = 'connect-btn connect-btn--disconnect';
  dom.connectBtn.disabled = false;
  showBtnLabel(true);

  // Lock the server selector
  dom.selectTrigger.style.pointerEvents = 'none';
  dom.selectTrigger.style.opacity = '0.5';
}

function setDisconnectedUI() {
  // Status card
  dom.statusCard.className = 'status-card';
  dom.statusDot.className = 'status-dot';
  dom.statusText.textContent = 'Disconnected';
  dom.shieldIcon.className = 'shield-icon';

  // Hide stats
  dom.statsRow.style.display = 'none';
  stopUptimeTimer();

  // Button
  dom.connectBtnLabel.textContent = 'Connect';
  dom.connectBtn.className = 'connect-btn';
  dom.connectBtn.disabled = !appState.selectedServer;
  showBtnLabel(true);

  // Unlock server selector
  dom.selectTrigger.style.pointerEvents = '';
  dom.selectTrigger.style.opacity = '';
}

function setConnectingUI(isConnecting) {
  dom.connectBtn.disabled = true;
  dom.statusText.textContent = 'Connecting…';
  dom.statusDot.className = 'status-dot status-dot--connecting';
  showBtnLabel(!isConnecting);
  dom.connectLoader.style.display = isConnecting ? 'flex' : 'none';
}

function setDisconnectingUI() {
  dom.connectBtn.disabled = true;
  dom.statusText.textContent = 'Disconnecting…';
  dom.statusDot.className = 'status-dot status-dot--connecting';
}

/** Toggle between the label and loader spinner in the button */
function showBtnLabel(show) {
  dom.connectBtnLabel.closest('.connect-btn__content').style.display = show ? 'flex' : 'none';
  dom.connectLoader.style.display = show ? 'none' : 'flex';
}

// ─── 6. Activity Log ───────────────────────────────────────────────────────────

/**
 * Appends a new log entry to the log console.
 * Called both from IPC events and directly for UI messages.
 */
function addLog(level, message, timestamp) {
  // Remove "empty" placeholder
  dom.logEmpty.style.display = 'none';

  const entry = document.createElement('div');
  entry.className = `log-entry log-entry--${level}`;

  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  entry.innerHTML = `
    <span class="log-time">${time}</span>
    <span class="log-icon">${getLogIcon(level)}</span>
    <span class="log-msg">${escapeHtml(message)}</span>
  `;

  dom.logConsole.appendChild(entry);

  // Auto-scroll to bottom
  dom.logConsole.scrollTop = dom.logConsole.scrollHeight;
}

function getLogIcon(level) {
  switch (level) {
    case 'success': return '✓';
    case 'error':   return '✗';
    case 'warning': return '⚠';
    default:        return '›';
  }
}

/** Sanitize HTML to prevent XSS from log messages */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

dom.logClearBtn.addEventListener('click', () => {
  dom.logConsole.innerHTML = '';
  dom.logEmpty.style.display = '';
  dom.logConsole.appendChild(dom.logEmpty);
});

// ─── 7. Uptime Timer ───────────────────────────────────────────────────────────

function startUptimeTimer() {
  stopUptimeTimer();
  appState.uptimeInterval = setInterval(() => {
    if (!appState.connectedAt) return;
    const seconds = Math.floor((Date.now() - appState.connectedAt.getTime()) / 1000);
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    dom.statUptime.textContent = `${m}:${s}`;
  }, 1000);
}

function stopUptimeTimer() {
  if (appState.uptimeInterval) {
    clearInterval(appState.uptimeInterval);
    appState.uptimeInterval = null;
    dom.statUptime.textContent = '00:00';
  }
}

// ─── 8. Window Controls ────────────────────────────────────────────────────────

dom.btnMinimize.addEventListener('click', () => window.vpnAPI.minimizeWindow());
dom.btnClose.addEventListener('click', () => window.vpnAPI.closeWindow());

// ─── 9. IPC Event Listeners ────────────────────────────────────────────────────

/**
 * Receive real-time log entries pushed from main process (via vpnManager).
 */
window.vpnAPI.onLog((entry) => {
  addLog(entry.level, entry.message, entry.timestamp);
});

/**
 * Receive status changes pushed from main process (via vpnManager).
 */
window.vpnAPI.onStatusChange((status) => {
  updateUI(status);
  // Update IP display
  dom.ipAddress.textContent = status.connected ? status.virtualIp : status.realIp;
  dom.ipTag.textContent = status.connected ? 'VPN' : 'REAL';
  dom.ipTag.className = 'ip-tag ' + (status.connected ? 'ip-tag--vpn' : '');
});

// ─── 10. Initialization ────────────────────────────────────────────────────────

async function init() {
  buildServerList();

  // Load initial status (in case app was already connected when re-opened)
  const status = await window.vpnAPI.getStatus();
  updateUI(status);

  // Load initial IP
  const ipData = await window.vpnAPI.getIp();
  dom.ipAddress.textContent = ipData.ip;
  dom.ipTag.textContent = ipData.isVpn ? 'VPN' : 'REAL';
  if (ipData.isVpn) dom.ipTag.classList.add('ip-tag--vpn');

  addLog('info', 'NordShield VPN initialized. Ready to connect.');
}

// Run on page load
init();
