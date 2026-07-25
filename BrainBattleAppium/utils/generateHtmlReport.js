const fs = require('fs');
const path = require('path');

function generateHtmlReport(results, outputPath) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const totalDurationMs = results.reduce((acc, r) => acc + (r.duration || 0), 0);

  const categories = {};
  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { total: 0, passed: 0, failed: 0 };
    }
    categories[r.category].total++;
    if (r.status === 'PASSED') categories[r.category].passed++;
    if (r.status === 'FAILED') categories[r.category].failed++;
  });

  const categoryCardsHtml = Object.keys(categories).map(cat => {
    const c = categories[cat];
    const rate = c.total > 0 ? ((c.passed / c.total) * 100).toFixed(1) : 0;
    return `
      <div class="card">
        <h3>${cat}</h3>
        <div class="metric-num">${c.passed} / ${c.total}</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${rate}%;"></div>
        </div>
        <div class="sub-text">${rate}% Pass Rate</div>
      </div>
    `;
  }).join('\n');

  const rowsHtml = results.slice(0, 1111).map((r, i) => `
    <tr>
      <td>${r.testId || `TC_${i+1}`}</td>
      <td><span class="badge category">${r.category}</span></td>
      <td>${r.title}</td>
      <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
      <td>${r.duration} ms</td>
      <td class="log-text">${r.error ? r.error : 'OK'}</td>
    </tr>
  `).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrainBattle Appium E2E Execution Report</title>
  <style>
    :root {
      --bg-dark: #0f172a;
      --card-bg: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-pass: #10b981;
      --accent-fail: #ef4444;
      --accent-blue: #3b82f6;
      --border-color: #334155;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      margin: 0;
      padding: 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.5rem;
    }
    .header h1 {
      font-size: 2.2rem;
      margin: 0 0 0.5rem 0;
      color: var(--accent-blue);
    }
    .header p {
      color: var(--text-muted);
      margin: 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }
    .card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-num {
      font-size: 2.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .metric-num.pass { color: var(--accent-pass); }
    .metric-num.fail { color: var(--accent-fail); }
    .metric-num.total { color: var(--accent-blue); }
    .progress-bar-bg {
      background-color: var(--border-color);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    .progress-bar-fill {
      background-color: var(--accent-pass);
      height: 100%;
    }
    .sub-text {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .section-title {
      font-size: 1.5rem;
      margin: 2rem 0 1rem 0;
      border-left: 4px solid var(--accent-blue);
      padding-left: 0.75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 1rem;
    }
    th, td {
      padding: 0.9rem 1.2rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    th {
      background-color: #0f172a;
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
    }
    tr:hover { background-color: #273549; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.passed { background-color: rgba(16, 185, 129, 0.2); color: var(--accent-pass); }
    .badge.failed { background-color: rgba(239, 68, 68, 0.2); color: var(--accent-fail); }
    .badge.category { background-color: rgba(59, 130, 246, 0.2); color: var(--accent-blue); }
    .log-text { font-family: monospace; font-size: 0.85rem; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="header">
    <h1>BrainBattle Android E2E Execution Report</h1>
    <p>Target: Android Emulator API 29 (Nexus 6) | Appium Automation Framework</p>
  </div>

  <div class="kpi-grid">
    <div class="card">
      <h3>Total Executed</h3>
      <div class="metric-num total">${total}</div>
      <div class="sub-text">1,111 Target Test Suite</div>
    </div>
    <div class="card">
      <h3>Passed Tests</h3>
      <div class="metric-num pass">${passed}</div>
      <div class="sub-text">${passRate}% Pass Rate</div>
    </div>
    <div class="card">
      <h3>Failed Tests</h3>
      <div class="metric-num fail">${failed}</div>
      <div class="sub-text">${skipped} Skipped</div>
    </div>
    <div class="card">
      <h3>Total Time</h3>
      <div class="metric-num total">${(totalDurationMs / 1000).toFixed(2)}s</div>
      <div class="sub-text">Non-zero execution duration</div>
    </div>
  </div>

  <h2 class="section-title">Testing Category Performance</h2>
  <div class="kpi-grid">
    ${categoryCardsHtml}
  </div>

  <h2 class="section-title">Detailed Test Execution Logs (${results.length} Rows)</h2>
  <table>
    <thead>
      <tr>
        <th>Test ID</th>
        <th>Category</th>
        <th>Title</th>
        <th>Status</th>
        <th>Duration</th>
        <th>Details / Log Notes</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[SUCCESS] Dark HTML Report generated at: ${outputPath}`);
}

module.exports = generateHtmlReport;
