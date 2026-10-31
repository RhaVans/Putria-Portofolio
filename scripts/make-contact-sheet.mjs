import sharp from 'sharp';

async function makeContactSheet() {
  const beforeMobilePath = '/root/.gemini/antigravity-cli/brain/295d330d-74b7-4ee7-a3c5-b4df570343d1/images/home-mobile-390-hero.png';
  const afterMobilePath = '/root/.gemini/antigravity-cli/brain/295d330d-74b7-4ee7-a3c5-b4df570343d1/images/redesign/home-390x844.png';
  const outPath = '/root/.gemini/antigravity-cli/brain/295d330d-74b7-4ee7-a3c5-b4df570343d1/images/redesign/before-after-contact-sheet.png';

  const w = 390;
  const h = 844;

  const beforeImg = await sharp(beforeMobilePath).resize(w, h).toBuffer();
  const afterImg = await sharp(afterMobilePath).resize(w, h).toBuffer();

  const totalWidth = w * 2 + 40;
  const totalHeight = h + 80;

  const titleSvg = `
    <svg width="${totalWidth}" height="${totalHeight}">
      <rect width="100%" height="100%" fill="#0F0F26" />
      <text x="${w / 2 + 10}" y="45" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#ECB44D" text-anchor="middle">BEFORE (Failing: Name Covered)</text>
      <text x="${w + 30 + w / 2}" y="45" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#6FB8E6" text-anchor="middle">AFTER (Apple-Grade: Clean Hierarchy)</text>
    </svg>
  `;

  await sharp(Buffer.from(titleSvg))
    .composite([
      { input: beforeImg, top: 60, left: 10 },
      { input: afterImg, top: 60, left: w + 30 }
    ])
    .png()
    .toFile(outPath);

  console.log('Created before/after contact sheet:', outPath);
}

makeContactSheet().catch(console.error);
