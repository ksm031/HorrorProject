/* ==========================================================================
   SHOTS (perspective renderer) — S1, S3 + reveal, S4, S5, S6, S7
   Every camera is locked off; variety comes from angle and cutting.
   ========================================================================== */
const FOG_DUSK = { z0: 60, z1: 240, ramp: RM.sky, lvl: 3, max: 0.85 };
function rayShot(sc) { return once(() => new Ray(sc)); }

/* ---------- S1: from the top of the hill, looking down the alley at the city ---------- */
const S1SC = { f: 290, vx: 240, vy: 64, camY: 30, slope: -0.13, floorW: 11, floorZ: 172, walls: alleyKit(101, { z0: 6, z1: 176, w: 11, litP: 0.12, spray: ['공가'], gapP: 0.2, ivyP: 0.15, treeP: 0.35, firstKind: 'wall', mats: ['teal', 'cement', 'teal', 'brick', 'cement', 'teal'] }) };
const S1R = rayShot(S1SC);
const S1Back = once(() => { // beyond the hill: dusk, mountains, the living city below
  const b = new Buf(W, H, T1);
  sky(b, 0, 0, W, [[T1, 8], [T2, 10], [T3, 12], [T4, 10], [T3, 8], [Y0, 2], [R1, 2], [T2, 200]]);
  for (let x = 0; x < W; x++) { const y = 44 + Math.floor(fbm(x * 0.012, 1, 61) * 22); R(b, x, y, 1, H - y, T1); }
  for (let x = 0; x < W; x++) { const y = 58 + Math.floor(fbm(x * 0.02, 2, 62) * 12); R(b, x, y, 1, H - y, T0); }
  // distant towers: small, hazy, few lights — the living city far away
  const r = rng(63);
  for (let x = 6; x < W; x += 10 + (r() * 16 | 0)) {
    const w = 8 + (r() * 14 | 0), h = 14 + (r() * 30 | 0), y = 92 - h;
    R(b, x, y, w, h + 10, T1); R(b, x, y, 1, h, T2);
    for (let fy = y + 3; fy < 90; fy += 3) for (let fx = x + 2; fx < x + w - 1; fx += 2) if (r() < 0.07) P(b, fx, fy, r() < 0.6 ? Y1 : Y2);
  }
  for (let y = 90; y < H; y++) for (let x = 0; x < W; x++) { b.d[y * W + x] = y < 96 ? T0 : K1; const h = hash(x, y, 64); if (y >= 96 && h < 0.02 + (y - 96) * 0.0003) b.d[y * W + x] = h < 0.008 ? Y2 : h < 0.014 ? Y1 : T1; }
  return b;
});
const S1_LAMPS = [{ x: -8, z: 50, h: 26 }, { x: 8, z: 104, h: 24 }, { x: -8, z: 150, h: 24 }];
function shotOpen(t, lt) {
  const ray = S1R(), bk = S1Back(), g = S1SC.slope;
  const lights = S1_LAMPS.map(l => ({ x: l.x * 0.8, y: g * l.z + l.h - 1, z: l.z, r: 40, k: 2.6 }));
  ray.shade(fb, lights, -1.2, FOG_DUSK, (x, y) => bk.d[y * W + x]);
  for (const l of S1_LAMPS) lampHead(fb, ray, l.x, g * l.z + l.h, l.z, true);
  const poles = [[-10, g * 30 + 34, 30], [10, g * 80 + 34, 80], [-10, g * 128 + 32, 128], [10, g * 168 + 30, 168]];
  for (const p of poles) pole3(fb, ray, p[0], p[2], p[1] - g * p[2]);
  alleyWires(fb, ray, poles, [[[-11, 30, 12], [11, 26, 22], 3], [[11, 20, 60], [-40, 10, 70], 6]]);
  // she walks home, up toward us (front view, small, face in shadow)
  const z = 152 - lt * 4.4, ph = step(lt, 7) % 8, lifts = [0, 0.35, 0.8, 0.35, 0, 0, 0, 0];
  const [sx, sy] = ray.project(-1, g * z, z), s = Math.round((16 * S1SC.f / z) / 47 / 0.04) * 0.04, gb = new Buf(W, H);
  girlFront(gb, ri(sx), ri(sy) + ([0, 1, 0, 0, 0, 1, 0, 0][ph]), { s, lift: [lifts[ph], lifts[(ph + 4) % 8]], arm: [0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5][ph] });
  volumize(gb); litSprite(fb, gb, ray.light(lights, -1.2, -1, g * z + 10, z));
  fadeIn(fb, Math.min(4, step(lt, 2)));
}

