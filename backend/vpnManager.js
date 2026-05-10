const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const https = require('https');

let state = {
  connected: false,
  connecting: false,
  server: null,
  virtualIp: null,
  realIp: null, // ✅ dynamic now
  connectedAt: null
};

let logCallback = null;
let statusChangeCallback = null;

function log(level, message) {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    message
  };

  console.log(`[VPN ${level.toUpperCase()}] ${message}`);

  if (logCallback) logCallback(entry);
}

function emitStatus() {
  if (statusChangeCallback) statusChangeCallback(getStatus());
}

function execAsync(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (e, stdout, stderr) => {
      if (e) reject(new Error(stderr || e.message));
      else resolve(stdout.trim());
    });
  });
}

//
// ✅ NEW: Fetch Public IP
//
function fetchPublicIp() {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org', (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

//
// ✅ Initialize IP on app start
//
async function init() {
  try {
    const ip = await fetchPublicIp();
    state.realIp = ip;
    log('info', `Detected real IP: ${ip}`);
    emitStatus();
  } catch (err) {
    log('error', 'Failed to fetch public IP');
  }
}

init();

async function connect(server) {
  if (state.connected || state.connecting) {
    throw new Error('Already connected or connecting.');
  }

  state.connecting = true;
  emitStatus();

  try {
    log('info', `Connecting to ${server.name}...`);

    const configPath = path.join(__dirname, '../config/client1.conf');

    if (os.platform() === 'win32') {
      await execAsync(`wireguard.exe /installtunnelservice "${configPath}"`);
    } else {
      await execAsync(`wg-quick up "${configPath}"`);
    }

    log('success', 'Connection established.');

    state.connected = true;
    state.connecting = false;
    state.server = server;
    state.virtualIp = '10.0.0.2';
    state.connectedAt = new Date().toISOString();

    // ✅ Refresh public IP after VPN connect
    try {
      const ip = await fetchPublicIp();
      state.realIp = ip;
      log('info', `New public IP after VPN: ${ip}`);
    } catch {
      log('warning', 'Could not refresh IP after connect');
    }

    emitStatus();

    return {
      server,
      virtualIp: state.virtualIp,
      connectedAt: state.connectedAt
    };

  } catch (err) {
    state.connecting = false;
    emitStatus();
    log('error', err.message);
    throw err;
  }
}

async function disconnect() {
  if (!state.connected && !state.connecting) {
    return { message: 'Already disconnected.' };
  }

  try {
    const configName = 'client1';
    const configPath = path.join(__dirname, '../config/client1.conf');

    if (os.platform() === 'win32') {
      await execAsync(`wireguard.exe /uninstalltunnelservice ${configName}`);
    } else {
      await execAsync(`wg-quick down "${configPath}"`);
    }

    log('success', 'Connection closed.');

  } catch (err) {
    log('warning', err.message);
  }

  state = {
    ...state,
    connected: false,
    connecting: false,
    server: null,
    virtualIp: null,
    connectedAt: null
  };

  // ✅ Refresh public IP after disconnect
  try {
    const ip = await fetchPublicIp();
    state.realIp = ip;
    log('info', `Real IP restored: ${ip}`);
  } catch {
    log('warning', 'Could not refresh IP after disconnect');
  }

  emitStatus();

  return {
    message: 'Disconnected successfully.'
  };
}

function getStatus() {
  return { ...state };
}

//
// ✅ FIXED: Always return real public IP
//
async function getCurrentIp() {
  try {
    const ip = await fetchPublicIp();
    state.realIp = ip;

    return {
      ip,
      isVpn: state.connected
    };
  } catch {
    return {
      ip: state.realIp,
      isVpn: state.connected
    };
  }
}

function onLog(cb) {
  logCallback = cb;
}

function onStatusChange(cb) {
  statusChangeCallback = cb;
}

module.exports = {
  connect,
  disconnect,
  getStatus,
  getCurrentIp,
  onLog,
  onStatusChange
};