// PagePause - Eye Wellness Timer for Readers

// Welcome Splash Screen Handler
window.addEventListener('DOMContentLoaded', () => {
    const welcomeSplash = document.getElementById('welcomeSplash');
    
    // Hide splash screen after 3 seconds
    setTimeout(() => {
        welcomeSplash.classList.add('fade-out');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            welcomeSplash.style.display = 'none';
        }, 500); // Match the CSS transition duration
    }, 3000);
});

// State Management
const state = {
    totalMinutes: 50,
    focusPeriod: 20,
    breakPeriod: 5,
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
    reminders: [],
    timerStartTime: null,  // Track when timer/segment started
    pausedTime: 0,         // Track accumulated paused time
    pauseStartTime: null   // Track when pause button was pressed
};

// Constants
const MIN_TIMER_MINUTES = 15;

// Wake Lock for mobile
let wakeLock = null;

// Audio Context for Tones
let audioContext;
let hasInteracted = false;

// Media Session for lock screen display
let mediaSessionUpdateInterval = null;

// Mindfulness cards data
const mindfulnessCards = [
    {
        icon: '👁️',
        title: '20-20-20 Rule',
        text: 'Every 20 minutes, look at something 20 feet away for 20 seconds.'
    },
    {
        icon: '👀',
        title: 'Blink Exercise',
        text: 'Blink slowly 10 times. Close your eyes and take 3 deep breaths.'
    },
    {
        icon: '🔄',
        title: 'Eye Rolls',
        text: 'Slowly roll your eyes in a circle, 5 times clockwise and 5 times counter-clockwise.'
    },
    {
        icon: '🫴',
        title: 'Palm Press',
        text: 'Rub your palms together and gently place them over your closed eyes for 30 seconds.'
    },
    {
        icon: '➡️⬅️',
        title: 'Near & Far Focus',
        text: 'Hold your thumb 10 inches away. Focus on it, then focus on something far. Repeat 10 times.'
    },
    {
        icon: '✏️',
        title: 'Figure Eight',
        text: 'Imagine a large figure 8 on the wall. Trace it with your eyes slowly for 30 seconds.'
    }
];

// Mindfulness card state
let mindfulnessCardInterval = null;
let mindfulnessStartTimeout = null;
let mindfulnessStopTimeout = null;
let shuffledCards = [];
let mindfulnessTemporarilyDisabled = false;

// Card drag state
let isDraggingCard = false;
let cardDragOffset = { x: 0, y: 0 };
let cardPosition = { x: null, y: null }; // null means centered

// Reminder modal drag state
let isDraggingReminder = false;
let reminderDragOffset = { x: 0, y: 0 };
let reminderPosition = { x: null, y: null }; // null means centered

// Initialize audio context on first user interaction
function initAudio() {
    if (!hasInteracted) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        hasInteracted = true;
    }
}

// Play tone
async function playTone(frequency = 440, duration = 200, type = 'sine') {
    if (!audioContext) return;
    
    // Resume audio context if suspended (required for some browsers)
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (err) {
            console.log('Failed to resume audio context:', err);
            return;
        }
    }
    
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

// Wake Lock API - Keep screen awake during timer
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock acquired');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
        }
    } catch (err) {
        console.log('Wake Lock error:', err);
    }
}

async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock manually released');
        } catch (err) {
            console.log('Wake Lock release error:', err);
        }
    }
}

// Media Session API - Display timer on lock screen
function updateMediaSession() {
    if (!('mediaSession' in navigator)) {
        console.log('Media Session API not supported');
        return;
    }
    
    try {
        const minutes = Math.floor(state.timeRemaining / 60);
        const seconds = state.timeRemaining % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const sessionType = state.isBreak ? 'Break Time' : 'Focus Session';
        const sessionNumber = state.isBreak 
            ? `Break ${state.currentSession} of ${state.totalSessions - 1}`
            : `Session ${state.currentSession} of ${state.totalSessions}`;
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `${timeString} - ${sessionType}`,
            artist: 'PagePause Timer',
            album: sessionNumber,
            artwork: [
                { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
                { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
            ]
        });
        
        // Set up action handlers for lock screen controls
        navigator.mediaSession.setActionHandler('play', () => {
            if (state.isPaused) {
                togglePause();
            }
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            if (!state.isPaused) {
                togglePause();
            }
        });
        
        navigator.mediaSession.setActionHandler('stop', () => {
            showStopTimerModal();
        });
        
        // Update playback state
        navigator.mediaSession.playbackState = state.isPaused ? 'paused' : 'playing';
        
    } catch (err) {
        console.log('Media Session update error:', err);
    }
}

function startMediaSession() {
    if (!('mediaSession' in navigator)) return;
    
    // Update immediately
    updateMediaSession();
    
    // Update every second to keep lock screen timer current
    if (mediaSessionUpdateInterval) {
        clearInterval(mediaSessionUpdateInterval);
    }
    
    mediaSessionUpdateInterval = setInterval(() => {
        if (state.isTimerRunning && !state.isPaused) {
            updateMediaSession();
        }
    }, 1000);
}

