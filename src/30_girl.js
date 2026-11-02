/* ==========================================================================
   GIRL — one design, three generators that share proportions & colours:
   side view (keyed skeleton, 46px), back view (scalable shapes), tiny (ASCII).
   ========================================================================== */
const HAIR = K1, HAIRH = T1, SHIRT = WH, SHIRTS = G5, SHIRTD = G4, SKIRT = T1, SKIRTD = T0, SKIRTH = T2,
  SKIN = S0, SKIND = S1, SOCK = K1, SHOE = K0, PACK = R3, PACKD = R2, PACKH = R4, PACKDD = R1;

const D2R = Math.PI / 180;
function limb(b, x, y, a1, l1, a2, l2) { // returns joints
  const kx = x + Math.sin(a1 * D2R) * l1, ky = y + Math.cos(a1 * D2R) * l1;
  const ex = kx + Math.sin(a2 * D2R) * l2, ey = ky + Math.cos(a2 * D2R) * l2;
  return [kx, ky, ex, ey];
}

/* ---- side-view head sprites (facing right). h hair, H sheen, s skin, d skin shade, e eye ---- */
const HEADK = { h: HAIR, H: HAIRH, s: SKIN, d: SKIND, e: K0, k: K0 };
const HEAD_SIDE = spr([
  '..hhhhh...',
  '.hhHHhhhh.',
  'hhHHhhhhhh',
  'hhhhhhhhhh',
  'hhhhhhhhhs',
  'hhhhhhhess',
  'hhhhhhdsss',
  'hhhhhhdss.',
  'hhhhhhdsd.',
  '.hhhhh.d..',
  '..hhh..d..'], HEADK);
const HEAD_SIDE_RUN = spr([
  '...hhhhh..',
  '.hhhHHhhh.',
  'hhhHHhhhhh',
  'hhhhhhhhhh',
  'hhhhhhhhhs',
  '.hhhhhhess',
  'hhhhhhdsss',
  '.hhhhhdss.',
  'hhhhhhdsd.',
  '..hhhh.d..',
  '...h...d..'], HEADK);
const HEAD_SIDE_UP = spr([
  '.hhhhhh...',
  'hhHHhhhhh.',
  'hHHhhhhhhh',
  'hhhhhhhhhs',
  'hhhhhhhess',
  'hhhhhhhsss',
  'hhhhhhdssd',
  'hhhhhhdsd.',
  'hhhhhh.dd.',
  '.hhhhh.d..',
  '..hh...d..'], HEADK);

/* ---- keyed cycles (hand-keyed angles, deg; + = forward) ---- */
const WALK = {
  th: [24, 16, 4, -10, -20, -14, 6, 20], kn: [4, 14, 8, 6, 18, 44, 52, 22],
  ft: [-14, 0, 0, 0, 26, 34, 8, -8], bob: [0, 1, 0, 0, 0, 1, 0, 0],
  au: [-16, -11, -3, 7, 14, 10, -3, -12], af: [6, 6, 8, 14, 20, 16, 10, 6],
  lean: 1, hair: [0, 0, 1, 1, 0, 0, 1, 1], pack: [0, 0, 1, 0, 0, 0, 1, 0]
};
const RUN = {
  th: [34, 18, -6, -28, -26, 4, 38, 46], kn: [10, 34, 18, 18, 86, 110, 82, 32],
  ft: [-10, 0, 12, 40, 52, 30, 0, -12], bob: [0, 2, 1, -1, 0, 2, 1, -1],
  au: [-36, -22, 4, 28, 34, 10, -24, -40], af: [70, 76, 92, 104, 108, 96, 80, 70],
  lean: 4, hair: [2, 3, 3, 2, 2, 3, 3, 2], pack: [0, 1, 2, 1, 0, 1, 2, 1]
};
const CLIMB = { // running up stairs: higher knee drive, steeper lean
  th: [40, 26, 4, -18, -14, 14, 50, 54], kn: [36, 44, 20, 14, 80, 110, 96, 60],
  ft: [0, 0, 6, 30, 46, 30, 6, 0], bob: [1, 2, 1, -1, 1, 2, 1, -1],
  au: [-32, -18, 6, 26, 30, 10, -20, -36], af: [72, 78, 92, 104, 108, 96, 82, 72],
  lean: 5, hair: [2, 3, 3, 2, 2, 3, 3, 2], pack: [0, 1, 2, 1, 0, 1, 2, 1]
};