/* ---------- S3: she stops at a wall — two shadows; she turns; it is there ---------- */
const S3SC = {
  f: 210, vx: 240, vy: 150, camY: 15, slope: 0, floorW: 40, noTerrace: 1, walls: { [-1]: [], [1]: [] },
  end: { z: 36, x0: -60, x1: 60, h: 60, mat: 'cement', seed: 71, lvl: 4.6, feat: [
    { k: 'pipe', u0: -27, u1: -26, v0: 0, v1: 60 }, { k: 'meter', u0: -25, u1: -23, v0: 13, v1: 16 }, { k: 'cable', u0: -60, u1: 60, v0: 30, v1: 30.9 },
    { k: 'spray', u0: -24, u1: -1, v0: 16, v1: 21.4, px: 0.34, text: '출입금지' },
    { k: 'poster', u0: 13, u1: 17, v0: 11, v1: 16.5, seed: 72, red: 1 }, { k: 'poster', u0: 17.4, u1: 20, v0: 12, v1: 15.5, seed: 73 }, { k: 'poster', u0: 14, u1: 17.6, v0: 6.5, v1: 10.5, seed: 74 }] }
};
S3SC.end.tex = (r, u, v, g, side, kind, ray) => wallTex(r, u, v, g, -1, kind, ray);
const S3R = rayShot(S3SC);
const S3_TURN = [[27.6, 0.18], [28.5, 0.36], [29.4, 0.6], [30.3, 0.86]];
const S3_LAMP = { x: -24, y: 6, z: -60, r: 150, k: 3.4, air: 0 }; // a lamp further down the slope, low behind her
const S3_REVEAL = 31.9;
function shotShadow(t, lt) {
  const ray = S3R(), k = step(lt, ANIM);
  const spread = k < 3 ? 1.2 : k < 6 ? 0.5 : 0, sway = [1.4, 1.0, -0.8, -0.5, 0.3, 0.1, 0][Math.min(6, k)];
  let yaw = 0; for (const [a, v] of S3_TURN) if (t >= a) yaw = v;
  const breath = (step(lt, 0.8) & 1) && yaw < 0.5 ? 1 : 0;
  ray.shade(fb, [S3_LAMP], -1.6, null, () => K0);
  // cast shadows: test each lit point against the girl's and the thing's silhouettes on their planes
  const gm = new PlaneMask(-8, 22, 16, 23, 10), hm = new PlaneMask(0, 44, 32, 46, 10);
  { const [px, py] = gm.px(0, 0); girlBack(gm.b, px, py, { s: 10 * 16 / 47, yaw: yaw * 0.6, spread }); }
  { const [px, py] = hm.px(12, 0), base = { ...GPOSE.lean, lean: 36, head: [10, 12], la: [30, 10, 6], ra: [8, 6, 0] }, pose = t >= 31.4 ? { ...base, tilt: 70, head: [7, 12], la: [62, -30, 10] } : t >= 30.8 ? { ...base, tilt: 70, head: [7, 12] } : base; drawGhost(hm.b, px, py, 10 * 34 / 104, pose, { eyes: 0, flip: true }); }
  const L = S3_LAMP;
  for (let i = 0; i < W * H; i++) {
    const z = ray.z[i]; if (z > 1e8) continue;
    const X = ray.px[i], Y = ray.py[i];
    let sh = 0;
    for (const [m, zp] of [[gm, 22], [hm, 10]]) { const tt = (zp - L.z) / (z - L.z); if (tt <= 0 || tt >= 1) continue; if (m.at(L.x + (X - L.x) * tt, L.y + (Y - L.y) * tt)) sh++; }
    if (sh) { let c = fb.d[i]; c = DN[DN[DN[c]]]; if (sh > 1) c = DN[c]; fb.d[i] = c; }
  }
  // the girl, close, from behind
  const [sx, sy] = ray.project(0, 0, 22), gb = new Buf(W, H);
  girlBack(gb, ri(sx), ri(sy), { s: 16 * S3SC.f / 22 / 47, yaw, spread, sway, breath });
  volumize(gb, 2); litSprite(fb, gb, ray.light([S3_LAMP], -1.4, 0, 10, 22) + 0.4);
}

/* ---------- the reveal: one hard cut, three keys — the face opens ---------- */
// sculpted head: height field (skull + brow + sockets + hollow cheeks) lit in stepped bands by a cold
// lamp behind it and by the ember glow of its eyes and the split running down its face
const SCULPT = new Map();
function sculptFace(b, cx, cy, R, open, t) {
  const key = [cx, cy, R, open].join(); let c = SCULPT.get(key);
  if (!c) { c = new Buf(W, H); sculptRaw(c, cx, cy, R, open); SCULPT.set(key, c); }
  blit(b, c, 0, 0);
  const r = rng(3 + step(t, 6)); for (let k = 0; k < 40; k++) P(b, cx + (r() - 0.5) * 2.4 * R, cy - 1.2 * R + r() * 2.2 * R, r() < 0.6 ? K1 : T0); // ash
}
function sculptRaw(b, cx, cy, R, open) {
  const Lx = 0.55, Ly = -0.55, Lz = 0.4, ln = Math.hypot(Lx, Ly, Lz);
  const shape = (u, v) => { const w = 0.74 * (1 - 0.28 * Math.max(0, v) / 1.15); const q = (u / w) ** 2 + (v / 1.15) ** 2; if (q >= 1) return -1;
    let z = Math.sqrt(1 - q);
    z += 0.13 * Math.exp(-(((v + 0.34) / 0.07) ** 2)) * (Math.abs(u) < 0.56 ? 1 : 0);
    z -= 0.34 * Math.exp(-((((Math.abs(u) - 0.27) / 0.13) ** 2) + (((v + 0.17) / 0.1) ** 2)));
    z -= 0.14 * Math.exp(-((((Math.abs(u) - 0.42) / 0.12) ** 2) + (((v - 0.28) / 0.2) ** 2)));
    z += 0.08 * Math.exp(-((((Math.abs(u) - 0.46) / 0.08) ** 2) + (((v - 0.02) / 0.08) ** 2)));
    return z; };
  const hw = v => { if (v < -0.95 || v > 1.08) return 0; const bell = Math.pow(Math.sin(Math.PI * (v + 0.95) / 2.03), 0.6); return open * 0.085 * bell * (1 + (vnoise(v * 14, 1, 5) - 0.5) * 0.6); };
  const eyes = [[-0.27, -0.17], [0.27, -0.17]];
  for (let y = Math.max(0, ri(cy - 1.4 * R)); y < Math.min(H, cy + 1.4 * R); y++) for (let x = Math.max(0, ri(cx - R)); x < Math.min(W, cx + R); x++) {
    const u = (x - cx) / R, v = (y - cy) / R, z = shape(u, v); if (z < 0) continue;
    const e = 1 / R, nxv = (shape(u - e, v) - shape(u + e, v)) * R / 2, nyv = (shape(u, v - e) - shape(u, v + e)) * R / 2, nl = Math.hypot(nxv, nyv, 1);
    const lit = Math.max(0, (nxv * Lx + nyv * Ly + Lz) / nl / ln), bq = bay(x, y);
    const w = hw(v), du = Math.abs(u);
    if (w > 0 && du < w) { // inside the split: embers, deep, with strands across
      const k = du / w, strand = Math.abs(((v * 9 + vnoise(u * 20, v * 4, 9) * 1.4) % 1) - 0.5) < 0.06 && k > 0.25;
      const deep = vnoise(v * 6, 3, 11); b.d[y * W + x] = strand ? K0 : k > 0.8 ? R4 : k > 0.62 ? R2 : (k < 0.12 && deep > 0.55) ? R5 : (deep > 0.7 && k < 0.3) ? Y2 : k < 0.4 ? R1 : R0; continue;
    }
    let ember = 0; for (const [ex, ey] of eyes) { const d = Math.hypot(u - ex, (v - ey) * 1.2); ember += 0.9 / (1 + (d / 0.11) ** 2); }
    if (w > 0) ember += 1.3 * Math.exp(-(((du - w) / 0.06) ** 2)) * (open > 0.2 ? 1 : 0.4); else if (Math.abs(u) < 0.012 && v > -0.9 && v < 1.0 && open === 0) ember += 2.2;
    const cool = lit * 3.6 - 0.4 + (bq - 0.5) * 0.5, em = ember * 2.6 + (bq - 0.5) * 0.5;
    let c = em > cool && em > 0.5 ? [R0, R1, R2, R4][clamp(Math.floor(em - 0.5), 0, 3)] : [K0, K1, T0, T1, T2][clamp(Math.floor(cool), 0, 4)];
    if (Math.abs(vnoise(u * 9, v * 7, 82) - 0.5) < 0.018 && c !== K0) c = DN[c] === K0 ? K1 : DN[c]; // charred crazing
    b.d[y * W + x] = c;
  }
  for (const [eu, ev] of eyes) { // the eyes: hot, stepped, pinpoint pupil
    const ex = cx + eu * R, ey = cy + ev * R, er = 0.075 * R;
    for (let y = ri(ey - er * 1.3); y <= ey + er * 1.3; y++) for (let x = ri(ex - er * 1.3); x <= ex + er * 1.3; x++) {
      const d = Math.hypot(x - ex, (y - ey) * 1.25) / er + (bay(x, y) - 0.5) * 0.15; if (d > 1.25) continue;
      P(b, x, y, d < 0.16 ? K0 : d < 0.42 ? Y3 : d < 0.68 ? Y2 : d < 0.95 ? R5 : R4);
    }
  }
}
function drawMonsterFace(b, key, t) {
  b.d.fill(K0);
  const lx = 330, ly = 30; // the lamp behind it, stepped
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - lx, (y - ly) * 1.2), v = 3.2 - d / 70 + (bay(x, y) - 0.5) * 0.5; if (v > 0) b.d[y * W + x] = [K1, T0, T1, T2][Math.min(3, Math.floor(v))]; }
  if (key === 0) { // it is standing right there, head lolled over
    const g = new Buf(W, H), m = drawGhost(new Buf(W, H), 0, 0, 4.4, 'tilt', { t: 1 });
    drawGhost(g, 236 - m.head[0], 116 - m.head[1], 4.4, 'tilt', { t: 1, gap: K0 }); rimLight(g, T2); blit(b, g, 0, 0); return;
  }
  if (key === 1) { sculptFace(b, 240, 132, 120, 0, t); return; }
  const open = Math.min(1, step(t - S3_REVEAL - 0.26, 8) / 4 + 0.15);
  sculptFace(b, 240, 112, 205, open, t);
}
function shotReveal(t, lt) {
  const key = lt < 0.14 ? 0 : lt < 0.26 ? 1 : 2;
  drawMonsterFace(fb, key, t);
  if (key === 2 && lt < 0.7) { const sh = [2, -2, 1, -1][step(lt, 12) % 4]; const c = fb.d.slice(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = x + sh; fb.d[y * W + x] = sx >= 0 && sx < W ? c[y * W + sx] : K0; } }
}

