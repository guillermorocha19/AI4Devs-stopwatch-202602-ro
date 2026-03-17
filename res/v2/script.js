/**
 * Stopwatch & Timer Application
 *
 * Features:
 *  - Stopwatch with start/pause/reset and milliseconds (HU-1)
 *  - Countdown timer with presets, Pomodoro, validation, and alerts (HU-2)
 *  - Tab navigation with background state persistence (HU-3)
 *
 * Follows Airbnb JavaScript Style Guide conventions.
 * Uses system time (Date.now) to avoid drift.
 */

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Formats total milliseconds into { main: 'HH:MM:SS', ms: '.xxx' }.
 * @param {number} totalMs - Non-negative milliseconds.
 * @returns {{ main: string, ms: string }} Formatted time parts.
 */
const formatTimeMs = (totalMs) => {
  const safeMs = Math.max(0, Math.floor(totalMs));
  const totalSeconds = Math.floor(safeMs / 1000);
  const millis = safeMs % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const main = [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
  const ms = `.${String(millis).padStart(3, '0')}`;

  return { main, ms };
};

/**
 * Formats total seconds into HH:MM:SS string (legacy, used by tests).
 * @param {number} totalSeconds - Non-negative integer of seconds.
 * @returns {string} Formatted time string.
 */
const formatTime = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
};

/**
 * Parses HH, MM, SS values into total seconds.
 * @param {number} h - Hours.
 * @param {number} m - Minutes.
 * @param {number} s - Seconds.
 * @returns {number} Total seconds.
 */
const parseToSeconds = (h, m, s) => (
  Math.max(0, Math.floor(h)) * 3600
  + Math.max(0, Math.floor(m)) * 60
  + Math.max(0, Math.floor(s))
);

/**
 * Validates a timer input field value.
 * - Must be a number (not empty, no non-numeric chars).
 * - Must be non-negative.
 * - Hours: 0–23, Minutes/Seconds: 0–59.
 *
 * @param {string} value - The raw input value.
 * @param {'hours'|'minutes'|'seconds'} type - Which field.
 * @returns {{ valid: boolean, sanitized: number }} Validation result.
 */
const validateTimerInput = (value, type) => {
  // Empty or whitespace-only → invalid.
  if (value === '' || value.trim() === '') {
    return { valid: false, sanitized: 0 };
  }

  // Contains non-numeric characters (allow leading minus to catch it as negative).
  if (!/^-?\d+$/.test(value.trim())) {
    return { valid: false, sanitized: 0 };
  }

  const num = parseInt(value, 10);

  // NaN check (shouldn't happen after regex, but safety).
  if (Number.isNaN(num)) {
    return { valid: false, sanitized: 0 };
  }

  // Negative → invalid.
  if (num < 0) {
    return { valid: false, sanitized: 0 };
  }

  // Range checks.
  const maxValues = { hours: 23, minutes: 59, seconds: 59 };
  const max = maxValues[type] ?? 59;

  if (num > max) {
    return { valid: false, sanitized: max };
  }

  return { valid: true, sanitized: num };
};

// =============================================================================
// AUDIO ALERT (Web Audio API — no external file needed)
// =============================================================================

/**
 * Plays a short triple-beep alert using the Web Audio API.
 * Falls back silently if AudioContext is unavailable.
 */
const playAlertSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    const beepDuration = 0.15;
    const gapDuration = 0.12;
    const beepCount = 3;

    for (let i = 0; i < beepCount; i += 1) {
      const startTime = ctx.currentTime + i * (beepDuration + gapDuration);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, startTime);
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + beepDuration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + beepDuration);
    }

    // Close the context after the beeps finish.
    const totalDuration = beepCount * (beepDuration + gapDuration) + 0.5;
    setTimeout(() => ctx.close(), totalDuration * 1000);
  } catch {
    // Audio not supported — fail silently.
  }
};

// =============================================================================
// DESKTOP NOTIFICATION
// =============================================================================

/**
 * Sends a desktop notification if the browser supports and permits it.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body text.
 */
const sendDesktopNotification = (title, body) => {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    // eslint-disable-next-line no-new
    new Notification(title, { body, icon: '🔔' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        // eslint-disable-next-line no-new
        new Notification(title, { body, icon: '🔔' });
      }
    });
  }
};

// =============================================================================
// DOM REFERENCES
// =============================================================================

