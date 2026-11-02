// usage: node tools/snap.js out.png scale "<js expression returning a Buf>"
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [out, scale, expr] = process.argv.slice(2);
  const dir = path.join(__dirname, '..', 'src');
  const js = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !/^(6|7)/.test(f)).sort().map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', e => console.error('PAGEERR', e.message)); p.on('console', m => console.log('LOG', m.text()));
  await p.setContent('<canvas id=c></canvas>');
  await p.addScriptTag({ content: js + `\nwindow.__toPng=function(buf,s){const c=document.getElementById('c');c.width=buf.w*s;c.height=buf.h*s;const x=c.getContext('2d');const id=x.createImageData(buf.w,buf.h);for(let i=0;i<buf.d.length;i++){const k=buf.d[i];const h=k===255?'202428':HEX[k];id.data[i*4]=parseInt(h.slice(0,2),16);id.data[i*4+1]=parseInt(h.slice(2,4),16);id.data[i*4+2]=parseInt(h.slice(4,6),16);id.data[i*4+3]=255;}const t=document.createElement('canvas');t.width=buf.w;t.height=buf.h;t.getContext('2d').putImageData(id,0,0);x.imageSmoothingEnabled=false;x.drawImage(t,0,0,c.width,c.height);return c.toDataURL('image/png');};` });
  const url = await p.evaluate(`(function(){ const __b = (${expr}); return window.__toPng(__b, ${+scale}); })()`);
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  await b.close(); console.log('wrote', out);
})();
