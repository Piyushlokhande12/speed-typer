const { chromium } = require('playwright');

(async () => {
  const context = await chromium.launchPersistentContext('./chrome_profile', {
    headless: false,
    channel: 'chrome',
  });
  const page = context.pages()[0] || await context.newPage();

  await page.goto('https://www.linkedin.com/feed/');

  // First run: log in yourself in the window, then press Enter in the terminal
  console.log('Log in manually if needed, then press Enter here...');
  await new Promise(r => process.stdin.once('data', r));

  console.log('Page title:', await page.title());
  await page.screenshot({ path: 'linkedin_feed.png' });

  await context.close();
})();