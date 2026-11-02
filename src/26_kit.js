/* ==========================================================================
   KIT — generates a daldongne alley (wall segments + facade features) for Ray.
   ========================================================================== */
function alleyKit(seed, o = {}) {
  const r = rng(seed), out = { [-1]: [], [1]: [] }, w0 = o.w || 11, sprays = (o.spray || ['철거', '공가', '위험']).slice();
  const pick = a => a[(r() * a.length) | 0];
  for (const sd of [-1, 1]) {
    let z = o.z0 || 2, prevW = w0, n = 0;
    while (z < (o.z1 || 220)) {
      const kind = n === 0 && o.firstKind ? o.firstKind : r() < (o.gapP || 0.14) && n > 0 ? 'gap' : r() < 0.4 ? 'wall' : 'house';
      const len = kind === 'gap' ? 9 + r() * 6 : 16 + r() * 26, w = kind === 'gap' ? w0 + 16 : w0 + (r() < 0.35 ? -1.5 : r() < 0.3 ? 1 : 0);
      const z1 = Math.min(o.z1 || 220, z + len), sg = (seed * 31 + n * 7 + (sd + 1) * 101) | 0;
      const seg = { z0: z, z1, w, seed: sg, feat: [] };
      if (w < prevW) { seg.ret = prevW; if (sprays.length && r() < 0.75) { const t = sprays.shift(), px = 0.32; seg.rfeat = [{ k: 'spray', u0: w + 0.4, u1: w + 0.4 + t.length * 16 * px + 1, v0: 12, v1: 12 + 16 * px, px, text: t }]; } }
      if (kind === 'gap') { // side alley: low far wall, and a house behind
        Object.assign(seg, { h: 8 + r() * 6, mat: 'block' });
        out[sd].push(seg, { z0: z, z1, w: w + 6, h: 30 + r() * 14, mat: pick(['cement', 'teal']), seed: sg + 1, feat: [{ k: 'win', u0: z + 2, u1: z + 6, v0: 16, v1: 22, lit: r() < 0.2, bars: 1 }] });
        prevW = w; z = z1; n++; continue;
      }
      if (kind === 'wall') {
        Object.assign(seg, { h: 17 + r() * 5, mat: r() < 0.6 ? 'block' : 'cement' });
        if (r() < 0.6) { const g0 = z + 3 + r() * (len - 15); seg.feat.push({ k: 'gate', u0: g0, u1: g0 + 9 + r() * 3, v0: 0, v1: 14 + r() * 2 }, { k: 'plate', u0: g0 + 12.5, u1: g0 + 14.5, v0: 11, v1: 13 }); }
        // house behind the wall
        out[sd].push({ z0: z, z1, w: w + 7, h: 32 + r() * 16, mat: pick(['teal', 'cement', 'brick']), seed: sg + 2, feat: r() < 0.7 ? [{ k: 'win', u0: z + 4, u1: z + 10, v0: 22, v1: 29, lit: r() < (o.litP || 0.12), curtain: 1, bars: r() < 0.5 }] : [] });
      } else {
        Object.assign(seg, { h: 26 + r() * 16, mat: pick(['teal', 'cement', 'cement', 'brick']) });
        for (let u = z + 3; u < z1 - 8; u += 10 + r() * 8) {
          const q = r();
          if (q < 0.3) seg.feat.push({ k: 'win', u0: u, u1: u + 5 + r() * 3, v0: 15 + r() * 4, v1: 22 + r() * 3, lit: r() < (o.litP || 0.1), curtain: 1, bars: r() < 0.7 });
          else if (q < 0.48) seg.feat.push({ k: 'door', u0: u, u1: u + 5, v0: 0, v1: 13, mat: pick(['cement', 'blue', 'green', 'wood']), lvl: 2.6 });
          else if (q < 0.6) seg.feat.push({ k: 'ac', u0: u, u1: u + 5, v0: 13, v1: 17 });
          else if (q < 0.75) { seg.feat.push({ k: 'poster', u0: u, u1: u + 3, v0: 6, v1: 11, seed: sg + u, red: r() < 0.4 }); if (r() < 0.6) seg.feat.push({ k: 'poster', u0: u + 3.4, u1: u + 5.6, v0: 7, v1: 10.5, seed: sg + u + 1 }); }
          else if (q < 0.85) seg.feat.push({ k: 'meter', u0: u, u1: u + 2, v0: 10, v1: 13 }, { k: 'pipe', u0: u + 2.6, u1: u + 3.3, v0: 0, v1: 40 });
          else seg.feat.push({ k: 'sign', u0: u, u1: u + 5, v0: 13, v1: 16.5 });
        }
        if (r() < 0.5) seg.feat.push({ k: 'cable', u0: z, u1: z1, v0: 21 + r() * 3, v1: 22.2 + r() * 3 });
      }
      out[sd].push(seg); prevW = w; z = z1; n++;
    }
  }
  return out;
}
// lamp head (projected), poles+wires zig-zagging along an alley
function lampHead(b, ray, x, y, z, on) {
  const [sx, sy] = ray.project(x, y, z), w = Math.max(3, ri(3.4 * ray.sc.f / z)), h = Math.max(1, ri(w / 4));
  const [ax, ay] = ray.project(x + Math.sign(x || 1) * 3.5, y + 1.2, z); L(b, ax, ay, sx, sy - h, K1, Math.max(1, ri(w / 6)));
  R(b, ri(sx - w / 2), ri(sy - h), w, h, K1); R(b, ri(sx - w / 2) + 1, ri(sy), w - 2, Math.max(1, ri(h / 2)), on ? Y3 : G0);
  if (on) P(b, ri(sx), ri(sy) + Math.max(1, ri(h / 2)), Y2);
}
function alleyWires(b, ray, poles, extra = []) {
  for (let i = 0; i + 1 < poles.length; i++) {
    const a = poles[i], c = poles[i + 1];
    wire3(b, ray, a, c, 6, K0); wire3(b, ray, [a[0], a[1] - 2, a[2]], [c[0], c[1] - 2, c[2]], 10, K0); wire3(b, ray, [a[0] * 0.7, a[1] - 4, a[2]], [c[0] * 0.7, c[1] - 3, c[2]], 14, K1);
  }
  for (const [a, c, sg] of extra) wire3(b, ray, a, c, sg, K0);
}
// sprite lit by the scene: light level at its position → whole-step shift
function litSprite(dst, src, lv) {
  lv = Math.round(lv); const m = lv > 0 ? UP : DN;
  for (let k = 0; k < Math.min(3, Math.abs(lv)); k++) remapRect(src, 0, 0, W, H, m);
  blit(dst, src, 0, 0);
}
// world-space silhouette mask on a plane (for cast shadows): k px per world unit
class PlaneMask {
  constructor(x0, y0, wu, hu, k) { this.x0 = x0; this.y0 = y0; this.k = k; this.b = new Buf(ri(wu * k), ri(hu * k)); }
  at(x, y) { const i = ri((x - this.x0) * this.k), j = ri((this.y0 - y) * this.k); return i >= 0 && j >= 0 && i < this.b.w && j < this.b.h && this.b.d[j * this.b.w + i] !== T; }
  // screen-like coordinates for drawing: feet at world (x,y) → buffer px
  px(x, y) { return [(x - this.x0) * this.k, (this.y0 - y) * this.k]; }
}
