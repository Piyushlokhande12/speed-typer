# TypingTest.com 40 WPM Auto-Typer (Playwright)

An automated typewriter bot configured to type naturally at **40 WPM** on [TypingTest.com](https://www.typingtest.com/).

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Run the Typer
```bash
node typer.js
```

---

## 🎯 How to Enable & Start Writing (Step-by-Step)

1. Run `node typer.js` in your terminal.
2. A Chrome browser window will automatically open and navigate to the typing test page.
3. The script automatically fetches/intercepts the exact passage text to type.
4. **When you are ready to type**:
   - Focus on the typing area in the browser window (or click *"Click to start!"*).
   - Switch back to your terminal window and press **`[ENTER]`**.
5. The bot will automatically take focus and type character-by-character at **~40 WPM** with realistic human jitter and natural punctuation pauses!

---

## ⚙️ Configuration

Open [typer.js](speed_writer/typer.js) to customize:
* `targetWPM`: Set your desired speed (default: `40`).
* `jitterMs`: Variation per keystroke to mimic human fingers (default: `35ms`).
* `autoStart`: Set to `true` if you want it to start typing automatically without waiting for `[ENTER]`.
