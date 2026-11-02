/* ==========================================================================
   RAY — one-point-perspective scenes computed per pixel.
   Geometry pass (cached): material ramp + base shade + world position + normal.
   Shade pass (per frame): world-space lights, fog, AO → quantised to ramp steps
   with dithering only at band seams. Textures live in world units, so bricks,
   windows and spray paint foreshorten correctly.
   ========================================================================== */
const RAMPS = [
  /*0 cement*/[K0, K1, T0, T1, G1, G2, G3, G4, G5],
  /*1 teal  */[K0, K1, T0, T1, T2, T3, T4, T5, T6],
  /*2 moss  */[K0, K1, M0, M1, M2, M3, M4],
  /*3 brick */[K0, K1, R0, Y0, R1, R2, Y1],
  /*4 red   */[K0, R0, R1, R2, R3, R4],
  /*5 green */[K0, K1, M0, M1, M2, M3, M4],
  /*6 glass */[K0, K1, T0, T1, T2, T3],
  /*7 paper */[K1, T0, G1, G2, G3, G4, G5, WH],
  /*8 blue  */[K0, K1, T0, B0, B1, T5],
  /*9 wood  */[K0, K1, Y0, Y0, Y1],
  /*10 ground*/[K0, K1, T0, G0, G1, G2, G3, G4],
  /*11 dark */[K0, K0, K1, T0, T1],
  /*12 sky  */[K0, K1, T0, T1, T2, T3, T4, T5],
  /*13 rust */[K0, K1, R0, Y0, Y1, R2]
];
let TEX_CS = 0.5; // world size of a ~2.4px texture cell at the current hit distance (texture LOD)
const RM = { cement: 0, teal: 1, moss: 2, brick: 3, red: 4, green: 5, glass: 6, paper: 7, blue: 8, wood: 9, ground: 10, dark: 11, sky: 12, rust: 13 };