function girlSidePose(cyc, f) {
  const n = 8, a = f % n, b2 = (f + 4) % n;
  return {
    bob: cyc.bob[a], lean: cyc.lean, hair: cyc.hair[a], pack: cyc.pack[a],
    legN: [cyc.th[a], cyc.kn[a], cyc.ft[a]], legF: [cyc.th[b2], cyc.kn[b2], cyc.ft[b2]],
    armN: [cyc.au[a], cyc.af[a]], armF: [cyc.au[b2], cyc.af[b2]], run: cyc !== WALK, head: cyc === WALK ? HEAD_SIDE : HEAD_SIDE_RUN
  };
}
const STAND = { bob: 0, lean: 0, hair: 0, pack: 0, legN: [3, 2, 0], legF: [-3, 2, 0], armN: [-2, 4], armF: [2, 4], run: false, head: HEAD_SIDE };
const STOP_UP = { bob: 0, lean: -1, hair: 0, pack: 0, legN: [4, 3, 0], legF: [-4, 2, 0], armN: [2, 6], armF: [-2, 4], run: false, head: HEAD_SIDE_UP };

function drawGirlSide(p) {
  const b = new Buf(44, 62), ox = 20, oy = 59; // feet baseline
  const hipY = oy - 23 + p.bob, hipX = ox, shX = ox + p.lean, shY = oy - 39 + p.bob;
  const leg = (L, dark) => {
    const [th, kn, ft] = L, hx = hipX + (dark ? -1 : 1);
    const [kx, ky, ax, ay] = limb(b, hx, hipY, th, 11, th - kn, 11);
    const sk = dark ? SKIND : SKIN;
    L_(kx, ky, hx, hipY, sk, 3);
    L_(kx, ky, ax, ay, sk, 2);
    // sock: lower 5px of shin
    const sx = lerp(ax, kx, 0.5), sy = lerp(ay, ky, 0.5);
    L_(ax, ay, sx, sy, dark ? K0 : SOCK, 2);
    // shoe
    const fa = (90 - ft) * D2R, fx = ax + Math.sin(fa) * 4, fy = ay + Math.cos(fa) * 4;
    L_(ax - 1, ay + 1, fx, fy + 1, SHOE, 2);
    if (!dark) P(b, ri(fx), ri(fy), G0);
    return [kx, ky];
  };
  function L_(x0, y0, x1, y1, c, th) { L(b, x0, y0, x1, y1, c, th); }
  const arm = (A, dark) => {
    const [au, af] = A, sx = shX + (dark ? 1 : 0), sy = shY + 2;
    const [ex, ey, hx, hy] = limb(b, sx, sy, au, 8, au + af, 7);
    L_(sx, sy, ex, ey, dark ? SKIND : SKIN, 2);
    L_(ex, ey, hx, hy, dark ? SKIND : SKIN, 2);
    // short sleeve
    const mx = lerp(sx, ex, 0.55), my = lerp(sy, ey, 0.55);
    L_(sx, sy - 1, mx, my, dark ? SHIRTD : SHIRT, 3);
    if (!dark) P(b, ri(mx), ri(my) + 1, SHIRTS);
  };
  // far side
  arm(p.armF, true);
  const kF = leg(p.legF, true);
  const kN = leg(p.legN, false);
  // torso
  poly(b, [[shX - 3, shY], [shX + 3, shY], [shX + 4, shY + 4], [hipX + 3, hipY - 3], [hipX - 3, hipY - 3]], SHIRT);
  R(b, hipX - 3, hipY - 5, 2, 2, SHIRTS);
  L(b, shX - 3, shY + 1, hipX - 3, hipY - 4, SHIRTS);
  P(b, shX + 2, shY, SHIRTS); P(b, shX + 3, shY + 1, R2); P(b, shX + 3, shY + 2, R3); // collar & ribbon
  // skirt (hem follows thighs; trails when running)
  const fr = Math.max(kN[0], kF[0]) + 2, bk = Math.min(kN[0], kF[0]) - 2;
  const hemY = hipY + 9, trail = p.run ? 2 : 0;
  poly(b, [[hipX - 3, hipY - 4], [hipX + 4, hipY - 4], [Math.max(fr, hipX + 4), hemY], [Math.min(bk, hipX - 4) - trail, hemY - trail]], SKIRT);
  for (let i = -3; i <= 4; i += 2) L(b, hipX + i, hipY - 2, hipX + i + (i > 0 ? 1 : -1) * 2, hemY - 1, SKIRTD);
  L(b, hipX - 3, hipY - 4, hipX + 4, hipY - 4, SKIRTD);
  P(b, hipX + 2, hipY - 3, SKIRTH); P(b, hipX + 3, hipY - 1, SKIRTH);
  // backpack (lags the body by a frame → overlapping motion)
  const py = shY + 1 + p.pack, px = shX - 9 - (p.run ? 1 : 0);
  poly(b, [[px + 1, py], [px + 6, py], [px + 7, py + 1], [px + 7, py + 13], [px, py + 13], [px, py + 1]], PACK);
  R(b, px, py + 9, 7, 4, PACKD); R(b, px, py + 8, 2, 5, PACKD);
  L(b, px + 1, py, px + 5, py, PACKH); P(b, px, py + 1, PACKH);
  L(b, px + 1, py + 8, px + 6, py + 8, PACKDD); P(b, px + 4, py + 10, G2);
  L(b, shX - 2, shY, shX + 1, shY + 1, PACKD); L(b, shX + 1, shY + 1, shX, shY + 7, PACKD);
  // near arm over everything but head
  arm(p.armN, false);
  // head (hair trails back with lag)
  const hd = p.head;
  blit(b, hd, shX - 5, shY - 11, false);
  if (p.hair > 1) { P(b, shX - 6, shY - 4, HAIR); P(b, shX - 7, shY - 5, HAIR); if (p.hair > 2) P(b, shX - 7, shY - 3, HAIR); }
  return outline(b, K0);
}

