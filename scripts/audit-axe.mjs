import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const PORT = 3462;
const distDir = path.resolve('dist');
const axeSource = fs.readFileSync(path.resolve('node_modules/axe-core/axe.min.js'), 'utf8');

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
  await page.setViewport({ width: 390, height: 844 });

  const routes = [
    '/',
    '/about',
    '/work',
    '/work/leadership-camp-coordinator',
    '/contact',
    '/404'
  ];

  console.log('=== AXE ACCESSIBILITY AUDIT (§9) ===\n');
  let totalViolations = 0;
  const reportRows = [];

  for (const route of routes) {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0' });
    await page.evaluate(axeSource);

    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      });
    });

    const criticalOrSerious = results.violations.filter(v => ['critical', 'serious'].includes(v.impact));
    totalViolations += criticalOrSerious.length;

    reportRows.push({
      route,
      passes: results.passes.length,
      violations: results.violations.length,
      criticalOrSerious: criticalOrSerious.length,
      status: criticalOrSerious.length === 0 ? 'PASS (0 critical/serious)' : 'FAIL'
    });

    if (criticalOrSerious.length > 0) {
      console.error(`Issues on ${route}:`, JSON.stringify(criticalOrSerious, null, 2));
    }
  }

  console.table(reportRows);
  console.log(`\nTotal Critical & Serious Accessibility Violations: ${totalViolations} (Target: 0) -> ${totalViolations === 0 ? 'PASS' : 'FAIL'}`);

  await browser.close();
  server.close();

  if (totalViolations > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
