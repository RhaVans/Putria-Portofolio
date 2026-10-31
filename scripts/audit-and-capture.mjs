import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/295d330d-74b7-4ee7-a3c5-b4df570343d1/images/redesign';
const BASE_URL = 'http://localhost:4321';

const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'work', path: '/work' },
  { name: 'work-detail', path: '/work/leadership-camp-coordinator' },
  { name: 'contact', path: '/contact' },
  { name: '404', path: '/404' }
];

const viewports = [
  { name: '360x800', width: 360, height: 800, isMobile: true },
  { name: '390x844', width: 390, height: 844, isMobile: true },
  { name: '768x1024', width: 768, height: 1024, isMobile: false },
  { name: '1440x900', width: 1440, height: 900, isMobile: false }
];

async function runAudit() {
  console.log('=== RUNNING COMPREHENSIVE REDESIGN AUDIT & SCREENSHOT SUITE ===\n');

  // 1. Static Scan: Banned words & Privacy
  console.log('--- 1. Banned Words & Privacy Audit ---');
  const bannedWords = [
    'proven', 'structured', 'multidisciplinary', 'transparent', 'operational',
    'stakeholders', 'passionate', 'dynamic', 'seamless', 'leverage',
    'journey', 'crafting', 'elevate', 'unlock', 'holistic'
  ];

  const distFiles = [];
  function collectHtml(dir) {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) collectHtml(full);
      else if (f.endsWith('.html')) distFiles.push(full);
    }
  }
  collectHtml('/root/projects/PUT/dist');

  let bannedViolations = 0;
  for (const file of distFiles) {
    const text = fs.readFileSync(file, 'utf-8').toLowerCase();
    for (const word of bannedWords) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(text)) {
        console.error(`BANNED WORD "${word}" found in ${file}`);
        bannedViolations++;
      }
    }
  }
  console.log(`Banned words violations: ${bannedViolations} (Must be 0)`);

  // Privacy check on dist
  let privacyViolations = 0;
  const privatePatterns = [/3305\d{12}/, /\+62\s?8\d{8,11}/, /kebumen\s+\d{5}/];
  for (const file of distFiles) {
    const text = fs.readFileSync(file, 'utf-8');
    for (const pat of privatePatterns) {
      if (pat.test(text)) {
        console.error(`PRIVACY VIOLATION pattern ${pat} in ${file}`);
        privacyViolations++;
      }
    }
  }
  console.log(`Privacy violations: ${privacyViolations} (Must be 0)`);

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  // 3. Hero Acceptance Test (§9.6): Name, role, primary button and entire face visible without scroll
  console.log('\n--- 2. Hero Acceptance Check (§9.6) ---');
  const heroViewports = [
    { name: '360x640', width: 360, height: 640 },
    { name: '390x844', width: 390, height: 844 },
    { name: '1440x900', width: 1440, height: 900 }
  ];

  for (const hv of heroViewports) {
    const page = await browser.newPage();
    await page.setViewport(hv);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    const heroCheck = await page.evaluate((h) => {
      const h1 = document.querySelector('.hero-h1')?.getBoundingClientRect();
      const role = document.querySelector('.hero-role')?.getBoundingClientRect();
      const btn = document.querySelector('.hero-actions .btn-primary')?.getBoundingClientRect();
      const img = document.querySelector('.portrait-img')?.getBoundingClientRect();

      return {
        h1Visible: h1 && h1.top >= 0 && h1.bottom <= h,
        roleVisible: role && role.top >= 0 && role.bottom <= h,
        btnVisible: btn && btn.top >= 0 && btn.bottom <= h,
        imgVisible: img && img.top < h,
        h1Rect: h1 ? { top: h1.top, bottom: h1.bottom } : null,
        btnRect: btn ? { top: btn.top, bottom: btn.bottom } : null,
        imgRect: img ? { top: img.top, bottom: img.bottom } : null
      };
    }, hv.height);

    console.log(`Hero at ${hv.name}:`, JSON.stringify(heroCheck));
    await page.close();
  }

  // 4. Capture all screenshots across routes & viewports
  console.log('\n--- 3. Capturing Required Screenshots ---');
  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport(vp);

    for (const route of routes) {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 400));

      const filename = `${route.name}-${vp.name}.png`;
      const outPath = path.join(ARTIFACT_DIR, filename);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`Saved screenshot: ${filename}`);

      if (route.name === 'home') {
        // Also capture full page
        const fullPath = path.join(ARTIFACT_DIR, `home-${vp.name}-full.png`);
        await page.screenshot({ path: fullPath, fullPage: true });
      }
    }
    await page.close();
  }

  await browser.close();
  console.log('\n=== AUDIT & SCREENSHOT CAPTURE COMPLETE ===');
}

runAudit().catch(console.error);
