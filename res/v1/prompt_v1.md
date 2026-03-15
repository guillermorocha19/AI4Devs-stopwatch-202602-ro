Chatbot utilized: **Claude Opus 4.6**

# Stopwatch & Timer app

## Persona
Take on the role of a senior software engineer with extensive expertise in designing and developing HTML + JavaScript-based websites.

## Context
You have been assigned a task where you must develop a first version (an MVP) of a website with JavaScript logic where users will have access to two main features: stopwatch and countdown timer. The features are described in the following user stories:

### HU-1: Stopwatch
#### Definition
**As** a user of the app,
**I want** a stopwatch with start, pause, and reset controls,
**so that** I can accurately track the time I spend on my tasks.
#### Acceptance criteria
1. **Display:** The stopwatch must display the time in digital format **HH:MM:SS**.
2. **Start action:** When you click the **"Start"** button, the counter should begin counting up.
3. **Pause action:** When you click the **"Pause"** button, the timer should stop and display the current time on the screen. If you close the app, the timer will restart.
4. **Reset action:** When you click the **"Reset"** button, the timer should reset to **00:00:00**.
5. **Button states:** While the timer is running, the "Start" button should change to "Pause." The "Reset" button should always be available.

### HU-2 - Countdown timer with presets
#### Definition
**As** a user of the app,  
**I want** to be able to set a specific time or select presets and start a countdown,  
**so that** I can manage my time and receive a notification when the time is up.
#### Acceptance criteria
1. **Time settings:** The user must be able to manually enter the start time (HH:MM:SS).
2. **Preset times:** The interface must display at least three quick-access buttons (**5 min**, **10 min** and **15 min**) that automatically load the time.
3. **Pomodoro timer:** The interface will display a special quick-access button labeled "**🍅 Pomodoro time!**" that will automatically set a 25-minute timer and start the countdown immediately.
4. **Start action:** When you click **"Start"**, the timer should count down second by second.
5. **Pause/Resume function:** The user should be able to pause the countdown and resume it from the point where it was paused.
6. **Completion:** When the time reaches **00:00:00**, the system must display an on-screen notification and play an audio alert.
7. **Validation:** The timer cannot be started if the value is **00:00:00**.

### HU-3 - Switching between stopwatch and timer
#### Definition
**As** a user of the app,  
**I want** to have a menu and navigation tabs,  
**so that** I can quickly and easily switch between the **Stopwatch** (HU-1) and **Timer** (HU-2) features.
#### Acceptance criteria
1. **Navigation UI:** The system must feature a clearly visible navigation bar and tab system.
2. **Active status indicator:** The tab for the feature the user is currently using should be visually highlighted.
3. **State persistence:** If the user is running the Stopwatch and switches to the Timer tab, the Stopwatch should continue running in the background (it should not reset when navigating). The same behavior applies if I am in the Timer and switch to the Stopwatch.
4. **Response time:** Switching between views should be instantaneous (without a full reload of the page or application).

## Desired outcome
Two files: 
* index.html: main structure that will include the following elements
    * When you launch the app for the first time, you'll be given two options to choose from: Stopwatch or Timer
    * A container for the stopwatch or timer
    * The navigation system between features
* script.js: contains the JavaScript code that implements the navigation, stopwatch, and timer logic.

## Tone + style
Provide comments and follow programming best practices for Javascript (ESLint + Prettier + Airbnb Style Guide)
Add a layer of tests to the generated code using Vitest and Testing Library for unit and integration tests.

## # Of Options
* The count should be based on the system time
* If the browser supports it, send a desktop notification when the time runs out
* The alert sound file should be small (`.mp3` or `.ogg`) and no longer than 5 seconds
* **Accessibility:** The application must comply with the accessibility standards outlined in WCAG

## Output style
* Use the [LiDR](https://www.lidr.co/) brand colors.
* The visual result should be professional and visually appealing. Be creative.
* The UI must be responsive

## Extra
I am attaching the index.html and script.js files for you to use as seeds.
Generate a plan, show it to me, and if I approve it, move on to implementation