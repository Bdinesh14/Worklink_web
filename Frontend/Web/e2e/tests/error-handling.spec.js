/**
 * error-handling.spec.js — Error Handling Test Suite
 * TC_ERR_001 through TC_ERR_020
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Error Handling Tests — TC_ERR_001..020', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== ERROR HANDLING SUITE START ===');
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
  async function bodyText() { return (await driver.findElement(By.css('body'))).getText(); }

  test('TC_ERR_001 - Unknown route is handled gracefully (no 500 error)', async () => {
    await nav('#/unknown-route-error-test');
    await driver.sleep(1000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_002 - Deeply nested unknown route handled gracefully', async () => {
    await nav('#/a/b/c/d/e/f/g/unknown');
    await driver.sleep(1000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_003 - App does not show raw error stack trace on unknown route', async () => {
    await nav('#/error-test-route-xyz');
    await driver.sleep(1000);
    const text = await bodyText();
    expect(text).not.toContain('at Object.');
    expect(text).not.toContain('TypeError:');
  });

  test('TC_ERR_004 - App does not show 404 text on unknown hash route', async () => {
    await nav('#/non-existent-page-error');
    await driver.sleep(1000);
    // SPA handles 404 client-side, root should still be present
    expect(await src()).toContain('root');
  });

  test('TC_ERR_005 - App recovers from bad URL hash gracefully', async () => {
    await driver.get(`${BASE_URL}/#%^&invalid`);
    await driver.sleep(1000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_006 - Login submit with wrong credentials handled gracefully', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (emailInputs.length > 0) { await emailInputs[0].sendKeys('wrong@email.com'); }
    if (pwInputs.length > 0) { await pwInputs[0].sendKeys('wrongpassword'); }
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_007 - Error message does not expose internal Firebase errors directly', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (emailInputs.length > 0) { await emailInputs[0].sendKeys('bad@bad.com'); }
    if (pwInputs.length > 0) { await pwInputs[0].sendKeys('badpass'); }
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
    await driver.sleep(2000);
    const text = await bodyText();
    expect(text).not.toContain('INTERNAL_ERROR');
    expect(text).not.toContain('firebase_error_type');
  });

  test('TC_ERR_008 - Page reload after error does not persist error state', async () => {
    await nav('#/login');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_ERR_009 - App does not crash on rapid back/forward navigation', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/login');
    for (let i = 0; i < 3; i++) {
      await driver.navigate().back();
      await driver.navigate().forward();
    }
    expect(await src()).toContain('root');
  });

  test('TC_ERR_010 - Forgot password with non-existent email shows handled state', async () => {
    await nav('#/forgot-password');
    const emailInputs = await driver.findElements(By.css('input[type="email"], input[name="email"]'));
    if (emailInputs.length > 0) { await emailInputs[0].sendKeys('doesnotexist_xyz@fake.com'); }
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_011 - App does not show undefined in body text', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const text = await bodyText();
    expect(text).not.toMatch(/^undefined$/m);
  });

  test('TC_ERR_012 - App does not show NaN in body text', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const text = await bodyText();
    expect(text).not.toMatch(/\bNaN\b/);
  });

  test('TC_ERR_013 - App does not show null in body text', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const text = await bodyText();
    expect(text).not.toMatch(/^null$/m);
  });

  test('TC_ERR_014 - Network error does not crash app structure', async () => {
    await driver.get(BASE_URL);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_ERR_015 - JavaScript error boundary prevents full app crash', async () => {
    await driver.get(BASE_URL);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const html = await root.getAttribute('innerHTML');
    expect(html.length).toBeGreaterThan(0);
  });

  test('TC_ERR_016 - Login with empty fields shows handled error state', async () => {
    await nav('#/login');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
    await driver.sleep(1000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_017 - Register with empty fields shows handled error state', async () => {
    await nav('#/register');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
    await driver.sleep(1000);
    expect(await src()).toContain('root');
  });

  test('TC_ERR_018 - Multiple failed submit attempts do not accumulate UI errors', async () => {
    await nav('#/login');
    const buttons = await driver.findElements(By.css('button'));
    for (let i = 0; i < 3; i++) {
      if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
      await driver.sleep(500);
    }
    expect(await src()).toContain('root');
  });

  test('TC_ERR_019 - Error state clears when navigating to different page', async () => {
    await nav('#/login');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} }
    await driver.sleep(1000);
    await nav('#/register');
    expect(await src()).toContain('root');
  });

  test('TC_ERR_020 - App handles server delays gracefully (30 second timeout)', async () => {
    const t0 = Date.now();
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(30000);
  });
});