function stopMediaSession() {
    if (!('mediaSession' in navigator)) return;
    
    try {
        // Clear metadata
        navigator.mediaSession.metadata = null;
        
        // Clear action handlers
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        
        // Clear update interval
        if (mediaSessionUpdateInterval) {
            clearInterval(mediaSessionUpdateInterval);
            mediaSessionUpdateInterval = null;
        }
        
    } catch (err) {
        console.log('Media Session stop error:', err);
    }
}

// Mindfulness Card Functions
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function showNextMindfulnessCard() {
    if (shuffledCards.length === 0) {
        shuffledCards = shuffleArray(mindfulnessCards);
    }
    
    const card = shuffledCards.shift();
    
    elements.mindfulnessCardIcon.textContent = card.icon;
    elements.mindfulnessCardTitle.textContent = card.title;
    elements.mindfulnessCardText.textContent = card.text;
    
    elements.mindfulnessCardOverlay.style.display = 'flex';
    
    // Apply saved position if available
    const floatingCard = document.querySelector('.mindfulness-floating-card');
    if (cardPosition.x !== null && cardPosition.y !== null && floatingCard) {
        floatingCard.style.position = 'fixed';
        floatingCard.style.left = cardPosition.x + 'px';
        floatingCard.style.top = cardPosition.y + 'px';
        floatingCard.style.transform = 'none';
    }
    
    // Trigger reflow for animation
    void elements.mindfulnessCardOverlay.offsetWidth;
}

function startMindfulnessCards() {
    // Only show during breaks with eye exercises enabled
    if (!state.isBreak || !state.eyeExercises || mindfulnessTemporarilyDisabled) {
        return;
    }
    
    // Clear any existing timers
    stopMindfulnessCards();
    
    // Calculate when to start and stop showing cards
    const breakDuration = state.breakPeriod * 60; // in seconds
    const startDelay = 5; // Wait 5 seconds after break starts
    const stopBefore = 5; // Stop 5 seconds before break ends
    
    // Only show cards if break is long enough (> 10 seconds)
    if (breakDuration <= 10) {
        return;
    }
    
    // Start showing cards after 5 seconds
    mindfulnessStartTimeout = setTimeout(() => {
        // Show first card immediately
        shuffledCards = shuffleArray(mindfulnessCards);
        showNextMindfulnessCard();
        
        // Show new card every 30 seconds
        mindfulnessCardInterval = setInterval(() => {
            showNextMindfulnessCard();
        }, 30000);
        
    }, startDelay * 1000);
    
    // Stop showing cards 5 seconds before break ends
    const stopTime = (breakDuration - stopBefore) * 1000;
    mindfulnessStopTimeout = setTimeout(() => {
        stopMindfulnessCards();
    }, stopTime);
}

function stopMindfulnessCards() {
    // Clear all timers
    if (mindfulnessStartTimeout) {
        clearTimeout(mindfulnessStartTimeout);
        mindfulnessStartTimeout = null;
    }
    
    if (mindfulnessStopTimeout) {
        clearTimeout(mindfulnessStopTimeout);
        mindfulnessStopTimeout = null;
    }
    
    if (mindfulnessCardInterval) {
        clearInterval(mindfulnessCardInterval);
        mindfulnessCardInterval = null;
    }
    
    // Hide overlay
    if (elements.mindfulnessCardOverlay) {
        elements.mindfulnessCardOverlay.style.display = 'none';
    }
    
    // Reset shuffled cards
    shuffledCards = [];
}

