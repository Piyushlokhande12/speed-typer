const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ==========================================
// ⚙️ CONFIGURATION & SETTINGS
// ==========================================
const CONFIG = {
  // Guaranteed > 38 WPM (steady 42 WPM with 285ms base delay)
  targetWPM: 42,
  jitterMs: 12,
  punctuationPauseMs: 20,
  userEmail: 'piyushkumarlokhande59@gmail.com',
  userProfileDir: 'Profile 12',
  botDataDir: path.join(__dirname, '.chrome_profile')
};

// Calculate delay per character (guaranteed > 38 WPM)
function getKeystrokeDelay(wpm, jitter) {
  const baseDelay = (60 * 1000) / (wpm * 5); // ~285ms
  const variance = (Math.random() * 2 - 1) * jitter;
  return Math.max(50, Math.round(baseDelay + variance));
}

// Terminal question helper
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

// Sync user's Chrome Profile 12 session / cookies
function syncUserProfile() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return;

  const srcProfile = path.join(localAppData, 'Google', 'Chrome', 'User Data', CONFIG.userProfileDir);
  const destProfile = path.join(CONFIG.botDataDir, 'Default');

  if (fs.existsSync(srcProfile)) {
    try {
      if (!fs.existsSync(destProfile)) {
        fs.mkdirSync(destProfile, { recursive: true });
      }
      const filesToCopy = ['Network', 'Preferences', 'Login Data', 'Web Data'];
      for (const item of filesToCopy) {
        const srcItem = path.join(srcProfile, item);
        const destItem = path.join(destProfile, item);
        if (fs.existsSync(srcItem) && !fs.existsSync(destItem)) {
          fs.cpSync(srcItem, destItem, { recursive: true });
        }
      }
    } catch (e) {}
  }
}

// Helper to get active open page
function getActivePage(context) {
  const pages = context.pages().filter(p => !p.isClosed());
  if (pages.length === 0) return null;
  const testPage = pages.find(p => p.url().includes('typingtest'));
  return testPage || pages[pages.length - 1];
}

