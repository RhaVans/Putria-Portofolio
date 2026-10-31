import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.resolve('dist');

function getGzipSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return zlib.gzipSync(buf).length;
}

function auditAssets() {
  console.log('=== ASSET SIZE & TRANSFER BUDGET AUDIT (§8) ===\n');

  // 1. Initial JS
  const astroFiles = fs.readdirSync(path.join(distDir, '_astro'));
  const jsFiles = astroFiles.filter(f => f.endsWith('.js'));
  let totalJsRaw = 0;
  let totalJsGzip = 0;

  for (const f of jsFiles) {
    const full = path.join(distDir, '_astro', f);
    const raw = fs.statSync(full).size;
    const gz = getGzipSize(full);
    totalJsRaw += raw;
    totalJsGzip += gz;
    console.log(`JS: ${f} — ${(raw / 1024).toFixed(1)} KB (gzip: ${(gz / 1024).toFixed(1)} KB)`);
  }
  const jsGzipKb = (totalJsGzip / 1024).toFixed(1);
  console.log(`\nTotal Initial JS (gzip): ${jsGzipKb} KB (Budget: <= 90 KB) -> ${totalJsGzip / 1024 <= 90 ? 'PASS' : 'FAIL'}`);

  // 2. Initial CSS
  const cssFiles = astroFiles.filter(f => f.endsWith('.css'));
  let totalCssRaw = 0;
  let totalCssGzip = 0;

  for (const f of cssFiles) {
    const full = path.join(distDir, '_astro', f);
    const raw = fs.statSync(full).size;
    const gz = getGzipSize(full);
    totalCssRaw += raw;
    totalCssGzip += gz;
    console.log(`CSS: ${f} — ${(raw / 1024).toFixed(1)} KB (gzip: ${(gz / 1024).toFixed(1)} KB)`);
  }
  const cssGzipKb = (totalCssGzip / 1024).toFixed(1);
  console.log(`Total Initial CSS (gzip): ${cssGzipKb} KB (Budget: <= 30 KB) -> ${totalCssGzip / 1024 <= 30 ? 'PASS' : 'FAIL'}`);

  // 3. Fonts
  const fontFiles = fs.readdirSync(path.join(distDir, 'fonts'));
  let totalFonts = 0;
  for (const f of fontFiles) {
    const full = path.join(distDir, 'fonts', f);
    const size = fs.statSync(full).size;
    totalFonts += size;
    console.log(`Font: ${f} — ${(size / 1024).toFixed(1)} KB`);
  }
  const fontsKb = (totalFonts / 1024).toFixed(1);
  console.log(`Total Fonts: ${fontsKb} KB (Budget: <= 120 KB) -> ${totalFonts / 1024 <= 120 ? 'PASS' : 'FAIL'}`);

  // 4. Hero Portrait on 390px Viewport (portrait-480.avif / webp)
  const heroAvif = fs.statSync(path.join(distDir, 'images/portrait-480.avif')).size;
  const heroWebp = fs.statSync(path.join(distDir, 'images/portrait-480.webp')).size;
  console.log(`\nHero Image 480w (AVIF): ${(heroAvif / 1024).toFixed(1)} KB (Budget: <= 90 KB) -> ${heroAvif / 1024 <= 90 ? 'PASS' : 'FAIL'}`);
  console.log(`Hero Image 480w (WebP): ${(heroWebp / 1024).toFixed(1)} KB (Budget: <= 90 KB) -> ${heroWebp / 1024 <= 90 ? 'PASS' : 'FAIL'}`);

  // 5. Total First-Load Transfer on Home
  const htmlSize = fs.statSync(path.join(distDir, 'index.html')).size;
  const htmlGzip = getGzipSize(path.join(distDir, 'index.html'));
  const firstLoadTransfer = htmlGzip + totalJsGzip + totalCssGzip + totalFonts + heroAvif;
  const transferKb = (firstLoadTransfer / 1024).toFixed(1);
  console.log(`\nEstimated First-Load Transfer (Home, Slow 4G): ${transferKb} KB (Budget: <= 500 KB) -> ${firstLoadTransfer / 1024 <= 500 ? 'PASS' : 'FAIL'}`);
}

auditAssets();
