module.exports = {
  testEnvironment: "node",
  testTimeout: 120000,       // 2 minutes per test (Selenium on live URL)
  runInBand: true,           // Run tests serially — required for Selenium session
  testMatch: ["**/tests/**/*.spec.js"],
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "WorkLink E2E Test Report — 470+ Test Cases",
        outputPath: "Test Results/HTML/execution-report.html",
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: false,
        theme: "darkTheme",
        sort: "status"
      }
    ]
  ],
  setupFilesAfterEnv: ["./jest.setup.js"]
};
