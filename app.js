// PagePause - Eye Wellness Timer for Readers
// State Management
const state = {
    totalMinutes: 25,
    focusPeriod: 30,
    breakPeriod: 15,
    skipBreaks: false,
    startFocusTone: true,
    startBreakTone: true,
    eyeExercises: true,
    isTimerRunning: false,
    isPaused: false,
    currentSession: 0,
    totalSessions: 0,
    isBreak: false,
    timeRemaining: 0,
    timerInterval: null,
    tasks: [],
    reminders: []
};

// Audio Context for Tones
let audioContext;
let hasInteracted = false;

// Initialize audio context on first user interaction
function initAudio() {
    if (!hasInteracted) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        hasInteracted = true;
    }
}

// Play tone
function playTone(frequency = 440, duration = 200, type = 'sine') {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

// Notification helpers
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
}

function showNotification(title, body, icon = 'icons/icon-192.png') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon,
            badge: 'icons/icon-192.png',
            tag: 'pagepause-timer'
        });
    }
}

// DOM Elements
const elements = {
    // Timer Setup
    timeValue: document.getElementById('timeValue'),
    increaseTime: document.getElementById('increaseTime'),
    decreaseTime: document.getElementById('decreaseTime'),
    breaksInfo: document.getElementById('breaksInfo'),
    skipBreaks: document.getElementById('skipBreaks'),
    startButton: document.getElementById('startButton'),
    
    // Settings
    startFocusTone: document.getElementById('startFocusTone'),
    startBreakTone: document.getElementById('startBreakTone'),
    breakPeriod: document.getElementById('breakPeriod'),
    focusPeriod: document.getElementById('focusPeriod'),
    eyeExercises: document.getElementById('eyeExercises'),
    
    // Active Timer
    activeTimer: document.getElementById('activeTimer'),
    timerType: document.getElementById('timerType'),
    countdownText: document.getElementById('countdownText'),
    progressCircle: document.getElementById('progressCircle'),
    sessionInfo: document.getElementById('sessionInfo'),
    pauseButton: document.getElementById('pauseButton'),
    stopButton: document.getElementById('stopButton'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Tasks
    taskInput: document.getElementById('taskInput'),
    addTaskButton: document.getElementById('addTaskButton'),
    taskList: document.getElementById('taskList'),
    
    // Reminders
    reminderInput: document.getElementById('reminderInput'),
    reminderMinutes: document.getElementById('reminderMinutes'),
    setReminderButton: document.getElementById('setReminderButton'),
    remindersList: document.getElementById('remindersList'),
    presetButtons: document.querySelectorAll('.preset-button'),
    
    // Reminder Modal
    reminderModal: document.getElementById('reminderModal'),
    reminderModalText: document.getElementById('reminderModalText'),
    closeReminderModal: document.getElementById('closeReminderModal'),
    snoozeReminder: document.getElementById('snoozeReminder'),
    dismissReminder: document.getElementById('dismissReminder'),
    
    // Stop Timer Confirmation Modal
    stopTimerModal: document.getElementById('stopTimerModal'),
    cancelStopTimer: document.getElementById('cancelStopTimer'),
    confirmStopTimer: document.getElementById('confirmStopTimer')
};

// Initialize
function init() {
    loadStateFromStorage();
    updateUI();
    setupEventListeners();
    renderTasks();
    renderReminders();
    updateVisitCount();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}

// Load state from localStorage
function loadStateFromStorage() {
    const saved = localStorage.getItem('pagepause-state');
    if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check if timer was running
        const wasTimerRunning = parsed.isTimerRunning;
        const timerEndTime = parsed.timerEndTime;
        const sessionStartTime = parsed.sessionStartTime;
        
        // Restore all settings
        Object.assign(state, parsed);
        state.timerInterval = null; // Will be recreated
        
        // Restore active timer if it was running
        if (wasTimerRunning && timerEndTime) {
            const now = Date.now();
            const remainingMs = timerEndTime - now;
            
            if (remainingMs > 0) {
                // Timer still has time left, restore it
                state.isTimerRunning = true;
                state.isPaused = false;
                state.timeRemaining = Math.ceil(remainingMs / 1000);
                
                // Show active timer after UI loads
                setTimeout(() => {
                    document.querySelector('.timer-section').style.display = 'none';
                    elements.activeTimer.classList.remove('hidden');
                    updateTimerDisplay();
                    
                    // Resume countdown
                    state.timerInterval = setInterval(updateTimer, 1000);
                    
                    // Notify user
                    showNotification('Timer Resumed', `Continuing your ${state.isBreak ? 'break' : 'focus'} session`);
                }, 100);
            } else {
                // Timer expired while page was closed, reset
                state.isTimerRunning = false;
                state.isPaused = false;
            }
        } else {
            state.isTimerRunning = false;
            state.isPaused = false;
        }
    }
    
    const savedTasks = localStorage.getItem('pagepause-tasks');
    if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
    }
    
    const savedReminders = localStorage.getItem('pagepause-reminders');
    if (savedReminders) {
        state.reminders = JSON.parse(savedReminders);
        // Restart active reminders
        state.reminders.forEach(reminder => {
            if (reminder.endTime) {
                // Recalculate remaining time
                const now = Date.now();
                const remainingMs = reminder.endTime - now;
                if (remainingMs > 0) {
                    startReminderTimer(reminder);
                } else {
                    // Reminder already expired, remove it
                    removeReminder(reminder.id);
                }
            }
        });
    }
}

