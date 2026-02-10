/**
 * SIMPLE APPROACH: Find any textarea and test it
 * This will help us understand the actual UI structure
 */

const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('🔍 Simple exploration test\n');

  // Monitor console
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', error => console.error('❌ PAGE ERROR:', error.message));

  try {
    // Navigate
    console.log('1. Navigating...');
    await page.goto('https://tacits-candy-shop.vercel.app', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/simple-01-home.png', fullPage: true });
    
    // Find Skills tab
    console.log('\n2. Looking for Skills...');
    const skillsLink = await page.locator('text=Skills').first();
    if (await skillsLink.isVisible({ timeout: 5000 })) {
      console.log('✅ Found Skills link');
      await skillsLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/simple-02-skills.png', fullPage: true });
    }

    // List ALL clickable elements
    console.log('\n3. Finding ALL clickable elements...');
    const allButtons = await page.locator('button').all();
    console.log(`Found ${allButtons.length} buttons`);
    
    for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
      const btn = allButtons[i];
      const text = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      if (visible && text) {
        console.log(`  Button ${i}: "${text.substring(0, 50)}"`);
      }
    }

    // List ALL links
    const allLinks = await page.locator('a').all();
    console.log(`\nFound ${allLinks.length} links`);
    
    for (let i = 0; i < Math.min(allLinks.length, 20); i++) {
      const link = allLinks[i];
      const text = await link.textContent().catch(() => '');
      const href = await link.getAttribute('href').catch(() => '');
      const visible = await link.isVisible().catch(() => false);
      if (visible && (text || href)) {
        console.log(`  Link ${i}: "${text.substring(0, 30)}" -> ${href}`);
      }
    }

    // Try clicking the FIRST visible skill card or button
    console.log('\n4. Trying to click first skill-related element...');
    
    // Try different approaches
    const approaches = [
      { name: 'Card with "Run" button', selector: 'button:has-text("Run")' },
      { name: 'Card with "Execute"', selector: 'button:has-text("Execute")' },
      { name: 'Any card', selector: '[class*="card"]' },
      { name: 'Article element', selector: 'article' },
    ];

    for (const approach of approaches) {
      console.log(`\n  Trying: ${approach.name}`);
      const elements = await page.locator(approach.selector).all();
      console.log(`  Found ${elements.length} elements`);
      
      if (elements.length > 0) {
        const first = elements[0];
        if (await first.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`  ✅ Clicking first ${approach.name}...`);
          await first.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: `screenshots/simple-03-after-${approach.name.replace(/\s+/g, '-')}.png`, fullPage: true });
          
          // Check for textarea
          const textareaCount = await page.locator('textarea').count();
          console.log(`  Textareas found: ${textareaCount}`);
          
          if (textareaCount > 0) {
            console.log('  🎉 FOUND TEXTAREA!');
            const textarea = await page.locator('textarea').first();
            
            // Try to type and send
            console.log('\n5. Testing the textarea...');
            await textarea.fill('测试消息');
            await page.screenshot({ path: 'screenshots/simple-04-typed.png', fullPage: true });
            
            await textarea.press('Enter');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'screenshots/simple-05-sent.png', fullPage: true });
            
            console.log('✅ Test complete!');
            break;
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/simple-error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(5000); // Keep browser open to inspect
    await browser.close();
  }
}

simpleTest();
