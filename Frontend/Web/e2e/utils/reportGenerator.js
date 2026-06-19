/**
 * reportGenerator.js — Enhanced Report Generator
 * Reads Jest JSON results and produces:
 *   - Test Results/Excel/Automation_Test_Report.xlsx  (6 sheets)
 *   - Test Results/Excel/Passed_Test_Cases.xlsx
 *   - Test Results/Excel/Failed_Test_Cases.xlsx
 *   - Test Results/Excel/Execution_Summary.xlsx
 *   - Test Results/Summary/summary.md
 *   - Test Results/JSON/execution-results.json
 */

const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const path = require('path');

const RESULTS_JSON = path.join(__dirname, '../jest-results.json');
const EXCEL_DIR   = path.join(__dirname, '../Test Results/Excel');
const SUMMARY_DIR = path.join(__dirname, '../Test Results/Summary');
const JSON_DIR    = path.join(__dirname, '../Test Results/JSON');

[EXCEL_DIR, SUMMARY_DIR, JSON_DIR].forEach(d => fs.ensureDirSync(d));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function styleHeader(row, hex = 'FF1E3A5F') {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } };
  });
  row.height = 22;
}

function colorStatus(cell, status) {
  if (status === 'passed') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    cell.font = { bold: true, color: { argb: 'FF155724' } };
    cell.value = '✅ PASSED';
  } else if (status === 'failed') {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
    cell.font = { bold: true, color: { argb: 'FF721C24' } };
    cell.value = '❌ FAILED';
  } else {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    cell.font = { bold: true, color: { argb: 'FF856404' } };
    cell.value = '⏭ SKIPPED';
  }
}

function extractModule(suiteName, testName) {
  const name = testName || '';
  if (name.includes('TC_AUTH_')) return 'Authentication';
  if (name.includes('TC_AUTHZ_')) return 'Authorization';
  if (name.includes('TC_NAV_')) return 'Navigation';
  if (name.includes('TC_UI_')) return 'UI Validation';
  if (name.includes('TC_FORM_')) return 'Forms';
  if (name.includes('TC_CRUD_')) return 'CRUD Operations';
  if (name.includes('TC_INP_')) return 'Input Validation';
  if (name.includes('TC_ERR_')) return 'Error Handling';
  if (name.includes('TC_SESS_')) return 'Session Management';
  if (name.includes('TC_FILE_')) return 'File Upload';
  if (name.includes('TC_ACC_')) return 'Accessibility';
  if (name.includes('TC_RESP_')) return 'Responsive Design';
  if (name.includes('TC_PERF_')) return 'Performance';
  if (name.includes('TC_REG_')) return 'Regression';
  return suiteName || 'General';
}

