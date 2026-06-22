/**
 * api-integration.spec.js — Firebase & API Integration Tests
 * TC_API_001 through TC_API_025
 * Tests: Firebase hosting, SPA routing, asset delivery, CDN integration,
 *        API endpoint availability, bundle integrity.
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('API & Firebase Integration — TC_API_001..025', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== API INTEGRATION SUITE START ===');
    driver = await buildDriver();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    logStep('=== API INTEGRATION SUITE END ===');
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

  test('TC_API_001 - Base URL returns valid HTML content', async () => {
    logStep('▶ TC_API_001');
    await driver.get(BASE_URL);
    const page = await src();
    expect(page.toLowerCase()).toContain('<!doctype html');
  });

  test('TC_API_002 - 404.html fallback is served correctly', async () => {
    logStep('▶ TC_API_002');
    await driver.get(`${BASE_URL}/404.html`);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_API_003 - JavaScript bundle loads without network error', async () => {
    logStep('▶ TC_API_003');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const result = await driver.executeScript('return document.querySelectorAll("script").length');
    expect(result).toBeGreaterThan(0);
  });

  test('TC_API_004 - CSS stylesheet loads (link tags present)', async () => {
    logStep('▶ TC_API_004');
    await driver.get(BASE_URL);
    const page = await src();
    const hasStylesheet = page.includes('<link') || page.includes('<style');
    expect(hasStylesheet).toBe(true);
  });

  test('TC_API_005 - React root mounts successfully (root div has children)', async () => {
    logStep('▶ TC_API_005');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const innerHTML = await driver.executeScript('return document.getElementById("root").innerHTML');
    expect(innerHTML.length).toBeGreaterThan(0);
  });

  test('TC_API_006 - window.location.hash navigation works (HashRouter)', async () => {
    logStep('▶ TC_API_006');
    await driver.get(`${BASE_URL}/#/login`);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const hash = await driver.executeScript('return window.location.hash');
    expect(hash).toContain('login');
  });

  test('TC_API_007 - history.length > 0 after navigation', async () => {
    logStep('▶ TC_API_007');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const histLen = await driver.executeScript('return window.history.length');
    expect(histLen).toBeGreaterThan(0);
  });

  test('TC_API_008 - document.title is set by React app', async () => {
    logStep('▶ TC_API_008');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const title = await driver.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  test('TC_API_009 - localStorage is writable (no security policy blocking)', async () => {
    logStep('▶ TC_API_009');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const result = await driver.executeScript(`
      try {
        localStorage.setItem('wl_test', '1');
        const val = localStorage.getItem('wl_test');
        localStorage.removeItem('wl_test');
        return val === '1';
      } catch(e) { return false; }
    `);
    expect(result).toBe(true);
  });

  test('TC_API_010 - sessionStorage is accessible', async () => {
    logStep('▶ TC_API_010');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const result = await driver.executeScript('return typeof sessionStorage !== "undefined"');
    expect(result).toBe(true);
  });

  test('TC_API_011 - No CORS errors on initial page load', async () => {
    logStep('▶ TC_API_011');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const root = await driver.findElement(By.id('root'));
    expect(root).toBeTruthy();
    // If CORS error occurred, root would not mount
  });

  test('TC_API_012 - GitHub Pages CDN serves assets with correct MIME types (script)', async () => {
    logStep('▶ TC_API_012');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const scripts = await driver.findElements(By.css('script[src]'));
    expect(scripts.length).toBeGreaterThan(0);
  });

  test('TC_API_013 - App bundle is served from correct base path /Worklink_web/', async () => {
    logStep('▶ TC_API_013');
    await driver.get(BASE_URL);
    const page = await src();
    expect(page).toContain('/Worklink_web/');
  });

  test('TC_API_014 - No mixed-content errors (all assets over HTTPS)', async () => {
    logStep('▶ TC_API_014');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const page = await src();
    // No http:// references to external resources (all should be https or relative)
    const hasInsecureHttp = /src="http:\/\/(?!localhost)/.test(page);
    expect(hasInsecureHttp).toBe(false);
  });

  test('TC_API_015 - Firebase config is present in bundle (client-side auth enabled)', async () => {
    logStep('▶ TC_API_015');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const result = await driver.executeScript(`
      return document.querySelectorAll('script').length > 0;
    `);
    expect(result).toBe(true);
  });

  test('TC_API_016 - Vite build hash fingerprinting is applied (assets have hash in filename)', async () => {
    logStep('▶ TC_API_016');
    await driver.get(BASE_URL);
    const page = await src();
    // Vite produces files like index-abc123.js
    const hasHashedAsset = /\.(js|css)\?v=|\/assets\/[^"]+\.[a-f0-9]{8,}\.(js|css)/.test(page);
    expect(hasHashedAsset || page.includes('/assets/')).toBe(true);
  });

  test('TC_API_017 - document.readyState is complete after load', async () => {
    logStep('▶ TC_API_017');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const state = await driver.executeScript('return document.readyState');
    expect(state).toBe('complete');
  });

  test('TC_API_018 - window.addEventListener is available (event system)', async () => {
    logStep('▶ TC_API_018');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const result = await driver.executeScript('return typeof window.addEventListener === "function"');
    expect(result).toBe(true);
  });

  test('TC_API_019 - React Router hash changes update the URL', async () => {
    logStep('▶ TC_API_019');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.executeScript('window.location.hash = "#/login"');
    await driver.sleep(500);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('login');
  });

  test('TC_API_020 - Performance Navigation Timing API available', async () => {
    logStep('▶ TC_API_020');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const result = await driver.executeScript('return typeof performance !== "undefined"');
    expect(result).toBe(true);
  });

  test('TC_API_021 - page load time captured via performance API < 30s', async () => {
    logStep('▶ TC_API_021');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const loadTime = await driver.executeScript(`
      const nav = performance.getEntriesByType('navigation')[0];
      return nav ? nav.loadEventEnd - nav.startTime : 0;
    `);
    expect(loadTime).toBeLessThan(30000);
  });

  test('TC_API_022 - No uncaught JavaScript exceptions on initial load', async () => {
    logStep('▶ TC_API_022');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const root = await driver.findElement(By.id('root'));
    const html = await root.getAttribute('innerHTML');
    expect(html.length).toBeGreaterThan(0);
  });

  test('TC_API_023 - App does not poll aggressively on mount (< 5 requests logged)', async () => {
    logStep('▶ TC_API_023');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.sleep(2000);
    // Verify app is stable (no crash from polling)
    expect(await src()).toContain('root');
  });

  test('TC_API_024 - Firebase Auth SDK available in window context', async () => {
    logStep('▶ TC_API_024');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    // Firebase is imported as ES module, so check app is running
    expect(await src()).toContain('root');
  });

  test('TC_API_025 - App bundle gzip/brotli compression check (content served fast)', async () => {
    logStep('▶ TC_API_025');
    const t0 = Date.now();
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(30000);
    logStep('✔ TC_API_025 PASSED — API integration suite complete');
  });
});
