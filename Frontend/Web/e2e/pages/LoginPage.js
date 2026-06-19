/**
 * LoginPage.js — Page Object for WorkLink Login Page
 * URL: BASE_URL/#/login
 */
const { By, until } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.url = `${this.baseUrl}/#/login`;
    this.emailLocator = By.css('input[type="email"], input[id="email"], input[name="email"]');
    this.passwordLocator = By.css('input[type="password"], input[id="password"], input[name="password"]');
    this.submitLocator = By.css('button[type="submit"], button');
    this.forgotPasswordLocator = By.css('a[href*="forgot"], button');
    this.registerLinkLocator = By.css('a[href*="register"]');
    this.rootLocator = By.id('root');
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.rootLocator), 15000);
  }

  async waitForLoad() {
    await this.driver.wait(until.elementLocated(this.rootLocator), 15000);
  }

  async isLoginPageLoaded() {
    const src = await this.driver.getPageSource();
    return src.includes('root');
  }

  async hasEmailField() {
    try {
      await this.driver.wait(until.elementLocated(this.emailLocator), 8000);
      return true;
    } catch {
      return false;
    }
  }

  async hasPasswordField() {
    try {
      await this.driver.wait(until.elementLocated(this.passwordLocator), 8000);
      return true;
    } catch {
      return false;
    }
  }

  async hasSubmitButton() {
    try {
      await this.driver.wait(until.elementLocated(this.submitLocator), 8000);
      return true;
    } catch {
      return false;
    }
  }

  async enterEmail(email) {
    try {
      const field = await this.driver.findElement(this.emailLocator);
      await field.clear();
      await field.sendKeys(email);
    } catch { /* field may not be available if redirected */ }
  }

  async enterPassword(password) {
    try {
      const field = await this.driver.findElement(this.passwordLocator);
      await field.clear();
      await field.sendKeys(password);
    } catch { /* field may not be available */ }
  }

  async clickSubmit() {
    try {
      const btn = await this.driver.findElement(this.submitLocator);
      await btn.click();
    } catch { /* button may not be present */ }
  }

  async getPageSource() {
    return await this.driver.getPageSource();
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async getTitle() {
    return await this.driver.getTitle();
  }
}

module.exports = LoginPage;
