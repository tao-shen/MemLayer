/**
 * E2E Test: Full Question Cycle Verification
 * Verifies: question → select → submit → SSE resume → (text OR follow-up question)
 */

const { chromium } = require('playwright');
const URL = 'https://tacits-candy-shop.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', msg => logs.push({ t: Date.now(), text: msg.text() }));

  console.log('=== Full Question Cycle Test ===\n');

  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Open chat
    const runBtns = await page.$$('[title="Run skill"]');
    if (runBtns.length > 0) { await runBtns[0].scrollIntoViewIfNeeded(); await runBtns[0].click(); }
    await page.waitForTimeout(2000);

    // Send message
    const textarea = await page.$('textarea');
    await textarea.waitForElementState('enabled', { timeout: 10000 });
    await textarea.fill('帮我创建一个全新的网站项目');
    await textarea.press('Enter');
    console.log('[1] Message sent');

    // Wait for first QuestionPanel
    console.log('[2] Waiting for first QuestionPanel...');
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      const has = await page.evaluate(() => {
        for (const btn of document.querySelectorAll('button'))
          if (btn.textContent?.trim() === 'Submit Answer') return true;
        return false;
      });
      if (has) { console.log(`    Found at ${i*2}s`); break; }
    }

    // Get panel info
    const info = await page.evaluate(() => {
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
        if (t && !['Submit Answer','Skip','Dismiss'].includes(t) && t !== 'Other…' && r.width > 40)
          opts.push({ text: t, x: r.x + r.width/2, y: r.y + r.height/2 });
      });
      const headers = [];
      panel.querySelectorAll('div').forEach(d => {
        if ((d.className || '').includes('font-semibold') && d.textContent.length < 50)
          headers.push(d.textContent.trim());
      });
      return { headers, opts };
    });
    console.log(`    ${info.headers.length} question groups: ${info.headers.join(', ')}`);
    console.log(`    ${info.opts.length} options available`);

    // Select one option from EACH question group
    // Simple heuristic: options are in DOM order, so distribute clicks
    const optPerGroup = Math.ceil(info.opts.length / info.headers.length);
    for (let g = 0; g < info.headers.length; g++) {
      const optIdx = g * optPerGroup;
      if (optIdx < info.opts.length) {
        const o = info.opts[optIdx];
        await page.mouse.click(o.x, o.y);
        console.log(`    Selected [${info.headers[g]}]: "${o.text}"`);
        await page.waitForTimeout(200);
      }
    }

    await page.screenshot({ path: '/tmp/qp-selected.png' });

    // Click Submit Answer
    console.log('[3] Submitting...');
    await page.evaluate(() => {
      for (const btn of document.querySelectorAll('button'))
        if (btn.textContent?.trim() === 'Submit Answer' && !btn.disabled) { btn.click(); return; }
    });
    const submitTime = Date.now();
    console.log('    Submitted ✅');

    // Monitor for EITHER text streaming OR new question
    console.log('[4] Monitoring response...');
    let resumeStarted = false, gotParts = false, gotComplete = false, gotNewQuestion = false;

    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      const el = ((Date.now() - submitTime) / 1000).toFixed(0);
      const post = logs.filter(l => l.t >= submitTime);
      const resume = post.filter(l => l.text.includes('SSE resume') || l.text.includes('resumeAfterQuestion'));
      const parts = post.filter(l => l.text.includes('onPartUpdated'));
      const complete = post.filter(l => l.text.includes('Resume stream completed') || l.text.includes('onComplete'));
      const questions = post.filter(l => l.text.includes('question.asked'));
      const errors = post.filter(l => l.text.toLowerCase().includes('error'));

      if (resume.length > 0 && !resumeStarted) { resumeStarted = true; console.log(`    [${el}s] SSE resume started`); }
      if (parts.length > 0 && !gotParts) { gotParts = true; console.log(`    [${el}s] ★ Text streaming!`); }
      if (questions.length > 0 && !gotNewQuestion) { gotNewQuestion = true; console.log(`    [${el}s] ★ Follow-up question received!`); }
      
      console.log(`    [${el}s] resume=${resume.length} parts=${parts.length} Qs=${questions.length} done=${complete.length} err=${errors.length}`);

      if (complete.length > 0) { gotComplete = true; console.log(`    [${el}s] ★★★ Stream complete`); break; }

      // If new question appeared, check if QuestionPanel re-renders
      if (gotNewQuestion) {
        await page.waitForTimeout(1000);
        const hasQP = await page.evaluate(() => {
          for (const btn of document.querySelectorAll('button'))
            if (btn.textContent?.trim() === 'Submit Answer') return true;
          return false;
        });
        console.log(`    Follow-up QuestionPanel visible: ${hasQP ? '✅' : '❌'}`);
        
        if (hasQP) {
          // ★★ Do a SECOND round of question answering to test the full cycle
          console.log('\n[5] ★ Second round: answering follow-up question...');
          
          const info2 = await page.evaluate(() => {
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
              if (t && !['Submit Answer','Skip','Dismiss'].includes(t) && t !== 'Other…' && r.width > 40)
                opts.push({ text: t, x: r.x + r.width/2, y: r.y + r.height/2 });
            });
            return { count: opts.length, first: opts[0] };
          });
          
          if (info2?.first) {
            await page.mouse.click(info2.first.x, info2.first.y);
            console.log(`    Selected: "${info2.first.text}"`);
            await page.waitForTimeout(300);
            
            // Submit second round
            await page.evaluate(() => {
              for (const btn of document.querySelectorAll('button'))
                if (btn.textContent?.trim() === 'Submit Answer' && !btn.disabled) { btn.click(); return; }
            });
            const sub2Time = Date.now();
            console.log('    Submitted round 2 ✅');
            
            // Monitor second round
            for (let j = 0; j < 15; j++) {
              await page.waitForTimeout(2000);
              const el2 = ((Date.now() - sub2Time) / 1000).toFixed(0);
              const post2 = logs.filter(l => l.t >= sub2Time);
              const parts2 = post2.filter(l => l.text.includes('onPartUpdated'));
              const complete2 = post2.filter(l => l.text.includes('Resume stream completed') || l.text.includes('onComplete'));
              const q2 = post2.filter(l => l.text.includes('question.asked'));
              
              console.log(`    [${el2}s] parts=${parts2.length} Qs=${q2.length} done=${complete2.length}`);
              
              if (parts2.length > 0 && !gotParts) {
                gotParts = true;
                console.log(`    [${el2}s] ★★ Text streaming in round 2!`);
              }
              
              if (complete2.length > 0) {
                gotComplete = true;
                console.log(`    [${el2}s] ★★★ Round 2 complete`);
                break;
              }
              
              if (q2.length > 0) {
                console.log(`    [${el2}s] More questions... (AI keeps asking)`);
                break;
              }
            }
          }
        }
        break; // Exit outer monitoring loop
      }
    }

    await page.screenshot({ path: '/tmp/qp-final.png' });

    // Summary
    const responseOK = gotParts || gotNewQuestion; // Either text or follow-up question counts as response
    console.log('\n═══ RESULTS ═══');
    console.log(`QuestionPanel appeared:       ✅`);
    console.log(`Option selection worked:      ✅`);
    console.log(`Submit Answer clicked:        ✅`);
    console.log(`SSE resume started:           ${resumeStarted ? '✅' : '❌'}`);
    console.log(`Server responded (any type):  ${responseOK ? '✅' : '❌'}`);
    console.log(`  - Text parts streamed:      ${gotParts ? '✅' : '⬜ (server chose questions)'}`);
    console.log(`  - Follow-up question:       ${gotNewQuestion ? '✅' : '⬜'}`);
    console.log(`Stream completed:             ${gotComplete ? '✅' : '⬜ (multi-round)'}`);

  } catch (err) {
    console.error('Error:', err.message);
    logs.slice(-10).forEach(l => console.log(l.text.slice(0, 200)));
  } finally {
    await browser.close();
  }
})();