// Save state to localStorage
function saveStateToStorage() {
    const toSave = { ...state };
    delete toSave.timerInterval;
    
    // Calculate timer end time if running
    if (state.isTimerRunning && state.timeRemaining > 0) {
        toSave.timerEndTime = Date.now() + (state.timeRemaining * 1000);
        toSave.sessionStartTime = Date.now();
    } else {
        toSave.timerEndTime = null;
        toSave.sessionStartTime = null;
    }
    
    localStorage.setItem('pagepause-state', JSON.stringify(toSave));
}

// Save tasks to localStorage
function saveTasksToStorage() {
    localStorage.setItem('pagepause-tasks', JSON.stringify(state.tasks));
}

// Save reminders to localStorage
function saveRemindersToStorage() {
    const toSave = state.reminders.map(r => ({
        ...r,
        timeoutId: null,
        intervalId: null
    }));
    localStorage.setItem('pagepause-reminders', JSON.stringify(toSave));
}

// Update UI from state
function updateUI() {
    elements.timeValue.value = state.totalMinutes;
    elements.skipBreaks.checked = state.skipBreaks;
    elements.startFocusTone.checked = state.startFocusTone;
    elements.startBreakTone.checked = state.startBreakTone;
    elements.breakPeriod.value = state.breakPeriod;
    elements.focusPeriod.value = state.focusPeriod;
    elements.eyeExercises.checked = state.eyeExercises;
    
    updateBreaksInfo();
}

// Calculate and display breaks
function updateBreaksInfo() {
    if (state.skipBreaks) {
        elements.breaksInfo.innerHTML = 'You\'ll have <strong>0</strong> breaks.';
        return;
    }
    
    const sessions = Math.floor(state.totalMinutes / state.focusPeriod);
    const breaks = Math.max(0, sessions - 1);
    state.totalSessions = sessions;
    
    elements.breaksInfo.innerHTML = `You'll have <strong>${breaks}</strong> break${breaks !== 1 ? 's' : ''}.`;
}