// Setup mindfulness card drag functionality
function setupMindfulnessCardDrag() {
    let dragTarget = null;
    
    // Get the actual card element
    const getCard = () => document.querySelector('.mindfulness-floating-card');
    
    // Mouse events
    document.addEventListener('mousedown', (e) => {
        const card = getCard();
        if (!card) return;
        
        // Check if overlay is visible
        const overlay = elements.mindfulnessCardOverlay;
        if (!overlay || overlay.style.display !== 'flex') return;
        
        // Only start drag if clicking on the card
        const cardRect = card.getBoundingClientRect();
        if (e.clientX >= cardRect.left && e.clientX <= cardRect.right &&
            e.clientY >= cardRect.top && e.clientY <= cardRect.bottom) {
            isDraggingCard = true;
            dragTarget = card;
            
            // Calculate offset from cursor to card top-left
            cardDragOffset.x = e.clientX - cardRect.left;
            cardDragOffset.y = e.clientY - cardRect.top;
            
            card.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingCard || !dragTarget) return;
        
        // Calculate new position
        let newX = e.clientX - cardDragOffset.x;
        let newY = e.clientY - cardDragOffset.y;
        
        // Keep card within viewport bounds
        const cardRect = dragTarget.getBoundingClientRect();
        const maxX = window.innerWidth - cardRect.width;
        const maxY = window.innerHeight - cardRect.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // Apply position
        dragTarget.style.position = 'fixed';
        dragTarget.style.left = newX + 'px';
        dragTarget.style.top = newY + 'px';
        dragTarget.style.transform = 'none';
        
        // Save position
        cardPosition.x = newX;
        cardPosition.y = newY;
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDraggingCard && dragTarget) {
            dragTarget.style.cursor = 'grab';
            dragTarget = null;
            isDraggingCard = false;
        }
    });
    
    // Touch events for mobile
    document.addEventListener('touchstart', (e) => {
        const card = getCard();
        if (!card) return;
        
        // Check if overlay is visible
        const overlay = elements.mindfulnessCardOverlay;
        if (!overlay || overlay.style.display !== 'flex') return;
        
        const touch = e.touches[0];
        const cardRect = card.getBoundingClientRect();
        
        if (touch.clientX >= cardRect.left && touch.clientX <= cardRect.right &&
            touch.clientY >= cardRect.top && touch.clientY <= cardRect.bottom) {
            isDraggingCard = true;
            dragTarget = card;
            
            cardDragOffset.x = touch.clientX - cardRect.left;
            cardDragOffset.y = touch.clientY - cardRect.top;
            
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDraggingCard || !dragTarget) return;
        
        const touch = e.touches[0];
        
        let newX = touch.clientX - cardDragOffset.x;
        let newY = touch.clientY - cardDragOffset.y;
        
        const cardRect = dragTarget.getBoundingClientRect();
        const maxX = window.innerWidth - cardRect.width;
        const maxY = window.innerHeight - cardRect.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        dragTarget.style.position = 'fixed';
        dragTarget.style.left = newX + 'px';
        dragTarget.style.top = newY + 'px';
        dragTarget.style.transform = 'none';
        
        cardPosition.x = newX;
        cardPosition.y = newY;
        
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        if (isDraggingCard) {
            dragTarget = null;
            isDraggingCard = false;
        }
    });
}

// Setup reminder modal drag functionality
function setupReminderModalDrag() {
    const modal = elements.reminderModal;
    if (!modal) return;
    
    // Get the actual modal content element
    const getModalContent = () => elements.reminderModalContent || document.querySelector('.reminder-modal-content');
    
    // Mouse events
    let dragTarget = null;
    
    document.addEventListener('mousedown', (e) => {
        const modalContent = getModalContent();
        if (!modalContent || modal.style.display !== 'flex') return;
        
        // Only start drag if clicking on the modal content (not buttons)
        const modalRect = modalContent.getBoundingClientRect();
        if (e.clientX >= modalRect.left && e.clientX <= modalRect.right &&
            e.clientY >= modalRect.top && e.clientY <= modalRect.bottom) {
            
            // Don't drag if clicking on buttons or close button
            if (e.target.closest('button')) {
                return;
            }
            
            isDraggingReminder = true;
            dragTarget = modalContent;
            
            // Calculate offset from cursor to modal top-left
            reminderDragOffset.x = e.clientX - modalRect.left;
            reminderDragOffset.y = e.clientY - modalRect.top;
            
            modalContent.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingReminder || !dragTarget) return;
        
        // Calculate new position
        let newX = e.clientX - reminderDragOffset.x;
        let newY = e.clientY - reminderDragOffset.y;
        
        // Keep modal within viewport bounds
        const modalRect = dragTarget.getBoundingClientRect();
        const maxX = window.innerWidth - modalRect.width;
        const maxY = window.innerHeight - modalRect.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // Apply position
        dragTarget.style.position = 'fixed';
        dragTarget.style.left = newX + 'px';
        dragTarget.style.top = newY + 'px';
        dragTarget.style.transform = 'none';
        
        // Save position
        reminderPosition.x = newX;
        reminderPosition.y = newY;
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDraggingReminder && dragTarget) {
            dragTarget.style.cursor = 'grab';
            dragTarget = null;
            isDraggingReminder = false;
        }
    });
    
    // Touch events for mobile
    document.addEventListener('touchstart', (e) => {
        const modalContent = getModalContent();
        if (!modalContent || modal.style.display !== 'flex') return;
        
        const touch = e.touches[0];
        const modalRect = modalContent.getBoundingClientRect();
        
        if (touch.clientX >= modalRect.left && touch.clientX <= modalRect.right &&
            touch.clientY >= modalRect.top && touch.clientY <= modalRect.bottom) {
            
            // Don't drag if touching buttons
            if (e.target.closest('button')) {
                return;
            }
            
            isDraggingReminder = true;
            dragTarget = modalContent;
            
            reminderDragOffset.x = touch.clientX - modalRect.left;
            reminderDragOffset.y = touch.clientY - modalRect.top;
            
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDraggingReminder || !dragTarget) return;
        
        const touch = e.touches[0];
        
        let newX = touch.clientX - reminderDragOffset.x;
        let newY = touch.clientY - reminderDragOffset.y;
        
        const modalRect = dragTarget.getBoundingClientRect();
        const maxX = window.innerWidth - modalRect.width;
        const maxY = window.innerHeight - modalRect.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        dragTarget.style.position = 'fixed';
        dragTarget.style.left = newX + 'px';
        dragTarget.style.top = newY + 'px';
        dragTarget.style.transform = 'none';
        
        reminderPosition.x = newX;
        reminderPosition.y = newY;
        
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        if (isDraggingReminder) {
            dragTarget = null;
            isDraggingReminder = false;
        }
    });
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
    timerStatusInfo: document.getElementById('timerStatusInfo'),
    
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
    reminderModalContent: document.querySelector('.reminder-modal-content'),
    reminderModalText: document.getElementById('reminderModalText'),
    reminderQueueInfo: document.getElementById('reminderQueueInfo'),
    closeReminderModal: document.getElementById('closeReminderModal'),
    snoozeReminder: document.getElementById('snoozeReminder'),
    dismissReminder: document.getElementById('dismissReminder'),
    
    // Stop Timer Confirmation Modal
    stopTimerModal: document.getElementById('stopTimerModal'),
    cancelStopTimer: document.getElementById('cancelStopTimer'),
    confirmStopTimer: document.getElementById('confirmStopTimer'),
    
    // Mindfulness Card Overlay
    mindfulnessCardOverlay: document.getElementById('mindfulnessCardOverlay'),
    mindfulnessCardIcon: document.getElementById('mindfulnessCardIcon'),
    mindfulnessCardTitle: document.getElementById('mindfulnessCardTitle'),
    mindfulnessCardText: document.getElementById('mindfulnessCardText')
};

