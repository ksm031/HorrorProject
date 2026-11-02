// concatenates src/ into one self-contained index.html
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'src');
const js = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const html = fs.readFileSync(path.join(dir, '00_head.html'), 'utf8') + js + '\n' + fs.readFileSync(path.join(dir, '99_tail.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(1) + ' KB');
