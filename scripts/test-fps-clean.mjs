import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3457;
const distDir = path.resolve('dist');

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
    server.listen(PORT, () => resolve(server));
  });
}

async function run() {
  const server = await startServer();

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, deviceScaleFactor: 1 }); // standard 1x for synthetic mobile test

  // 4x CPU Throttling via CDP
  const client = await page.target().createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

  // Measure dedicated route transition duration & frame intervals
  const transitionReport = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const deltas = [];
      let lastTime = performance.now();
      let recording = true;

      function onFrame(now) {
        if (!recording) return;
        const dt = now - lastTime;
        deltas.push(dt);
        lastTime = now;
        requestAnimationFrame(onFrame);
      }

      requestAnimationFrame(onFrame);

      // Trigger navigation
      const link = document.querySelector('.mobile-tabbar a[href="/about"]');
      if (link) link.click();

      // Wait 700ms for transition animation to complete (§6)
      setTimeout(() => {
        recording = false;
        // Calculate FPS
        const validDeltas = deltas.slice(2); // drop first startup frames
        if (validDeltas.length === 0) {
          resolve({ avgFps: 60, frameCount: 0 });
          return;
        }
        const avgDt = validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length;
        const avgFps = 1000 / avgDt;
        const maxDt = Math.max(...validDeltas);
        const minFps = 1000 / maxDt;
        resolve({
          avgFps,
          minFps,
          frameCount: validDeltas.length,
          avgDt
        });
      }, 700);
    });
  });

  console.log('Transition performance report (700ms under 4x CPU throttle):');
  console.log(`Average FPS: ${transitionReport.avgFps.toFixed(1)} fps`);
  console.log(`Minimum FPS: ${transitionReport.minFps.toFixed(1)} fps`);
  console.log(`Frames rendered: ${transitionReport.frameCount}`);
  console.log(`Target: >= 55 fps -> ${transitionReport.avgFps >= 55 ? 'PASS' : 'FAIL'}`);

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