// Initialize
function init() {
    loadStateFromStorage();
    updateUI();
    setupEventListeners();
    renderTasks();
    renderReminders();
    updateVisitCount();
    listenForCounterUpdates(); // Enable cross-tab counter sync
    
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
                    
                    // Resume wake lock
                    requestWakeLock();
                    
                    // Resume media session
                    startMediaSession();
                    
                    // Resume mindfulness cards if on break with eye exercises
                    if (state.isBreak && state.eyeExercises) {
                        startMindfulnessCards();
                    }
                    
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
    
    // Simulate the actual timer flow to count breaks
    let timeLeft = state.totalMinutes;
    let sessions = 0;
    let breaks = 0;
    
    // Keep adding focus sessions and breaks while we have time
    while (timeLeft >= state.focusPeriod) {
        // Add a focus session
        timeLeft -= state.focusPeriod;
        sessions++;
        
        // After each session (except the last possible one), try to add a break
        if (timeLeft >= state.breakPeriod) {
            timeLeft -= state.breakPeriod;
            breaks++;
        } else {
            // Not enough time for a break, but we might squeeze in another partial session
            // However, timer requires full focus periods, so we stop here
            break;
        }
    }
    
    state.totalSessions = sessions;
    
    elements.breaksInfo.innerHTML = `You'll have <strong>${breaks}</strong> break${breaks !== 1 ? 's' : ''}.`;
}