/* ---------- S4: the chase — three locked-off angles ---------- */
const RUNL = [0, 0.6, 1, 0.6, 0, 0, 0, 0], RUNA = [0, 1, 1.6, 1, 0, -1, -1.6, -1], RUNS = [0, 0.6, 1, 0.6, 0, -0.6, -1, -0.6];
function girlRunAway(ray, lights, amb, X, z, t, climb = 0) {
  const ph = step(t, 12) % 8, [sx, sy] = ray.project(X, ray.ground(z), z), s = Math.round((16 * ray.sc.f / z) / 47 / 0.04) * 0.04, gb = new Buf(W, H);
  girlBack(gb, ri(sx), ri(sy) - (ph % 4 === 2 ? Math.max(1, ri(s)) : 0), { s, lift: [RUNL[ph] * (1 + climb), RUNL[(ph + 4) % 8] * (1 + climb)], arm: RUNA[ph], sway: RUNS[ph] });
  volumize(gb); litSprite(fb, gb, ray.light(lights, amb, X, ray.ground(z) + 10, z));
}
// the figure placed in a scene: contact shadow, soot haze round the silhouette, a cold rim,
// and its eyes throwing a stepped red glow onto whatever is near them
function ghostAt(ray, x, z, pose, o = {}) {
  const [sx, sy] = ray.project(x, ray.ground(z), z), sc = 34 * ray.sc.f / z / 104, gb = new Buf(W, H);
  for (let i = -ri(9 * sc); i <= ri(9 * sc); i++) { const w = Math.max(1, ri(2.2 * sc * (1 - Math.abs(i) / (9.5 * sc)))); for (let j = 0; j < w; j++) if (bay(sx + i, sy + j) < 0.75) P(fb, sx + i, sy - j + 1, K0); }
  const m = drawGhost(gb, sx + (pose.sx || 0) * sc, sy, sc, pose, { eyes: 2, time: o.t || 0, ...o });
  smoke(gb, 0, 0, W, H, 9, 0); smoke(gb, 0, 0, W, H, 11, 3);
  rimLight(gb, o.rimC || T3);
  for (const [ex, ey] of m.eyes) { const r1 = 3 + sc * 4, r2 = 5 + sc * 8; for (let y = ri(ey - r2); y <= ey + r2; y++) for (let xx = ri(ex - r2); xx <= ex + r2; xx++) { if (xx < 0 || y < 0 || xx >= W || y >= H) continue; const d = Math.hypot(xx - ex, y - ey) + (bay(xx, y) - 0.5) * 2; const k = y * W + xx, c = fb.d[k]; if (EMISSIVE[c]) continue; if (d < r1) fb.d[k] = RED[UP[c]] === K0 ? R0 : RED[UP[c]]; else if (d < r2 && bay(xx, y) < 0.5) fb.d[k] = RED[c] === K0 ? K1 : RED[c]; } }
  blit(fb, gb, 0, 0);
  return m;
}
// lamps that die once she has run past them: stutter (≤3 flashes/s), then dark
function lampLife(passT, t) { if (t < passT) return 1; if (t < passT + 0.5) return [0, 1, 0][Math.min(2, step(t - passT, 6))]; return 0; }

