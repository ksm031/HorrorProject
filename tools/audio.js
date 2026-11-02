const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '?t=0');
  await p.waitForFunction('window.__ready === true');
  const rows = await p.evaluate(() => auOffline());
  const db = v => v > 0 ? (20 * Math.log10(v)).toFixed(0) : '-inf';
  let line = '';
  for (const [s, pk, rms] of rows) { line += `${s.toFixed(1).padStart(5)} pk ${db(pk).padStart(5)} rms ${db(rms).padStart(5)} | `; if ((s * 2) % 4 === 3) { console.log(line); line = ''; } }
  console.log(line); console.log('max peak', Math.max(...rows.map(r => r[1])).toFixed(3), 'errors', errs);
  await b.close();
})();
