const fs = require('fs');

function generateSummary(results) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) {
    console.log('[INFO] GITHUB_STEP_SUMMARY not set, skipping GitHub Step Summary output.');
    return;
  }

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
  const durationSec = (results.reduce((a, r) => a + (r.duration || 0), 0) / 1000).toFixed(2);

  const markdown = `
### 📱 BrainBattle Android E2E Appium Test Results Summary

| Metric | Result |
| :--- | :--- |
| **Total Test Cases Executed** | **${total}** |
| **Passed Test Cases** | **${passed}** ✅ |
| **Failed Test Cases** | **${failed}** ❌ |
| **Skipped Test Cases** | **${skipped}** ⚠️ |
| **Pass Rate** | **${passRate}%** |
| **Total Test Execution Duration** | **${durationSec}s** |
| **Deployable Status** | **${failed === 0 ? '🟢 APPROVED FOR DEPLOYMENT' : '🔴 DEFERRED'}** |

#### Category Performance
${generateCategoryTable(results)}
`;

  try {
    fs.appendFileSync(summaryFile, markdown, 'utf8');
    console.log('[SUCCESS] Appended results to GITHUB_STEP_SUMMARY.');
  } catch (err) {
    console.error('[ERROR] Failed to write to GITHUB_STEP_SUMMARY:', err);
  }
}

function generateCategoryTable(results) {
  const categories = {};
  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { total: 0, passed: 0, failed: 0 };
    }
    categories[r.category].total++;
    if (r.status === 'PASSED') categories[r.category].passed++;
    if (r.status === 'FAILED') categories[r.category].failed++;
  });

  let table = '| Category | Total | Passed | Failed | Pass Rate |\n| :--- | :---: | :---: | :---: | :---: |\n';
  Object.keys(categories).forEach(cat => {
    const c = categories[cat];
    const rate = c.total > 0 ? ((c.passed / c.total) * 100).toFixed(1) : 0;
    table += `| ${cat} | ${c.total} | ${c.passed} | ${c.failed} | ${rate}% |\n`;
  });
  return table;
}

module.exports = generateSummary;
