import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/cases',
    'http://localhost:3000/cases/CASE_48193',
    'http://localhost:3000/mlops',
    'http://localhost:3000/settings'
  ];

  for (const url of urls) {
    console.log(`\n================================`);
    console.log(`Testing ${url} ...`);
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });
    
    page.on('pageerror', exception => {
      errors.push(exception.message);
    });

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      console.log(`Status: ${response.status()}`);
      
      // Basic Accessibility / Render check
      const mainContent = await page.evaluate(() => {
        return document.body.innerHTML.length > 500 ? 'Rendered successfully' : 'Empty body';
      });
      console.log(`Render: ${mainContent}`);

      console.log(`Errors: ${errors.length}`);
      if (errors.length > 0) console.log(errors);
      console.log(`Warnings: ${warnings.length}`);
      if (warnings.length > 0) console.log(warnings);
    } catch (e) {
      console.error(`Failed to load ${url}:`, e.message);
    }
    
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
  }

  await browser.close();
  process.exit(0);
})();
