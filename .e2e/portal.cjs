/* Drives the real portal in Chromium. Not a unit test — it clicks the app. */
const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'http://localhost:5175/';
const SHOTS = '.e2e/shots';
const results = [];
const errors = []; // console.error + uncaught exceptions, collected for the whole run

const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  const toasts = page.locator('button[aria-label="Dismiss notification"]');
  const dialog = page.locator('[role="alertdialog"]');

  await page.goto(URL, { waitUntil: 'networkidle' });

  /* ---------------------------------------------------------------- 1. boot */
  await page.waitForSelector('#identifier', { timeout: 15000 });
  check('Login screen renders', true);

  // The regression guard for the bug that shipped: a truthy `confirm` function
  // made ConfirmDialog render an invisible full-screen scrim over everything.
  check('No stray dialog/scrim on load', (await dialog.count()) === 0);
  const clickable = await page
    .locator('#identifier')
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el.contains(top) || el === top;
    });
  check('Login input is not covered by an overlay', clickable);
  await page.screenshot({ path: `${SHOTS}/01-login.png` });

  /* ------------------------------------------------- 2. failed sign-in state */
  await page.fill('#identifier', 'demo@kitluy.local');
  await page.fill('#password', 'WrongPassword1!');
  await page.click('button[type="submit"]');
  const formError = page.locator('[role="alert"]').first();
  await formError.waitFor({ timeout: 8000 });
  check('Bad password surfaces an inline Alert', await formError.isVisible());
  await page.screenshot({ path: `${SHOTS}/02-signin-error.png` });

  /* ------------------------------------------------------- 3. sign in for real */
  await page.fill('#password', 'KitLuy123!');
  const submit = page.locator('button[type="submit"]');

  // Local sign-in resolves in a few ms and then unmounts the whole login form,
  // so sampling the button after the click races it. Watch for the transition
  // instead: arm an observer first, then read what it saw.
  await page.evaluate(() => {
    window.__busySeen = false;
    window.__spinnerSeen = false;
    const btn = document.querySelector('button[type="submit"]');
    const seen = () => {
      if (btn.getAttribute('aria-busy') === 'true' || btn.disabled) window.__busySeen = true;
      if (btn.querySelector('svg.animate-kspin')) window.__spinnerSeen = true;
    };
    new MutationObserver(seen).observe(btn, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['aria-busy', 'disabled'],
    });
  });

  await submit.click();
  await page.waitForSelector('button[aria-label="Sign out"]', { timeout: 15000 });
  const { busy, spinner } = await page.evaluate(() => ({
    busy: window.__busySeen,
    spinner: window.__spinnerSeen,
  }));
  check('Sign-in button went aria-busy/disabled while submitting', busy);
  check('Sign-in button showed a spinner while submitting', spinner);
  check('Signed in — shell rendered', true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/03-dashboard.png`, fullPage: false });

  /* ------------------------------------------------- 4. dashboard chart geometry */
  const chart = page.locator('[aria-label="Saved and ready orders grouped by service"]');
  check('Orders-by-service chart present', (await chart.count()) === 1);
  const overflow = await chart.evaluate((root) => {
    const svg = root.querySelector('svg');
    const box = svg.getBoundingClientRect();
    const bad = [];
    for (const t of svg.querySelectorAll('text')) {
      const r = t.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.left < box.left - 0.5 || r.right > box.right + 0.5) {
        bad.push(`${t.textContent} [${Math.round(r.left - box.left)}..${Math.round(r.right - box.left)}] of ${Math.round(box.width)}`);
      }
    }
    return bad;
  });
  check('No chart label overflows the plot (the reported bug)', overflow.length === 0, overflow.join('; '));
  await chart.screenshot({ path: `${SHOTS}/04-chart.png` });

  /* --------------------------------------------------------------- 5. toasts */
  await page.goto(`${URL}#/settings`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Notifications")');
  const firstToggle = page.locator('button[role="switch"][aria-label*="Disable"], button[role="switch"][aria-label*="Enable"]').first();
  await firstToggle.click();
  await toasts.first().waitFor({ timeout: 5000 });
  await page.waitForTimeout(450); // let animate-ktoastin finish before we look
  check('Action raises a toast', (await toasts.count()) >= 1);

  const toastBox = page.locator('[role="status"]').filter({ has: page.locator('button[aria-label="Dismiss notification"]') }).first();
  check('Toast has role=status + aria-live', (await toastBox.getAttribute('aria-live')) === 'polite');
  await page.screenshot({ path: `${SHOTS}/05-toast.png` });

  // Dismiss button must remove it (the old toast had no dismiss at all).
  await toasts.first().click();
  await page.waitForTimeout(500);
  check('Toast dismiss button removes it', (await toasts.count()) === 0);

  /* ----------------------------------------------- 6. confirm dialog: sign out */
  await page.click('button[aria-label="Sign out"]');
  await dialog.waitFor({ timeout: 5000 });
  await page.waitForTimeout(500); // animate-kpopin + scrim fade must settle
  check('Sign-out opens a confirm dialog (was unguarded before)', await dialog.isVisible());

  // A half-drawn frame is indistinguishable from a broken dialog in a
  // screenshot, so assert the entrance actually landed at full opacity.
  const settled = await dialog.evaluate((el) => {
    const s = getComputedStyle(el);
    return { opacity: Number(s.opacity), transform: s.transform };
  });
  check(
    'Dialog settles at full opacity (no stuck entrance animation)',
    settled.opacity === 1,
    `opacity=${settled.opacity}`
  );
  const scrimDim = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button[aria-hidden="true"]')].pop();
    return b ? Number(getComputedStyle(b).opacity) : -1;
  });
  check('Scrim is fully faded in behind it', scrimDim === 1, `opacity=${scrimDim}`);

  const focusInDialog = await page.evaluate(
    () => !!document.activeElement?.closest('[role="alertdialog"]')
  );
  check('Focus moves into the dialog on open', focusInDialog);
  await page.screenshot({ path: `${SHOTS}/06-confirm-signout.png` });

  // Focus trap: Tab many times, focus must never leave the dialog.
  let escaped = false;
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[role="alertdialog"]')
    );
    if (!inside) escaped = true;
  }
  check('Focus trap holds through 8 Tabs', !escaped);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  check('Escape cancels the dialog', (await dialog.count()) === 0);
  check('Escape did NOT sign the user out', (await page.locator('button[aria-label="Sign out"]').count()) === 1);

  /* --------------------------------------- 7. confirm dialog: destructive reset */
  await page.click('button:has-text("Data")');
  await page.click('button:has-text("Reset local data")');
  await dialog.waitFor({ timeout: 5000 });
  await page.waitForTimeout(500);
  check('Reset opens a confirm dialog (replaced window.confirm)', await dialog.isVisible());
  await page.screenshot({ path: `${SHOTS}/07-confirm-reset.png` });

  await page.locator('[role="alertdialog"] button:has-text("Reset data")').click();
  await page.waitForTimeout(700);
  check('Confirming reset closes the dialog', (await dialog.count()) === 0);
  check('Reset raised a confirmation toast', (await toasts.count()) >= 1);
  await toasts.first().click();
  await page.waitForTimeout(400);

  /* --------------------------------------------------------------- 8. dark mode */
  await page.click('button[aria-label*="theme" i], button[title*="theme" i]').catch(() => {});
  await page.waitForTimeout(400);
  const theme = await page.locator('[data-theme]').first().getAttribute('data-theme');
  check('Theme toggle switches to dark', theme === 'dark', `data-theme=${theme}`);
  await page.goto(`${URL}#/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/08-dashboard-dark.png` });

  // Re-open a dialog in dark mode to confirm the tokens follow the theme.
  await page.click('button[aria-label="Sign out"]');
  await dialog.waitFor({ timeout: 5000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/09-confirm-dark.png` });
  await page.keyboard.press('Escape');

  /* ---------------------------------------------------------------- 9. errors */
  check('No console errors or uncaught exceptions', errors.length === 0, errors.slice(0, 4).join(' | '));

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((f) => console.log(`  - ${f.name} ${f.detail}`));
  }
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('HARNESS ERROR:', e.message);
  process.exit(2);
});
