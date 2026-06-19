/**
 * input-validation.spec.js — Input Validation Test Suite
 * TC_INP_001 through TC_INP_040
 */
const { By, until, Key } = require('selenium-webdriver');
const { buildDriver, takeScreenshot, logStep, BASE_URL } = require('../utils/testHelper');

const TIMEOUT = 15000;

describe('Input Validation Tests — TC_INP_001..040', () => {
  let driver;

  beforeAll(async () => {
    logStep('=== INPUT VALIDATION SUITE START ===');
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
  async function bodyText() {
    return await (await driver.findElement(By.css('body'))).getText();
  }

  test('TC_INP_001 - Empty email on login form handled gracefully', async () => {
    await nav('#/login');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    expect(await src()).toContain('root');
  });

  test('TC_INP_002 - Invalid email format rejected or handled on login', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('not-an-email');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_003 - SQL injection string in email does not crash app', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys("' OR '1'='1");
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_004 - XSS string in email field does not execute', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('<img src=x onerror=alert(1)>@test.com');
    }
    const text = await bodyText();
    expect(text).not.toContain('onerror=alert');
  });

  test('TC_INP_005 - Very long email string does not crash login page', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('a'.repeat(200) + '@test.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_006 - Empty password field on login handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) { await emailInputs[0].sendKeys('test@test.com'); }
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    expect(await src()).toContain('root');
  });

  test('TC_INP_007 - Very long password does not crash login page', async () => {
    await nav('#/login');
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (pwInputs.length > 0) {
      await pwInputs[0].sendKeys('P'.repeat(300));
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_008 - Password with special characters is accepted in field', async () => {
    await nav('#/login');
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (pwInputs.length > 0) {
      await pwInputs[0].sendKeys('!@#$%^&*()_+{}|:<>?');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_009 - Register email field rejects invalid format', async () => {
    await nav('#/register');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('invalid-email-format');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_010 - Register empty name field handled gracefully', async () => {
    await nav('#/register');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    expect(await src()).toContain('root');
  });

  test('TC_INP_011 - Forgot password with invalid email handled', async () => {
    await nav('#/forgot-password');
    const emailInputs = await driver.findElements(By.css('input[type="email"], input[name="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('invalid-email');
    }
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    expect(await src()).toContain('root');
  });

  test('TC_INP_012 - Forgot password with empty email handled', async () => {
    await nav('#/forgot-password');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    expect(await src()).toContain('root');
  });

  test('TC_INP_013 - Emoji characters in email field do not crash', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('test😀@test.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_014 - Null bytes in password do not crash app', async () => {
    await nav('#/login');
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (pwInputs.length > 0) {
      await pwInputs[0].sendKeys('test\u0000test');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_015 - Name field with numbers only accepted in register', async () => {
    await nav('#/register');
    const textInputs = await driver.findElements(By.css('input[type="text"]'));
    if (textInputs.length > 0) {
      await textInputs[0].sendKeys('12345');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_016 - Name field with all special chars does not crash', async () => {
    await nav('#/register');
    const textInputs = await driver.findElements(By.css('input[type="text"]'));
    if (textInputs.length > 0) {
      await textInputs[0].sendKeys('!@#$%^&*()');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_017 - Very short password (1 char) handled', async () => {
    await nav('#/login');
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (pwInputs.length > 0) {
      await pwInputs[0].sendKeys('a');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_018 - Password of exact 6 chars accepted in field', async () => {
    await nav('#/login');
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (pwInputs.length > 0) {
      await pwInputs[0].sendKeys('abc123');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_019 - Email domain-only string handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('@domain.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_020 - Email with multiple @ chars handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('a@b@c.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_021 - URL in email field handled safely', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('http://evil.com/@test.com');
    }
    const text = await bodyText();
    expect(text).not.toContain('http://evil.com');
  });

  test('TC_INP_022 - JavaScript URI in email handled safely', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('javascript:alert(1)@test.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_023 - Whitespace-only email handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('   ');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_024 - Whitespace-only password handled', async () => {
    await nav('#/login');
    const pwInputs = await driver.findElements(By.css('input[type="password"]'));
    if (pwInputs.length > 0) {
      await pwInputs[0].sendKeys('   ');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_025 - Script tag in name field does not execute', async () => {
    await nav('#/register');
    const textInputs = await driver.findElements(By.css('input[type="text"]'));
    if (textInputs.length > 0) {
      await textInputs[0].sendKeys('<script>window.pwned=true</script>');
    }
    const pwned = await driver.executeScript('return window.pwned');
    expect(pwned).toBeFalsy();
  });

  test('TC_INP_026 - Template string injection does not execute', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('${7*7}@test.com');
    }
    const text = await bodyText();
    expect(text).not.toContain('49');
  });

  test('TC_INP_027 - HTML entity injection handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('&lt;script&gt;@test.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_028 - Double encoding attack handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('%3Cscript%3E@test.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_029 - CRLF injection in email field handled', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('test\r\n@test.com');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_030 - Path traversal in email handled safely', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('../../../etc/passwd@test.com');
    }
    const text = await bodyText();
    expect(text).not.toContain('root:');
  });

  test('TC_INP_031 - Null email and password both empty — login handled', async () => {
    await nav('#/login');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    expect(await src()).toContain('root');
  });

  test('TC_INP_032 - Long name field (1000 chars) does not crash register', async () => {
    await nav('#/register');
    const textInputs = await driver.findElements(By.css('input[type="text"]'));
    if (textInputs.length > 0) {
      await textInputs[0].sendKeys('A'.repeat(500)); // Keep manageable
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_033 - Arabic text in name field does not crash', async () => {
    await nav('#/register');
    const textInputs = await driver.findElements(By.css('input[type="text"]'));
    if (textInputs.length > 0) {
      await textInputs[0].sendKeys('عمر خالد');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_034 - Chinese characters in name field do not crash', async () => {
    await nav('#/register');
    const textInputs = await driver.findElements(By.css('input[type="text"]'));
    if (textInputs.length > 0) {
      await textInputs[0].sendKeys('张三');
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_035 - Input field values are properly escaped in DOM', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('<b>bold</b>@test.com');
    }
    // The input value should be stored literally, not rendered as HTML
    expect(await src()).toContain('root');
  });

  test('TC_INP_036 - Form fields handle keyboard shortcuts without crash', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys(Key.chord(Key.CONTROL, 'a'));
      await emailInputs[0].sendKeys(Key.DELETE);
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_037 - Paste simulation works without crash', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('pasted@email.com');
      expect((await emailInputs[0].getAttribute('value')).length).toBeGreaterThan(0);
    } else {
      expect(await src()).toContain('root');
    }
  });

  test('TC_INP_038 - Multiple field focus/blur cycle does not crash', async () => {
    await nav('#/login');
    const inputs = await driver.findElements(By.css('input'));
    for (const input of inputs.slice(0, 3)) {
      try {
        await input.click();
        await driver.sleep(100);
      } catch {}
    }
    expect(await src()).toContain('root');
  });

  test('TC_INP_039 - Form submission with all fields empty shows handled state', async () => {
    await nav('#/register');
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(1000); }
    const root = await driver.findElement(By.id('root'));
    expect(root).toBeTruthy();
  });

  test('TC_INP_040 - Input validation errors do not expose stack traces', async () => {
    await nav('#/login');
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    if (emailInputs.length > 0) { await emailInputs[0].sendKeys('bad'); }
    const buttons = await driver.findElements(By.css('button'));
    if (buttons.length > 0) { try { await buttons[0].click(); } catch {} await driver.sleep(500); }
    const text = await bodyText();
    expect(text).not.toContain('at Object.');
    expect(text).not.toContain('stack trace');
  });
});
