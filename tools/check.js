// loads index.html in Chromium: reports errors, network requests, palette compliance, timing; saves stills
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2], times = process.argv.slice(3).map(Number);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [], reqs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('request', r => { if (!r.url().startsWith('file:')) reqs.push(r.url()); });
  const t0 = Date.now();
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '?t=0');
  await p.waitForFunction('window.__ready === true', null, { timeout: 60000 });
  console.log('ready in', Date.now() - t0, 'ms');
  const pal = await p.evaluate(() => HEX.map(h => h.toLowerCase()));
  for (const t of times) {
    const ms = await p.evaluate(t => { const a = performance.now(); __render(t); return performance.now() - a; }, t);
    const res = await p.evaluate(() => { const c = document.getElementById('c'); const d = c.getContext('2d').getImageData(0, 0, 480, 270).data; const s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).padStart(6, '0')); return { url: c.toDataURL('image/png'), cols: [...s] }; });
    const bad = res.cols.filter(c => !pal.includes(c));
    fs.writeFileSync(`${out}_${t}.png`, Buffer.from(res.url.split(',')[1], 'base64'));
    console.log(`t=${t} render ${ms.toFixed(1)}ms colours ${res.cols.length} offpalette ${bad.length}`);
  }
  console.log('errors:', errs.length ? errs : 'none'); console.log('external requests:', reqs.length ? reqs : 'none');
  await b.close();
})();