// Validate timer settings
function validateTimerSettings() {
    // Ensure total timer is at least MIN_TIMER_MINUTES
    if (state.totalMinutes < MIN_TIMER_MINUTES) {
        state.totalMinutes = MIN_TIMER_MINUTES;
        elements.timeValue.value = MIN_TIMER_MINUTES;
    }
    
    // Ensure total timer is >= focus period
    if (state.totalMinutes < state.focusPeriod) {
        state.totalMinutes = state.focusPeriod;
        elements.timeValue.value = state.focusPeriod;
        
        // Show a brief message
        const breaksInfoEl = elements.breaksInfo;
        const originalHTML = breaksInfoEl.innerHTML;
        breaksInfoEl.innerHTML = `<span style="color: var(--warning);">⚠️ Timer adjusted to match focus period (${state.focusPeriod} mins)</span>`;
        setTimeout(() => {
            updateBreaksInfo();
        }, 3000);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Timer controls
    elements.increaseTime.addEventListener('click', () => {
        initAudio();
        state.totalMinutes = Math.min(240, state.totalMinutes + 5);
        elements.timeValue.value = state.totalMinutes;
        validateTimerSettings();
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.decreaseTime.addEventListener('click', () => {
        initAudio();
        state.totalMinutes = Math.max(MIN_TIMER_MINUTES, state.totalMinutes - 5);
        elements.timeValue.value = state.totalMinutes;
        validateTimerSettings();
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    // Direct time input
    elements.timeValue.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || MIN_TIMER_MINUTES;
        // Clamp value between MIN_TIMER_MINUTES and 240
        value = Math.max(MIN_TIMER_MINUTES, Math.min(240, value));
        state.totalMinutes = value;
        updateBreaksInfo();
    });
    
    elements.timeValue.addEventListener('change', (e) => {
        // Round to nearest 5 on blur/change
        let value = parseInt(e.target.value) || MIN_TIMER_MINUTES;
        value = Math.max(MIN_TIMER_MINUTES, Math.min(240, value));
        value = Math.round(value / 5) * 5;
        // Ensure it's at least MIN_TIMER_MINUTES after rounding
        value = Math.max(MIN_TIMER_MINUTES, value);
        state.totalMinutes = value;
        elements.timeValue.value = value;
        validateTimerSettings();
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
        validateTimerSettings();
        updateBreaksInfo();
        saveStateToStorage();
    });
    
    elements.focusPeriod.addEventListener('change', (e) => {
        state.focusPeriod = parseInt(e.target.value);
        validateTimerSettings();
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
    
    // ESC key to close modal and handle mindfulness cards
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Windows + Ctrl + ESC: Re-enable mindfulness cards
            if (e.ctrlKey && e.metaKey) {
                e.preventDefault();
                if (mindfulnessTemporarilyDisabled) {
                    mindfulnessTemporarilyDisabled = false;
                    // Restart cards if currently in break
                    if (state.isBreak && state.eyeExercises && state.isTimerRunning && !state.isPaused) {
                        startMindfulnessCards();
                    }
                    showNotification('Mindfulness Cards Enabled', 'Eye exercise cards will show during breaks');
                }
                return;
            }
            
            // ESC alone: Handle modals and disable mindfulness cards
            if (elements.reminderModal.style.display === 'flex') {
                dismissCurrentReminder();
            } else if (elements.stopTimerModal.classList.contains('show')) {
                closeStopTimerModal();
            } else if (elements.mindfulnessCardOverlay.style.display === 'flex') {
                // Hide mindfulness cards and disable for this focus session
                mindfulnessTemporarilyDisabled = true;
                stopMindfulnessCards();
                showNotification('Mindfulness Cards Hidden', 'Press Windows+Ctrl+ESC to show them again');
            }
        }
    });
    
    // Mindfulness card drag functionality
    setupMindfulnessCardDrag();
    
    // Reminder modal drag functionality
    setupReminderModalDrag();
    
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
    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
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
    });
}

// Start Timer
function startTimer() {
    initAudio();
    
    if (state.isTimerRunning) return;
    
    // Validate settings before starting
    if (state.totalMinutes < MIN_TIMER_MINUTES) {
        alert(`Focus timer must be at least ${MIN_TIMER_MINUTES} minutes.`);
        return;
    }
    
    if (state.totalMinutes < state.focusPeriod) {
        alert(`Focus timer (${state.totalMinutes} mins) must be greater than or equal to focus period (${state.focusPeriod} mins). Please adjust your settings.`);
        return;
    }
    
    state.isTimerRunning = true;
    state.currentSession = 1;
    state.isBreak = false;
    state.timeRemaining = state.focusPeriod * 60;
    state.timerStartTime = Date.now();  // Track start time
    state.pausedTime = 0;               // Reset paused time
    
    // Reset mindfulness card temporary disable for new focus session
    mindfulnessTemporarilyDisabled = false;
    
    // Request wake lock to prevent screen from sleeping on mobile
    requestWakeLock();
    
    // Start media session for lock screen display
    startMediaSession();
    
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
    
    // Calculate actual elapsed time based on timestamp
    if (state.timerStartTime) {
        const now = Date.now();
        const elapsedMs = now - state.timerStartTime - state.pausedTime;
        const totalDuration = (state.isBreak ? state.breakPeriod : state.focusPeriod) * 60;
        const calculatedRemaining = totalDuration - Math.floor(elapsedMs / 1000);
        
        // Use calculated time to stay accurate even if page was hidden
        state.timeRemaining = Math.max(0, calculatedRemaining);
    } else {
        // Fallback to simple countdown
        state.timeRemaining--;
    }
    
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
        // Break finished, stop mindfulness cards
        stopMindfulnessCards();
        
        // Start next focus session
        state.currentSession++;
        
        if (state.currentSession > state.totalSessions) {
            // All sessions complete
            completeTimer();
            return;
        }
        
        state.isBreak = false;
        state.timeRemaining = state.focusPeriod * 60;
        state.timerStartTime = Date.now();  // Reset start time for new session
        state.pausedTime = 0;
        
        if (state.startFocusTone) {
            playTone(523.25, 200);
            setTimeout(() => playTone(659.25, 300), 250);
        }
        
        showNotification('Focus Session', `Session ${state.currentSession} of ${state.totalSessions} - Let's focus! 📖`);
        
        // Update media session
        updateMediaSession();
        
    } else {
        // Focus session finished
        if (state.skipBreaks || state.currentSession >= state.totalSessions) {
            completeTimer();
            return;
        }
        
        // Start break
        state.isBreak = true;
        state.timeRemaining = state.breakPeriod * 60;
        state.timerStartTime = Date.now();  // Reset start time for break
        state.pausedTime = 0;
        
        if (state.startBreakTone) {
            console.log('Playing break tone - state.startBreakTone:', state.startBreakTone);
            console.log('Audio context state:', audioContext ? audioContext.state : 'No audio context');
            playTone(392.00, 200); // G4
            setTimeout(() => playTone(329.63, 300), 250); // E4
        }
        
        const exerciseReminder = state.eyeExercises ? ' Remember to do your eye exercises! 👁️' : '';
        showNotification('Break Time!', `Take a ${state.breakPeriod}-minute break.${exerciseReminder}`);
        
        // Update media session
        updateMediaSession();
        
        // Start mindfulness cards if eye exercises enabled
        startMindfulnessCards();
    }
    
    updateTimerDisplay();
}