/* frame caches */
const girlCache = new Map();
function girlFrame(name, f) {
  const key = name + f; let s = girlCache.get(key); if (s) return s;
  const cyc = { walk: WALK, run: RUN, climb: CLIMB }[name];
  s = cyc ? drawGirlSide(girlSidePose(cyc, f)) : drawGirlSide(name === 'up' ? STOP_UP : STAND);
  girlCache.set(key, s); return s;
}
// draw side sprite with feet at (x,y)
function girlSide(b, name, f, x, y, flip = false, map = null) {
  const s = girlFrame(name, f);
  blit(b, s, ri(x) - (flip ? s.w - 21 : 21), ri(y) - 60, flip, map);
}

/* ---- back view: scalable, same proportions (unit = 1px at 46px height) ----
   o: {s:scale, yaw:0..1 head turn to her right, up:0..1 look up, breath:0/1, sway:-1..1 hair/pack lag} */
function girlBack(b, cx, fy, o) {
  const s = o.s, yaw = o.yaw || 0, up = o.up || 0, br = o.breath || 0, sw = o.sway || 0;
  const X = u => cx + u * s, Y = u => fy + u * s;
  const pg = (pts, c) => poly(b, pts.map(q => [X(q[0]), Y(q[1])]), c);
  const rr = (x, y, w, h, c) => R(b, ri(X(x)), ri(Y(y)), Math.max(1, ri(w * s)), Math.max(1, ri(h * s)), c);
  const sp = o.spread || 0; // legs apart (stopped mid-step)
  // shadow on ground
  for (let i = -8; i <= 8; i++) { const hgt = Math.max(1, ri(s * (0.9 - Math.abs(i) / 12))); if (Math.abs(i) < 7 || (i & 1)) R(b, ri(X(i)), ri(Y(0.5)) - hgt + 1, ri(s) + 1, hgt, K0); }
  // legs (lift: walking away — the lifted foot rises, its sole shows)
  const lift = o.lift || [0, 0];
  for (const side of [-1, 1]) {
    const l = lift[side < 0 ? 0 : 1], lx = side * (2.3 + sp * 0.5), sk = side > 0 ? SKIND : SKIN, fb2 = -l * 2.8;
    pg([[lx - 1.4, -13], [lx + 1.4, -13], [lx + 1.15, -6], [lx + 0.9, fb2 - 1.2], [lx - 0.9, fb2 - 1.2], [lx - 1.15, -6]], sk);
    if (side < 0) pg([[lx + 0.4, -12], [lx + 1.4, -12], [lx + 1.15, -6], [lx + 0.7, -6]], SKIND);
    pg([[lx - 1.15, -6.5], [lx + 1.15, -6.5], [lx + 1.0, fb2 - 1], [lx - 1.0, fb2 - 1]], SOCK);
    rr(lx - 1.0, -6.6, 2.0, 0.5, K0);
    pg([[lx - 1.2, fb2 - 1.4], [lx + 1.2, fb2 - 1.4], [lx + 1.4, fb2 + 0.2], [lx - 1.4, fb2 + 0.2]], SHOE);
    if (l > 0.2) rr(lx - 1.1, fb2 - 0.4, 2.2, 0.6 + l * 0.5, G1); else rr(lx - 0.8, -1.3, 1.2, 0.4, G0);
  }
  // arms hang beside the skirt
  for (const side of [-1, 1]) {
    const ax = side * 5.0 + sw * 0.2, ay = (o.arm || 0) * side * 0.7;
    pg([[ax - 0.9, -32], [ax + 0.9, -32], [ax + 1.0 * side + 0.2, -21.5 + ay], [ax + side * 0.2 - 1.0, -21.5 + ay]], side > 0 ? SKIND : SKIN);
    pg([[ax - 1.0, -22.4 + ay], [ax + 1.0, -22.4 + ay], [ax + 0.8, -20.3 + ay], [ax - 0.8, -20.3 + ay]], side > 0 ? SKIND : SKIN);
  }
  // skirt with pleats
  pg([[-4.6, -25.6], [4.6, -25.6], [6.6, -12.4], [-6.6, -12.4]], SKIRT);
  for (let i = -6; i <= 6; i++) {
    const xt = i * 0.72, xb = i * 1.02;
    L(b, X(xt), Y(-24.8), X(xb), Y(-12.8), i % 2 ? SKIRTD : SKIRTH);
  }
  pg([[2, -25.6], [4.6, -25.6], [6.6, -12.4], [3.4, -12.4]], SKIRTD);
  for (let i = 0; i < 13; i++) if (i % 2) R(b, ri(X(-6.6 + i * 1.02)), ri(Y(-12.9)), Math.max(1, ri(s)), Math.max(1, ri(s * 0.6)), SKIRTD);
  rr(-4.6, -25.8, 9.2, 0.9, SKIRTD);
  // shirt torso
  const bt = br * 0.25;
  pg([[-5.2, -35 - bt], [5.2, -35 - bt], [5.6, -31], [4.7, -25.2], [-4.7, -25.2], [-5.6, -31]], SHIRT);
  pg([[2.6, -34], [5.2, -35 - bt], [5.6, -31], [4.7, -25.2], [2.2, -25.2]], SHIRTS);
  rr(-4.7, -26.4, 9.4, 1.0, SHIRTS);
  // sleeves
  for (const side of [-1, 1]) {
    const x0 = side * 4.6;
    pg([[x0, -35 - bt], [x0 + side * 1.9, -33.6], [x0 + side * 2.3, -30.4], [x0 + side * 0.1, -30.6]].map(q => [q[0], q[1]]), side > 0 ? SHIRTS : SHIRT);
    L(b, X(x0 + side * 2.3), Y(-30.4), X(x0 + side * 0.2), Y(-30.6), SHIRTD);
  }
  // neck + collar
  rr(-1.1, -37.3 - bt, 2.2, 2.6, SKIND);
  pg([[-2.4, -35.6 - bt], [0, -34.6 - bt], [2.4, -35.6 - bt], [2.2, -34.6 - bt], [0, -33.8 - bt], [-2.2, -34.6 - bt]], SHIRT);
  // backpack (lags: sway)
  const pk = sw * 0.35 - yaw * 0.8, pb = br * 0.15;
  const bx = -4.4 + pk, by = -34.2 - pb;
  pg([[bx + 0.8, by], [bx + 8, by], [bx + 8.8, by + 1.2], [bx + 8.8, by + 12.6], [bx + 8.2, by + 13.4], [bx + 0.6, by + 13.4], [bx, by + 12.6], [bx, by + 1.2]], PACK);
  pg([[bx + 5.8, by + 0.6], [bx + 8.8, by + 1.2], [bx + 8.8, by + 12.6], [bx + 8.2, by + 13.4], [bx + 6.4, by + 13.4]], PACKD);
  L(b, X(bx + 1), Y(by + 0.2), X(bx + 6.4), Y(by + 0.2), PACKH);
  L(b, X(bx + 0.3), Y(by + 1.2), X(bx + 0.3), Y(by + 6), PACKH);
  // outer pocket
  pg([[bx + 1.3, by + 6.8], [bx + 7.6, by + 6.8], [bx + 7.6, by + 12.2], [bx + 1.3, by + 12.2]], PACKD);
  pg([[bx + 1.3, by + 6.8], [bx + 5.6, by + 6.8], [bx + 5.6, by + 11.6], [bx + 1.3, by + 11.6]], PACK);
  L(b, X(bx + 1.3), Y(by + 6.8), X(bx + 7.6), Y(by + 6.8), PACKDD);
  L(b, X(bx + 1.6), Y(by + 7.4), X(bx + 7.2), Y(by + 7.4), G2);
  rr(bx + 7.0, by + 7.2, 0.6, 1.4, G3);
  // top handle and shoulder straps
  pg([[bx + 3.3, by - 0.9], [bx + 5.5, by - 0.9], [bx + 5.5, by + 0.2], [bx + 3.3, by + 0.2]], PACKD);
  for (const side of [-1, 1]) {
    const sx = side * 3.8 + pk * 0.4;
    pg([[sx - 0.6, -35.1 - bt], [sx + 0.6, -35.1 - bt], [sx + 0.7, by + 0.6], [sx - 0.7, by + 0.6]], PACKD);
  }
  rr(bx + 0.2, by + 13.2, 8.4, 0.5, PACKDD);
  // head (narrower than shoulders, rounded bob)
  const hx = yaw * 0.5, hy = -up * 0.9, hz = hy * 0.4;
  const hb = [[-3.9, -37.2], [-4.5, -38.6], [-4.6, -41.2], [-4.3, -43.6], [-3.4, -45.5], [-1.8, -46.5], [0, -46.8],
    [1.8, -46.5], [3.4, -45.5], [4.3, -43.6], [4.6, -41.2], [4.5, -38.6], [3.9, -37.2], [0, -36.9]];
  if (up > 0) pg([[-2.6, -37.6 + hz], [2.6, -37.6 + hz], [2.2, -36.2], [-2.2, -36.2]], SKIND); // nape shows as head tilts back
  pg(hb.map(q => [q[0] + hx, q[1] + (q[1] < -41 ? hy : hz)]), HAIR);
  // turning: cheek, lashes and nose tip emerge just past the hair edge
  if (yaw > 0.15) {
    const f = yaw, xr = 4.3 + hx;
    pg([[xr - 0.7, -41.8 + hz], [xr + 0.3 + f * 0.8, -41.3 + hz], [xr + 0.6 + f * 1.3, -40.2 + hz], [xr + 0.3 + f * 0.9, -39.2 + hz],
      [xr + 0.1 + f * 0.7, -38.2 + hz], [xr - 0.8, -37.4 + hz], [xr - 1.0, -40 + hz]], SKIN);
    L(b, X(xr - 0.8), Y(-39.4 + hz), X(xr - 0.6), Y(-37.8 + hz), SKIND);
    if (f > 0.55) {
      pg([[xr + 0.5 + f * 1.2, -40.6 + hz], [xr + 0.9 + f * 1.6, -39.8 + hz], [xr + 0.4 + f * 1.1, -39.4 + hz]], SKIN);
      L(b, X(xr - 0.2), Y(-41.0 + hz), X(xr + 0.2 + f * 0.4), Y(-41.0 + hz), K0);
    }
    // a lock of hair falls over the cheek again
    pg([[xr - 1.1, -42.4 + hz], [xr - 0.1, -42.0 + hz], [xr - 0.6, -38.8 + hz], [xr - 1.3, -38.6 + hz]], HAIR);
  }
  // sheen arc and a few strands
  const sy = -44.6 + hy;
  pg([[-3.0 + hx, sy + 0.6], [-1.6 + hx, sy - 0.6], [0.6 + hx, sy - 0.9], [2.4 + hx, sy - 0.2], [2.8 + hx, sy + 0.5], [0.8 + hx, sy + 0.1], [-1.4 + hx, sy + 0.4]], HAIRH);
  for (const i of [-2.4, -0.8, 1.0, 2.6]) L(b, X(i + hx), Y(-42.6 + hy), X(i * 1.08 + hx), Y(-38.0 + hz), K0);
  for (const i of [-3.2, 3.0]) L(b, X(i + hx), Y(-41.6 + hy), X(i * 1.05 + hx), Y(-38.4 + hz), HAIRH);
  // ragged hem
  for (let i = -3; i <= 3; i += 2) rr(i * 1.1 + hx - 0.3, -37.4 + hz + sw * 0.08 * i, 0.7, 0.6, HAIR);
}

