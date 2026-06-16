module.exports = {
  testEnvironment: "node",
  testTimeout: 60000,
  runInBand: true,           // Run tests serially — required for Selenium session sharing
  testMatch: ["**/tests/**/*.spec.js"],
  reporters: [
    "default",
    [
      "jest-html-reporter",
      {
        pageTitle: "WorkLink Live GitHub Pages E2E Test Report",
        outputPath: "Test Results/HTML/execution-report.html",
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
        theme: "darkTheme"
      }
    ]
  ],
  // Write Jest JSON results so reportGenerator.js can build Excel + summary.md
  testResultsProcessor: undefined,
  setupFilesAfterFramework: [],
  setupFilesAfterEnv: ["./jest.setup.js"]
};

