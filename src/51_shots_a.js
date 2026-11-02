/* ---------- S1: wide establishing — the hill at dusk ---------- */
const S1H = 300; // world is taller than the frame: slow stepped tilt-down
const S1_PATH = [[40, 296], [96, 270], [128, 262], [176, 236], [214, 226], [262, 200], [300, 192], [344, 168]]; // alley/stairs centre line
function s1PathAt(u) { // u 0..1 along the path → [x,y]
  const n = S1_PATH.length - 1, f = clamp(u, 0, 0.9999) * n, i = Math.floor(f), t = f - i;
  return [lerp(S1_PATH[i][0], S1_PATH[i + 1][0], t), lerp(S1_PATH[i][1], S1_PATH[i + 1][1], t)];
}
const S1W = once(() => {
  const b = new Buf(W, S1H, K0);
  sky(b, 0, 0, W, [[K1, 16], [T0, 18], [T1, 22], [T2, 24], [T3, 22], [T4, 14], [T3, 8], [Y0, 4], [R1, 3], [T2, 60]]);
  strata(b, 0, 20, W, T1, 11, 8, T2); strata(b, 40, 70, W, T2, 12, 5, T3);
  // far city: rows of apartment slabs, thin warm afterglow behind
  apartments(b, 150, 500, 150, 3, { body: T1, edge: T2, win: T0, lit: 0.035, num: true });
  apartments(b, -10, 260, 160, 4, { body: T0, edge: T1, win: K1, lit: 0.03, num: true });
  // the hill mass
  const ridge = x => 150 + Math.floor(fbm(x * 0.02, 1, 8) * 18) + Math.floor(Math.max(0, 160 - x) * 0.32);
  for (let x = 0; x < W; x++) R(b, x, ridge(x), 1, S1H - ridge(x), K1);
  // terraced houses: rows from the ridge down; farther rows lighter (aerial perspective)
  const r = rng(101), houses = [];
  for (let row = 0; row < 9; row++) {
    let x = -10 + (row * 17) % 30;
    while (x < W) {
      const w = 22 + (r() * 26 | 0), h = 14 + (r() * 10 | 0);
      const by = ridge(x + w / 2) + 12 + row * 17 + (r() * 4 | 0);
      houses.push({ x, by, w, h, row, kind: r(), lit: r() });
      x += w + 2 + (r() * 6 | 0);
    }
  }
  houses.sort((p, q) => p.by - q.by);
  const nearPath = (x, y, w) => { for (let u = 0; u <= 1; u += 0.02) { const [px, py] = s1PathAt(u); if (px > x - 6 && px < x + w + 6 && Math.abs(py - y) < 9) return true; } return false; };
  let litCount = 0;
  for (const hs of houses) {
    const { x, by, w, h, row } = hs;
    if (nearPath(x, by - 4, w)) continue;
    const far = row < 3, ramp = far ? [T1, T2, T2, T3] : hs.kind < 0.5 ? RAMP.cementD : RAMP.tealD;
    tex(b, x, by - h, w, h, ramp, 500 + x + by, 0.12, 0.04);
    R(b, x + w - 3, by - h, 3, h, DN[ramp[0]]); // side face in shade
    if (hs.kind < 0.45) slate(b, x - 1, by - h - 5, w + 2, 5, x + by, { c1: far ? T2 : G2, c2: far ? T1 : G1, c3: far ? T3 : G3, weights: 1 });
    else { R(b, x, by - h - 1, w, 1, far ? T3 : G3); if (hs.kind > 0.7) waterTank(b, x + 3 + (hs.lit * (w - 10) | 0), by - h - 1, 0.55); }
    // windows: mostly dark, a very few lit
    for (let wx = x + 3; wx < x + w - 6; wx += 9) {
      const lit = hs.lit > 0.93 && litCount < 7 && row > 1 && wx === x + 3;
      if (lit) litCount++;
      R(b, wx, by - h + 5, 4, 4, lit ? Y2 : K1); if (lit) P(b, wx + 1, by - h + 6, Y3); if (!lit) P(b, wx, by - h + 5, far ? T2 : G1);
    }
    R(b, x, by, w, 1, K1);
  }
  // the alley: steps and ramps climbing the hill
  for (let u = 0; u < 1; u += 0.002) {
    const [px, py] = s1PathAt(u);
    R(b, px - 7, py - 1, 15, 3, G1);
  }
  for (let u = 0; u < 1; u += 0.012) { const [px, py] = s1PathAt(u); R(b, px - 6, py - 1, 13, 1, G2); }
  for (let u = 0; u < 1; u += 0.004) { const [px, py] = s1PathAt(u); P(b, px - 8, py, K0); P(b, px + 8, py + 1, K0); }
  // retaining walls along the path's lower side
  for (let u = 0; u < 1; u += 0.003) { const [px, py] = s1PathAt(u); R(b, px + 8, py + 1, 2, 9, G0); }
  // red trees & flowers as accents
  redTree(b, 392, 168, 26, 18, 17, { trunk: 20 });
  redTree(b, 70, 228, 16, 11, 18, { trunk: 14 });
  redFlowers(b, 300, 212, 40, 19, 0.4); redFlowers(b, 150, 268, 30, 20, 0.4);
  // foreground houses (dark, close) at the bottom corners
  wall(b, 300, 236, 180, 64, RAMP.cementD, 61, { moss: false, cracks: 2 }); shift(b, -2, [300, 236, 180, 64]);
  slate(b, 296, 228, 188, 8, 62, { c1: G1, c2: G0, c3: G2 }); shift(b, -1, [296, 228, 188, 9]);
  windowW(b, 420, 254, 14, 10, { lit: true }); windowW(b, 336, 254, 12, 10, { glass: K0, frame: K1 });
  styro(b, 380, 228, 14, 6, 63); waterTank(b, 450, 228, 1);
  wall(b, -4, 276, 120, 30, RAMP.cementD, 64, { moss: false }); shift(b, -2, [-4, 276, 120, 30]);
  return b;
});
function shotWide(t, lt) {
  const oy = Math.max(0, 30 - Math.floor(lt * 4.2)); // tilt down in whole-pixel steps
  layer(fb, S1W(), 0, oy);
  const Y = y => y - oy;
  // poles & wires against the sky
  const a = pole(fb, 446, Y(78), Y(240), -6, { trans: true });
  const c = pole(fb, 232, Y(132), Y(222), 3, {});
  wire(fb, a[0][0], a[0][1], c[3][0], c[3][1], 18); wire(fb, a[1][0], a[1][1], c[2][0], c[2][1], 24); wire(fb, a[2][0], a[2][1], -20, Y(110), 40);
  wire(fb, a[3][0], a[3][1], 490, Y(60), 6); wire(fb, a[4][0], a[4][1], 490, Y(96), 14); wire(fb, c[0][0], c[0][1], -20, Y(150), 14);
  wire(fb, 380, -2, a[4][0], a[4][1], 6, K1);
  // small lamps along the path (lit) — the walk home
  for (const [lx, ly] of [[122, 250], [206, 212], [296, 180]]) {
    R(fb, lx, Y(ly) - 22, 1, 22, G0); R(fb, lx - 1, Y(ly) - 23, 4, 1, G1); P(fb, lx + 1, Y(ly) - 22, Y3); P(fb, lx + 2, Y(ly) - 22, Y2);
  }
  // the girl, tiny, climbing on frame ticks
  const f = step(lt, 6), u = 0.06 + f * 0.0074, [gx, gy] = s1PathAt(u);
  blit(fb, TINY[f % 4], ri(gx) - 4, Y(ri(gy)) - 16);
  light(fb, [{ x: 123, y: Y(229), r: 30, k: 1.6, sq: 0.8 }, { x: 207, y: Y(191), r: 30, k: 1.6, sq: 0.8 }, { x: 297, y: Y(159), r: 30, k: 1.6, sq: 0.8 }], -0.6, [0, Y(140), W, H]);
  fadeIn(fb, Math.min(4, step(lt, 2)));
}

