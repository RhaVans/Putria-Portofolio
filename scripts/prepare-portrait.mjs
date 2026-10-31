import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const inputPath = path.resolve('_private/20261031_121131_0000.png');
const outputDir = path.resolve('public/images');

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found at ${inputPath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

async function processPortrait() {
  console.log('Loading input portrait...');
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Bounding box: x 182-1491, y 791-2048
  // +4% padding
  const paddingX = Math.round((1491 - 182) * 0.04 * 0.5); // ~26px
  const paddingTop = Math.round((2048 - 791) * 0.04);     // ~50px

  const cropLeft = Math.max(0, 182 - paddingX);
  const cropTop = Math.max(0, 791 - paddingTop);
  const cropRight = Math.min(metadata.width, 1491 + paddingX);
  const cropBottom = metadata.height; // anchored to bottom

  const cropWidth = cropRight - cropLeft;
  const cropHeight = cropBottom - cropTop;

  console.log(`Cropping to: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}`);

  const cropped = sharp(inputPath)
    .extract({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight
    })
    .withMetadata(false); // strip EXIF

  const widths = [480, 800, 1200];
  const results = [];

  for (const width of widths) {
    const height = Math.round((cropHeight / cropWidth) * width);

    // Export AVIF
    const avifFileName = `portrait-${width}.avif`;
    const avifPath = path.join(outputDir, avifFileName);
    const avifInfo = await cropped
      .clone()
      .resize(width, height)
      .avif({ quality: 80, effort: 6 })
      .toFile(avifPath);

    results.push({
      file: avifFileName,
      format: 'avif',
      width,
      height,
      sizeKb: (avifInfo.size / 1024).toFixed(1)
    });

    // Export WebP
    const webpFileName = `portrait-${width}.webp`;
    const webpPath = path.join(outputDir, webpFileName);
    const webpInfo = await cropped
      .clone()
      .resize(width, height)
      .webp({ quality: 85, effort: 6 })
      .toFile(webpPath);

    results.push({
      file: webpFileName,
      format: 'webp',
      width,
      height,
      sizeKb: (webpInfo.size / 1024).toFixed(1)
    });
  }

  // Also export a fallback 480w PNG
  const png480Path = path.join(outputDir, 'portrait-480.png');
  const pngInfo = await cropped
    .clone()
    .resize(480, Math.round((cropHeight / cropWidth) * 480))
    .png({ compressionLevel: 9 })
    .toFile(png480Path);

  results.push({
    file: 'portrait-480.png',
    format: 'png',
    width: 480,
    height: Math.round((cropHeight / cropWidth) * 480),
    sizeKb: (pngInfo.size / 1024).toFixed(1)
  });

  console.table(results);

  // Check 390px hero budget (<= 90 KB)
  const heroAvif = results.find(r => r.file === 'portrait-480.avif');
  const heroWebp = results.find(r => r.file === 'portrait-480.webp');
  console.log(`Hero 480w AVIF: ${heroAvif.sizeKb} KB (Budget: <= 90 KB) -> ${parseFloat(heroAvif.sizeKb) <= 90 ? 'PASS' : 'FAIL'}`);
  console.log(`Hero 480w WebP: ${heroWebp.sizeKb} KB (Budget: <= 90 KB) -> ${parseFloat(heroWebp.sizeKb) <= 90 ? 'PASS' : 'FAIL'}`);
}

processPortrait().catch(err => {
  console.error(err);
  process.exit(1);
});