// Setup Event Listeners
function setupEventListeners() {
    // Timer controls
    elements.increaseTime.addEventListener('click', () => {
        initAudio();
        state.totalMinutes = Math.min(240, state.totalMinutes + 5);
        elements.timeValue.value = state.totalMinutes;
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.decreaseTime.addEventListener('click', () => {
        initAudio();
        state.totalMinutes = Math.max(5, state.totalMinutes - 5);
        elements.timeValue.value = state.totalMinutes;
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    // Direct time input
    elements.timeValue.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 5;
        // Clamp value between 5 and 240
        value = Math.max(5, Math.min(240, value));
        state.totalMinutes = value;
        updateBreaksInfo();
    });
    
    elements.timeValue.addEventListener('change', (e) => {
        // Round to nearest 5 on blur/change
        let value = parseInt(e.target.value) || 5;
        value = Math.max(5, Math.min(240, value));
        value = Math.round(value / 5) * 5;
        state.totalMinutes = value;
        elements.timeValue.value = value;
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.skipBreaks.addEventListener('change', (e) => {
        state.skipBreaks = e.target.checked;
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.startButton.addEventListener('click', startTimer);
    elements.pauseButton.addEventListener('click', togglePause);
    elements.stopButton.addEventListener('click', stopTimer);
    
    // Settings
    elements.startFocusTone.addEventListener('change', (e) => {
        state.startFocusTone = e.target.checked;
        saveStateToStorage();
    });
    
    elements.startBreakTone.addEventListener('change', (e) => {
        state.startBreakTone = e.target.checked;
        saveStateToStorage();
    });
    
    elements.breakPeriod.addEventListener('change', (e) => {
        state.breakPeriod = parseInt(e.target.value);
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.focusPeriod.addEventListener('change', (e) => {
        state.focusPeriod = parseInt(e.target.value);
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.eyeExercises.addEventListener('change', (e) => {
        state.eyeExercises = e.target.checked;
        saveStateToStorage();
    });
    
    // Tabs
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            initAudio();
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Tasks
    elements.addTaskButton.addEventListener('click', addTask);
    elements.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Reminders
    elements.setReminderButton.addEventListener('click', setReminder);
    elements.reminderInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            setReminder();
        }
    });
    
    // Preset buttons
    elements.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            elements.reminderMinutes.value = minutes;
        });
    });
    
    // Reminder Modal
    elements.closeReminderModal.addEventListener('click', dismissCurrentReminder);
    elements.snoozeReminder.addEventListener('click', snoozeCurrentReminder);
    elements.dismissReminder.addEventListener('click', dismissCurrentReminder);
    
    // Close modal on backdrop click
    elements.reminderModal.addEventListener('click', (e) => {
        if (e.target === elements.reminderModal) {
            dismissCurrentReminder();
        }
    });
    
    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.reminderModal.style.display === 'flex') {
                dismissCurrentReminder();
            }
            if (elements.stopTimerModal.classList.contains('show')) {
                closeStopTimerModal();
            }
        }
    });
    
    // Stop Timer Confirmation Modal
    elements.cancelStopTimer.addEventListener('click', closeStopTimerModal);
    elements.confirmStopTimer.addEventListener('click', handleConfirmStopTimer);
    
    // Close modal on backdrop click
    elements.stopTimerModal.addEventListener('click', (e) => {
        if (e.target === elements.stopTimerModal) {
            closeStopTimerModal();
        }
    });
}