// C1: reverse angle — she runs toward us; behind her each lamp dies where it is standing, a little closer each time
const S4AS = { f: 250, vx: 240, vy: 112, camY: 9, slope: -0.06, floorW: 11, walls: alleyKit(401, { z0: 4, z1: 260, w: 11, litP: 0.08, spray: ['위험', '철거'], mats: ['cement', 'teal', 'block', 'brick', 'teal', 'cement'] }) };
const S4AR = rayShot(S4AS);
const S4A = { a: 33.5, z0: 84, v: 15, m0: 139, mv: 24.6 };
const s4aZ = t => S4A.z0 - (t - S4A.a) * S4A.v;
const s4aM = t => S4A.m0 - (Math.floor((t - S4A.a) * 6) / 6) * S4A.mv; // it advances on its own 6 fps stride, never sliding between
S4A.lamps = [130, 104, 78, 52].map((z, i) => ({ x: i % 2 ? 7.5 : -7.5, z, h: 24, die: S4A.a + (S4A.m0 - z - 3) / S4A.mv })).concat([{ x: 7.5, z: 30, h: 24, die: 99 }]);
function shotChaseA(t, lt) {
  const ray = S4AR(), g = S4AS.slope, sk = S2Sky();
  const lights = S4A.lamps.map(l => ({ x: l.x * 0.8, y: g * l.z + l.h - 1, z: l.z, r: 34, k: 3.0 * lampLife(l.die, t) }));
  ray.shade(fb, lights, -1.7, FOG_DUSK, (x, y) => sk.d[y * W + x]);
  S4A.lamps.forEach((l, i) => lampHead(fb, ray, l.x, g * l.z + l.h, l.z, lights[i].k > 0));
  for (const [lz, items] of [[52, [{ t: 0.2, k: 'shirt', c: G4, p: 0 }, { t: 0.5, k: 'towel', c: R3, p: 2 }, { t: 0.75, k: 'pants', c: T3, p: 1 }]], [96, [{ t: 0.3, k: 'shirt', c: WH, p: 3 }, { t: 0.62, k: 'towel', c: G3, p: 1 }]]]) {
    const [a0, b0] = ray.project(-10, g * lz + 24, lz), [a1, b1] = ray.project(10, g * lz + 25, lz), near = Math.abs(s4aZ(t) - lz) < 14;
    laundry(fb, a0, b0, a1, b1, 5, items.map(i => ({ ...i, c: DN[i.c], wind: near ? 2 : 1 })), step(t, near ? 12 : 4), 1, 6 * S4AS.f / lz / 10, K0);
  }
  // it: held at each mark (under the lamp that is about to die), two poses at 4 fps, then gone into the dark
  const gz = s4aZ(t);
  ghostAt(ray, 3.5, s4aM(t), ghostGait('walk', step(t, 6), clamp((t - 36.2) / 1.6, 0, 1)), { t });
  // she runs at us (front, face in shadow)
  const ph = step(t, 12) % 8, [sx, sy] = ray.project(1, ray.ground(gz), gz), s = Math.round((16 * S4AS.f / gz) / 47 / 0.04) * 0.04, gb = new Buf(W, H);
  girlFront(gb, ri(sx), ri(sy) - (ph % 4 === 2 ? Math.max(1, ri(s)) : 0), { s, lift: [RUNL[ph], RUNL[(ph + 4) % 8]], arm: RUNA[ph] });
  volumize(gb); litSprite(fb, gb, ray.light(lights, -1.7, 1, ray.ground(gz) + 10, gz) - 0.3);
}
// C2: from above — the stepped alley, the basin, the dark following her
const S4BS = { f: 250, vx: 240, vy: -30, camY: 66, slope: 0.12, floorW: 10, walls: alleyKit(402, { z0: 10, z1: 230, w: 10, litP: 0.1, spray: [], gapP: 0.22 }) };
const S4BR = rayShot(S4BS);
const S4B = { a: 38.0, z0: 46, v: 15, basin: { x: -6.5, z: 70 }, lamps: [{ x: 7, z: 56, h: 22 }, { x: -7, z: 84, h: 22 }, { x: 7, z: 112, h: 22 }] };
const s4bZ = t => S4B.z0 + (t - S4B.a) * S4B.v, s4bM = t => { const q = Math.floor((t - S4B.a) * 6) / 6 + S4B.a; return s4bZ(q) - lerp(22, 6, clamp((q - S4B.a) / 4.4, 0, 1)); };
const s4bPass = z => { for (let t = S4B.a; t < 43; t += 1 / 12) if (s4bM(t) >= z - 2) return t; return 99; }; // a lamp dies as it passes under
const s4bGirl = z => S4B.a + (z + 6 - S4B.z0) / S4B.v;
function shotChaseB(t, lt) {
  const ray = S4BR(), g = S4BS.slope;
  const lights = S4B.lamps.map(l => ({ x: l.x * 0.8, y: g * l.z + l.h - 1, z: l.z, r: 32, k: 3.0 * lampLife(s4bPass(l.z), t) }));
  ray.shade(fb, lights, -1.6, { z0: 80, z1: 220, ramp: RM.dark, lvl: 1.5, max: 0.9 }, () => K0);
  S4B.lamps.forEach((l, i) => lampHead(fb, ray, l.x, g * l.z + l.h, l.z, lights[i].k > 0));
  // the red rubber basin: she clips it — it tips, rolls, the water spreads (keyed)
  const bz = S4B.basin.z, bx = S4B.basin.x, hit = s4bGirl(bz - 6), bf = t < hit ? -1 : step(t - hit, 12);
  const [px, py] = ray.project(bx, g * bz, bz), u = 5.5 * S4BS.f / bz / 10;
  if (bf < 0) { ell(fb, ri(px), ri(py - 3 * u), ri(5 * u), ri(2.6 * u), R3); ell(fb, ri(px), ri(py - 3.2 * u), ri(4 * u), ri(1.8 * u), R1); ell(fb, ri(px), ri(py - 3.4 * u), ri(3.4 * u), ri(1.2 * u), T1); }
  else {
    const k = Math.min(bf, 8), dx = [0, 2, 4, 6, 7, 8, 8.5, 9, 9][k] * u;
    const wr = Math.min(1, bf / 10); ell(fb, ri(px + 4 * u), ri(py), ri(9 * u * wr + 1), ri(3 * u * wr + 1), T3); ell(fb, ri(px + 3 * u), ri(py), ri(6 * u * wr), ri(2 * u * wr), T4);
    ell(fb, ri(px + dx), ri(py - 2.6 * u), ri(2.6 * u), ri(4 * u), R3); ell(fb, ri(px + dx + u), ri(py - 2.6 * u), ri(1.4 * u), ri(3 * u), R1);
    if (bf < 5) for (let i = 0; i < 10; i++) P(fb, px + (hash(i, bf, 7) - 0.3) * 14 * u, py - hash(i, bf, 8) * 8 * u, T5);
  }
  if (t >= 38.5) ghostAt(ray, -1.5, s4bM(t), ghostGait('walk', step(t, 6), clamp((t - 41) / 1.2, 0, 1)), { t, eyes: 0 });
  girlRunAway(ray, lights, -1.6, 1, s4bZ(t), t);
}
// C3: low, close behind her — it comes in from the dark at the edge of frame
const S4CS = { f: 220, vx: 240, vy: 130, camY: 11, slope: 0.1, floorW: 10, walls: alleyKit(403, { z0: 3, z1: 130, w: 10, litP: 0.15, spray: ['철거'] }), end: { z: 128, x0: -10, x1: 5, h: 40, mat: 'teal', seed: 404, feat: [{ k: 'win', u0: -6, u1: 0, v0: 18, v1: 24, lit: 1 }] } };
const S4CR = rayShot(S4CS);
const S4C = { a: 42.6, z0: 40, v: 6.5, lamps: [{ x: 7, z: 36, h: 24 }, { x: -7, z: 52, h: 24 }, { x: 7, z: 86, h: 24 }] };
const s4cZ = t => S4C.z0 + (t - S4C.a) * S4C.v, s4cPass = z => S4C.a + 0.6 + (z - S4C.z0 + 22) / S4C.v;
function shotChaseC(t, lt) {
  const ray = S4CR(), g = S4CS.slope, sk = S2Sky();
  const lights = S4C.lamps.map(l => ({ x: l.x * 0.8, y: g * l.z + l.h - 1, z: l.z, r: 36, k: 3.0 * lampLife(s4cPass(l.z), t) }));
  ray.shade(fb, lights, -1.8, FOG_DUSK, (x, y) => sk.d[y * W + x]);
  S4C.lamps.forEach((l, i) => lampHead(fb, ray, l.x, g * l.z + l.h, l.z, lights[i].k > 0));
  const poles = [[-9, g * 40 + 30, 40], [9, g * 90 + 30, 90]]; for (const p of poles) pole3(fb, ray, p[0], p[2], p[1] - g * p[2]); alleyWires(fb, ray, poles);
  girlRunAway(ray, lights, -1.8, 0.5, s4cZ(t), t);
  if (t >= 43.2 && t < 47.2) { const q = Math.floor((t - 43.2) * 6) / 6, mz = s4cZ(43.2 + q) - lerp(22, 7, q / 4); ghostAt(ray, -0.5, mz, ghostGait('crawl', step(t, 6), clamp(t - 46.2, 0, 1)), { t, eyes: 0 }); }
  if (t >= 47.2) lungeIn(step(t - 47.2, 5));
}
// it comes into frame from the left: the real figure, placed by where its head must land
function lungeIn(k) {
  const key = Math.min(k, 3), hx = [-30, 70, 118, 126][key], hy = [140, 104, 84, 82][key], sc = [2.2, 2.6, 3.0, 3.1][key];
  const pose = key === 0 ? 'lunge' : { ...GPOSE.lunge, la: [96 - key * 6, -18 + key * 4, 30], tilt: -36 };
  const m = drawGhost(new Buf(W, H), 0, 0, sc, pose, { ash: false }), g = new Buf(W, H);
  drawGhost(g, hx - m.head[0], hy - m.head[1], sc, pose, { t: key, gap: K0 }); rimLight(g, T2); blit(fb, g, 0, 0);
}
/* ---------- S5: the long stairs — the sky turns, it rises ---------- */
const S5S = { f: 240, vx: 240, vy: 205, camY: 12, slope: 0.5, stepD: 3, floorW: 8, floorZ: 96,
  walls: alleyKit(501, { z0: 3, z1: 100, w: 8, litP: 0.16, spray: ['철거'], gapP: 0.1 }) };
