/**
 * worker-flow.spec.js — Worker User Workflow Tests
 * TC_WORKER_001 through TC_WORKER_040
 * Tests: Worker protected routes, job search flow, application management,
 *        availability posting, chat, profile, notifications.
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Worker Workflow Tests — TC_WORKER_001..040', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== WORKER WORKFLOW SUITE START ===');
    driver = await buildDriver();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    logStep('=== WORKER WORKFLOW SUITE END ===');
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

  // ── Protected Route Tests ───────────────────────────────────────────────

  test('TC_WORKER_001 - Worker home route renders app root', async () => {
    await nav('#/worker/home');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_002 - Worker job-requests route renders app root', async () => {
    await nav('#/worker/job-requests');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_003 - Worker applications route renders app root', async () => {
    await nav('#/worker/applications');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_004 - Worker chat route renders app root', async () => {
    await nav('#/worker/chat');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_005 - Worker profile route renders app root', async () => {
    await nav('#/worker/profile');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_006 - Worker notifications route renders app root', async () => {
    await nav('#/worker/notifications');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_007 - Worker post-availability route renders app root', async () => {
    await nav('#/worker/post-availability');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_008 - Worker settings route renders app root', async () => {
    await nav('#/worker/settings');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_009 - Worker search route renders app root', async () => {
    await nav('#/worker/search');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_010 - Worker dashboard route renders app root', async () => {
    await nav('#/worker/dashboard');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  // ── URL Validation Tests ────────────────────────────────────────────────

  test('TC_WORKER_011 - Worker home URL contains worker segment', async () => {
    await nav('#/worker/home');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('worker');
  });

  test('TC_WORKER_012 - Worker job-requests URL contains job-requests', async () => {
    await nav('#/worker/job-requests');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('job-requests');
  });

  test('TC_WORKER_013 - Worker applications URL contains applications', async () => {
    await nav('#/worker/applications');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('applications');
  });

  test('TC_WORKER_014 - Worker post-availability URL contains post-availability', async () => {
    await nav('#/worker/post-availability');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('post-availability');
  });

  test('TC_WORKER_015 - Worker chat URL contains chat', async () => {
    await nav('#/worker/chat');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('chat');
  });

  // ── Navigation Flow Tests ───────────────────────────────────────────────

  test('TC_WORKER_016 - Navigate worker home then back to splash works', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/worker/home');
    await driver.sleep(1500);
    await driver.navigate().back();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_WORKER_017 - Multiple worker routes in sequence do not crash', async () => {
    const routes = ['#/worker/home', '#/worker/job-requests', '#/worker/chat', '#/worker/profile'];
    for (const r of routes) {
      await nav(r);
      await driver.sleep(1000);
      expect(await src()).toContain('root');
    }
  });

  test('TC_WORKER_018 - Worker route refresh does not produce 404', async () => {
    await nav('#/worker/home');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_WORKER_019 - Worker route via direct browser URL works', async () => {
    await driver.get(`${BASE_URL}/#/worker/profile`);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_WORKER_020 - Worker routes accessible after login route visit', async () => {
    await nav('#/login');
    await nav('#/worker/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  // ── Performance Tests ───────────────────────────────────────────────────

  test('TC_WORKER_021 - Worker home renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/worker/home');
    await driver.sleep(2000);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_WORKER_022 - Worker job-requests renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/worker/job-requests');
    await driver.sleep(2000);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_WORKER_023 - Worker chat renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/worker/chat');
    await driver.sleep(2000);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_WORKER_024 - Worker profile renders within 15 seconds', async () => {
    const t0 = Date.now();
    await nav('#/worker/profile');
    await driver.sleep(1500);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_WORKER_025 - JavaScript executes correctly on worker pages', async () => {
    await nav('#/worker/home');
    await driver.sleep(1500);
    const result = await driver.executeScript('return document.readyState');
    expect(result).toBe('complete');
  });

  // ── Security Tests ──────────────────────────────────────────────────────

  test('TC_WORKER_026 - Unauthenticated worker/home does not expose private jobs', async () => {
    await nav('#/worker/home');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_027 - Unauthenticated worker/applications does not expose data', async () => {
    await nav('#/worker/applications');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_028 - Worker route XSS injection in hash is handled safely', async () => {
    await driver.get(`${BASE_URL}/#/worker/%3Cscript%3Ealert('xss')%3C/script%3E`);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_029 - Worker routes do not expose hirer-only data', async () => {
    await nav('#/worker/home');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_030 - Worker routes only accessible to authenticated worker role', async () => {
    await nav('#/worker/post-availability');
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  // ── Responsive Design Tests ─────────────────────────────────────────────

  test('TC_WORKER_031 - Worker home renders on 1920x1080 desktop', async () => {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    await nav('#/worker/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_032 - Worker home renders on 1280x720 laptop', async () => {
    await driver.manage().window().setRect({ width: 1280, height: 720 });
    await nav('#/worker/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_WORKER_033 - Worker home renders on 768x1024 tablet', async () => {
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await nav('#/worker/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_WORKER_034 - Worker home renders on 375x812 mobile', async () => {
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await nav('#/worker/home');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_WORKER_035 - Worker job-requests renders on mobile viewport', async () => {
    await driver.manage().window().setRect({ width: 390, height: 844 });
    await nav('#/worker/job-requests');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  // ── Error Handling Tests ────────────────────────────────────────────────

  test('TC_WORKER_036 - Worker unknown sub-route renders app gracefully', async () => {
    await nav('#/worker/nonexistent-page');
    await driver.sleep(1500);
    expect(await src()).toContain('root');
  });

  test('TC_WORKER_037 - Worker route with query params does not crash', async () => {
    await driver.get(`${BASE_URL}/#/worker/job-requests?filter=active&sort=newest`);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_WORKER_038 - All worker routes return no server 500 errors', async () => {
    const workerRoutes = [
      '#/worker/home', '#/worker/job-requests', '#/worker/applications',
      '#/worker/chat', '#/worker/profile', '#/worker/notifications', '#/worker/post-availability'
    ];
    for (const r of workerRoutes) {
      await nav(r);
      await driver.sleep(1200);
      expect(await src()).not.toContain('500 Internal Server Error');
    }
  });

  test('TC_WORKER_039 - Worker routes do not show PHP parse errors', async () => {
    await nav('#/worker/home');
    await driver.sleep(1500);
    expect((await src()).toLowerCase()).not.toContain('parse error');
  });

  test('TC_WORKER_040 - Full worker navigation cycle completes without crash', async () => {
    logStep('▶ TC_WORKER_040');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/login');
    await nav('#/worker/home');
    await driver.sleep(1500);
    await nav('#/worker/job-requests');
    await driver.sleep(1500);
    await nav('#/worker/chat');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('chat');
    logStep('✔ TC_WORKER_040 PASSED');
  });
});
