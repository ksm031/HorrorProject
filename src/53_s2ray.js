/* ---------- S2 (rebuilt): perspective alley, she walks away; the convex mirror shows what follows ---------- */
const S2_SLOPE = 0.16;
const S2SC = {
  f: 330, vx: 232, vy: 128, camY: 15, slope: S2_SLOPE, floorW: 11,
  walls: {
    [-1]: [
      { z0: 2, z1: 40, w: 11, h: 21, mat: 'block', seed: 3, feat: [{ k: 'poster', u0: 15, u1: 19, v0: 7, v1: 13, seed: 1 }, { k: 'poster', u0: 19.5, u1: 22, v0: 8, v1: 12, seed: 3, red: 1 }, { k: 'gate', u0: 25, u1: 35, v0: 0, v1: 16 }, { k: 'plate', u0: 35.5, u1: 37.5, v0: 12, v1: 14 }] },
      { z0: 2, z1: 40, w: 19, top: 60, base: -50, h: 0, mat: 'teal', seed: 4, feat: [{ k: 'win', u0: 8, u1: 15, v0: 72, v1: 80, bars: 1 }, { k: 'win', u0: 24, u1: 31, v0: 74, v1: 82, bars: 1 }] },
      { z0: 40, z1: 72, w: 9.5, ret: 19, h: 34, mat: 'cement', seed: 5, rfeat: [{ k: 'spray', u0: 9.8, u1: 18.8, v0: 22.4, v1: 28, px: 0.28, text: '철거' }, { k: 'spray', u0: 9.8, u1: 18.8, v0: 16, v1: 21.6, px: 0.28, text: '예정' }], feat: [{ k: 'pipe', u0: 66, u1: 67, v0: 0, v1: 34 }, { k: 'meter', u0: 41, u1: 43, v0: 10, v1: 13 }, { k: 'win', u0: 47, u1: 56, v0: 22, v1: 29, bars: 1 }] },
      { z0: 72, z1: 112, w: 11, h: 27, mat: 'brick', seed: 6, feat: [{ k: 'door', u0: 80, u1: 86, v0: 0, v1: 13, mat: 'blue', lvl: 2.6 }, { k: 'poster', u0: 92, u1: 96, v0: 7, v1: 12, seed: 7 }] },
      { z0: 112, z1: 240, w: 10, ret: 11, h: 36, mat: 'teal', seed: 7, feat: [{ k: 'win', u0: 128, u1: 136, v0: 18, v1: 25, lit: 1, curtain: 1 }, { k: 'win', u0: 160, u1: 168, v0: 18, v1: 25 }] }
    ],
    [1]: [
      { z0: 2, z1: 30, w: 11, h: 33, mat: 'cement', seed: 8, feat: [{ k: 'cable', u0: 0, u1: 30, v0: 22, v1: 23.4 }, { k: 'pipe', u0: 14, u1: 14.8, v0: 0, v1: 33 }, { k: 'meter', u0: 15.5, u1: 17.5, v0: 11, v1: 14 }, { k: 'meter', u0: 18, u1: 20, v0: 11, v1: 14 }, { k: 'sign', u0: 20.5, u1: 26, v0: 14, v1: 18 }, { k: 'poster', u0: 21, u1: 24, v0: 5, v1: 10, seed: 9 }, { k: 'poster', u0: 24.5, u1: 27, v0: 6, v1: 9.5, seed: 19, red: 1 }, { k: 'door', u0: 6, u1: 11, v0: 0, v1: 13, lvl: 2.8 }] },
      { z0: 30, z1: 50, w: 30, h: 9, mat: 'block', seed: 9 }, // side-alley opening: a low wall far back
      { z0: 30, z1: 50, w: 34, h: 40, mat: 'cement', seed: 10, feat: [{ k: 'win', u0: 36, u1: 42, v0: 16, v1: 22 }] },
      { z0: 50, z1: 96, w: 10, ret: 34, h: 30, mat: 'teal', seed: 11, feat: [{ k: 'ac', u0: 56, u1: 62, v0: 14, v1: 18 }, { k: 'poster', u0: 66, u1: 70, v0: 6, v1: 11, seed: 12, red: 1 }, { k: 'poster', u0: 70.5, u1: 73, v0: 7, v1: 10, seed: 13 }, { k: 'win', u0: 78, u1: 86, v0: 18, v1: 24, bars: 1 }], rfeat: [{ k: 'spray', u0: 11, u1: 22, v0: 12, v1: 17.6, px: 0.35, text: '공가' }, { k: 'poster', u0: 24, u1: 27, v0: 6, v1: 11, seed: 15 }] },
      { z0: 96, z1: 240, w: 11, ret: 10, h: 24, mat: 'block', seed: 12, feat: [{ k: 'gate', u0: 104, u1: 113, v0: 0, v1: 14 }] }
    ]
  },
  end: { z: 236, x0: -16, x1: 16, h: 44, mat: 'cement', seed: 14, feat: [{ k: 'win', u0: -6, u1: 2, v0: 20, v1: 27, lit: 1 }, { k: 'door', u0: 4, u1: 9, v0: 0, v1: 14, mat: 'green', lvl: 2.5 }] }
};
const S2_LAMPS = [{ x: 7, z: 10, h: 27 }, { x: -7.5, z: 66, h: 28 }, { x: 8, z: 136, h: 26 }];
const S2_BLACK = [[13.0, 13.4], [15.6, 16.0], [18.2, 18.6], [22.1, 22.5]];
const S2_GHOST = [[13.4, 92, 'stand', 1], [16.0, 58, 'stand', 2], [18.6, 32, 'tilt', 2], [22.5, 13, 'lean', 2]];
function s2LampOn(t) {
  for (const [a, z] of S2_BLACK) {
    if (t >= a - 0.5 && t < a) return [1, 0, 1][Math.min(2, step(t - (a - 0.5), 6))] === 1;
    if (t >= a && t < z) return false;
  }
  return true;
}
function s2Ghost(t) { let g = null; for (const e of S2_GHOST) if (t >= e[0]) g = e; return g; }
const S2Ray = once(() => new Ray(S2SC));
const S2Sky = once(() => { // dusk sky + the world beyond the alley's end
  const b = new Buf(W, H, K1);
  sky(b, 0, 0, W, [[K1, 14], [T0, 18], [T1, 22], [T2, 26], [T3, 22], [T4, 16], [T3, 12], [Y0, 3], [T2, 200]]);
  strata(b, 0, 18, W, T1, 15, 9, T2); strata(b, 60, 60, W - 120, T2, 16, 5, T3);
  apartments(b, 100, 380, 104, 21, { body: T2, edge: T3, win: T1, lit: 0.05, num: true });
  for (let x = 0; x < W; x++) { const y = 96 + Math.floor(fbm(x * 0.03, 4, 22) * 14); R(b, x, y, 1, H - y, T1); }
  redTree(b, 300, 70, 30, 20, 23, { trunk: 30 });
  redTree(b, 140, 82, 18, 12, 24, { trunk: 18 });
  return b;
});
// reverse view (for the mirror): looking back down the hill, the lamp right there, the city lights below
const S2RSC = {
  f: 150, vx: 240, vy: 150, camY: 24, slope: -0.16, floorW: 11,
  walls: {
    [-1]: [{ z0: 1, z1: 50, w: 11, h: 50, mat: 'cement', seed: 41, feat: [{ k: 'door', u0: 14, u1: 19, v0: -2, v1: 12 }] }, { z0: 50, z1: 120, w: 11, h: 44, mat: 'teal', seed: 42 }, { z0: 120, z1: 220, w: 11, h: 40, mat: 'brick', seed: 43 }],
    [1]: [{ z0: 1, z1: 40, w: 11, h: 40, mat: 'block', seed: 44, feat: [{ k: 'gate', u0: 18, u1: 30, v0: -4, v1: 13 }] }, { z0: 40, z1: 130, w: 11, h: 40, mat: 'cement', seed: 45 }, { z0: 130, z1: 220, w: 11, h: 36, mat: 'teal', seed: 46 }]
  }
};
const S2RRay = once(() => new Ray(S2RSC));
const S2RSky = once(() => {
  const b = new Buf(W, H, K1); sky(b, 0, 0, W, [[T0, 40], [T1, 40], [T0, 200]]);
  for (let i = 0; i < 260; i++) { const x = hash(i, 1, 51) * W, y = 120 + hash(i, 2, 51) * 60; P(b, x, y, hash(i, 3, 51) < 0.7 ? Y2 : Y1); } // the city below
  return b;
});
function s2Lights(on) {
  return S2_LAMPS.map((l, i) => ({ x: l.x - Math.sign(l.x) * 2, y: S2_SLOPE * l.z + l.h, z: l.z, r: i === 0 ? 44 : 40, k: i === 0 ? (on ? 3.2 : 0) : 2.8 }));
}
const S2Buf = new Buf(W, H), S2RBuf = new Buf(W, H);
function s2Base(t, on) {
  const ray = S2Ray(), sk = S2Sky();
  ray.shade(fb, s2Lights(on), -1.3, { z0: 70, z1: 250, ramp: RM.sky, lvl: 3.2, max: 0.85 }, (x, y) => sk.d[y * W + x]);
  // poles, wires, lamp heads (projected)
  const pA = pole3(fb, ray, -9.6, 44, 34), pB = pole3(fb, ray, 9.8, 104, 32);
  for (const [a, c, sg] of [[pA, pB, 6], [[pA[0] + 2, pA[1], pA[2]], [pB[0] - 2, pB[1] - 2, pB[2]], 9], [pA, [11, 30, 6], 5], [pA, [-11, 26, 3], 4], [pB, [-10, 48, 160], 10], [pB, [11, 40, 200], 6], [[-11, 30, 20], [11, 36, 28], 3], [[-11, 26, 96], [11, 31, 112], 2]])
    wire3(fb, ray, a, c, sg, K0);
  for (let i = 1; i < S2_LAMPS.length; i++) {
    const l = S2_LAMPS[i], [sx, sy] = ray.project(l.x, S2_SLOPE * l.z + l.h, l.z), w = Math.max(3, ri(3.2 * S2SC.f / l.z));
    R(fb, ri(sx - w / 2), ri(sy) - 1, w, 2, K1); R(fb, ri(sx - w / 2) + 1, ri(sy) + 1, w - 2, 1, Y3); P(fb, ri(sx), ri(sy) + 2, Y2);
    const [ax, ay] = ray.project(l.x * 1.35, S2_SLOPE * l.z + l.h + 1, l.z); L(fb, ax, ay, sx, sy - 1, K1);
  }
  // laundry across the alley at z=58 (projected, native-size shapes)
  const lz = 58, [lx0, ly0] = ray.project(-9.5, S2_SLOPE * lz + 25, lz), [lx1, ly1] = ray.project(10, S2_SLOPE * lz + 27, lz);
  laundry(fb, lx0, ly0, lx1, ly1, 6, [{ t: 0.15, k: 'shirt', c: G3, p: 0 }, { t: 0.4, k: 'towel', c: R2, p: 2 }, { t: 0.62, k: 'pants', c: T2, p: 1 }, { t: 0.82, k: 'sock', c: G4, p: 3 }], step(t, 3), 2, 0.75, K0);
}
// the girl walking away up the alley
function s2Girl(t, on) {
  const ray = S2Ray(), z = 48 + (t - 9) * 4.6, X = 1.5;
  const [sx, sy] = ray.project(X, S2_SLOPE * z, z), s = Math.round((16 * S2SC.f / z) / 47 / 0.04) * 0.04;
  const ph = step(t, 8) % 8, lifts = [0, 0.35, 0.8, 0.35, 0, 0, 0, 0];
  const g = new Buf(W, H);
  girlBack(g, ri(sx), ri(sy), { s, lift: [lifts[ph], lifts[(ph + 4) % 8]], arm: [0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5][ph], sway: [0, 0.3, 0.5, 0.3, 0, -0.3, -0.5, -0.3][ph] });
  volumize(g);
  const lv = Math.round(ray.light(s2Lights(on), -1.3, X, S2_SLOPE * z + 10, z));
  if (lv) remapRect(g, 0, 0, W, H, lv > 0 ? UP : DN); if (lv < -1) remapRect(g, 0, 0, W, H, DN);
  blit(fb, g, 0, 0);
}
// the convex mirror: reverse view, fisheye, flipped
function s2Mirror(t, on, cx, cy, Rm) {
  const rr = S2RRay(), rs = S2RSky(), dark = !on;
  rr.shade(S2RBuf, [{ x: -2, y: 26, z: 9, r: 50, k: on ? 3.6 : 0, air: 0.9 }], -2.2, { z0: 40, z1: 200, ramp: RM.dark, lvl: 2, max: 0.9 }, (x, y) => rs.d[y * W + x]);
  if (on) { const [lx, ly] = rr.project(-2, 28, 9); R(S2RBuf, ri(lx) - 8, ri(ly) - 2, 16, 3, K1); R(S2RBuf, ri(lx) - 6, ri(ly) + 1, 12, 2, Y3); }
  const g = s2Ghost(t), black = S2_BLACK.some(([a, z]) => t >= a && t < z);
  const next = S2_GHOST.find(e => e[0] > t && e[0] - t < 0.15);
  const gh = black ? (next ? [next[1], next[2], 2, true] : null) : g ? [g[1], g[2], g[3], false] : null;
  if (gh) {
    const [gz, pose, eyes, eyesOnly] = gh, [gx, gy] = rr.project(0, S2RSC.slope * gz, gz), sc = (36 * S2RSC.f / gz) / 104;
    const gb = new Buf(W, H); drawGhost(gb, gx, gy, sc, pose, { eyes });
    if (eyesOnly) for (let i = 0; i < gb.d.length; i++) if (!EMISSIVE[gb.d[i]]) gb.d[i] = T;
    blit(S2RBuf, gb, 0, 0);
  }
  if (black) for (let i = 0; i < S2RBuf.d.length; i++) if (!EMISSIVE[S2RBuf.d[i]]) S2RBuf.d[i] = DN[DN[DN[S2RBuf.d[i]]]];
  // sample into the disc: barrel distortion, horizontal flip, darker toward the rim
  for (let y = -Rm; y <= Rm; y++) for (let x = -Rm; x <= Rm; x++) {
    const r = Math.hypot(x, y) / Rm; if (r > 1) continue;
    const k = 0.62 + 0.38 * r * r, sx = ri(240 - x / Rm * 236 * k), sy = ri(150 + y / Rm * 134 * k);
    let c = S2RBuf.d[clamp(sy, 0, H - 1) * W + clamp(sx, 0, W - 1)];
    if (r > 0.86 && bay(x, y) < (r - 0.86) * 7) c = DN[c];
    P(fb, cx + x, cy + y, c);
  }
  // glass glint + orange rim + hood
  for (let a = 0; a < 40; a++) { const q = (205 + a * 1.2) * D2R; if (a % 7 < 5) P(fb, cx + Math.cos(q) * (Rm - 3), cy + Math.sin(q) * (Rm - 3), T5); }
  const rw = Math.max(2, ri(Rm / 14)); for (let k = 1; k <= rw + 2; k++) ellO(fb, cx, cy, Rm + k, Rm + k, k === 1 ? R2 : k <= rw / 2 + 1 ? R4 : k <= rw + 1 ? R3 : K0);
  for (let x = -Rm; x <= Rm; x++) { const yy = -Math.sqrt(Math.max(0, (Rm + 4) ** 2 - x * x)); P(fb, cx + x, cy + yy - 1, R1); P(fb, cx + x, cy + yy - 2, K1); }
}
function shotAlleyRayWide(t, lt) {
  const on = s2LampOn(t);
  s2Base(t, on); s2Girl(t, on);
  // mirror on its arm, bolted to the right wall at z=16
  const mz = 28, my0 = S2_SLOPE * mz + 17, ray = S2Ray(), [mx, my] = ray.project(8, my0, mz), Rm = ri(2.6 * S2SC.f / mz);
  const [wx, wy] = ray.project(11, my0 + 1, mz + 1); L(fb, wx, wy, mx + Rm, my, K1, 3); R(fb, ri(mx) - 1, ri(my) + Rm, 3, 60, K1);
  s2Mirror(t, on, ri(mx), ri(my), Rm);
}
function shotAlleyMirror(t, lt) { // cut-in: the mirror fills the frame; the alley behind, the thing in it
  const on = s2LampOn(t);
  sky(fb, 0, 0, W, [[K0, 30], [K1, 60], [T0, 200]]);
  wall(fb, 0, 0, W, H, RAMP.cementD, 61, { moss: false, cracks: 4, streak: 40 }); shift(fb, -1);
  wire(fb, -10, 30, 490, 10, 20, K0); wire(fb, -10, 46, 490, 30, 28, K0);
  R(fb, 236, 200, 8, 70, K1); R(fb, 236, 200, 2, 70, G0); L(fb, 244, 150, 330, 128, K1, 4);
  s2Mirror(t, on, 238, 132, 104);
  light(fb, [{ x: 160, y: 30, r: 300, k: on ? 1.4 : 0 }], on ? -0.4 : -1.2, null, 0.5);
}
