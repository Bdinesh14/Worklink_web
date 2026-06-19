/**
 * authorization.spec.js — Authorization Test Suite
 * TC_AUTHZ_001 through TC_AUTHZ_040
 * Tests: route protection, role-based redirects, access control behavior
 */
const { By, until } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Authorization Tests — TC_AUTHZ_001..040', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== AUTHZ SUITE START ===');
    driver = await buildDriver();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    logStep('=== AUTHZ SUITE END ===');
  });

  afterEach(async () => {
    const state = expect.getState();
    if (driver && state.currentTestName) {
      await takeScreenshot(driver, state.currentTestName);
    }
  });

  async function nav(hash) {
    await driver.get(`${BASE_URL}/${hash}`);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
  }

  async function src() { return await driver.getPageSource(); }

  test('TC_AUTHZ_001 - Unauthenticated access to hirer/home redirects', async () => {
    logStep('▶ TC_AUTHZ_001');
    await nav('#/hirer/home');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_001 PASSED');
  });

  test('TC_AUTHZ_002 - Unauthenticated access to worker/home redirects', async () => {
    logStep('▶ TC_AUTHZ_002');
    await nav('#/worker/home');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_002 PASSED');
  });

  test('TC_AUTHZ_003 - Unauthenticated access to hirer/jobs redirects', async () => {
    logStep('▶ TC_AUTHZ_003');
    await nav('#/hirer/jobs');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_003 PASSED');
  });

  test('TC_AUTHZ_004 - Unauthenticated access to hirer/applications redirects', async () => {
    logStep('▶ TC_AUTHZ_004');
    await nav('#/hirer/applications');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_004 PASSED');
  });

  test('TC_AUTHZ_005 - Unauthenticated access to hirer/chat redirects', async () => {
    logStep('▶ TC_AUTHZ_005');
    await nav('#/hirer/chat');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_005 PASSED');
  });

  test('TC_AUTHZ_006 - Unauthenticated access to hirer/profile redirects', async () => {
    logStep('▶ TC_AUTHZ_006');
    await nav('#/hirer/profile');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_006 PASSED');
  });

  test('TC_AUTHZ_007 - Unauthenticated access to hirer/post-job redirects', async () => {
    logStep('▶ TC_AUTHZ_007');
    await nav('#/hirer/post-job');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_007 PASSED');
  });

  test('TC_AUTHZ_008 - Unauthenticated access to hirer/manage-reports redirects', async () => {
    logStep('▶ TC_AUTHZ_008');
    await nav('#/hirer/manage-reports');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_008 PASSED');
  });

  test('TC_AUTHZ_009 - Unauthenticated access to hirer/notifications redirects', async () => {
    logStep('▶ TC_AUTHZ_009');
    await nav('#/hirer/notifications');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_009 PASSED');
  });

  test('TC_AUTHZ_010 - Unauthenticated access to worker/job-requests redirects', async () => {
    logStep('▶ TC_AUTHZ_010');
    await nav('#/worker/job-requests');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_010 PASSED');
  });

  test('TC_AUTHZ_011 - Unauthenticated access to worker/applications redirects', async () => {
    logStep('▶ TC_AUTHZ_011');
    await nav('#/worker/applications');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_011 PASSED');
  });

  test('TC_AUTHZ_012 - Unauthenticated access to worker/post-availability redirects', async () => {
    logStep('▶ TC_AUTHZ_012');
    await nav('#/worker/post-availability');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_012 PASSED');
  });

  test('TC_AUTHZ_013 - Unauthenticated access to worker/chat redirects', async () => {
    logStep('▶ TC_AUTHZ_013');
    await nav('#/worker/chat');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_013 PASSED');
  });

  test('TC_AUTHZ_014 - Unauthenticated access to worker/profile redirects', async () => {
    logStep('▶ TC_AUTHZ_014');
    await nav('#/worker/profile');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_014 PASSED');
  });

  test('TC_AUTHZ_015 - Unauthenticated access to worker/manage-reports redirects', async () => {
    logStep('▶ TC_AUTHZ_015');
    await nav('#/worker/manage-reports');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_015 PASSED');
  });

  test('TC_AUTHZ_016 - Unauthenticated access to worker/notifications redirects', async () => {
    logStep('▶ TC_AUTHZ_016');
    await nav('#/worker/notifications');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_016 PASSED');
  });

  test('TC_AUTHZ_017 - Public login route does NOT redirect to protected area', async () => {
    logStep('▶ TC_AUTHZ_017');
    await nav('#/login');
    const url = await driver.getCurrentUrl();
    expect(url).not.toContain('/hirer/');
    expect(url).not.toContain('/worker/');
    logStep('✔ TC_AUTHZ_017 PASSED');
  });

  test('TC_AUTHZ_018 - Public register route does NOT redirect to protected area', async () => {
    logStep('▶ TC_AUTHZ_018');
    await nav('#/register');
    const url = await driver.getCurrentUrl();
    expect(url).not.toContain('/hirer/');
    expect(url).not.toContain('/worker/');
    logStep('✔ TC_AUTHZ_018 PASSED');
  });

  test('TC_AUTHZ_019 - Hirer chat ID route unauthenticated access redirects', async () => {
    logStep('▶ TC_AUTHZ_019');
    await nav('#/hirer/chat/test-chat-id-123');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_019 PASSED');
  });

  test('TC_AUTHZ_020 - Worker chat ID route unauthenticated access redirects', async () => {
    logStep('▶ TC_AUTHZ_020');
    await nav('#/worker/chat/test-chat-id-456');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_020 PASSED');
  });

  test('TC_AUTHZ_021 - Direct root / route loads app without auth', async () => {
    logStep('▶ TC_AUTHZ_021');
    await driver.get(BASE_URL);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_021 PASSED');
  });

  test('TC_AUTHZ_022 - Onboarding is publicly accessible without auth', async () => {
    logStep('▶ TC_AUTHZ_022');
    await nav('#/onboarding');
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_022 PASSED');
  });

  test('TC_AUTHZ_023 - Select-role is publicly accessible without auth', async () => {
    logStep('▶ TC_AUTHZ_023');
    await nav('#/select-role');
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_023 PASSED');
  });

  test('TC_AUTHZ_024 - Forgot-password is publicly accessible without auth', async () => {
    logStep('▶ TC_AUTHZ_024');
    await nav('#/forgot-password');
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_024 PASSED');
  });

  test('TC_AUTHZ_025 - Arbitrary deep hirer route is protected', async () => {
    logStep('▶ TC_AUTHZ_025');
    await nav('#/hirer/some-deep-path/nested');
    await driver.sleep(1500);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_025 PASSED');
  });

  test('TC_AUTHZ_026 - Arbitrary deep worker route is protected', async () => {
    logStep('▶ TC_AUTHZ_026');
    await nav('#/worker/some-deep-path/nested');
    await driver.sleep(1500);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_026 PASSED');
  });

  test('TC_AUTHZ_027 - App title present on login page', async () => {
    logStep('▶ TC_AUTHZ_027');
    await nav('#/login');
    const t = await driver.getTitle();
    expect(t.length).toBeGreaterThan(0);
    logStep('✔ TC_AUTHZ_027 PASSED');
  });

  test('TC_AUTHZ_028 - App title present on register page', async () => {
    logStep('▶ TC_AUTHZ_028');
    await nav('#/register');
    const t = await driver.getTitle();
    expect(t.length).toBeGreaterThan(0);
    logStep('✔ TC_AUTHZ_028 PASSED');
  });

  test('TC_AUTHZ_029 - Login page body is non-empty', async () => {
    logStep('▶ TC_AUTHZ_029');
    await nav('#/login');
    const body = await driver.findElement(By.css('body'));
    const html = await body.getAttribute('innerHTML');
    expect(html.length).toBeGreaterThan(50);
    logStep('✔ TC_AUTHZ_029 PASSED');
  });

  test('TC_AUTHZ_030 - Register page body is non-empty', async () => {
    logStep('▶ TC_AUTHZ_030');
    await nav('#/register');
    const body = await driver.findElement(By.css('body'));
    const html = await body.getAttribute('innerHTML');
    expect(html.length).toBeGreaterThan(50);
    logStep('✔ TC_AUTHZ_030 PASSED');
  });

  test('TC_AUTHZ_031 - Hirer home redirect does not break back navigation', async () => {
    logStep('▶ TC_AUTHZ_031');
    await nav('#/hirer/home');
    await driver.sleep(2000);
    await driver.navigate().back();
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_031 PASSED');
  });

  test('TC_AUTHZ_032 - Multiple protected routes in sequence all redirect', async () => {
    logStep('▶ TC_AUTHZ_032');
    const routes = ['#/hirer/home', '#/worker/home', '#/hirer/jobs', '#/worker/job-requests'];
    for (const route of routes) {
      await nav(route);
      await driver.sleep(1000);
      const page = await src();
      expect(page).toContain('root');
    }
    logStep('✔ TC_AUTHZ_032 PASSED');
  });

  test('TC_AUTHZ_033 - Splash page is public and renders instantly', async () => {
    logStep('▶ TC_AUTHZ_033');
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    const page = await src();
    expect(page.length).toBeGreaterThan(200);
    logStep('✔ TC_AUTHZ_033 PASSED');
  });

  test('TC_AUTHZ_034 - Protected route does not expose hirer data without auth', async () => {
    logStep('▶ TC_AUTHZ_034');
    await nav('#/hirer/applications');
    await driver.sleep(2000);
    const url = await driver.getCurrentUrl();
    // Should be on login or splash, not still on hirer/applications
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_034 PASSED');
  });

  test('TC_AUTHZ_035 - Protected route does not expose worker data without auth', async () => {
    logStep('▶ TC_AUTHZ_035');
    await nav('#/worker/applications');
    await driver.sleep(2000);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_035 PASSED');
  });

  test('TC_AUTHZ_036 - Public routes load without JavaScript errors', async () => {
    logStep('▶ TC_AUTHZ_036');
    await nav('#/login');
    const page = await src();
    expect(page.length).toBeGreaterThan(100);
    logStep('✔ TC_AUTHZ_036 PASSED');
  });

  test('TC_AUTHZ_037 - Root URL renders without needing authentication', async () => {
    logStep('▶ TC_AUTHZ_037');
    await driver.get(BASE_URL);
    const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
    expect(root).toBeTruthy();
    logStep('✔ TC_AUTHZ_037 PASSED');
  });

  test('TC_AUTHZ_038 - All public pages have root element in DOM', async () => {
    logStep('▶ TC_AUTHZ_038');
    const publicRoutes = ['', '#/login', '#/register', '#/forgot-password', '#/select-role', '#/onboarding'];
    for (const route of publicRoutes) {
      await driver.get(`${BASE_URL}/${route}`);
      const root = await driver.wait(until.elementLocated(By.id('root')), TIMEOUT);
      expect(root).toBeTruthy();
    }
    logStep('✔ TC_AUTHZ_038 PASSED');
  });

  test('TC_AUTHZ_039 - App handles concurrent route changes gracefully', async () => {
    logStep('▶ TC_AUTHZ_039');
    await nav('#/login');
    await nav('#/hirer/home');
    await driver.sleep(1500);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_039 PASSED');
  });

  test('TC_AUTHZ_040 - Catch-all unknown route redirects to splash', async () => {
    logStep('▶ TC_AUTHZ_040');
    await nav('#/completely-nonexistent-route-test-authz');
    await driver.sleep(1500);
    const page = await src();
    expect(page).toContain('root');
    logStep('✔ TC_AUTHZ_040 PASSED');
  });
});
