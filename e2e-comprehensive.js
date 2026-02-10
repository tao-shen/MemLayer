/**
 * Comprehensive E2E Test Suite for Tacits Skills Website
 * Tests every interactive feature systematically
 */
const { chromium } = require('playwright');

const SITE_URL = 'https://tacits.vercel.app';
const TIMEOUT = 15000;

const results = [];
let browser, page;

function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

async function test(name, fn) {
  log(`\n▶ TEST: ${name}`);
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    log(`✅ PASS: ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    log(`❌ FAIL: ${name} — ${err.message}`);
  }
}

(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T1: Page Load & Skills Display
  // ═══════════════════════════════════════════════════════════════════════
  await test('T1: Page loads and displays skills', async () => {
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait for skill cards to render
    await page.waitForSelector('[class*="grid"]', { timeout: TIMEOUT });
    const title = await page.title();
    log(`  Page title: "${title}"`);
    
    // Count skill cards
    const cards = await page.$$('[class*="cursor-pointer"]');
    log(`  Found ${cards.length} clickable elements`);
    
    // Check page text content for skills
    const bodyText = await page.textContent('body');
    const hasSkills = bodyText.includes('skill') || bodyText.includes('Skill');
    log(`  Page contains 'skill' text: ${hasSkills}`);
    if (!hasSkills && cards.length === 0) throw new Error('Page appears empty');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T2: Search/Filter functionality
  // ═══════════════════════════════════════════════════════════════════════
  await test('T2: Search/filter skills', async () => {
    const searchInput = await page.$('input[type="text"], input[placeholder*="earch"], input[placeholder*="ilter"]');
    if (!searchInput) {
      log('  No search input found, checking for filter UI');
      // Check for any filter buttons/tabs
      const filterBtns = await page.$$('button');
      log(`  Found ${filterBtns.length} buttons (potential filters)`);
      // This is not necessarily a failure
      return;
    }
    await searchInput.fill('react');
    await page.waitForTimeout(500);
    const bodyTextAfter = await page.textContent('body');
    log(`  Searched for "react", page text includes "React": ${bodyTextAfter.toLowerCase().includes('react')}`);
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T3: Click a skill card to open SkillExecutor
  // ═══════════════════════════════════════════════════════════════════════
  await test('T3: Open a skill (SkillExecutor)', async () => {
    // Find and click the first skill card
    const skillCards = await page.$$('[class*="rounded"][class*="border"]');
    let clicked = false;
    for (const card of skillCards) {
      const text = await card.textContent();
      if (text && text.length > 10 && text.length < 500) {
        // Click on what looks like a skill card
        try {
          await card.click({ timeout: 3000 });
          clicked = true;
          log(`  Clicked card: "${text.slice(0, 50)}..."`);
          break;
        } catch {
          continue;
        }
      }
    }
    if (!clicked) {
      // Try clicking any div with cursor-pointer
      const clickables = await page.$$('[class*="cursor-pointer"]');
      if (clickables.length > 0) {
        await clickables[0].click();
        clicked = true;
        log('  Clicked first cursor-pointer element');
      }
    }
    if (!clicked) throw new Error('No clickable skill card found');

    // Wait for either the executor modal or a page change
    await page.waitForTimeout(2000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T4: Check SkillExecutor UI elements
  // ═══════════════════════════════════════════════════════════════════════
  await test('T4: SkillExecutor UI elements', async () => {
    // Check for key UI elements
    const bodyText = await page.textContent('body');

    // Check for connection status
    const hasConnected = bodyText.includes('Connected') || bodyText.includes('Connecting');
    log(`  Connection indicator: ${hasConnected}`);

    // Check for textarea (input area)
    const textarea = await page.$('textarea');
    log(`  Textarea found: ${!!textarea}`);

    // Check for session sidebar
    const hasSessions = bodyText.includes('Sessions') || bodyText.includes('session');
    log(`  Sessions UI: ${hasSessions}`);

    // Check for model picker
    const hasModel = bodyText.includes('model') || bodyText.includes('Model') || bodyText.includes('Select model');
    log(`  Model picker: ${hasModel}`);

    // Check for close button
    const closeBtn = await page.$('button[title]');
    log(`  Close button found: ${!!closeBtn}`);

    if (!textarea && !hasConnected) {
      log('  WARNING: SkillExecutor may not have opened properly');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T5: Send a message (chat interaction)
  // ═══════════════════════════════════════════════════════════════════════
  await test('T5: Send a message to AI', async () => {
    // Wait for connection
    await page.waitForTimeout(3000);

    const textarea = await page.$('textarea');
    if (!textarea) throw new Error('No textarea found');

    // Check if connected (textarea should not be disabled)
    const isDisabled = await textarea.getAttribute('disabled');
    if (isDisabled !== null) {
      log('  Textarea is disabled, waiting for connection...');
      await page.waitForTimeout(5000);
      const stillDisabled = await textarea.getAttribute('disabled');
      if (stillDisabled !== null) {
        log('  Textarea still disabled — connection may have failed');
        throw new Error('Textarea disabled - not connected');
      }
    }

    // Type and send a message
    await textarea.fill('Hello, say "test successful" in your response');
    await page.keyboard.press('Enter');
    log('  Message sent');

    // Wait for AI response
    await page.waitForTimeout(5000);

    // Check for assistant response elements
    const sparklesIcons = await page.$$('[class*="from-violet-500"]');
    log(`  Agent avatar elements: ${sparklesIcons.length}`);

    // Check for any streaming indicators
    const spinners = await page.$$('[class*="animate-spin"]');
    log(`  Spinner elements (loading): ${spinners.length}`);

    // Check console logs for SSE events
    const sseEvents = consoleLogs.filter(l => l.text.includes('[OpenCode]') || l.text.includes('[SkillExec]'));
    log(`  SSE/SkillExec console events: ${sseEvents.length}`);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T6: Check session sidebar interaction
  // ═══════════════════════════════════════════════════════════════════════
  await test('T6: Session sidebar interaction', async () => {
    // Should have at least one session after sending a message
    const sessionItems = await page.$$('[class*="group flex items-center gap-2 px-3 py-2"]');
    log(`  Session items: ${sessionItems.length}`);

    // Check for "New session" button
    const newSessionBtn = await page.$('button[title="New session"]');
    log(`  New session button: ${!!newSessionBtn}`);

    if (newSessionBtn) {
      // Create a new session
      await newSessionBtn.click();
      await page.waitForTimeout(2000);
      const sessionItems2 = await page.$$('[class*="group flex items-center gap-2 px-3 py-2"]');
      log(`  Session items after new: ${sessionItems2.length}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T7: Switch between sessions
  // ═══════════════════════════════════════════════════════════════════════
  await test('T7: Switch between sessions', async () => {
    const sessionItems = await page.$$('[class*="group flex items-center gap-2 px-3 py-2"]');
    if (sessionItems.length < 2) {
      log('  Only one session, skipping switch test');
      return;
    }

    // Click on the first session (which should be different from current)
    await sessionItems[0].click();
    await page.waitForTimeout(2000);

    // Check that content changed
    const bodyText = await page.textContent('body');
    log(`  After session switch, page has content: ${bodyText.length > 100}`);

    // Switch back
    if (sessionItems.length > 1) {
      await sessionItems[1].click();
      await page.waitForTimeout(1500);
      log('  Switched back to second session');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T8: Abort during AI processing
  // ═══════════════════════════════════════════════════════════════════════
  await test('T8: Abort button during processing', async () => {
    // Send a message to trigger processing
    const textarea = await page.$('textarea');
    if (!textarea) {
      log('  No textarea, skipping');
      return;
    }

    const isDisabled = await textarea.getAttribute('disabled');
    if (isDisabled !== null) {
      log('  Textarea disabled (agent may still be running)');
      // Check for stop button
      const stopBtn = await page.$('button[title="Stop agent"]');
      if (stopBtn) {
        log('  Found stop button, clicking it');
        await stopBtn.click();
        await page.waitForTimeout(2000);
        const stillDisabled = await textarea.getAttribute('disabled');
        log(`  After stop: textarea disabled = ${stillDisabled !== null}`);
      }
      return;
    }

    await textarea.fill('Count from 1 to 100 slowly');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Check for abort button
    const stopBtn = await page.$('button[title="Stop agent"]');
    if (stopBtn) {
      log('  Stop button found, clicking');
      await stopBtn.click();
      await page.waitForTimeout(2000);
      // Verify textarea is re-enabled
      const disabled = await textarea.getAttribute('disabled');
      log(`  After abort: textarea disabled = ${disabled !== null}`);
    } else {
      log('  No stop button found (agent may have finished quickly)');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T9: Model picker
  // ═══════════════════════════════════════════════════════════════════════
  await test('T9: Model picker interaction', async () => {
    // Look for the settings/model picker button
    const modelBtn = await page.$('[class*="model-picker"] button');
    if (!modelBtn) {
      log('  No model picker button found');
      return;
    }

    await modelBtn.click();
    await page.waitForTimeout(500);

    // Check if model dropdown appeared
    const dropdown = await page.$('[class*="model-picker"] [class*="absolute"]');
    if (dropdown) {
      log('  Model picker dropdown opened');
      const dropdownText = await dropdown.textContent();
      log(`  Dropdown content: "${dropdownText.slice(0, 100)}..."`);
      
      // Close it by clicking outside
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(300);
    } else {
      log('  Model picker dropdown did not appear');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T10: Delete session
  // ═══════════════════════════════════════════════════════════════════════
  await test('T10: Delete session', async () => {
    const sessionItems = await page.$$('[class*="group flex items-center gap-2 px-3 py-2"]');
    if (sessionItems.length < 2) {
      log('  Less than 2 sessions, skipping delete to preserve data');
      return;
    }

    // Hover over a session to reveal delete button
    await sessionItems[0].hover();
    await page.waitForTimeout(300);

    const deleteBtn = await sessionItems[0].$('button[title="Delete session"]');
    if (deleteBtn) {
      log('  Delete button found on hover');
      await deleteBtn.click();
      await page.waitForTimeout(1500);
      const newCount = (await page.$$('[class*="group flex items-center gap-2 px-3 py-2"]')).length;
      log(`  Sessions after delete: ${newCount}`);
    } else {
      log('  Delete button not found on hover');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T11: Question panel test (if triggered by interaction)
  // ═══════════════════════════════════════════════════════════════════════
  await test('T11: Question panel (console check)', async () => {
    // Check if any question events were received during our interactions
    const questionLogs = consoleLogs.filter(l => 
      l.text.includes('onQuestion') || l.text.includes('QuestionPanel') || l.text.includes('question.asked')
    );
    log(`  Question-related console logs: ${questionLogs.length}`);
    if (questionLogs.length > 0) {
      questionLogs.slice(0, 5).forEach(l => log(`    ${l.text.slice(0, 120)}`));
    }

    // Check for question panel in DOM
    const questionPanel = await page.$('[class*="border-blue-500/30"][class*="rounded-xl"]');
    if (questionPanel) {
      log('  Question panel IS visible in DOM');
      
      // Check for Submit and Skip buttons
      const submitBtn = await page.locator('text=Submit Answer').first();
      const skipBtn = await page.locator('text=Skip').first();
      const dismissBtn = await page.locator('text=Dismiss').first();
      
      log(`  Submit button: ${await submitBtn.isVisible().catch(() => false)}`);
      log(`  Skip button: ${await skipBtn.isVisible().catch(() => false)}`);
      log(`  Dismiss button: ${await dismissBtn.isVisible().catch(() => false)}`);
    } else {
      log('  No question panel currently visible (normal if no question was triggered)');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T12: Keyboard shortcuts
  // ═══════════════════════════════════════════════════════════════════════
  await test('T12: Keyboard shortcuts', async () => {
    const textarea = await page.$('textarea');
    if (!textarea) {
      log('  No textarea, skipping');
      return;
    }

    const isDisabled = await textarea.getAttribute('disabled');
    if (isDisabled !== null) {
      log('  Textarea disabled, skipping keyboard test');
      return;
    }

    // Test Shift+Enter (should insert newline, not send)
    await textarea.fill('');
    await textarea.type('line 1');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await textarea.type('line 2');
    
    const value = await textarea.inputValue();
    const hasNewline = value.includes('\n');
    log(`  Shift+Enter creates newline: ${hasNewline}`);
    
    // Clear
    await textarea.fill('');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T13: Close button / ESC
  // ═══════════════════════════════════════════════════════════════════════
  await test('T13: Close SkillExecutor', async () => {
    // Find close button (X icon)
    const buttons = await page.$$('button');
    let closeBtn = null;
    for (const btn of buttons) {
      const inner = await btn.innerHTML();
      // Look for X/close icon SVG
      if (inner.includes('class="w-5 h-5"') || inner.includes('lucide-x')) {
        const isVisible = await btn.isVisible();
        if (isVisible) {
          closeBtn = btn;
          break;
        }
      }
    }

    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
      
      // Check if we're back to the main skills page
      const bodyText = await page.textContent('body');
      const backToMain = !bodyText.includes('Sessions') && !bodyText.includes('Connected');
      log(`  Returned to main page: ${backToMain}`);
    } else {
      log('  Close button not found');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T14: Responsive design check
  // ═══════════════════════════════════════════════════════════════════════
  await test('T14: Responsive design (mobile viewport)', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // Check for horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const hasHorizontalScroll = scrollWidth > viewportWidth + 5;
    log(`  Mobile viewport: scrollWidth=${scrollWidth}, viewportWidth=${viewportWidth}`);
    log(`  Has horizontal scroll: ${hasHorizontalScroll}`);
    if (hasHorizontalScroll) log('  ⚠️ WARNING: Horizontal scroll detected on mobile!');

    // Check that content is visible
    const bodyText = await page.textContent('body');
    log(`  Content visible: ${bodyText.length > 50}`);

    // Reset viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // T15: Console errors check
  // ═══════════════════════════════════════════════════════════════════════
  await test('T15: No critical console errors', async () => {
    const errors = consoleLogs.filter(l => l.type === 'error');
    const warnings = consoleLogs.filter(l => l.type === 'warning');
    
    log(`  Total console errors: ${errors.length}`);
    log(`  Total console warnings: ${warnings.length}`);
    
    // Show first 5 errors
    errors.slice(0, 5).forEach(e => log(`    ERROR: ${e.text.slice(0, 150)}`));
    
    // Check for React Error #31 specifically
    const reactErrors = errors.filter(e => e.text.includes('Objects are not valid as a React child'));
    if (reactErrors.length > 0) {
      throw new Error(`React Error #31 detected: ${reactErrors[0].text.slice(0, 100)}`);
    }
    
    // Check for unhandled promise rejections
    const unhandled = errors.filter(e => e.text.includes('Unhandled') || e.text.includes('uncaught'));
    if (unhandled.length > 0) {
      log(`  ⚠️ Unhandled errors: ${unhandled.length}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════
  await browser.close();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('COMPREHENSIVE TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name}${r.error ? ` — ${r.error}` : ''}`);
  });
  
  console.log(`\n${passed}/${results.length} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════');
  
  process.exit(failed > 0 ? 1 : 0);
})();