// Complete Timer
function completeTimer() {
    clearInterval(state.timerInterval);
    
    // Release wake lock
    releaseWakeLock();
    
    // Stop media session
    stopMediaSession();
    
    // Stop mindfulness cards
    stopMindfulnessCards();
    
    // Play completion tone
    playTone(523.25, 150);
    setTimeout(() => playTone(659.25, 150), 200);
    setTimeout(() => playTone(783.99, 300), 400);
    
    showNotification('Great Work! 🎉', 'You\'ve completed all your focus sessions. Your eyes thank you!');
    
    // Show completion splash screen
    setTimeout(() => {
        showCompletionSplash();
    }, 1000);
}

// Show Completion Splash Screen
function showCompletionSplash() {
    const completionSplash = document.getElementById('completionSplash');
    completionSplash.classList.add('show');
    
    // Hide splash screen and reset timer after 5 seconds
    setTimeout(() => {
        completionSplash.classList.add('fade-out');
        
        // Reset timer and remove splash after animation completes
        setTimeout(() => {
            completionSplash.classList.remove('show', 'fade-out');
            resetTimer();
        }, 500); // Match the CSS transition duration
    }, 5000);
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
    
    // Get the actual radius from the circle element (supports responsive sizing)
    const radius = parseFloat(elements.progressCircle.getAttribute('r')) || 90;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    
    elements.progressCircle.style.strokeDashoffset = offset;
    elements.progressCircle.style.stroke = state.isBreak ? 'var(--break-color)' : 'var(--secondary-color)';
    
    // Update document title
    document.title = `${timeString} - PagePause`;
    
    // Update timer status info (tasks and reminders count)
    updateTimerStatusInfo();
}

// Update Timer Status Info (Tasks and Reminders Count)
function updateTimerStatusInfo() {
    if (!elements.timerStatusInfo) return;
    
    const activeTasks = state.tasks.filter(task => !task.completed).length;
    const activeReminders = state.reminders.length;
    
    // Build status string
    const statusParts = [];
    
    if (activeReminders > 0) {
        statusParts.push(`<span class="status-item clickable" onclick="switchToTasksTab()">Reminders: <strong class="status-count">${activeReminders}</strong></span>`);
    }
    
    if (activeTasks > 0) {
        statusParts.push(`<span class="status-item clickable" onclick="switchToTasksTab()">Tasks: <strong class="status-count">${activeTasks}</strong></span>`);
    }
    
    // Only show if there are tasks or reminders
    if (statusParts.length > 0) {
        elements.timerStatusInfo.innerHTML = statusParts.join(' ');
        elements.timerStatusInfo.style.display = 'flex';
    } else {
        elements.timerStatusInfo.innerHTML = '';
        elements.timerStatusInfo.style.display = 'none';
    }
}

// Function to switch to Tasks tab
function switchToTasksTab() {
    const tasksTab = document.querySelector('[data-tab="tasks"]');
    if (tasksTab) {
        tasksTab.click();
    }
}

