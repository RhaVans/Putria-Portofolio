import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3461;
const distDir = path.resolve('dist');
const outDir = path.resolve('test-artifacts/m4');
fs.mkdirSync(outDir, { recursive: true });

function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.woff2': 'font/woff2',
    '.avif': 'image/avif',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, '404.html');
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(filePath));
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`M4 server running on port ${PORT}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer();

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  // Test viewports (§7)
  const viewports = [
    { width: 320, height: 640, label: '320px (minimum)' },
    { width: 360, height: 800, label: '360x800 (baseline Android)' },
    { width: 390, height: 844, label: '390x844 (standard mobile)' },
    { width: 412, height: 915, label: '412x915 (large Android)' },
    { width: 768, height: 1024, label: '768px (tablet)' },
    { width: 1024, height: 768, label: '1024px (small desktop)' },
    { width: 1440, height: 900, label: '1440px (desktop standard)' }
  ];

  const routes = ['/', '/about', '/work', '/work/leadership-camp-coordinator', '/contact'];
  const auditResults = [];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    
    for (const route of routes) {
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0' });

      // Check horizontal overflow
      const overflowInfo = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const hasOverflow = docW > winW;
        
        // Find elements wider than viewport if any
        let offending = [];
        if (hasOverflow) {
          document.querySelectorAll('*').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.right > winW + 1) {
              offending.push(`${el.tagName.toLowerCase()}.${el.className} (right: ${r.right.toFixed(0)}px)`);
            }
          });
        }
        return { hasOverflow, docW, winW, offending: offending.slice(0, 3) };
      });

      auditResults.push({
        viewport: vp.label,
        route,
        overflow: overflowInfo.hasOverflow ? 'FAIL (Overflow)' : 'PASS (Clean)',
        docWidth: overflowInfo.docW,
        winWidth: overflowInfo.winW,
        offending: overflowInfo.offending
      });
    }

    // Capture responsive snapshot on Home
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(outDir, `home-${vp.width}.png`) });
  }

  console.table(auditResults);

  // Check tap targets on mobile 360px
  await page.setViewport({ width: 360, height: 800 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  const tapTargetCheck = await page.evaluate(() => {
    const interactives = document.querySelectorAll('a, button');
    let smallTargets = [];
    interactives.forEach((el) => {
      const r = el.getBoundingClientRect();
      // only check visible elements
      if (r.width > 0 && r.height > 0 && r.top < window.innerHeight) {
        if (r.width < 40 || r.height < 40) { // allow margin for icons inside padded wrappers
          smallTargets.push(`${el.tagName}.${el.className} (${r.width.toFixed(0)}x${r.height.toFixed(0)})`);
        }
      }
    });
    return { count: interactives.length, smallTargets: smallTargets.slice(0, 5) };
  });

  console.log('Tap target check on 360px:');
  console.log(`Small targets found:`, tapTargetCheck.smallTargets);

  // Check backdrop-filter count on mobile (< 768px, target <= 5 visible surfaces)
  const backdropCount = await page.evaluate(() => {
    let count = 0;
    document.querySelectorAll('*').forEach((el) => {
      const style = window.getComputedStyle(el);
      const bdf = style.backdropFilter || style.webkitBackdropFilter;
      if (bdf && bdf !== 'none') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.top < window.innerHeight && r.bottom > 0) {
          count++;
        }
      }
    });
    return count;
  });
  console.log(`Backdrop filter surfaces visible on mobile viewport: ${backdropCount} (Target: <= 5) -> ${backdropCount <= 5 ? 'PASS' : 'FAIL'}`);

  await browser.close();
  server.close();

  const anyFail = auditResults.some(r => r.overflow.includes('FAIL'));
  console.log(`Overall responsive overflow status: ${anyFail ? 'FAIL' : 'ALL PASS'}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
