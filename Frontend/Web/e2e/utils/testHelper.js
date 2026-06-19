/**
 * testHelper.js — Shared driver factory, screenshot, and logger utilities
 * Used by all e2e spec files.
 */
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs-extra');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '../Test Results/Screenshots');
const LOG_DIR = path.join(__dirname, '../Test Results/Logs');

fs.ensureDirSync(SCREENSHOT_DIR);
fs.ensureDirSync(LOG_DIR);

async function buildDriver() {
  const options = new chrome.Options();
  options.addArguments(
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync'
  );
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  await driver.manage().setTimeouts({ implicit: 8000, pageLoad: 30000 });
  return driver;
}

async function takeScreenshot(driver, name) {
  try {
    const image = await driver.takeScreenshot();
    const safe = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().slice(0, 80);
    const file = path.join(SCREENSHOT_DIR, `${safe}-${Date.now()}.png`);
    fs.writeFileSync(file, image, 'base64');
  } catch (e) {
    // Screenshot failure is non-fatal
  }
}

function logStep(message) {
  const logFile = path.join(LOG_DIR, 'execution.log');
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try { fs.appendFileSync(logFile, line); } catch {}
  console.log(message);
}

async function waitForRoot(driver, timeout = 15000) {
  const { By, until } = require('selenium-webdriver');
  await driver.wait(until.elementLocated(By.id('root')), timeout);
}

async function navigateTo(driver, hash) {
  await driver.get(`${BASE_URL}/${hash}`);
  await waitForRoot(driver);
}

async function getPageSource(driver) {
  return await driver.getPageSource();
}

async function getCurrentUrl(driver) {
  return await driver.getCurrentUrl();
}

module.exports = {
  BASE_URL,
  buildDriver,
  takeScreenshot,
  logStep,
  waitForRoot,
  navigateTo,
  getPageSource,
  getCurrentUrl,
};
