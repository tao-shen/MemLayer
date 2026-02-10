const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Try GitHub Pages URL
  const url = 'https://tao-shen.github.io/Tacits/';
  console.log(`Loading: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Screenshot
  await page.screenshot({ path: '/tmp/tacits-skills.png', fullPage: true });
  
  // Get visible text
  const text = await page.textContent('body');
  console.log('\n=== VISIBLE TEXT (first 1500 chars) ===');
  console.log(text.slice(0, 1500));
  
  // Find all interactive elements
  const interactiveInfo = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('button, [role="button"], input').forEach(el => {
      items.push({
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 60) || el.placeholder || '',
        className: el.className?.slice(0, 80),
        type: el.getAttribute('type') || '',
      });
    });
    return items;
  });
  console.log(`\n=== INTERACTIVE ELEMENTS (${interactiveInfo.length}) ===`);
  interactiveInfo.slice(0, 20).forEach(i => console.log(`  ${i.tag}[${i.type}]: "${i.text}" class="${i.className}"`));
  
  // Count clickable cards
  const cards = await page.evaluate(() => {
    return document.querySelectorAll('[class*="hover"]').length;
  });
  console.log(`\nHoverable elements: ${cards}`);
  
  const clickables = await page.evaluate(() => {
    return document.querySelectorAll('[class*="cursor"]').length;
  });
  console.log(`Cursor elements: ${clickables}`);
  
  await browser.close();
})();
