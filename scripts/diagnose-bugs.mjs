import puppeteer from 'puppeteer-core';

const PORT = 4321;
const baseUrl = `http://localhost:${PORT}`;

const routes = [
  '/',
  '/about',
  '/work',
  '/work/leadership-camp-coordinator',
  '/work/general-treasurer-ipm',
  '/contact',
  '/404'
];

const viewports = [
  { name: 'Mobile (390x844)', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Desktop (1440x900)', width: 1440, height: 900, isMobile: false, hasTouch: false }
];

async function runDiagnostics() {
  console.log('=== STARTING DEEP DIAGNOSTIC AUDIT ===\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const findings = [];

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.name} ---`);
    const page = await browser.newPage();
    await page.setViewport(vp);

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        findings.push({ viewport: vp.name, type: 'CONSOLE_ERROR', message: msg.text() });
      }
    });

    page.on('pageerror', err => {
      findings.push({ viewport: vp.name, type: 'PAGE_ERROR', message: err.message, stack: err.stack });
    });

    page.on('requestfailed', req => {
      findings.push({ viewport: vp.name, type: 'FAILED_REQUEST', url: req.url(), failure: req.failure()?.errorText });
    });

    // Check every route
    for (const route of routes) {
      const url = `${baseUrl}${route}`;
      try {
        const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
        const status = response ? response.status() : 'NO_RESPONSE';
        if (route !== '/404' && status !== 200) {
          findings.push({ viewport: vp.name, route, type: 'HTTP_STATUS', status });
        }

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const badElements = [];
          if (docWidth > winWidth) {
            document.querySelectorAll('*').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > winWidth + 1) {
                badElements.push({ tag: el.tagName, class: el.className, right: r.right, width: r.width });
              }
            });
          }
          return { hasOverflow: docWidth > winWidth, docWidth, winWidth, badElements: badElements.slice(0, 5) };
        });

        if (overflow.hasOverflow) {
          findings.push({ viewport: vp.name, route, type: 'HORIZONTAL_OVERFLOW', details: overflow });
        }

        // Check if visible interactive links are clickable and not obscured
        const linkIssues = await page.evaluate(() => {
          const issues = [];
          const links = document.querySelectorAll('a, button');
          links.forEach(el => {
            const rect = el.getBoundingClientRect();
            // only check visible elements in the current viewport fold
            if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const topEl = document.elementFromPoint(cx, cy);
              if (topEl && topEl !== el && !el.contains(topEl)) {
                // If the top element is an inner span/svg, that is normal bubbling
                if (topEl.contains(el)) return;
                const topTag = topEl.tagName;
                const topClass = topEl.className;
                issues.push({
                  elementText: el.innerText.trim().slice(0, 30),
                  tag: el.tagName,
                  rect: { x: cx, y: cy },
                  obscuredBy: { tag: topTag, class: topClass }
                });
              }
            }
          });
          return issues;
        });

        if (linkIssues.length > 0) {
          findings.push({ viewport: vp.name, route, type: 'OBSCURED_INTERACTIVE', issues: linkIssues });
        }

      } catch (err) {
        findings.push({ viewport: vp.name, route, type: 'NAVIGATION_EXCEPTION', message: err.message });
      }
    }

    // Now test interactive actions on Home page
    console.log(`Testing interactive actions on ${vp.name}...`);
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0' });

    // Test 1: Copy Email Button
    const copyBtn = await page.$('.copy-email-btn');
    if (copyBtn) {
      try {
        await copyBtn.click();
        await new Promise(r => setTimeout(r, 600));
        const btnText = await page.evaluate(() => document.querySelector('.copy-email-btn')?.textContent);
        console.log(`Copy Email button test: text is now "${btnText?.trim()}"`);
        if (!btnText?.includes('Copied') && !btnText?.includes('pramesti')) {
          findings.push({ viewport: vp.name, type: 'COPY_BUTTON_UNEXPECTED_LABEL', label: btnText });
        }
      } catch (err) {
        findings.push({ viewport: vp.name, type: 'COPY_BUTTON_CLICK_ERROR', message: err.message });
      }
    } else {
      findings.push({ viewport: vp.name, type: 'MISSING_COPY_BUTTON' });
    }

    // Test 2: Client Router Page Navigation via UI click
    const aboutLinkSelector = vp.isMobile ? '.mobile-tabbar a[href="/about"]' : '.nav-link[href="/about"]';
    const aboutLink = await page.$(aboutLinkSelector);
    if (aboutLink) {
      try {
        await aboutLink.click();
        await new Promise(r => setTimeout(r, 800));
        const currentUrl = page.url();
        const h1Text = await page.evaluate(() => document.querySelector('h1')?.textContent);
        console.log(`Navigation to /about: url is "${currentUrl}", h1 is "${h1Text?.trim()}"`);
        if (!currentUrl.includes('/about')) {
          findings.push({ viewport: vp.name, type: 'ROUTER_TRANSITION_FAILED', url: currentUrl });
        }

        // Verify active indicator
        if (vp.isMobile) {
          const activeMobileLabel = await page.evaluate(() => document.querySelector('.tab-item.active .tab-label')?.textContent?.trim());
          console.log(`Active mobile tab on /about: "${activeMobileLabel}"`);
          if (activeMobileLabel !== 'About') {
            findings.push({ viewport: vp.name, type: 'MOBILE_TAB_ACTIVE_MISMATCH', active: activeMobileLabel });
          }
        } else {
          const activeDesktopLabel = await page.evaluate(() => document.querySelector('.nav-link.active')?.textContent?.trim());
          console.log(`Active desktop nav on /about: "${activeDesktopLabel}"`);
          if (activeDesktopLabel !== 'About') {
            findings.push({ viewport: vp.name, type: 'DESKTOP_NAV_ACTIVE_MISMATCH', active: activeDesktopLabel });
          }
        }
      } catch (err) {
        findings.push({ viewport: vp.name, type: 'ROUTER_CLICK_ERROR', message: err.message });
      }
    }

    // Test 3: Navigate to /work and click a work card
    const workLinkSelector = vp.isMobile ? '.mobile-tabbar a[href="/work"]' : '.nav-link[href="/work"]';
    const workLink = await page.$(workLinkSelector);
    if (workLink) {
      await workLink.click();
      await new Promise(r => setTimeout(r, 800));
      const firstCard = await page.$('.work-card');
      if (firstCard) {
        await firstCard.click();
        await new Promise(r => setTimeout(r, 800));
        const detailUrl = page.url();
        console.log(`Work card click navigated to: ${detailUrl}`);
        if (!detailUrl.includes('/work/')) {
          findings.push({ viewport: vp.name, type: 'WORK_CARD_NAV_FAILED', url: detailUrl });
        }

        // Check if back-link is clickable and not obscured on detail page
        const backLink = await page.$('.back-link');
        if (backLink) {
          const isObscured = await page.evaluate(() => {
            const el = document.querySelector('.back-link');
            if (!el) return true;
            const r = el.getBoundingClientRect();
            const topEl = document.elementFromPoint(r.left + 10, r.top + 10);
            return topEl && topEl !== el && !el.contains(topEl);
          });
          console.log(`Back link obscured on ${detailUrl}: ${isObscured}`);
          if (isObscured) {
            findings.push({ viewport: vp.name, type: 'DETAIL_BACK_LINK_OBSCURED', url: detailUrl });
          }
        }
      }
    }

    await page.close();
  }

  await browser.close();

  console.log('\n=== DIAGNOSTIC REPORT FINDINGS ===');
  if (findings.length === 0) {
    console.log('Zero runtime errors, zero overflows, zero obscured elements found by automated checks.');
  } else {
    console.log(JSON.stringify(findings, null, 2));
  }
}

runDiagnostics().catch(console.error);
