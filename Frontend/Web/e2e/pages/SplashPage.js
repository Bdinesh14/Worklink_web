/**
 * SplashPage.js — Page Object for WorkLink Splash / Landing Page
 * URL: BASE_URL/#/
 */
const { By, until } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class SplashPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.rootLocator = By.id('root');
    this.bodyLocator = By.css('body');
    this.getStartedLocator = By.css('button, a[href*="onboarding"], a[href*="login"]');
  }

  async navigate() {
    await this.driver.get(this.baseUrl);
    await this.driver.wait(until.elementLocated(this.rootLocator), 15000);
  }

  async waitForLoad() {
    await this.driver.wait(until.elementLocated(this.rootLocator), 15000);
  }

  async getPageTitle() {
    return await this.driver.getTitle();
  }

  async getBodyText() {
    const body = await this.driver.findElement(this.bodyLocator);
    return await body.getText();
  }

  async getPageSource() {
    return await this.driver.getPageSource();
  }

  async isRootPresent() {
    try {
      await this.driver.wait(until.elementLocated(this.rootLocator), 8000);
      return true;
    } catch {
      return false;
    }
  }

  async isAppRendered() {
    const src = await this.driver.getPageSource();
    return src.includes('root') && src.length > 500;
  }
}

module.exports = SplashPage;
