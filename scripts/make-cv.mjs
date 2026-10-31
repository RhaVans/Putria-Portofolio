import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import site from '../src/content/site.json' with { type: 'json' };
import experience from '../src/content/experience.json' with { type: 'json' };

const outputPath = path.resolve('public/cv.pdf');

async function generateSanitizedCV() {
  console.log('Generating sanitized 1-page CV PDF...');
  
  const doc = await PDFDocument.create();
  
  // Strip metadata (§10)
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');

  // A4 size: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Colors in Starry Night inspired dark tones for print readability
  const colorPrimary = rgb(25 / 255, 25 / 255, 57 / 255);       // #191939 deep navy
  const colorAccent = rgb(27 / 255, 58 / 255, 104 / 255);       // #1B3A68 twilight blue
  const colorHighlight = rgb(190 / 255, 135 / 255, 30 / 255);    // amber gold
  const colorText = rgb(40 / 255, 40 / 255, 45 / 255);
  const colorMuted = rgb(95 / 255, 100 / 255, 115 / 255);
  const colorBorder = rgb(215 / 255, 220 / 255, 230 / 255);

  const marginX = 42;
  let cursorY = height - 42;

  // Header: Name
  page.drawText(site.name, {
    x: marginX,
    y: cursorY,
    size: 20,
    font: fontBold,
    color: colorPrimary
  });
  cursorY -= 17;

  // Header: Tagline / Professional Role
  page.drawText(site.tagline, {
    x: marginX,
    y: cursorY,
    size: 10.5,
    font: fontBold,
    color: colorAccent
  });
  cursorY -= 15;

  // Header: Contact Details (City-level and official email only §10)
  const contactText = `${site.location}   |   ${site.email}   |   Portfolio: putria.dev`;
  page.drawText(contactText, {
    x: marginX,
    y: cursorY,
    size: 9,
    font: fontRegular,
    color: colorMuted
  });
  cursorY -= 12;

  // Horizontal Rule
  page.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: width - marginX, y: cursorY },
    thickness: 1,
    color: colorBorder
  });
  cursorY -= 16;

  // Helper: Section Heading
  function drawSectionHeading(title) {
    page.drawText(title.toUpperCase(), {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: fontBold,
      color: colorAccent
    });
    cursorY -= 4;
    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: width - marginX, y: cursorY },
      thickness: 0.5,
      color: colorBorder
    });
    cursorY -= 12;
  }

  // 1. Profile / Summary
  drawSectionHeading('Profile');
  const summaryLines = [
    'Student at SMA Muhammadiyah Gombong (Class of 2026) with practical competencies in organizational financial',
    'administration, event scheduling, logistical risk planning, and curriculum editorial layout. Demonstrates structured',
    'problem-solving and reliable execution across multidisciplinary academic and student initiatives.'
  ];
  for (const line of summaryLines) {
    page.drawText(line, {
      x: marginX,
      y: cursorY,
      size: 8.5,
      font: fontRegular,
      color: colorText
    });
    cursorY -= 11.5;
  }
  cursorY -= 8;

  // 2. Experience (Newest first §3)
  drawSectionHeading('Experience & Leadership');

  for (const exp of experience) {
    // Role + Organization
    page.drawText(exp.role, {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: fontBold,
      color: colorPrimary
    });

    // Date on right margin
    const dateWidth = fontBold.widthOfTextAtSize(exp.period, 8.5);
    page.drawText(exp.period, {
      x: width - marginX - dateWidth,
      y: cursorY,
      size: 8.5,
      font: fontBold,
      color: colorAccent
    });
    cursorY -= 12;

    // Organization & Tagline
    page.drawText(`${exp.organization} — ${exp.orgType}`, {
      x: marginX,
      y: cursorY,
      size: 8.5,
      font: fontOblique,
      color: colorMuted
    });
    cursorY -= 12;

    // Bullets
    for (const bullet of exp.bullets) {
      page.drawText('•', {
        x: marginX + 4,
        y: cursorY,
        size: 8,
        font: fontBold,
        color: colorHighlight
      });
      page.drawText(bullet, {
        x: marginX + 14,
        y: cursorY,
        size: 8.5,
        font: fontRegular,
        color: colorText
      });
      cursorY -= 11.5;
    }
    cursorY -= 4;
  }

  cursorY -= 4;

  // 3. Education
  drawSectionHeading('Education');
  page.drawText(site.education.institution, {
    x: marginX,
    y: cursorY,
    size: 9.5,
    font: fontBold,
    color: colorPrimary
  });
  const eduPeriodWidth = fontBold.widthOfTextAtSize(site.education.period, 8.5);
  page.drawText(site.education.period, {
    x: width - marginX - eduPeriodWidth,
    y: cursorY,
    size: 8.5,
    font: fontBold,
    color: colorAccent
  });
  cursorY -= 12;

  page.drawText(`${site.education.track} (${site.education.eqfLevel}) — ${site.education.cohort}`, {
    x: marginX,
    y: cursorY,
    size: 8.5,
    font: fontRegular,
    color: colorText
  });
  cursorY -= 18;

  // 4. Skills & Languages
  drawSectionHeading('Languages & Core Competencies');

  // Languages
  page.drawText('Languages:', {
    x: marginX,
    y: cursorY,
    size: 8.5,
    font: fontBold,
    color: colorAccent
  });
  page.drawText('Javanese (Native / Mother tongue)   |   English: CEFR B1/B2 (Listening B1, Reading B2, Speaking B1, Writing B1)', {
    x: marginX + 65,
    y: cursorY,
    size: 8.5,
    font: fontRegular,
    color: colorText
  });
  cursorY -= 14;

  // Skills
  page.drawText('Competencies:', {
    x: marginX,
    y: cursorY,
    size: 8.5,
    font: fontBold,
    color: colorAccent
  });
  page.drawText(site.skills.join('   •   '), {
    x: marginX + 75,
    y: cursorY,
    size: 8.5,
    font: fontRegular,
    color: colorText
  });
  cursorY -= 20;

  // Privacy verification footer note
  page.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: width - marginX, y: cursorY },
    thickness: 0.5,
    color: colorBorder
  });
  cursorY -= 10;

  const note = 'This document is an authorized, sanitized factual curriculum vitae summary. Official correspondence: pramestiputria03@gmail.com';
  page.drawText(note, {
    x: marginX,
    y: cursorY,
    size: 7.5,
    font: fontRegular,
    color: colorMuted
  });

  console.log(`Final Y cursor: ${cursorY.toFixed(1)} (Bottom margin: 42 points) -> ${cursorY >= 30 ? 'FITS ON 1 PAGE (PASS)' : 'OVERFLOWS 1 PAGE (FAIL)'}`);

  const pdfBytes = await doc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`Saved sanitized CV to ${outputPath}: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
}

generateSanitizedCV().catch(err => {
  console.error(err);
  process.exit(1);
});
