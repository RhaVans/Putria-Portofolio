import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const PORT = 3464;
const distDir = path.resolve('dist');
const outDir = path.resolve('test-artifacts/m5');
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
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
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
      console.log(`Lighthouse test server listening on port ${PORT}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer();

  // First, measure real in-browser Core Web Vitals via Puppeteer PerformanceObserver
  console.log('Measuring Core Web Vitals via Puppeteer on mobile viewport (390x844)...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const cdp = await page.target().createCDPSession();
  await cdp.send('Performance.enable');

  const navPromise = page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
  await navPromise;

  // Collect PerformanceObserver metrics from browser runtime
  const cwv = await page.evaluate(() => {
    return new Promise((resolve) => {
      let lcp = 0;
      let cls = 0;

      const lcpObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          lcp = entry.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      setTimeout(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
        const navEntries = performance.getEntriesByType('navigation');
        const nav = navEntries[0] || {};

        resolve({
          fcp: fcpEntry ? fcpEntry.startTime : 0,
          lcp,
          cls,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadTime: nav.loadEventEnd - nav.startTime
        });
      }, 1000);
    });
  });

  const perfMetrics = await cdp.send('Performance.getMetrics');
  const metricsMap = Object.fromEntries(perfMetrics.metrics.map(m => [m.name, m.value]));
  const taskDuration = metricsMap.TaskDuration || 0;
  const scriptDuration = metricsMap.ScriptDuration || 0;
  const layoutDuration = metricsMap.LayoutDuration || 0;
  const recalStyleDuration = metricsMap.RecalcStyleDuration || 0;

  await browser.close();
  server.close();

  console.log('\n==================================================');
  console.log('       IN-BROWSER CORE WEB VITALS AUDIT (§8)     ');
  console.log('==================================================');
  console.log(`FCP (First Contentful Paint):    ${Math.round(cwv.fcp)} ms  (<= 1800 ms) -> ${cwv.fcp <= 1800 ? 'PASS' : 'WARN'}`);
  console.log(`LCP (Largest Contentful Paint):  ${Math.round(cwv.lcp)} ms  (<= 2500 ms) -> ${cwv.lcp <= 2500 ? 'PASS' : 'WARN'}`);
  console.log(`CLS (Cumulative Layout Shift):   ${cwv.cls.toFixed(4)}      (<= 0.05)    -> ${cwv.cls <= 0.05 ? 'PASS' : 'WARN'}`);
  console.log(`DOM Content Loaded:              ${Math.round(cwv.domContentLoaded)} ms`);
  console.log(`Page Load Complete:              ${Math.round(cwv.loadTime)} ms`);
  console.log(`Total Script Duration:           ${Math.round(scriptDuration * 1000)} ms`);
  console.log(`Total Layout Duration:           ${Math.round(layoutDuration * 1000)} ms`);
  console.log(`Total Style Recalc Duration:     ${Math.round(recalStyleDuration * 1000)} ms`);
  console.log('==================================================\n');

  // Write structured JSON report
  const report = {
    timestamp: new Date().toISOString(),
    metrics: {
      fcpMs: Math.round(cwv.fcp),
      lcpMs: Math.round(cwv.lcp),
      cls: Number(cwv.cls.toFixed(4)),
      domContentLoadedMs: Math.round(cwv.domContentLoaded),
      loadTimeMs: Math.round(cwv.loadTime),
      scriptDurationMs: Math.round(scriptDuration * 1000),
      layoutDurationMs: Math.round(layoutDuration * 1000)
    },
    budgets: {
      lcpTarget: '<= 2.5s (2500ms)',
      clsTarget: '<= 0.05',
      tbtTarget: '<= 150ms'
    },
    status: {
      lcpPass: cwv.lcp <= 2500,
      clsPass: cwv.cls <= 0.05,
      fcpPass: cwv.fcp <= 1800
    }
  };

  fs.writeFileSync(path.join(outDir, 'web-vitals-report.json'), JSON.stringify(report, null, 2));
  console.log('Saved Web Vitals audit to test-artifacts/m5/web-vitals-report.json');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
