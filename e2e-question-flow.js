/**
 * E2E Diagnostic Test: What happens after question submit?
 */

const { chromium } = require('playwright');
const URL = 'https://tacits-candy-shop.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', msg => logs.push({ t: Date.now(), text: msg.text() }));

  console.log('=== Diagnostic Question Flow ===\n');

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Open chat
    const runBtns = await page.$$('[title="Run skill"]');
    if (runBtns.length > 0) { await runBtns[0].scrollIntoViewIfNeeded(); await runBtns[0].click(); }
    await page.waitForTimeout(2000);

    // Send message - this prompt is known to trigger questions from OpenCode
    const textarea = await page.$('textarea');
    await textarea.waitForElementState('enabled', { timeout: 10000 });
    await textarea.fill('帮我创建一个全新的网站项目');
    await textarea.press('Enter');
    console.log('[1] Message sent');

    // Wait for QuestionPanel - increased timeout
    let found = false;
    for (let i = 0; i < 45; i++) {
      await page.waitForTimeout(2000);
      const has = await page.evaluate(() => {
        for (const btn of document.querySelectorAll('button'))
          if (btn.textContent?.trim() === 'Submit Answer') return true;
        return false;
      });
      if (has) { 
        found = true;
        console.log(`[2] QuestionPanel found at ${i*2}s`); 
        break; 
      }
      // Also check if stream completed without question
      const completeLogs = logs.filter(l => l.text.includes('onComplete'));
      if (completeLogs.length > 0 && i > 10) {
        console.log(`[2] Stream completed without question at ${i*2}s`);
        break;
      }
    }

    if (!found) { 
      console.log('[2] QuestionPanel not found');
      console.log('Recent logs:');
      logs.slice(-15).forEach(l => console.log('  ', l.text.slice(0, 200)));
      await browser.close();
      process.exit(1); 
    }

    // ★ KEY DIAGNOSTIC: Check if SSE stream is still alive
    console.log('\n--- SSE STATE BEFORE SUBMIT ---');
    const preSubmitSSELogs = logs.filter(l => 
      l.text.includes('[OpenCode][SSE]') || 
      l.text.includes('onComplete') || 
      l.text.includes('stream ended') ||
      l.text.includes('SSE aborted')
    );
    preSubmitSSELogs.slice(-10).forEach(l => console.log(`  ${l.text.slice(0, 200)}`));

    // Check if onComplete was already called (SSE stream died)
    const preCompleted = logs.filter(l => l.text.includes('onComplete'));
    console.log(`\n  onComplete called before submit: ${preCompleted.length > 0 ? 'YES ⚠️' : 'NO ✅'}`);

    // Select first option
    const opt = await page.evaluate(() => {
      let submitBtn = null;
      for (const btn of document.querySelectorAll('button'))
        if (btn.textContent?.trim() === 'Submit Answer') { submitBtn = btn; break; }
      if (!submitBtn) return null;
      let panel = submitBtn;
      for (let i = 0; i < 10; i++) { panel = panel.parentElement; if (panel.classList.contains('rounded-xl')) break; }
      const opts = [];
      panel.querySelectorAll('button').forEach(btn => {
        const t = btn.textContent?.trim();
        const r = btn.getBoundingClientRect();
        if (t && !['Submit Answer','Skip','Dismiss','Other…'].includes(t) && r.width > 40)
          opts.push({ text: t, x: r.x + r.width/2, y: r.y + r.height/2 });
      });
      return opts[0];
    });
    
    if (opt) {
      await page.mouse.click(opt.x, opt.y);
      console.log(`\n[3] Selected: "${opt.text}"`);
    }
    await page.waitForTimeout(300);

    // Submit
    const submitTime = Date.now();
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button'))
        if (btn.textContent?.trim() === 'Submit Answer' && !btn.disabled) { btn.click(); return; }
    });
    console.log('[4] Submit clicked');

    // Monitor with FULL log output for 45s
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(3000);
      const elapsed = ((Date.now() - submitTime) / 1000).toFixed(0);
      const newLogs = logs.filter(l => l.t >= submitTime);
      
      console.log(`\n--- [${elapsed}s] ${newLogs.length} logs since submit ---`);
      newLogs.slice(-8).forEach(l => console.log(`  ${l.text.slice(0, 250)}`));
      
      if (newLogs.some(l => l.text.includes('onComplete') || l.text.includes('stream completed'))) {
        console.log('★★★ Completed!');
        break;
      }
      if (newLogs.some(l => l.text.includes('onPartUpdated'))) {
        console.log('★★★ Streaming!');
      }
      if (newLogs.some(l => l.text.includes('question.asked'))) {
        console.log('★★★ New question!');
        break;
      }
    }

    // Summary of all post-submit logs
    console.log('\n\n=== ALL POST-SUBMIT LOGS ===');
    logs.filter(l => l.t >= submitTime).forEach(l => console.log(`  ${l.text.slice(0, 250)}`));

    await page.screenshot({ path: '/tmp/qp-diag.png' });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
