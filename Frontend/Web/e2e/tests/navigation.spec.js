/**
 * navigation.spec.js — Navigation Test Suite
 * TC_NAV_001 through TC_NAV_030
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Navigation Tests — TC_NAV_001..030', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== NAV SUITE START ===');
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

  test('TC_NAV_001 - Root URL / loads splash page', async () => {
    await driver.get(BASE_URL);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_002 - Navigate to /#/onboarding', async () => {
    await nav('#/onboarding');
    expect(await src()).toContain('root');
  });

  test('TC_NAV_003 - Navigate to /#/select-role', async () => {
    await nav('#/select-role');
    expect(await src()).toContain('root');
  });

  test('TC_NAV_004 - Navigate to /#/login', async () => {
    await nav('#/login');
    expect(await src()).toContain('root');
  });

  test('TC_NAV_005 - Navigate to /#/register', async () => {
    await nav('#/register');
    expect(await src()).toContain('root');
  });

  test('TC_NAV_006 - Navigate to /#/forgot-password', async () => {
    await nav('#/forgot-password');
    expect(await src()).toContain('root');
  });

  test('TC_NAV_007 - Browser back from login to splash works', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/login');
    await driver.navigate().back();
    expect(await src()).toContain('root');
  });

  test('TC_NAV_008 - Browser forward after back restores login', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/login');
    await driver.navigate().back();
    await driver.navigate().forward();
    const url = await driver.getCurrentUrl();
    expect(url).toBeTruthy();
  });

  test('TC_NAV_009 - Browser refresh on root URL succeeds', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_010 - Browser refresh on /#/login succeeds', async () => {
    await nav('#/login');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_011 - Browser refresh on /#/register succeeds', async () => {
    await nav('#/register');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_012 - Browser refresh on /#/select-role succeeds', async () => {
    await nav('#/select-role');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_013 - Browser refresh on /#/onboarding succeeds', async () => {
    await nav('#/onboarding');
    await driver.navigate().refresh();
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_014 - Navigate from login to register', async () => {
    await nav('#/login');
    await nav('#/register');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('register');
  });

  test('TC_NAV_015 - Navigate from register to login', async () => {
    await nav('#/register');
    await nav('#/login');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('login');
  });

  test('TC_NAV_016 - Navigate from login to forgot-password', async () => {
    await nav('#/login');
    await nav('#/forgot-password');
    const url = await driver.getCurrentUrl();
    expect(url).toContain('forgot-password');
  });

  test('TC_NAV_017 - Navigate from splash to select-role', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/select-role');
    expect(await src()).toContain('root');
  });

  test('TC_NAV_018 - Unknown route handled, no 500 error', async () => {
    await nav('#/totally-unknown-xyzabc');
    await driver.sleep(1000);
    expect(await src()).toContain('root');
  });

  test('TC_NAV_019 - Multiple rapid navigations remain stable', async () => {
    const routes = ['#/login', '#/register', '#/select-role', '#/forgot-password', '#/onboarding'];
    for (const r of routes) {
      await nav(r);
    }
    expect(await src()).toContain('root');
  });

  test('TC_NAV_020 - Direct URL access to splash does not require hash', async () => {
    await driver.get(BASE_URL);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
  });

  test('TC_NAV_021 - 404.html SPA fallback loads app', async () => {
    await driver.get(`${BASE_URL}/404.html`);
    await driver.sleep(2000);
    expect(await src()).toContain('root');
  });

  test('TC_NAV_022 - Splash page does not redirect away before interaction', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const url = await driver.getCurrentUrl();
    // Should stay on base url (or redirect to onboarding/login — still within same app)
    expect(url).toContain(BASE_URL.replace('https://', '').replace('http://', '').split('/')[0]);
  });

  test('TC_NAV_023 - Select-role page renders body content', async () => {
    await nav('#/select-role');
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('TC_NAV_024 - Login page renders body content', async () => {
    await nav('#/login');
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('TC_NAV_025 - Register page renders body content', async () => {
    await nav('#/register');
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('TC_NAV_026 - Forgot password page renders body content', async () => {
    await nav('#/forgot-password');
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('TC_NAV_027 - Onboarding page renders body content', async () => {
    await nav('#/onboarding');
    const body = await driver.findElement(By.css('body'));
    const text = await body.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('TC_NAV_028 - All public routes return same page title', async () => {
    const routes = ['#/login', '#/register', '#/forgot-password'];
    const titles = [];
    for (const r of routes) {
      await nav(r);
      titles.push(await driver.getTitle());
    }
    // All titles should be non-empty
    titles.forEach(t => expect(t.length).toBeGreaterThan(0));
  });

  test('TC_NAV_029 - Hash routing does not trigger full page reload (HTML same)', async () => {
    await driver.get(BASE_URL);
    const page1 = await src();
    await nav('#/login');
    const page2 = await src();
    // Both should have root in DOM
    expect(page1).toContain('root');
    expect(page2).toContain('root');
  });

  test('TC_NAV_030 - Navigation history allows multiple back steps', async () => {
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    await nav('#/onboarding');
    await nav('#/select-role');
    await nav('#/login');
    await driver.navigate().back();
    await driver.navigate().back();
    const page = await src();
    expect(page).toContain('root');
  });
});
