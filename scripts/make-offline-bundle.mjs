import fs from 'fs';
import path from 'path';

const SRC_DIR = '/root/projects/PUT/dist';
const DEST_DIR = '/storage/emulated/0/WEB';

function getRelativePrefix(depth) {
  if (depth === 0) return './';
  return '../'.repeat(depth);
}

function processHtmlFile(filePath, depth) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const rel = getRelativePrefix(depth);

  // Fix srcset: convert any /images/... inside srcset strings
  content = content.replace(/srcset="([^"]*)"/g, (match, val) => {
    const updated = val.split(',').map(entry => {
      const trimmed = entry.trim();
      if (trimmed.startsWith('/images/')) {
        return `${rel}${trimmed.slice(1)}`;
      }
      return entry;
    }).join(', ');
    return `srcset="${updated}"`;
  });

  // Replace single root-relative attributes
  content = content.replace(/(href|src|poster)="\/(?!_)([^"]*)"/g, (match, attr, val) => {
    if (val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('tel:') || val.startsWith('#')) {
      return match;
    }
    return `${attr}="${rel}${val}"`;
  });

  // Replace _astro assets
  content = content.replace(/(href|src)="\/\_astro\/([^"]*)"/g, (match, attr, val) => {
    return `${attr}="${rel}_astro/${val}"`;
  });

  // Replace fonts and images
  content = content.replace(/(href|src)="\/(fonts|images)\/([^"]*)"/g, (match, attr, dir, val) => {
    return `${attr}="${rel}${dir}/${val}"`;
  });

  // Fix internal route links for file:// and standard static hosting
  content = content.replace(/href="\/about"/g, `href="${rel}about/index.html"`);
  content = content.replace(/href="\/work"/g, `href="${rel}work/index.html"`);
  content = content.replace(/href="\/contact"/g, `href="${rel}contact/index.html"`);
  content = content.replace(/href="\/"/g, `href="${rel}index.html"`);
  content = content.replace(/href="\/work\/([^"#\s]+)"/g, `href="${rel}work/$1/index.html"`);
  content = content.replace(/href="\/cv\.pdf"/g, `href="${rel}cv.pdf"`);

  fs.writeFileSync(filePath, content, 'utf-8');
}

function processCssFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  // In dist/_astro/xxx.css, fonts is located at ../fonts/
  content = content.replace(/url\(\s*['"]?\/fonts\/([^'")]+)['"]?\s*\)/g, 'url("../fonts/$1")');
  content = content.replace(/url\(\s*['"]?\/images\/([^'")]+)['"]?\s*\)/g, 'url("../images/$1")');
  fs.writeFileSync(filePath, content, 'utf-8');
}

function copyAndFixDir(src, dest, baseDest, depth = 0) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyAndFixDir(srcPath, destPath, baseDest, depth + 1);
    } else {
      fs.copyFileSync(srcPath, destPath);
      if (entry.name.endsWith('.html')) {
        processHtmlFile(destPath, depth);
      } else if (entry.name.endsWith('.css')) {
        processCssFile(destPath);
      }
    }
  }
}

export function syncOfflineBundle() {
  console.log(`Syncing dist from ${SRC_DIR} to ${DEST_DIR} with offline relative paths...`);
  copyAndFixDir(SRC_DIR, DEST_DIR, DEST_DIR, 0);
  console.log('Sync complete! All HTML & CSS files converted for offline file:// and HTTP usage.');
}

if (process.argv[1] && process.argv[1].endsWith('make-offline-bundle.mjs')) {
  syncOfflineBundle();
}
