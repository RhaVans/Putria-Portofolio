import fs from 'node:fs';
import path from 'node:path';

const fontsDir = path.resolve('public/fonts');
fs.mkdirSync(fontsDir, { recursive: true });

async function downloadFont(url, destName) {
  const destPath = path.join(fontsDir, destName);
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved ${destName}: ${(buffer.length / 1024).toFixed(1)} KB`);
  return buffer.length;
}

async function main() {
  console.log('Downloading optimized Latin woff2 fonts...');
  
  // 1. Bodoni Moda Normal 700 (Latin subset)
  const bodoniNormalUrl = 'https://fonts.gstatic.com/s/bodonimoda/v28/aFT67PxzY382XsXX63LUYL6GYFcan6NJrKp-VPjfJMShrpsGFUt8oand8Id4tA.woff2';
  
  // 2. Bodoni Moda Italic 700 (Latin subset)
  const bodoniItalicUrl = 'https://fonts.gstatic.com/s/bodonimoda/v28/aFT07PxzY382XsXX63LUYJSPUqb0pL6OQqxrZLnVbvZedvJtj-V7tIaZz8RItnDI.woff2';
  
  // 3. Instrument Sans Variable (400-700, Latin subset)
  const instrumentSansUrl = 'https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2';

  let totalBytes = 0;
  totalBytes += await downloadFont(bodoniNormalUrl, 'bodoni-moda-700-latin.woff2');
  totalBytes += await downloadFont(bodoniItalicUrl, 'bodoni-moda-italic-700-latin.woff2');
  totalBytes += await downloadFont(instrumentSansUrl, 'instrument-sans-variable-latin.woff2');

  const totalKb = (totalBytes / 1024).toFixed(1);
  console.log(`Total self-hosted fonts: ${totalKb} KB (Budget: <= 120 KB) -> ${totalBytes / 1024 <= 120 ? 'PASS' : 'FAIL'}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
