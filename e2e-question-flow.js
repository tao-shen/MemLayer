/**
 * E2E Test: Question Reply → Real-time Response Streaming
 * Uses text content matching for reliable QuestionPanel detection
 */

const { chromium } = require('playwright');
const URL = 'https://tacits-candy-shop.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const logs = [];
  page.on('console', msg => logs.push({ t: Date.now(), text: msg.text() }));

  console.log('=== Question Flow Test ===\n');

  try {
    // 1. Load page
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('[1] Page loaded');

    // 2. Open chat
    const runBtns = await page.$$('[title="Run skill"]');
    if (runBtns.length > 0) {
      await runBtns[0].scrollIntoViewIfNeeded();
      await runBtns[0].click();
    }
    await page.waitForTimeout(2000);

    // 3. Send message
    const textarea = await page.$('textarea');
    if (!textarea) throw new Error('No textarea found');
    await textarea.waitForElementState('enabled', { timeout: 10000 });
    await textarea.fill('帮我创建一个全新的网站项目');
    await textarea.press('Enter');
    console.log('[3] Message sent');

    // 4. Wait for "Submit Answer" button to appear (QuestionPanel indicator)
    console.log('[4] Waiting for QuestionPanel (Submit Answer button)...');
    let questionPanelFound = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      
      // Reliable: look for "Submit Answer" button text
      const hasSubmitAnswer = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.trim() === 'Submit Answer') return true;
        }
        return false;
      });
      
      if (hasSubmitAnswer) {
        questionPanelFound = true;
        console.log(`    ★ QuestionPanel found at ${i*2}s`);
        break;
      }
      
      const partCount = logs.filter(l => l.text.includes('onPartUpdated')).length;
      const qCount = logs.filter(l => l.text.includes('question.asked')).length;
      const completeCount = logs.filter(l => l.text.includes('onComplete')).length;
      console.log(`    [${i*2}s] parts=${partCount}, questions=${qCount}, complete=${completeCount}`);
      
      if (completeCount > 0 && qCount === 0) {
        console.log('    Stream completed without question. Need to retry with different prompt.');
        break;
      }
    }

    if (!questionPanelFound) {
      console.log('❌ QuestionPanel not found.');
      logs.filter(l => l.text.includes('question') || l.text.includes('activeQuestion')).slice(-10)
        .forEach(l => console.log('  ', l.text.slice(0, 200)));
      await browser.close();
      process.exit(1);
    }

    await page.waitForTimeout(500);
    
    // Take screenshot before selection
    await page.screenshot({ path: '/tmp/qp-before.png', fullPage: false });
    console.log('    Screenshot: /tmp/qp-before.png');

    // 5. Find the QuestionPanel container by finding "Submit Answer" and walking up
    console.log('[5] Finding QuestionPanel options...');
    
    const panelInfo = await page.evaluate(() => {
      // Find "Submit Answer" button
      let submitBtn = null;
      const allButtons = document.querySelectorAll('button');
      for (const btn of allButtons) {
        if (btn.textContent?.trim() === 'Submit Answer') {
          submitBtn = btn;
          break;
        }
      }
      if (!submitBtn) return { error: 'No Submit Answer button' };
      
      // Walk up to find the panel container (has border-blue class or is the mx-4 mb-2 rounded-xl div)
      let panel = submitBtn.parentElement;
      for (let i = 0; i < 10 && panel; i++) {
        if (panel.classList.contains('rounded-xl') || panel.classList.contains('overflow-hidden')) {
          break;
        }
        panel = panel.parentElement;
      }
      if (!panel) return { error: 'Cannot find panel container' };
      
      // Collect all data from within the panel
      const headers = [];
      const questions = [];
      const options = [];
      const actions = [];
      
      // Find headers (text-xs font-semibold)
      panel.querySelectorAll('div').forEach(div => {
        // Check for header-like divs
        const cls = div.className || '';
        if (cls.includes('font-semibold') && div.textContent.length < 50) {
          headers.push(div.textContent.trim());
        }
      });
      
      // Find option buttons and action buttons
      panel.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent?.trim() || '';
        const rect = btn.getBoundingClientRect();
        if (text === 'Submit Answer' || text === 'Skip' || text === 'Dismiss') {
          actions.push({ text, disabled: btn.disabled });
        } else if (text !== '' && text.length < 100) {
          options.push({
            text,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          });
        }
      });
      
      return { headers, options, actions, panelTagName: panel.tagName, panelClasses: panel.className.slice(0, 100) };
    });
    
    console.log('  Panel:', panelInfo.panelTagName, panelInfo.panelClasses?.slice(0, 60));
    console.log('  Headers:', panelInfo.headers);
    console.log('  Options:', panelInfo.options?.map(o => `"${o.text}" (${o.w}x${o.h})`));
    console.log('  Actions:', panelInfo.actions?.map(a => `${a.text} (disabled=${a.disabled})`));

    if (!panelInfo.options?.length) {
      console.log('❌ No options found');
      // Debug: dump panel HTML
      const html = await page.evaluate(() => {
        let submitBtn = null;
        document.querySelectorAll('button').forEach(b => { if (b.textContent?.trim() === 'Submit Answer') submitBtn = b; });
        if (!submitBtn) return 'no submit btn';
        let el = submitBtn;
        for (let i = 0; i < 10; i++) el = el.parentElement;
        return el?.innerHTML?.slice(0, 2000) || 'no parent';
      });
      console.log('  Panel HTML:', html.slice(0, 1000));
      await browser.close();
      process.exit(1);
    }

    // 6. Click first option
    const firstOpt = panelInfo.options[0];
    console.log(`\n[6] Clicking: "${firstOpt.text}"`);
    await page.mouse.click(firstOpt.x, firstOpt.y);
    await page.waitForTimeout(300);

    const toggleLogs = logs.filter(l => l.text.includes('Option toggled'));
    console.log(`    Toggle events: ${toggleLogs.length} ${toggleLogs.length > 0 ? '✅' : '⚠️'}`);

    // If multiple questions, select one from each
    if (panelInfo.headers.length > 1) {
      // Identify where second group starts (options are ordered by DOM position)
      // Pick the last option (likely from a different question group)
      const lastOpt = panelInfo.options[panelInfo.options.length - 1];
      if (lastOpt.text !== firstOpt.text) {
        console.log(`    Also clicking: "${lastOpt.text}"`);
        await page.mouse.click(lastOpt.x, lastOpt.y);
        await page.waitForTimeout(300);
      }
    }

    await page.screenshot({ path: '/tmp/qp-selected.png', fullPage: false });

    // 7. Click Submit Answer
    console.log('\n[7] Clicking Submit Answer...');
    const submitClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.trim() === 'Submit Answer' && !btn.disabled) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    console.log(`    Clicked: ${submitClicked ? '✅' : '❌'}`);
    
    if (!submitClicked) {
      // Check if disabled
      const btnState = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent?.trim() === 'Submit Answer') {
            return { disabled: btn.disabled, classes: btn.className };
          }
        }
        return null;
      });
      console.log('    Submit button state:', JSON.stringify(btnState));
      await browser.close();
      process.exit(1);
    }
    
    const submitTime = Date.now();

    // 8. Monitor post-submit
    console.log('\n[8] Monitoring post-submit...');
    
    // Wait briefly then check
    await page.waitForTimeout(500);
    
    // Check QuestionPanel gone
    const qpGone = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.trim() === 'Submit Answer') return false;
      }
      return true;
    });
    console.log(`    QuestionPanel gone: ${qpGone ? '✅' : '⏳'}`);

    // Monitor SSE resume and streaming
    let resumeStarted = false;
    let streaming = false;
    let complete = false;
    
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      const elapsed = ((Date.now() - submitTime) / 1000).toFixed(0);
      
      const postLogs = logs.filter(l => l.t >= submitTime);
      const resumeL = postLogs.filter(l => l.text.includes('Starting SSE resume'));
      const partL = postLogs.filter(l => l.text.includes('onPartUpdated'));
      const completeL = postLogs.filter(l => l.text.includes('Resume stream completed') || l.text.includes('onComplete'));
      const errorL = postLogs.filter(l => l.text.includes('Error') || l.text.includes('error'));
      const questionL = postLogs.filter(l => l.text.includes('question.asked'));
      
      if (!resumeStarted && resumeL.length > 0) {
        resumeStarted = true;
        console.log(`    [${elapsed}s] ★ SSE Resume STARTED`);
      }
      
      if (!streaming && partL.length > 0) {
        streaming = true;
        console.log(`    [${elapsed}s] ★★ Streaming (${partL.length} parts)`);
      }
      
      console.log(`    [${elapsed}s] resume=${resumeL.length} parts=${partL.length} complete=${completeL.length} errors=${errorL.length} newQ=${questionL.length}`);
      
      if (errorL.length > 0) {
        errorL.forEach(l => console.log(`      ERR: ${l.text.slice(0, 150)}`));
      }
      
      if (completeL.length > 0) {
        complete = true;
        console.log(`    [${elapsed}s] ★★★ COMPLETE!`);
        break;
      }
      
      // If nothing happening after 8s, dump logs
      if (i === 3 && !resumeStarted && partL.length === 0) {
        console.log('    ⚠️ No activity after 8s. Recent logs:');
        postLogs.slice(0, 20).forEach(l => console.log(`      ${l.text.slice(0, 180)}`));
      }

      // If a new question appeared, that's also a valid outcome
      if (questionL.length > 0) {
        console.log(`    [${elapsed}s] ★ New question appeared during response`);
        break;
      }
    }

    // Take final screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/qp-final.png', fullPage: false });

    // Get final content
    const finalContent = await page.evaluate(() => {
      const elems = document.querySelectorAll('.prose, .whitespace-pre-wrap, [class*="markdown"]');
      return Array.from(elems).map(el => el.textContent?.trim().slice(0, 200)).filter(t => t && t.length > 5);
    });
    
    console.log('\n[9] Final chat content:');
    finalContent.slice(-3).forEach(t => console.log(`    ${t}`));

    // Summary
    console.log('\n═══ RESULTS ═══');
    console.log(`QuestionPanel appeared:    ${questionPanelFound ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Option selection:          ${toggleLogs.length > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Submit Answer:             ${submitClicked ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Panel disappeared:         ${qpGone ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`SSE resume started:        ${resumeStarted ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`AI response streaming:     ${streaming ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Response completed:        ${complete ? '✅ PASS' : '❌ FAIL'}`);

  } catch (err) {
    console.error('Test error:', err.message);
    logs.slice(-15).forEach(l => console.log(l.text.slice(0, 200)));
  } finally {
    await browser.close();
  }
})();
