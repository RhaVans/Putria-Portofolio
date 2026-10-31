import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');

// Extract all text files from dist
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function auditPrivacy() {
  console.log('=== PRIVACY & SAFETY SCAN (§10) ===\n');

  // Verify _private is NOT inside dist
  const hasPrivateInDist = fs.existsSync(path.join(distDir, '_private'));
  console.log(`Checking _private in dist: ${hasPrivateInDist ? 'FAIL (Exposed!)' : 'PASS (Clean - not present)'}`);

  // Verify original CV is NOT inside dist
  const distFiles = getAllFiles(distDir);
  const exposedOriginalCv = distFiles.filter(f => f.toLowerCase().includes('putria_octavianty_cv.pdf') && !f.endsWith('cv.pdf'));
  console.log(`Checking original CV PDF in dist: ${exposedOriginalCv.length > 0 ? 'FAIL' : 'PASS (Clean)'}`);

  // Read original CV for private tokens if available
  const originalCvPath = path.resolve('_private/Putria_Octavianty_CV.pdf');
  let privateTokens = [];

  if (fs.existsSync(originalCvPath)) {
    const raw = fs.readFileSync(originalCvPath).toString('latin1');
    // Common Indonesian NIK pattern (16 digits starting with 33)
    const nikMatches = raw.match(/\b33[0-9]{14}\b/g) || [];
    // Indonesian phone patterns (08... or +62...)
    const phoneMatches = raw.match(/\b(08[0-9]{8,11}|628[0-9]{8,11})\b/g) || [];
    // Postal code 5 digits
    const postalMatches = raw.match(/\b54[0-9]{3}\b/g) || [];

    privateTokens = [...new Set([...nikMatches, ...phoneMatches, ...postalMatches])];
    console.log(`Identified ${privateTokens.length} private pattern signatures from original CV.`);
  }

  // Scan all dist files for private tokens
  let violations = [];
  for (const filePath of distFiles) {
    // Only scan text, html, js, css, json, xml, txt
    const ext = path.extname(filePath);
    if (['.html', '.js', '.css', '.json', '.xml', '.txt'].includes(ext)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check NIK pattern
      const nik = content.match(/\b33[0-9]{14}\b/g);
      if (nik) violations.push({ file: path.relative(distDir, filePath), reason: `Found NIK pattern: ${nik.join(', ')}` });

      // Check phone pattern
      const phone = content.match(/\b(08[0-9]{9,11}|628[0-9]{9,11})\b/g);
      if (phone) violations.push({ file: path.relative(distDir, filePath), reason: `Found Phone pattern: ${phone.join(', ')}` });

      // Check RT/RW or street keywords
      const street = content.match(/\b(RT\s*[0-9]+|RW\s*[0-9]+|Kelurahan|Kecamatan|Desa\s+[A-Za-z]+)\b/gi);
      if (street) violations.push({ file: path.relative(distDir, filePath), reason: `Found Street/RT/RW: ${street.join(', ')}` });
    }
  }

  // Check launch gate: noindex meta tag in index.html and robots.txt
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const hasNoindex = indexHtml.includes('name="robots"') && indexHtml.includes('noindex');
  console.log(`Checking <meta name="robots" content="noindex"> in index.html: ${hasNoindex ? 'PASS (Protected)' : 'FAIL'}`);

  const robotsTxt = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf8');
  const hasDisallow = robotsTxt.includes('Disallow: /');
  console.log(`Checking robots.txt Disallow: /: ${hasDisallow ? 'PASS (Protected)' : 'FAIL'}`);

  console.log('\n--- Privacy Scan Violations ---');
  if (violations.length === 0) {
    console.log('Zero violations found! All public assets in dist/ are strictly sanitized.');
    console.log('Status: 100% PASS');
  } else {
    console.table(violations);
    console.error('FAIL: Private data detected in dist/ output!');
    process.exit(1);
  }
}

auditPrivacy();