const S5R = rayShot(S5S);
const S5_SNAP = [56.6, 57.6], S5_RISE_T = 52.4;
const S5_LAMPS = [{ x: -6, z: 26, h: 20 }, { x: 6, z: 58, h: 20 }];
const S5Sky = new Buf(W, H);
function s5SkyAt(t, upShot) {
  const p = clamp((t - 50) / 6.5, 0, 1), teal = [K1, T0, T0, T1, T1, T2, T2, T3], red = [R0, R0, R1, R1, R2, R2, R3, R4], n = 8, bands = [];
  for (let i = 0; i < n; i++) { const fromBottom = n - 1 - i; bands.push([p * (n + 2) > fromBottom + 1 ? red[i] : teal[i], i === n - 1 ? 300 : (upShot ? 30 : 16)]); }
  sky(S5Sky, 0, 0, W, bands); strata(S5Sky, 0, 20, W, p > 0.3 ? R1 : T0, 71, 9, p > 0.3 ? R2 : T1);
  // it rises behind the roofs: stepped jumps, never smooth
  if (t > S5_RISE_T) {
    const q = Math.floor((t - S5_RISE_T) * 6) / 6, k = q * 2.2, sc = upShot ? 3.6 : 2.1, cx = upShot ? 246 : 236, base = upShot ? 250 : 200;
    const hy = Math.max(upShot ? 18 : 10, ri(base - k * (upShot ? 30 : 14))), g = new Buf(W, H);
    drawGhost(g, cx, hy + 104 * sc, sc, upShot ? { ...GPOSE.stand, tilt: 26, la: [14 + Math.min(1, q / 4) * 40, -10, 8], ra: [10 + Math.min(1, q / 4) * 30, -8, 6] } : { ...GPOSE.stand, tilt: 26, la: [14 + Math.min(1, q / 5) * 50, -10, 8], ra: [10, -6, 6] }, { eyes: 2, rim: K1, gap: K0, time: t });
    rimLight(g, R2); smoke(g, 0, 0, W, H, 9, step(t, 6)); blit(S5Sky, g, 0, 0);
  }
  return p;
}
function shotStairs(t, lt) {
  const ray = S5R(), g = S5S.slope, p = s5SkyAt(t, false);
  const lampOn = t < S5_SNAP[0] || (t < S5_SNAP[0] + 0.5 && step(t - S5_SNAP[0], 6) === 1);
  const lights = S5_LAMPS.map((l, i) => ({ x: l.x * 0.8, y: g * l.z + l.h - 1, z: l.z, r: 30, k: i === 1 && !lampOn ? 0 : 2.8 }));
  const fog = { z0: 30, z1: 110, ramp: p > 0.5 ? RM.red : RM.sky, lvl: p > 0.5 ? 1.6 : 3, max: 0.7 };
  ray.shade(fb, lights, -1.4 - p * 0.8, fog, (x, y) => S5Sky.d[y * W + x]);
  S5_LAMPS.forEach((l, i) => lampHead(fb, ray, l.x, g * l.z + l.h, l.z, lights[i].k > 0));
  for (let k = 0; k < 2; k++) for (let z = 5; z < 92; z += 1.5) { const a = ray.project(-6.5, g * z + 8 - k * 0.5, z), b = ray.project(-6.5, g * (z + 1.5) + 8 - k * 0.5, z + 1.5); L(fb, a[0], a[1], b[0], b[1], k ? K1 : G2); }
  for (let z = 6; z < 92; z += 9) { const a = ray.project(-6.5, g * z, z), b = ray.project(-6.5, g * z + 8, z); L(fb, a[0], a[1], b[0], b[1], K1); }
  const z = 14 + (t - 48.5) * 6.0; // continuous through the cutaway
  girlRunAway(ray, lights, -1.4 - p * 0.8, 0.5, z, t, 0.5);
}
function shotStairsUp(t, lt) { // cutaway: looking up past the roofs — it is there; the wires go
  const p = s5SkyAt(t, true);
  const ray = S5UR();
  ray.shade(fb, [], -1.6 - p, null, (x, y) => S5Sky.d[y * W + x]);
  // wires across the sky; two snap — keyed whip, sparks
  const W2 = [[-10, 120, 490, 70, 40], [-10, 150, 490, 110, 50], [-10, 96, 490, 150, 30], [-10, 70, 490, 40, 26]];
  W2.forEach(([x0, y0, x1, y1, sg], i) => {
    const st = i < 2 ? S5_SNAP[i] : 1e9;
    if (t < st) { wire(fb, x0, y0, x1, y1, sg, K0); return; }
    const f = step(t - st, 12), ang = [0.2, 0.7, 1.2, 1.5, 1.3, 1.45, 1.4][Math.min(6, f)], mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sg * 0.9, half = 240;
    L(fb, x0, y0, x0 + Math.cos(ang) * half * 0.7, y0 + Math.sin(ang) * half, K0); L(fb, x1, y1, x1 - Math.cos(ang) * half * 0.7, y1 + Math.sin(ang) * half, K0);
    if (f < 4) { const rr = rng(f + i * 9); for (let k = 0; k < 18 - f * 4; k++) P(fb, mx + (rr() - 0.5) * 24, my + (rr() - 0.5) * 18, rr() < 0.5 ? Y3 : R5); }
  });
}
const S5US = { f: 200, vx: 240, vy: 360, camY: 6, slope: 0.4, floorW: 9, walls: alleyKit(502, { z0: 2, z1: 60, w: 9, litP: 0.2, spray: [] }) };
const S5UR = rayShot(S5US);