/* ---------- S3: close from behind — the second shadow ---------- */
const S3W = once(() => {
  const b = new Buf(W, H, K0);
  wall(b, 0, 0, W, 214, RAMP.cement, 71, { peel: 5, cracks: 6, streak: 30, sc: 0.05 });
  R(b, 0, 206, W, 8, G1); R(b, 0, 206, W, 1, G3); // footing
  pipe(b, 58, 0, 206); meter(b, 66, 120);
  poster(b, 380, 104, 20, 26, 7, { red: true }); poster(b, 404, 114, 14, 18, 8, { c: G3 }); poster(b, 392, 132, 16, 12, 9);
  hangul(b, '출입금지', 96, 158, R2, { bold: 1, spray: 0.6, seed: 12 });
  floor(b, 0, 214, W, 56, 72, RAMP.groundD);
  for (let x = 0; x < W; x++) { const mh = Math.floor(fbm(x * 0.12, 3, 72) * 6 - 1); for (let j = 0; j < mh; j++) P(b, x, 205 - j, j === mh - 1 ? M2 : M1); }
  return b;
});
const S3_TURN = [[27.6, 0.18], [28.5, 0.36], [29.4, 0.6], [30.3, 0.86]];
function shotShadow(t, lt) {
  layer(fb, S3W(), 0, 0);
  // settling after the stop: legs apart → together, backpack sway decays (overlap)
  const k = step(lt, ANIM);
  const spread = k < 3 ? 1.2 : k < 6 ? 0.5 : 0, sway = [1.4, 1.0, -0.8, -0.5, 0.3, 0.1, 0][Math.min(6, k)];
  let yaw = 0; for (const [a, v] of S3_TURN) if (t >= a) yaw = v;
  const breath = (step(lt, 0.8) & 1) && yaw < 0.5 ? 1 : 0;
  const tilt = t >= 32.4; // the second shadow's head goes wrong — one frame change
  // shadows: build masks, darken the wall there (two steps), floor shadow too
  const m = new Buf(W, H);
  girlBack(m, 236, 214, { s: 3.5, yaw: yaw * 0.6, spread, sway: 0 });
  drawGhost(m, 316, 214, 2.05, tilt ? { ...GPOSE.behind, tilt: 62, head: [6, 7] } : 'behind', { eyes: 0 });
  // floor part of the shadows (from her feet back to the wall)
  for (const lx of [-8, 8]) poly(m, [[228 + lx - 5, 262], [228 + lx + 5, 262], [236 + lx * 1.27 + 4, 214], [236 + lx * 1.27 - 4, 214]], K0);
  for (const lx of [-6, 6]) poly(m, [[318 + lx - 5, 270], [318 + lx + 5, 270], [316 + lx * 1.3 + 3, 214], [316 + lx * 1.3 - 3, 214]], K0);
  // light: pool on the wall from a lamp behind the camera — then shadows cut it
  light(fb, [{ x: 250, y: 120, r: 290, k: 2.6, sq: 0.8 }], -2.2, null, 0.45);
  for (let i = 0; i < m.d.length; i++) if (m.d[i] !== T) fb.d[i] = DN[DN[DN[fb.d[i]]]];
  // the girl (lit from behind: her back is in the brighter band)
  girlBack(fb, 228, 262, { s: 2.75, yaw, spread, sway, breath });
  light(fb, [{ x: 228, y: 150, r: 150, k: 1.2, sq: 1.2 }], -0.6, [120, 100, 220, 170], 0.5);
}