const dom = {
  // Landing
  landing: document.getElementById('landing'),
  landingStopwatchBtn: document.getElementById('landing-stopwatch-btn'),
  landingTimerBtn: document.getElementById('landing-timer-btn'),

  // App shell
  app: document.getElementById('app'),

  // Tabs
  tabStopwatch: document.getElementById('tab-stopwatch'),
  tabTimer: document.getElementById('tab-timer'),
  navIndicator: document.getElementById('nav-indicator'),

  // Panels
  panelStopwatch: document.getElementById('panel-stopwatch'),
  panelTimer: document.getElementById('panel-timer'),

  // Stopwatch
  stopwatchDisplay: document.getElementById('stopwatch-display'),
  stopwatchStartBtn: document.getElementById('stopwatch-start-btn'),
  stopwatchResetBtn: document.getElementById('stopwatch-reset-btn'),
  stopwatchStatusDot: document.getElementById('stopwatch-status-dot'),

  // Timer
  timerHours: document.getElementById('timer-hours'),
  timerMinutes: document.getElementById('timer-minutes'),
  timerSeconds: document.getElementById('timer-seconds'),
  timerDisplay: document.getElementById('timer-display'),
  timerDisplayContainer: document.getElementById('timer-display-container'),
  timerInputGroup: document.getElementById('timer-input-group'),
  timerStartBtn: document.getElementById('timer-start-btn'),
  timerResetBtn: document.getElementById('timer-reset-btn'),
  timerValidation: document.getElementById('timer-validation'),
  timerNotification: document.getElementById('timer-notification'),
  notificationDismissBtn: document.getElementById('notification-dismiss-btn'),
  timerStatusDot: document.getElementById('timer-status-dot'),
  timerProgress: document.getElementById('timer-progress'),
  timerProgressFill: document.getElementById('timer-progress-fill'),
};

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Updates a display element with formatted time including milliseconds.
 * @param {HTMLElement} displayEl - The .display__time container.
 * @param {number} totalMs - Total milliseconds to show.
 */
const setDisplayMs = (displayEl, totalMs) => {
  const { main, ms } = formatTimeMs(totalMs);
  const mainEl = displayEl.querySelector('.display__main');
  const msEl = displayEl.querySelector('.display__ms');

  if (mainEl) mainEl.textContent = main;
  if (msEl) msEl.textContent = ms;
};

// =============================================================================
// STOPWATCH STATE & LOGIC
// =============================================================================

const stopwatch = {
  running: false,
  elapsedMs: 0,       // Total elapsed milliseconds (accumulated across pauses).
  startTimestamp: null, // Date.now() when current run started.
  rafId: null,         // requestAnimationFrame handle.
};

/**
 * Updates the stopwatch display based on current elapsed time.
 */
const updateStopwatchDisplay = () => {
  let totalMs = stopwatch.elapsedMs;

  if (stopwatch.running && stopwatch.startTimestamp !== null) {
    totalMs += Date.now() - stopwatch.startTimestamp;
  }

  setDisplayMs(dom.stopwatchDisplay, totalMs);
};

/**
 * Animation loop for the stopwatch.
 */
const stopwatchTick = () => {
  if (!stopwatch.running) {
    return;
  }

  updateStopwatchDisplay();
  stopwatch.rafId = requestAnimationFrame(stopwatchTick);
};

/**
 * Starts the stopwatch.
 */
const startStopwatch = () => {
  stopwatch.running = true;
  stopwatch.startTimestamp = Date.now();
  stopwatch.rafId = requestAnimationFrame(stopwatchTick);

  dom.stopwatchStartBtn.textContent = 'Pause';
  dom.stopwatchStartBtn.setAttribute('aria-label', 'Pause stopwatch');
  dom.stopwatchStartBtn.classList.add('btn--pause');
  dom.stopwatchStatusDot.hidden = false;
};

/**
 * Pauses the stopwatch.
 */
const pauseStopwatch = () => {
  if (stopwatch.startTimestamp !== null) {
    stopwatch.elapsedMs += Date.now() - stopwatch.startTimestamp;
  }

  stopwatch.running = false;
  stopwatch.startTimestamp = null;
  cancelAnimationFrame(stopwatch.rafId);

  updateStopwatchDisplay();

  dom.stopwatchStartBtn.textContent = 'Start';
  dom.stopwatchStartBtn.setAttribute('aria-label', 'Start stopwatch');
  dom.stopwatchStartBtn.classList.remove('btn--pause');
  dom.stopwatchStatusDot.hidden = true;
};

/**
 * Resets the stopwatch to 00:00:00.000.
 */
const resetStopwatch = () => {
  stopwatch.running = false;
  stopwatch.elapsedMs = 0;
  stopwatch.startTimestamp = null;
  cancelAnimationFrame(stopwatch.rafId);

  setDisplayMs(dom.stopwatchDisplay, 0);

  dom.stopwatchStartBtn.textContent = 'Start';
  dom.stopwatchStartBtn.setAttribute('aria-label', 'Start stopwatch');
  dom.stopwatchStartBtn.classList.remove('btn--pause');
  dom.stopwatchStatusDot.hidden = true;
};

