# 📱 Anonymous Chat - Mobile App

A WhatsApp-style end-to-end encrypted anonymous chat application that works as a Progressive Web App (PWA) and can be installed like a native mobile app.

## ✨ Features

- 🔐 **End-to-end encryption** with AES-256-GCM
- 📱 **Mobile app experience** - installable PWA
- 💬 **WhatsApp-style UI/UX** with dark theme
- 🔍 **Message search** functionality
- 🗑️ **Clear chat** option
- 😀 **Emoji picker** and reactions
- 💬 **Reply to messages**
- 📎 **File sharing** (images, documents)
- 👥 **Anonymous users** with random names
- ⚡ **Real-time messaging** with Socket.IO
- 📱 **Touch gestures** and mobile optimization

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
# Go to http://localhost:3000
```

### 📱 Install as Mobile App

1. Open the app URL in mobile browser
2. Tap the "Install App" banner
3. App installs to home screen like a native app!

## 🌐 Deploy to Production

### Option 1: Render.com (Recommended - Free)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - New + → Web Service
   - Connect your repo
   - Build Command: `npm install`
   - Start Command: `npm start`

### Option 2: Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option 3: Heroku

```bash
heroku create your-app-name
git push heroku main
```

### Option 4: Vercel

```bash
npm install -g vercel
vercel
```

## 🔧 Deployment Helper

Run the deployment helper for step-by-step guidance:

```bash
npm run deploy
```

## 📱 Mobile App Features

- ✅ **Installable** - Works like native app
- ✅ **Offline capable** - Cached for offline use
- ✅ **Push notifications** ready (can be enabled)
- ✅ **App icons** - Professional chat bubble icons
- ✅ **Fullscreen** - No browser UI when installed
- ✅ **Auto-updates** - Updates when web version updates

## 🔐 Security

- **AES-256-GCM encryption** for all messages
- **Client-side encryption** - server cannot read messages
- **Random initialization vectors** for each message
- **Anonymous users** - no registration required
- **No message persistence** - messages cleared on server restart

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Real-time:** Socket.IO
- **Encryption:** Web Crypto API
- **PWA:** Service Worker, Web App Manifest
- **Mobile:** Progressive Web App (PWA)

## 📂 Project Structure

```
anonymous-chat/
├── index.html          # Main app interface
├── style.css           # WhatsApp-style CSS
├── script.js           # Client-side JavaScript
├── server.js           # Node.js server
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── package.json        # Dependencies
├── icons/             # App icons
└── deployment files   # Procfile, vercel.json, etc.
```

## 🌍 Browser Support

- ✅ **Chrome/Edge** (Android, Desktop)
- ✅ **Safari** (iOS, macOS)
- ✅ **Firefox** (Android, Desktop)
- ✅ **Samsung Internet**
- ✅ **All modern mobile browsers**

## 📱 Installation Guide

### Android
1. Open Chrome browser
2. Go to your deployed app URL
3. Tap "Install" banner or Chrome menu → "Add to Home screen"

### iOS
1. Open Safari browser
2. Go to your deployed app URL
3. Tap Share button → "Add to Home Screen"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🎯 Next Steps

1. **Deploy** using one of the hosting options above
2. **Test** PWA installation on mobile devices
3. **Share** the URL - users can install from any browser
4. **Customize** colors, icons, or features as needed

Your anonymous chat is now ready to be a mobile app! 🚀📱