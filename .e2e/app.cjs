/* Drives the Expo app's web build in Chromium, at phone size.
   The point of this run: prove that `className` actually reaches the Reanimated
   components. If the cssInterop registration in src/lib/animated.js is wrong,
   NativeWind silently drops those classes and the elements render with no size,
   no radius and no colour — which no bundler or unit test would ever catch. */
const { chromium } = require('playwright');
const fs = require('fs');

const URL = 'http://localhost:8090';
const SHOTS = '.e2e/shots-app';
const results = [];
const errors = [];

const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const px = (v) => Math.round(parseFloat(v) || 0);

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon|Download the React DevTools/i.test(m.text())) {
      errors.push(`console: ${m.text()}`);
    }
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 180000 });
  await page.waitForTimeout(4000); // Metro dev bundle + font gate

  /* ------------------------------------------------------- 1. boot & sign-in */
  const signInBtn = page.locator('text=Sign in to your store');
  await signInBtn.waitFor({ timeout: 60000 });
  check('App booted to the sign-in screen', true);
  await page.screenshot({ path: `${SHOTS}/01-signin.png` });

  /* ------------- 2. THE interop check: is the Toggle actually styled? -------- */
  const sw = page.locator('[role="switch"]').first();
  await sw.waitFor({ timeout: 20000 });

  // The track is the AnimatedView inside the Pressable. className carries its
  // geometry (h-6 w-11 rounded-xl); the animated style carries only its colour.
  const track = await sw.evaluate((el) => {
    const t = el.querySelector('div');
    if (!t) return null;
    const s = getComputedStyle(t);
    return {
      w: s.width,
      h: s.height,
      radius: s.borderTopLeftRadius,
      bg: s.backgroundColor,
      knob: (() => {
        const k = t.querySelector('div');
        if (!k) return null;
        const ks = getComputedStyle(k);
        return { w: ks.width, h: ks.height, radius: ks.borderTopLeftRadius, bg: ks.backgroundColor };
      })(),
    };
  });

  check('Toggle track exists', !!track);
  check(
    'Toggle track got its className geometry (h-6 w-11 rounded-xl)',
    track && px(track.w) === 44 && px(track.h) === 24 && px(track.radius) === 12,
    track ? `w=${track.w} h=${track.h} r=${track.radius}` : 'no track'
  );
  check(
    'Toggle track got its animated background colour',
    track && track.bg !== 'rgba(0, 0, 0, 0)' && track.bg !== 'transparent',
    track ? `bg=${track.bg}` : ''
  );
  check(
    'Toggle knob got its className geometry (h-5 w-5)',
    track?.knob && px(track.knob.w) === 20 && px(track.knob.h) === 20,
    track?.knob ? `w=${track.knob.w} h=${track.knob.h}` : 'no knob'
  );

  // The knob must actually move when toggled — proves the Reanimated spring runs.
  // Index the children explicitly: `querySelector('div > div')` would match the
  // TRACK (its parent is a div too) and silently measure the wrong element.
  const knobX = () =>
    sw.evaluate((el) => {
      const k = el.children[0]?.children[0];
      return k ? Math.round(k.getBoundingClientRect().left) : -1;
    });
  const before = await knobX();
  await sw.click();
  await page.waitForTimeout(700);
  const after = await knobX();
  check('Toggle knob animates across on tap', Math.abs(after - before) > 10, `${before}px → ${after}px`);
  await sw.click();
  await page.waitForTimeout(500);

  /* ----------------------------------------------- 3. sign in (loading state) */
  await page.fill('input[placeholder="012 345 678"]', 'demo@kitluy.local');
  await page.fill('input[type="password"]', 'KitLuy123!');
  await page.locator('text=Sign in').last().click();
  await page.waitForTimeout(6000);

  const signedIn = !(await page.locator('text=Sign in to your store').count());
  check('Signed in — left the auth screen', signedIn);
  await page.screenshot({ path: `${SHOTS}/02-home.png` });

  /* -------------------------------------------------- 4. settings + confirm sheet */
  await page.goto(`${URL}/account/settings`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3500);
  const logout = page.locator('text=/Log Out/i').first();
  await logout.waitFor({ timeout: 30000 });
  check('Reached Account → Settings', true);
  await page.screenshot({ path: `${SHOTS}/03-settings.png` });

  await logout.click();
  await page.waitForTimeout(900); // let the sheet slide up

  const sheetTitle = page.locator('text=Sign out?');
  const sheetUp = (await sheetTitle.count()) > 0;
  check('Log Out opens the custom confirm sheet (replaced Alert.alert)', sheetUp);

  // A sheet whose className was dropped would have no background and no radius.
  const sheet = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('div')];
    const el = nodes.find((n) => {
      const s = getComputedStyle(n);
      return parseFloat(s.borderTopLeftRadius) >= 20 && parseFloat(s.paddingBottom) >= 30;
    });
    if (!el) return null;
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, radius: s.borderTopLeftRadius, pad: s.paddingBottom };
  });
  check(
    'Confirm sheet got its className chrome (bg-card, rounded-t-[26px])',
    sheet && sheet.bg === 'rgb(255, 255, 255)',
    sheet ? `bg=${sheet.bg} r=${sheet.radius} pb=${sheet.pad}` : 'sheet not found'
  );
  await page.screenshot({ path: `${SHOTS}/04-confirm-sheet.png` });

  /* --------------------------------------------- 5. cancel must NOT sign out */
  await page.locator('text=Cancel').first().click();
  await page.waitForTimeout(900);
  check('Cancel closes the sheet', (await page.locator('text=Sign out?').count()) === 0);
  check('Cancel did NOT sign the user out', (await page.locator('text=/Log Out/i').count()) > 0);

  /* ------------------------------------------------------------- 6. toast */
  await page.locator('text=Language').first().click();
  await page.waitForTimeout(800);
  const toast = page.locator('[role="alert"]').first();
  const toastUp = (await toast.count()) > 0;
  check('Tapping a row raises a toast', toastUp);
  if (toastUp) {
    const t = await toast.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, radius: s.borderTopLeftRadius, opacity: s.opacity };
    });
    check(
      'Toast is styled and fully faded in',
      t.bg === 'rgb(255, 255, 255)' && Number(t.opacity) === 1,
      `bg=${t.bg} r=${t.radius} opacity=${t.opacity}`
    );
  }
  await page.screenshot({ path: `${SHOTS}/05-toast.png` });

  /* ------------------------------------------------------- 7. typing dots */
  await page.goto(`${URL}/account/assistant`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SHOTS}/06-assistant.png` });

  check('No console errors or uncaught exceptions', errors.length === 0, errors.slice(0, 4).join(' | '));

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  failed.forEach((f) => console.log(`  FAIL: ${f.name} ${f.detail}`));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('HARNESS ERROR:', e.message);
  process.exit(2);
});
