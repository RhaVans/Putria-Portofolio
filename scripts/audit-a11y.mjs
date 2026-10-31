import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  const axeSource = fs.readFileSync('/root/projects/PUT/node_modules/axe-core/axe.min.js', 'utf8');

  const routes = ['/', '/about', '/work', '/contact', '/work/leadership-camp-coordinator'];
  let totalViolations = 0;

  for (const r of routes) {
    await page.goto(`http://localhost:4321${r}`, { waitUntil: 'networkidle0' });
    await page.evaluate(axeSource);
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa']
        }
      });
    });

    const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    console.log(`Route ${r}: ${results.violations.length} violations (${serious.length} critical/serious)`);
    if (results.violations.length > 0) {
      console.log(JSON.stringify(results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description })), null, 2));
      totalViolations += results.violations.length;
    }
  }

  await browser.close();

  if (totalViolations === 0) {
    console.log('\nPASS: Zero axe-core accessibility violations across all routes!');
  } else {
    console.log(`\nFAIL: Total violations: ${totalViolations}`);
  }
})();
