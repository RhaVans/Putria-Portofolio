import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  const routes = ['/', '/about', '/work', '/contact', '/work/leadership-camp-coordinator'];
  const widths = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440];
  const overflows = [];

  for (const route of routes) {
    for (const width of widths) {
      await page.setViewport({ width, height: 800 });
      await page.goto(`http://localhost:4321${route}`, { waitUntil: 'domcontentloaded' });
      const bad = await page.evaluate((w) => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        if (docWidth > w || bodyWidth > w) {
          const elements = [];
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > w + 1) {
              elements.push({ tag: el.tagName, class: el.className, right: r.right, width: r.width });
            }
          });
          return { docWidth, bodyWidth, elements: elements.slice(0, 3) };
        }
        return null;
      }, width);

      if (bad) {
        overflows.push({ route, width, ...bad });
      }
    }
  }

  await browser.close();

  if (overflows.length === 0) {
    console.log('PASS: Zero horizontal overflows detected from 320px to 1440px across all routes.');
  } else {
    console.log('FAIL: Overflows found:', JSON.stringify(overflows, null, 2));
  }
})();
