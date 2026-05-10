/**
 * frontend/js/servers.js — VPN Server List
 *
 * Defines the available VPN servers shown in the UI dropdown.
 * In a real app, this would be fetched from a backend API.
 *
 * Fields:
 *   id       - Matches config file name (e.g. us-ny-01.conf for WireGuard)
 *   name     - Display name
 *   country  - Country label
 *   flag     - Emoji flag
 *   ping     - Simulated latency in ms
 *   load     - Server load percentage (0–100)
 *   protocol - VPN protocol hint
 */

const VPN_SERVERS = [
  {
    id: 'us-ny-01',
    name: 'US — New York #1',
    country: 'United States',
    flag: '🇺🇸',
    ping: 18,
    load: 32,
    protocol: 'WireGuard',

    config: {
      address: "157.245.147.176:51820",
      publicKey: "Vu9rHOcBAIA4DpNy3CCxBVG0e4se8CCB84lMnP3JvGM=",
      allowedIPs: "0.0.0.0/0",
      dns: "8.8.8.8"
    }
  },

  {
    id: 'de-fra-01',
    name: 'DE — Frankfurt #1',
    country: 'Germany',
    flag: '🇩🇪',
    ping: 24,
    load: 47,
    protocol: 'WireGuard',
  },
  {
    id: 'jp-tok-01',
    name: 'JP — Tokyo #1',
    country: 'Japan',
    flag: '🇯🇵',
    ping: 89,
    load: 61,
    protocol: 'OpenVPN',
  },
  {
    id: 'nl-ams-01',
    name: 'NL — Amsterdam #1',
    country: 'Netherlands',
    flag: '🇳🇱',
    ping: 31,
    load: 22,
    protocol: 'WireGuard',
  },
  {
    id: 'sg-sin-01',
    name: 'SG — Singapore #1',
    country: 'Singapore',
    flag: '🇸🇬',
    ping: 112,
    load: 55,
    protocol: 'WireGuard',
  },
];
