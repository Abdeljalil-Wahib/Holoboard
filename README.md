# 🎨 Holoboard

A real-time collaborative whiteboard with a stunning holographic UI, built with Next.js and Socket.IO.



## ✨ Features

- 🎨 **Drawing Tools**: Pen, shapes (rectangle, circle, line), text, and eraser
- 🤝 **Real-time Collaboration**: Up to 5 users can draw together simultaneously
- 👁️ **Live Cursors**: See other users' cursors in real-time
- 🎭 **Customizable Avatars**: Choose from 6 unique avatar presets
- 🌈 **Holographic UI**: Beautiful cyan/purple gradient theme with glowing effects
- ⚡ **Smooth Performance**: Built with React Konva for optimal canvas rendering
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ↩️ **Undo/Redo**: Full history support for your drawings
- 🎨 **Customization**: Adjust colors, stroke width, opacity, and glow intensity
- 💾 **Persistent Rooms**: Room state is maintained on the server

## 🚀 Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React Konva** - Canvas rendering
- **Socket.IO Client** - Real-time communication

### Backend

- **Fastify** - Fast web server
- **Socket.IO** - WebSocket server
- **TypeScript** - Type safety

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/holoboard.git
cd holoboard
```

2. Install dependencies:

```bash
# Install web dependencies
cd packages/web
npm install

# Install server dependencies
cd ../server
npm install
```

3. Start the development servers:

```bash
# Terminal 1 - Start the Socket.IO server
cd packages/server
npm run dev

# Terminal 2 - Start the Next.js app
cd packages/web
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Project Structure

```
holoboard/
├── packages/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (home)/  # Home page
│   │   │   │   ├── board/   # Whiteboard room
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   └── lib/
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── server/              # Socket.IO backend
│       ├── src/
│       │   └── index.ts
│       └── package.json
│
├── DEPLOYMENT.md            # Deployment guide
└── README.md
```

## 🎮 Usage

1. **Create/Join a Room**: Enter a username and optional room ID on the home page
2. **Select Tools**: Right-click anywhere to open the orbital tool selector, or use keyboard shortcuts
3. **Draw Together**: Invite others by sharing the room URL
4. **Customize**: Use the sidebar to adjust colors, stroke width, and other properties

### Keyboard Shortcuts

- `P` - Pen tool
- `S` - Select tool
- `E` - Eraser tool
- `C` - Circle tool
- `R` - Rectangle tool
- `L` - Line tool
- `T` - Text tool
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Alt` - Toggle sidebar
- `Del/Backspace` - Delete selected shapes

