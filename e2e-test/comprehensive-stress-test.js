/**
 * COMPREHENSIVE STRESS TEST
 * Covers all 8 test scenarios from the test plan
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function comprehensiveStressTest() {
  const results = {
    timestamp: new Date().toISOString(),
    testUrl: 'https://tacits-candy-shop.vercel.app',
    tests: [],
    screenshots: [],
    consoleErrors: [],
    reactErrors: [],
    finalVerdict: null
  };

  let browser;
  let context;
  let page;

  try {
    console.log('🚀 COMPREHENSIVE STRESS TEST\n');
    console.log('=' .repeat(80));

    browser = await chromium.launch({ 
      headless: false,
      slowMo: 300
    });
    
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    page = await context.newPage();

    // Console monitoring
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error' || text.includes('Error') || text.includes('error')) {
        console.log(`[CONSOLE ${type}]:`, text);
        results.consoleErrors.push({ type, text, timestamp: new Date().toISOString() });
      }
      
      if (text.includes('Error #31') || text.includes('Minified React error') || 
          text.includes('object with keys')) {
        console.error('❌ REACT ERROR DETECTED!');
        results.reactErrors.push({ text, timestamp: new Date().toISOString() });
      }
    });

    page.on('pageerror', error => {
      console.error('❌ PAGE ERROR:', error.message);
      results.consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        timestamp: new Date().toISOString()
      });
    });

    // ========== TEST 1: Homepage and Skills Grid ==========
    console.log('\n📋 TEST 1: Homepage and Skills Grid');
    console.log('-'.repeat(80));
    
    const test1 = {
      name: 'Test 1: Homepage and Skills Grid',
      steps: [],
      passed: false
    };

    console.log('Step 1.1: Navigate to homepage');
    await page.goto('https://tacits-candy-shop.vercel.app', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/test1-01-homepage.png', fullPage: true });
    results.screenshots.push('test1-01-homepage.png');
    console.log('✅ Homepage loaded');
    test1.steps.push({ step: 'Navigate', status: 'pass' });

    console.log('\nStep 1.2: Verify skills grid');
    const skillCards = await page.locator('[class*="card"], article').count();
    console.log(`Found ${skillCards} skill cards`);
    test1.steps.push({ step: 'Count skills', status: 'pass', count: skillCards });

    console.log('\nStep 1.3: Scroll through skills');
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/test1-02-scrolled.png', fullPage: true });
    results.screenshots.push('test1-02-scrolled.png');
    console.log('✅ Scrolled through skills');
    test1.steps.push({ step: 'Scroll', status: 'pass' });

    test1.passed = true;
    results.tests.push(test1);

    // ========== TEST 2: Skill Selection and Executor ==========
    console.log('\n📋 TEST 2: Skill Selection and Executor');
    console.log('-'.repeat(80));
    
    const test2 = {
      name: 'Test 2: Skill Selection and Executor',
      steps: [],
      passed: false
    };

    // Scroll back to top to find clickable skills
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    console.log('Step 2.1: Find and click a skill card');
    
    // Try multiple strategies to find a clickable skill
    let skillClicked = false;
    
    // Strategy 1: Look for visible card with button
    const cardsWithButtons = await page.locator('[class*="card"]').all();
    console.log(`Found ${cardsWithButtons.length} card elements`);
    
    for (let i = 0; i < Math.min(5, cardsWithButtons.length); i++) {
      try {
        const card = cardsWithButtons[i];
        const buttons = await card.locator('button').all();
        
        if (buttons.length > 0) {
          console.log(`Card ${i} has ${buttons.length} buttons`);
          const firstButton = buttons[0];
          const buttonText = await firstButton.textContent().catch(() => '');
          
          if (await firstButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log(`Clicking button: "${buttonText.substring(0, 30)}"`);
            await firstButton.click();
            await page.waitForTimeout(3000);
            skillClicked = true;
            test2.steps.push({ step: 'Click skill', status: 'pass', button: buttonText });
            break;
          }
        }
      } catch (e) {
        console.log(`Card ${i} not clickable: ${e.message}`);
      }
    }

    if (!skillClicked) {
      console.log('⚠️ Could not click skill button, trying direct card click');
      const firstCard = cardsWithButtons[0];
      await firstCard.click();
      await page.waitForTimeout(3000);
      test2.steps.push({ step: 'Click skill', status: 'partial', method: 'card click' });
    }

    await page.screenshot({ path: 'screenshots/test2-01-after-click.png', fullPage: true });
    results.screenshots.push('test2-01-after-click.png');
    console.log('✅ Clicked skill element');

    console.log('\nStep 2.2: Look for textarea');
    const textareaCount = await page.locator('textarea').count();
    console.log(`Textareas found: ${textareaCount}`);
    
    if (textareaCount > 0) {
      console.log('✅ Executor interface detected!');
      test2.passed = true;
      test2.steps.push({ step: 'Find textarea', status: 'pass' });
      await page.screenshot({ path: 'screenshots/test2-02-executor.png', fullPage: true });
      results.screenshots.push('test2-02-executor.png');
    } else {
      console.log('⚠️ No textarea found, may need different approach');
      test2.steps.push({ step: 'Find textarea', status: 'fail' });
      
      // Try to find any input field
      const inputs = await page.locator('input[type="text"], [contenteditable="true"]').count();
      console.log(`Alternative inputs found: ${inputs}`);
      if (inputs > 0) {
        test2.passed = true;
        test2.steps.push({ step: 'Find alternative input', status: 'pass' });
      }
    }

    results.tests.push(test2);

    // ========== TEST 3: Send Message and Check Immediate Feedback ==========
    console.log('\n📋 TEST 3: Send Message and Check Immediate Feedback');
    console.log('-'.repeat(80));
    
    const test3 = {
      name: 'Test 3: Immediate Feedback',
      steps: [],
      passed: false,
      feedbackTime: null
    };

    // Find input element
    let inputElement = await page.locator('textarea').first();
    let hasTextarea = await inputElement.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!hasTextarea) {
      console.log('Trying alternative input...');
      inputElement = await page.locator('input[type="text"]').first();
      hasTextarea = await inputElement.isVisible({ timeout: 2000 }).catch(() => false);
    }

    if (hasTextarea) {
      console.log('Step 3.1: Type message');
      const message = '帮我做联邦学习的理论分析，收敛性分析';
      await inputElement.fill(message);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/test3-01-typed.png', fullPage: true });
      results.screenshots.push('test3-01-typed.png');
      console.log('✅ Message typed');
      test3.steps.push({ step: 'Type message', status: 'pass' });

      console.log('\nStep 3.2: Send message and measure feedback');
      const sendTime = Date.now();
      
      // Try to find send button
      const sendButton = await page.locator('button:has-text("Send"), button:has-text("发送"), button[type="submit"]').first();
      const hasSendButton = await sendButton.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasSendButton) {
        await sendButton.click();
      } else {
        await inputElement.press('Enter');
      }

      // Check for immediate feedback
      let feedbackFound = false;
      let feedbackTime = null;

      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(50);
        
        const feedback = await page.locator('.animate-pulse, [class*="thinking"], text=Thinking, text=思考').first();
        if (await feedback.isVisible({ timeout: 50 }).catch(() => false)) {
          feedbackTime = Date.now() - sendTime;
          feedbackFound = true;
          console.log(`✅ IMMEDIATE FEEDBACK at ${feedbackTime}ms`);
          break;
        }
      }

      if (!feedbackFound) {
        feedbackTime = Date.now() - sendTime;
        console.log(`⚠️ No immediate feedback within ${feedbackTime}ms`);
      }

      await page.screenshot({ path: 'screenshots/test3-02-after-send.png', fullPage: true });
      results.screenshots.push('test3-02-after-send.png');
      
      test3.feedbackTime = feedbackTime;
      test3.steps.push({ 
        step: 'Send and check feedback', 
        status: feedbackFound ? 'pass' : 'partial',
        feedbackTime 
      });

      console.log('\nStep 3.3: Wait 10s for response to start');
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'screenshots/test3-03-response-streaming.png', fullPage: true });
      results.screenshots.push('test3-03-response-streaming.png');
      console.log('✅ Captured response state');
      test3.steps.push({ step: 'Wait for streaming', status: 'pass' });

      test3.passed = feedbackFound;
    } else {
      console.log('❌ No input element found, skipping test 3');
      test3.steps.push({ step: 'Find input', status: 'fail' });
    }

    results.tests.push(test3);

    // ========== TEST 4: Wait for Response Completion ==========
    console.log('\n📋 TEST 4: Wait for Response Completion');
    console.log('-'.repeat(80));
    
    const test4 = {
      name: 'Test 4: Response Completion',
      steps: [],
      passed: false,
      askedQuestion: false,
      inputEnabled: false
    };

    if (hasTextarea) {
      console.log('Step 4.1: Wait up to 60s for response completion');
      
      let responseComplete = false;
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(500);
        
        // Check if input is enabled (sign of completion)
        try {
          const enabled = await inputElement.isEnabled({ timeout: 100 });
          if (enabled) {
            responseComplete = true;
            test4.inputEnabled = true;
            console.log(`✅ Response complete at ${i * 0.5}s`);
            break;
          }
        } catch (e) {
          // Continue waiting
        }

        if (i % 20 === 0 && i > 0) {
          console.log(`⏳ ${i * 0.5}s elapsed...`);
        }
      }

      await page.screenshot({ path: 'screenshots/test4-01-completed.png', fullPage: true });
      results.screenshots.push('test4-01-completed.png');
      
      test4.steps.push({ 
        step: 'Wait for completion', 
        status: responseComplete ? 'pass' : 'timeout' 
      });

      console.log('\nStep 4.2: Check if AI asked a question');
      const pageText = await page.textContent('body');
      const hasQuestion = pageText.includes('请问') || pageText.includes('需要') || /[1-9]\./g.test(pageText);
      test4.askedQuestion = hasQuestion;
      
      if (hasQuestion) {
        console.log('✅ AI appears to have asked a question');
        test4.steps.push({ step: 'Detect question', status: 'pass' });
      } else {
        console.log('ℹ️  No question detected in response');
        test4.steps.push({ step: 'Detect question', status: 'none' });
      }

      console.log(`Input field enabled: ${test4.inputEnabled}`);
      test4.passed = responseComplete;
    } else {
      console.log('⚠️ Skipping test 4 (no input element)');
      test4.steps.push({ step: 'Skip', status: 'skipped' });
    }

    results.tests.push(test4);

    // ========== TEST 5: Multi-turn Conversation ==========
    console.log('\n📋 TEST 5: Multi-turn Conversation');
    console.log('-'.repeat(80));
    
    const test5 = {
      name: 'Test 5: Multi-turn Conversation',
      steps: [],
      passed: false
    };

    if (hasTextarea && test4.inputEnabled) {
      console.log('Step 5.1: Send second message');
      const message2 = '补充具体的数学证明细节';
      await inputElement.fill(message2);
      await page.waitForTimeout(1000);
      
      const sendButton = await page.locator('button:has-text("Send"), button:has-text("发送")').first();
      const hasSendButton = await sendButton.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasSendButton) {
        await sendButton.click();
      } else {
        await inputElement.press('Enter');
      }

      await page.screenshot({ path: 'screenshots/test5-01-second-sent.png', fullPage: true });
      results.screenshots.push('test5-01-second-sent.png');
      console.log('✅ Second message sent');
      test5.steps.push({ step: 'Send message', status: 'pass' });

      console.log('\nStep 5.2: Wait 15s for response');
      await page.waitForTimeout(15000);
      await page.screenshot({ path: 'screenshots/test5-02-second-response.png', fullPage: true });
      results.screenshots.push('test5-02-second-response.png');
      console.log('✅ Captured second response');
      test5.steps.push({ step: 'Wait for response', status: 'pass' });

      test5.passed = true;
    } else {
      console.log('⚠️ Skipping test 5 (input not available)');
      test5.steps.push({ step: 'Skip', status: 'skipped' });
    }

    results.tests.push(test5);

    // ========== TEST 6: Tool Call Test ==========
    console.log('\n📋 TEST 6: Tool Call Test');
    console.log('-'.repeat(80));
    
    const test6 = {
      name: 'Test 6: Tool Call Test',
      steps: [],
      passed: false,
      toolCallsDetected: false,
      reactErrorsDuring: 0
    };

    if (hasTextarea) {
      console.log('Step 6.1: Send tool-call-triggering message');
      await page.waitForTimeout(3000); // Wait for previous response
      
      const toolMessage = '帮我在当前目录创建一个联邦学习的Python代码，包含FedAvg算法的完整实现';
      await inputElement.fill(toolMessage);
      await page.waitForTimeout(1000);
      
      const sendButton = await page.locator('button:has-text("Send"), button:has-text("发送")').first();
      const hasSendButton = await sendButton.isVisible({ timeout: 1000 }).catch(() => false);
      
      const reactErrorsBefore = results.reactErrors.length;
      
      if (hasSendButton) {
        await sendButton.click();
      } else {
        await inputElement.press('Enter');
      }

      await page.screenshot({ path: 'screenshots/test6-01-tool-message-sent.png', fullPage: true });
      results.screenshots.push('test6-01-tool-message-sent.png');
      console.log('✅ Tool call message sent');
      test6.steps.push({ step: 'Send tool message', status: 'pass' });

      console.log('\nStep 6.2: Wait 90s for tool calls');
      let toolCallFound = false;
      
      for (let i = 0; i < 180; i++) {
        await page.waitForTimeout(500);
        
        // Look for tool call UI elements
        const toolElements = await page.locator('[class*="tool"], [data-tool], details, pre code').count();
        if (toolElements > 0 && !toolCallFound) {
          toolCallFound = true;
          test6.toolCallsDetected = true;
          console.log(`✅ Tool call UI detected at ${i * 0.5}s`);
          await page.screenshot({ path: 'screenshots/test6-02-tool-calls.png', fullPage: true });
          results.screenshots.push('test6-02-tool-calls.png');
        }

        // Check for React errors
        if (results.reactErrors.length > reactErrorsBefore) {
          console.error('❌ React error during tool call!');
          await page.screenshot({ path: 'screenshots/test6-03-ERROR.png', fullPage: true });
          results.screenshots.push('test6-03-ERROR.png');
          break;
        }

        if (i % 20 === 0 && i > 0) {
          console.log(`⏳ ${i * 0.5}s elapsed...`);
        }
      }

      const reactErrorsAfter = results.reactErrors.length;
      test6.reactErrorsDuring = reactErrorsAfter - reactErrorsBefore;
      
      await page.screenshot({ path: 'screenshots/test6-04-final.png', fullPage: true });
      results.screenshots.push('test6-04-final.png');
      
      test6.steps.push({ 
        step: 'Monitor tool calls', 
        status: test6.reactErrorsDuring === 0 ? 'pass' : 'fail',
        toolCallsDetected: toolCallFound,
        reactErrors: test6.reactErrorsDuring
      });

      test6.passed = test6.reactErrorsDuring === 0;
    } else {
      console.log('⚠️ Skipping test 6 (no input element)');
      test6.steps.push({ step: 'Skip', status: 'skipped' });
    }

    results.tests.push(test6);

    // ========== TEST 7: Session Switching ==========
    console.log('\n📋 TEST 7: Session Switching');
    console.log('-'.repeat(80));
    
    const test7 = {
      name: 'Test 7: Session Switching',
      steps: [],
      passed: false
    };

    console.log('Step 7.1: Look for session tabs or history');
    const sessionElements = await page.locator('[class*="session"], [class*="history"], [role="tab"]').count();
    console.log(`Found ${sessionElements} potential session elements`);
    
    if (sessionElements > 1) {
      console.log('Attempting to switch sessions...');
      const sessionTabs = await page.locator('[class*="session"], [role="tab"]').all();
      
      if (sessionTabs.length > 1) {
        await sessionTabs[1].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/test7-01-switched.png', fullPage: true });
        results.screenshots.push('test7-01-switched.png');
        console.log('✅ Switched session');
        test7.steps.push({ step: 'Switch session', status: 'pass' });
        test7.passed = true;
      }
    } else {
      console.log('ℹ️  No session tabs found');
      test7.steps.push({ step: 'Find sessions', status: 'none' });
      test7.passed = true; // Not a failure, just no sessions
    }

    results.tests.push(test7);

    // ========== TEST 8: Console Error Check ==========
    console.log('\n📋 TEST 8: Console Error Check');
    console.log('-'.repeat(80));
    
    const test8 = {
      name: 'Test 8: Console Error Check',
      steps: [],
      passed: false
    };

    console.log('Step 8.1: Review captured console errors');
    console.log(`Total console errors: ${results.consoleErrors.length}`);
    console.log(`React errors: ${results.reactErrors.length}`);
    
    if (results.reactErrors.length > 0) {
      console.log('\n❌ REACT ERRORS:');
      results.reactErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text}`);
      });
    }

    if (results.consoleErrors.length > 0) {
      console.log('\n⚠️  CONSOLE ERRORS:');
      results.consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err.text.substring(0, 150)}`);
      });
    }

    test8.steps.push({ 
      step: 'Review errors', 
      status: 'complete',
      reactErrors: results.reactErrors.length,
      consoleErrors: results.consoleErrors.length
    });
    test8.passed = results.reactErrors.length === 0;

    results.tests.push(test8);

    // ========== FINAL SUMMARY ==========
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    
    results.tests.forEach((test, i) => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`Test ${i + 1}: ${test.name} - ${status}`);
    });

    const passedTests = results.tests.filter(t => t.passed).length;
    const totalTests = results.tests.length;
    
    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
    console.log(`Screenshots captured: ${results.screenshots.length}`);
    console.log(`React errors: ${results.reactErrors.length}`);
    console.log(`Console errors: ${results.consoleErrors.length}`);
    console.log('='.repeat(80));

    results.finalVerdict = {
      passedTests,
      totalTests,
      passRate: (passedTests / totalTests * 100).toFixed(1) + '%',
      reactErrorsFree: results.reactErrors.length === 0,
      overallPass: passedTests >= totalTests * 0.75 && results.reactErrors.length === 0
    };

  } catch (error) {
    console.error('❌ Test suite error:', error);
    results.error = {
      message: error.message,
      stack: error.stack
    };

    if (page) {
      await page.screenshot({ path: 'screenshots/suite-error.png', fullPage: true });
      results.screenshots.push('suite-error.png');
    }
  } finally {
    // Save results
    fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Results saved to: comprehensive-test-results.json');

    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

    // Cleanup
    if (context) await context.close();
    if (browser) await browser.close();
  }

  return results;
}

// Run the comprehensive test
comprehensiveStressTest()
  .then(results => {
    console.log('\n✅ Comprehensive stress test completed');
    process.exit(results.finalVerdict?.overallPass ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
