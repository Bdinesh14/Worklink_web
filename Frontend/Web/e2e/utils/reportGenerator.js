/**
 * reportGenerator.js
 * Reads Jest's JSON results output and generates:
 *  - Test Results/Excel/Automation_Test_Report.xlsx
 *  - Test Results/Summary/summary.md
 */

const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const path = require('path');

const RESULTS_JSON = path.join(__dirname, '../jest-results.json');
const EXCEL_DIR = path.join(__dirname, '../Test Results/Excel');
const SUMMARY_DIR = path.join(__dirname, '../Test Results/Summary');

fs.ensureDirSync(EXCEL_DIR);
fs.ensureDirSync(SUMMARY_DIR);

async function generate() {
  // ── Load Jest JSON results ────────────────────────────────────────────────
  let results;
  if (!fs.existsSync(RESULTS_JSON)) {
    console.warn('⚠ jest-results.json not found. Generating empty report.');
    results = { numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, testResults: [] };
  } else {
    results = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf-8'));
  }

  const { numTotalTests, numPassedTests, numFailedTests, testResults } = results;
  const numSkipped = numTotalTests - numPassedTests - numFailedTests;
  const passRate = numTotalTests > 0 ? ((numPassedTests / numTotalTests) * 100).toFixed(2) : '0.00';
  const executionDate = new Date().toISOString();
  const baseUrl = process.env.BASE_URL || 'N/A';

  // ── Flatten individual test cases ─────────────────────────────────────────
  const testCases = [];
  for (const suite of testResults || []) {
    for (const test of suite.testResults || []) {
      testCases.push({
        suite: suite.testFilePath ? path.basename(suite.testFilePath) : 'Unknown',
        name: test.fullName || test.title,
        status: test.status,
        duration: `${(test.duration || 0).toFixed(0)}ms`,
        error: (test.failureMessages || []).join('\n').slice(0, 500) || '',
      });
    }
  }

  // ── Generate Excel ─────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WorkLink CI/CD Pipeline';
  workbook.created = new Date();

  // ── Sheet 1: Test Results ─────────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Test Results');
  sheet1.columns = [
    { header: 'Test Suite', key: 'suite', width: 25 },
    { header: 'Test Name', key: 'name', width: 55 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Error / Failure Reason', key: 'error', width: 60 },
  ];
  // Style header row
  sheet1.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } };
  });
  for (const tc of testCases) {
    const row = sheet1.addRow(tc);
    const statusCell = row.getCell('status');
    if (tc.status === 'passed') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
      statusCell.font = { bold: true, color: { argb: 'FF155724' } };
    } else if (tc.status === 'failed') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
      statusCell.font = { bold: true, color: { argb: 'FF721C24' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
      statusCell.font = { bold: true, color: { argb: 'FF856404' } };
    }
    row.alignment = { wrapText: true, vertical: 'top' };
  }

  // ── Sheet 2: Summary ──────────────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Execution Summary');
  const summaryData = [
    ['Execution Date', executionDate],
    ['Deployment URL', baseUrl],
    ['Total Tests', numTotalTests],
    ['Passed', numPassedTests],
    ['Failed', numFailedTests],
    ['Skipped', numSkipped],
    ['Pass Rate', `${passRate}%`],
  ];
  summaryData.forEach(([label, value]) => {
    const row = sheet2.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  });
  sheet2.getColumn(1).width = 25;
  sheet2.getColumn(2).width = 60;

  // ── Sheet 3: Failed Tests ─────────────────────────────────────────────────
  const sheet3 = workbook.addWorksheet('Failed Tests');
  sheet3.columns = [
    { header: 'Test Name', key: 'name', width: 55 },
    { header: 'Suite', key: 'suite', width: 25 },
    { header: 'Error', key: 'error', width: 80 },
  ];
  sheet3.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC62828' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });
  const failed = testCases.filter(t => t.status === 'failed');
  if (failed.length === 0) {
    sheet3.addRow({ name: '✅ No failed tests', suite: '', error: '' });
  } else {
    for (const t of failed) {
      sheet3.addRow({ name: t.name, suite: t.suite, error: t.error });
    }
  }

  const excelPath = path.join(EXCEL_DIR, 'Automation_Test_Report.xlsx');
  await workbook.xlsx.writeFile(excelPath);
  console.log(`✅ Excel report saved: ${excelPath}`);

  // ── Generate summary.md ───────────────────────────────────────────────────
  const failedList = testCases
    .filter(t => t.status === 'failed')
    .map(t => `- **${t.name}** — ${t.error.split('\n')[0]}`)
    .join('\n') || '- None';

  const md = `# Live GitHub Pages E2E Test Summary

**Execution Date:** ${executionDate}
**Deployment URL:** ${baseUrl}

| Metric | Value |
|---|---|
| Total Tests | ${numTotalTests} |
| ✅ Passed | ${numPassedTests} |
| ❌ Failed | ${numFailedTests} |
| ⏭️ Skipped | ${numSkipped} |
| Pass Rate | ${passRate}% |

## Failed Tests
${failedList}

---
*Report generated automatically by WorkLink CI/CD Pipeline.*
`;

  const summaryPath = path.join(SUMMARY_DIR, 'summary.md');
  fs.writeFileSync(summaryPath, md);
  console.log(`✅ Summary saved: ${summaryPath}`);
}

generate().catch(err => {
  console.error('Report generation failed:', err);
  process.exit(1);
});
