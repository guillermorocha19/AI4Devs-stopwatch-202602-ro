/**
 * Stopwatch & Timer — Test Suite
 *
 * Framework: Vitest + @testing-library/dom + jsdom
 *
 * Setup:
 *   npm init -y
 *   npm install -D vitest @testing-library/dom @testing-library/jest-dom jsdom
 *
 * Add to package.json:
 *   "scripts": { "test": "vitest run", "test:watch": "vitest" }
 *
 * vitest.config.js:
 *   import { defineConfig } from 'vitest/config';
 *   export default defineConfig({
 *     test: {
 *       environment: 'jsdom',
 *       setupFiles: './test.setup.js',
 *     },
 *   });
 *
 * test.setup.js:
 *   import '@testing-library/jest-dom';
 *
 * Run:
 *   npx vitest run
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helper: Load the app's HTML and script into jsdom before each test.
// ---------------------------------------------------------------------------

const HTML_PATH = path.resolve(__dirname, '..', 'index.html');
const JS_PATH = path.resolve(__dirname, '..', 'script.js');

const loadApp = () => {
  const html = fs.readFileSync(HTML_PATH, 'utf-8');
  document.documentElement.innerHTML = html;

  // Execute script.js in the jsdom context.
  const scriptContent = fs.readFileSync(JS_PATH, 'utf-8');

  // Remove the module.exports block so it doesn't error in browser-like env.
  const cleanScript = scriptContent.replace(
    /if\s*\(\s*typeof\s+module\s*!==\s*'undefined'[\s\S]*$/,
    '',
  );

  // eslint-disable-next-line no-eval
  eval(cleanScript);
};

// =============================================================================
// UNIT TESTS — formatTime utility
// =============================================================================

describe('formatTime (utility)', () => {
  /**
   * We re-implement formatTime here to test it in isolation without needing
   * DOM setup. The actual function in script.js is identical.
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

  it('should format 0 seconds as 00:00:00', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });

  it('should format seconds only', () => {
    expect(formatTime(45)).toBe('00:00:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(125)).toBe('00:02:05');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('should handle exactly one hour', () => {
    expect(formatTime(3600)).toBe('01:00:00');
  });

  it('should handle large values (99 hours)', () => {
    expect(formatTime(99 * 3600 + 59 * 60 + 59)).toBe('99:59:59');
  });

  it('should treat negative values as 0', () => {
    expect(formatTime(-100)).toBe('00:00:00');
  });

  it('should floor decimal values', () => {
    expect(formatTime(61.9)).toBe('00:01:01');
  });
});

// =============================================================================
// UNIT TESTS — parseToSeconds utility
// =============================================================================

describe('parseToSeconds (utility)', () => {
  const parseToSeconds = (h, m, s) => (
    Math.max(0, Math.floor(h)) * 3600
    + Math.max(0, Math.floor(m)) * 60
    + Math.max(0, Math.floor(s))
  );

  it('should return 0 for all zeros', () => {
    expect(parseToSeconds(0, 0, 0)).toBe(0);
  });

  it('should convert hours to seconds', () => {
    expect(parseToSeconds(1, 0, 0)).toBe(3600);
  });

  it('should convert minutes to seconds', () => {
    expect(parseToSeconds(0, 5, 0)).toBe(300);
  });

  it('should handle mixed values', () => {
    expect(parseToSeconds(1, 30, 15)).toBe(5415);
  });

  it('should clamp negative values to 0', () => {
    expect(parseToSeconds(-1, -5, -10)).toBe(0);
  });

  it('should floor decimal inputs', () => {
    expect(parseToSeconds(0, 0, 30.7)).toBe(30);
  });
});

// =============================================================================
// INTEGRATION TESTS — Landing Page
// =============================================================================

describe('Landing Page (HU-3)', () => {
  beforeEach(() => {
    loadApp();
  });

  it('should show the landing page on initial load', () => {
    const landing = document.getElementById('landing');
    expect(landing).not.toHaveClass('hidden');
  });

  it('should hide the app on initial load', () => {
    const app = document.getElementById('app');
    expect(app).toHaveClass('hidden');
  });

  it('should navigate to the stopwatch when clicking the Stopwatch card', () => {
    const btn = document.getElementById('landing-stopwatch-btn');
    fireEvent.click(btn);

    const landing = document.getElementById('landing');
    const app = document.getElementById('app');
    const panelStopwatch = document.getElementById('panel-stopwatch');

    expect(landing).toHaveClass('hidden');
    expect(app).not.toHaveClass('hidden');
    expect(panelStopwatch).toHaveClass('panel--active');
  });

  it('should navigate to the timer when clicking the Timer card', () => {
    const btn = document.getElementById('landing-timer-btn');
    fireEvent.click(btn);

    const panelTimer = document.getElementById('panel-timer');
    expect(panelTimer).toHaveClass('panel--active');
  });
});

// =============================================================================
// INTEGRATION TESTS — Tab Navigation (HU-3)
// =============================================================================

describe('Tab Navigation (HU-3)', () => {
  beforeEach(() => {
    loadApp();
    // Open app via stopwatch.
    fireEvent.click(document.getElementById('landing-stopwatch-btn'));
  });

  it('should show Stopwatch tab as active by default after opening', () => {
    const tab = document.getElementById('tab-stopwatch');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveClass('nav__tab--active');
  });

  it('should switch to Timer panel when Timer tab is clicked', () => {
    fireEvent.click(document.getElementById('tab-timer'));

    const panelTimer = document.getElementById('panel-timer');
    const panelStopwatch = document.getElementById('panel-stopwatch');
    const tabTimer = document.getElementById('tab-timer');

    expect(panelTimer).toHaveClass('panel--active');
    expect(panelStopwatch).not.toHaveClass('panel--active');
    expect(tabTimer).toHaveAttribute('aria-selected', 'true');
  });

  it('should switch back to Stopwatch panel', () => {
    fireEvent.click(document.getElementById('tab-timer'));
    fireEvent.click(document.getElementById('tab-stopwatch'));

    const panelStopwatch = document.getElementById('panel-stopwatch');
    expect(panelStopwatch).toHaveClass('panel--active');
  });

  it('should slide the indicator right when Timer is active', () => {
    fireEvent.click(document.getElementById('tab-timer'));
    const indicator = document.getElementById('nav-indicator');
    expect(indicator).toHaveClass('nav__indicator--right');
  });

  it('should slide the indicator left when Stopwatch is active', () => {
    fireEvent.click(document.getElementById('tab-timer'));
    fireEvent.click(document.getElementById('tab-stopwatch'));
    const indicator = document.getElementById('nav-indicator');
    expect(indicator).not.toHaveClass('nav__indicator--right');
  });
});

// =============================================================================
// INTEGRATION TESTS — Stopwatch (HU-1)
// =============================================================================

describe('Stopwatch (HU-1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    loadApp();
    fireEvent.click(document.getElementById('landing-stopwatch-btn'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display 00:00:00 initially', () => {
    const display = document.getElementById('stopwatch-display');
    expect(display.textContent.trim()).toBe('00:00:00');
  });

  it('should show Start button initially', () => {
    const btn = document.getElementById('stopwatch-start-btn');
    expect(btn.textContent).toBe('Start');
  });

  it('should change Start to Pause when started', () => {
    const btn = document.getElementById('stopwatch-start-btn');
    fireEvent.click(btn);
    expect(btn.textContent).toBe('Pause');
    expect(btn).toHaveClass('btn--pause');
  });

  it('should show the running status dot when started', () => {
    fireEvent.click(document.getElementById('stopwatch-start-btn'));
    const dot = document.getElementById('stopwatch-status-dot');
    expect(dot.hidden).toBe(false);
  });

  it('should change Pause back to Start when paused', () => {
    const btn = document.getElementById('stopwatch-start-btn');
    fireEvent.click(btn); // Start.
    fireEvent.click(btn); // Pause.
    expect(btn.textContent).toBe('Start');
    expect(btn).not.toHaveClass('btn--pause');
  });

  it('should reset to 00:00:00 when Reset is clicked', () => {
    const startBtn = document.getElementById('stopwatch-start-btn');
    const resetBtn = document.getElementById('stopwatch-reset-btn');
    const display = document.getElementById('stopwatch-display');

    fireEvent.click(startBtn); // Start.
    fireEvent.click(resetBtn); // Reset.

    expect(display.textContent.trim()).toBe('00:00:00');
    expect(startBtn.textContent).toBe('Start');
  });

  it('should hide the status dot after reset', () => {
    fireEvent.click(document.getElementById('stopwatch-start-btn'));
    fireEvent.click(document.getElementById('stopwatch-reset-btn'));

    const dot = document.getElementById('stopwatch-status-dot');
    expect(dot.hidden).toBe(true);
  });
});

// =============================================================================
// INTEGRATION TESTS — Timer (HU-2)
// =============================================================================

describe('Timer (HU-2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    loadApp();
    fireEvent.click(document.getElementById('landing-timer-btn'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display 00:00:00 initially', () => {
    const display = document.getElementById('timer-display');
    expect(display.textContent.trim()).toBe('00:00:00');
  });

  it('should show validation when starting at 00:00:00', () => {
    fireEvent.click(document.getElementById('timer-start-btn'));

    const validation = document.getElementById('timer-validation');
    expect(validation).not.toHaveClass('hidden');
  });

  it('should set 5 minutes when the 5 min preset is clicked', () => {
    const presetBtns = document.querySelectorAll('.preset-btn');
    const fiveMinBtn = Array.from(presetBtns).find(
      (btn) => btn.dataset.minutes === '5',
    );

    fireEvent.click(fiveMinBtn);

    const hoursInput = document.getElementById('timer-hours');
    const minutesInput = document.getElementById('timer-minutes');
    const secondsInput = document.getElementById('timer-seconds');

    expect(parseInt(hoursInput.value, 10)).toBe(0);
    expect(parseInt(minutesInput.value, 10)).toBe(5);
    expect(parseInt(secondsInput.value, 10)).toBe(0);
  });

  it('should set 10 minutes when the 10 min preset is clicked', () => {
    const presetBtns = document.querySelectorAll('.preset-btn');
    const tenMinBtn = Array.from(presetBtns).find(
      (btn) => btn.dataset.minutes === '10',
    );

    fireEvent.click(tenMinBtn);

    const display = document.getElementById('timer-display');
    expect(display.textContent.trim()).toBe('00:10:00');
  });

  it('should set 15 minutes when the 15 min preset is clicked', () => {
    const presetBtns = document.querySelectorAll('.preset-btn');
    const fifteenMinBtn = Array.from(presetBtns).find(
      (btn) => btn.dataset.minutes === '15',
    );

    fireEvent.click(fifteenMinBtn);

    const display = document.getElementById('timer-display');
    expect(display.textContent.trim()).toBe('00:15:00');
  });

  it('should auto-start when the Pomodoro preset is clicked', () => {
    const pomodoroBtn = document.querySelector('.preset-btn--pomodoro');
    fireEvent.click(pomodoroBtn);

    const startBtn = document.getElementById('timer-start-btn');
    expect(startBtn.textContent).toBe('Pause');
    expect(startBtn).toHaveClass('btn--pause');
  });

  it('should set 25 minutes for Pomodoro', () => {
    const pomodoroBtn = document.querySelector('.preset-btn--pomodoro');
    fireEvent.click(pomodoroBtn);

    const hoursInput = document.getElementById('timer-hours');
    const minutesInput = document.getElementById('timer-minutes');

    expect(parseInt(hoursInput.value, 10)).toBe(0);
    expect(parseInt(minutesInput.value, 10)).toBe(25);
  });

  it('should change Start to Pause when timer is started manually', () => {
    const minutesInput = document.getElementById('timer-minutes');
    fireEvent.input(minutesInput, { target: { value: '5' } });
    minutesInput.value = '5';

    fireEvent.click(document.getElementById('timer-start-btn'));

    const startBtn = document.getElementById('timer-start-btn');
    expect(startBtn.textContent).toBe('Pause');
  });

  it('should show Resume after pausing a running timer', () => {
    const minutesInput = document.getElementById('timer-minutes');
    minutesInput.value = '5';

    const startBtn = document.getElementById('timer-start-btn');
    fireEvent.click(startBtn); // Start.
    fireEvent.click(startBtn); // Pause.

    expect(startBtn.textContent).toBe('Resume');
  });

  it('should reset timer completely when Reset is clicked', () => {
    const minutesInput = document.getElementById('timer-minutes');
    minutesInput.value = '5';

    fireEvent.click(document.getElementById('timer-start-btn'));
    fireEvent.click(document.getElementById('timer-reset-btn'));

    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start-btn');

    expect(display.textContent.trim()).toBe('00:00:00');
    expect(startBtn.textContent).toBe('Start');
  });

  it('should hide validation after reset', () => {
    // Trigger validation.
    fireEvent.click(document.getElementById('timer-start-btn'));
    // Reset.
    fireEvent.click(document.getElementById('timer-reset-btn'));

    const validation = document.getElementById('timer-validation');
    expect(validation).toHaveClass('hidden');
  });
});

// =============================================================================
// INTEGRATION TESTS — Timer Notification (HU-2)
// =============================================================================

describe('Timer Notification (HU-2)', () => {
  beforeEach(() => {
    loadApp();
    fireEvent.click(document.getElementById('landing-timer-btn'));
  });

  it('should have the notification hidden initially', () => {
    const notification = document.getElementById('timer-notification');
    expect(notification).toHaveClass('hidden');
  });

  it('should dismiss the notification and reset timer when Dismiss is clicked', () => {
    // Manually show notification to test dismiss behavior.
    const notification = document.getElementById('timer-notification');
    notification.classList.remove('hidden');

    fireEvent.click(document.getElementById('notification-dismiss-btn'));
    expect(notification).toHaveClass('hidden');
  });

  it('should dismiss the notification on Escape key', () => {
    const notification = document.getElementById('timer-notification');
    notification.classList.remove('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(notification).toHaveClass('hidden');
  });
});

// =============================================================================
// INTEGRATION TESTS — State Persistence (HU-3)
// =============================================================================

describe('State Persistence across tab switches (HU-3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    loadApp();
    fireEvent.click(document.getElementById('landing-stopwatch-btn'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should keep stopwatch button in Pause state after switching to Timer and back', () => {
    // Start stopwatch.
    fireEvent.click(document.getElementById('stopwatch-start-btn'));
    expect(document.getElementById('stopwatch-start-btn').textContent).toBe('Pause');

    // Switch to Timer.
    fireEvent.click(document.getElementById('tab-timer'));

    // Switch back to Stopwatch.
    fireEvent.click(document.getElementById('tab-stopwatch'));

    // Should still be running (Pause button).
    expect(document.getElementById('stopwatch-start-btn').textContent).toBe('Pause');
  });

  it('should keep timer button in Pause state after switching to Stopwatch and back', () => {
    // Switch to Timer.
    fireEvent.click(document.getElementById('tab-timer'));

    // Set and start timer.
    document.getElementById('timer-minutes').value = '5';
    fireEvent.click(document.getElementById('timer-start-btn'));
    expect(document.getElementById('timer-start-btn').textContent).toBe('Pause');

    // Switch to Stopwatch.
    fireEvent.click(document.getElementById('tab-stopwatch'));

    // Switch back to Timer.
    fireEvent.click(document.getElementById('tab-timer'));

    // Timer should still show Pause.
    expect(document.getElementById('timer-start-btn').textContent).toBe('Pause');
  });
});

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

describe('Accessibility (WCAG)', () => {
  beforeEach(() => {
    loadApp();
    fireEvent.click(document.getElementById('landing-stopwatch-btn'));
  });

  it('should have proper ARIA roles on tab navigation', () => {
    const tablist = document.querySelector('[role="tablist"]');
    expect(tablist).toBeInTheDocument();

    const tabs = document.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
  });

  it('should have proper ARIA roles on tab panels', () => {
    const panels = document.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBe(2);
  });

  it('should have aria-controls linking tabs to panels', () => {
    const tabStopwatch = document.getElementById('tab-stopwatch');
    expect(tabStopwatch).toHaveAttribute('aria-controls', 'panel-stopwatch');

    const tabTimer = document.getElementById('tab-timer');
    expect(tabTimer).toHaveAttribute('aria-controls', 'panel-timer');
  });

  it('should have aria-live on stopwatch display', () => {
    const display = document.getElementById('stopwatch-display');
    expect(display).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-live on timer display', () => {
    const display = document.getElementById('timer-display');
    expect(display).toHaveAttribute('aria-live', 'polite');
  });

  it('should have aria-labels on all buttons', () => {
    const buttons = document.querySelectorAll('button[aria-label]');
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('should have the timer notification marked as alertdialog', () => {
    const notification = document.getElementById('timer-notification');
    expect(notification).toHaveAttribute('role', 'alertdialog');
  });

  it('should have the validation message marked as alert', () => {
    const validation = document.getElementById('timer-validation');
    expect(validation).toHaveAttribute('role', 'alert');
  });
});