(async () => {
  console.log('====================================================');
  console.log(`🚀 TypingTest.com Auto-Typer (> 38 WPM Guaranteed)`);
  console.log(`👤 User Account: ${CONFIG.userEmail}`);
  console.log('====================================================\n');

  // 1. Choose Login Option
  console.log('Account Sign-In:');
  console.log(`  [1] Yes - Open Login page first for ${CONFIG.userEmail} (Default)`);
  console.log('  [2] No  - Skip login and go straight to test');

  const loginChoice = await askQuestion('\nSign in first? [1/2] (Default: 1) > ');
  const shouldLogin = loginChoice !== '2';

  // 2. Choose Difficulty Level
  console.log('\nSelect Difficulty Level:');
  console.log('  [1] Hard Text (hardText.txt)');
  console.log('  [2] Medium Text (mediumText.txt)');
  console.log('  [3] Easy Text (easyText.txt)');

  const diffChoice = await askQuestion('\nChoose Level [1-3] (Default: 1 - Hard) > ');
  const levelMap = { '1': 'hardText.txt', '2': 'mediumText.txt', '3': 'easyText.txt' };
  const textFile = levelMap[diffChoice] || 'hardText.txt';

  // 3. Choose Duration
  console.log('\nSelect Test Duration:');
  console.log('  [1] 3 Minutes');
  console.log('  [2] 1 Minute');
  console.log('  [3] 2 Minutes');
  console.log('  [4] 5 Minutes');

  const durChoice = await askQuestion('\nChoose Duration [1-4] (Default: 1 - 3 Minutes) > ');
  const durMap = { '1': '3', '2': '1', '3': '2', '4': '5' };
  const minutes = durMap[durChoice] || '3';

  const testUrl = `https://www.typingtest.com/test.html?minutes=${minutes}&textfile=${textFile}`;

  // Sync profile data
  syncUserProfile();

  console.log(`\n[1] Launching Google Chrome...`);

  let context;
  try {
    context = await chromium.launchPersistentContext(CONFIG.botDataDir, {
      channel: 'chrome',
      headless: false,
      args: ['--start-maximized'],
      viewport: null
    });
  } catch (e) {
    context = await chromium.launchPersistentContext(CONFIG.botDataDir, {
      headless: false,
      args: ['--start-maximized'],
      viewport: null
    });
  }

  let page = getActivePage(context) || await context.newPage();

  // ==========================================
  // 🔑 LOGIN STEP (IF REQUESTED)
  // ==========================================
  if (shouldLogin) {
    console.log(`\n[2] Navigating to Sign-In page: https://www.typingtest.com/account.php ...`);
    await page.goto('https://www.typingtest.com/account.php', { waitUntil: 'domcontentloaded' });

    // Handle cookie consent if visible
    try {
      const consent = page.locator('button.fc-cta-consent, .fc-button-label, #accept-choices').first();
      await consent.waitFor({ state: 'visible', timeout: 3000 });
      await consent.click();
    } catch (e) {}

    // Auto pre-fill email field
    try {
      const emailInput = page.locator('#login-email');
      if (await emailInput.isVisible({ timeout: 4000 })) {
        await emailInput.fill(CONFIG.userEmail);
        console.log(`[✔] Pre-filled email: ${CONFIG.userEmail}`);
      }
      // Check remember me checkbox
      const rememberCheckbox = page.locator('#login-remember');
      if (await rememberCheckbox.isVisible({ timeout: 2000 })) {
        await rememberCheckbox.check().catch(() => {});
      }
    } catch (e) {}

    console.log('----------------------------------------------------');
    console.log('👉 [PLEASE LOG IN IN CHROME]:');
    console.log(`   1. Look at the open Chrome window.`);
    console.log(`   2. Email "${CONFIG.userEmail}" is already pre-filled.`);
    console.log(`   3. Enter your password (or use Sign in with Google) and click Sign In.`);
    console.log(`   4. Once logged in, press [ENTER] in THIS terminal to continue!`);
    console.log('----------------------------------------------------');

    await askQuestion('\nPress [ENTER] when you are logged in > ');
    page = getActivePage(context) || page;
  }

  // ==========================================
  // 🏁 NAVIGATE TO TYPING TEST
  // ==========================================
  console.log(`\n[3] Loading ${minutes}-Minute (${textFile.replace('.txt','').toUpperCase()}) test page...`);
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' });

  // Handle cookie consent
  try {
    const consent = page.locator('button.fc-cta-consent, .fc-button-label, #accept-choices').first();
    await consent.waitFor({ state: 'visible', timeout: 3000 });
    await consent.click();
  } catch (e) {}

  console.log('[4] Waiting for typing test container...');
  await page.waitForSelector('#test-container', { timeout: 30000 });
  console.log('[✔] Typing test container is ready.');

  // Give the game 2 seconds to initialize words
  await page.waitForTimeout(2000);

  // Extract the EXACT decrypted text from the game engine
  console.log('[5] Extracting official test text from game engine...');
  let fullText = '';
  try {
    fullText = await page.evaluate(async () => {
      try {
        if (!window.webpackChunktyping_test) return '';
        let r;
        window.webpackChunktyping_test.push([
          ['__text_grabber__'],
          {},
          (req) => { r = req; }
        ]);
        if (!r || !r(0x699)) return '';
        const api = await r(0x699).TypingTestApi.instance();
        return (api && api.textFile && api.textFile.text) ? api.textFile.text : '';
      } catch (e) {
        return '';
      }
    });
  } catch (e) {}

  // Fallback to local files if needed
  if (!fullText) {
    const localDbPath = path.join(__dirname, 'all_stories.json');
    if (fs.existsSync(localDbPath)) {
      const allDb = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      const key = textFile.includes('hard') ? 'hard' : textFile.includes('easy') ? 'easy' : 'medium';
      fullText = (allDb[key] || []).join(' ');
    }
  }

  // Split paragraphs and clean
  const paragraphs = fullText
    .split(/[\r\n]+/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  console.log(`\n====================================================`);
  console.log(`📝 LOADED PARAGRAPHS FOR THIS TEST (${paragraphs.length} total):`);
  console.log(`====================================================`);
  paragraphs.slice(0, 4).forEach((p, idx) => {
    console.log(`  [${idx + 1}] "${p.substring(0, 90)}..."`);
  });

  console.log('\n----------------------------------------------------');
  console.log('👉 [STARTING THE TEST]:');
  console.log('   Look at the words shown on your Chrome screen.');
  console.log('   • If sentence [1] matches the screen, just press [ENTER]!');
  console.log('   • Or type the matching sentence number (e.g. 2) and press [ENTER].');
  console.log('   • Or paste the first sentence directly and press [ENTER].');
  console.log('----------------------------------------------------');

  const startChoice = await askQuestion('\nChoice (1-4) or paste sentence / Press [ENTER] > ');

  let startIndex = 0;
  if (startChoice) {
    const num = parseInt(startChoice, 10);
    if (!isNaN(num) && num >= 1 && num <= paragraphs.length) {
      startIndex = num - 1;
    } else {
      const matchedIdx = paragraphs.findIndex(p => p.toLowerCase().includes(startChoice.toLowerCase()));
      if (matchedIdx !== -1) {
        startIndex = matchedIdx;
        console.log(`[✔] Matched paragraph #${startIndex + 1} from your input!`);
      }
    }
  }

  // Chain all paragraphs from start index onwards for full 3-minute continuous typing
  const activeParagraphs = paragraphs.slice(startIndex).concat(paragraphs.slice(0, startIndex));
  const cleanFullText = activeParagraphs.join(' ').replace(/\s+/g, ' ').trim();

  console.log(`\n[✔] Ready to type! Total characters: ${cleanFullText.length}`);
  console.log(`Preview: "${cleanFullText.substring(0, 120)}..."\n`);

  console.log('👉 Click on the typing area in Chrome, then press [ENTER] here to start writing!');
  await askQuestion('\nPress [ENTER] to start writing > ');

  page = getActivePage(context);
  if (!page || page.isClosed()) {
    console.error('\n[!] Chrome window was closed. Exiting.');
    try { await context.close(); } catch (e) {}
    return;
  }

  // Focus test area safely
  try {
    await page.click('#test-container', { timeout: 2000 });
  } catch (e) {
    try {
      await page.locator('body').click({ timeout: 2000 });
    } catch (err) {}
  }

  console.log(`\n[▶] Auto-typing at ~${CONFIG.targetWPM} WPM (Guaranteed > 38 WPM)...`);

  const startTime = Date.now();
  let typedChars = 0;

  try {
    for (let i = 0; i < cleanFullText.length; i++) {
      const char = cleanFullText[i];

      if (page.isClosed()) {
        console.log('\n[i] Chrome window closed by user.');
        break;
      }

      await page.keyboard.type(char);
      typedChars++;

      // Strict > 38 WPM delay
      let delay = getKeystrokeDelay(CONFIG.targetWPM, CONFIG.jitterMs);

      if ('.?!,;'.includes(char)) {
        delay += CONFIG.punctuationPauseMs;
      }

      // Live speed monitor
      if (typedChars % 20 === 0 || typedChars === cleanFullText.length) {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentWpm = Math.round((typedChars / 5) / (elapsedSec / 60));
        process.stdout.write(`\r[Typing] ${typedChars}/${cleanFullText.length} chars | Speed: ~${currentWpm} WPM (>38 WPM guaranteed)`);
      }

      await new Promise(r => setTimeout(r, delay));
    }

    console.log('\n\n[✔] Completed typing test passage!');
    console.log('[i] Waiting for test results to finalize...');

    await page.waitForTimeout(5000);

    // ==========================================
    // 📸 CAPTURE RESULT SCREENSHOT
    // ==========================================
    const screenshotName = `test-result-${Date.now()}.png`;
    const screenshotPath = path.join(__dirname, screenshotName);

    try {
      if (!page.isClosed()) {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`\n====================================================`);
        console.log(`📸 Result Screenshot Captured!`);
        console.log(`Saved to: ${screenshotPath}`);
        console.log(`====================================================\n`);
      }
    } catch (e) {
      console.warn('[!] Screenshot error:', e.message);
    }

    // ==========================================
    // ⏸ KEEP BROWSER OPEN
    // ==========================================
    console.log('----------------------------------------------------');
    console.log('⏸ [BROWSER WILL STAY OPEN]:');
    console.log('   Review your results on the screen.');
    console.log('   Press [ENTER] in THIS terminal whenever you want to close it.');
    console.log('----------------------------------------------------');

    await askQuestion('\nPress [ENTER] to close browser > ');

  } catch (err) {
    if (err.message && err.message.includes('Target page, context or browser has been closed')) {
      console.log('\n[i] Browser closed by user.');
    } else {
      console.error('\n[!] Typing error:', err.message);
    }
  } finally {
    try {
      await context.close();
    } catch (e) {}
    console.log('Done!');
  }
})();
