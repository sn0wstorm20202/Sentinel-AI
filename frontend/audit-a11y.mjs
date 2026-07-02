import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  { path: '/',                 label: 'Root Redirect'   },
  { path: '/cases',            label: 'Cases Dashboard' },
  { path: '/cases/CASE_48193', label: 'Case Detail'     },
  { path: '/mlops',            label: 'MLOps Dashboard' },
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  for (const route of ROUTES) {
    const page = await context.newPage();
    const url  = `http://localhost:3000${route.path}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Route: ${route.label} (${url})`);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(900); // let framer animations settle

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
        .analyze();

      console.log(`  Violations : ${results.violations.length}`);
      console.log(`  Passes     : ${results.passes.length}`);
      console.log(`  Incomplete : ${results.incomplete.length}`);

      if (results.violations.length > 0) {
        console.log('\n  --- VIOLATIONS ---');
        for (const v of results.violations) {
          console.log(`  [${(v.impact ?? 'unknown').toUpperCase()}] ${v.id}: ${v.description}`);
          console.log(`    Help: ${v.helpUrl}`);
          for (const node of v.nodes.slice(0, 2)) {
            console.log(`    Target: ${node.target.join(' > ')}`);
            if (node.failureSummary) {
              console.log(`    Issue : ${node.failureSummary.split('\n')[0]}`);
            }
          }
        }
      }

      if (results.incomplete.length > 0) {
        console.log('\n  --- NEEDS MANUAL REVIEW ---');
        for (const inc of results.incomplete) {
          console.log(`  [?] ${inc.id}: ${inc.description}`);
        }
      }

    } catch (err) {
      console.error(`  LOAD ERROR: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
  process.exit(0);
})();
