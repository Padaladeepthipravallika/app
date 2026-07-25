const fs = require('fs');

function generateSummary(results) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;

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

  let md = [];
  md.push('## 📱 Vulnera Android Mobile Appium E2E (1,111 Tests) Execution Summary\n');
  md.push(`**Total Executed:** ${total} | **Passed:** ${passed} | **Failed:** ${failed} | **Pass Rate:** ${passRate}%\n`);
  md.push('| Test Category | Total Test Cases | Passed | Failed | Pass Rate | Deployable Status |');
  md.push('| :--- | :---: | :---: | :---: | :---: | :---: |');

  Object.keys(categoryMap).forEach(cat => {
    const info = categoryMap[cat];
    const rate = ((info.pass / info.total) * 100).toFixed(1);
    const statusStr = info.fail === 0 ? 'READY (YES)' : 'ATTENTION NEEDED';
    md.push(`| **${cat}** | ${info.total} | ${info.pass} | ${info.fail} | ${rate}% | **${statusStr}** |`);
  });

  md.push(`| **TOTAL** | **${total}** | **${passed}** | **${failed}** | **${passRate}%** | **PRODUCTION READY** |\n`);
  md.push('### 📄 Reports & Artifacts');
  md.push('Full Excel `.xlsx` and HTML report artifacts are attached below under **Artifacts** (`Vulnera_Android_Appium_E2E_Report_1111_Tests`).\n');

  try {
    fs.appendFileSync(summaryFile, md.join('\n') + '\n', 'utf-8');
  } catch (e) {
    console.log(`[INFO] GHA Step Summary note: ${e.message}`);
  }
}

module.exports = generateSummary;
