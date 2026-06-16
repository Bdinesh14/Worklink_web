const fs = require('fs-extra');
const path = require('path');

// Ensure output directories exist before tests start
const resultsDir = path.join(__dirname, 'Test Results');
fs.ensureDirSync(path.join(resultsDir, 'HTML'));
fs.ensureDirSync(path.join(resultsDir, 'Excel'));
fs.ensureDirSync(path.join(resultsDir, 'Screenshots'));
fs.ensureDirSync(path.join(resultsDir, 'Logs'));
fs.ensureDirSync(path.join(resultsDir, 'Summary'));
