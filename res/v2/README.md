# ⏱ Stopwatch & Timer

> A sleek, dark-themed stopwatch and countdown timer built with vanilla HTML, CSS & JS. No frameworks, no dependencies, just vibes. 🚀

---

## ✨ Features

**🏃 Stopwatch (HU-1)**
- Digital display in `HH:MM:SS.mmm` format (yep, milliseconds too!)
- Start / Pause / Reset — the holy trinity
- Drift-proof timing based on system clock (`Date.now()`)
- Running indicator dot in the tab so you always know what's ticking

**⏳ Countdown Timer (HU-2)**
- Manual time entry with HH:MM:SS input fields
- Quick presets: **5 min**, **10 min**, **15 min**
- 🍅 **Pomodoro mode** — 25 min, auto-starts on click
- Input validation: no letters, no negatives, no out-of-range values
- On completion: modal notification + audio beep + desktop notification
- SVG progress ring for that extra visual feedback ✨

**🔄 Navigation (HU-3)**
- Landing page with feature picker cards
- Tab navigation with animated sliding indicator
- **State persistence** — switch tabs without losing your running timers
- Full keyboard navigation (arrows, Home, End, Escape)

---

## 🎨 Design

Built around a **dark theme** inspired by [LiDR](https://www.lidr.co/)'s brand identity:

- **Background:** deep navy `#0B0F1A`
- **Accent:** electric blue `#3B82F6`
- **Success:** teal `#06D6A0`
- **Pomodoro/Pause:** warm orange `#F97316`
- **Fonts:** JetBrains Mono (display) + Outfit (UI)

Fully responsive and mobile-first. Looks great on everything from a phone to a widescreen. 📱💻

---

## ♿ Accessibility

We take WCAG seriously around here:

- Semantic HTML with proper ARIA roles (`tablist`, `tab`, `tabpanel`, `alert`, `alertdialog`)
- `aria-live` regions for real-time display updates
- Complete keyboard navigation
- `prefers-reduced-motion` support — no surprise animations
- Color contrast ≥ 4.5:1

---

## 🚀 Getting Started

### Run the app

Just open `index.html` in your browser. That's it. No build step, no bundler, no drama. 🎉

Make sure these three files are in the same folder:
```
index.html
styles.css
script.js
```

### Run the tests

```bash
cd tests
npm install
npx vitest run
```

Or in watch mode for development:
```bash
npx vitest
```

---

## 📁 Project Structure

```
res/v1/
├── index.html          # 🏠 Main HTML structure + ARIA
├── styles.css          # 🎨 All the pretty stuff (LiDR theme)
├── script.js           # 🧠 Stopwatch, timer, navigation logic
├── README.md           # 📖 You are here!
└── tests/
    ├── app.test.js     # 🧪 60+ tests (unit + integration)
    ├── vitest.config.js
    ├── test.setup.js
    └── package.json
```

---

## 🧪 Test Coverage

**60+ tests** organized across 10 `describe` blocks:

| Block | What it covers |
|---|---|
| `formatTime` | Time formatting edge cases |
| `formatTimeMs` | Millisecond formatting |
| `parseToSeconds` | Input parsing |
| `validateTimerInput` | Empty, chars, negatives, range limits |
| Landing Page | Initial state, navigation |
| Tab Navigation | Switching, indicator, ARIA states |
| Stopwatch | Start/Pause/Reset, display, status dot |
| Timer | Presets, Pomodoro, manual start, pause/resume |
| Timer Input Validation | Invalid inputs, error states, recovery |
| Timer Notification | Ok! button, Escape key dismiss |
| State Persistence | Tabs don't kill running timers |
| Accessibility | ARIA roles, labels, live regions |

**Stack:** Vitest + Testing Library + jsdom

---

## 🛠 Tech Decisions

| Decision | Why |
|---|---|
| `Date.now()` + `requestAnimationFrame` | No timer drift, smooth 60fps updates |
| Web Audio API for beeps | Zero external audio files needed |
| Vanilla JS, no framework | MVP simplicity, zero bundle overhead |
| CSS Custom Properties + BEM | Clean, themeable, maintainable |
| Input validation on blur + start | Prevents garbage data without being annoying |

---

## 📝 Contributing

1. Fork it 🍴
2. Create your feature branch (`git checkout -b feature/amazing-thing`)
3. Commit your changes (`git commit -m 'feat: add amazing thing'`)
4. Push to the branch (`git push origin feature/amazing-thing`)
5. Open a Pull Request 🎯

---

## 📄 License

This project was built as part of a [LiDR](https://www.lidr.co/) AI4Devs exercise.

---

Made with ☕ and a lot of `requestAnimationFrame` calls.
