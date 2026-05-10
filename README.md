# 🛡️ NordShield VPN — Desktop VPN Client (MVP)

A modern, dark-themed desktop VPN application built with **Electron.js**, featuring a clean UI
inspired by ProtonVPN and Mullvad. Supports simulated VPN connections out of the box, with
ready-to-uncomment hooks for **WireGuard** and **OpenVPN** real integration.

---

## 📁 Project Structure

```
vpn-app/
├── main.js                    # Electron main process (window + IPC)
├── package.json               # Dependencies & scripts
├── README.md
│
├── backend/
│   └── vpnManager.js          # VPN connection logic (connect/disconnect/status)
│
├── frontend/
│   ├── index.html             # Main UI layout
│   ├── css/
│   │   └── styles.css         # Dark theme stylesheet
│   └── js/
│       ├── preload.js         # Electron context bridge (security layer)
│       ├── servers.js         # VPN server list data
│       └── app.js             # UI logic, IPC calls, event handling
│
└── config/
    ├── us-ny-01.conf          # Sample WireGuard config (fill with real keys)
    └── us-ny-01.ovpn          # Sample OpenVPN config (fill with real details)
```

---

## 🚀 Quick Start (5 Steps)

### Prerequisites
- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Step 1 — Clone or copy the project

```bash
cd ~/Desktop
# If from a zip, just extract it. Then:
cd vpn-app
```

### Step 2 — Install dependencies

```bash
npm install
```

This downloads Electron (~100MB on first install).

### Step 3 — Run the app

```bash
npm start
```

The desktop window will launch. The app runs in **simulation mode** by default — no VPN is
actually installed or required.

### Step 4 — Use the app

1. Click the **server dropdown** and choose a location (e.g. US — New York #1)
2. Click **Connect** — watch the logs and shield animate
3. Your displayed IP changes to the simulated VPN IP
4. Click **Disconnect** to return to your real IP

---

## 🔧 Enable Real VPN Integration

### Option A — WireGuard

1. **Install WireGuard** on your OS:
   - **macOS**: `brew install wireguard-tools`
   - **Linux**: `sudo apt install wireguard`
   - **Windows**: Download from https://www.wireguard.com/install/

2. **Get a real config** from a VPN provider (Mullvad, ProtonVPN, IVPN, etc.)
   and place the `.conf` file in the `config/` folder, named after the server ID
   (e.g. `us-ny-01.conf`).

3. **Enable in code** — open `backend/vpnManager.js`:
   - In the `connect()` function, **uncomment** the `wg-quick up` block
   - In the `disconnect()` function, **uncomment** the `wg-quick down` block
   - Comment out the simulated `await sleep(...)` lines above them

4. **Run with admin rights** (WireGuard requires elevated permissions):
   ```bash
   sudo npm start   # macOS/Linux
   # Windows: Run terminal as Administrator, then npm start
   ```

### Option B — OpenVPN

1. **Install OpenVPN**:
   - **macOS**: `brew install openvpn`
   - **Linux**: `sudo apt install openvpn`
   - **Windows**: Download from https://openvpn.net/community-downloads/

2. **Get a `.ovpn` config** from your VPN provider and place it in `config/`.

3. **Enable in code** — open `backend/vpnManager.js`:
   - In `connect()`, uncomment the `openvpn --config` block
   - In `disconnect()`, uncomment the `pkill openvpn` block

4. **Run with admin rights** (same as above).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Electron App                        │
│                                                     │
│  ┌─────────────────┐    IPC     ┌────────────────┐  │
│  │  Renderer       │◄──────────►│  Main Process  │  │
│  │  (frontend/)    │            │  (main.js)     │  │
│  │                 │  ipcMain   │                │  │
│  │  index.html     │  .handle() │  vpnManager.js │  │
│  │  app.js         │            │                │  │
│  │  styles.css     │  ipcMain   │  exec()        │  │
│  └────────┬────────┘  .on()     │  wg-quick      │  │
│           │                     │  openvpn       │  │
│           │  contextBridge      └────────────────┘  │
│           │  (preload.js)                           │
│           └─── window.vpnAPI ───────────────────►   │
└─────────────────────────────────────────────────────┘
```

### Key Electron Security Principles Used
- `contextIsolation: true` — renderer can't access Node.js directly
- `nodeIntegration: false` — renderer is sandboxed like a normal web page
- `contextBridge` — only explicitly whitelisted functions are exposed to renderer
- Content Security Policy meta tag in index.html

---

## 🎨 UI Features

| Feature | Details |
|---|---|
| **Theme** | Dark, #0d0f14 background |
| **Font** | DM Sans (display) + DM Mono (IP/stats) |
| **Shield** | Animated pulse rings when connected |
| **Status** | Real-time dot indicator (grey / amber blink / green) |
| **IP Display** | Shows real IP when off, VPN IP when on |
| **Server List** | Dropdown with ping, load bar, protocol badge |
| **Connect Button** | Shimmer hover, loading spinner, changes to Disconnect |
| **Stats Row** | Server, country, live uptime timer |
| **Log Console** | Color-coded entries with timestamp and icons |
| **Window** | Frameless with custom minimize/close buttons |

---

## 📦 Building a Distributable

```bash
npm run build
```

This uses `electron-builder` to create:
- `.dmg` installer on macOS
- `.exe` NSIS installer on Windows
- `.AppImage` on Linux

Output is in the `dist/` folder.

---

## 🛠️ Troubleshooting

**App doesn't open**
```bash
# Make sure Electron is installed
npm install
# Try running with more verbosity
./node_modules/.bin/electron . --verbose
```

**"wg-quick: command not found"**
- WireGuard is not installed. Either install it or use simulation mode.

**"Permission denied" on wg-quick**
- Run the app with sudo/admin rights.

**Blank white screen**
- Check DevTools console: in main.js, uncomment `mainWindow.webContents.openDevTools()`

---

## 🗺️ Roadmap (Beyond MVP)

- [ ] Real WireGuard/OpenVPN subprocess management with output parsing
- [ ] Kill switch (block all traffic if VPN drops)
- [ ] Auto-connect on startup
- [ ] Server ping tests (real latency measurement)
- [ ] Traffic stats (bytes in/out via `wg show`)
- [ ] System tray icon
- [ ] Persistent settings (last server, auto-connect)
- [ ] Multi-hop / double VPN support

---

## 📄 License

MIT — free to use, modify, and distribute.
