/* luminance-matched red ramp (for red sky light / door spill) */
const RED = new Uint8Array(256);
(function () {
  const lum = i => { const h = HEX[i]; return 0.3 * parseInt(h.slice(0, 2), 16) + 0.55 * parseInt(h.slice(2, 4), 16) + 0.15 * parseInt(h.slice(4, 6), 16); };
  const ramp = [K0, R0, R1, R2, R3, R4];
  for (let i = 0; i < 256; i++) RED[i] = i;
  for (let i = 0; i < HEX.length; i++) {
    if (EMISSIVE[i]) continue; const l = lum(i) * 0.9; let best = K0, bd = 1e9;
    for (const r of ramp) { const d = Math.abs(lum(r) - l); if (d < bd) { bd = d; best = r; } } RED[i] = best;
  }
})();

/* ---------- S5: the long staircase — the sky turns, it rises ---------- */
const S5_W = 760, S5_H = 640, S5_X0 = 40, S5_Y0 = 600, S5_RUN = 8, S5_RISE = 6, S5_N = 74;
const s5Step = i => [S5_X0 + i * S5_RUN, S5_Y0 - i * S5_RISE];
const S5_POLES = [150, 360, 560];
const S5Main = once(() => {
  const b = new Buf(S5_W, S5_H, T), r = rng(55);
  // houses behind the stairs (upper-left of the stair line), stepped terraces
  let x = -20;
  while (x < S5_W) {
    const w = 46 + (r() * 40 | 0), base = Math.min(S5_H, S5_Y0 - Math.min(S5_N, Math.floor((x + w - S5_X0) / S5_RUN)) * S5_RISE + 2), h = 60 + (r() * 40 | 0), top = base - h, kind = r();
    wall(b, x, top, w, h + 2, kind < 0.5 ? RAMP.cementD : RAMP.tealD, x + 1, { cracks: 2, streak: 16, moss: false, peel: 2 });
    if (kind < 0.45) slate(b, x - 3, top - 8, w + 6, 8, x + 2, { weights: 2 });
    else { R(b, x - 1, top - 2, w + 2, 2, G2); waterTank(b, x + 6, top - 2, 1); if (kind > 0.75) { basin(b, x + 24, top - 2, 9); styro(b, x + 36, top - 2, 10, 6, x); } }
    const lit = r() < 0.18;
    windowW(b, x + 10, top + 16, 12, 10, { lit, curtain: lit }); if (w > 60) windowW(b, x + w - 24, top + 16, 12, 10, {});
    if (r() < 0.5) poster(b, x + 4, top + 40, 10, 13, x, { red: r() < 0.4 });
    x += w + 2;
  }
  hangul(b, '철거 예정', 300, 300, R3, { bold: 1, spray: 1, seed: 56 });
  xMark(b, 520, 200, 10);
  // top landing beyond the last step
  const topY = S5_Y0 - S5_N * S5_RISE, topX = S5_X0 + S5_N * S5_RUN;
  // the stairs: nosings bright, risers in shade, a stone retaining band below
  for (let i = 0; i < S5_N; i++) {
    const [sx, sy] = s5Step(i);
    R(b, sx, sy, S5_RUN, 44, G1);
    tex(b, sx, sy + 3, S5_RUN, 41, [G0, G1, G1, G2], 57, 0.12, 0.1);
    R(b, sx, sy, S5_RUN, 1, G4); R(b, sx, sy + 1, S5_RUN, 2, G3); R(b, sx + S5_RUN - 1, sy, 1, S5_RISE, G0);
    if (hash(i, 0, 58) < 0.3) P(b, sx + 2, sy - 1, M2);
    for (let j = 10; j < 44; j += 7) R(b, sx, sy + j, S5_RUN, 1, G0); // stone courses
  }
  R(b, topX, topY, S5_W - topX, 44, G1); tex(b, topX, topY + 3, S5_W - topX, 41, [G0, G1, G1, G2], 57, 0.12, 0.1); R(b, topX, topY, S5_W - topX, 1, G4); R(b, topX, topY + 1, S5_W - topX, 2, G3);
  for (let xx = 0; xx < S5_W; xx++) { const i = Math.floor((xx - S5_X0) / S5_RUN), base = i >= S5_N ? topY : S5_Y0 - i * S5_RISE; for (let j = 0; j < 4; j++) if (fbm(xx * 0.2, j, 60) > 0.5) P(b, xx, base + 40 + j, M1); }
  // lower terrace in front: rooftops below the stairs, walls dropping out of frame; the hill behind them
  for (let xx = 0; xx < S5_W; xx++) { const i = Math.min(S5_N, Math.max(0, Math.floor((xx - S5_X0) / S5_RUN))), base = S5_Y0 - i * S5_RISE + 44; R(b, xx, base, 1, S5_H - base, K1); }
  let lx = S5_X0 + 10;
  while (lx < S5_W) {
    const w = 40 + (r() * 36 | 0), i = Math.min(S5_N, Math.floor((lx - S5_X0) / S5_RUN)), sy = S5_Y0 - i * S5_RISE, top = sy + 52 + (r() * 16 | 0), kind = r();
    wall(b, lx, top, w, S5_H - top, kind < 0.5 ? RAMP.cementD : RAMP.tealD, lx + 11, { moss: false, cracks: 2, streak: 12 });
    if (kind < 0.5) slate(b, lx - 2, top - 7, w + 4, 7, lx + 12, { weights: 2 });
    else { R(b, lx - 1, top - 2, w + 2, 2, G2); if (kind > 0.7) waterTank(b, lx + 8, top - 2, 1); else { basin(b, lx + 8, top - 2, 9); styro(b, lx + 22, top - 2, 12, 6, lx, true); } }
    windowW(b, lx + 8, top + 14, 10, 9, { lit: r() < 0.12 }); if (w > 56) windowW(b, lx + w - 20, top + 14, 10, 9, {});
    lx += w + 3;
  }
  for (let i = 4; i < S5_N; i += 9) { const [sx, sy] = s5Step(i); crack(b, sx, sy + 10, 26, K1, i); }
  // handrail with posts
  for (let i = 0; i < S5_N - 1; i++) { const [ax, ay] = s5Step(i), [bx, by] = s5Step(i + 1); L(b, ax + 4, ay - 16, bx + 4, by - 16, G3); L(b, ax + 4, ay - 15, bx + 4, by - 15, G0); if (i % 6 === 0) R(b, ax + 4, ay - 16, 1, 16, G1); }
  // big crimson tree beside the stairs + flowers on the terraces
  redTree(b, 120, 380, 52, 38, 61, { trunk: 50, lean: 6 });
  redTree(b, 470, 150, 30, 20, 62, { trunk: 24 });
  for (let i = 2; i < S5_N; i += 11) { const [sx, sy] = s5Step(i); redFlowers(b, sx - 30, sy + 1, 26, i, 0.4); }
  for (const px of S5_POLES) { const i = Math.floor((px - S5_X0) / S5_RUN), sy = S5_Y0 - i * S5_RISE; pole(b, px, sy - 130, sy + 1, (hash(px, 2, 2) - 0.5) * 8, { trans: px === 360 }); }
  return b;
});
const S5_SNAP = [56.6, 57.6], S5_RISE_T = 51.8;
function s5Wires(t, cx, cy) {
  const P2 = S5_POLES.map(px => { const i = Math.floor((px - S5_X0) / S5_RUN), sy = S5_Y0 - i * S5_RISE; return [px - cx, sy - 130 + 5 - cy]; });
  const spans = [[P2[0], P2[1], 30, 0], [P2[1], P2[2], 24, 1], [[P2[0][0] - 220, P2[0][1] + 90], P2[0], 40, -1], [P2[2], [P2[2][0] + 260, P2[2][1] - 80], 30, -1]];
  for (const [a, z, sag, snapI] of spans) for (let k = 0; k < 3; k++) {
    const off = k * 5 - 5, A = [a[0] + off, a[1] + (k === 2 ? 8 : 0)], Z = [z[0] + off, z[1] + (k === 2 ? 8 : 0)];
    const st = snapI >= 0 && k === 1 ? S5_SNAP[snapI] : 1e9;
    if (t < st) { wire(fb, A[0], A[1], Z[0], Z[1], sag + k * 6, K0); continue; }
    // snapped: two halves fall and whip in stepped frames, then hang
    const ft = step(t - st, 12), ang = [0.2, 0.6, 1.1, 1.5, 1.3, 1.45, 1.4][Math.min(6, ft)];
    const half = Math.hypot(Z[0] - A[0], Z[1] - A[1]) * 0.45;
    L(fb, A[0], A[1], A[0] + Math.cos(ang) * half * 0.6, A[1] + Math.sin(ang) * half, K0);
    L(fb, Z[0], Z[1], Z[0] - Math.cos(ang) * half * 0.6, Z[1] + Math.sin(ang) * half, K0);
    if (ft < 4) { const mx = (A[0] + Z[0]) / 2, my = (A[1] + Z[1]) / 2 + sag * 0.8; const rr = rng(ft + snapI * 9); for (let i = 0; i < 14 - ft * 3; i++) P(fb, mx + (rr() - 0.5) * 18, my + (rr() - 0.5) * 14, rr() < 0.5 ? Y3 : R5); }
  }
}
function s5Sky(t) {
  const p = clamp((t - 50) / 6.5, 0, 1), teal = [K1, T0, T0, T1, T1, T2, T2, T3], red = [R0, R0, R1, R1, R2, R2, R3, R4];
  const n = teal.length, bands = [];
  for (let i = 0; i < n; i++) { const fromBottom = n - 1 - i; const c = p * (n + 2) > fromBottom + 1 ? red[i] : teal[i]; bands.push([c, i === n - 1 ? 200 : 22]); }
  sky(fb, 0, 0, W, bands);
  if (p > 0.3) strata(fb, 0, 30, W, R1, 71, 8, R2); else strata(fb, 0, 30, W, T0, 71, 8, T1);
  return p;
}
function shotStairs(t, lt) {
  const f = step(lt, 12), si = Math.min(S5_N - 3, Math.floor(f * 0.5) + 1), [sx, sy] = s5Step(si);
  const gx = sx + 4, gy = sy;
  const cx = clamp(ri(gx - 210), 0, S5_W - W), cy = clamp(ri(gy - 175), 0, S5_H - H);
  const p = s5Sky(t);
  // the giant rises behind the houses — stepped jumps, never smooth
  if (t > S5_RISE_T) {
    const k = step(t - S5_RISE_T, 2.2), hy = Math.max(58, 300 - k * 24);
    const g = new Buf(W, H); drawGhost(g, 70, hy + 385, 3.7, k > 10 ? 'reach' : 'lean', { eyes: 2, rim: K1 });
    rimLight(g, R2); smoke(g, 0, 0, W, H, 9, step(t, 6)); blit(fb, g, 0, 0);
  }
  layer(fb, S5Main(), cx, cy);
  s5Wires(t, cx, cy);
  // lamp on the middle pole dies with the first snap
  const pi = Math.floor((360 - S5_X0) / S5_RUN), py = S5_Y0 - pi * S5_RISE;
  const lampOn = t < S5_SNAP[0] || (t < S5_SNAP[0] + 0.3 && step(t - S5_SNAP[0], 6) === 1);
  const lp = lamp(fb, 360 - cx + 1, py - 112 - cy, lampOn, 1);
  const lights = lampOn ? [{ x: lp[0], y: lp[1], r: 110, k: 2.6, sq: 0.7, cone: { spread: 0.7, w: 5 } }] : [];
  // world falls into silhouette as the sky reddens (stepped)
  light(fb, lights, -1 - Math.floor(p * 3) * 0.6, [0, 0, W, H], 0.5, s5Mask(cx, cy, -0.0));
  const gb = new Buf(W, H); girlSide(gb, 'climb', f, gx - cx, gy - cy + 1);
  if (p > 0.5) remapRect(gb, 0, 0, W, H, DN); blit(fb, gb, 0, 0);
  if (p > 0.4) { // red rim from the sky on upward-facing edges
    const m = S5Main();
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const k = (y + cy) * S5_W + x + cx; if (m.d[k] !== T && m.d[k - S5_W] === T && fb.d[y * W + x] !== K0) fb.d[y * W + x] = p > 0.8 ? R2 : R1; }
  }
}
const S5_MASK = new Uint8Array(W * H);
function s5Mask(cx, cy) { const m = S5Main(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S5_MASK[y * W + x] = m.d[(y + cy) * S5_W + x + cx] !== T ? 1 : 0; S5_MASK.amb = 0; return S5_MASK; }

/* ---------- S6a: dead end (side) ---------- */
const S6W = once(() => {
  const b = new Buf(W, H, T), gy = 236;
  wall(b, 0, 120, 380, gy - 120 + 2, RAMP.cementD, 81, { peel: 3, cracks: 5, streak: 22 });
  R(b, -1, 117, 382, 3, G1); R(b, -1, 117, 382, 1, G3);
  gate(b, 120, gy - 60, 42, 60, {}); windowW(b, 220, 146, 14, 12, { glass: K0 }); poster(b, 250, 170, 14, 18, 82, { red: true });
  styro(b, 30, gy, 16, 8, 83); redFlowers(b, 60, gy, 50, 84, 0.4);
  // the dead end: a tall blank wall of the next lot, sprayed
  wall(b, 380, 40, 100, gy - 38, RAMP.cement, 85, { peel: 2, cracks: 7, streak: 40 });
  R(b, 378, 40, 3, gy - 38, K1);
  hangul(b, '철거', 400, 120, R3, { bold: 1, spray: 1, seed: 86 }); hangul(b, '예정', 404, 142, R3, { bold: 1, spray: 1, seed: 87 }); xMark(b, 440, 186, 11);
  for (let i = 0; i < 100; i += 3) { P(b, 380 + i, 38, G3); P(b, 381 + i, 37, K1); } // barbed wire coil
  for (let i = 0; i < 100; i += 6) ellO(b, 383 + i, 34, 3, 3, K1);
  const fl = new Buf(W, H); tex(fl, 0, gy, W, H - gy, RAMP.groundD, 88, 0.09, 0.08);
  for (let x = 0; x < W; x++) for (let j = gy; j < H; j++) b.d[j * W + x] = fl.d[j * W + x];
  R(b, 0, gy, W, 1, K1);
  return b;
});
function shotDeadEnd(t, lt) {
  sky(fb, 0, 0, W, [[R0, 24], [R1, 30], [R2, 34], [R3, 30], [R2, 160]]); strata(fb, 0, 20, W, R1, 91, 8, R2);
  layer(fb, S6W(), 0, 0);
  wire(fb, -10, 60, 490, 40, 30, K0); wire(fb, -10, 70, 490, 66, 22, K0);
  const f = step(lt, 12), stopF = 12; // runs in for 1s then stops
  if (f < stopF) girlSide(fb, 'run', f, 150 + f * 14, 237);
  else girlSide(fb, lt > 1.5 ? 'up' : 'stand', 0, 150 + stopF * 14 - 4, 237);
  const m = S6W(), mk = new Uint8Array(W * H); for (let i = 0; i < mk.length; i++) mk[i] = m.d[i] !== T ? 1 : 0; mk.amb = 0;
  light(fb, [], -1.6, null, 0.5, mk); for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const k = y * W + x; if (m.d[k] !== T && m.d[k - W] === T) { fb.d[k] = R2; if (y + 1 < H) fb.d[k + W] = R1; } }
}

