import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3459;
const distDir = path.resolve('dist');
const outDir = path.resolve('test-artifacts/m2');
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
      console.log(`Server started on port ${PORT}`);
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

  // 1. Mobile 390 x 844
  console.log('Capturing Home at 390px (mobile)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200)); // wait for hero intro
  
  // Hero fold screenshot
  await page.screenshot({ path: path.join(outDir, 'home-mobile-390-hero.png') });
  // Full page screenshot
  await page.screenshot({ path: path.join(outDir, 'home-mobile-390-full.png'), fullPage: true });

  // 2. Desktop 1440 x 900
  console.log('Capturing Home at 1440px (desktop)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Hero fold screenshot
  await page.screenshot({ path: path.join(outDir, 'home-desktop-1440-hero.png') });
  // Full page screenshot
  await page.screenshot({ path: path.join(outDir, 'home-desktop-1440-full.png'), fullPage: true });

  console.log('M2 screenshots saved successfully.');

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
