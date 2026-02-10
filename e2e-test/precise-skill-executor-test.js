/**
 * PRECISE SKILL EXECUTOR TEST
 * This test specifically targets the SkillExecutor component, not the search bar
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runPreciseTest() {
  const results = {
    timestamp: new Date().toISOString(),
    testUrl: 'https://tacits-candy-shop.vercel.app',
    navigationSteps: [],
    feedbackTiming: null,
    toolCallsDetected: false,
    consoleErrors: [],
    reactErrors: [],
    screenshots: [],
    finalVerdict: null
  };

  let browser;
  let context;
  let page;

  try {
    console.log('🍬 Starting PRECISE Skill Executor Test...\n');
    console.log('Target: SkillExecutor component (NOT search bar)\n');

    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500
    });
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    page = await context.newPage();

    // Comprehensive console monitoring
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      console.log(`[CONSOLE ${type}]:`, text);
      
      // Check for React errors
      if (text.includes('Error #31') || 
          text.includes('Minified React error') ||
          text.includes('object with keys') ||
          text.includes('Objects are not valid as a React child')) {
        console.error('❌ REACT ERROR DETECTED!');
        results.reactErrors.push({
          type: type,
          text: text,
          timestamp: new Date().toISOString()
        });
      }
      
      // Capture all errors
      if (type === 'error') {
        results.consoleErrors.push({
          text: text,
          timestamp: new Date().toISOString()
        });
      }
    });

    page.on('pageerror', error => {
      console.error('❌ PAGE ERROR:', error.message);
      results.consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Step 1: Navigate to site
    console.log('📍 Step 1: Navigating to https://tacits-candy-shop.vercel.app');
    await page.goto('https://tacits-candy-shop.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log(`✅ Loaded\n`);
    await page.screenshot({ path: 'screenshots/precise-01-homepage.png', fullPage: true });
    results.screenshots.push('precise-01-homepage.png');
    results.navigationSteps.push('Loaded homepage');

    await page.waitForTimeout(2000);

    // Step 2: Look for navigation tabs
    console.log('📍 Step 2: Looking for navigation tabs (~/Skills, find --sweet, etc.)');
    
    const navSelectors = [
      'text=~/Skills',
      'text=Skills',
      'button:has-text("Skills")',
      'a:has-text("Skills")',
      '[role="tab"]:has-text("Skills")',
      'text=find --sweet',
      'text=cd /chocolates',
      'text=man recipes'
    ];

    let navElement = null;
    let navText = null;

    for (const selector of navSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          navElement = element;
          navText = selector;
          console.log(`✅ Found navigation: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!navElement) {
      console.log('⚠️  Could not find specific nav tabs, looking for any Skills link...');
      // Try broader search
      const allLinks = await page.locator('a, button').all();
      for (const link of allLinks) {
        const text = await link.textContent().catch(() => '');
        if (text.toLowerCase().includes('skill')) {
          navElement = link;
          navText = `Link with text: ${text}`;
          console.log(`✅ Found: ${navText}`);
          break;
        }
      }
    }

    if (!navElement) {
      throw new Error('Could not find Skills navigation');
    }

    await page.screenshot({ path: 'screenshots/precise-02-before-nav-click.png', fullPage: true });
    results.screenshots.push('precise-02-before-nav-click.png');
    results.navigationSteps.push(`Found navigation: ${navText}`);

    // Step 3: Click on ~/Skills tab
    console.log('\n📍 Step 3: Clicking on Skills tab/button');
    await navElement.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked\n');
    
    await page.screenshot({ path: 'screenshots/precise-03-skills-grid.png', fullPage: true });
    results.screenshots.push('precise-03-skills-grid.png');
    results.navigationSteps.push('Clicked Skills tab - should show grid');

    // Step 4: Find a skill card
    console.log('📍 Step 4: Looking for skill cards in the grid');
    
    const skillCardSelectors = [
      '[class*="skill-card"]',
      '[class*="skillCard"]',
      '[data-testid*="skill"]',
      'article',
      '[role="article"]',
      'div[class*="card"]'
    ];

    let skillCard = null;
    let skillCardSelector = null;

    for (const selector of skillCardSelectors) {
      try {
        const cards = await page.locator(selector).all();
        if (cards.length > 0) {
          // Find a visible card
          for (const card of cards) {
            if (await card.isVisible({ timeout: 1000 })) {
              skillCard = card;
              skillCardSelector = selector;
              console.log(`✅ Found skill card with selector: ${selector}`);
              break;
            }
          }
        }
        if (skillCard) break;
      } catch (e) {
        // Continue
      }
    }

    if (!skillCard) {
      console.log('⚠️  No skill cards found with specific selectors, trying to find any clickable element...');
      // Last resort: find any clickable element in the main content area
      const clickables = await page.locator('main button, main a, main [role="button"]').all();
      if (clickables.length > 0) {
        skillCard = clickables[0];
        skillCardSelector = 'first clickable in main';
        console.log(`✅ Found clickable element (fallback)`);
      }
    }

    if (!skillCard) {
      throw new Error('Could not find any skill card');
    }

    await page.screenshot({ path: 'screenshots/precise-04-before-card-click.png', fullPage: true });
    results.screenshots.push('precise-04-before-card-click.png');
    results.navigationSteps.push(`Found skill card: ${skillCardSelector}`);

    // Don't click the card itself yet - look for buttons within the card first
    console.log('\n📍 Step 5: Looking for Run/Execute button WITHIN the skill card');
    
    // Look for buttons within or near the skill card
    const runButtonInCard = await skillCard.locator('button').all();
    console.log(`Found ${runButtonInCard.length} buttons in/near the card`);
    
    let executeButton = null;
    
    if (runButtonInCard.length > 0) {
      // Try to find a button with relevant text
      for (const btn of runButtonInCard) {
        const text = await btn.textContent().catch(() => '');
        console.log(`  Button text: "${text}"`);
        if (text.toLowerCase().includes('run') || 
            text.toLowerCase().includes('execute') ||
            text.toLowerCase().includes('launch') ||
            text.toLowerCase().includes('try') ||
            text.toLowerCase().includes('start')) {
          executeButton = btn;
          console.log(`✅ Found execute button with text: "${text}"`);
          break;
        }
      }
      
      // If no button with specific text, try the first visible button
      if (!executeButton) {
        for (const btn of runButtonInCard) {
          if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
            executeButton = btn;
            const text = await btn.textContent().catch(() => '');
            console.log(`✅ Using first visible button: "${text}"`);
            break;
          }
        }
      }
    }
    
    if (!executeButton) {
      console.log('⚠️  No button found in card, trying to click card itself');
      executeButton = skillCard;
    }

    await page.screenshot({ path: 'screenshots/precise-05-before-execute-click.png', fullPage: true });
    results.screenshots.push('precise-05-before-execute-click.png');
    
    console.log('\n📍 Step 6: Clicking execute button');
    await executeButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ Clicked\n');

    await page.screenshot({ path: 'screenshots/precise-06-after-execute-click.png', fullPage: true });
    results.screenshots.push('precise-06-after-execute-click.png');
    results.navigationSteps.push('Clicked execute button on skill card');

    // Now check if we need another step or if we're already in executor
    console.log('📍 Step 7: Checking if in SkillExecutor or need another click');
    
    // Check if we're already in the executor
    let textareaExists = await page.locator('textarea').count() > 0;
    
    if (textareaExists) {
      console.log('✅ Already in executor interface (textarea found)');
      results.navigationSteps.push('Already in executor after clicking button');
    } else {
      console.log('⚠️  Not in executor yet, looking for modal or additional steps...');
      
      // Maybe there's a modal or dialog that opened
      await page.waitForTimeout(2000);
      textareaExists = await page.locator('textarea').count() > 0;
      
      if (!textareaExists) {
        // Try looking for any dialog/modal that might have opened
        const modal = await page.locator('[role="dialog"], [class*="modal"], [class*="dialog"]').first();
        const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (modalVisible) {
          console.log('✅ Modal/dialog detected, looking for textarea within it');
          const textareaInModal = await modal.locator('textarea').first();
          textareaExists = await textareaInModal.isVisible({ timeout: 2000 }).catch(() => false);
        }
      }
      
      if (!textareaExists) {
        throw new Error('Could not find SkillExecutor textarea after clicking execute button');
      }
    }

    await page.screenshot({ path: 'screenshots/precise-07-executor-interface.png', fullPage: true });
    results.screenshots.push('precise-07-executor-interface.png');
    results.navigationSteps.push('Confirmed in SkillExecutor interface');

    // Step 6: Verify we're in SkillExecutor
    console.log('📍 Step 8: Verifying SkillExecutor interface');
    
    // Look for textarea (chat input)
    const textarea = await page.locator('textarea').first();
    const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!textareaVisible) {
      throw new Error('SkillExecutor textarea not found - not in correct interface');
    }
    
    console.log('✅ Confirmed: In SkillExecutor (textarea found)');
    
    // Check for skill name header
    const headers = await page.locator('h1, h2, h3').allTextContents();
    console.log('📋 Headers found:', headers.slice(0, 3));
    results.navigationSteps.push('Verified SkillExecutor interface with textarea');

    // Step 7: Type the EXACT message
    const message1 = '帮我做联邦学习的理论分析，收敛性分析';
    console.log(`\n📍 Step 9: Typing EXACT message: "${message1}"`);
    
    await textarea.fill(message1);
    await page.waitForTimeout(1000);
    console.log('✅ Message typed\n');

    await page.screenshot({ path: 'screenshots/precise-08-message-typed.png', fullPage: true });
    results.screenshots.push('precise-08-message-typed.png');

    // Step 8: Send message
    console.log('📍 Step 10: Sending message');
    
    // Try to find send button
    const sendSelectors = [
      'button:has-text("Send")',
      'button:has-text("发送")',
      'button[type="submit"]',
      'button[aria-label*="send"]',
      'button[aria-label*="Send"]'
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      try {
        const element = await page.locator(selector).last();
        if (await element.isVisible({ timeout: 1000 })) {
          sendButton = element;
          console.log(`✅ Found send button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    const sendTime = Date.now();
    
    if (sendButton) {
      await sendButton.click();
      console.log('✅ Clicked send button');
    } else {
      console.log('⚠️  No send button found, pressing Enter');
      await textarea.press('Enter');
      console.log('✅ Pressed Enter');
    }

    // Step 9: IMMEDIATELY check for feedback
    console.log('\n⏱️  CRITICAL: Checking for IMMEDIATE feedback...');
    
    let feedbackFound = false;
    let feedbackTime = null;
    let feedbackType = null;

    // Check every 50ms for up to 2 seconds
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(50);
      
      // Look for various feedback indicators
      const feedbackSelectors = [
        'text=Thinking',
        'text=thinking',
        'text=思考中',
        '.animate-pulse',
        '[class*="thinking"]',
        '[class*="loading"]',
        '[role="status"]',
        '[aria-busy="true"]',
        // Look for new assistant message bubbles
        '[class*="assistant"]',
        '[class*="ai-message"]',
        '[data-role="assistant"]'
      ];

      for (const selector of feedbackSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 50 })) {
            feedbackFound = true;
            feedbackTime = Date.now() - sendTime;
            feedbackType = selector;
            console.log(`✅ IMMEDIATE FEEDBACK DETECTED at ${feedbackTime}ms: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (feedbackFound) break;
    }

    if (!feedbackFound) {
      feedbackTime = Date.now() - sendTime;
      console.log(`❌ NO IMMEDIATE FEEDBACK within ${feedbackTime}ms`);
    }

    results.feedbackTiming = {
      found: feedbackFound,
      time: feedbackTime,
      type: feedbackType
    };

    await page.screenshot({ path: 'screenshots/precise-09-after-send.png', fullPage: true });
    results.screenshots.push('precise-09-after-send.png');

    // Step 10: Wait for FULL response
    console.log('\n📍 Step 11: Waiting for FULL response (up to 90 seconds)...');
    
    let responseComplete = false;
    let toolCallsFound = false;

    for (let i = 0; i < 180; i++) {
      await page.waitForTimeout(500);
      
      // Take periodic screenshots
      if (i % 20 === 0 && i > 0) {
        const seconds = i * 0.5;
        console.log(`⏳ ${seconds}s elapsed...`);
        await page.screenshot({ 
          path: `screenshots/precise-progress-${seconds}s.png`, 
          fullPage: true 
        });
        results.screenshots.push(`precise-progress-${seconds}s.png`);
      }

      // Check for tool calls
      if (!toolCallsFound) {
        const toolCallSelectors = [
          '[class*="tool"]',
          '[data-tool]',
          'details',
          '[class*="collapsible"]',
          'pre code',
          '[class*="bash"]',
          '[class*="command"]'
        ];

        for (const selector of toolCallSelectors) {
          try {
            const count = await page.locator(selector).count();
            if (count > 0) {
              toolCallsFound = true;
              console.log(`✅ Tool calls detected: ${selector} (${count} elements)`);
              await page.screenshot({ 
                path: `screenshots/precise-tool-calls-detected.png`, 
                fullPage: true 
              });
              results.screenshots.push('precise-tool-calls-detected.png');
              break;
            }
          } catch (e) {
            // Continue
          }
        }
      }

      // Check if response is complete (input is enabled again)
      try {
        const inputEnabled = await textarea.isEnabled({ timeout: 500 });
        if (inputEnabled && !responseComplete) {
          // Check if there's actual content
          const messages = await page.locator('[class*="message"], [class*="bubble"]').count();
          if (messages > 1) { // More than just user message
            responseComplete = true;
            console.log(`✅ Response appears complete at ${i * 0.5}s`);
            break;
          }
        }
      } catch (e) {
        // Continue
      }

      // Check for React errors
      if (results.reactErrors.length > 0) {
        console.error('❌ React error detected during response!');
        break;
      }
    }

    results.toolCallsDetected = toolCallsFound;

    await page.screenshot({ path: 'screenshots/precise-10-response-complete.png', fullPage: true });
    results.screenshots.push('precise-10-response-complete.png');

    // Step 11: Check console for errors
    console.log('\n📍 Step 12: Opening browser console to check for errors');
    
    // Get console errors via CDP
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Runtime.enable');
    
    console.log('\n📋 Console Error Summary:');
    console.log(`Total console errors: ${results.consoleErrors.length}`);
    console.log(`React errors: ${results.reactErrors.length}`);
    
    if (results.reactErrors.length > 0) {
      console.log('\n❌ REACT ERRORS FOUND:');
      results.reactErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text}`);
      });
    }

    if (results.consoleErrors.length > 0) {
      console.log('\n⚠️  CONSOLE ERRORS:');
      results.consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text.substring(0, 200)}`);
      });
    }

    // Step 12: Send second message
    console.log('\n📍 Step 13: Sending SECOND message');
    const message2 = '帮我写一个简单的FedAvg Python实现';
    console.log(`💬 Message: "${message2}"`);

    await page.waitForTimeout(2000);
    await textarea.fill(message2);
    await page.waitForTimeout(1000);

    const sendTime2 = Date.now();
    
    if (sendButton) {
      await sendButton.click();
    } else {
      await textarea.press('Enter');
    }

    console.log('✅ Sent second message');

    // Check feedback for second message
    let feedbackFound2 = false;
    let feedbackTime2 = null;

    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      
      const element = await page.locator('.animate-pulse, [class*="thinking"]').first();
      if (await element.isVisible({ timeout: 100 }).catch(() => false)) {
        feedbackFound2 = true;
        feedbackTime2 = Date.now() - sendTime2;
        console.log(`✅ Second message feedback at ${feedbackTime2}ms`);
        break;
      }
    }

    await page.screenshot({ path: 'screenshots/precise-11-second-message-sent.png', fullPage: true });
    results.screenshots.push('precise-11-second-message-sent.png');

    // Wait for second response
    console.log('⏳ Waiting for second response (30 seconds)...');
    await page.waitForTimeout(30000);

    await page.screenshot({ path: 'screenshots/precise-12-final-state.png', fullPage: true });
    results.screenshots.push('precise-12-final-state.png');

    // Final verdict
    const hasReactErrors = results.reactErrors.length > 0;
    const hasConsoleErrors = results.consoleErrors.length > 0;
    const pageStable = results.reactErrors.length === 0;

    results.finalVerdict = {
      navigationSuccessful: true,
      immediateFeedback: results.feedbackTiming.found,
      feedbackTime: results.feedbackTiming.time,
      toolCallsAppeared: toolCallsFound,
      reactErrorsFound: hasReactErrors,
      reactErrorCount: results.reactErrors.length,
      consoleErrorCount: results.consoleErrors.length,
      pageStable: pageStable,
      passed: !hasReactErrors && results.feedbackTiming.found && pageStable
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL VERDICT - PRECISE SKILL EXECUTOR TEST');
    console.log('='.repeat(80));
    console.log(`Navigation: ${results.finalVerdict.navigationSuccessful ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Immediate Feedback: ${results.finalVerdict.immediateFeedback ? '✅ YES' : '❌ NO'} (${results.feedbackTiming.time}ms)`);
    console.log(`Tool Calls Appeared: ${toolCallsFound ? '✅ YES' : '⚠️  NO'}`);
    console.log(`React Errors: ${hasReactErrors ? '❌ YES' : '✅ NO'} (${results.reactErrors.length})`);
    console.log(`Console Errors: ${results.consoleErrors.length}`);
    console.log(`Page Stable: ${pageStable ? '✅ YES' : '❌ NO'}`);
    console.log(`Overall: ${results.finalVerdict.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.error = {
      message: error.message,
      stack: error.stack
    };

    if (page) {
      await page.screenshot({ path: 'screenshots/precise-error.png', fullPage: true });
      results.screenshots.push('precise-error.png');
    }
  } finally {
    // Save results
    fs.writeFileSync('precise-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Results saved to: precise-test-results.json');
    console.log(`📸 Screenshots: ${results.screenshots.length} files`);

    // Cleanup
    if (context) await context.close();
    if (browser) await browser.close();
  }

  return results;
}

// Run the test
runPreciseTest()
  .then(results => {
    console.log('\n✅ Precise test completed');
    process.exit(results.finalVerdict?.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
