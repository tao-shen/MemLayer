const { chromium } = require('playwright');

const URL = 'https://tacits-candy-shop.vercel.app/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const allLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') consoleErrors.push(text);
  });
  page.on('pageerror', err => consoleErrors.push(`PAGE_ERROR: ${err.message}`));

  console.log('=== Question UI Test ===\n');

  // Navigate and open skill executor
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click first Play button
  const playBtns = page.locator('[title="Run skill"]');
  await playBtns.first().click();
  await page.waitForTimeout(2000);

  // Send a message that is more likely to trigger a question from the AI
  const textarea = page.locator('textarea').first();
  await textarea.waitFor({ state: 'visible', timeout: 5000 });

  // Use a prompt that typically triggers the question tool
  await textarea.fill('帮我做一个完整的项目，需要你先确认我想要什么样的项目类型和技术栈');
  await page.keyboard.press('Enter');

  console.log('Message sent, waiting for response...');

  // Wait and monitor for question events
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(5000);
    
    // Check for question panel
    const questionPanel = await page.locator('[class*="blue-950"]').count();
    const submitBtn = await page.locator('button').filter({ hasText: /Submit Answer|Skip|Dismiss/i }).count();
    const askingText = await page.locator('text=AI is asking').count();
    
    // Check for question-related logs
    const questionLogs = allLogs.filter(l => l.includes('question') || l.includes('Question'));
    
    console.log(`  [${(i+1)*5}s] questionPanel=${questionPanel}, submitBtn=${submitBtn}, askingText=${askingText}, qLogs=${questionLogs.length}`);
    
    if (questionPanel > 0 || askingText > 0) {
      console.log('  🎉 Question panel detected!');
      await page.screenshot({ path: '/tmp/test-question-found.png' });
      
      // Try to click an option
      const optionBtns = page.locator('[class*="blue-950"] button');
      const optCount = await optionBtns.count();
      console.log(`  Option buttons: ${optCount}`);
      
      if (optCount > 2) {
        // Click the first option (not Submit/Skip)
        await optionBtns.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/test-question-clicked.png' });
        console.log('  Clicked first option!');
      }
      break;
    }
    
    // Check if textarea is enabled (AI done but no question)
    const isDisabled = await textarea.isDisabled();
    if (!isDisabled && i > 2) {
      console.log('  Input enabled, AI likely finished without a question');
      await page.screenshot({ path: '/tmp/test-question-none.png' });
      break;
    }
  }

  // Report question-related logs
  const questionLogs = allLogs.filter(l => 
    l.includes('question') || l.includes('Question') || l.includes('onQuestion')
  );
  console.log(`\nQuestion-related logs (${questionLogs.length}):`);
  questionLogs.forEach(l => console.log(`  ${l.substring(0, 250)}`));

  // Report errors
  console.log(`\nConsole errors: ${consoleErrors.length}`);
  const reactErrors = consoleErrors.filter(e => e.includes('Error #31') || e.includes('Objects are not valid'));
  console.log(`React errors: ${reactErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 200)}`));
  }

  await browser.close();
  console.log('\nDone.');
})();
