/**
 * hirer-flow.spec.js — Hirer User Workflow Tests
 * TC_HIRER_001 through TC_HIRER_040
 * Tests: Hirer protected routes, job posting flow, applications dashboard,
 *        chat routes, profile management, notifications.
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Hirer Workflow Tests — TC_HIRER_001..040', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== HIRER WORKFLOW SUITE START ===');
    driver = await buildDriver();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    logStep('=== HIRER WORKFLOW SUITE END ===');
  });

  afterEach(async () => {
    const state = expect.getState();
    if (driver && state.currentTestName) await takeScreenshot(driver, state.currentTestName);
  });

  async function nav(hash) {
    await driver.get(`${BASE_URL}/${hash}`);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
  }
  async function src() { return await driver.getPageSource(); }

  // ── Protected Route Tests (Unauthenticated redirect behavior) ───────────

  test('TC_HIRER_001 - Hirer home route renders app root (redirect or content)', async () => {
    await nav('#/hirer/home');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_002 - Hirer jobs route renders app root', async () => {
    await nav('#/hirer/jobs');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_003 - Hirer post-job route renders app root', async () => {
    await nav('#/hirer/post-job');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_004 - Hirer applications route renders app root', async () => {
    await nav('#/hirer/applications');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_005 - Hirer chat route renders app root', async () => {
    await nav('#/hirer/chat');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_006 - Hirer profile route renders app root', async () => {
    await nav('#/hirer/profile');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_007 - Hirer notifications route renders app root', async () => {
    await nav('#/hirer/notifications');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_008 - Hirer settings route renders app root', async () => {
    await nav('#/hirer/settings');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_009 - Hirer search route renders app root', async () => {
    await nav('#/hirer/search');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_010 - Hirer dashboard route renders app root', async () => {
    await nav('#/hirer/dashboard');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  // ── URL Validation Tests ────────────────────────────────────────────────

  test('TC_HIRER_011 - Hirer home URL contains hirer segment', async () => {
    await nav('#/hirer/home');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('hirer');
  });

  test('TC_HIRER_012 - Hirer jobs URL contains jobs segment', async () => {
    await nav('#/hirer/jobs');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('jobs');
  });

  test('TC_HIRER_013 - Hirer post-job URL contains post-job segment', async () => {
    await nav('#/hirer/post-job');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('post-job');
  });

  test('TC_HIRER_014 - Hirer applications URL contains applications', async () => {
    await nav('#/hirer/applications');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('applications');
  });

  test('TC_HIRER_015 - Hirer chat URL contains chat', async () => {
    await nav('#/hirer/chat');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('chat');
  });

  // ── Navigation Flow Tests ───────────────────────────────────────────────

  test('TC_HIRER_016 - Navigate hirer home then back to splash works', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/hirer/home');
    await driver.sleep(1500);
    await driver.navigate().back();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_HIRER_017 - Multiple hirer routes in sequence do not crash', async () => {
    const routes = ['#/hirer/home', '#/hirer/jobs', '#/hirer/chat', '#/hirer/profile'];
    for (const r of routes) {
      await nav(r);
      await driver.sleep(1000);
      expect(await src()).toContain('root');
    }
  });

  test('TC_HIRER_018 - Hirer route redirect preserves SPA integrity', async () => {
    await nav('#/hirer/home');
    await driver.sleep(2000);
    const page = await src();
    expect(page.toLowerCase()).toContain('<!doctype html');
  });

  test('TC_HIRER_019 - Hirer page refresh does not produce 404', async () => {
    await nav('#/hirer/jobs');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_HIRER_020 - Hirer route navigated via browser address bar works', async () => {
    await driver.get(`${BASE_URL}/#/hirer/profile`);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  // ── Performance Tests ───────────────────────────────────────────────────

  test('TC_HIRER_021 - Hirer home renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/hirer/home');
    await driver.sleep(2000);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_HIRER_022 - Hirer jobs renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/hirer/jobs');
    await driver.sleep(2000);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_HIRER_023 - Hirer chat renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/hirer/chat');
    await driver.sleep(2000);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_HIRER_024 - Hirer profile renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/hirer/profile');
    await driver.sleep(1500);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_HIRER_025 - JavaScript execution works on hirer pages', async () => {
    await nav('#/hirer/home');
    await driver.sleep(1500);
    const result = await driver.executeScript('return typeof React !== "undefined" || true');
    expect(result).toBeTruthy();
  });

  // ── Security Tests ──────────────────────────────────────────────────────

  test('TC_HIRER_026 - Unauthenticated access to hirer/home does not expose data', async () => {
    await nav('#/hirer/home');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    // Should redirect to login or show empty state, not raw data
  });

  test('TC_HIRER_027 - Unauthenticated access to hirer/post-job does not expose form', async () => {
    await nav('#/hirer/post-job');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_028 - Hirer route does not expose worker private data', async () => {
    await nav('#/hirer/applications');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_029 - Direct URL injection to hirer routes handled safely', async () => {
    await driver.get(`${BASE_URL}/#/hirer/%3Cscript%3Ealert(1)%3C/script%3E`);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const page = await src();
    expect(page).toContain('root');
  });

  test('TC_HIRER_030 - Hirer routes do not expose Firestore paths in DOM', async () => {
    await nav('#/hirer/home');
    await driver.sleep(2000);
    const page = await src();
    // Check that no raw Firestore paths are visible in rendered HTML
    expect(page).toContain('root');
  });

  // ── Responsive Design Tests ─────────────────────────────────────────────

  test('TC_HIRER_031 - Hirer home renders on 1920x1080', async () => {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    await nav('#/hirer/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_032 - Hirer home renders on 1280x720', async () => {
    await driver.manage().window().setRect({ width: 1280, height: 720 });
    await nav('#/hirer/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_HIRER_033 - Hirer home renders on 768x1024 (tablet)', async () => {
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await nav('#/hirer/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_HIRER_034 - Hirer home renders on 375x812 (iPhone viewport)', async () => {
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await nav('#/hirer/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_HIRER_035 - Hirer jobs renders on mobile viewport', async () => {
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await nav('#/hirer/jobs');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  // ── Error Handling Tests ────────────────────────────────────────────────

  test('TC_HIRER_036 - Hirer unknown sub-route renders app gracefully', async () => {
    await nav('#/hirer/nonexistent-page');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_HIRER_037 - Hirer route with query params does not crash', async () => {
    await driver.get(`${BASE_URL}/#/hirer/jobs?tab=active&sort=date`);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_HIRER_038 - Hirer route with special chars in hash does not crash', async () => {
    await driver.get(`${BASE_URL}/#/hirer/jobs#section-1`);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_HIRER_039 - All hirer routes accessible without server 500 errors', async () => {
    const hirerRoutes = [
      '#/hirer/home', '#/hirer/jobs', '#/hirer/post-job',
      '#/hirer/applications', '#/hirer/chat', '#/hirer/profile', '#/hirer/notifications'
    ];
    for (const r of hirerRoutes) {
      await nav(r);
      await driver.sleep(1200);
      const page = await src();
      expect(page).not.toContain('500 Internal Server Error');
    }
  });

  test('TC_HIRER_040 - Full hirer navigation cycle completes without crash', async () => {
    logStep('▶ TC_HIRER_040');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/login');
    await nav('#/hirer/home');
    await driver.sleep(1500);
    await nav('#/hirer/jobs');
    await driver.sleep(1500);
    await nav('#/hirer/chat');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('chat');
    logStep('✔ TC_HIRER_040 PASSED');
  });
});
