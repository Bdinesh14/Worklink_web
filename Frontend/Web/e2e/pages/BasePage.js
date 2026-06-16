const { until } = require('selenium-webdriver');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(url) {
    await this.driver.get(url);
  }

  async waitForElement(locator, timeout = 10000) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async click(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el), 10000);
    await el.click();
  }

  async type(locator, text) {
    const el = await this.waitForElement(locator);
    await this.driver.wait(until.elementIsVisible(el), 10000);
    await el.sendKeys(text);
  }

  async getText(locator) {
    const el = await this.waitForElement(locator);
    return await el.getText();
  }

  async getTitle() {
    return await this.driver.getTitle();
  }
}

module.exports = BasePage;