/**
 * Toggles the stopwatch between start and pause.
 */
const toggleStopwatch = () => {
  if (stopwatch.running) {
    pauseStopwatch();
  } else {
    startStopwatch();
  }
};

// =============================================================================
// TIMER STATE & LOGIC
// =============================================================================

const timer = {
  running: false,
  totalDuration: 0,    // Original duration in seconds (for progress ring).
  remainingMs: 0,      // Remaining milliseconds.
  startTimestamp: null, // Date.now() when current run started.
  rafId: null,
};

const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * 90; // ~565.48

/**
 * Updates the progress ring on the timer display.
 * @param {number} fraction - Value from 0 (empty) to 1 (full).
 */
const updateProgressRing = (fraction) => {
  const offset = PROGRESS_CIRCUMFERENCE * (1 - fraction);
  dom.timerProgressFill.style.strokeDashoffset = offset;
};

/**
 * Updates the timer display and progress ring.
 */
const updateTimerDisplay = () => {
  let remaining = timer.remainingMs;

  if (timer.running && timer.startTimestamp !== null) {
    remaining -= (Date.now() - timer.startTimestamp);
  }

  remaining = Math.max(0, remaining);
  setDisplayMs(dom.timerDisplay, remaining);

  // Update progress ring.
  if (timer.totalDuration > 0) {
    const fraction = remaining / (timer.totalDuration * 1000);
    updateProgressRing(Math.max(0, Math.min(1, fraction)));
  }

  return remaining;
};

/**
 * Handles timer completion: shows notification, plays sound, sends desktop alert.
 */
const handleTimerComplete = () => {
  timer.running = false;
  timer.remainingMs = 0;
  timer.startTimestamp = null;
  cancelAnimationFrame(timer.rafId);

  setDisplayMs(dom.timerDisplay, 0);
  updateProgressRing(0);

  dom.timerStartBtn.textContent = 'Start';
  dom.timerStartBtn.setAttribute('aria-label', 'Start timer');
  dom.timerStartBtn.classList.remove('btn--pause');
  dom.timerStatusDot.hidden = true;

  // Show on-screen notification.
  dom.timerNotification.classList.remove('hidden');

  // Play audio alert.
  playAlertSound();

  // Desktop notification.
  sendDesktopNotification("Time's up!", 'Your countdown timer has finished.');
};

/**
 * Animation loop for the timer.
 */
const timerTick = () => {
  if (!timer.running) {
    return;
  }

  const remaining = updateTimerDisplay();

  if (remaining <= 0) {
    handleTimerComplete();
    return;
  }

  timer.rafId = requestAnimationFrame(timerTick);
};

/**
 * Sets the timer input fields to a given number of seconds.
 * @param {number} totalSeconds - Timer duration in seconds.
 */
const setTimerValue = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  dom.timerHours.value = hours;
  dom.timerMinutes.value = minutes;
  dom.timerSeconds.value = seconds;

  setDisplayMs(dom.timerDisplay, totalSeconds * 1000);
};

/**
 * Validates all timer inputs and returns total seconds if valid.
 * Applies visual feedback on invalid fields.
 * @returns {{ valid: boolean, totalSeconds: number }}
 */
const validateAndGetTimerSeconds = () => {
  const fields = [
    { el: dom.timerHours, type: 'hours' },
    { el: dom.timerMinutes, type: 'minutes' },
    { el: dom.timerSeconds, type: 'seconds' },
  ];

  let allValid = true;
  const values = {};

  fields.forEach(({ el, type }) => {
    // Remove previous invalid state.
    el.classList.remove('timer-input__field--invalid');

    const result = validateTimerInput(el.value, type);

    if (!result.valid) {
      allValid = false;
      el.classList.add('timer-input__field--invalid');
      // Auto-correct the value after a brief visual flash.
      el.value = result.sanitized;
    }

    values[type] = result.sanitized;
  });

  const totalSeconds = parseToSeconds(values.hours, values.minutes, values.seconds);

  return { valid: allValid, totalSeconds };
};

/**
 * Shows the timer running UI.
 */
const showTimerRunningUI = () => {
  dom.timerProgress.classList.add('timer-progress--visible');
};

/**
 * Shows the timer input UI.
 */
const showTimerInputUI = () => {
  dom.timerProgress.classList.remove('timer-progress--visible');
};

/**
 * Starts the timer.
 */
