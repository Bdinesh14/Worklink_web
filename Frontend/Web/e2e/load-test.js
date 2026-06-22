/**
 * load-test.js — WorkLink Baseline / Load Test
 *
 * Scenario  : 100 virtual users hitting the WorkLink live site for 1 minute
 * Goal      : Ensure response times stay fast under normal concurrent load
 *
 * Metrics tracked
 *   - Requests per second (RPS)
 *   - Response time  → avg / min / p95 / max
 *   - HTTP error rate (% of non-2xx responses)
 *   - Availability   (% of requests that succeeded)
 *
 * Usage (local):  k6 run load-test.js
 * Usage (CI):     k6 run --out json=results.json load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate    = new Rate('http_error_rate');
const pageLoadTime = new Trend('page_load_time', true);
const successCount = new Counter('successful_requests');
const failCount    = new Counter('failed_requests');

// ── Test configuration ─────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    baseline_load: {
      executor:         'constant-vus',
      vus:              100,        // 100 concurrent virtual users
      duration:         '1m',       // run for exactly 1 minute
    },
  },

  thresholds: {
    // Response time requirements
    http_req_duration:          ['p(95)<3000', 'avg<1500'],  // 95th pct < 3s, avg < 1.5s
    // Error rate requirements
    http_error_rate:            ['rate<0.10'],               // < 10% errors
    // Success rate (checks)
    checks:                     ['rate>0.85'],               // > 85% checks pass
  },

  // Pretty output in CI
  summaryTrendStats: ['min', 'avg', 'med', 'p(95)', 'p(99)', 'max'],
};

// ── Base URL ───────────────────────────────────────────────────────────────────
const BASE_URL = 'https://bdinesh14.github.io/Worklink_web';

// ── Routes to test ─────────────────────────────────────────────────────────────
const ROUTES = [
  { path: '/',               name: 'Splash / Root' },
  { path: '/#/login',        name: 'Login Page' },
  { path: '/#/register',     name: 'Register Page' },
  { path: '/#/select-role',  name: 'Role Selection Page' },
  { path: '/#/onboarding',   name: 'Onboarding Page' },
  { path: '/#/forgot-password', name: 'Forgot Password Page' },
  { path: '/404.html',       name: 'SPA Fallback (404.html)' },
];

// ── Request headers ────────────────────────────────────────────────────────────
const HEADERS = {
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Cache-Control':   'no-cache',
  'User-Agent':      'WorkLink-LoadTest/k6 (CI Baseline Test)',
};

// ── VU default function (runs once per iteration per VU) ──────────────────────
export default function () {
  // Each VU randomly picks a route to spread the load realistically
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];

  group(route.name, () => {
    const startTime = Date.now();
    const res = http.get(`${BASE_URL}${route.path}`, {
      headers: HEADERS,
      timeout: '10s',
    });
    const elapsed = Date.now() - startTime;

    // Record metrics
    pageLoadTime.add(elapsed);

    const ok = check(res, {
      'status is 200 or 304':       (r) => r.status === 200 || r.status === 304,
      'response body is non-empty': (r) => r.body && r.body.length > 100,
      'no server error (5xx)':      (r) => r.status < 500,
      'response time < 5s':         (r) => r.timings.duration < 5000,
    });

    if (ok) {
      successCount.add(1);
      errorRate.add(false);
    } else {
      failCount.add(1);
      errorRate.add(true);
    }
  });

  // Simulate realistic user think-time between requests (0.5–1.5 seconds)
  sleep(0.5 + Math.random());
}

// ── Setup (runs once before VUs start) ────────────────────────────────────────
export function setup() {
  console.log('🚀 WorkLink Baseline Load Test Starting');
  console.log(`   Target: ${BASE_URL}`);
  console.log('   VUs: 100 | Duration: 1 minute');
  console.log('   Routes under test:');
  ROUTES.forEach(r => console.log(`     • ${r.name}`));

  // Pre-flight check
  const res = http.get(`${BASE_URL}/`, { timeout: '15s' });
  if (res.status !== 200) {
    console.warn(`⚠️  Pre-flight check returned ${res.status} — target may be slow`);
  } else {
    console.log('   ✅ Pre-flight check passed');
  }

  return { startedAt: new Date().toISOString() };
}

// ── Teardown (runs once after all VUs finish) ──────────────────────────────────
export function teardown(data) {
  console.log(`\n✅ Load test completed. Started at: ${data.startedAt}`);
}

// ── Custom summary output for GitHub Step Summary ─────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;

  const rps        = metrics.http_reqs          ? metrics.http_reqs.values.rate.toFixed(2)         : 'N/A';
  const avgMs      = metrics.http_req_duration   ? metrics.http_req_duration.values.avg.toFixed(0)  : 'N/A';
  const minMs      = metrics.http_req_duration   ? metrics.http_req_duration.values.min.toFixed(0)  : 'N/A';
  const p95Ms      = metrics.http_req_duration   ? metrics.http_req_duration.values['p(95)'].toFixed(0) : 'N/A';
  const maxMs      = metrics.http_req_duration   ? metrics.http_req_duration.values.max.toFixed(0)  : 'N/A';
  const totalReqs  = metrics.http_reqs           ? metrics.http_reqs.values.count                   : 0;
  const errRate    = metrics.http_error_rate      ? (metrics.http_error_rate.values.rate * 100).toFixed(2) : '0.00';
  const checkRate  = metrics.checks              ? (metrics.checks.values.rate * 100).toFixed(2)    : 'N/A';
  const p95Thresh  = metrics.http_req_duration   ? (metrics.http_req_duration.values['p(95)'] < 3000 ? '✅ PASS' : '❌ FAIL') : '⚠️ N/A';
  const avgThresh  = metrics.http_req_duration   ? (metrics.http_req_duration.values.avg < 1500     ? '✅ PASS' : '❌ FAIL') : '⚠️ N/A';
  const errThresh  = metrics.http_error_rate      ? (metrics.http_error_rate.values.rate < 0.10      ? '✅ PASS' : '❌ FAIL') : '⚠️ N/A';
  const chkThresh  = metrics.checks              ? (metrics.checks.values.rate > 0.85               ? '✅ PASS' : '❌ FAIL') : '⚠️ N/A';

  const overallPass = p95Thresh.includes('✅') && avgThresh.includes('✅') &&
                      errThresh.includes('✅') && chkThresh.includes('✅');
  const overallStatus = overallPass ? '🟢 PASSED' : '🔴 FAILED';

  // ── Markdown report for GitHub Step Summary ──────────────────────────────
  const md = `# ⚡ WorkLink Baseline / Load Test Report

> **100 Virtual Users × 1 Minute** — Baseline concurrency test for WorkLink production deployment.

---

## 🎯 Overall Result: ${overallStatus}

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Total Requests | **${totalReqs}** | — | — |
| Requests / Second | **${rps} req/s** | — | — |
| Avg Response Time | **${avgMs} ms** | < 1,500 ms | ${avgThresh} |
| Min Response Time | **${minMs} ms** | — | — |
| p95 Response Time | **${p95Ms} ms** | < 3,000 ms | ${p95Thresh} |
| Max Response Time | **${maxMs} ms** | — | — |
| HTTP Error Rate | **${errRate}%** | < 10% | ${errThresh} |
| Check Pass Rate | **${checkRate}%** | > 85% | ${chkThresh} |

---

## 📋 Test Configuration

| Parameter | Value |
|---|---|
| Virtual Users (VUs) | **100** |
| Duration | **1 minute** |
| Target | \`https://bdinesh14.github.io/Worklink_web\` |
| Executor | Constant VUs |
| Think Time | 0.5 – 1.5 seconds per VU |

---

## 🌐 Routes Tested

| Route | Description |
|---|---|
| \`/\` | Splash / Root |
| \`/#/login\` | Login Page |
| \`/#/register\` | Register Page |
| \`/#/select-role\` | Role Selection Page |
| \`/#/onboarding\` | Onboarding Page |
| \`/#/forgot-password\` | Forgot Password Page |
| \`/404.html\` | SPA Fallback |

---

## 📊 What the Numbers Mean

| Metric | Your Result | Interpretation |
|---|---|---|
| **${rps} req/s** | Requests per Second | Your API handled ~${rps} requests every second |
| **${avgMs} ms avg** | Average Response | Typical user waits ${avgMs}ms for a page |
| **${minMs} ms min** | Fastest Response | Best case latency |
| **${maxMs} ms max** | Slowest Response | Worst case latency |
| **${p95Ms} ms p95** | 95th Percentile | 95% of users get responses in under ${p95Ms}ms |
| **${errRate}% errors** | Error Rate | ${errRate}% of requests returned errors |

---

## ✅ Threshold Validation

| Check | Threshold | Result |
|---|---|---|
| p95 Response Time | < 3,000 ms | ${p95Thresh} |
| Average Response Time | < 1,500 ms | ${avgThresh} |
| HTTP Error Rate | < 10% | ${errThresh} |
| Check Pass Rate | > 85% | ${chkThresh} |

---

*🤖 Report auto-generated by WorkLink CI/CD — k6 Load Testing Pipeline*
`;

  // Also write a JSON file for downstream processing
  const jsonOutput = JSON.stringify({
    timestamp: new Date().toISOString(),
    vus: 100,
    duration: '1m',
    totalRequests: totalReqs,
    rps: rps,
    responseTime: { avg: avgMs, min: minMs, p95: p95Ms, max: maxMs },
    errorRate: errRate,
    checkRate: checkRate,
    overallStatus: overallPass ? 'PASS' : 'FAIL',
    thresholds: {
      p95: p95Thresh.includes('✅') ? 'PASS' : 'FAIL',
      avg: avgThresh.includes('✅') ? 'PASS' : 'FAIL',
      errorRate: errThresh.includes('✅') ? 'PASS' : 'FAIL',
      checkRate: chkThresh.includes('✅') ? 'PASS' : 'FAIL',
    }
  }, null, 2);

  return {
    'stdout':                  md,
    'load-test-report.md':     md,
    'load-test-results.json':  jsonOutput,
  };
}
