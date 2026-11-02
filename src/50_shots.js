/* ==========================================================================
   SHOTS — each shot renders a pure function of time onto fb.
   ========================================================================== */
const fb = new Buf(W, H, K0);
const once = f => { let v; return () => v || (v = f()); };
const step = (t, fps) => Math.floor(t * fps); // hand-keyed timing helper
const ANIM = 10; // character animation rate (fps)

/* ---------- S2: the alley, the flickering lamp ---------- */
const S2_GY = x => 236 - Math.floor(Math.max(0, x) * 0.05); // gently rising ground (uphill to the right)
const S2W = once(() => {
  const b = new Buf(W, H, K0), r = rng(22);
  sky(b, 0, 0, W, [[K1, 14], [T0, 16], [T1, 20], [T2, 22], [T3, 18], [T2, 40]]);
  strata(b, 0, 26, W, T1, 5, 7, T2);
  // distant apartments over the ridge (left) — the living city, far away
  apartments(b, 0, 210, 104, 7, { body: T1, edge: T2, win: T0, lit: 0.06, num: true });
  // up-hill houses behind the alley wall
  const back = [[-4, 96, 64], [56, 84, 58], [112, 78, 70], [178, 70, 64], [238, 60, 78], [312, 56, 70], [378, 46, 60], [434, 40, 60]];
  for (let i = 0; i < back.length; i++) {
    const [x, y, w] = back[i];
    wall(b, x, y, w, 150 - y + 40, RAMP.tealD, 300 + i, { moss: false, cracks: 1, streak: 10 });
    shift(b, -1, [x, y, w, 200]);
    if (i % 2) slate(b, x - 3, y - 9, w + 6, 9, 40 + i, { c1: G1, c2: G0, c3: G2 });
    else { R(b, x - 1, y - 2, w + 2, 2, G1); waterTank(b, x + 6 + (i * 13) % (w - 24), y - 2, 0.9); if (i === 4) basin(b, x + w - 16, y - 2); if (i === 2) styro(b, x + w - 22, y - 2, 10, 5, 77); }
    for (let k = 0; k < 2; k++) {
      const wx = x + 8 + k * (w >> 1), wy = y + 12;
      windowW(b, wx, wy, 9, 8, { lit: (i === 3 && k === 1) || (i === 6 && k === 0), glass: K1, refl: T1, frame: K1, barc: K1 });
    }
  }
  // red tree crowning the hill
  redTree(b, 404, 50, 34, 22, 9, { trunk: 22 });
  return b;
});
const S2M = once(() => { // the alley wall row (foreground plane of the shot)
  const b = new Buf(W, H), gy = S2_GY;
  // A: cement wall + green gate (x 0..96)
  wall(b, 0, 130, 96, 110, RAMP.cement, 11, { cracks: 3, peel: 0, base: gy });
  R(b, 0, 128, 96, 3, G3); R(b, 0, 131, 96, 1, G0);
  for (let i = 0; i < 96; i += 4) { P(b, i + 1, 127, T5); P(b, i + 2, 126, G4); } // broken glass on wall top
  gate(b, 30, gy(70) - 58, 40, 58, {});
  digits(b, '37', 74, gy(70) - 54, G4); R(b, 73, gy(70) - 56, 9, 9, T); R(b, 73, gy(70) - 56, 9, 9, B0); digits(b, '37', 74, gy(70) - 53, G5);
  // B: teal-painted house with spray (x 96..250)
  wall(b, 96, 108, 154, 132, RAMP.teal, 12, { peel: 9, cracks: 3, streak: 20, base: gy });
  R(b, 94, 104, 158, 4, G1); R(b, 94, 104, 158, 1, G3); R(b, 94, 108, 158, 1, K1);
  windowW(b, 196, 124, 18, 14, { glass: K1 });
  meter(b, 104, 150); pipe(b, 246, 108, gy(250));
  hangul(b, '철거 예정', 128, 158, R3, { bold: 1, spray: 1, seed: 4, gap: 1 });
  poster(b, 222, 150, 12, 16, 3, { red: true }); poster(b, 205, 158, 13, 10, 4, {}); poster(b, 236, 168, 8, 11, 5, { c: G3 });
  // C: low brick wall with styrofoam gardens, laundry above (x 250..330)
  brickWall(b, 250, 170, 80, 70, 21);
  R(b, 249, 168, 82, 2, G2);
  styro(b, 254, 168, 14, 7, 31); styro(b, 270, 168, 12, 6, 32); basin(b, 286, 168, 10); styro(b, 299, 168, 16, 8, 33, false);
  redFlowers(b, 252, gy(330) - 1, 76, 41, 0.35);
  // second-floor house behind the low wall
  wall(b, 250, 96, 80, 72, RAMP.cementD, 13, { moss: false, cracks: 2 });
  slate(b, 246, 88, 88, 8, 14, {});
  windowW(b, 262, 112, 12, 12, { glass: K1 }); windowW(b, 300, 112, 12, 12, { lit: true, curtain: true });
  // D: vacant house — 공가 + X (x 330..480)
  wall(b, 330, 116, 150, 124, RAMP.cement, 15, { peel: 4, cracks: 4, streak: 18, base: gy });
  R(b, 328, 112, 152, 4, G1); R(b, 328, 112, 152, 1, G3);
  door(b, 352, gy(370) - 44, 20, 44, G2);
  hangul(b, '공가', 380, 136, R3, { bold: 1, spray: 0.8, seed: 9 }); xMark(b, 448, 146, 10);
  windowW(b, 418, 126, 14, 12, { glass: K0 });
  R(b, 418, 126, 14, 12, K0); L(b, 418, 126, 431, 137, G1); // broken pane, boarded
  R(b, 416, 130, 18, 2, Y0);
  acUnit(b, 392, 168); poster(b, 460, 174, 12, 14, 6, { c: G3, photo: true });
  // floor (rising): walls run down behind it, the floor is clipped per column
  const fl = new Buf(W, H); tex(fl, 0, 200, W, 70, RAMP.groundD, 51, 0.09, 0.08);
  for (let x = 0; x < W; x += 29 + (hash(x, 1, 5) * 20 | 0)) L(fl, x, 214, x - 14, 270, K1);
  for (let x = 0; x < W; x++) { const y = gy(x); for (let j = y; j < H; j++) b.d[j * W + x] = fl.d[j * W + x]; P(b, x, y, K1); }
  // gutter line and a cover
  for (let x = 0; x < W; x++) P(b, x, gy(x) + 3, G0);
  R(b, 186, gy(186) + 2, 14, 3, K1); for (let i = 0; i < 14; i += 2) P(b, 186 + i, gy(186) + 3, G2);
  return b;
});

