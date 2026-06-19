/**
 * RoleSelectionPage.js — Page Object for WorkLink Role Selection Page
 * URL: BASE_URL/#/select-role
 */
const { By, until } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class RoleSelectionPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.url = `${this.baseUrl}/#/select-role`;
    this.rootLocator = By.id('root');
    this.workerCardLocator = By.css('[data-role="worker"], .role-card, button');
    this.hirerCardLocator = By.css('[data-role="hirer"], .role-card, button');
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.rootLocator), 15000);
  }

  async isLoaded() {
    const src = await this.driver.getPageSource();
    return src.includes('root');
  }

  async getPageSource() { return await this.driver.getPageSource(); }
  async getCurrentUrl() { return await this.driver.getCurrentUrl(); }
  async getTitle() { return await this.driver.getTitle(); }

  async hasRoleOptions() {
    const src = await this.driver.getPageSource();
    return src.includes('root') && src.length > 500;
  }
}

module.exports = RoleSelectionPage;
