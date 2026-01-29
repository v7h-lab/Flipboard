# Digital Flipboard

A virtual split-flap display with real-time remote control from any device.

![Digital Flipboard](./screenshot.png)

## Features

- **Realistic split-flap animation** - Authentic mechanical flip effect with sound
- **Remote control** - Control the board from your phone using QR code pairing
- **Real-time sync** - PeerJS WebRTC for instant updates
- **Dark/Light themes** - Toggle display appearance
- **Sound profiles** - Choose between default and mechanical sounds

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Remote Control

1. Click the **REMOTE** button on the main display
2. Scan the QR code with your mobile device
3. Type a message and tap **SEND TO BOARD**

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/flipboard)

Or manually:

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

## How It Works

### Connection Modes

| Environment | Mode | Description |
|-------------|------|-------------|
| Development | WebSocket | Uses Vite dev server relay (same WiFi only) |
| Production | PeerJS | Direct peer-to-peer WebRTC connection |

In production, the app automatically uses PeerJS which works across any network - the host and remote don't need to be on the same WiFi.

### Security

- No API keys or secrets required
- No data stored on servers - communication is peer-to-peer
- Room IDs are randomly generated 8-character strings
- All WebRTC data channels are encrypted (DTLS)

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- PeerJS (WebRTC)
- QRCode.react

## License

MIT
