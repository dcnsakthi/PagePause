# 🚀 PagePause - Quick Start Guide

## TL;DR - Get Started in 60 Seconds

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/PagePause.git
cd PagePause

# Generate icons (Python required)
python generate_icons.py

# Start server
python -m http.server 8000

# Open browser
# Go to http://localhost:8000
```

## 📦 What You Get

✅ **Focus Timer** - Editable time display (click to edit 5-240 mins)  
✅ **Smart Breaks** - Automatic break reminders  
✅ **Quick Reminders** - Custom reminders with popup modal & snooze  
✅ **Task Tracker** - Manage reading list  
✅ **Eye Exercises** - 6 guided wellness exercises  
✅ **PWA Ready** - Install on mobile & desktop  
✅ **Offline Support** - Works without internet  
✅ **Zero Dependencies** - Pure vanilla JS  

## 🎬 Getting Started

### Step 1: Generate Icons (Required)

**Method A: Python Script (Recommended)**
```bash
python generate_icons.py
```

**Method B: Browser Tool**
1. Open `generate-icons.html` in browser
2. Click "Download All Icons"
3. Extract and place in `icons/` folder

### Step 2: Run Locally

Choose your preferred method:

**Python (Easiest)**
```bash
python -m http.server 8000
```

**Node.js**
```bash
npx http-server -p 8000
```

**PHP**
```bash
php -S localhost:8000
```

### Step 3: Open & Enjoy

Navigate to: **http://localhost:8000**

## 🎯 First Time Setup

### Allow Notifications
1. When prompted, click **Allow** for notifications
2. Required for reminders and break alerts
3. Change later in browser settings if needed

### Set Your Preferences
1. **Focus Time**: Click the number to edit (or use ↑↓ buttons)
2. **Timer Settings**: Expand to customize:
   - Focus period: 30 mins (how long to read)
   - Break period: 15 mins (how long to rest)
   - Enable/disable sounds
3. Click **Start focus timer**

## 💡 Key Features Quick Guide

### Editable Timer
- **Click the time number** to type custom value
- **Use ↑↓ buttons** to adjust by 5 minutes
- **Auto-validates**: Keeps between 5-240 minutes
- **Auto-rounds**: Rounds to nearest 5 when done editing

### Quick Reminders (NEW!)
1. Go to **Tasks** tab
2. Scroll to "Quick Reminders"
3. Type reminder text
4. Set time (use presets: 5, 7, 10, 15, 30 mins)
5. Click "Set Reminder"

**When reminder triggers:**
- 🎵 Audio alert plays
- 📱 Popup modal appears
- ⏰ Choose: **Snooze 5 min** or **Dismiss**
- 🎹 Press **ESC** to close

### Task Management
- Add reading tasks in **Tasks** tab
- Check off when complete
- Delete when done

### Eye Exercises
- View in **Mindfulness** tab
- 20-20-20 rule
- Blink, palm press, eye rolls
- Near/far focus, figure eight

## 📱 Install as App

### iOS (Safari)
1. Tap **Share** button
2. Tap "Add to Home Screen"
3. Name it "PagePause"

### Android (Chrome)
1. Tap **Menu** (⋮)
2. Tap "Install app"
3. Confirm installation

### Desktop (Chrome/Edge)
1. Click **Install** icon in address bar
2. Click "Install"

## 🌐 Deploy to GitHub Pages

```bash
# Initialize and push
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/PagePause.git
git push -u origin main
```

**Enable Pages:**
1. Go to repo **Settings**
2. Click **Pages**
3. Select `main` branch
4. Click **Save**
5. Live at: `https://YOUR-USERNAME.github.io/PagePause/`

## ⚙️ Customization

### Change Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #1a4d3e;
    --secondary-color: #4a9d7f;
    --accent-color: #ff6b6b;
    --warning: #ff9800;  /* Reminder color */
}
```

### Change Defaults
Edit state object in `app.js`:
```javascript
const state = {
    totalMinutes: 25,      // Default total time
    focusPeriod: 30,       // Focus duration
    breakPeriod: 15,       // Break duration
};
```

## 🆘 Quick Troubleshooting

**Notifications not working?**
- Check browser permissions (click 🔒 in address bar)
- Allow notifications for the site

**Icons showing 404 errors?**
- Run `python generate_icons.py`
- Or use `generate-icons.html` to create manually

**Timer not editable?**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

**Sounds not playing?**
- Click anywhere on page first (browsers require interaction)
- Check device volume
- Enable sounds in Timer Settings

**Reminders not appearing?**
- Allow notifications
- Check if modal popup is blocked
- Ensure JavaScript is enabled

## 💎 Pro Tips

✅ **Use 20-20-20 rule**: Every 20 mins, look 20 feet away for 20 seconds  
✅ **Set multiple reminders**: Stack reminders for complex tasks  
✅ **Snooze smartly**: Use snooze for important but flexible tasks  
✅ **Track progress**: Use Tasks tab to log reading sessions  
✅ **Mobile workflow**: Install as PWA for home screen access  
✅ **Keyboard shortcuts**: ESC closes reminder popup  
✅ **Break compliance**: Don't skip breaks - your eyes need rest!  

## 📖 Usage Examples

### Study Session
```
1. Set 120 minute focus time
2. Add task: "Study Chapter 5"
3. Set reminder: "Take notes break" at 30 mins
4. Start timer
5. Use breaks for eye exercises
```

### Reading Book
```
1. Set 60 minute focus time
2. Add task: "Read Novel - Chapter 3"
3. Set reminder: "Bookmark page" at 45 mins
4. Enable eye exercises on breaks
```

### Work Reading
```
1. Set 90 minute focus time
2. Add task: "Review Project Docs"
3. Set reminder: "Team meeting" at 75 mins
4. Set reminder: "Email response" at 15 mins
```

## 🎓 Learning the Interface

### Three Main Tabs
1. **Timer** - Set focus time and start sessions
2. **Tasks** - Manage reading list & quick reminders
3. **Mindfulness** - Eye wellness exercises

### Timer Controls
- **↑↓ Arrows** - Adjust time by 5 minutes
- **Time Number** - Click to type custom time
- **Start Button** - Begin focus session
- **Pause/Stop** - Control active session

### Reminder Controls
- **Text Input** - What to be reminded of
- **Minutes Input** - Custom time (1-999)
- **Preset Buttons** - Quick: 5, 7, 10, 15, 30
- **Set Reminder** - Activate reminder
- **❌ Cancel** - Remove active reminder

## 📚 Additional Resources

- **Full Documentation**: See README.md
- **Source Code**: Browse index.html, app.js, styles.css
- **Icon Generator**: Use generate-icons.html or generate_icons.py
- **GitHub Deployment**: Check .github/workflows/deploy.yml

## 🎉 You're Ready!

Start protecting your eyes while reading. Set a timer, add a task, and enjoy focused reading with smart breaks.

**Questions?** Check README.md for detailed documentation.

---

**PagePause** - Take care of your eyes, one page at a time 📖⏰
- Technical details

---

**Enjoy healthier reading! 📖👁️**
