# 📖 PagePause

**Your Reading Companion for Healthier Eyes**

PagePause is a sophisticated Progressive Web App (PWA) designed to protect your eyes while reading books and digital content. With customizable focus timers, break reminders, quick reminders with popup notifications, and eye wellness exercises, PagePause helps you maintain healthy reading habits across all devices.

![PagePause Preview](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge)
![Responsive](https://img.shields.io/badge/Design-Responsive-blue?style=for-the-badge)
![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-green?style=for-the-badge)

## ✨ Features

### 🎯 Core Functionality
- **Editable Focus Timer**: Click and edit reading time from 5 to 240 minutes
- **Smart Break System**: Automatic break reminders based on configurable intervals
- **Quick Reminders with Popup**: Set custom reminders while reading with beautiful modal notifications
  - Custom time intervals (1-999 minutes)
  - Quick presets: 5, 7, 10, 15, 30 minutes
  - Live countdown display
  - **Snooze functionality** - Snooze reminders for 5 more minutes
  - **Popup modal** with sound alerts and dismiss options
  - Press **ESC** or click close button to dismiss
- **Eye Wellness Exercises**: Guided exercises including the 20-20-20 rule, blink exercises, and more
- **Task Management**: Track what you're reading during focus sessions
- **Sound Cues**: Optional audio notifications for session starts and breaks
- **Browser Notifications**: Desktop and mobile notifications even when the tab is inactive

### 🎨 Design & UX
- **Elegant Dark Theme**: Eye-friendly dark interface perfect for extended reading
- **Responsive Design**: Seamlessly adapts to any screen size from mobile to desktop
- **Smooth Animations**: Beautiful transitions and visual feedback
- **Accessibility First**: Keyboard navigation, ARIA labels, and screen reader support

### 📱 Progressive Web App
- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Works without internet connection
- **Native-like Experience**: Full-screen mode with native app feel
- **Background Notifications**: Stay updated even when the app isn't open

## 🚀 Quick Start

### Method 1: Quick Local Setup (Fastest)

1. **Clone or download this repository**
```bash
git clone https://github.com/yourusername/PagePause.git
cd PagePause
```

2. **Generate Icons**
```bash
# Option A: Use Python script (recommended)
python generate_icons.py

# Option B: Use browser tool
# Open generate-icons.html in browser and download icons manually
```

3. **Serve the application**

**Option A: Using Python (Recommended)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Using Node.js**
```bash
npm install -g http-server
http-server -p 8000
```

**Option C: Using PHP**
```bash
php -S localhost:8000
```

4. **Open your browser**
   - Navigate to `http://localhost:8000`
   - Start using PagePause!

### Method 2: Deploy Directly to GitHub Pages

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: PagePause"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/PagePause.git
git push -u origin main
```

2. **Enable GitHub Pages**
   - Go to repository **Settings**
   - Navigate to **Pages** section
   - Under **Source**, select `main` branch
   - Click **Save**
   - Your site will be live at `https://YOUR-USERNAME.github.io/PagePause/`

## 🎯 How to Use

### Setting Your Focus Time

1. **Click the number** to edit focus time directly (5-240 minutes)
2. **Use ↑↓ buttons** to adjust in 5-minute increments
3. **Type any value** and it rounds to nearest 5 minutes
4. **Configure Settings**: 
   - Expand "Timer Settings" to customize:
     - Focus period (15-60 minutes)
     - Break period (5-20 minutes)
     - Sound notifications
     - Eye exercise reminders

### Quick Reminders Feature 🆕

**Setting a Reminder:**
1. Go to **Tasks** tab
2. Scroll to "Quick Reminders" section
3. Enter reminder text (e.g., "Call dad", "Check oven")
4. Set time:
   - Type custom minutes (1-999), OR
   - Click preset button (5, 7, 10, 15, 30 mins)
5. Click "Set Reminder"

**When Reminder Triggers:**
- 🔔 Beautiful popup modal appears
- 🎵 Three-tone audio alert plays
- ⏰ **Two options:**
  - **Snooze 5 min** - Delay reminder for 5 more minutes
  - **Dismiss** - Close and remove reminder
- 🎹 Press **ESC** key to dismiss
- 🖱️ Click backdrop to close

**Managing Active Reminders:**
- See live countdown for each reminder
- Cancel any reminder with ❌ button
- Multiple reminders run independently
- Survives page refresh

**Use Cases:**
- "Take medication in 10 mins"
- "Meeting in 30 minutes"
- "Check on dinner in 15 mins"
- "Switch laundry in 20 mins"

### During a Focus Session

- **Timer Display**: Shows current session progress with visual countdown
- **Pause/Resume**: Take unexpected breaks without losing progress
- **Stop**: End the session early if needed
- View session count: "Session X of Y"

### Break Time

- Automatic transition to break mode
- Optional guided eye exercises
- Notifications remind you to rest
- Resumes focus automatically after break ends

### Managing Reading Tasks

1. Switch to the **Tasks** tab
2. Add what you're reading in the input field
3. Check off completed readings
4. Delete tasks when done

### Eye Wellness Exercises

Switch to the **Mindfulness break** tab to view:
- 20-20-20 Rule
- Blink exercises
- Eye rolls
- Palm press technique
- Near & far focus
- Figure eight tracing
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 📱 Install as Mobile App

### iOS (iPhone/iPad)

1. Open PagePause in **Safari**
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "PagePause" and tap **Add**
5. The app icon will appear on your home screen

### Android

1. Open PagePause in **Chrome**
2. Tap the **Menu** button (three dots)
3. Tap **Add to Home screen** or **Install app**
4. Confirm by tapping **Add** or **Install**
5. The app will be installed like a native app

### Desktop (Chrome, Edge, Opera)

1. Open PagePause in your browser
2. Look for the **Install** icon in the address bar
3. Click **Install**
4. The app will open in its own window

## 🎯 How to Use

### Starting a Focus Session

1. **Set Your Time**: Use the ↑↓ buttons to adjust total reading time (5-240 minutes)
2. **Configure Settings**: 
   - Expand "Timer Settings" to customize:
     - Focus period (15-60 minutes)
     - Break period (5-20 minutes)
     - Sound notifications
     - Eye exercise reminders
3. **Optional**: Check "Skip breaks" for continuous reading
4. **Start**: Click "Start focus timer"

### During a Session

- **Timer Display**: Shows current session progress with visual countdown
- **Pause/Resume**: Take unexpected breaks without losing progress
- **Stop**: End the session early if needed
- View session count: "Session X of Y"

### Break Time

- Automatic transition to break mode
- Optional guided eye exercises
- Notifications remind you to rest
- Resumes focus automatically after break ends

### Managing Reading Tasks

1. Switch to the **Tasks** tab
2. Add what you're reading in the input field
3. Check off completed readings
4. Delete tasks when done

### Eye Wellness Exercises

Switch to the **Mindfulness break** tab to view:
- 20-20-20 Rule
- Blink exercises
- Eye rolls
- Palm press technique
- Near & far focus
- Figure eight tracing

## 🔧 Customization

### Modifying Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #1a4d3e;
    --secondary-color: #4a9d7f;
    --accent-color: #ff6b6b;
    /* Add your custom colors */
}
```

### Changing Timer Defaults

Edit the state object in `app.js`:

```javascript
const state = {
    totalMinutes: 25,      // Default total time
    focusPeriod: 30,       // Default focus duration
    breakPeriod: 15,       // Default break duration
    // ... more settings
};
```

### Adding More Eye Exercises

Add new exercise cards in `index.html`:

```html
<div class="exercise-card">
    <div class="exercise-icon">🎯</div>
    <h3>Your Exercise Name</h3>
    <p>Exercise description and instructions.</p>
