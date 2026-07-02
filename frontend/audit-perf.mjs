import { chromium } from '@playwright/test';

const ROUTES = [
  { path: '/cases',            label: 'Cases Dashboard' },
  { path: '/cases/CASE_48193', label: 'Case Detail'     },
  { path: '/mlops',            label: 'MLOps Dashboard' },
];

async function measureRoute(context, url, label) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  const resources = [];
  page.on('response', async (res) => {
    try {
      const body = await res.body();
      const timing = res.request().timing();
      resources.push({
        url:      res.url().replace('http://localhost:3000', ''),
        size:     body.length,
        duration: (timing?.responseEnd ?? 0) - (timing?.requestStart ?? 0),
        type:     res.request().resourceType(),
      });
    } catch { /* binary resource */ }
  });

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
  // Wait for React hydration + framer-motion animations
  await page.waitForTimeout(2000);
  const navDuration = Date.now() - t0;

  const vitals = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime ?? null;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries.length ? lcpEntries[lcpEntries.length - 1].startTime : null;
    let cls = 0;
    for (const e of performance.getEntriesByType('layout-shift')) {
      if (!e.hadRecentInput) cls += e.value;
    }
    const longTasks = performance.getEntriesByType('longtask')?.length ?? 0;
    const mem = performance.memory;
    return {
      ttfb:           nav?.responseStart?.toFixed(0) ?? null,
      domInteractive: nav?.domInteractive?.toFixed(0) ?? null,
      domComplete:    nav?.domComplete?.toFixed(0) ?? null,
      fcp:            fcp?.toFixed(0) ?? null,
      lcp:            lcp?.toFixed(0) ?? null,
      cls:            cls.toFixed(4),
      longTasks,
      jsHeapUsedMB:   mem ? (mem.usedJSHeapSize  / 1024 / 1024).toFixed(1) : 'N/A',
      jsHeapTotalMB:  mem ? (mem.totalJSHeapSize / 1024 / 1024).toFixed(1) : 'N/A',
    };
  });

  const jsRes  = resources.filter(r => r.type === 'script');
  const cssRes = resources.filter(r => r.type === 'stylesheet');

  const top5Js = [...jsRes]
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map(r => `${r.url.split('/').pop()}: ${(r.size/1024).toFixed(1)}KB`);

  await page.close();
  return {
    label, url, navDuration, vitals,
    totalJsKB:    (jsRes.reduce((s, r) => s + r.size, 0) / 1024).toFixed(1),
    totalCssKB:   (cssRes.reduce((s, r) => s + r.size, 0) / 1024).toFixed(1),
    totalRequests: resources.length,
    jsChunks:     jsRes.length,
    top5Js,
    errors,
  };
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];

  for (const route of ROUTES) {
    console.log(`Profiling: ${route.label} ...`);
    try {
      results.push(await measureRoute(context, `http://localhost:3000${route.path}`, route.label));
    } catch (e) {
      console.error(`ERROR: ${e.message}`);
    }
  }

  console.log('\n===== PERFORMANCE RESULTS =====\n');
  for (const r of results) {
    console.log(`=== ${r.label} ===`);
    console.log(`  Nav Duration   : ${r.navDuration}ms`);
    console.log(`  TTFB           : ${r.vitals.ttfb}ms`);
    console.log(`  FCP            : ${r.vitals.fcp}ms`);
    console.log(`  LCP            : ${r.vitals.lcp}ms`);
    console.log(`  CLS            : ${r.vitals.cls}`);
    console.log(`  DOM Interactive: ${r.vitals.domInteractive}ms`);
    console.log(`  Long Tasks     : ${r.vitals.longTasks}`);
    console.log(`  JS Heap Used   : ${r.vitals.jsHeapUsedMB} MB`);
    console.log(`  JS Heap Total  : ${r.vitals.jsHeapTotalMB} MB`);
    console.log(`  Total JS       : ${r.totalJsKB} KB (${r.jsChunks} chunks)`);
    console.log(`  Total CSS      : ${r.totalCssKB} KB`);
    console.log(`  Total Requests : ${r.totalRequests}`);
    console.log(`  Top JS Chunks  :`);
    r.top5Js.forEach(c => console.log(`    - ${c}`));
    if (r.errors.length) console.log(`  JS Errors: ${r.errors.join(' | ')}`);
    console.log('');
  }

  await context.close();
  await browser.close();
  process.exit(0);
})();