/* ---------- S6a: the dead end ---------- */
const S6S = { f: 230, vx: 240, vy: 150, camY: 10, slope: 0.05, floorW: 10,
  walls: { [-1]: alleyKit(601, { z0: 3, z1: 62, w: 10, spray: [] })[-1], [1]: [
    { z0: 3, z1: 40, w: 10, h: 30, mat: 'cement', seed: 602, feat: [{ k: 'poster', u0: 10, u1: 13, v0: 6, v1: 11, seed: 3 }, { k: 'meter', u0: 20, u1: 22, v0: 10, v1: 13 }] },
    { z0: 40, z1: 62, w: 10, h: 26, mat: 'block', seed: 603, feat: [{ k: 'gate', u0: 44, u1: 54, v0: 0, v1: 15 }, { k: 'plate', u0: 55, u1: 57, v0: 11, v1: 13 }] }] },
  end: { z: 60, x0: -12, x1: 12, h: 44, mat: 'cement', seed: 604, lvl: 4.8, feat: [{ k: 'spray', u0: -9, u1: 6, v0: 22, v1: 27.5, px: 0.34, text: '철거' }, { k: 'spray', u0: -7, u1: 8, v0: 14, v1: 19.5, px: 0.34, text: '예정' }] }
};
S6S.end.tex = (r, u, v, g, side, kind, ray) => { wallTex(r, u, v, g, -1, kind, ray); const d = Math.hypot(u - 6.5, v - 8); if (Math.abs(d - 3) < 0.45 || (d < 3 && (Math.abs((u - 6.5) - (v - 8)) < 0.4 || Math.abs((u - 6.5) + (v - 8)) < 0.4))) { r.m = RM.red; r.s = 3.2; } };
const S6R = rayShot(S6S);
function shotDeadEnd(t, lt) {
  const ray = S6R(); sky(S5Sky, 0, 0, W, [[R0, 30], [R1, 30], [R2, 40], [R3, 200]]); strata(S5Sky, 0, 10, W, R1, 91, 8, R2);
  ray.shade(fb, [{ x: 0, y: 40, z: 40, r: 60, k: 1.2, air: 0 }], -1.8, { z0: 30, z1: 90, ramp: RM.red, lvl: 1.6, max: 0.5 }, (x, y) => S5Sky.d[y * W + x]);
  const [bx0, by] = ray.project(-12, ray.ground(60) + 44, 60), [bx1] = ray.project(12, 0, 60); for (let x = ri(bx0); x < bx1; x += 3) { ellO(fb, x, ri(by) - 3, 2, 2, K0); }
  wire(fb, -10, 30, 490, 20, 30, K0); wire(fb, -10, 50, 490, 44, 22, K0);
  const stopT = 60.5, z = t < stopT ? 22 + (t - 59.5) * 22 : 44;
  if (t < stopT) girlRunAway(ray, [], -1.2, 0.5, z, t);
  else { const [sx, sy] = ray.project(0.5, ray.ground(z), z), gb = new Buf(W, H); girlBack(gb, ri(sx), ri(sy), { s: 16 * S6S.f / z / 47, up: t > 61.0 ? 1 : 0, spread: t < 60.8 ? 0.8 : 0 }); volumize(gb); litSprite(fb, gb, -1.4); }
}