</div>
```

## 📁 Project Structure

```
PagePause/
├── index.html              # Main HTML file
├── styles.css              # All styling (1200+ lines)
├── app.js                  # Application logic (800+ lines)
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── generate-icons.html     # Browser-based icon generator tool
├── generate_icons.py       # Python script to generate icons
├── icons/                  # App icons (generated)
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment
├── .vscode/
│   ├── extensions.json     # Recommended extensions
│   └── launch.json         # Debug configuration
├── README.md               # This file
└── QUICKSTART.md           # Quick reference guide
```

## 🎨 Features in Detail

### Timer System
- **Editable time display**: Click to edit, automatically validates and rounds
- **Smart validation**: Min 5 mins, max 240 mins (4 hours)
- **Auto-save**: All settings persist in localStorage
- **Session tracking**: Counts completed focus/break cycles
- **Pause/resume**: Flexible control without losing progress

### Reminder System
- **Popup modal notifications**: Beautiful centered overlay with backdrop blur
- **Snooze functionality**: Delay reminders by 5 minutes
- **Live countdown**: Real-time display updates every second
- **Multiple reminders**: Run unlimited reminders simultaneously
- **Persistent**: Survives page refresh and continues countdown
- **Smart audio**: Three-tone alert (C-G-A notes) for attention
- **Keyboard shortcuts**: ESC to dismiss, Enter to set
- **Mobile optimized**: Touch-friendly buttons and responsive layout

### Design System
- **Custom logo**: Open book with clock badge representing reading + time management
- **Color scheme**: Professional dark theme with green primary and orange accents
- **CSS variables**: Easy customization of all colors
- **Smooth animations**: Slide, fade, bounce, and scale effects
- **Responsive typography**: Fluid scaling with clamp()
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## 🔒 Privacy

PagePause respects your privacy:
- ✅ **No tracking**: No analytics or tracking scripts
- ✅ **No server**: All data stays on your device
- ✅ **No account required**: No sign-up or personal information needed
- ✅ **Local storage only**: Tasks and settings stored in browser localStorage
- ✅ **No cookies**: No cookies used

## 🌟 Browser Support

| Browser | Desktop | Mobile | PWA Install |
|---------|---------|--------|-------------|
| Chrome  | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ⚠️ Limited |
| Safari  | ✅ | ✅ | ✅ |
| Edge    | ✅ | ✅ | ✅ |
| Opera   | ✅ | ✅ | ✅ |

## 💡 Tips for Best Results

1. **20-20-20 Rule**: Every 20 minutes, look at something 20 feet away for 20 seconds
2. **Adjust Brightness**: Match your screen brightness to ambient lighting
3. **Proper Distance**: Keep screens 20-26 inches from your eyes
4. **Take Real Breaks**: Stand up, stretch, and move during breaks
5. **Stay Hydrated**: Drink water to prevent dry eyes
6. **Regular Eye Exams**: Visit an eye doctor annually

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid & Flexbox
- **Vanilla JavaScript**: No frameworks or dependencies
- **Web APIs**: 
  - Service Worker API
  - Notification API
  - Web Audio API
  - LocalStorage API
  - Manifest API

### Performance
- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: < 100KB (uncompressed)
- **First Paint**: < 1s
- **Offline Ready**: Full functionality without internet

## 🐛 Troubleshooting

### Notifications Not Working

1. Check browser notification permissions
2. Ensure the site is served over HTTPS (or localhost)
3. Enable notifications in Settings tab

### PWA Not Installing

1. Ensure you're using HTTPS (required for PWA)
2. Check that `manifest.json` is loading correctly
3. Verify service worker is registered (check DevTools)

### Sounds Not Playing

1. Check if sound toggles are enabled in Settings
2. Verify browser allows audio autoplay
3. Interact with page first (browsers require user gesture)

### Timer Not Accurate

1. Browsers may throttle timers in background tabs
2. This is expected behavior for power saving
3. Use notifications to stay updated when tab is inactive

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 💬 Support

If you find PagePause helpful, please:
- ⭐ Star this repository
- 📢 Share with fellow readers
- 🐛 Report issues
- 💡 Suggest improvements

## 🙏 Credits

Created with ❤️ for readers who care about their eye health.

**PagePause** - Take care of your eyes, one page at a time 📖

---

**Built with modern web technologies • No dependencies • Privacy-first • Open source**