// Switch tabs
function switchTab(tabName) {
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    elements.tabContents.forEach(content => {
        if (content.id === tabName) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Start Timer
function startTimer() {
    initAudio();
    
    if (state.isTimerRunning) return;
    
    state.isTimerRunning = true;
    state.currentSession = 1;
    state.isBreak = false;
    state.timeRemaining = state.focusPeriod * 60;
    
    // Hide setup, show active timer
    document.querySelector('.timer-section').style.display = 'none';
    elements.activeTimer.classList.remove('hidden');
    
    // Play start tone
    if (state.startFocusTone) {
        playTone(523.25, 200); // C5
        setTimeout(() => playTone(659.25, 300), 250); // E5
    }
    
    // Show notification
    showNotification('Focus Session Started', `Let's focus for ${state.focusPeriod} minutes! 📖`);
    
    // Update display
    updateTimerDisplay();
    
    // Start countdown
    state.timerInterval = setInterval(updateTimer, 1000);
    
    // Save state
    saveStateToStorage();
}

// Update Timer
function updateTimer() {
    if (state.isPaused) return;
    
    state.timeRemaining--;
    
    if (state.timeRemaining <= 0) {
        handleSessionComplete();
    } else {
        updateTimerDisplay();
        
        // Save state every 10 seconds to persist timer
        if (state.timeRemaining % 10 === 0) {
            saveStateToStorage();
        }
    }
}

// Handle session complete
function handleSessionComplete() {
    if (state.isBreak) {
        // Break finished, start next focus session
        state.currentSession++;
        
        if (state.currentSession > state.totalSessions) {
            // All sessions complete
            completeTimer();
            return;
        }
        
        state.isBreak = false;
        state.timeRemaining = state.focusPeriod * 60;
        
        if (state.startFocusTone) {
            playTone(523.25, 200);
            setTimeout(() => playTone(659.25, 300), 250);
        }
        
        showNotification('Focus Session', `Session ${state.currentSession} of ${state.totalSessions} - Let's focus! 📖`);
        
    } else {
        // Focus session finished
        if (state.skipBreaks || state.currentSession >= state.totalSessions) {
            completeTimer();
            return;
        }
        
        // Start break
        state.isBreak = true;
        state.timeRemaining = state.breakPeriod * 60;
        
        if (state.startBreakTone) {
            playTone(392.00, 200); // G4
            setTimeout(() => playTone(329.63, 300), 250); // E4
        }
        
        const exerciseReminder = state.eyeExercises ? ' Remember to do your eye exercises! 👁️' : '';
        showNotification('Break Time!', `Take a ${state.breakPeriod}-minute break.${exerciseReminder}`);
    }
    
    updateTimerDisplay();
}

// Complete Timer
function completeTimer() {
    clearInterval(state.timerInterval);
    
    // Play completion tone
    playTone(523.25, 150);
    setTimeout(() => playTone(659.25, 150), 200);
    setTimeout(() => playTone(783.99, 300), 400);
    
    showNotification('Great Work! 🎉', 'You\'ve completed all your focus sessions. Your eyes thank you!');
    
    // Reset UI
    setTimeout(() => {
        resetTimer();
    }, 2000);
}

// Update Timer Display
function updateTimerDisplay() {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    elements.countdownText.textContent = timeString;
    elements.timerType.textContent = state.isBreak ? 'Break Time 🌿' : 'Focus Session 📖';
    elements.sessionInfo.textContent = state.isBreak 
        ? `Break ${state.currentSession} of ${state.totalSessions - 1}`
        : `Session ${state.currentSession} of ${state.totalSessions}`;
    
    // Update progress circle
    const totalTime = state.isBreak ? state.breakPeriod * 60 : state.focusPeriod * 60;
    const progress = state.timeRemaining / totalTime;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - progress);
    
    elements.progressCircle.style.strokeDashoffset = offset;
    elements.progressCircle.style.stroke = state.isBreak ? 'var(--break-color)' : 'var(--secondary-color)';
    
    // Update document title
    document.title = `${timeString} - PagePause`;
}

// Toggle Pause
function togglePause() {
    state.isPaused = !state.isPaused;
    
    // Save state when pausing/resuming
    saveStateToStorage();
    
    if (state.isPaused) {
        elements.pauseButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
            </svg>
            Resume
        `;
    } else {
        elements.pauseButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pause
        `;
    }
}

// Stop Timer
function stopTimer() {
    showStopTimerModal();
}

function showStopTimerModal() {
    elements.stopTimerModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeStopTimerModal() {
    elements.stopTimerModal.classList.remove('show');
    document.body.style.overflow = '';
}

function handleConfirmStopTimer() {
    clearInterval(state.timerInterval);
    resetTimer();
    closeStopTimerModal();
}

// Reset Timer
function resetTimer() {
    state.isTimerRunning = false;
    state.isPaused = false;
    state.currentSession = 0;
    state.isBreak = false;
    state.timeRemaining = 0;
    
    document.title = 'PagePause - Eye Wellness Timer for Readers';
    
    elements.activeTimer.classList.add('hidden');
    document.querySelector('.timer-section').style.display = 'block';
    
    // Save cleared state
    saveStateToStorage();
    
    elements.pauseButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
        </svg>
        Pause
    `;
}

// Task Management
function addTask() {
    const text = elements.taskInput.value.trim();
    
    if (!text) return;
    
    const task = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    state.tasks.unshift(task);
    saveTasksToStorage();
    renderTasks();
    
    elements.taskInput.value = '';
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasksToStorage();
    renderTasks();
}

function renderTasks() {
    if (state.tasks.length === 0) {
        elements.taskList.innerHTML = `
            <li style="text-align: center; padding: 40px; color: var(--text-muted);">
                <p>No reading tasks yet. Add what you're reading today!</p>
            </li>
        `;
        return;
    }
    
    elements.taskList.innerHTML = state.tasks.map(task => `
        <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                    onchange="toggleTask(${task.id})">
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <button class="delete-task-button" onclick="deleteTask(${task.id})" aria-label="Delete task">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
            </button>
        </li>
    `).join('');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible for onclick handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.cancelReminder = cancelReminder;

// Reminder Management
function setReminder() {
    const text = elements.reminderInput.value.trim();
    const minutes = parseInt(elements.reminderMinutes.value);
    
    if (!text) {
        alert('Please enter what you want to be reminded of.');
        return;
    }
    
    if (!minutes || minutes < 1) {
        alert('Please enter a valid time (1 minute or more).');
        return;
    }
    
    const reminder = {
        id: Date.now(),
        text,
        minutes,
        createdAt: Date.now(),
        endTime: Date.now() + (minutes * 60 * 1000),
        timeoutId: null,
        intervalId: null
    };
    
    state.reminders.push(reminder);
    startReminderTimer(reminder);
    saveRemindersToStorage();
    renderReminders();
    
    // Clear inputs
    elements.reminderInput.value = '';
    elements.reminderMinutes.value = '5';
    
    // Play tone
    if (audioContext) {
        playTone(523.25, 150);
    }
    
    // Show confirmation
    showNotification('Reminder Set! ⏰', `You'll be reminded in ${minutes} minute${minutes !== 1 ? 's' : ''}: ${text}`);
}

function startReminderTimer(reminder) {
    const now = Date.now();
    const remainingMs = reminder.endTime - now;
    
    if (remainingMs <= 0) {
        triggerReminder(reminder);
        return;
    }
    
    // Set the main timeout for when the reminder should fire
    reminder.timeoutId = setTimeout(() => {
        triggerReminder(reminder);
    }, remainingMs);
    
    // Set interval to update the UI every second
    reminder.intervalId = setInterval(() => {
        renderReminders();
    }, 1000);
}

function triggerReminder(reminder) {
    // Clear intervals
    if (reminder.intervalId) {
        clearInterval(reminder.intervalId);
    }
    
    // Play sound
    if (audioContext) {
        playTone(659.25, 200);
        setTimeout(() => playTone(783.99, 200), 250);
        setTimeout(() => playTone(880.00, 300), 500);
    }
    
    // Show modal popup
    showReminderModal(reminder);
    
    // Show browser notification as backup
    showNotification('⏰ Reminder!', reminder.text, 'icons/icon-192.png');
}

// Store current reminder for snooze
let currentReminder = null;

function showReminderModal(reminder) {
    currentReminder = reminder;
    elements.reminderModalText.textContent = reminder.text;
    elements.reminderModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeReminderModal() {
    elements.reminderModal.style.display = 'none';
    document.body.style.overflow = '';
    currentReminder = null;
}

function snoozeCurrentReminder() {
    if (!currentReminder) return;
    
    // Create a new reminder with 5 minutes snooze
    const snoozedReminder = {
        id: Date.now(),
        text: currentReminder.text + ' (snoozed)',
        minutes: 5,
        createdAt: Date.now(),
        endTime: Date.now() + (5 * 60 * 1000),
        timeoutId: null,
        intervalId: null
    };
    
    state.reminders.push(snoozedReminder);
    startReminderTimer(snoozedReminder);
    saveRemindersToStorage();
    renderReminders();
    
    // Play confirmation tone
    if (audioContext) {
        playTone(523.25, 150);
    }
    
    closeReminderModal();
}

function dismissCurrentReminder() {
    if (!currentReminder) return;
    
    // Remove from state
    removeReminder(currentReminder.id);
    closeReminderModal();
}

function cancelReminder(id) {
    const reminder = state.reminders.find(r => r.id === id);
    if (reminder) {
        if (reminder.timeoutId) {
            clearTimeout(reminder.timeoutId);
        }
        if (reminder.intervalId) {
            clearInterval(reminder.intervalId);
        }
    }
    
    removeReminder(id);
}

function removeReminder(id) {
    state.reminders = state.reminders.filter(r => r.id !== id);
    saveRemindersToStorage();
    renderReminders();
}

function renderReminders() {
    if (state.reminders.length === 0) {
        elements.remindersList.innerHTML = `
            <li class="reminders-empty">
                No active reminders. Set one above!
            </li>
        `;
        return;
    }
    
    const now = Date.now();
    
    elements.remindersList.innerHTML = state.reminders.map(reminder => {
        const remainingMs = reminder.endTime - now;
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        return `
            <li class="reminder-item" data-id="${reminder.id}">
                <div class="reminder-content">
                    <div class="reminder-text">${escapeHtml(reminder.text)}</div>
                    <div class="reminder-time-remaining">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${timeString} remaining
                    </div>
                </div>
                <div class="reminder-actions">
                    <button class="cancel-reminder-button" onclick="cancelReminder(${reminder.id})" aria-label="Cancel reminder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </li>
        `;
    }).join('');
}

// Visibility Change Handler (pause timer when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.isTimerRunning && !state.isPaused) {
        // Don't auto-pause, but we could log or handle this
    }
});

// Visit Counter
function updateVisitCount() {
    const VISIT_COUNT_KEY = 'pagepause-visit-count';
    let visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    visitCount++;
    localStorage.setItem(VISIT_COUNT_KEY, visitCount.toString());
    
    const visitCountElement = document.getElementById('visitCount');
    if (visitCountElement) {
        visitCountElement.textContent = visitCount.toLocaleString();
    }
}

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
