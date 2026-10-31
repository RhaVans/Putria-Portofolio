import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const outputDir = path.resolve('test-artifacts/m0');
fs.mkdirSync(outputDir, { recursive: true });

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portrait Silhouette Test</title>
<style>
  :root {
    --night-900: #191939;
    --night-700: #1B3A68;
    --sky-400: #6FB8E6;
    --moon-400: #ECB44D;
    --starlight-200: #F2E199;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--night-900);
    color: #FBF6E0;
    font-family: system-ui, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
    position: relative;
  }

  /* Starry background ambient */
  .bg-ambient {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 75% 25%, rgb(111 184 230 / .15), transparent 45%),
                radial-gradient(circle at 20% 80%, rgb(236 180 77 / .12), transparent 50%),
                var(--night-900);
    z-index: 0;
  }

  .hero-container {
    position: relative;
    width: 100%;
    max-width: 1440px;
    height: 100vh;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1;
  }

  /* Huge name behind portrait */
  .hero-name {
    position: absolute;
    bottom: 12%;
    left: 5%;
    font-family: serif;
    font-size: clamp(3.5rem, 11vw, 11rem);
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -0.03em;
    color: var(--starlight-200);
    opacity: 0.85;
    z-index: 1;
    pointer-events: none;
    user-select: none;
  }

  /* Portrait wrapper anchored to bottom */
  .portrait-wrapper {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    width: 100%;
    max-width: 620px;
  }

  /* Warm radial glow + cool sky halo behind head & shoulders */
  .portrait-glow {
    position: absolute;
    top: 5%;
    left: 50%;
    transform: translateX(-50%);
    width: 380px;
    height: 380px;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(236 180 77 / .38) 0%, rgb(111 184 230 / .28) 45%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  /* Crescent moon arc behind her */
  .crescent-arc {
    position: absolute;
    top: 2%;
    left: 50%;
    transform: translateX(-50%);
    width: 340px;
    height: 340px;
    pointer-events: none;
    z-index: 1;
  }

  .portrait-img {
    position: relative;
    z-index: 2;
    display: block;
    width: 100%;
    max-width: 520px;
    height: auto;
    object-fit: contain;
    /* Bottom fade */
    mask-image: linear-gradient(to top, transparent 0%, black 10%);
    -webkit-mask-image: linear-gradient(to top, transparent 0%, black 10%);
  }

  @media (min-width: 1024px) {
    .portrait-wrapper {
      position: absolute;
      right: 8%;
      bottom: 0;
      max-width: 620px;
    }
    .portrait-img {
      filter: drop-shadow(0 0 1px rgb(242 225 153 / .45));
    }
    .portrait-glow {
      width: 520px;
      height: 520px;
      top: 0;
    }
    .crescent-arc {
      width: 480px;
      height: 480px;
      top: -20px;
    }
  }

  /* Bottom status banner for test */
  .status-badge {
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 10;
    background: rgba(27, 58, 104, 0.7);
    border: 1px solid rgba(242, 225, 153, 0.3);
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 13px;
    letter-spacing: 0.05em;
    backdrop-filter: blur(8px);
  }
</style>
</head>
<body>
<div class="bg-ambient"></div>
<div class="status-badge">SILHOUETTE SEPARATION VERIFICATION</div>

<div class="hero-container">
  <div class="hero-name">
    Putria<br>Octavianty
  </div>

  <div class="portrait-wrapper">
    <div class="portrait-glow"></div>
    <svg class="crescent-arc" viewBox="0 0 200 200" fill="none">
      <path d="M 100 20 A 80 80 0 0 1 180 100 A 80 80 0 0 1 100 180 A 72 72 0 0 0 100 20 Z" 
            fill="none" 
            stroke="url(#moonGrad)" 
            stroke-width="1.5" 
            stroke-linecap="round"
            opacity="0.75" />
      <defs>
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F2E199" />
          <stop offset="100%" stop-color="#ECB44D" />
        </linearGradient>
      </defs>
    </svg>
    <picture>
      <source srcset="/public/images/portrait-800.avif" type="image/avif">
      <source srcset="/public/images/portrait-800.webp" type="image/webp">
      <img class="portrait-img" src="/public/images/portrait-480.png" alt="Portrait of Putria Octavianty">
    </picture>
  </div>
</div>
</body>
</html>
`;

const htmlFilePath = path.resolve('test-artifacts/m0/mock.html');
fs.writeFileSync(htmlFilePath, htmlContent);

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  // Need to serve images or resolve local paths
  // Let's replace `/public/images/` with absolute file:// path
  const absoluteHtml = htmlContent.replace(/\/public\/images\//g, 'file://' + path.resolve('public/images') + '/');
  fs.writeFileSync(htmlFilePath, absoluteHtml);

  // 1. Mobile 390px
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlFilePath, { waitUntil: 'networkidle0' });
  const shot390 = path.join(outputDir, 'scarf-silhouette-390.png');
  await page.screenshot({ path: shot390 });
  console.log('Saved 390px silhouette test screenshot:', shot390);

  // 2. Desktop 1440px
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlFilePath, { waitUntil: 'networkidle0' });
  const shot1440 = path.join(outputDir, 'scarf-silhouette-1440.png');
  await page.screenshot({ path: shot1440 });
  console.log('Saved 1440px silhouette test screenshot:', shot1440);

  await browser.close();
  console.log('M0 Silhouette tests completed successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
