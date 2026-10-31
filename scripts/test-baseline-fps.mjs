import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3458;
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
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-features=ViewTransitions'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 851, deviceScaleFactor: 1 });

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });

  // Measure continuous animation smoothness
  const report = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      let start = performance.now();
      let last = start;
      const intervals = [];

      function tick(now) {
        frames++;
        intervals.push(now - last);
        last = now;
        if (now - start < 1000) {
          requestAnimationFrame(tick);
        } else {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const fps = 1000 / avgInterval;
          resolve({
            fps,
            frames,
            elapsed: now - start
          });
        }
      }
      requestAnimationFrame(tick);
    });
  });

  console.log(`Baseline animation test: ${report.fps.toFixed(1)} fps (${report.frames} frames in ${report.elapsed.toFixed(0)}ms)`);

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