/* ---------- S6b: looking up — the face fills the red sky ---------- */
const S6US = { f: 190, vx: 240, vy: 400, camY: 5, slope: 0.05, floorW: 10, walls: { [-1]: [{ z0: 2, z1: 80, w: 19, h: 40, mat: 'cement', seed: 611, feat: [{ k: 'win', u0: 10, u1: 16, v0: 24, v1: 30, bars: 1 }, { k: 'win', u0: 24, u1: 30, v0: 38, v1: 44, bars: 1 }] }], [1]: [{ z0: 2, z1: 80, w: 19, h: 36, mat: 'teal', seed: 612, feat: [{ k: 'win', u0: 12, u1: 18, v0: 26, v1: 32, bars: 1 }, { k: 'cable', u0: 2, u1: 80, v0: 20, v1: 21 }] }] } };
const S6UR = rayShot(S6US);
function shotFace(t, lt) {
  const ray = S6UR();
  sky(S5Sky, 0, 0, W, [[R0, 20], [R1, 40], [R2, 40], [R1, 200]]); strata(S5Sky, 100, 10, 300, R1, 98, 10, R2);
  const st = t < 63.0 ? 0 : t < 63.3 ? 1 : t < 63.6 ? 2 : 3, eye = t < 64.2 ? 0 : t < 64.45 ? 1 : 2;
  drawFace(S5Sky, st, eye, 0);
  ray.shade(fb, [], -2.0, null, (x, y) => S5Sky.d[y * W + x]);
  for (let i = 0; i < W * H; i++) if (!ray.sky[i]) { const c = fb.d[i]; const x = i % W, y = (i / W) | 0; if ((x > 1 && ray.sky[i - 2]) || (x < W - 2 && ray.sky[i + 2])) fb.d[i] = R1; else if (c !== K0 && bay(x, y) < 0.15) fb.d[i] = R0; }
  wire(fb, -10, 40, 490, 30, 50, K0); wire(fb, -10, 70, 490, 36, 70, K0); wire(fb, 120, -2, 490, 120, 40, K1);
  const up = t < 62.2 ? 0 : t < 62.8 ? 0.5 : 1, gb = new Buf(W, H);
  girlBack(gb, 240, 282, { s: 2.3, up }); volumize(gb); shift(gb, -1); blit(fb, gb, 0, 0);
}

