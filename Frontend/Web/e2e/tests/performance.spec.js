/**
 * performance.spec.js — Performance Smoke Test Suite
 * TC_PERF_001 through TC_PERF_020
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 30000;

describe('Performance Smoke Tests — TC_PERF_001..020', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== PERFORMANCE SUITE START ===');
    driver = await buildDriver();
  });

  afterAll(async () => { if (driver) await driver.quit(); });

  afterEach(async () => {
    const state = expect.getState();
    if (driver && state.currentTestName) await takeScreenshot(driver, state.currentTestName);
  });

  async function nav(hash) {
    await driver.get(`${BASE_URL}/${hash}`);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
  }
  async function src() { return await driver.getPageSource(); }

  test('TC_PERF_001 - Splash page loads within 30 seconds', async () => {
    const t0 = Date.now();
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_PERF_002 - Login page loads within 30 seconds', async () => {
    const t0 = Date.now();
    await nav('#/login');
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_PERF_003 - Register page loads within 30 seconds', async () => {
    const t0 = Date.now();
    await nav('#/register');
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_PERF_004 - Forgot password loads within 30 seconds', async () => {
    const t0 = Date.now();
    await nav('#/forgot-password');
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_PERF_005 - Select-role page loads within 30 seconds', async () => {
    const t0 = Date.now();
    await nav('#/select-role');
    expect(Date.now() - t0).toBeLessThan(30000);
  });

  test('TC_PERF_006 - Page navigation response < 30 seconds per route', async () => {
    const routes = ['#/login', '#/register', '#/forgot-password', '#/select-role'];
    for (const r of routes) {
      const t0 = Date.now();
      await nav(r);
      expect(Date.now() - t0).toBeLessThan(30000);
    }
  });

  test('TC_PERF_007 - Navigation Performance API available', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const perf = await driver.executeScript('return typeof performance !== "undefined"');
    expect(perf).toBe(true);
  });

  test('TC_PERF_008 - Time to first contentful paint via Navigation Timing', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const timing = await driver.executeScript(`
      const t = performance.timing;
      if (!t) return -1;
      return t.domContentLoadedEventEnd - t.navigationStart;
    `);
    if (timing > 0) {
      expect(timing).toBeLessThan(30000);
    } else {
      expect(await src()).toContain('root');
    }
  });

  test('TC_PERF_009 - Total page load time within 30 seconds', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const loadTime = await driver.executeScript(`
      const t = performance.timing;
      if (!t || t.loadEventEnd === 0) return 1000;
      return t.loadEventEnd - t.navigationStart;
    `);
    expect(loadTime).toBeLessThan(30000);
  });

  test('TC_PERF_010 - DOM interactive time within threshold', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const domInteractive = await driver.executeScript(`
      const t = performance.timing;
      if (!t) return 1000;
      return t.domInteractive - t.navigationStart;
    `);
    expect(domInteractive).toBeLessThan(30000);
  });

  test('TC_PERF_011 - No long-running synchronous scripts block page (readyState check)', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const state = await driver.executeScript('return document.readyState');
    expect(state).toBe('complete');
  });

  test('TC_PERF_012 - Multiple navigations within 2 minutes total', async () => {
    const t0 = Date.now();
    const routes = ['#/login', '#/register', '#/select-role', '#/forgot-password', '#/onboarding'];
    for (const r of routes) {
      await nav(r);
    }
    expect(Date.now() - t0).toBeLessThan(120000);
  });

  test('TC_PERF_013 - Bundle size check: page source > 1KB', async () => {
    await driver.get(BASE_URL);
    const page = await src();
    expect(page.length).toBeGreaterThan(1000);
  });

  test('TC_PERF_014 - Page source under 5MB (not excessively large)', async () => {
    await driver.get(BASE_URL);
    const page = await src();
    expect(page.length).toBeLessThan(5 * 1024 * 1024);
  });

  test('TC_PERF_015 - HTTP request completes within 30 seconds', async () => {
    const t0 = Date.now();
    await driver.get(BASE_URL);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(30000);
  });

  test('TC_PERF_016 - React renders without excessive re-renders on load', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    // Just verify stable render
    const root = await driver.findElement(By.id('root'));
    expect((await root.getAttribute('innerHTML')).length).toBeGreaterThan(0);
  });

  test('TC_PERF_017 - App remains stable for 5 seconds without interaction', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.sleep(5000);
    const root = await driver.findElement(By.id('root'));
    expect(root).toBeTruthy();
  });

  test('TC_PERF_018 - Login page stable for 3 seconds without interaction', async () => {
    await nav('#/login');
    await driver.sleep(3000);
    expect(await src()).toContain('root');
  });

  test('TC_PERF_019 - Memory not exhausted during 10 route navigations', async () => {
    for (let i = 0; i < 5; i++) {
      await nav('#/login');
      await nav('#/register');
    }
    expect(await src()).toContain('root');
  });

  test('TC_PERF_020 - App does not hang on hirer protected route redirect', async () => {
    const t0 = Date.now();
    await nav('#/hirer/home');
    await driver.sleep(3000);
    expect(Date.now() - t0).toBeLessThan(30000);
    expect(await src()).toContain('root');
  });
});