const S2_LAMP = { x: 112, y: 116 };
// lamp state: 1 on, 0 off, 'f' stuttering
const S2_BLACK = [[15.0, 15.6], [18.2, 18.8], [20.6, 21.2], [22.5, 23.1]];
const S2_GHOST = [[15.6, 16, 'stand', 1], [18.8, 58, 'stand', 2], [21.2, 100, 'tilt', 2], [23.1, 168, 'lean', 2]];
function s2LampOn(t) {
  for (const [a, z] of S2_BLACK) {
    if (t >= a - 0.5 && t < a) return [1, 0, 1][Math.min(2, step(t - (a - 0.5), 6))] === 1; // one stutter (≤3 flashes/s) before the dark
    if (t >= a && t < z) return false;
  }
  return true;
}
function s2Ghost(t) { let g = null; for (const e of S2_GHOST) if (t >= e[0]) g = e; return g; }
function shotAlley(t, lt) {
  layer(fb, S2W(), 0, 0);
  const m = S2M();
  // poles + wires behind the wall plane top
  layer(fb, m, 0, 0);
  const on = s2LampOn(t);
  const arm = pole(fb, 96, 70, S2_GY(96) + 1, -3, { trans: true, tag: true });
  pole(fb, 360, 52, 116, 2, {});
  wire(fb, -10, 40, arm[0][0], arm[0][1], 6); wire(fb, arm[1][0], arm[1][1], 362, 57, 16); wire(fb, arm[2][0], arm[2][1], 368, 57, 22);
  wire(fb, arm[3][0], arm[3][1], 490, 30, 10); wire(fb, arm[4][0], arm[4][1], 490, 68, 30); wire(fb, -10, 58, arm[4][0], arm[4][1], 12);
  wire(fb, 200, -2, 365, 66, 8, K1);
  // laundry line between the 2nd floor and the vacant house
  laundry(fb, 256, 100, 340, 120, 8, [{ t: 0.12, k: 'shirt', c: G4, p: 0 }, { t: 0.36, k: 'towel', c: R2, p: 2 }, { t: 0.55, k: 'sock', c: G3, p: 1 }, { t: 0.66, k: 'shirt', c: T4, p: 3 }], step(t, 4), 3);
  const lp = lamp(fb, 96 - 3 + 1, 112, on, 1);
  // ghost (never seen moving: only ever drawn at a held mark)
  const g = s2Ghost(t), black = !on && S2_BLACK.some(([a, z]) => t >= a && t < z);
  if (g && !black) drawGhost(fb, g[1], S2_GY(g[1]) + 1, 0.95, g[2], { eyes: g[3] });
  // girl walks on frame ticks (no sliding)
  const f = step(lt, ANIM * 0.8), gx = -30 + f * 3.4;
  girlSide(fb, 'walk', f, gx, S2_GY(gx) + 1);
  // lighting: dusk ambient, lamp cone, warm window spill
  if (on) light(fb, [{ x: lp[0], y: lp[1], r: 120, k: 3.2, sq: 0.7, cone: { spread: 0.75, w: 6 } }, { x: 306, y: 118, r: 28, k: 1.2, sq: 1.4 }], -1, [0, 60, W, 210]);
  else light(fb, [{ x: 306, y: 118, r: 26, k: 1.0, sq: 1.4 }], -2.6, [0, 60, W, 210]);
  if (black) {
    shift(fb, -3);
    const nx = S2_GHOST.find(e => e[0] > t - 0.01 && e[0] - t < 0.2); // eyes arrive a beat before the light
    if (nx) drawGhost(fb, nx[1], S2_GY(nx[1]) + 1, 0.95, nx[2], { eyes: 2, c: K0, rim: K0 });
  }
}

/* ---------- shot table ---------- */
const SHOTS = [];
function addShot(a, z, fn, name) { SHOTS.push({ a, z, fn, name }); }
const DURATION = 78;
function renderAt(t) {
  fb.d.fill(K0);
  const s = SHOTS.find(s => t >= s.a && t < s.z);
  if (s) s.fn(t, t - s.a, s);
}