// Toggle Pause
function togglePause() {
    const wasPaused = state.isPaused;
    state.isPaused = !state.isPaused;
    
    if (state.isPaused) {
        // Just paused - record when pause started
        state.pauseStartTime = Date.now();
        
        // Hide mindfulness cards when paused
        if (state.isBreak && state.eyeExercises) {
            stopMindfulnessCards();
        }
        
        elements.pauseButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
            </svg>
            Resume
        `;
    } else {
        // Resuming - add the paused duration to total paused time
        if (state.pauseStartTime) {
            const pauseDuration = Date.now() - state.pauseStartTime;
            state.pausedTime += pauseDuration;
            state.pauseStartTime = null;
        }
        
        // Restart mindfulness cards if resuming during a break
        if (state.isBreak && state.eyeExercises) {
            startMindfulnessCards();
        }
        
        elements.pauseButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pause
        `;
    }
    
    // Update media session state
    updateMediaSession();
    
    // Save state when pausing/resuming
    saveStateToStorage();
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
    state.timerStartTime = null;
    state.pausedTime = 0;
    
    // Release wake lock when timer is reset
    releaseWakeLock();
    
    // Stop media session
    stopMediaSession();
    
    // Stop mindfulness cards
    stopMindfulnessCards();
    
    // Reset mindfulness temporary disable
    mindfulnessTemporarilyDisabled = false;
    
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
        updateTimerStatusInfo();
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
    
    updateTimerStatusInfo();
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

// Store current reminder and queue for managing multiple reminders
let currentReminder = null;
let reminderQueue = [];

function showReminderModal(reminder) {
    // If a reminder is already showing, add this one to the queue
    if (currentReminder && elements.reminderModal.style.display === 'flex') {
        // Check if this reminder is not already in the queue
        if (!reminderQueue.find(r => r.id === reminder.id)) {
            reminderQueue.push(reminder);
            console.log(`Reminder queued: "${reminder.text}" (${reminderQueue.length} in queue)`);
            
            // Update queue info on currently displayed modal
            updateQueueInfo();
        }
        return;
    }
    
    // Show the reminder
    currentReminder = reminder;
    elements.reminderModalText.textContent = reminder.text;
    elements.reminderModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Apply saved position if available
    const modalContent = elements.reminderModalContent;
    if (reminderPosition.x !== null && reminderPosition.y !== null && modalContent) {
        modalContent.style.position = 'fixed';
        modalContent.style.left = reminderPosition.x + 'px';
        modalContent.style.top = reminderPosition.y + 'px';
        modalContent.style.transform = 'none';
    }
    
    // Update queue info
    updateQueueInfo();
    
    console.log(`Showing reminder: "${reminder.text}"`);
}

function updateQueueInfo() {
    if (elements.reminderQueueInfo) {
        if (reminderQueue.length > 0) {
            elements.reminderQueueInfo.textContent = `📋 ${reminderQueue.length} more reminder${reminderQueue.length > 1 ? 's' : ''} waiting`;
            elements.reminderQueueInfo.style.display = 'block';
        } else {
            elements.reminderQueueInfo.style.display = 'none';
        }
    }
}

function closeReminderModal() {
    elements.reminderModal.style.display = 'none';
    document.body.style.overflow = '';
    currentReminder = null;
    
    // Show next reminder in queue if any
    processReminderQueue();
}

function processReminderQueue() {
    if (reminderQueue.length > 0) {
        const nextReminder = reminderQueue.shift();
        console.log(`Processing next reminder from queue: "${nextReminder.text}" (${reminderQueue.length} remaining)`);
        // Small delay before showing next reminder
        setTimeout(() => {
            showReminderModal(nextReminder);
        }, 300);
    }
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
    
    // Remove the original reminder from state
    removeReminder(currentReminder.id);
    
    // Close modal and process queue
    closeReminderModal();
}

function dismissCurrentReminder() {
    if (!currentReminder) return;
    
    // Remove from state
    removeReminder(currentReminder.id);
    
    // Close modal and process queue
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
    
    // Also remove from queue if it's there
    reminderQueue = reminderQueue.filter(r => r.id !== id);
    updateQueueInfo();
    
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
        updateTimerStatusInfo();
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
    
    updateTimerStatusInfo();
}

// Visibility Change Handler - Keep timer running even when page is hidden
document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
        // Page is hidden (tab switched, phone locked, etc.)
        // Timer continues running in background using timestamp-based calculation
        console.log('Page hidden - timer continues running');
    } else {
        // Page is visible again
        console.log('Page visible - syncing timer');
        
        // Reacquire wake lock if timer is running and not paused
        if (state.isTimerRunning && !state.isPaused) {
            await requestWakeLock();
        }
        
        // Force an update to recalculate time in case browser throttled execution
        if (state.isTimerRunning) {
            updateTimer();
        }
    }
});

// Local Page Hit Counter - persists in browser's localStorage (file-based)
// This simulates a local file by using the browser's persistent storage
function updateVisitCount() {
    const visitCountElement = document.getElementById('visitCount');
    const HIT_COUNT_KEY = 'pagepause-page-hit-count';
    const LAST_HIT_KEY = 'pagepause-last-hit-timestamp';
    
    if (!visitCountElement) return;
    
    // Get current count from localStorage (this persists like a local file)
    let hitCount = parseInt(localStorage.getItem(HIT_COUNT_KEY) || '0', 10);
    
    // Increment the counter for every page load
    hitCount++;
    
    // Save to localStorage (persistent storage, like a local file)
    localStorage.setItem(HIT_COUNT_KEY, hitCount.toString());
    localStorage.setItem(LAST_HIT_KEY, new Date().toISOString());
    
    // Update display
    visitCountElement.textContent = hitCount.toLocaleString();
    
    // Log for debugging
    console.log(`PagePause: Page hit #${hitCount} at ${new Date().toLocaleString()}`);
    
    // Sync counter across all open tabs/windows
    broadcastCounterUpdate(hitCount);
}

