/**
 * End-to-End Stress Test for Tacits Candy Shop
 * Tests immediate UI feedback after sending messages
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runStressTest() {
  const results = {
    timestamp: new Date().toISOString(),
    testUrl: 'https://tacits-candy-shop.vercel.app',
    steps: [],
    finalVerdict: null,
    consoleErrors: [],
    reactErrors: []
  };

  let browser;
  let context;
  let page;

  try {
    console.log('🚀 Starting E2E Stress Test...\n');

    // Launch browser with console logging
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 // Slow down for observation
    });
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: './test-videos/' }
    });
    
    page = await context.newPage();

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[CONSOLE ${msg.type()}]:`, text);
      
      // Check for React errors
      if (text.includes('Error #31') || text.includes('Minified React error')) {
        results.reactErrors.push({
          type: msg.type(),
          text: text,
          timestamp: new Date().toISOString()
        });
      }
      
      // Capture SSE and OpenCode related logs
      if (text.includes('SSE') || text.includes('sendMessage') || 
          text.includes('onPartUpdated') || text.includes('onMessageUpdated') ||
          text.includes('message.updated') || text.includes('message.part.updated')) {
        results.consoleErrors.push({
          type: msg.type(),
          text: text,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
      results.consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Step 1: Navigate to the site
    console.log('📍 Step 1: Navigating to site...');
    const startNav = Date.now();
    await page.goto('https://tacits-candy-shop.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    const navTime = Date.now() - startNav;
    
    results.steps.push({
      step: 1,
      action: 'Navigate to site',
      duration: navTime,
      success: true,
      finalUrl: page.url()
    });
    
    console.log(`✅ Loaded in ${navTime}ms. Final URL: ${page.url()}\n`);
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });

    // Step 2: Explore and find skill executor
    console.log('📍 Step 2: Looking for skill cards with Run/Execute buttons...');
    await page.waitForTimeout(2000);

    // Try to find skill cards - multiple selectors
    const possibleSelectors = [
      'button:has-text("Run")',
      'button:has-text("Execute")',
      'button:has-text("Launch")',
      'button:has-text("Start")',
      'button:has-text("Try")',
      '[data-testid*="run"]',
      '[data-testid*="execute"]',
      'a[href*="skill"]',
      'a[href*="executor"]'
    ];

    let skillButton = null;
    let usedSelector = null;

    for (const selector of possibleSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          skillButton = element;
          usedSelector = selector;
          console.log(`✅ Found button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!skillButton) {
      // Try to find any clickable skill card
      console.log('⚠️  No direct button found, looking for skill cards...');
      const cards = await page.locator('[class*="skill"], [class*="card"]').all();
      console.log(`Found ${cards.length} potential skill cards`);
      
      if (cards.length > 0) {
        skillButton = cards[0];
        usedSelector = 'first skill card';
      }
    }

    if (!skillButton) {
      throw new Error('Could not find any skill execution entry point');
    }

    await page.screenshot({ path: 'screenshots/02-before-click.png', fullPage: true });
    
    console.log(`🖱️  Clicking: ${usedSelector}`);
    await skillButton.click();
    await page.waitForTimeout(3000);
    
    results.steps.push({
      step: 2,
      action: 'Click skill executor',
      selector: usedSelector,
      success: true
    });

    await page.screenshot({ path: 'screenshots/03-after-click.png', fullPage: true });

    // Step 3: Find chat input and send first message
    console.log('\n📍 Step 3: Looking for chat input...');
    
    const inputSelectors = [
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="输入"]',
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]'
    ];

    let chatInput = null;
    let inputSelector = null;

    for (const selector of inputSelectors) {
      try {
        const element = await page.locator(selector).last(); // Use last in case there are multiple
        if (await element.isVisible({ timeout: 2000 })) {
          chatInput = element;
          inputSelector = selector;
          console.log(`✅ Found input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!chatInput) {
      throw new Error('Could not find chat input field');
    }

    const message1 = '帮我做联邦学习的理论分析，收敛性分析';
    console.log(`💬 Typing message: "${message1}"`);
    await chatInput.fill(message1);
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/04-message-typed.png', fullPage: true });

    // Find and click send button
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
        if (await element.isVisible({ timeout: 2000 })) {
          sendButton = element;
          console.log(`✅ Found send button: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!sendButton) {
      console.log('⚠️  No send button found, trying Enter key...');
      await chatInput.press('Enter');
    } else {
      await sendButton.click();
    }

    // CRITICAL: Measure immediate feedback timing
    console.log('\n⏱️  CRITICAL: Measuring immediate UI feedback...');
    const sendTime = Date.now();
    
    // Look for immediate feedback indicators
    const feedbackSelectors = [
      'text=Thinking',
      'text=thinking',
      'text=Loading',
      'text=loading',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="thinking"]',
      '[role="status"]',
      '[aria-busy="true"]',
      '.animate-spin',
      '.animate-pulse'
    ];

    let feedbackFound = false;
    let feedbackTime = null;
    let feedbackType = null;

    // Check every 100ms for up to 2 seconds
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      
      for (const selector of feedbackSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 100 })) {
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

    results.steps.push({
      step: 3,
      action: 'Send first message',
      message: message1,
      immediateFeedback: feedbackFound,
      feedbackTime: feedbackTime,
      feedbackType: feedbackType,
      expectedTime: '< 1000ms',
      passed: feedbackFound && feedbackTime < 1000
    });

    await page.screenshot({ path: 'screenshots/05-after-send.png', fullPage: true });

    // Step 4: Wait for response to complete
    console.log('\n📍 Step 4: Waiting for full response (up to 90 seconds)...');
    const responseStart = Date.now();
    
    // Wait for streaming to complete - look for signs of completion
    let responseComplete = false;
    let responseTime = 0;
    
    for (let i = 0; i < 180; i++) { // 90 seconds max
      await page.waitForTimeout(500);
      
      // Check if there's a new input available (sign of completion)
      try {
        const inputEnabled = await chatInput.isEnabled({ timeout: 500 });
        if (inputEnabled) {
          // Check if there's actual content in the response
          const assistantMessages = await page.locator('[class*="assistant"], [class*="ai-message"]').count();
          if (assistantMessages > 0) {
            responseComplete = true;
            responseTime = Date.now() - responseStart;
            console.log(`✅ Response completed in ${responseTime}ms`);
            break;
          }
        }
      } catch (e) {
        // Continue waiting
      }
      
      if (i % 10 === 0) {
        console.log(`⏳ Still waiting... ${(i * 500 / 1000).toFixed(1)}s elapsed`);
      }
    }

    results.steps.push({
      step: 4,
      action: 'Wait for first response',
      responseComplete: responseComplete,
      responseTime: responseTime,
      timeout: !responseComplete
    });

    await page.screenshot({ path: 'screenshots/06-response-complete.png', fullPage: true });

    // Step 5: Send second message for multi-turn test
    console.log('\n📍 Step 5: Testing multi-turn conversation...');
    await page.waitForTimeout(2000);

    const message2 = '请继续深入分析 FedAvg 的收敛速率上界';
    console.log(`💬 Typing second message: "${message2}"`);
    
    await chatInput.fill(message2);
    await page.waitForTimeout(1000);

    if (sendButton) {
      await sendButton.click();
    } else {
      await chatInput.press('Enter');
    }

    // Measure second feedback
    const sendTime2 = Date.now();
    let feedbackFound2 = false;
    let feedbackTime2 = null;

    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      
      for (const selector of feedbackSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 100 })) {
            feedbackFound2 = true;
            feedbackTime2 = Date.now() - sendTime2;
            console.log(`✅ Second message feedback at ${feedbackTime2}ms`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      if (feedbackFound2) break;
    }

    results.steps.push({
      step: 5,
      action: 'Send second message',
      message: message2,
      immediateFeedback: feedbackFound2,
      feedbackTime: feedbackTime2,
      passed: feedbackFound2 && feedbackTime2 < 1000
    });

    await page.screenshot({ path: 'screenshots/07-second-message-sent.png', fullPage: true });

    // Wait for second response
    console.log('⏳ Waiting for second response...');
    await page.waitForTimeout(30000); // Wait 30 seconds

    await page.screenshot({ path: 'screenshots/08-second-response.png', fullPage: true });

    // Step 6: Check console for errors
    console.log('\n📍 Step 6: Analyzing console logs...');
    
    const hasReactErrors = results.reactErrors.length > 0;
    const hasPageErrors = results.consoleErrors.some(e => e.type === 'pageerror');

    results.steps.push({
      step: 6,
      action: 'Check for errors',
      reactErrors: results.reactErrors.length,
      pageErrors: results.consoleErrors.filter(e => e.type === 'pageerror').length,
      hasErrors: hasReactErrors || hasPageErrors
    });

    // Final verdict
    const step3Passed = results.steps[2]?.passed || false;
    const step5Passed = results.steps[4]?.passed || false;
    const noErrors = !hasReactErrors && !hasPageErrors;

    results.finalVerdict = {
      passed: step3Passed && step5Passed && noErrors,
      immediateFeedbackWorking: step3Passed && step5Passed,
      noPageCrashes: noErrors,
      multiTurnWorking: step5Passed,
      summary: step3Passed && step5Passed && noErrors 
        ? '✅ PASS: Immediate feedback working correctly, no errors'
        : '❌ FAIL: Issues detected'
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL VERDICT');
    console.log('='.repeat(80));
    console.log(`Overall: ${results.finalVerdict.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Immediate Feedback (1st msg): ${step3Passed ? '✅ PASS' : '❌ FAIL'} (${results.steps[2]?.feedbackTime}ms)`);
    console.log(`Immediate Feedback (2nd msg): ${step5Passed ? '✅ PASS' : '❌ FAIL'} (${results.steps[4]?.feedbackTime}ms)`);
    console.log(`No Page Crashes: ${noErrors ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`React Errors: ${results.reactErrors.length}`);
    console.log(`Page Errors: ${results.consoleErrors.filter(e => e.type === 'pageerror').length}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    results.error = {
      message: error.message,
      stack: error.stack
    };
    results.finalVerdict = {
      passed: false,
      summary: `❌ FAIL: Test error - ${error.message}`
    };

    if (page) {
      await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
    }
  } finally {
    // Save results
    const resultsPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📄 Results saved to: ${resultsPath}`);

    // Cleanup
    if (context) await context.close();
    if (browser) await browser.close();
  }

  return results;
}

// Run the test
runStressTest()
  .then(results => {
    console.log('\n✅ Test completed');
    process.exit(results.finalVerdict?.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
