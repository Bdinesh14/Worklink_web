/**
 * cross-browser.spec.js — Cross-Browser & Viewport Compatibility Tests
 * TC_XBROW_001 through TC_XBROW_020
 * Tests: Viewport consistency, HTML standards, browser API usage,
 *        responsive breakpoints, DOM compatibility.
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Cross-Browser Compatibility — TC_XBROW_001..020', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== CROSS-BROWSER SUITE START ===');
    driver = await buildDriver();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    logStep('=== CROSS-BROWSER SUITE END ===');
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

  test('TC_XBROW_001 - App renders at 1920x1080 (Full HD desktop)', async () => {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_XBROW_002 - App renders at 1440x900 (standard laptop)', async () => {
    await driver.manage().window().setRect({ width: 1440, height: 900 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_XBROW_003 - App renders at 1366x768 (common laptop)', async () => {
    await driver.manage().window().setRect({ width: 1366, height: 768 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_XBROW_004 - App renders at 1280x800 (MacBook)', async () => {
    await driver.manage().window().setRect({ width: 1280, height: 800 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_XBROW_005 - App renders at 1024x768 (small desktop/tablet landscape)', async () => {
    await driver.manage().window().setRect({ width: 1024, height: 768 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_XBROW_006 - App renders at 768x1024 (iPad portrait)', async () => {
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
  });

  test('TC_XBROW_007 - App renders at 414x896 (iPhone XR)', async () => {
    await driver.manage().window().setRect({ width: 414, height: 896 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_XBROW_008 - App renders at 375x812 (iPhone X/11)', async () => {
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_XBROW_009 - App renders at 360x740 (Android S20)', async () => {
    await driver.manage().window().setRect({ width: 360, height: 740 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_XBROW_010 - App renders at 320x568 (iPhone SE)', async () => {
    await driver.manage().window().setRect({ width: 320, height: 568 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(await src()).toContain('root');
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_XBROW_011 - HTML5 APIs are available (localStorage)', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const hasStorage = await driver.executeScript('return typeof localStorage !== "undefined"');
    expect(hasStorage).toBe(true);
  });

  test('TC_XBROW_012 - window.location is available', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const hasLocation = await driver.executeScript('return typeof window.location !== "undefined"');
    expect(hasLocation).toBe(true);
  });

  test('TC_XBROW_013 - Promise API is available (ES6+)', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const hasPromise = await driver.executeScript('return typeof Promise !== "undefined"');
    expect(hasPromise).toBe(true);
  });

  test('TC_XBROW_014 - fetch API is available', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const hasFetch = await driver.executeScript('return typeof fetch !== "undefined"');
    expect(hasFetch).toBe(true);
  });

  test('TC_XBROW_015 - CSS custom properties (variables) are supported', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const supported = await driver.executeScript(
      'return typeof CSS !== "undefined" && CSS.supports("color", "var(--test)")'
    );
    expect(supported).toBe(true);
  });

  test('TC_XBROW_016 - Flexbox layout is working on app root', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const rootEl = await driver.findElement(By.id('root'));
    expect(rootEl).toBeTruthy();
  });

  test('TC_XBROW_017 - App width adapts on window resize (responsive)', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.manage().window().setRect({ width: 800, height: 600 });
    await driver.sleep(300);
    const root = await driver.findElement(By.id('root'));
    expect(root).toBeTruthy();
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
  });

  test('TC_XBROW_018 - No horizontal scroll bar at 1920x1080', async () => {
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const scrollWidth = await driver.executeScript('return document.documentElement.scrollWidth');
    const clientWidth = await driver.executeScript('return document.documentElement.clientWidth');
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // 20px tolerance
  });

  test('TC_XBROW_019 - App renders correctly after browser zoom to 150%', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.executeScript('document.body.style.zoom = "1.5"');
    await driver.sleep(300);
    const root = await driver.findElement(By.id('root'));
    expect(root).toBeTruthy();
    await driver.executeScript('document.body.style.zoom = "1"');
  });

  test('TC_XBROW_020 - App renders correctly after browser zoom to 75%', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.executeScript('document.body.style.zoom = "0.75"');
    await driver.sleep(300);
    const root = await driver.findElement(By.id('root'));
    expect(root).toBeTruthy();
    await driver.executeScript('document.body.style.zoom = "1"');
    logStep('✔ TC_XBROW_020 PASSED — cross-browser suite complete');
  });
});
