/**
 * Tool Call Stress Test - Tests for React Error #31
 * Specifically tests scenarios that trigger tool/function calls
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runToolCallTest() {
  const results = {
    timestamp: new Date().toISOString(),
    testUrl: 'https://tacits-candy-shop.vercel.app',
    steps: [],
    reactErrors: [],
    consoleErrors: [],
    toolCallsDetected: [],
    pageCrashes: [],
    finalVerdict: null
  };

  let browser;
  let context;
  let page;

  try {
    console.log('🚀 Starting Tool Call Stress Test (React Error #31 Detection)...\n');

    browser = await chromium.launch({ 
      headless: false,
      slowMo: 300
    });
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: './test-videos/' }
    });
    
    page = await context.newPage();

    // Comprehensive console monitoring
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      console.log(`[CONSOLE ${type}]:`, text);
      
      // Check for React Error #31
      if (text.includes('Error #31') || 
          text.includes('Minified React error') ||
          text.includes('object with keys') ||
          text.includes('Objects are not valid as a React child')) {
        console.error('❌ REACT ERROR #31 DETECTED!');
        results.reactErrors.push({
          type: type,
          text: text,
          timestamp: new Date().toISOString()
        });
      }
      
      // Detect tool call related logs
      if (text.includes('tool') || 
          text.includes('function_call') ||
          text.includes('Tool:') ||
          text.includes('onPartUpdated') ||
          text.includes('message.part.updated')) {
        results.toolCallsDetected.push({
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

    // Capture page errors
    page.on('pageerror', error => {
      console.error('❌ PAGE ERROR:', error.message);
      results.pageCrashes.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Step 1: Navigate to site
    console.log('📍 Step 1: Navigating to site...');
    await page.goto('https://tacits-candy-shop.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log(`✅ Loaded. URL: ${page.url()}\n`);
    await page.screenshot({ path: 'screenshots/tool-01-homepage.png', fullPage: true });

    results.steps.push({
      step: 1,
      action: 'Navigate to site',
      success: true
    });

    // Step 2: Find and click on a skill
    console.log('📍 Step 2: Looking for skill cards...');
    await page.waitForTimeout(2000);

    // Try multiple strategies to find skills
    const skillSelectors = [
      'a[href*="skill"]',  // Most general - worked in previous test
      'a[href*="/skills/"]',
      'a[href*="/skill/"]',
      'button:has-text("Run")',
      'button:has-text("Execute")',
      '[data-testid*="skill"]',
      '.skill-card',
      '[class*="skill"]'
    ];

    let skillElement = null;
    let usedSelector = null;
    
    for (const selector of skillSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          skillElement = element;
          usedSelector = selector;
          console.log(`✅ Found skill with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!skillElement) {
      // Last resort: try to find any clickable card
      console.log('⚠️  Trying fallback: looking for any card...');
      try {
        const cards = await page.locator('[class*="card"]').all();
        if (cards.length > 0) {
          skillElement = cards[0];
          usedSelector = 'card fallback';
          console.log(`✅ Found card element (fallback)`);
        }
      } catch (e) {
        // Still nothing
      }
    }

    if (!skillElement) {
      throw new Error('Could not find any skill to execute');
    }
    
    console.log(`🖱️  Will click: ${usedSelector}`);

    await page.screenshot({ path: 'screenshots/tool-02-before-skill-click.png', fullPage: true });
    await skillElement.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/tool-03-skill-interface.png', fullPage: true });

    results.steps.push({
      step: 2,
      action: 'Click skill',
      success: true
    });

    // Step 3: Find chat input
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
    for (const selector of inputSelectors) {
      try {
        const element = await page.locator(selector).last();
        if (await element.isVisible({ timeout: 2000 })) {
          chatInput = element;
          console.log(`✅ Found input: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!chatInput) {
      throw new Error('Could not find chat input');
    }

    // Step 4: Send message that triggers tool calls
    const toolCallMessage = '帮我在当前目录创建一个联邦学习的Python代码，包含FedAvg算法的完整实现';
    console.log(`\n📍 Step 4: Sending tool-call-triggering message...`);
    console.log(`💬 Message: "${toolCallMessage}"`);
    
    await chatInput.fill(toolCallMessage);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tool-04-message-typed.png', fullPage: true });

    // Find send button or use Enter
    const sendSelectors = [
      'button:has-text("Send")',
      'button:has-text("发送")',
      'button[type="submit"]',
      'button[aria-label*="send"]'
    ];

    let sendButton = null;
    for (const selector of sendSelectors) {
      try {
        const element = await page.locator(selector).last();
        if (await element.isVisible({ timeout: 1000 })) {
          sendButton = element;
          break;
        }
      } catch (e) {
        // Continue
      }
    }

    console.log('📤 Sending message...');
    const sendTime = Date.now();
    
    if (sendButton) {
      await sendButton.click();
    } else {
      await chatInput.press('Enter');
    }

    await page.screenshot({ path: 'screenshots/tool-05-after-send.png', fullPage: true });

    results.steps.push({
      step: 4,
      action: 'Send tool-call message',
      message: toolCallMessage,
      timestamp: new Date().toISOString()
    });

    // Step 5: Monitor for tool calls and errors
    console.log('\n📍 Step 5: Monitoring for tool calls and React errors...');
    console.log('⏳ Waiting for response (monitoring for 60 seconds)...\n');

    let toolCallUIDetected = false;
    let pageStillAlive = true;

    // Monitor for 60 seconds, taking screenshots periodically
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);
      
      // Check if page is still responsive
      try {
        await page.evaluate(() => document.title);
      } catch (e) {
        console.error('❌ Page became unresponsive!');
        pageStillAlive = false;
        break;
      }

      // Look for tool call UI elements
      const toolCallSelectors = [
        '[class*="tool"]',
        '[class*="function"]',
        '[class*="code-block"]',
        'pre code',
        '[data-tool]',
        '[data-function]'
      ];

      for (const selector of toolCallSelectors) {
        try {
          const elements = await page.locator(selector).count();
          if (elements > 0 && !toolCallUIDetected) {
            toolCallUIDetected = true;
            console.log(`✅ Tool call UI detected: ${selector}`);
            await page.screenshot({ 
              path: `screenshots/tool-06-tool-ui-detected-${i}s.png`, 
              fullPage: true 
            });
          }
        } catch (e) {
          // Continue
        }
      }

      // Take periodic screenshots
      if (i % 10 === 0 && i > 0) {
        console.log(`⏳ ${i}s elapsed...`);
        await page.screenshot({ 
          path: `screenshots/tool-progress-${i}s.png`, 
          fullPage: true 
        });
      }

      // Check for React errors
      if (results.reactErrors.length > 0) {
        console.error(`❌ React Error detected at ${i}s!`);
        await page.screenshot({ 
          path: `screenshots/tool-ERROR-${i}s.png`, 
          fullPage: true 
        });
        break;
      }
    }

    results.steps.push({
      step: 5,
      action: 'Monitor for tool calls',
      toolCallUIDetected: toolCallUIDetected,
      pageStillAlive: pageStillAlive,
      reactErrorsFound: results.reactErrors.length,
      duration: '60s'
    });

    await page.screenshot({ path: 'screenshots/tool-07-after-response.png', fullPage: true });

    // Step 6: Send follow-up message
    console.log('\n📍 Step 6: Sending follow-up message...');
    const followUpMessage = '继续完善这个代码，添加差分隐私机制';
    console.log(`💬 Follow-up: "${followUpMessage}"`);

    await page.waitForTimeout(2000);
    await chatInput.fill(followUpMessage);
    await page.waitForTimeout(1000);

    if (sendButton) {
      await sendButton.click();
    } else {
      await chatInput.press('Enter');
    }

    await page.screenshot({ path: 'screenshots/tool-08-followup-sent.png', fullPage: true });

    // Monitor follow-up response
    console.log('⏳ Monitoring follow-up response (30 seconds)...\n');
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      
      if (i % 10 === 0 && i > 0) {
        console.log(`⏳ ${i}s elapsed...`);
      }

      if (results.reactErrors.length > 0) {
        console.error(`❌ React Error in follow-up at ${i}s!`);
        await page.screenshot({ 
          path: `screenshots/tool-ERROR-followup-${i}s.png`, 
          fullPage: true 
        });
        break;
      }
    }

    results.steps.push({
      step: 6,
      action: 'Send follow-up',
      message: followUpMessage,
      reactErrorsFound: results.reactErrors.length
    });

    await page.screenshot({ path: 'screenshots/tool-09-final-state.png', fullPage: true });

    // Step 7: Check console for errors
    console.log('\n📍 Step 7: Final error check...');
    
    // Execute JavaScript to get console errors
    const consoleErrorsFromPage = await page.evaluate(() => {
      // This won't capture all errors, but we already have them from the console listener
      return window.__errors || [];
    });

    // Final verdict
    const hasReactErrors = results.reactErrors.length > 0;
    const hasPageCrashes = results.pageCrashes.length > 0;
    const hasConsoleErrors = results.consoleErrors.length > 0;

    results.finalVerdict = {
      passed: !hasReactErrors && !hasPageCrashes && pageStillAlive,
      toolCallsRenderedWithoutCrashing: toolCallUIDetected && !hasReactErrors,
      reactErrorsDetected: hasReactErrors,
      reactErrorCount: results.reactErrors.length,
      pageRemainedStable: pageStillAlive && !hasPageCrashes,
      consoleErrorCount: results.consoleErrors.length,
      toolCallUIDetected: toolCallUIDetected,
      summary: !hasReactErrors && !hasPageCrashes && pageStillAlive
        ? '✅ PASS: Tool calls rendered without React Error #31'
        : '❌ FAIL: React errors or page crashes detected'
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL VERDICT - TOOL CALL STRESS TEST');
    console.log('='.repeat(80));
    console.log(`Overall: ${results.finalVerdict.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Tool Calls Rendered Without Crashing: ${results.finalVerdict.toolCallsRenderedWithoutCrashing ? '✅ YES' : '❌ NO'}`);
    console.log(`React Error #31 Detected: ${hasReactErrors ? '❌ YES' : '✅ NO'}`);
    console.log(`Page Remained Stable: ${results.finalVerdict.pageRemainedStable ? '✅ YES' : '❌ NO'}`);
    console.log(`Tool Call UI Detected: ${toolCallUIDetected ? '✅ YES' : '⚠️  NO'}`);
    console.log(`React Errors: ${results.reactErrors.length}`);
    console.log(`Console Errors: ${results.consoleErrors.length}`);
    console.log(`Page Crashes: ${results.pageCrashes.length}`);
    console.log('='.repeat(80) + '\n');

    if (results.reactErrors.length > 0) {
      console.log('❌ REACT ERRORS FOUND:');
      results.reactErrors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.text}`);
        console.log(`   Time: ${err.timestamp}`);
      });
    }

    if (results.consoleErrors.length > 0) {
      console.log('\n⚠️  CONSOLE ERRORS:');
      results.consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text}`);
      });
    }

    if (results.toolCallsDetected.length > 0) {
      console.log('\n📋 TOOL CALL LOGS DETECTED:');
      results.toolCallsDetected.slice(0, 10).forEach((log, i) => {
        console.log(`${i + 1}. ${log.text.substring(0, 100)}...`);
      });
    }

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
      await page.screenshot({ path: 'screenshots/tool-test-error.png', fullPage: true });
    }
  } finally {
    // Save results
    fs.writeFileSync('tool-call-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Results saved to: tool-call-test-results.json');

    // Cleanup
    if (context) await context.close();
    if (browser) await browser.close();
  }

  return results;
}

// Run the test
runToolCallTest()
  .then(results => {
    console.log('\n✅ Tool call stress test completed');
    process.exit(results.finalVerdict?.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
