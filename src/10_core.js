'use strict';
/* ==========================================================================
   CORE — fixed 480×270 indexed framebuffer, 35-colour palette, primitives.
   Every pixel written anywhere in this file is a palette index on one grid.
   ========================================================================== */
const W = 480, H = 270, T = 255; // T = transparent index for sprite/layer buffers

const HEX = [
  '050708', '0b1213', '102020', '15302f', '1c4340', '255a53', '33736a', '4b8e7f', '74ad98', // 0-8   near-black → teal
  '1b2a19', '2b4022', '405c2b', '5f7d38', '8fa556',                                     // 9-13  moss
  '262c2b', '3a4341', '535e59', '717c75', '96a097', 'c0c6b8', 'e6e4d2',                // 14-20 cement grey → shirt white
  '26080c', '4c0d14', '7a111a', 'ab1620', 'da2a2a', 'f45a32',                           // 21-26 crimson
  '4a2f1a', '9a6a2c', 'e8b84e', 'fff1a6',                                               // 27-30 warm / window yellow
  'a9715a', '6c4136',                                                                   // 31-32 skin
  '1f3d5a', '2e6185'                                                                    // 33-34 water-tank blue
];
const K0 = 0, K1 = 1, T0 = 2, T1 = 3, T2 = 4, T3 = 5, T4 = 6, T5 = 7, T6 = 8,
  M0 = 9, M1 = 10, M2 = 11, M3 = 12, M4 = 13,
  G0 = 14, G1 = 15, G2 = 16, G3 = 17, G4 = 18, G5 = 19, WH = 20,
  R0 = 21, R1 = 22, R2 = 23, R3 = 24, R4 = 25, R5 = 26,
  Y0 = 27, Y1 = 28, Y2 = 29, Y3 = 30, S0 = 31, S1 = 32, B0 = 33, B1 = 34;

// one step darker / lighter along each material ramp (stepped lighting)
const DN = new Uint8Array(256), UP = new Uint8Array(256);
(function () {
  for (let i = 0; i < 256; i++) { DN[i] = i; UP[i] = i; }
  const ramps = [
    [K0, K0, K1, T0, T1, T2, T3, T4, T5, T6],
    [K1, M0, M1, M2, M3, M4],
    [K1, G0, G1, G2, G3, G4, G5, WH],
    [K0, R0, R1, R2, R3, R4],
    [K1, Y0, Y1],
    [Y0, S1, S0],
    [T0, B0, B1, T5]
  ];
  const setU = new Uint8Array(256), setD = new Uint8Array(256);
  for (const r of ramps) for (let i = 1; i < r.length; i++) {
    if (r[i] !== r[i - 1] && !setD[r[i]]) { DN[r[i]] = r[i - 1]; setD[r[i]] = 1; }
    if (!setU[r[i - 1]] && r[i] !== r[i - 1]) { UP[r[i - 1]] = r[i]; setU[r[i - 1]] = 1; } // first ramp owns its anchor
  }
  // emissive colours never take part in lighting
  for (const e of [Y2, Y3, R5]) { DN[e] = e; UP[e] = e; }
  UP[Y1] = Y1; UP[R4] = R4; UP[K0] = K1; DN[K0] = K0;
  UP[T6] = T6; UP[WH] = WH; UP[M4] = M4; UP[S0] = S0;
})();
const EMISSIVE = new Uint8Array(256); EMISSIVE[Y2] = EMISSIVE[Y3] = EMISSIVE[R5] = 1;

// 4×4 ordered dither
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

