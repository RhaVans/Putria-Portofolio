// WCAG contrast calculation script (§5.1, §9)

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function blend(fg, bg, alpha) {
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha))
  };
}

function getLuminance(rgb) {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(fgRgb, bgRgb) {
  const l1 = getLuminance(fgRgb);
  const l2 = getLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function auditContrast() {
  console.log('=== WCAG 2.1 CONTRAST RATIO AUDIT (§5.1, §9) ===\n');

  const night900 = hexToRgb('#191939');
  const night700 = hexToRgb('#1B3A68');
  const sky400 = hexToRgb('#6FB8E6');
  const moon400 = hexToRgb('#ECB44D');
  const starlight200 = hexToRgb('#F2E199');
  const textPrimary = hexToRgb('#FBF6E0');
  const textMuted = blend(textPrimary, night900, 0.80);

  // Background 1: Pure night-900 base
  // Background 2: Glass card over night-900
  const glassCardBg = blend(night700, night900, 0.46);

  // Background 3: Worst-case: glass card over sky/moon orb bright spot
  const brightOrbBg = blend(sky400, night900, 0.16);
  const worstCaseGlassBg = blend(night700, brightOrbBg, 0.46);

  const testCases = [
    { label: 'Starlight-200 (Headings) on Night-900', fg: starlight200, bg: night900, req: 3.0 },
    { label: 'Starlight-200 (Headings) on Glass Card', fg: starlight200, bg: glassCardBg, req: 3.0 },
    { label: 'Starlight-200 (Headings) on Worst-Case Glass', fg: starlight200, bg: worstCaseGlassBg, req: 3.0 },
    { label: 'Body Text (#FBF6E0) on Night-900', fg: textPrimary, bg: night900, req: 4.5 },
    { label: 'Body Text (#FBF6E0) on Glass Card', fg: textPrimary, bg: glassCardBg, req: 4.5 },
    { label: 'Body Text (#FBF6E0) on Worst-Case Glass', fg: textPrimary, bg: worstCaseGlassBg, req: 4.5 },
    { label: 'Muted Text (80% opacity) on Glass Card', fg: textMuted, bg: glassCardBg, req: 4.5 },
    { label: 'Muted Text (80% opacity) on Worst-Case Glass', fg: textMuted, bg: worstCaseGlassBg, req: 4.5 },
    { label: 'Sky-400 (Links / Secondary) on Night-900', fg: sky400, bg: night900, req: 3.0 },
    { label: 'Sky-400 (Links / Secondary) on Glass Card', fg: sky400, bg: glassCardBg, req: 3.0 },
    { label: 'Moon-400 (Action Button) on Night-900', fg: moon400, bg: night900, req: 3.0 },
    { label: 'Night-900 (Text on Moon Button)', fg: night900, bg: moon400, req: 4.5 }
  ];

  const results = testCases.map((tc) => {
    const ratio = getContrastRatio(tc.fg, tc.bg);
    const pass = ratio >= tc.req;
    return {
      test: tc.label,
      ratio: `${ratio.toFixed(2)}:1`,
      required: `${tc.req.toFixed(1)}:1`,
      status: pass ? 'PASS (AAA)' : 'FAIL'
    };
  });

  console.table(results);
  const allPass = results.every(r => r.status.includes('PASS'));
  console.log(`Overall Contrast Compliance: ${allPass ? '100% PASS' : 'FAIL'}`);
}

auditContrast();