/* ---------- S6b: low angle — the face in the sky ---------- */
const FACE_CACHE = new Map();
function drawFace(b, stage, eye, look) {
  const key = stage + ',' + eye + ',' + look; let c = FACE_CACHE.get(key);
  if (!c) { c = new Buf(W, H); drawFaceRaw(c, stage, eye, look); FACE_CACHE.set(key, c); }
  blit(b, c, 0, 0);
}
function drawFaceRaw(b, stage, eye, look) {
  // stage 0..3: face condenses out of the cloud in stepped densities; eye 0 closed .. 2 open
  const cx = 240, cy = 104;
  if (stage <= 0) return;
  const thr = [0, 0.75, 0.45, 0.2][stage];
  for (let y = 0; y < 230; y++) for (let x = 60; x < 420; x++) {
    const dx = (x - cx) / 180, dy = (y - cy - 20) / 150, d = dx * dx + dy * dy;
    if (d > 1) continue;
    const n = fbm(x * 0.04, y * 0.05, 93);
    if (n + (1 - d) * 0.6 < thr + 0.35) continue;
    // forms: brow ridges, sockets, nose shadow, cheek mass — stepped tone
    let v = 0.55 + (1 - d) * 0.3 + (n - 0.5) * 0.5;
    for (const ex of [-1, 1]) {
      const ox = (x - (cx + ex * 58)) / 46, oy = (y - (cy - 2)) / 28, s = ox * ox + oy * oy;
      if (s < 1.6) v -= (1.6 - s) * 0.35; // socket
      const bx = (x - (cx + ex * 58)) / 50; if (Math.abs(bx) < 1) { const arc = cy - 40 + bx * bx * 10 + bx * ex * 6, th = 6 * (1 - Math.abs(bx + ex * 0.3) * 0.6); if (Math.abs(y - arc) < th) v -= 0.5 * (1 - Math.abs(y - arc) / (th + 1)); } // brow
    }
    const nx = Math.abs(x - cx), ny = y - cy; if (nx < 14 && ny > 10 && ny < 80) v -= (14 - nx) / 14 * 0.25 * (ny / 80); if (nx < 20 && ny > 76 && ny < 84) v -= 0.18 * (1 - nx / 20);
    v += (bay(x, y) - 0.5) * 0.18;
    const c = v > 0.85 ? R4 : v > 0.62 ? R3 : v > 0.4 ? R2 : v > 0.2 ? R1 : R0;
    P(b, x, y, c);
  }
  if (stage < 3) return;
  for (const ex of [-1, 1]) {
    const ex0 = cx + ex * 58, ey0 = cy;
    if (eye === 0) { L(b, ex0 - 26, ey0, ex0 + 26, ey0 + 1, R0, 2); continue; }
    const oh = eye === 1 ? 7 : 15;
    for (let x = -27; x <= 27; x++) { const hh = Math.round(oh * Math.pow(1 - (x / 28) ** 2, 0.8)); R(b, ex0 + x, ey0 - hh + (x * ex > 0 ? 1 : 0), 1, hh * 2 + 1, Math.abs(x) > 24 || hh < 2 ? G3 : G4); if (hh > 2 && Math.abs(x) < 24) R(b, ex0 + x, ey0 - hh + 2, 1, hh * 2 - 3, G5); }
    for (let y = ey0 - oh; y <= ey0 + oh; y++) for (let x = ex0 - 27; x <= ex0 + 27; x++) if (G(b, x, y) === G5 && hash(x, y, 4) < 0.08) P(b, x, y, R2); // veins
    const ix = ex0 + look * 2, iy = ey0 + (eye === 2 ? 1 : 0);
    const cl = (cx2, cy2, rx, ry, c) => { for (let y = -ry; y <= ry; y++) { const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2))); for (let x = -hw; x <= hw; x++) { const q = G(b, cx2 + x, cy2 + y); if (q === G5 || q === G4 || q === G3 || q === R0 || q === R5 || q === R4 || q === K0) P(b, cx2 + x, cy2 + y, c); } } };
    cl(ix, iy, 12, 12, R0); cl(ix, iy, 10, 10, R5); cl(ix, iy, 8, 8, R4); cl(ix, iy, 5, 5, K0);
    P(b, ix - 3, iy - 3, Y3); P(b, ix - 2, iy - 3, Y3);
    // lids
    for (let x = -28; x <= 28; x++) { const hh = Math.round(oh * Math.pow(1 - (x / 28) ** 2, 0.8)); P(b, ex0 + x, ey0 - hh - 1, R0); P(b, ex0 + x, ey0 - hh - 2, R0); P(b, ex0 + x, ey0 + hh + 1, R1); }
  }
}
const S6BW = once(() => {
  const b = new Buf(W, H, T);
  // converging walls (low angle looking up)
  poly(b, [[0, 0], [118, 0], [150, 270], [0, 270]], G0); poly(b, [[362, 0], [480, 0], [480, 270], [330, 270]], G0);
  tex(b, 0, 0, 160, 270, RAMP.cementD, 95, 0.07, 0.06); tex(b, 320, 0, 160, 270, RAMP.cementD, 96, 0.07, 0.06);
  for (let y = 0; y < H; y++) { const l = ri(118 + y * 32 / 270), r2 = ri(362 - y * 32 / 270); for (let x = l; x < r2; x++) b.d[y * W + x] = T; }
  for (let y = 0; y < H; y += 1) { const l = ri(118 + y * 32 / 270), r2 = ri(362 - y * 32 / 270); P(b, l - 1, y, K1); P(b, r2, y, K1); }
  // windows on the walls, receding (perspective rows)
  for (const [y0, h] of [[30, 22], [100, 18], [160, 14]]) { windowW(b, 30, y0, 30, h, { glass: K0 }); windowW(b, 420, y0, 30, h, { glass: K0 }); }
  hangul(b, '철거', 34, 206, R2, { bold: 1, spray: 0.8, seed: 97 });
  return b;
});
function shotFace(t, lt) {
  sky(fb, 0, 0, W, [[R0, 20], [R1, 40], [R2, 40], [R1, 200]]); strata(fb, 100, 10, 300, R1, 98, 10, R2);
  const st = t < 63.0 ? 0 : t < 63.3 ? 1 : t < 63.6 ? 2 : 3, eye = t < 64.2 ? 0 : t < 64.45 ? 1 : 2, look = t > 65.6 ? 0 : 0;
  drawFace(fb, st, eye, look);
  layer(fb, S6BW(), 0, 0);
  // pole + wires crossing the face
  pole(fb, 342, -10, 280, -10, {}); wire(fb, -10, 40, 344, 30, 50); wire(fb, -10, 70, 344, 36, 70); wire(fb, 340, 30, 490, 90, 20); wire(fb, 120, -2, 490, 120, 40, K1);
  const up = t < 62.2 ? 0 : t < 62.8 ? 0.5 : 1;
  girlBack(fb, 240, 278, { s: 2.2, up });
  light(fb, [], -1, [0, 0, W, H], 0.5);
  shift(fb, -1, [0, 0, 152, H]); shift(fb, -1, [328, 0, 152, H]);
  for (let y = 0; y < H; y++) { const l = ri(118 + y * 32 / 270), r2 = ri(362 - y * 32 / 270); for (let k = 1; k <= 3; k++) { if (bay(l - k, y) < 1 - k * 0.3) P(fb, l - k, y, k === 1 ? R2 : R1); if (bay(r2 + k, y) < 1 - k * 0.3) P(fb, r2 + k - 1, y, k === 1 ? R2 : R1); } }
}