/* ---- tiny walker (wide shot, 15px) — hand-drawn ---- */
const TK = { h: HAIR, w: SHIRT, v: SHIRTS, r: PACK, q: PACKD, k: SKIRT, s: SKIN, x: SOCK, b: SHOE };
const TINY = [
  ['..hhh.', '.hhhhh', '.hhhhs', 'rrhhs.', 'rrwww.', 'rrwvws', 'qqwws.', '.kkkk.', 'kkkkkk', '.s..s.', '.s..s.', '.x..x.', '.x..x.', 'bb.bb.'],
  ['..hhh.', '.hhhhh', '.hhhhs', 'rrhhs.', 'rrwww.', 'rrwwws', 'qqwws.', '.kkkk.', '.kkkkk', '..ss..', '..ss..', '..xx..', '..xx..', '.bbb..'],
  ['..hhh.', '.hhhhh', '.hhhhs', 'rrhhs.', 'rrwww.', 'rrwvws', 'qqwws.', '.kkkk.', 'kkkkkk', '.s..s.', 's...s.', 'x...x.', 'x....x', 'b...bb'],
  ['..hhh.', '.hhhhh', '.hhhhs', 'rrhhs.', 'rrwww.', 'rrwwws', 'qqwws.', '.kkkk.', '.kkkkk', '..ss..', '..ss..', '..xx..', '..x.x.', '.bb.b.']
].map(r => outline(spr(r, TK), K0));