/* ---------- S4: the chase — side tracking through the alleys ---------- */
const S4_LEN = 2500, S4_GY = 232, S4_SPEED = 118;
const S4_LAMPS = [140, 560, 1010, 1380, 1760, 2140];
const S4_BASIN = 770;
const S4Far = once(() => {
  const b = new Buf(Math.ceil(S4_LEN * 0.3) + W, H, T);
  sky(b, 0, 0, b.w, [[K0, 20], [K1, 26], [T0, 30], [T1, 26], [T0, 60]]);
  strata(b, 0, 30, b.w, T0, 31, 12, T1);
  apartments(b, 0, b.w, 120, 44, { body: T0, edge: T1, win: K1, lit: 0.05, num: true });
  for (let x = 0; x < b.w; x++) { const y = 112 + Math.floor(fbm(x * 0.03, 2, 45) * 22); R(b, x, y, 1, H - y, K1); }
  return b;
});
const S4Mid = once(() => { // rooftops of the next terrace up
  const b = new Buf(Math.ceil(S4_LEN * 0.6) + W, H, T), r = rng(46);
  let x = -10;
  while (x < b.w) {
    const w = 40 + (r() * 50 | 0), top = 92 + (r() * 30 | 0), kind = r();
    wall(b, x, top, w, 160 - top + 40, kind < 0.5 ? RAMP.tealD : RAMP.cementD, x + 3, { moss: false, cracks: 1, streak: 8 });
    shift(b, -2, [x, top, w, 200]);
    if (kind < 0.4) slate(b, x - 2, top - 7, w + 4, 7, x + 9, { c1: G1, c2: G0, c3: G2, weights: 2 });
    else { R(b, x - 1, top - 1, w + 2, 1, G1); if (kind > 0.7) waterTank(b, x + 5, top - 1, 0.8); else if (kind > 0.55) { styro(b, x + 4, top - 1, 10, 5, x, true); basin(b, x + 18, top - 1, 7); } }
    for (let wx = x + 6; wx < x + w - 10; wx += 16) {
      const lit = r() < 0.08; R(b, wx, top + 10, 7, 6, lit ? Y2 : K0); if (lit) { P(b, wx + 2, top + 12, Y3); }
      for (let i = wx + 1; i < wx + 7; i += 2) R(b, i, top + 9, 1, 8, K1);
    }
    x += w + (r() * 4 | 0);
  }
  redTree(b, 470, 92, 30, 20, 47, { trunk: 18 }); redTree(b, 1130, 98, 22, 15, 48, { trunk: 18 });
  return b;
});
const S4Main = once(() => {
  const b = new Buf(S4_LEN, H, T), gy = S4_GY, r = rng(48);
  // segment walls along the alley's back side
  const segs = [
    [0, 300, 'cement', 128], [300, 620, 'teal', 112], [620, 860, 'brick', 150], [860, 1180, 'lot', 0],
    [1180, 1520, 'cement', 120], [1520, 1920, 'teal', 104], [1920, 2200, 'cementD', 126], [2200, 2500, 'cementD', 140]
  ];
  for (const [a, z, kind, top] of segs) {
    if (kind === 'lot') { // demolished lot: rubble, fence, spray
      for (let x = a; x < z; x++) { const h = 8 + Math.floor(fbm(x * 0.05, 5, 49) * 26); R(b, x, gy - h, 1, h, (x & 3) ? G1 : G0); if (hash(x, 1, 49) < 0.2) P(b, x, gy - h - 1, G2); }
      for (let i = 0; i < 40; i++) { const x = a + r() * (z - a), y = gy - 4 - r() * 22; R(b, x, y, 3 + r() * 6, 2 + r() * 3, r() < 0.3 ? R1 : G2); }
      // broken wall stub with the old wallpaper of a vanished room
      wall(b, a + 40, 150, 70, gy - 150, RAMP.cement, 50, { peel: 3 });
      for (let x = a + 40; x < a + 110; x++) { const cut = 150 + Math.floor(Math.abs(Math.sin(x * 0.21)) * 18 + fbm(x * 0.2, 0, 3) * 10); R(b, x, 150, 1, cut - 150, T); }
      R(b, a + 52, 176, 34, 22, T3); D(b, a + 52, 176, 34, 22, T4, 0.3); for (let i = a + 54; i < a + 86; i += 5) R(b, i, 176, 1, 22, T2);
      // construction fence + sign
      for (let x = a + 130; x < z - 10; x += 22) { R(b, x, 168, 20, gy - 168, G3); R(b, x, 168, 20, 1, G4); R(b, x + 19, 168, 1, gy - 168, G1); for (let j = 172; j < gy - 4; j += 9) R(b, x + 1, j, 18, 1, G2); }
      R(b, a + 168, 182, 70, 20, WH); R(b, a + 168, 182, 70, 1, G4); R(b, a + 168, 201, 70, 1, G3);
      hangul(b, '출입금지', a + 172, 185, R3, {});
      hangul(b, '철거', a + 270, 176, R3, { bold: 1, spray: 0.8, seed: 51 }); xMark(b, a + 250, 210, 9);
      continue;
    }
    if (kind === 'brick') brickWall(b, a, top, z - a, gy - top + 2, a);
    else wall(b, a, top, z - a, gy - top + 2, RAMP[kind] || RAMP.cementD, a + 7, { peel: kind === 'teal' ? 8 : 3, cracks: 4, streak: 24 });
    R(b, a - 1, top - 3, z - a + 2, 3, G1); R(b, a - 1, top - 3, z - a + 2, 1, G3);
    if (a > 0) { R(b, a - 1, top - 3, 2, gy - top + 5, K1); }
  }
  // details per segment
  gate(b, 40, gy - 54, 36, 54, {}); windowW(b, 180, 150, 14, 12, {}); poster(b, 214, 170, 12, 15, 81, { red: true }); meter(b, 250, 160);
  windowW(b, 340, 136, 16, 14, {}); windowW(b, 480, 136, 16, 14, { lit: true, curtain: true }); acUnit(b, 400, 176); pipe(b, 446, 112, gy);
  hangul(b, '철거 예정', 352, 186, R3, { bold: 1, spray: 1, seed: 82 });
  styro(b, 630, 150, 16, 8, 83); styro(b, 650, 150, 12, 7, 84); basin(b, 668, 150, 9); styro(b, 690, 150, 18, 8, 85, false); redFlowers(b, 624, gy, 230, 86, 0.25);
  door(b, 720, gy - 46, 22, 46, T2); xMark(b, 800, 184, 9); hangul(b, '공가', 760, 168, R3, { bold: 1, spray: 0.7, seed: 87 });
  for (let i = 0; i < 5; i++) poster(b, 1200 + i * 17, 160 + (i * 7) % 12, 14, 16, 90 + i, { red: i === 2, c: i % 2 ? G3 : G4 });
  windowW(b, 1300, 140, 14, 12, {}); acUnit(b, 1330, 170); meter(b, 1420, 166); pipe(b, 1460, 120, gy); gate(b, 1470, gy - 56, 40, 56, { c: B0, d: T1, l: B1 });
  hangul(b, '위험', 1395, 196, R3, { bold: 1, spray: 0.6, seed: 93 });
  windowW(b, 1560, 124, 18, 14, {}); windowW(b, 1640, 124, 18, 14, {}); windowW(b, 1840, 124, 18, 14, { lit: true });
  door(b, 1600, gy - 48, 22, 48, G1); styro(b, 1680, gy, 14, 7, 94); redFlowers(b, 1690, gy, 60, 95, 0.4);
  poster(b, 1960, 164, 16, 20, 96, { photo: true }); windowW(b, 2030, 146, 12, 12, { glass: K0 }); gate(b, 2090, gy - 52, 36, 52, {});
  hangul(b, '철거 예정', 2240, 170, R3, { bold: 1, spray: 1, seed: 97 }); xMark(b, 2400, 182, 10);
  // ground
  const fl = new Buf(S4_LEN, H); tex(fl, 0, gy, S4_LEN, H - gy, RAMP.groundD, 98, 0.09, 0.08);
  for (let x = 0; x < S4_LEN; x++) { for (let j = gy; j < H; j++) b.d[j * S4_LEN + x] = fl.d[j * S4_LEN + x]; P(b, x, gy, K1); if (hash(x, 9, 99) < 0.08) P(b, x, gy - 1, M2); }
  for (let x = 0; x < S4_LEN; x += 37 + (hash(x, 2, 3) * 30 | 0)) L(b, x, gy + 2, x - 20, H, K1);
  // poles
  for (const lx of S4_LAMPS) pole(b, lx - 12, 60, gy + 1, (hash(lx, 0, 1) - 0.5) * 6, { trans: hash(lx, 1, 1) < 0.4 });
  return b;
});
// foreground laundry lines strung across the alley (pass in front of the camera)
const S4_LAUNDRY = [
  { a: 280, z: 470, y0: 96, y1: 116, sag: 14, items: [{ t: 0.1, k: 'shirt', c: G4, p: 0, wind: 1 }, { t: 0.3, k: 'towel', c: R2, p: 2, wind: 1 }, { t: 0.5, k: 'pants', c: T2, p: 1, wind: 1 }, { t: 0.72, k: 'shirt', c: WH, p: 3, wind: 1 }] },
  { a: 560, z: 690, y0: 104, y1: 92, sag: 12, items: [{ t: 0.2, k: 'towel', c: G3, p: 1, wind: 1 }, { t: 0.47, k: 'pants', c: G2, p: 2, wind: 1 }, { t: 0.7, k: 'shirt', c: T4, p: 4, wind: 1 }] },
  { a: 1540, z: 1720, y0: 92, y1: 110, sag: 16, items: [{ t: 0.15, k: 'pants', c: G2, p: 0, wind: 1 }, { t: 0.42, k: 'shirt', c: R3, p: 3, wind: 1 }, { t: 0.7, k: 'towel', c: G4, p: 1, wind: 1 }] }
];
const S4_MASK = new Uint8Array(W * H);
function s4Mask(cam) { const m = S4Main(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S4_MASK[y * W + x] = m.d[y * S4_LEN + x + cam] !== T ? 1 : 0; S4_MASK.amb = -1.4; return S4_MASK; }
// streetlight life: on until she passes; then a stutter and dead
function s4LampState(i, t) {
  const pass = 33.5 + (S4_LAMPS[i] + 70 - 120) / S4_SPEED; // she is ~70px past it
  if (t < pass) return 1; if (t < pass + 0.35) return [0, 1, 0][Math.min(2, step(t - pass, 6))]; return 0;
}
// ghost marks: [start, end, screenX at start, pose sequence (4fps)]
const S4_GHOST = [[36.9, 38.3, 40, ['hunch', 'hunch', 'hunch', 'tilt', 'tilt', 'tilt']], [40.3, 41.2, 70, ['raised', 'raised', 'raised', 'reach']],
  [43.1, 44.0, 96, ['reach', 'reach', 'lean', 'lean']], [46.3, 47.6, 118, ['lunge', 'lunge', 'lunge', 'reach', 'reach', 'lunge']]];
function shotChase(t, lt) {
  const f = step(lt, 12), gx = 120 + f * (S4_SPEED / 12), cam = Math.max(0, Math.min(S4_LEN - W, ri(gx) - 190));
  layer(fb, S4Far(), ri(cam * 0.3), 0);
  layer(fb, S4Mid(), ri(cam * 0.6), 0);
  wire(fb, -10, 30 + (cam * 0.6 % 40) * 0.2, 490, 50, 18, K1);
  layer(fb, S4Main(), cam, 0);
  const X = x => x - cam;
  // lamps & wires between poles
  const lights = [];
  for (let i = 0; i < S4_LAMPS.length; i++) {
    const lx = X(S4_LAMPS[i]); if (lx < -150 || lx > W + 150) continue;
    const on = s4LampState(i, t), lp = lamp(fb, lx - 10, 108, on, 1);
    if (i + 1 < S4_LAMPS.length) { const nx = X(S4_LAMPS[i + 1]); wire(fb, lx - 20, 66, nx - 20, 66, 26); wire(fb, lx - 6, 66, nx - 6, 66, 34); wire(fb, lx - 12, 73, nx - 12, 73, 42, K1); }
    if (on) lights.push({ x: lp[0], y: lp[1], r: 120, k: 3.0, sq: 0.7, cone: { spread: 0.7, w: 6 } });
  }
  // basin: sits in her path, she clips it — it tips, rolls, water spreads
  const bx = X(S4_BASIN), hit = 33.5 + (S4_BASIN - 120 - 6) / S4_SPEED, bf = t < hit ? -1 : step(t - hit, 12);
  if (bf < 0) basin(fb, bx, S4_GY, 10);
  else {
    const k = Math.min(bf, 9), dx = [0, 1, 3, 5, 8, 10, 12, 13, 14, 14][k];
    if (k === 0) poly(fb, [[bx, S4_GY - 6], [bx + 10, S4_GY - 8], [bx + 11, S4_GY - 2], [bx + 1, S4_GY]], R3);
    else if (k === 1) { poly(fb, [[bx + 2, S4_GY - 9], [bx + 10, S4_GY - 7], [bx + 9, S4_GY], [bx + 2, S4_GY]], R3); R(fb, bx + 3, S4_GY - 9, 7, 1, R4); }
    else { ell(fb, bx + dx + 4, S4_GY - 4, 3, 4, R3); ell(fb, bx + dx + 4, S4_GY - 4, 1, 3, R1); R(fb, bx + dx + 1, S4_GY - 8, 1, 8, R4); }
    // water: stepped spread on the floor
    const ww = Math.min(30, bf * 3);
    if (bf > 0) { R(fb, bx - 2, S4_GY + 1, ww, 1, T3); R(fb, bx + 2, S4_GY + 2, Math.max(0, ww - 8), 1, T2); if (bf < 6) for (let i = 0; i < 6; i++) P(fb, bx + 3 + i * 3 + bf, S4_GY - 2 - ((i * 7 + bf * 3) % 6), T5); }
  }
  // ghost: appears only at held marks, in wrong poses at too-few frames
  for (const [a, z, sx, poses] of S4_GHOST) {
    if (t < a || t >= z) continue;
    const k = Math.min(poses.length - 1, step(t - a, 4)), tk = a + k / 4; // held at 4fps marks
    const camK = Math.max(0, ri(120 + step(tk - 33.5, 12) * (S4_SPEED / 12)) - 190);
    const gb = new Buf(W, H); drawGhost(gb, X(camK + sx + k * 7), S4_GY + 1, 0.95, poses[k], { eyes: 2 });
    rimLight(gb, T3); blit(fb, gb, 0, 0);
  }
  // the girl
  girlSide(fb, 'run', f, X(gx), S4_GY + 1);
  const mk = s4Mask(cam); light(fb, lights, -1.4, [0, 50, W, 220], 0.55, mk);
  // foreground laundry whips by (closer than the alley: 1.3× parallax), drawn after lighting = silhouettes with a rim
  for (const ln of S4_LAUNDRY) {
    const a = ln.a * 1.3 - cam * 1.3 + 60, z = ln.z * 1.3 - cam * 1.3 + 60; if (z < -20 || a > W + 20) continue;
    const near = Math.abs((a + z) / 2 - 190) < 120;
    laundry(fb, a, ln.y0, z, ln.y1, ln.sag, ln.items.map(i => ({ ...i, c: DN[i.c] })), step(t, near ? 12 : 5), 1, 2.2, K0);
  }
  // foreground pole every so often (closer plane)
  for (const px of [700, 1600]) { const x = ri(px * 1.3 - cam * 1.3); if (x > -10 && x < W + 10) { R(fb, x, 0, 7, H, K0); R(fb, x + 1, 0, 1, H, K1); } }
}