/* ---------- S7: the green gate, the room, the TV ---------- */
const S7W = once(() => {
  const b = new Buf(W, H, K0);
  // back wall: old wallpaper over cement, peeling
  tex(b, 0, 0, W, 214, [T0, T1, T1, T2], 101, 0.06, 0.05);
  for (let y = 4; y < 214; y += 10) for (let x = (y / 10 & 1) * 6; x < W; x += 12) { P(b, x, y, T2); P(b, x + 1, y + 1, T2); }
  for (let i = 0; i < 9; i++) { const r = rng(102 + i), x = r() * W, y = r() * 160; tex(b, x, y, 10 + r() * 20, 6 + r() * 14, RAMP.cementD, i, 0.2, 0.1); }
  streaks(b, 0, 0, W, 40, K1, 103, 0.2);
  // posters & calendar (faded), a hanging bulb cord
  poster(b, 34, 40, 22, 30, 104, { c: G3, photo: true }); poster(b, 60, 52, 18, 24, 105, { red: true, c: G3 }); poster(b, 400, 46, 24, 32, 106, { c: G3 }); poster(b, 430, 60, 16, 20, 107, { c: G2 });
  R(b, 160, 70, 22, 28, G3); R(b, 160, 70, 22, 6, R2); for (let j = 79; j < 96; j += 3) for (let i = 162; i < 180; i += 4) P(b, i, j, G1); // calendar
  L(b, 216, 0, 216, 44, K1); R(b, 214, 44, 5, 3, G1); ell(b, 216, 50, 3, 4, G2); // dead bulb
  // doorway frame for the gate
  R(b, 244, 84, 92, 132, K1); R(b, 246, 86, 88, 130, K0);
  // floor: old yellow 장판, worn squares
  for (let y = 214; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x * 0.05, y * 0.1, 108), sq = ((x + (y - 214) * 2) % 24 < 1) || ((y - 214) % 12 === 0);
    b.d[y * W + x] = sq ? R0 : n > 0.66 ? Y1 : (n < 0.3 && bay(x, y) < 0.3) ? R0 : Y0;
  }
  R(b, 0, 212, W, 2, K1);
  // TV on a low cabinet
  R(b, 30, 196, 140, 40, Y0); R(b, 30, 196, 140, 2, Y1); R(b, 30, 234, 140, 2, K1); R(b, 98, 202, 2, 30, R0); P(b, 92, 216, Y1); P(b, 104, 216, Y1);
  R(b, 44, 126, 104, 72, G1); R(b, 44, 126, 104, 2, G2); R(b, 146, 126, 2, 72, G0); R(b, 44, 196, 104, 2, K1);
  R(b, 52, 132, 72, 58, K1); // bezel
  R(b, 130, 140, 10, 10, G0); ellO(b, 135, 145, 3, 3, G3); R(b, 130, 156, 10, 10, G0); ellO(b, 135, 161, 3, 3, G3); for (let j = 172; j < 190; j += 2) R(b, 130, j, 10, 1, G0);
  L(b, 70, 126, 58, 104, G1); L(b, 100, 126, 112, 102, G1); // rabbit-ear antenna
  return b;
});
const TV = { x: 55, y: 135, w: 66, h: 52 };
function tvScene(beat) { // what the TV shows: the room from behind her — and what stands there
  const b = new Buf(TV.w, TV.h, K1);
  R(b, 0, 0, TV.w, 36, T1); R(b, 0, 36, TV.w, 16, Y0);
  R(b, 34, 12, 18, 26, K0); R(b, 35, 13, 16, 24, M1); R(b, 42, 13, 1, 24, K1); // the gate
  const gx = beat ? 44 : 41;
  drawGhost(b, gx, 51, 0.5, beat ? { ...GPOSE.lean, lean: 26, head: [2, 27], tilt: 40, la: [10, 6, 0], ra: [-12, 6, 0] } : { ...GPOSE.behind, la: [16, 4, 0], ra: [-16, -4, 0] }, { eyes: 2, rim: K0 });
  girlBack(b, 34, 48, { s: 0.62 });
  // one long arm comes over her shoulder from behind
  L(b, beat ? 39 : 38, beat ? 25 : 22, 32, 27, K0); L(b, 32, 27, 30, 38, K0); L(b, 30, 38, 29, 42, K0); P(b, 28, 43, K0);
  // CCTV look: everything but the eyes to the grey/teal ramp, scanlines
  const MONO = { [R2]: G1, [R3]: G2, [R4]: G3, [R1]: G0, [R0]: K1, [S0]: G3, [S1]: G2, [WH]: G5, [Y0]: G0, [Y1]: G1, [M1]: G1, [M2]: G2, [T1]: G1, [T0]: G0, [T2]: G2 };
  for (let i = 0; i < b.d.length; i++) { const c = b.d[i]; if (MONO[c] !== undefined) b.d[i] = MONO[c]; if (((i / TV.w) | 0) % 2 && !EMISSIVE[b.d[i]]) b.d[i] = DN[b.d[i]]; }
  return b;
}
function shotRoom(t, lt) {
  const slam = 68.2, k = step(t - 67.3, 4); // door keys at 4fps
  let shake = 0; if (t >= slam && t < slam + 0.17) shake = step(t - slam, 12) % 2 ? -2 : 2;
  layer(fb, S7W(), 0, -shake);
  // the gate leaf: closed / swung open (stepped perspective)
  const open = t >= 67.3 && t < slam ? [2, 2, 1, 1][Math.min(3, Math.max(0, k))] : 0;
  if (open) { // outside: red sky and the dead-end alley
    sky(fb, 246, 86 - shake, 88, [[R2, 40], [R3, 30], [R1, 60]]); R(fb, 246, 196 - shake, 88, 20, G0);
    const lw = open === 2 ? 20 : 54;
    poly(fb, [[246, 86 - shake], [246 + lw, 96 - shake], [246 + lw, 206 - shake], [246, 216 - shake]], M2); R(fb, 246, 86 - shake, 2, 130, M1);
  } else {
    R(fb, 246, 86 - shake, 88, 130, M1); R(fb, 290, 86 - shake, 1, 130, K0);
    for (const px of [250, 294]) { R(fb, px, 92 - shake, 36, 50, M0); R(fb, px, 150 - shake, 36, 58, M0); }
    R(fb, 282, 150 - shake, 2, 5, G2);
    // red light leaks through the seams
    R(fb, 245, 85 - shake, 90, 1, R2); R(fb, 334, 85 - shake, 1, 131, R3); R(fb, 245, 215 - shake, 90, 1, R3);
  }
  // her: silhouette entering → back turned pushing the gate → standing, breathing
  if (open) {
    const sil = new Buf(W, H);
    if (k <= 0) girlBack(sil, 290, 216, { s: 1.6 }); else if (k === 1) girlBack(sil, 292, 236, { s: 2.0 });
    if (k >= 2) girlBack(fb, 290, 250, { s: 2.3, sway: 1.2 });
    else { for (let i = 0; i < sil.d.length; i++) if (sil.d[i] !== T) fb.d[i] = K0; }
  } else if (t >= slam) {
    const br = step(t - slam, 1.6) % 2, sway = [1, -0.6, 0.3, 0][Math.min(3, step(t - slam, 8))];
    girlBack(fb, 290, 250 - shake, { s: 2.3, breath: br, sway });
  }
  // dust shaken loose by the slam
  if (t >= slam && t < slam + 1.2) { const df = step(t - slam, 10); for (let i = 0; i < 16; i++) P(fb, 240 + (i * 37) % 110, df * 9 + (i * 13) % 20, G3); }
  // the TV: dead → power-on line → static → the image
  const on = t >= 70.0, img = t >= 70.9, beat = t >= 74.2;
  const lights = [];
  if (open) lights.push({ x: 290, y: 150, r: 200, k: 2.2, sq: 0.6 });
  if (!on) { R(fb, TV.x, TV.y, TV.w, TV.h, G0); L(fb, TV.x + 4, TV.y + 4, TV.x + 14, TV.y + 4, G1); }
  else if (t < 70.12) { R(fb, TV.x, TV.y, TV.w, TV.h, K0); R(fb, TV.x, TV.y + 25, TV.w, 1, WH); R(fb, TV.x + 20, TV.y + 24, 26, 3, G5); }
  else {
    const s = img ? tvScene(beat) : null, f = step(t, 15), roll = (step(t, 6) * 3) % (TV.h + 10) - 5;
    for (let y = 0; y < TV.h; y++) for (let x = 0; x < TV.w; x++) {
      const n = hash(x, y, f); let c;
      if (!img) c = n < 0.25 ? K0 : n < 0.5 ? G1 : n < 0.75 ? G3 : n < 0.93 ? G4 : WH;
      else { c = s.d[y * TV.w + x]; if (n < 0.012) c = G4; else if (n > 0.99) c = K0; if (Math.abs(y - roll) < 2 && !EMISSIVE[c]) c = UP[c]; }
      P(fb, TV.x + x, TV.y + y, c);
    }
    // CRT corners
    for (const [cx2, cy2] of [[0, 0], [TV.w - 1, 0], [0, TV.h - 1], [TV.w - 1, TV.h - 1]]) { P(fb, TV.x + cx2, TV.y + cy2, K1); P(fb, TV.x + cx2 + (cx2 ? -1 : 1), TV.y + cy2, K1); P(fb, TV.x + cx2, TV.y + cy2 + (cy2 ? -1 : 1), K1); }
    lights.push({ x: TV.x + TV.w / 2, y: TV.y + TV.h / 2, r: beat ? 260 : 230, k: beat ? 3.4 : img ? 3.0 : 2.6, sq: 0.8 });
  }
  light(fb, lights, -2.4, [0, 0, W, H], 0.5);
  if (open) { // red spill across the floor and her
    for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.abs(x - 290) - (y - 150) * 1.1; if (d < 46) { const k2 = y * W + x; if (!(x >= TV.x && x < TV.x + TV.w && y >= TV.y && y < TV.y + TV.h)) fb.d[k2] = RED[fb.d[k2]]; } }
  }
}
function shotBlack() { fb.d.fill(K0); }