// form shading for flat-filled sprites: each horizontal run of one colour gets a darker
// edge on both sides (light from the camera side) and a darker last row (core shadow)
function volumize(b, strength = 1) {
  const d = b.d, w = b.w, out = d.slice();
  for (let y = 0; y < b.h; y++) {
    let x = 0;
    while (x < w) {
      const c = d[y * w + x]; if (c === T || EMISSIVE[c]) { x++; continue; }
      let e = x; while (e + 1 < w && d[y * w + e + 1] === c) e++;
      const len = e - x + 1;
      if (len >= 3) { out[y * w + e] = DN[c]; if (len >= 5) out[y * w + x] = DN[c]; if (strength > 1 && len >= 8) { out[y * w + e - 1] = DN[c]; } }
      x = e + 1;
    }
  }
  for (let y = 0; y + 1 < b.h; y++) for (let x = 0; x < w; x++) { const c = d[y * w + x], u = y > 0 ? d[(y - 1) * w + x] : T; if (c !== T && !EMISSIVE[c] && u === T && c !== HAIR) out[y * w + x] = UP[out[y * w + x]]; }
  d.set(out);
}

/* ---- front view (only ever small / far: walking home toward the camera, face in shadow) ---- */
function girlFront(b, cx, fy, o) {
  const s = o.s, X = u => cx + u * s, Y = u => fy + u * s;
  const pg = (pts, c) => poly(b, pts.map(q => [X(q[0]), Y(q[1])]), c);
  const lift = o.lift || [0, 0];
  for (let i = -6; i <= 6; i++) R(b, ri(X(i)), ri(Y(0.3)), Math.max(1, ri(s)), Math.max(1, ri(s * 0.6)), K0);
  for (const side of [-1, 1]) {
    const l = lift[side < 0 ? 0 : 1], lx = side * 2.3, fb2 = -l * 1.6;
    pg([[lx - 1.3, -13], [lx + 1.3, -13], [lx + 1.0, fb2 - 1.2], [lx - 1.0, fb2 - 1.2]], side > 0 ? SKIND : SKIN);
    pg([[lx - 1.1, -6.5], [lx + 1.1, -6.5], [lx + 1.0, fb2 - 1], [lx - 1.0, fb2 - 1]], SOCK);
    pg([[lx - 1.3, fb2 - 1.3], [lx + 1.3, fb2 - 1.3], [lx + 1.4, fb2 + 0.2], [lx - 1.4, fb2 + 0.2]], SHOE);
  }
  pg([[-4.6, -25.6], [4.6, -25.6], [6.4, -12.4], [-6.4, -12.4]], SKIRT);
  for (let i = -5; i <= 5; i += 2) L(b, X(i * 0.7), Y(-24.8), X(i * 1.0), Y(-12.8), SKIRTD);
  for (const side of [-1, 1]) { const ax = side * 5.0, ay = (o.arm || 0) * side * 0.6; pg([[ax - 0.9, -32], [ax + 0.9, -32], [ax + side * 0.6 + 0.9, -21 + ay], [ax + side * 0.6 - 0.9, -21 + ay]], side > 0 ? SKIND : SKIN); }
  pg([[-5.2, -35], [5.2, -35], [5.6, -31], [4.7, -25.2], [-4.7, -25.2], [-5.6, -31]], SHIRT);
  pg([[2.4, -34], [5.2, -35], [5.6, -31], [4.7, -25.2], [2.6, -25.2]], SHIRTS);
  for (const side of [-1, 1]) pg([[side * 4.6, -35], [side * 6.4, -33.4], [side * 6.6, -30.4], [side * 4.8, -30.6]], side > 0 ? SHIRTS : SHIRT);
  for (const side of [-1, 1]) pg([[side * 3.2, -35], [side * 4.2, -35], [side * 3.9, -27], [side * 2.9, -27]], PACKD); // straps
  pg([[-0.9, -34.2], [0.9, -34.2], [0.6, -31.6], [-0.6, -31.6]], R3); // ribbon
  pg([[-2.2, -35.4], [0, -34], [2.2, -35.4], [2, -34.4], [0, -33.4], [-2, -34.4]], SHIRT);
  // head: face (in shadow under the bangs), hair framing it
  const hb = [[-3.9, -37.4], [-4.6, -39], [-4.6, -41.4], [-4.2, -43.8], [-3.2, -45.6], [-1.6, -46.6], [1.6, -46.6], [3.2, -45.6], [4.2, -43.8], [4.6, -41.4], [4.6, -39], [3.9, -37.4]];
  pg(hb, HAIR);
  pg([[-2.6, -42.2], [2.6, -42.2], [2.6, -39], [1.4, -37.2], [-1.4, -37.2], [-2.6, -39]], SKIND);
  pg([[0.6, -41], [2.6, -41], [2.6, -39], [1.4, -37.2], [0.4, -37.4]], Y0); // the side of the face away from the light
  pg([[-2.6, -42.6], [2.6, -42.6], [2.6, -40.6], [1.2, -40.9], [0, -40.5], [-1.4, -40.9], [-2.6, -40.6]], HAIR); // heavy bangs: eyes in shadow
  pg([[-1.6, -38.6], [1.6, -38.6], [1.0, -37.4], [-1.0, -37.4]], Y0); // chin shadow
  pg([[-3.0, -44.6], [-0.8, -45.6], [1.2, -45.4], [-0.6, -44.6]], HAIRH);
}