function extractPriority(testName) {
  if (!testName) return 'Medium';
  if (testName.includes('TC_AUTH_') || testName.includes('TC_AUTHZ_')) return 'Critical';
  if (testName.includes('TC_REG_') || testName.includes('TC_SESS_')) return 'High';
  if (testName.includes('TC_PERF_') || testName.includes('TC_RESP_')) return 'Low';
  return 'Medium';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function generate() {
  let results;
  if (!fs.existsSync(RESULTS_JSON)) {
    console.warn('⚠ jest-results.json not found. Generating placeholder report.');
    results = { numTotalTests: 0, numPassedTests: 0, numFailedTests: 0, numPendingTests: 0, testResults: [] };
  } else {
    results = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf-8'));
  }

  const {
    numTotalTests   = 0,
    numPassedTests  = 0,
    numFailedTests  = 0,
    numPendingTests = 0,
    testResults     = []
  } = results;

  const numSkipped = numTotalTests - numPassedTests - numFailedTests;
  const passRate   = numTotalTests > 0 ? ((numPassedTests / numTotalTests) * 100).toFixed(2) : '0.00';
  const executionDate = new Date().toISOString();
  const baseUrl = process.env.BASE_URL || 'N/A';
  const buildNum = process.env.GITHUB_RUN_NUMBER || 'local';
  const gitCommit = process.env.GITHUB_SHA || 'N/A';
  const branch = process.env.GITHUB_REF_NAME || 'N/A';

  // Flatten test cases
  const testCases = [];
  for (const suite of testResults) {
    for (const test of suite.testResults || []) {
      const suiteName = suite.testFilePath ? path.basename(suite.testFilePath, '.spec.js') : 'Unknown';
      testCases.push({
        id: (test.fullName || test.title || '').split(' - ')[0] || 'TC_???',
        module: extractModule(suiteName, test.fullName || test.title),
        name: test.fullName || test.title || 'Unknown Test',
        priority: extractPriority(test.fullName || test.title),
        status: test.status || 'unknown',
        duration: `${((test.duration || 0) / 1000).toFixed(2)}s`,
        durationMs: test.duration || 0,
        error: (test.failureMessages || []).join('\n').slice(0, 500) || '',
        suite: suiteName,
      });
    }
  }

  const passed  = testCases.filter(t => t.status === 'passed');
  const failed  = testCases.filter(t => t.status === 'failed');
  const skipped = testCases.filter(t => t.status !== 'passed' && t.status !== 'failed');

  // ── Module breakdown ───────────────────────────────────────────────────────
  const modules = {};
  testCases.forEach(tc => {
    if (!modules[tc.module]) modules[tc.module] = { total: 0, passed: 0, failed: 0 };
    modules[tc.module].total++;
    if (tc.status === 'passed') modules[tc.module].passed++;
    else if (tc.status === 'failed') modules[tc.module].failed++;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL WORKBOOK 1: Automation_Test_Report.xlsx (6 sheets)
  // ═══════════════════════════════════════════════════════════════════════════
  const wb1 = new ExcelJS.Workbook();
  wb1.creator = 'WorkLink CI/CD Pipeline';
  wb1.created = new Date();

  // Sheet 1: All Test Cases
  const s1 = wb1.addWorksheet('All Test Cases');
  s1.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 60 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Error', key: 'error', width: 60 },
  ];
  styleHeader(s1.getRow(1), 'FF1E3A5F');
  testCases.forEach(tc => {
    const row = s1.addRow(tc);
    colorStatus(row.getCell('status'), tc.status);
    row.alignment = { wrapText: true, vertical: 'top' };
  });

  // Sheet 2: Passed Tests
  const s2 = wb1.addWorksheet('Passed Tests');
  s2.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 60 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Duration', key: 'duration', width: 12 },
  ];
  styleHeader(s2.getRow(1), 'FF155724');
  passed.forEach(tc => { s2.addRow(tc).alignment = { wrapText: true, vertical: 'top' }; });

  // Sheet 3: Failed Tests
  const s3 = wb1.addWorksheet('Failed Tests');
  s3.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 60 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Failure Reason', key: 'error', width: 80 },
  ];
  styleHeader(s3.getRow(1), 'FF721C24');
  if (failed.length === 0) {
    s3.addRow({ id: 'N/A', module: 'N/A', name: '✅ No failed tests', priority: 'N/A', duration: 'N/A', error: '' });
  } else {
    failed.forEach(tc => { s3.addRow(tc).alignment = { wrapText: true, vertical: 'top' }; });
  }

  // Sheet 4: Skipped Tests
  const s4 = wb1.addWorksheet('Skipped Tests');
  s4.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 60 },
  ];
  styleHeader(s4.getRow(1), 'FF856404');
  if (skipped.length === 0) {
    s4.addRow({ id: 'N/A', module: 'N/A', name: '✅ No skipped tests' });
  } else {
    skipped.forEach(tc => s4.addRow(tc));
  }

  // Sheet 5: Execution Metrics
  const s5 = wb1.addWorksheet('Execution Metrics');
  s5.columns = [{ key: 'k', width: 30 }, { key: 'v', width: 50 }];
  const metrics = [
    ['Execution Date', executionDate],
    ['Deployment URL', baseUrl],
    ['Build Number', buildNum],
    ['Git Commit', gitCommit],
    ['Branch', branch],
    ['Total Tests', numTotalTests],
    ['Passed', numPassedTests],
    ['Failed', numFailedTests],
    ['Skipped', numSkipped],
    ['Pass Rate', `${passRate}%`],
    ['Total Duration', `${(testCases.reduce((a,t) => a + t.durationMs, 0)/1000).toFixed(2)}s`],
  ];
  s5.addRow(['Metric', 'Value']);
  styleHeader(s5.getRow(1), 'FF1E3A5F');
  metrics.forEach(([k, v]) => {
    const row = s5.addRow({ k, v });
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  });

  // Sheet 6: Module Breakdown
  const s6 = wb1.addWorksheet('Module Breakdown');
  s6.columns = [
    { header: 'Module', key: 'module', width: 25 },
    { header: 'Total', key: 'total', width: 10 },
    { header: 'Passed', key: 'passed', width: 10 },
    { header: 'Failed', key: 'failed', width: 10 },
    { header: 'Pass Rate', key: 'rate', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  styleHeader(s6.getRow(1), 'FF1E3A5F');
  Object.entries(modules).forEach(([mod, data]) => {
    const rate = data.total > 0 ? ((data.passed/data.total)*100).toFixed(1)+'%' : '0%';
    const row = s6.addRow({ module: mod, total: data.total, passed: data.passed, failed: data.failed, rate, status: data.failed === 0 ? '✅ PASS' : '❌ FAIL' });
    row.getCell('status').font = { bold: true, color: { argb: data.failed === 0 ? 'FF155724' : 'FF721C24' } };
  });

  await wb1.xlsx.writeFile(path.join(EXCEL_DIR, 'Automation_Test_Report.xlsx'));
  console.log('✅ Automation_Test_Report.xlsx written');

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL WORKBOOK 2: Passed_Test_Cases.xlsx
  // ═══════════════════════════════════════════════════════════════════════════
  const wb2 = new ExcelJS.Workbook();
  const ws2 = wb2.addWorksheet('Passed Test Cases');
  ws2.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 60 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Duration', key: 'duration', width: 12 },
  ];
  styleHeader(ws2.getRow(1), 'FF155724');
  passed.forEach(tc => ws2.addRow(tc));
  await wb2.xlsx.writeFile(path.join(EXCEL_DIR, 'Passed_Test_Cases.xlsx'));
  console.log('✅ Passed_Test_Cases.xlsx written');

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL WORKBOOK 3: Failed_Test_Cases.xlsx
  // ═══════════════════════════════════════════════════════════════════════════
  const wb3 = new ExcelJS.Workbook();
  const ws3 = wb3.addWorksheet('Failed Test Cases');
  ws3.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Test Name', key: 'name', width: 60 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Duration', key: 'duration', width: 12 },
    { header: 'Failure Reason', key: 'error', width: 80 },
  ];
  styleHeader(ws3.getRow(1), 'FF721C24');
  if (failed.length === 0) {
    ws3.addRow({ id: 'N/A', module: 'N/A', name: '✅ All tests passed — no failures!', priority: 'N/A', duration: 'N/A', error: '' });
  } else {
    failed.forEach(tc => ws3.addRow(tc));
  }
  await wb3.xlsx.writeFile(path.join(EXCEL_DIR, 'Failed_Test_Cases.xlsx'));
  console.log('✅ Failed_Test_Cases.xlsx written');

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL WORKBOOK 4: Execution_Summary.xlsx
  // ═══════════════════════════════════════════════════════════════════════════
  const wb4 = new ExcelJS.Workbook();
  const ws4 = wb4.addWorksheet('Execution Summary');
  ws4.columns = [{ key: 'k', width: 30 }, { key: 'v', width: 50 }];
  ws4.addRow(['Metric', 'Value']);
  styleHeader(ws4.getRow(1), 'FF1E3A5F');
  metrics.forEach(([k, v]) => {
    const row = ws4.addRow({ k, v });
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  });
  await wb4.xlsx.writeFile(path.join(EXCEL_DIR, 'Execution_Summary.xlsx'));
  console.log('✅ Execution_Summary.xlsx written');

  // ═══════════════════════════════════════════════════════════════════════════
  // JSON RESULTS
  // ═══════════════════════════════════════════════════════════════════════════
  const jsonReport = {
    metadata: { executionDate, baseUrl, buildNum, gitCommit, branch },
    summary: { total: numTotalTests, passed: numPassedTests, failed: numFailedTests, skipped: numSkipped, passRate: parseFloat(passRate) },
    modules,
    testCases,
  };
  fs.writeFileSync(path.join(JSON_DIR, 'execution-results.json'), JSON.stringify(jsonReport, null, 2));
  console.log('✅ execution-results.json written');

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY.MD
  // ═══════════════════════════════════════════════════════════════════════════
  const passedList = passed.slice(0, 50).map(t => `✅ ${t.id} — ${t.name.slice(0, 80)}`).join('\n') || '- None';
  const failedList = failed.map(t => `❌ **${t.id}** — ${t.name.slice(0, 80)}\n  - Reason: ${t.error.split('\n')[0].slice(0, 120)}`).join('\n') || '- None';
  const skippedList = skipped.map(t => `⏭ ${t.id} — ${t.name.slice(0, 80)}`).join('\n') || '- None';

  const moduleTable = Object.entries(modules)
    .map(([mod, d]) => `| ${mod} | ${d.total} | ${d.passed} | ${d.failed} | ${d.total > 0 ? ((d.passed/d.total)*100).toFixed(1) : 0}% |`)
    .join('\n');

  const md = `# 🚀 WorkLink Live E2E Execution Summary

**Execution Date:** ${executionDate}
**Deployment URL:** ${baseUrl}
**Build Number:** #${buildNum}
**Branch:** ${branch}
**Commit:** ${gitCommit}

## 📊 Execution Metrics

| Metric | Value |
|---|---|
| Total Tests | **${numTotalTests}** |
| ✅ Passed | **${numPassedTests}** |
| ❌ Failed | **${numFailedTests}** |
| ⏭ Skipped | **${numSkipped}** |
| Pass Rate | **${passRate}%** |
| Total Duration | ${(testCases.reduce((a,t) => a + t.durationMs, 0)/1000).toFixed(2)}s |

## 📁 Module Breakdown

| Module | Total | Passed | Failed | Pass Rate |
|---|---|---|---|---|
${moduleTable}

## ✅ Sample Passed Tests (first 50)

${passedList}

## ❌ Failed Tests

${failedList}

## ⏭ Skipped Tests

${skippedList}

---
*Report generated automatically by WorkLink CI/CD Pipeline — ${executionDate}*
`;

  fs.writeFileSync(path.join(SUMMARY_DIR, 'summary.md'), md);
  console.log('✅ summary.md written');

  console.log(`\n📊 Report Summary:`);
  console.log(`   Total: ${numTotalTests} | Passed: ${numPassedTests} | Failed: ${numFailedTests} | Pass Rate: ${passRate}%`);
}

generate().catch(err => {
  console.error('❌ Report generation failed:', err);
  process.exit(1);
});
