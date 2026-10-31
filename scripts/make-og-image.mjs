import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve('public/images');
const portraitPath = path.resolve('public/images/portrait-800.png') || path.resolve('public/images/portrait-480.png');

async function makeOgImage() {
  console.log('Generating Open Graph social card (1200x630)...');

  const width = 1200;
  const height = 630;

  // Background SVG with Starry Night tokens
  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="75%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#ECB44D" stop-opacity="0.32" />
          <stop offset="50%" stop-color="#6FB8E6" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#191939" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F2E199" />
          <stop offset="100%" stop-color="#ECB44D" />
        </linearGradient>
      </defs>

      <!-- Midnight base -->
      <rect width="100%" height="100%" fill="#191939" />
      <rect width="100%" height="100%" fill="url(#bgGlow)" />

      <!-- Crescent arc -->
      <path d="M 880 80 A 180 180 0 0 1 1060 260 A 180 180 0 0 1 880 440 A 160 160 0 0 0 880 80 Z"
            fill="none" stroke="url(#goldText)" stroke-width="2" stroke-linecap="round" opacity="0.6" />

      <!-- Sparkle stars -->
      <circle cx="200" cy="120" r="3" fill="#F2E199" opacity="0.6" />
      <circle cx="540" cy="90" r="2.5" fill="#6FB8E6" opacity="0.7" />
      <circle cx="480" cy="520" r="3" fill="#ECB44D" opacity="0.5" />
      <circle cx="1100" cy="140" r="3.5" fill="#F2E199" opacity="0.8" />

      <!-- Glass Panel on Left -->
      <rect x="70" y="80" width="580" height="470" rx="24"
            fill="#1B3A68" fill-opacity="0.45"
            stroke="#F2E199" stroke-width="1.5" stroke-opacity="0.22" />

      <!-- Monogram -->
      <rect x="110" y="125" width="46" height="46" rx="10"
            fill="#1B3A68" fill-opacity="0.8" stroke="#F2E199" stroke-width="1" stroke-opacity="0.3" />
      <text x="133" y="156" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#ECB44D" text-anchor="middle">PO</text>

      <!-- Text content -->
      <text x="172" y="155" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#F2E199" letter-spacing="1">PUTRIA OCTAVIANTY</text>
      
      <text x="110" y="245" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#F2E199" letter-spacing="-0.5">Portfolio &amp;</text>
      <text x="110" y="300" font-family="Georgia, serif" font-size="44" font-weight="bold" fill="#ECB44D" letter-spacing="-0.5">Initiatives</text>

      <text x="110" y="375" font-family="Arial, sans-serif" font-size="20" fill="#FBF6E0" opacity="0.9">Event coordinator, editor and student leader.</text>
      <text x="110" y="415" font-family="Arial, sans-serif" font-size="16" fill="#6FB8E6">Based in Kebumen, Indonesia &#8226; Class of 2026</text>

      <!-- Pill badges -->
      <rect x="110" y="465" width="130" height="34" rx="17" fill="#1B3A68" fill-opacity="0.6" stroke="#F2E199" stroke-width="1" stroke-opacity="0.2" />
      <text x="175" y="487" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#F2E199" text-anchor="middle">4 Documented Roles</text>

      <rect x="250" y="465" width="140" height="34" rx="17" fill="#1B3A68" fill-opacity="0.6" stroke="#6FB8E6" stroke-width="1" stroke-opacity="0.25" />
      <text x="320" y="487" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#6FB8E6" text-anchor="middle">Bilingual (JV / EN)</text>
    </svg>
  `);

  // Resize portrait to fit right half (e.g. 520w)
  const portraitBuf = await sharp('public/images/portrait-480.png')
    .resize(520, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const ogCard = await sharp(svgOverlay)
    .composite([
      {
        input: portraitBuf,
        left: 680,
        top: 130
      }
    ])
    .png({ quality: 90 })
    .toFile(path.join(outputDir, 'og-image.png'));

  console.log(`Generated og-image.png: ${(ogCard.size / 1024).toFixed(1)} KB`);
}

makeOgImage().catch(err => {
  console.error(err);
  process.exit(1);
});
