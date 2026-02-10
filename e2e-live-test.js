const { chromium } = require('playwright');

const URL = 'https://tacits-candy-shop.vercel.app/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  const allLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') consoleErrors.push(text);
  });
  page.on('pageerror', err => consoleErrors.push(`PAGE_ERROR: ${err.message}`));

  const results = {};

  // ── Test 1: Page Load ──
  console.log('\n=== TEST 1: Page Load ===');
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const title = await page.title();
    await page.screenshot({ path: '/tmp/test1-homepage.png' });

    // Scroll down to the skills grid
    const skillsGrid = page.locator('#skills-grid');
    const gridVisible = await skillsGrid.isVisible().catch(() => false);
    console.log(`  Title: ${title}, Skills grid visible: ${gridVisible}`);

    if (!gridVisible) {
      // Try scrolling down to find it
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }

    // Count actual skill cards (inside #skills-grid)
    const skillCards = await page.locator('#skills-grid .group').count();
    console.log(`  Skill cards in grid: ${skillCards}`);
    results.test1 = { status: 'PASS', skillCards, title };
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    results.test1 = { status: 'FAIL', error: err.message };
  }

  // ── Test 2: Open SkillExecutor via Play button ──
  console.log('\n=== TEST 2: Open SkillExecutor ===');
  try {
    // Scroll to the skills grid
    await page.locator('#skills-grid').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(500);

    // Click on the first Play button
    const playBtns = page.locator('[title="Run skill"]');
    const playCount = await playBtns.count();
    console.log(`  Play buttons found: ${playCount}`);

    if (playCount > 0) {
      await playBtns.first().click();
      await page.waitForTimeout(2000);
    } else {
      // Fallback: click on a skill card then click "Run Skill" in the modal
      const cards = page.locator('#skills-grid .group');
      if (await cards.count() > 0) {
        await cards.first().click();
        await page.waitForTimeout(1000);
        const runBtn = page.locator('button').filter({ hasText: /Run Skill/i });
        if (await runBtn.count() > 0) {
          await runBtn.first().click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Check if SkillExecutor opened (textarea should appear)
    const textarea = page.locator('textarea');
    const textareaCount = await textarea.count();
    const hasChat = textareaCount > 0;
    console.log(`  Textarea found: ${hasChat} (count: ${textareaCount})`);
    await page.screenshot({ path: '/tmp/test2-executor.png' });
    results.test2 = { status: hasChat ? 'PASS' : 'FAIL', hasTextarea: hasChat };
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    await page.screenshot({ path: '/tmp/test2-fail.png' });
    results.test2 = { status: 'FAIL', error: err.message };
  }

  // ── Test 3: Send a message ──
  console.log('\n=== TEST 3: Send Message + Immediate Feedback ===');
  try {
    const textarea = page.locator('textarea').first();
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    const isDisabled = await textarea.isDisabled();
    console.log(`  Textarea disabled: ${isDisabled}`);

    if (!isDisabled) {
      await textarea.fill('hello');
      await page.keyboard.press('Enter');

      // Check immediate feedback (within 500ms)
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/test3-immediate.png' });

      // Wait for response
      await page.waitForTimeout(10000);
      await page.screenshot({ path: '/tmp/test3-response.png' });

      // Check if textarea is still enabled (not stuck)
      const disabledAfter = await textarea.isDisabled();
      console.log(`  Textarea disabled after wait: ${disabledAfter}`);
      results.test3 = { status: 'PASS', disabledAfter };
    } else {
      results.test3 = { status: 'FAIL', error: 'Textarea is disabled' };
    }
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    await page.screenshot({ path: '/tmp/test3-fail.png' });
    results.test3 = { status: 'FAIL', error: err.message };
  }

  // ── Test 4: Session switching during conversation ──
  console.log('\n=== TEST 4: Session Switching During Conversation ===');
  try {
    // Send another message to start a conversation
    const textarea = page.locator('textarea').first();
    const disabledState = await textarea.isDisabled().catch(() => true);
    
    if (!disabledState) {
      await textarea.fill('tell me more');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

      // While AI is responding, try to find and click new session button
      // Look for Plus button or "New" button in session sidebar
      const sidebar = page.locator('[class*="sidebar"], [class*="Sidebar"]');
      const sidebarCount = await sidebar.count();
      console.log(`  Sidebar elements: ${sidebarCount}`);

      // Look for session-related buttons
      const newBtn = page.locator('button:has(svg.lucide-plus), button[title*="new"], button[title*="New"]');
      const newBtnCount = await newBtn.count();
      console.log(`  New session buttons: ${newBtnCount}`);

      if (newBtnCount > 0) {
        await newBtn.first().click();
        await page.waitForTimeout(1000);
        console.log('  Clicked new session button during conversation!');
      }

      await page.screenshot({ path: '/tmp/test4-switch.png' });
      results.test4 = { status: 'INFO', sidebarCount, newBtnCount };
    } else {
      results.test4 = { status: 'SKIP', reason: 'textarea disabled' };
    }
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    results.test4 = { status: 'FAIL', error: err.message };
  }

  // ── Test 5: Check for Question Panel ──
  console.log('\n=== TEST 5: Question Panel Check ===');
  try {
    // Look for the QuestionPanel component
    const questionPanel = page.locator('[class*="blue-950"]');
    const qpCount = await questionPanel.count();

    // Look for "Submit Answer" or "Skip" or "Dismiss" buttons
    const submitBtn = page.locator('button').filter({ hasText: /Submit Answer|Skip|Dismiss/i });
    const submitCount = await submitBtn.count();

    // Check for "AI is asking" text
    const askingText = page.locator('text=AI is asking');
    const askingCount = await askingText.count();

    console.log(`  Question panels: ${qpCount}, Buttons: ${submitCount}, Asking text: ${askingCount}`);
    await page.screenshot({ path: '/tmp/test5-question.png' });
    results.test5 = { status: qpCount > 0 ? 'FOUND' : 'NOT_TRIGGERED', qpCount, submitCount, askingCount };
  } catch (err) {
    console.log(`  FAIL: ${err.message}`);
    results.test5 = { status: 'FAIL', error: err.message };
  }

  // ── Test 6: Console Errors ──
  console.log('\n=== TEST 6: Console Errors ===');
  const reactErrors = consoleErrors.filter(e =>
    e.includes('Error #31') ||
    e.includes('Objects are not valid') ||
    e.includes('Minified React error')
  );
  console.log(`  Total console errors: ${consoleErrors.length}`);
  console.log(`  React errors: ${reactErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('  Error samples:');
    consoleErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 200)}`));
  }

  // Check for question-related logs
  const questionLogs = allLogs.filter(l => l.includes('question') || l.includes('Question'));
  if (questionLogs.length > 0) {
    console.log(`  Question-related logs: ${questionLogs.length}`);
    questionLogs.slice(0, 5).forEach(l => console.log(`    - ${l.substring(0, 200)}`));
  }

  results.test6 = {
    status: reactErrors.length === 0 ? 'PASS' : 'FAIL',
    totalErrors: consoleErrors.length,
    reactErrors: reactErrors.length,
    questionLogs: questionLogs.length
  };

  // ── Summary ──
  console.log('\n\n========== SUMMARY ==========');
  Object.entries(results).forEach(([test, r]) => {
    console.log(`  ${test}: ${r.status} ${JSON.stringify(r)}`);
  });

  await browser.close();
  console.log('\nDone. Screenshots saved to /tmp/test*.png');
})();
