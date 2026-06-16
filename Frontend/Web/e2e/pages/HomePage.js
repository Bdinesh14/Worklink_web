const BasePage = require('./BasePage');
const { By } = require('selenium-webdriver');

class HomePage extends BasePage {
  constructor(driver) {
    super(driver);
    // You can define standard locators here depending on your React App structure
    this.locators = {
      // Example locators
      rootDiv: By.id('root'),
      heading: By.css('h1, h2'), 
    };
  }

  async load(baseUrl) {
    await this.navigateTo(baseUrl);
  }

  async isAppLoaded() {
    const root = await this.waitForElement(this.locators.rootDiv);
    return root !== null;
  }
}

module.exports = HomePage;
