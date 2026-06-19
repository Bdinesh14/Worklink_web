/**
 * ForgotPasswordPage.js — Page Object for WorkLink Forgot Password Page
 * URL: BASE_URL/#/forgot-password
 */
const { By, until } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ForgotPasswordPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.url = `${this.baseUrl}/#/forgot-password`;
    this.rootLocator = By.id('root');
    this.emailLocator = By.css('input[type="email"], input[id="email"], input[name="email"]');
    this.submitLocator = By.css('button[type="submit"], button');
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.rootLocator), 15000);
  }

  async isLoaded() {
    const src = await this.driver.getPageSource();
    return src.includes('root');
  }

  async hasEmailField() {
    try {
      await this.driver.wait(until.elementLocated(this.emailLocator), 8000);
      return true;
    } catch { return false; }
  }

  async hasSubmitButton() {
    try {
      await this.driver.wait(until.elementLocated(this.submitLocator), 8000);
      return true;
    } catch { return false; }
  }

  async getPageSource() { return await this.driver.getPageSource(); }
  async getCurrentUrl() { return await this.driver.getCurrentUrl(); }
  async getTitle() { return await this.driver.getTitle(); }
}

module.exports = ForgotPasswordPage;
