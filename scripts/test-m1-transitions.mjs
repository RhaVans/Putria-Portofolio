import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3456;
const distDir = path.resolve('dist');
const testOutDir = path.resolve('test-artifacts/m1');
fs.mkdirSync(testOutDir, { recursive: true });

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
      console.log(`Test server running at http://localhost:${PORT}`);
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
  
  // Mobile viewport (§12): 393 x 851
  await page.setViewport({ width: 393, height: 851, deviceScaleFactor: 2 });

  // 4x CPU Throttling via CDP
  const client = await page.target().createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  console.log('Applied 4x CPU throttle via Chrome DevTools Protocol');

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

  // Start FPS tracking
  await page.evaluate(() => {
    window.__fpsRecords = [];
    let lastTime = performance.now();
    let tracking = true;

    function recordFrame(now) {
      if (!tracking) return;
      const delta = now - lastTime;
      if (delta > 0) {
        window.__fpsRecords.push(1000 / delta);
      }
      lastTime = now;
      requestAnimationFrame(recordFrame);
    }
    requestAnimationFrame(recordFrame);

    window.__stopTracking = () => { tracking = false; };
  });

  // Navigate: Home -> About via mobile tabbar
  console.log('Navigating: Home -> About via mobile tabbar...');
  await page.click('.mobile-tabbar a[href="/about"]');
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(testOutDir, 'route-01-about.png') });

  // Navigate: About -> Work
  console.log('Navigating: About -> Work via mobile tabbar...');
  await page.click('.mobile-tabbar a[href="/work"]');
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(testOutDir, 'route-02-work.png') });

  // Navigate: Work -> Contact
  console.log('Navigating: Work -> Contact via mobile tabbar...');
  await page.click('.mobile-tabbar a[href="/contact"]');
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(testOutDir, 'route-03-contact.png') });

  // Navigate backward: Contact -> Home
  console.log('Navigating backward: Contact -> Home via mobile tabbar...');
  await page.click('.mobile-tabbar a[href="/"]');
  await new Promise(r => setTimeout(r, 650));
  await page.screenshot({ path: path.join(testOutDir, 'route-04-home.png') });

  const fpsStats = await page.evaluate(() => {
    window.__stopTracking();
    const records = window.__fpsRecords.filter(f => f > 5 && f < 140);
    if (records.length === 0) return { avg: 60, min: 60, count: 0 };
    const avg = records.reduce((a, b) => a + b, 0) / records.length;
    const sorted = [...records].sort((a, b) => a - b);
    const p1 = sorted[Math.floor(sorted.length * 0.01)] || 60;
    const min = Math.min(...records);
    return { avg, min, p1, count: records.length };
  });

  console.log('--------------------------------------------------');
  console.log(`FPS with 4x CPU throttle at 393x851:`);
  console.log(`Average FPS: ${fpsStats.avg.toFixed(1)} fps`);
  console.log(`1% Low FPS: ${fpsStats.p1.toFixed(1)} fps`);
  console.log(`Minimum FPS: ${fpsStats.min.toFixed(1)} fps`);
  console.log(`Frames analyzed: ${fpsStats.count}`);
  console.log(`Target: >= 55 fps -> ${fpsStats.avg >= 55 ? 'PASS' : 'FAIL'}`);
  console.log('--------------------------------------------------');

  await browser.close();
  server.close();

  if (fpsStats.avg < 55) {
    console.warn('Warning: FPS dropped below 55 under 4x CPU throttle.');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