// Broadcast counter updates to other tabs/windows
function broadcastCounterUpdate(count) {
    // Use BroadcastChannel API for cross-tab communication
    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('pagepause-counter');
        channel.postMessage({ type: 'counter-update', count: count });
        channel.close();
    }
}

// Listen for counter updates from other tabs
function listenForCounterUpdates() {
    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('pagepause-counter');
        channel.onmessage = (event) => {
            if (event.data.type === 'counter-update') {
                const visitCountElement = document.getElementById('visitCount');
                if (visitCountElement) {
                    visitCountElement.textContent = event.data.count.toLocaleString();
                }
            }
        };
    }
    
    // Also listen to localStorage changes (fallback for older browsers)
    window.addEventListener('storage', (event) => {
        if (event.key === 'pagepause-page-hit-count' && event.newValue) {
            const visitCountElement = document.getElementById('visitCount');
            if (visitCountElement) {
                const count = parseInt(event.newValue, 10);
                visitCountElement.textContent = count.toLocaleString();
            }
        }
    });
}

// Export counter data (can be saved to a file manually)
function exportCounterData() {
    const hitCount = parseInt(localStorage.getItem('pagepause-page-hit-count') || '0', 10);
    const lastHit = localStorage.getItem('pagepause-last-hit-timestamp');
    
    const data = {
        hitCount: hitCount,
        lastHit: lastHit,
        exportedAt: new Date().toISOString()
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagepause-counter-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Counter data exported:', data);
    return data;
}

// Import counter data from a file
function importCounterData(jsonData) {
    try {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        if (data.hitCount !== undefined) {
            localStorage.setItem('pagepause-page-hit-count', data.hitCount.toString());
            
            if (data.lastHit) {
                localStorage.setItem('pagepause-last-hit-timestamp', data.lastHit);
            }
            
            const visitCountElement = document.getElementById('visitCount');
            if (visitCountElement) {
                visitCountElement.textContent = data.hitCount.toLocaleString();
            }
            
            console.log('Counter data imported successfully:', data);
            return true;
        }
    } catch (error) {
        console.error('Failed to import counter data:', error);
        return false;
    }
}

// Utility functions for managing page hit count (accessible from console)
window.PagePause = {
    getHitCount: function() {
        const count = parseInt(localStorage.getItem('pagepause-page-hit-count') || '0', 10);
        console.log(`Total page hits: ${count.toLocaleString()}`);
        return count;
    },
    
    resetHitCount: function() {
        if (confirm('Are you sure you want to reset the page hit counter to 0?')) {
            localStorage.setItem('pagepause-page-hit-count', '0');
            const visitCountElement = document.getElementById('visitCount');
            if (visitCountElement) {
                visitCountElement.textContent = '0';
            }
            console.log('Page hit counter has been reset to 0');
            broadcastCounterUpdate(0);
            return 0;
        }
    },
    
    setHitCount: function(count) {
        if (typeof count !== 'number' || count < 0) {
            console.error('Please provide a valid positive number');
            return;
        }
        localStorage.setItem('pagepause-page-hit-count', count.toString());
        const visitCountElement = document.getElementById('visitCount');
        if (visitCountElement) {
            visitCountElement.textContent = count.toLocaleString();
        }
        console.log(`Page hit count set to ${count.toLocaleString()}`);
        broadcastCounterUpdate(count);
        return count;
    },
    
    getLastHit: function() {
        const lastHit = localStorage.getItem('pagepause-last-hit-timestamp');
        if (lastHit) {
            const date = new Date(lastHit);
            console.log(`Last page hit: ${date.toLocaleString()}`);
            return date;
        } else {
            console.log('No page hits recorded yet');
            return null;
        }
    },
    
    exportCounter: function() {
        return exportCounterData();
    },
    
    importCounter: function(jsonData) {
        console.log('To import counter data:');
        console.log('1. Prepare JSON data like: {"hitCount": 100, "lastHit": "2025-11-01T00:00:00.000Z"}');
        console.log('2. Call: PagePause.importCounter(yourJsonData)');
        if (jsonData) {
            return importCounterData(jsonData);
        }
    },
    
    help: function() {
        console.log(`
PagePause Utility Functions:
----------------------------
• PagePause.getHitCount()        - Get current page hit count
• PagePause.resetHitCount()      - Reset counter to 0
• PagePause.setHitCount(n)       - Set counter to n
• PagePause.getLastHit()         - Get timestamp of last hit
• PagePause.exportCounter()      - Export counter data to JSON file
• PagePause.importCounter(data)  - Import counter data from JSON
• PagePause.help()               - Show this help message

Note: Counter is stored in localStorage (like a local file) and persists across sessions.
Counter syncs across all open tabs/windows automatically.
        `);
    }
};

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
