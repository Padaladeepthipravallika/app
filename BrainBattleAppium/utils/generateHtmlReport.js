const fs = require('fs');
const path = require('path');

function generateHtmlReport(results, outputPath) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

  const categoryMap = {};
  results.forEach(r => {
    if (!categoryMap[r.category]) {
      categoryMap[r.category] = { total: 0, pass: 0, fail: 0 };
    }
    categoryMap[r.category].total++;
    if (r.status === 'PASS') categoryMap[r.category].pass++;
    else categoryMap[r.category].fail++;
  });

  const catRowsHtml = Object.keys(categoryMap).map(cat => {
    const info = categoryMap[cat];
    const rate = ((info.pass / info.total) * 100).toFixed(1);
    const badge = info.fail === 0 ? '<span class="badge pass">READY (YES)</span>' : '<span class="badge fail">ATTENTION NEEDED</span>';
    return `
      <tr>
        <td><strong>${cat}</strong></td>
        <td class="text-center">${info.total}</td>
        <td class="text-center text-success">${info.pass}</td>
        <td class="text-center text-danger">${info.fail}</td>
        <td class="text-center">${rate}%</td>
        <td class="text-center">${badge}</td>
      </tr>
    `;
  }).join('');

  const detailRowsHtml = results.slice(0, 100).map(r => `
    <tr>
      <td><code>${r.id}</code></td>
      <td>${r.category}</td>
      <td>${r.name}</td>
      <td class="text-center">${r.duration} ms</td>
      <td class="text-center"><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vulnera Android Mobile Appium Execution Report</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --success: #22c55e;
      --danger: #ef4444;
      --accent: #6366f1;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      padding: 24px 32px;
      border-radius: 12px;
      border: 1px solid #4338ca;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 26px;
      color: #fff;
    }
    .header p {
      margin: 0;
      color: #a5b4fc;
      font-size: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      text-align: center;
    }
    .stat-val {
      font-size: 32px;
      font-weight: 700;
      margin: 8px 0 4px 0;
    }
    .stat-label {
      color: var(--muted);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    .text-center { text-align: center; }
    
    .section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section h2 {
      margin-top: 0;
      font-size: 18px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 14px;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background-color: #0f172a;
      color: var(--muted);
      font-weight: 600;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
    .badge.pass { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
    .badge.fail { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 Vulnera Android Mobile Appium E2E Execution Report</h1>
      <p>Automated Mobile Appium Test Suite • 1,111 Unique Test Cases • Android API 29 Emulator</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Test Cases</div>
        <div class="stat-val">${total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Passed</div>
        <div class="stat-val text-success">${passed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Failed</div>
        <div class="stat-val text-danger">${failed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pass Rate</div>
        <div class="stat-val text-success">${passRate}%</div>
      </div>
    </div>

    <div class="section">
      <h2>📊 Category Breakdown (11 Mobile Categories)</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th class="text-center">Total</th>
            <th class="text-center">Passed</th>
            <th class="text-center">Failed</th>
            <th class="text-center">Pass Rate</th>
            <th class="text-center">Deployable Status</th>
          </tr>
        </thead>
        <tbody>
          ${catRowsHtml}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>📋 Sample Executed Test Cases (First 100)</h2>
      <table>
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Category</th>
            <th>Test Name / Description</th>
            <th class="text-center">Duration</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${detailRowsHtml}
        </tbody>
      </table>
      <p style="color: var(--muted); margin-top: 12px; font-size: 13px;">Full 1,111 test case breakdown is exported in the downloadable <code>.xlsx</code> Excel Report artifact.</p>
    </div>
  </div>
</body>
</html>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`[SUCCESS] HTML Report generated at: ${outputPath}`);
}

module.exports = generateHtmlReport;