// deterministic hashing / noise (renders are pure functions of time)
function hash(x, y, s) {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (s | 0) * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function vnoise(x, y, s) { // value noise, smooth
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { return vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.1; }

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ri = Math.round;

class Buf {
  constructor(w, h, fill = T) { this.w = w; this.h = h; this.d = new Uint8Array(w * h).fill(fill); }
  clone() { const b = new Buf(this.w, this.h); b.d.set(this.d); return b; }
}

/* ---------- primitives (all integer, all clipped) ---------- */
function P(b, x, y, c) { x = ri(x); y = ri(y); if (x < 0 || y < 0 || x >= b.w || y >= b.h) return; b.d[y * b.w + x] = c; }
function G(b, x, y) { x = ri(x); y = ri(y); if (x < 0 || y < 0 || x >= b.w || y >= b.h) return T; return b.d[y * b.w + x]; }
function R(b, x, y, w, h, c) {
  x = ri(x); y = ri(y); w = ri(w); h = ri(h);
  let x0 = Math.max(0, x), y0 = Math.max(0, y), x1 = Math.min(b.w, x + w), y1 = Math.min(b.h, y + h);
  for (let j = y0; j < y1; j++) b.d.fill(c, j * b.w + x0, j * b.w + x1);
}
// dithered rect: lvl 0..1 coverage of colour c
function D(b, x, y, w, h, c, lvl) {
  x = ri(x); y = ri(y); w = ri(w); h = ri(h);
  for (let j = Math.max(0, y); j < Math.min(b.h, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(b.w, x + w); i++) if (bay(i, j) < lvl) b.d[j * b.w + i] = c;
}
function L(b, x0, y0, x1, y1, c, th = 1) {
  x0 = ri(x0); y0 = ri(y0); x1 = ri(x1); y1 = ri(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, o = (th - 1) >> 1;
  for (;;) {
    if (th === 1) P(b, x0, y0, c); else R(b, x0 - o, y0 - o, th, th, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
// scanline polygon fill (pixel-centre rule)
function poly(b, pts, c) {
  let miny = Infinity, maxy = -Infinity;
  for (const p of pts) { miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
  miny = Math.max(0, Math.floor(miny)); maxy = Math.min(b.h - 1, Math.ceil(maxy));
  const xs = [];
  for (let y = miny; y <= maxy; y++) {
    const yc = y + 0.5; xs.length = 0;
    for (let i = 0, n = pts.length; i < n; i++) {
      const a = pts[i], q = pts[(i + 1) % n];
      if ((a[1] <= yc && q[1] > yc) || (q[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (q[1] - a[1]) * (q[0] - a[0]));
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.round(xs[k])), xb = Math.min(b.w, Math.round(xs[k + 1]));
      if (xb > xa) b.d.fill(c, y * b.w + xa, y * b.w + xb);
    }
  }
}
function ell(b, cx, cy, rx, ry, c) {
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2)));
    R(b, cx - hw, cy + y, hw * 2 + 1, 1, c);
  }
}
function ellO(b, cx, cy, rx, ry, c) { // outline ellipse
  let px = null, py = null;
  for (let a = 0; a <= 64; a++) {
    const t = a / 64 * Math.PI * 2, x = ri(cx + Math.cos(t) * rx), y = ri(cy + Math.sin(t) * ry);
    if (px !== null) L(b, px, py, x, y, c); px = x; py = y;
  }
}
// blit with transparency, optional horizontal flip and colour remap
function blit(dst, src, dx, dy, flip = false, map = null) {
  dx = ri(dx); dy = ri(dy);
  for (let j = 0; j < src.h; j++) {
    const y = dy + j; if (y < 0 || y >= dst.h) continue;
    for (let i = 0; i < src.w; i++) {
      const x = dx + i; if (x < 0 || x >= dst.w) continue;
      let c = src.d[j * src.w + (flip ? src.w - 1 - i : i)];
      if (c === T) continue; if (map) c = map[c]; dst.d[y * dst.w + x] = c;
    }
  }
}
// copy a window of a large layer onto dst (camera scroll), integer offsets only
function layer(dst, src, ox, oy) {
  ox = ri(ox); oy = ri(oy);
  for (let y = 0; y < dst.h; y++) {
    const sy = y + oy; if (sy < 0 || sy >= src.h) continue;
    const row = sy * src.w;
    for (let x = 0; x < dst.w; x++) {
      const sx = x + ox; if (sx < 0 || sx >= src.w) continue;
      const c = src.d[row + sx]; if (c !== T) dst.d[y * dst.w + x] = c;
    }
  }
}
function remapRect(b, x, y, w, h, map) {
  for (let j = Math.max(0, y); j < Math.min(b.h, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(b.w, x + w); i++) { const k = j * b.w + i; if (b.d[k] !== T) b.d[k] = map[b.d[k]]; }
}
// 1px outline around opaque pixels of a sprite buffer (returns new buffer with 1px margin)
function outline(src, c, skipBottom = false) {
  const o = new Buf(src.w + 2, src.h + 2);
  blit(o, src, 1, 1);
  const d = o.d, w = o.w, h = o.h, add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (d[y * w + x] !== T) continue;
    const n = (x > 0 && d[y * w + x - 1] !== T) || (x < w - 1 && d[y * w + x + 1] !== T) ||
      (y > 0 && d[(y - 1) * w + x] !== T) || (!skipBottom && y < h - 1 && d[(y + 1) * w + x] !== T);
    if (n) add.push(y * w + x);
  }
  for (const k of add) d[k] = c;
  return o;
}
// sprite from ASCII art; key maps chars to palette indices
function spr(rows, key) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), b = new Buf(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x]; if (ch === '.' || ch === ' ') continue;
    if (key[ch] === undefined) throw new Error('sprite key ' + ch); b.d[y * w + x] = key[ch];
  }
  return b;
}
// textured fill: value-noise banded into a ramp + speckle
function tex(b, x, y, w, h, ramp, seed, sc = 0.08, speck = 0.05) {
  x = ri(x); y = ri(y);
  for (let j = Math.max(0, y); j < Math.min(b.h, y + h); j++)
    for (let i = Math.max(0, x); i < Math.min(b.w, x + w); i++) {
      let v = fbm(i * sc, j * sc * 1.4, seed) * ramp.length;
      v += (bay(i, j) - 0.5) * 0.55;
      let k = clamp(Math.floor(v), 0, ramp.length - 1);
      const r = hash(i, j, seed + 3);
      if (r < speck) k = Math.max(0, k - 1); else if (r > 1 - speck * 0.5) k = Math.min(ramp.length - 1, k + 1);
      b.d[j * b.w + i] = ramp[k];
    }
}
// hairline crack, random walk downward with occasional branch
function crack(b, x, y, len, c, seed, dir = 1) {
  const r = rng(seed); let cx = x, cy = y;
  for (let i = 0; i < len; i++) {
    P(b, cx, cy, c);
    cy += dir; if (r() < 0.45) cx += r() < 0.5 ? -1 : 1;
    if (r() < 0.05 && len - i > 6) crack(b, cx, cy, (len - i) >> 1, c, seed + i * 31, dir);
  }
}
// stain streaks running down from a line (rust / water)
function streaks(b, x, y, w, maxLen, c, seed, dens = 0.3) {
  for (let i = 0; i < w; i++) {
    if (hash(x + i, y, seed) > dens) continue;
    const l = 2 + Math.floor(hash(x + i, y, seed + 1) * maxLen);
    for (let j = 0; j < l; j++) if (bay(x + i, y + j) < 1 - j / l * 0.8) P(b, x + i, y + j, c);
  }
}