class Ray {
  constructor(sc) {
    this.sc = sc; const n = W * H;
    this.m = new Uint8Array(n); this.s = new Float32Array(n); this.z = new Float32Array(n);
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.nr = new Uint8Array(n); this.em = new Uint8Array(n).fill(T);
    this.sky = new Uint8Array(n); this.wet = new Uint8Array(n);
    this.cast();
  }
  ground(z) { const s = this.sc; return s.slope * z + (s.groundFn ? s.groundFn(z) : 0); }
  cast() {
    const sc = this.sc, f = sc.f, vx = sc.vx, vy = sc.vy, cy = sc.camY;
    const res = { m: 0, s: 0, e: T };
    for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
      const i = sy * W + sx, dx = (sx - vx) / f, dy = (vy - sy) / f;
      let hz = 1e9, kind = -1, seg = null, side = 0, U = 0, V = 0;
      // floor (sloped plane)
      const den = sc.slope - dy; if (den > 1e-5) { const z = cy / den; if (z > 0.3 && z < hz && (!sc.floorZ || z < sc.floorZ)) { hz = z; kind = 0; } }
      if (sc.ceil !== undefined && dy > 1e-5) { const z = (sc.ceil - cy) / dy; if (z > 0.3 && z < hz) { hz = z; kind = 4; } }
      // side walls (several layers, each with its own depth range and height)
      for (const sd of [-1, 1]) {
        if (dx * sd <= 0) continue; const list = sc.walls[sd];
        for (let k = 0; k < list.length; k++) {
          const g = list[k], z = g.w / (dx * sd); if (z < g.z0 || z >= g.z1 || z >= hz) continue;
          const y = cy + dy * z, base = g.base !== undefined ? g.base : this.ground(z), top = g.top !== undefined ? g.top : this.ground(g.z0) + g.h;
          if (y < base - 0.5 || y > top) continue;
          if (g.cut && g.cut(z, y - base)) continue;
          hz = z; kind = 1; seg = g; side = sd; U = z; V = y - base;
        }
        // roofs (seen from above): flat plane at the wall top, reaching back from the facade
        if (dy < 0) for (let k = 0; k < list.length; k++) {
          const g = list[k]; if (g.noRoof) continue;
          const top = g.top !== undefined ? g.top : this.ground(g.z0) + g.h, z = (top - cy) / dy;
          if (z <= 0.3 || z >= hz || z < g.z0 || z >= g.z1) continue;
          const X = dx * z * sd; if (X < g.w || X > g.w + (g.rd || 34)) continue;
          if (g.cut) continue;
          hz = z; kind = 5; seg = g; side = sd; U = z; V = X - g.w;
        }
        // returns: faces toward the camera where a wall steps in or out
        for (let k = 0; k < list.length; k++) {
          const g = list[k]; if (!g.ret) continue; const z = g.z0; if (z >= hz || z < 0.3) continue;
          const X = dx * z * sd; if (X < g.w || X > g.ret) continue;
          const y = cy + dy * z, base = this.ground(z), top = g.top !== undefined ? g.top : this.ground(g.z0) + g.h;
          if (y < base || y > top) continue;
          hz = z; kind = 2; seg = g; side = sd; U = X; V = y - base;
        }
      }
      // end wall (a house front or a dead end facing the camera)
      if (sc.end && sc.end.z < hz) {
        const e = sc.end, z = e.z, X = dx * z, y = cy + dy * z, base = this.ground(z);
        if (X > e.x0 && X < e.x1 && y >= base && y < base + e.h) { hz = z; kind = 3; seg = e; U = X; V = y - base; side = 0; }
      }
      if (kind < 0) { this.sky[i] = 1; this.z[i] = 1e9; continue; }
      res.m = 0; res.s = 4; res.e = T; res.wet = 0;
      const X = dx * hz, Y = cy + dy * hz; TEX_CS = Math.pow(2, Math.round(Math.log2(Math.max(0.06, 2.4 * hz / sc.f))));
      if (kind === 0) (sc.floorTex || floorTex)(res, X, hz, this, sc);
      else if (kind === 4) (sc.ceilTex || ceilTex)(res, X, hz, this, sc);
      else if (kind === 5) roofTex(res, U, V, seg);
      else (seg.tex || wallTex)(res, U, V, seg, side, kind, this);
      this.m[i] = res.m; this.s[i] = res.s; this.em[i] = res.e; this.z[i] = hz; this.px[i] = X; this.py[i] = Y;
      this.wet[i] = res.wet ? 1 : 0;
      this.nr[i] = kind === 0 || kind === 5 ? 0 : kind === 4 ? 4 : kind === 1 ? (side < 0 ? 1 : 2) : 3;
    }
  }
  // per-frame: lights [{x,y,z,r,k}], fog {z0,z1,ramp,lvl}, amb
  shade(out, lights, amb, fog, skyFn) {
    const NX = [0, 1, -1, 0, 0], NY = [1, 0, 0, 0, -1], NZ = [0, 0, 0, -1, 0], sc = this.sc, cy = sc.camY;
    const airL = lights.filter(L => L.k && L.air !== 0);
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0, bq = bay(x, y);
      // light in the air: closest approach of the view ray to each lamp, limited by what the ray hits
      let air = 0;
      if (airL.length) {
        const dx = (x - sc.vx) / sc.f, dy = (sc.vy - y) / sc.f, dn = 1 / Math.sqrt(dx * dx + dy * dy + 1), Dx = dx * dn, Dy = dy * dn, Dz = dn;
        const tmax = this.sky[i] ? 1e9 : this.z[i] / Dz;
        for (const L of airL) {
          const lx = L.x, ly = L.y - cy, lz = L.z; let tc = lx * Dx + ly * Dy + lz * Dz; if (tc < 0) continue; if (tc > tmax) tc = tmax;
          const qx = Dx * tc - lx, qy = Dy * tc - ly, qz = Dz * tc - lz, d = Math.sqrt(qx * qx + qy * qy + qz * qz), ar = L.ar || 11;
          if (d > ar * 2.4) continue;
          let a = 0;
          if (d < ar * 0.22) a = 1.6; else if (d < ar * 0.45) a = 1.0; else if (d < ar * 0.8) a = 0.5; // stepped halo round the bulb
          if (L.cone !== false && qy < 0) { const hr = Math.sqrt(qx * qx + qz * qz), cw = 0.9 - qy * 0.3; if (hr < cw) a = Math.max(a, Math.min(1, (1 - hr / cw) * 1.5) * Math.max(0, 1 + qy / (ar * 3))); }
          else a = Math.max(a, Math.max(0, 1 - d / ar) ** 2);
          air += a * (L.air !== undefined ? L.air : L.k * 0.7);
        }
      }
      let c;
      if (this.sky[i]) c = skyFn(x, y);
      else if (this.em[i] !== T) c = this.em[i];
      else {
        const z = this.z[i], X = this.px[i], Y = this.py[i], n = this.nr[i];
        let v = this.s[i] + amb;
        for (let k = 0; k < lights.length; k++) {
          const L = lights[k]; if (!L.k) continue;
          const lx = L.x - X, ly = L.y - Y, lz = L.z - z, d = Math.sqrt(lx * lx + ly * ly + lz * lz); if (d > L.r * (this.wet[i] ? 2.2 : 1)) continue;
          if (this.wet[i]) { // wet ground mirrors the lamp: specular on the reflected view ray
            const vx2 = X, vy2 = -(Y - cy), vz2 = z, vl = Math.sqrt(vx2 * vx2 + vy2 * vy2 + vz2 * vz2), sp = (vx2 * lx + vy2 * ly + vz2 * lz) / (vl * d);
            if (sp > 0.97) v += L.k * 1.6 * (sp - 0.97) / 0.03;
            if (d > L.r) continue;
          }
          const ndl = Math.max(0, (NX[n] * lx + NY[n] * ly + NZ[n] * lz) / d);
          const a = 1 - d / L.r; v += L.k * a * a * (0.25 + 0.75 * ndl);
        }
        let ramp = RAMPS[this.m[i]];
        if (fog) {
          const fz = clamp((z - fog.z0) / (fog.z1 - fog.z0), 0, 1) * (fog.max || 1);
          if (fz > 0) { v = lerp(v, fog.lvl, fz * 0.8); if (bq < fz * 0.9 - 0.15) ramp = RAMPS[fog.ramp]; }
        }
        const q = Math.floor(v + 0.5 + (bq - 0.5) * 0.45);
        c = ramp[q < 0 ? 0 : q >= ramp.length ? ramp.length - 1 : q];
      }
      const st = Math.floor(air + (bq - 0.5) * 0.6); // stepped, dithered only at the seams
      for (let k = 0; k < Math.min(3, st); k++) c = UP[c];
      out.d[i] = c;
    }
  }
  project(x, y, z) { const sc = this.sc; return [sc.vx + x / z * sc.f, sc.vy - (y - sc.camY) / z * sc.f]; }
  light(lights, amb, X, Y, z, n = 3) { // light level at a point (for sprites)
    let v = amb; for (const L of lights) { if (!L.k) continue; const d = Math.hypot(L.x - X, L.y - Y, L.z - z); if (d < L.r) { const a = 1 - d / L.r; v += L.k * a * a * 0.8; } } return v;
  }
}