/* ---------- S7: the green gate, the room, the TV ---------- */
const S7S = { f: 230, vx: 240, vy: 122, camY: 13, slope: 0, floorW: 40, ceil: 31, noTerrace: 1,
  walls: { [-1]: [{ z0: 1, z1: 50, w: 22, h: 31, mat: 'teal', lvl: 3.4, blot: 0.7, noPeel: 1, noCap: 1, seed: 701, noRoof: 1, feat: [{ k: 'poster', u0: 30, u1: 35, v0: 14, v1: 21, seed: 702 }, { k: 'win', u0: 12, u1: 20, v0: 13, v1: 22, bars: 1 }] }],
           [1]: [{ z0: 1, z1: 50, w: 22, h: 31, mat: 'teal', lvl: 3.4, blot: 0.7, noPeel: 1, noCap: 1, seed: 703, noRoof: 1, feat: [{ k: 'poster', u0: 22, u1: 27, v0: 13, v1: 20, seed: 704, red: 1 }, { k: 'sign', u0: 34, u1: 40, v0: 16, v1: 20 }] }] },
  end: { z: 50, x0: -22, x1: 22, h: 31, mat: 'teal', lvl: 3.4, blot: 0.7, noPeel: 1, seed: 705, feat: [
    { k: 'poster', u0: -18, u1: -13, v0: 15, v1: 22, seed: 706 }, { k: 'poster', u0: -12.5, u1: -9, v0: 16, v1: 21, seed: 707, red: 1 }, { k: 'sign', u0: 13, u1: 18, v0: 15, v1: 22 }] },
  floorTex(r, X, z) { r.m = RM.wood; r.s = 3.0 + (fbm(X * 0.08, z * 0.08, 711) - 0.5) * 1.2; if ((X + 100) % 6 < 0.18 || z % 6 < 0.18) r.s -= 1; },
  ceilTex(r, X, z) { r.m = RM.cement; r.s = 2.4 + (fbm(X * 0.1, z * 0.1, 713) - 0.5); if ((X + 100) % 10 < 0.2 || z % 10 < 0.2) r.s -= 0.8; }
};
// wallpaper: faint diamond print, water stains
for (const g of [S7S.walls[-1][0], S7S.walls[1][0], S7S.end]) g.tex = (r, u, v, sg, side, kind, ray) => {
  wallTex(r, u, v, sg, sg === S7S.end ? -1 : side, kind, ray);
  if (r.m === RM.teal && (Math.abs(((u * 1.4) % 2) - 1) + Math.abs(((v * 1.4) % 2) - 1)) < 0.25) r.s += 0.7;
  if (sg === S7S.end && u > -2 && u < 10 && v < 21) { // the doorway with its green iron gate
    const e = Math.min(u + 2, 10 - u, 21 - v); r.m = RM.green; r.s = 2.6; if (e < 0.6) { r.m = RM.dark; r.s = 1; } else if (Math.abs(u - 4) < 0.25) { r.m = RM.dark; r.s = 1.2; } else if ((v > 2 && v < 9) || (v > 11 && v < 19)) r.s = 2.0;
  }
};
const S7R = rayShot(S7S);
const S7_DOOR = { x0: -2, x1: 10, h: 21, z: 50 };
function s7Layout() { // TV box and screen from the room's geometry
  const ray = S7R(), [x0, y0] = ray.project(-19, 13, 27), [x1, y1] = ray.project(-8, 4.5, 27);
  TV.x = ri(x0) + 5; TV.y = ri(y0) + 5; TV.w = ri(x1 - x0) - 22; TV.h = ri(y1 - y0) - 10;
  return [ri(x0), ri(y0), ri(x1 - x0), ri(y1 - y0)];
}
function shotRoom(t, lt) {
  const ray = S7R(), [bx, by, bw, bh] = s7Layout(), slam = 68.2, k = step(t - 67.3, 4);
  const open = t >= 67.3 && t < slam ? [2, 2, 1, 1][Math.min(3, Math.max(0, k))] : 0;
  const on = t >= 70.0, img = t >= 70.9, beat = t >= 74.2;
  const lights = [];
  if (on) lights.push({ x: -13.5, y: 9, z: 25, r: beat ? 46 : 40, k: beat ? 3.6 : img ? 3.1 : 2.6, cone: false, air: 0.7, ar: 9 });
  ray.shade(fb, lights, -2.4, null, () => K0);
  // the doorway: closed seams leak red; open shows the red alley and a swinging leaf
  const [dx0, dy0] = ray.project(S7_DOOR.x0, S7_DOOR.h, 50), [dx1, dy1] = ray.project(S7_DOOR.x1, 0, 50);
  if (open) {
    sky(fb, ri(dx0), ri(dy0), ri(dx1 - dx0), [[R2, 12], [R3, 10], [R1, 40]]); R(fb, ri(dx0), ri(dy1) - 8, ri(dx1 - dx0), 8, G0);
    const lw = (open === 2 ? 0.25 : 0.6) * (dx1 - dx0);
    poly(fb, [[dx0, dy0], [dx0 + lw, dy0 + 6], [dx0 + lw, dy1 - 4], [dx0, dy1]], M2); L(fb, dx0 + lw, dy0 + 6, dx0 + lw, dy1 - 4, M3);
    for (let i = 0; i < W * H; i++) { const z = ray.z[i]; if (z > 1e8 || ray.nr[i] !== 0) continue; if (Math.abs(ray.px[i] - 4) < 5 + (50 - z) * 0.32 && z > 24) fb.d[i] = RED[fb.d[i]] === K0 ? R0 : RED[fb.d[i]]; }
  } else { R(fb, ri(dx0), ri(dy0) - 1, ri(dx1 - dx0), 1, R2); R(fb, ri(dx1), ri(dy0), 1, ri(dy1 - dy0), R3); R(fb, ri(dx0), ri(dy1), ri(dx1 - dx0), 1, R2); }
  // the dead bulb on its cord
  { const [cx, cy] = ray.project(1, 31, 30), [ex, ey] = ray.project(1, 25, 30); L(fb, cx, cy, ex, ey, K1); ell(fb, ri(ex), ri(ey) + 2, 2, 3, on ? G1 : G0); }
  // low cabinet + the CRT
  { const ch = ri(bh * 0.55), cy0 = by + bh - 2; R(fb, bx - 6, cy0, bw + 12, ch, Y0); R(fb, bx - 6, cy0, bw + 12, 2, Y1); R(fb, bx + bw + 3, cy0, 3, ch, K1); R(fb, bx - 6, cy0 + ch - 2, bw + 12, 2, K1); R(fb, bx + (bw >> 1), cy0 + 3, 1, ch - 5, K1); P(fb, bx + (bw >> 1) - 3, cy0 + (ch >> 1), Y1); P(fb, bx + (bw >> 1) + 3, cy0 + (ch >> 1), Y1); D(fb, bx - 6, cy0 + 2, bw + 12, ch - 4, K1, 0.15); }
  R(fb, bx, by, bw, bh, G1); R(fb, bx, by, bw, 2, G2); R(fb, bx + bw - 2, by, 2, bh, G0); R(fb, bx, by + bh - 2, bw, 2, K1);
  R(fb, TV.x - 3, TV.y - 3, TV.w + 6, TV.h + 6, K1);
  const kx = TV.x + TV.w + 5; R(fb, kx, TV.y + 4, 9, 9, G0); ellO(fb, kx + 4, TV.y + 8, 3, 3, G3); R(fb, kx, TV.y + 18, 9, 9, G0); ellO(fb, kx + 4, TV.y + 22, 3, 3, G3); for (let j = TV.y + 32; j < TV.y + TV.h; j += 2) R(fb, kx, j, 9, 1, G0);
  L(fb, bx + 20, by, bx + 8, by - 22, G1); L(fb, bx + bw - 26, by, bx + bw - 14, by - 24, G1);
  if (!on) { R(fb, TV.x, TV.y, TV.w, TV.h, G0); L(fb, TV.x + 4, TV.y + 4, TV.x + 14, TV.y + 4, G1); }
  else if (t < 70.12) { R(fb, TV.x, TV.y, TV.w, TV.h, K0); R(fb, TV.x, TV.y + (TV.h >> 1), TV.w, 1, WH); }
  else {
    const s = img ? tvScene(beat) : null, f = step(t, 15), roll = (step(t, 6) * 3) % (TV.h + 10) - 5;
    for (let y = 0; y < TV.h; y++) for (let x = 0; x < TV.w; x++) {
      const n = hash(x, y, f); let c;
      if (!img) c = n < 0.25 ? K0 : n < 0.5 ? G1 : n < 0.75 ? G3 : n < 0.93 ? G4 : WH;
      else { c = s.d[y * TV.w + x]; if (n < 0.012) c = G4; else if (n > 0.99) c = K0; if (Math.abs(y - roll) < 2 && !EMISSIVE[c]) c = UP[c]; }
      P(fb, TV.x + x, TV.y + y, c);
    }
  }
  // her: silhouette in the doorway → back turned, pushing it shut → standing, not turning around
  const gb = new Buf(W, H), dz = 36, [gx, gy] = ray.project(4, 0, dz), gs = 16 * S7S.f / dz / 47;
  if (open && k <= 1) { const z2 = k <= 0 ? 47 : 41, [sx, sy] = ray.project(4, 0, z2); girlFront(gb, ri(sx), ri(sy), { s: 16 * S7S.f / z2 / 47 }); for (let i = 0; i < gb.d.length; i++) if (gb.d[i] !== T) gb.d[i] = K0; blit(fb, gb, 0, 0); }
  else if (open || t >= slam) {
    const br = step(Math.max(0, t - slam), 1.6) % 2, sway = open ? 1.2 : [1, -0.6, 0.3, 0][Math.min(3, step(t - slam, 8))];
    girlBack(gb, ri(gx), ri(gy), { s: gs, breath: br, sway }); volumize(gb);
    litSprite(fb, gb, open ? 0 : ray.light(lights, -2.2, 4, 10, dz) + 0.3);
  }
  // the slam: two frames of shake, dust shaken loose
  if (t >= slam && t < slam + 0.17) { const sh = step(t - slam, 12) % 2 ? -2 : 2, c = fb.d.slice(); for (let y = 0; y < H; y++) { const sy = clamp(y + sh, 0, H - 1); fb.d.set(c.subarray(sy * W, sy * W + W), y * W); } }
  if (t >= slam && t < slam + 1.2) { const df = step(t - slam, 10); for (let i = 0; i < 18; i++) P(fb, dx0 - 20 + (i * 37) % ri(dx1 - dx0 + 40), df * 9 + (i * 13) % 20, G3); }
}