const startTimer = () => {
  const { valid, totalSeconds } = validateAndGetTimerSeconds();

  // Show validation: cannot start at 00:00:00 or with invalid inputs.
  if (!valid || totalSeconds === 0) {
    dom.timerValidation.classList.remove('hidden');
    setTimeout(() => dom.timerValidation.classList.add('hidden'), 3000);

    if (totalSeconds === 0 && valid) {
      // Fields are valid numbers but sum is 0.
      dom.timerValidation.classList.remove('hidden');
    }
    return;
  }

  timer.totalDuration = totalSeconds;
  timer.remainingMs = totalSeconds * 1000;
  timer.running = true;
  timer.startTimestamp = Date.now();

  showTimerRunningUI();
  timer.rafId = requestAnimationFrame(timerTick);

  dom.timerStartBtn.textContent = 'Pause';
  dom.timerStartBtn.setAttribute('aria-label', 'Pause timer');
  dom.timerStartBtn.classList.add('btn--pause');
  dom.timerStatusDot.hidden = false;

  // Request notification permission proactively.
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

/**
 * Pauses the timer.
 */
const pauseTimer = () => {
  if (timer.startTimestamp !== null) {
    timer.remainingMs -= (Date.now() - timer.startTimestamp);
    timer.remainingMs = Math.max(0, timer.remainingMs);
  }

  timer.running = false;
  timer.startTimestamp = null;
  cancelAnimationFrame(timer.rafId);

  updateTimerDisplay();

  dom.timerStartBtn.textContent = 'Resume';
  dom.timerStartBtn.setAttribute('aria-label', 'Resume timer');
  dom.timerStartBtn.classList.remove('btn--pause');
  dom.timerStatusDot.hidden = true;
};

/**
 * Resumes a paused timer.
 */
const resumeTimer = () => {
  timer.running = true;
  timer.startTimestamp = Date.now();
  timer.rafId = requestAnimationFrame(timerTick);

  dom.timerStartBtn.textContent = 'Pause';
  dom.timerStartBtn.setAttribute('aria-label', 'Pause timer');
  dom.timerStartBtn.classList.add('btn--pause');
  dom.timerStatusDot.hidden = false;
};

/**
 * Resets the timer completely.
 */
const resetTimer = () => {
  timer.running = false;
  timer.remainingMs = 0;
  timer.totalDuration = 0;
  timer.startTimestamp = null;
  cancelAnimationFrame(timer.rafId);

  setTimerValue(0);
  updateProgressRing(1);
  showTimerInputUI();

  // Clear invalid states.
  [dom.timerHours, dom.timerMinutes, dom.timerSeconds].forEach((el) => {
    el.classList.remove('timer-input__field--invalid');
  });

  dom.timerStartBtn.textContent = 'Start';
  dom.timerStartBtn.setAttribute('aria-label', 'Start timer');
  dom.timerStartBtn.classList.remove('btn--pause');
  dom.timerStatusDot.hidden = true;
  dom.timerValidation.classList.add('hidden');
};

/**
 * Toggles the timer between start/resume and pause.
 */
const toggleTimer = () => {
  if (timer.running) {
    pauseTimer();
  } else if (timer.remainingMs > 0) {
    // Resume from pause.
    resumeTimer();
  } else {
    // Fresh start.
    startTimer();
  }
};

/**
 * Dismisses the timer completion notification.
 */
const dismissNotification = () => {
  dom.timerNotification.classList.add('hidden');
  resetTimer();
};

// =============================================================================
// NAVIGATION (Tab switching with state persistence — HU-3)
// =============================================================================

/**
 * Activates a tab by name ('stopwatch' or 'timer').
 * @param {string} tabName - The tab to activate.
 */
const activateTab = (tabName) => {
  const isStopwatch = tabName === 'stopwatch';

  // Update tab ARIA states.
  dom.tabStopwatch.setAttribute('aria-selected', String(isStopwatch));
  dom.tabStopwatch.classList.toggle('nav__tab--active', isStopwatch);
  dom.tabStopwatch.setAttribute('tabindex', isStopwatch ? '0' : '-1');

  dom.tabTimer.setAttribute('aria-selected', String(!isStopwatch));
  dom.tabTimer.classList.toggle('nav__tab--active', !isStopwatch);
  dom.tabTimer.setAttribute('tabindex', !isStopwatch ? '0' : '-1');

  // Slide indicator.
  dom.navIndicator.classList.toggle('nav__indicator--right', !isStopwatch);

  // Show/hide panels (no reset — state persists).
  dom.panelStopwatch.classList.toggle('panel--active', isStopwatch);
  dom.panelStopwatch.hidden = !isStopwatch;

  dom.panelTimer.classList.toggle('panel--active', !isStopwatch);
  dom.panelTimer.hidden = isStopwatch;
};

/**
 * Opens the app from the landing page and navigates to the chosen feature.
 * @param {string} tabName - 'stopwatch' or 'timer'.
 */
const openApp = (tabName) => {
  dom.landing.classList.add('hidden');
  dom.app.classList.remove('hidden');
  activateTab(tabName);
};

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Landing page buttons.
dom.landingStopwatchBtn.addEventListener('click', () => openApp('stopwatch'));
dom.landingTimerBtn.addEventListener('click', () => openApp('timer'));

// Tab navigation.
dom.tabStopwatch.addEventListener('click', () => activateTab('stopwatch'));
dom.tabTimer.addEventListener('click', () => activateTab('timer'));

// Keyboard navigation for tabs (arrow keys).
const tabs = [dom.tabStopwatch, dom.tabTimer];
tabs.forEach((tab, index) => {
  tab.addEventListener('keydown', (event) => {
    let targetIndex = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      targetIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = tabs.length - 1;
    }

    if (targetIndex !== null) {
      event.preventDefault();
      tabs[targetIndex].click();
      tabs[targetIndex].focus();
    }
  });
});

