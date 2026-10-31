import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3460;
const distDir = path.resolve('dist');
const outDir = path.resolve('test-artifacts/m3');
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
      console.log(`M3 test server running on port ${PORT}`);
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

  const pagesToTest = [
    { url: '/about', name: 'about' },
    { url: '/work', name: 'work' },
    { url: '/work/leadership-camp-coordinator', name: 'work-detail' },
    { url: '/contact', name: 'contact' },
    { url: '/404', name: '404' }
  ];

  for (const item of pagesToTest) {
    // Mobile 390px
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${PORT}${item.url}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    const mobilePath = path.join(outDir, `${item.name}-mobile-390.png`);
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`Captured ${item.name} mobile:`, mobilePath);

    // Desktop 1440px
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(`http://localhost:${PORT}${item.url}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 400));
    const desktopPath = path.join(outDir, `${item.name}-desktop-1440.png`);
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`Captured ${item.name} desktop:`, desktopPath);
  }

  await browser.close();
  server.close();
  console.log('M3 verification screenshots completed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