/* ---- textures (world units: 1 = 10 cm) ---- */
function streakAt(u, v, top, seed) { // rain streaks hanging from a wall top
  const c = Math.floor(u * 1.6), h = hash(c, 7, seed); if (h > 0.3) return 0;
  const len = 6 + hash(c, 9, seed) * 22, d = top - v; return d > 0 && d < len ? (1 - d / len) * (0.6 + h) : 0;
}
function crackAt(u, v, seed) { const n = vnoise(u * 0.35, v * 0.22, seed); return Math.abs(n - 0.5) < 0.007 && vnoise(u * 0.1, v * 0.1, seed + 1) > 0.6; }
function wallTex(r, u, v, g, side, kind, ray) {
  const seed = g.seed || 1, top = (g.top !== undefined ? g.top : ray.ground(g.z0) + g.h) - (g.base !== undefined ? g.base : ray.ground(kind === 2 ? g.z0 : u));
  const mat = g.mat || 'cement';
  let m = RM[mat === 'block' ? 'cement' : mat], s = g.lvl || 4.4;
  s += (fbm(u * 0.05, v * 0.07, seed) - 0.5) * (g.blot !== undefined ? g.blot : 0.9); // broad tone variation (kept low)
  if (mat === 'cement' && v % 3.6 < 0.14) s -= 0.7;                                     // formwork pour lines
  if (mat === 'teal' && !g.noPeel) {
    const p = fbm(u * 0.16 + 9, v * 0.2, seed + 4); if (p > 0.66) { m = RM.cement; s = 4.2 + (p - 0.66) * 3; if (p < 0.68) s -= 1.4; } // peeled to cement, dark lip
    else if (vnoise(u * 1.6, v * 1.6, seed + 5) > 0.82) { m = RM.cement; s = 4.6; }                                                  // flaking chips
  }
  if (mat === 'block') { const row = Math.floor(v / 2), bu = u + (row & 1) * 2; if (v % 2 < 0.22 || bu % 4 < 0.18) s -= 1.4; else s += (hash(Math.floor(bu / 4), row, seed) - 0.5) * 0.7; }
  if (mat === 'brick') { const row = Math.floor(v / 0.75), bu = u + (row & 1) * 1.1; if (v % 0.75 < 0.16 || bu % 2.2 < 0.16) { m = RM.cement; s = 2.4; } else s = 3.3 + (hash(Math.floor(bu / 2.2), row, seed) - 0.5) * 1.6 + (fbm(u * 0.1, v * 0.1, seed) - 0.5); }
  s -= streakAt(u, v, top, seed) * 1.5;
  { const c = Math.floor(u * 3.1); if (hash(c, 3, seed) < 0.08) { const l = 3 + hash(c, 4, seed) * 10, st = 4 + hash(c, 5, seed) * 14; if (v < st && v > st - l) s -= 0.8; } } // thin rust/water runs
  if (v < 5) s -= (5 - v) / 5 * 1.3;                          // grime / AO at the foot
  if (top - v < 1.0) s += 1.2; else if (top - v < 1.6) s -= 1.2; // coping + its shadow
  if (crackAt(u, v, seed)) s -= 2.2;
  // mildew and moss creeping up from the gutter
  const mh = fbm(u * 0.25, 3, seed + 2) * 5 - 1.8 + (hash(ri(u * 2), 0, seed) - 0.5) * 0.8; if (v < mh && mat !== 'brick') { m = RM.moss; s = 2.4 + (mh - v) * 0.3 + (hash(ri(u * 3), ri(v * 3), seed) - 0.5); }
  else if (v < 7 && vnoise(u * 0.9, v * 0.9, seed + 6) > 0.66) s -= 1.0;
  // red ivy (담쟁이) climbing the wall in clusters of leaves
  if (g.ivy) {
    const reach = fbm(u * 0.09, v * 0.05, seed + 20) + (1 - v / Math.max(8, top)) * 0.35 - 0.2;
    if (reach > 0.5 && v > 0.5) { // leaf clusters: shaded as masses (lit from above), few dark gaps — not per-pixel noise
      const cs = TEX_CS * 2, cu = Math.floor(u / cs), cv = Math.floor(v / cs), cell = hash(cu, cv, seed + 21), mass = fbm(u * 0.35, v * 0.35, seed + 22);
      if (cell > 0.1) { m = RM.red; s = 0.9 + mass * 2.2 + (reach - 0.5) * 1.5 + (cell > 0.85 ? 0.7 : 0); } else { m = RM.dark; s = 1.1; } }
  }
  r.m = m; r.s = s;
  const fl = kind === 2 ? g.rfeat : g.feat;
  if (fl) for (const ft of fl) if (u >= ft.u0 && u < ft.u1 && v >= ft.v0 && v < ft.v1) FEAT[ft.k](r, u - ft.u0, v - ft.v0, ft, kind === 2 ? -side : side || -1);
  if (kind === 2) r.s -= 0.6; // returns are a touch darker (facing away from the lamps)
}
const FEAT = {
  win(r, u, v, f, side) {
    const w = f.u1 - f.u0, h = f.v1 - f.v0, e = Math.min(u, w - u, v, h - v);
    if (e < 0.5) { r.m = RM.cement; r.s = 2.2; return; }
    if (v < 0.9 && e < 0.9) { r.m = RM.cement; r.s = 5.2; return; }
    if (f.bars && (u % 0.9) < 0.22) { r.m = RM.dark; r.s = 1.5; return; }
    if (f.lit) { r.e = e < 1.4 ? Y2 : Y3; if (f.curtain && u < w * 0.35) r.e = Y1; return; }
    r.m = RM.glass; r.s = 1.3 + (v / h) * 0.8 + ((u + v * 0.6) % 4 < 0.5 ? 1.2 : 0);
  },
  door(r, u, v, f) {
    const w = f.u1 - f.u0, h = f.v1 - f.v0, e = Math.min(u, w - u, h - v);
    r.m = RM[f.mat || 'cement']; r.s = (f.lvl || 3.2) + (e < 0.6 ? -1.4 : 0) + ((u > w * 0.15 && u < w * 0.85 && ((v > h * 0.55 && v < h * 0.9) || (v > h * 0.1 && v < h * 0.45))) ? -0.7 : 0);
    if (Math.abs(u - w * 0.82) < 0.3 && Math.abs(v - h * 0.48) < 0.5) { r.m = RM.paper; r.s = 5; }
  },
  gate(r, u, v, f) {
    const w = f.u1 - f.u0, h = f.v1 - f.v0, half = w / 2, lu = u % half, e = Math.min(lu, half - lu, v, h - v);
    r.m = RM.green; r.s = 3.6 + (fbm(u * 0.3, v * 0.2, 5) - 0.5);
    if (e < 0.5) r.s -= 1.6; else if ((v > h * 0.12 && v < h * 0.46) || (v > h * 0.54 && v < h * 0.9)) { r.s -= 0.8; if (lu < 1.4 && lu > 0.9) r.s += 1.2; }
    if (v < h * 0.88 && v > h * 0.12 && (v % 1.6) < 0.25 && lu > 1.6 && lu < half - 1.6) r.s += 0.9; // pressed ribs
    if (hash(ri(u * 3), 1, 3) < 0.18 && v > h * 0.5 && v < h * 0.5 + hash(ri(u * 3), 2, 3) * 4) { r.m = RM.rust; r.s = 3.6; } // short rust runs
    if (Math.abs(lu - half + 1.6) < 0.35 && Math.abs(v - h * 0.48) < 0.9) { r.m = RM.cement; r.s = 6; } // handle
  },
  poster(r, u, v, f) {
    const w = f.u1 - f.u0, h = f.v1 - f.v0; r.m = RM.paper; r.s = 4.6 + (fbm(u * 0.5, v * 0.5, f.seed || 1) - 0.5) * 1.4;
    if (f.red && v > h * 0.7) { r.m = RM.red; r.s = 2.6; }
    else if (v < h * 0.62 && v > h * 0.1 && (v * 2.6) % 1 < 0.42 && u > w * 0.12 && u < w * (0.5 + hash(ri(v * 2.6), 1, f.seed || 1) * 0.4)) r.s -= 2;
    if (u > w * 0.8 && v < h * 0.25) { r.s = 0; r.m = RM.dark; } // torn corner
  },
  pipe(r, u, v, f) { const w = f.u1 - f.u0, c = Math.abs(u - w / 2) / (w / 2); r.m = RM.cement; r.s = 4.6 - c * 2.4 + (v % 9 < 0.4 ? -1.5 : 0); },
  meter(r, u, v, f) { const w = f.u1 - f.u0, h = f.v1 - f.v0; r.m = RM.cement; r.s = 5; if (u > w * 0.2 && u < w * 0.8 && v > h * 0.5 && v < h * 0.85) { r.m = RM.glass; r.s = 1.5; } },
  plate(r) { r.m = RM.blue; r.s = 3.5; },
  spray(r, u, v, f, side) { // Hangul in world space, reading left→right on screen
    const px = f.px, cols = Math.floor((side > 0 ? (f.u1 - f.u0 - u) : u) / px), row = Math.floor((f.v1 - f.v0 - v) / px);
    const adv = 16, ci = Math.floor(cols / adv), gx = cols % adv, ch = f.text[ci]; if (!ch || ch === ' ' || gx > 14 || row > 15) return;
    const g = GLYPH[ch]; if (!g) return;
    const on = (gx < 14 && row < 14 && g[row][gx] === '#') || (gx > 0 && row < 14 && g[row][gx - 1] === '#');
    const drip = row >= 13 && row < 13 + hash(ci * 16 + gx, 5, 9) * 6 && gx > 0 && g[13][gx - 1] === '#';
    if (on || drip) { r.m = RM.red; r.s = (f.lvl || 3.2) + (hash(cols, row, 3) - 0.5) * 0.6; }
  },
  ac(r, u, v, f) { const w = f.u1 - f.u0, h = f.v1 - f.v0, cx = w * 0.38, cy = h * 0.5, d = Math.hypot(u - cx, v - cy); r.m = RM.cement; r.s = 5.4; if (d < h * 0.36) r.s = d > h * 0.3 ? 3 : 4 - ((Math.atan2(v - cy, u - cx) * 3 + 10) % 1 < 0.5 ? 1 : 0); if (v < 0.4) r.s = 3.5; },
  cable(r, u, v, f) { const k = Math.floor(v / 0.45); if (k % 3 !== 2) { r.m = RM.dark; r.s = 1.6 + (k % 3) * 0.6; } },
  sign(r, u, v, f) { const w = f.u1 - f.u0, h = f.v1 - f.v0, e = Math.min(u, w - u, v, h - v); r.m = RM.paper; r.s = e < 0.3 ? 2.5 : 5.2 - (fbm(u * 0.4, v * 0.4, 8) - 0.5) * 1.5; if (e > 0.3 && v > h * 0.55) { r.m = RM.red; r.s = 3.2; } },
  vent(r, u, v) { r.m = RM.dark; r.s = (v % 0.8 < 0.35) ? 3 : 1; }
};
function floorTex(r, X, z, ray, sc) {
  const w = sc.floorW || 12, seed = 31;
  r.m = RM.ground; r.s = 4.1 + (fbm(X * 0.09, z * 0.06, seed) - 0.5) * 1.6;
  if (z % 14 < 0.35) r.s -= 1.4;                                    // expansion joints
  if (Math.abs(X) > w - 1.6) { r.s -= 1.2 + (Math.abs(X) - (w - 1.6)) * 0.5; if (Math.abs(X) > w - 1.2 && (z * 2) % 1 < 0.3) r.s -= 1; } // gutter
  if (crackAt(X * 0.9, z * 0.7, seed) && hash(ri(X), ri(z), 3) < 0.6) r.s -= 1.2;
  const pd = fbm(X * 0.12 + 40, z * 0.08, seed + 5); if (pd > 0.66 && Math.abs(X) < w - 2) { r.m = RM.glass; r.s = pd > 0.675 ? 2.4 : 3.6; r.wet = 1; } // puddles (bright lip)
  if (!sc.noFlowers && Math.abs(X) > w - 2.6 && Math.abs(X) < w - 0.3 && fbm(z * 0.12, X > 0 ? 1 : 2, seed + 9) > 0.6) {
    const h = hash(Math.floor(X / TEX_CS), Math.floor(z / (TEX_CS * 2)), seed); if (h < 0.3) { r.m = RM.red; r.s = 2.2 + h * 7; } else if (h < 0.55) { r.m = RM.moss; r.s = 2.6; }
  }
  if (sc.stepD) { const ph = (z % sc.stepD) / sc.stepD; if (ph < 0.12) r.s += 1.6; else if (ph < 0.3) r.s -= 1.2; }
}
function roofTex(r, u, v, g) {
  const sd = g.seed || 1, kind = hash(sd, 3, 9);
  if (v < 0.7) { r.m = RM.cement; r.s = 5.4; return; } // parapet edge catches the light
  if (kind < 0.45) { // corrugated slate, weighted with tyres
    r.m = RM.cement; r.s = 3.6 + ((v * 1.7) % 1 < 0.45 ? 0.9 : -0.3) + (fbm(u * 0.1, v * 0.1, sd) - 0.5) * 1.6;
    if (fbm(u * 0.2, v * 0.2, sd + 1) > 0.66) { r.m = RM.moss; r.s = 2.8; }
    for (let k = 0; k < 3; k++) { const tu = g.z0 + 4 + hash(sd, k, 1) * (g.z1 - g.z0 - 8), tv = 4 + hash(sd, k, 2) * 20, d = Math.hypot(u - tu, (v - tv) * 1.2); if (d < 1.6 && d > 0.7) { r.m = RM.dark; r.s = 1.2; } }
  } else { // flat roof, green waterproof paint, a blue tank, a red basin, styrofoam gardens
    r.m = RM.green; r.s = 2.8 + (fbm(u * 0.08, v * 0.08, sd) - 0.5) * 1.6; if ((u % 9) < 0.2 || (v % 9) < 0.2) r.s -= 0.8;
    const tu = g.z0 + 3 + hash(sd, 5, 1) * (g.z1 - g.z0 - 6), tv = 6 + hash(sd, 6, 1) * 14;
    const d = Math.hypot(u - tu, v - tv); if (d < 2.6) { r.m = RM.blue; r.s = d < 1.8 ? 4.2 - d * 0.4 : 2.2; return; }
    const bu = tu + 5, bv = tv + 3, d2 = Math.hypot(u - bu, v - bv); if (d2 < 1.6) { r.m = RM.red; r.s = d2 < 1.0 ? 1.6 : 3.6; return; }
    if (Math.abs(u - tu + 4) < 1.6 && Math.abs(v - tv - 4) < 1.1) { r.m = RM.paper; r.s = 6; if (hash(ri(u * 3), ri(v * 3), 2) < 0.35) { r.m = RM.moss; r.s = 4; } }
  }
}
function ceilTex(r, X, z) { r.m = RM.cement; r.s = 2.6 + (fbm(X * 0.1, z * 0.1, 77) - 0.5) * 1.2 - (z % 12 < 0.3 ? 1 : 0); }
// wire in 3D, sagging, projected
function wire3(b, ray, a, c, sag, col = K0) {
  let p = null;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, x = lerp(a[0], c[0], t), y = lerp(a[1], c[1], t) - sag * 4 * t * (1 - t), z = lerp(a[2], c[2], t);
    if (z < 0.6) { p = null; continue; }
    const q = ray.project(x, y, z); if (p) L(b, p[0], p[1], q[0], q[1], col); p = q;
  }
}
// vertical pole in 3D (concrete utility pole), projected width
function pole3(b, ray, x, z, h, col = K1, hi = G0) {
  const [sx, sy0] = ray.project(x, ray.ground(z), z), [, sy1] = ray.project(x, ray.ground(z) + h, z), w = Math.max(1, ri(2.6 * ray.sc.f / z));
  R(b, ri(sx - w / 2), ri(sy1), w, ri(sy0 - sy1), col); if (w > 2) R(b, ri(sx - w / 2), ri(sy1), 1, ri(sy0 - sy1), hi);
  return [x, ray.ground(z) + h, z];
}