// Stopwatch controls.
dom.stopwatchStartBtn.addEventListener('click', toggleStopwatch);
dom.stopwatchResetBtn.addEventListener('click', resetStopwatch);

// Timer controls.
dom.timerStartBtn.addEventListener('click', toggleTimer);
dom.timerResetBtn.addEventListener('click', resetTimer);

// Timer presets.
document.querySelectorAll('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes, 10) || 0;
    const totalSeconds = minutes * 60;

    // Reset any running timer first.
    if (timer.running || timer.remainingMs > 0) {
      timer.running = false;
      timer.startTimestamp = null;
      cancelAnimationFrame(timer.rafId);
      timer.remainingMs = 0;
      showTimerInputUI();
      dom.timerStartBtn.textContent = 'Start';
      dom.timerStartBtn.setAttribute('aria-label', 'Start timer');
      dom.timerStartBtn.classList.remove('btn--pause');
      dom.timerStatusDot.hidden = true;
    }

    setTimerValue(totalSeconds);

    // Auto-start for Pomodoro.
    if (btn.dataset.autostart === 'true') {
      startTimer();
    }
  });
});

// Timer input: live validation & display update on input.
const timerInputFields = [
  { el: dom.timerHours, type: 'hours' },
  { el: dom.timerMinutes, type: 'minutes' },
  { el: dom.timerSeconds, type: 'seconds' },
];

timerInputFields.forEach(({ el, type }) => {
  el.addEventListener('input', () => {
    // Remove invalid state on typing.
    el.classList.remove('timer-input__field--invalid');

    // Live-validate on input.
    const result = validateTimerInput(el.value, type);

    if (!result.valid && el.value !== '' && el.value !== '-') {
      el.classList.add('timer-input__field--invalid');
    }

    // Only update display if timer is not running.
    if (!timer.running && timer.remainingMs === 0) {
      const h = validateTimerInput(dom.timerHours.value, 'hours');
      const m = validateTimerInput(dom.timerMinutes.value, 'minutes');
      const s = validateTimerInput(dom.timerSeconds.value, 'seconds');
      const totalSeconds = parseToSeconds(h.sanitized, m.sanitized, s.sanitized);
      setDisplayMs(dom.timerDisplay, totalSeconds * 1000);
    }
  });

  // On blur: sanitize value to valid range.
  el.addEventListener('blur', () => {
    const result = validateTimerInput(el.value, type);
    el.value = result.sanitized;
    el.classList.remove('timer-input__field--invalid');
  });

  // Select all text on focus for easy editing.
  el.addEventListener('focus', () => {
    el.select();
  });
});

// Notification dismiss.
dom.notificationDismissBtn.addEventListener('click', dismissNotification);

// Close notification with Escape key.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !dom.timerNotification.classList.contains('hidden')) {
    dismissNotification();
  }
});

// =============================================================================
// INITIALIZATION
// =============================================================================

// Set initial progress ring circumference.
dom.timerProgressFill.style.strokeDasharray = PROGRESS_CIRCUMFERENCE;
dom.timerProgressFill.style.strokeDashoffset = 0;

// Export for testing (if running in a module environment).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatTime,
    formatTimeMs,
    parseToSeconds,
    validateTimerInput,
    startStopwatch,
    pauseStopwatch,
    resetStopwatch,
    startTimer,
    pauseTimer,
    resetTimer,
    activateTab,
  };
}
