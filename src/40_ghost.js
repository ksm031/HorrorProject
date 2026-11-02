/* ==========================================================================
   THE CHARRED ONE — the figure. One silhouette at every scale:
   shoulders shrugged to the ears, a long neck hanging the head forward,
   a ribbed starved torso, arms to the ankles with long jointed fingers,
   stilt legs on tiptoe, soot-black, ash lifting off its edges.
   Faceless until it opens: two ember eyes, deep set.
   unit = 1px at scale 1 → standing height ≈ 110
   ========================================================================== */
// la/ra: [shoulder, elbow, wrist] (deg, + = toward facing), ll/rl: [hip, knee]
// head: [neck forward, neck drop] in units, tilt: head roll (deg), lean: torso from vertical
const GPOSE = {
  stand:  { front: 1, lean: 0, head: [1, 7],  tilt: 14,  la: [12, -8, 14],   ra: [9, -4, 10],    ll: [5, 3],   rl: [4, 3] },
  behind: { front: 1, lean: 0, head: [1, 8],  tilt: 20,  la: [20, -10, 12],  ra: [16, -6, 8],    ll: [5, 3],   rl: [5, 3] },
  tilt:   { front: 1, lean: 0, head: [3, 8],  tilt: 84,  la: [8, -2, 24],    ra: [14, -10, 6],   ll: [5, 3],   rl: [4, 3] },
  lean:   { lean: 18, head: [9, 8],   tilt: 26,  la: [24, 10, 12],   ra: [-6, 8, 6],     ll: [5, 4],   rl: [-5, 4] },
  reach:  { lean: 28, head: [10, 4],  tilt: -12, la: [74, 8, 18],    ra: [56, 22, 12],   ll: [14, 12], rl: [-14, 6] },
  raised: { front: 1, lean: 0, head: [1, 7], tilt: 40, la: [150, 40, 30], ra: [140, 50, 20], ll: [6, 3],  rl: [6, 3] },
  hunch:  { lean: 62, head: [11, 10], tilt: 96,  la: [12, 0, 30],    ra: [-4, 12, 20],   ll: [36, 104], rl: [-30, 98] },
  lunge:  { lean: 44, head: [12, 2],  tilt: -26, la: [102, -8, 24],  ra: [84, 14, 10],   ll: [42, 34], rl: [-40, 6] }
};
// tapered limb segment with rounded joint
function limbT(b, x0, y0, x1, y1, w0, w1, c) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  poly(b, [[x0 + nx * w0, y0 + ny * w0], [x1 + nx * w1, y1 + ny * w1], [x1 - nx * w1, y1 - ny * w1], [x0 - nx * w0, y0 - ny * w0]], c);
  if (w0 >= 1) ell(b, ri(x0), ri(y0), ri(w0), ri(w0), c);
  P(b, x1, y1, c);
}
function drawGhost(b, x, y, s, pose, o = {}) {
  const p = typeof pose === 'string' ? GPOSE[pose] : pose, f = o.flip ? -1 : 1, ef = o.eyes === undefined ? 2 : o.eyes;
  const c = o.c || K0, rib = o.rim === undefined ? K1 : o.rim;
  const dir = (a, l) => [Math.sin(a * D2R) * l * f * s, Math.cos(a * D2R) * l * s];
  const fr = p.front ? 1 : 0;
  const legs = [p.ll || [3, 4], p.rl || [-3, 4]].map(([a0, k], li) => { const a = fr ? a0 * (li ? -1 : 1) : a0;
    const lf = p.lift ? p.lift[li] : 0, t1 = 28 * (1 - 0.08 * lf), t2 = 28 * (1 - 0.5 * lf); // a lifted leg seen end-on: foreshortened, not bent sideways
    const kk = a >= 0 ? k : -k, kn = [Math.sin(a * D2R) * t1, Math.cos(a * D2R) * t1], sa = a - kk;
    const an = [kn[0] + Math.sin(sa * D2R) * t2, kn[1] + Math.cos(sa * D2R) * t2];
    return [kn, an, [an[0] + Math.sin((sa + 8) * D2R) * 7, an[1] + Math.cos((sa + 8) * D2R) * 7]]; // tiptoe foot continues the shin
  });
  const drop = Math.max(legs[0][2][1], legs[1][2][1]);
  const hx = x, hy = y - drop * s;
  const tk = p.tk || 1, L0 = p.lean * D2R, sx = hx + Math.sin(L0) * 34 * tk * s * f, sy = hy - Math.cos(L0) * 34 * tk * s;
  const ax = Math.cos(L0) * f, ay = Math.sin(L0);
  const th = v => Math.max(v >= 2 ? 1.5 : v >= 1.2 ? 1.15 : 0.85, v * s); // limbs never thinner than ~2px: it must read from far away
  const arm = (A, side) => {
    const m = fr ? side : 1, ua = A[0] * m, fa = A[1] * m, wa = A[2] * m;
    const _u = 0, shx = sx + ax * 4.6 * s * side, shy = sy + ay * 4.6 * s * side - 1.2 * s;
    const [ex, ey] = dir(ua, 27), [wx, wy] = dir(ua + fa, 27), E = [shx + ex, shy + ey], Wr = [E[0] + wx, E[1] + wy];
    limbT(b, shx, shy, E[0], E[1], th(1.7), th(1.1), c); limbT(b, E[0], E[1], Wr[0], Wr[1], th(1.2), th(0.8), c);
    const [px, py] = dir(ua + fa + wa, 4), P0 = [Wr[0] + px, Wr[1] + py], fs = fr ? side : 1; limbT(b, Wr[0], Wr[1], P0[0], P0[1], th(1.0), th(1.1), c);
    if (s < 0.75) { const [hx2, hy2] = dir(ua + fa + wa + 10, 9); limbT(b, P0[0], P0[1], P0[0] + hx2, P0[1] + hy2, th(0.9), 0.4, c); return Wr; } // far: one long tapered hand
    for (let k = 0; k < 4; k++) {
      const a1 = ua + fa + wa + (k - 1.5) * 9, [k1x, k1y] = dir(a1, 5.5), Kp = [P0[0] + k1x, P0[1] + k1y], [k2x, k2y] = dir(a1 + 22 + k * 4, 5);
      limbT(b, P0[0], P0[1], Kp[0], Kp[1], th(0.45), th(0.35), c); limbT(b, Kp[0], Kp[1], Kp[0] + k2x, Kp[1] + k2y, th(0.35), th(0.15), c);
    }
    return Wr;
  };
  const leg = ([kn, an, toe], side) => {
    const ox = side * 1.8 * s * f;
    const K = [hx + ox + kn[0] * s * f, hy + kn[1] * s], A = [hx + ox + an[0] * s * f, hy + an[1] * s], T2 = [hx + ox + toe[0] * s * f, hy + toe[1] * s];
    limbT(b, hx + ox, hy, K[0], K[1], th(2.2), th(1.3), c); limbT(b, K[0], K[1], A[0], A[1], th(1.4), th(0.9), c); limbT(b, A[0], A[1], T2[0], T2[1], th(0.9), th(0.35), c);
  };
  arm(p.ra || [-3, 4, 8], -1); leg(legs[1], -1);
  // torso: shrugged trapezius → ribcage → wasp waist → narrow hips
  const prof = [[0, 0.7], [0.08, 1.05], [0.3, 0.95], [0.5, 0.7], [0.64, 0.3], [0.8, 0.32], [1, 0.6]], Lp = [], Rp = [];
  for (const [t, wk] of prof) { const px = lerp(sx, hx, t), py = lerp(sy, hy, t), w = 5.6 * s * wk; Lp.push([px + ax * w, py + ay * w]); Rp.push([px - ax * w, py - ay * w]); }
  poly(b, Lp.concat(Rp.reverse()), c);
  // the shrug: two humps of shoulder rise above where the neck leaves the body
  for (const side of [-1, 1]) { // rounded, hunched-up shoulders (not points)
    const bx = sx + ax * 4.4 * s * side, by = sy + ay * 4.4 * s * side;
    poly(b, [[sx + ax * 6.4 * s * side, by + 2 * s], [bx + ax * 1.8 * s * side, by - 3 * s], [sx + ax * 1.6 * s * side, sy - 1 * s], [sx, sy + 3 * s]], c);
    ell(b, ri(bx - ax * 0.6 * s * side - Math.sin(L0) * 1.5 * s * f), ri(by - 2.0 * s), Math.max(1, ri(2.8 * s)), Math.max(1, ri(2.2 * s)), c);
  }
  if (s >= 1.1) for (let k = 1; k <= 4; k++) { const t = 0.12 + k * 0.1, px = lerp(sx, hx, t), py = lerp(sy, hy, t), w = 4.2 * s * (1 - k * 0.08); L(b, px - ax * w, py - ay * w + s, px + ax * w * 0.2, py + ay * w * 0.2, rib); }
  leg(legs[0], 1);
  const hd = p.head || [6, 2], nx = sx + hd[0] * s * f + Math.sin(L0) * 6 * s * f, ny = sy - 9 * s + hd[1] * s;
  limbT(b, sx, sy - 1 * s, nx, ny + 3 * s, th(1.3), th(1.1), c);
  const tr = (p.tilt || 0) * D2R * f, pts = [];
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, u = Math.cos(a) * 3.0 * s, v = Math.sin(a) * 6.0 * s * (Math.sin(a) < 0 ? 1.15 : 0.78); pts.push([nx + u * Math.cos(tr) - v * Math.sin(tr), ny - 3 * s + u * Math.sin(tr) + v * Math.cos(tr)]); }
  if (s >= 1.5) { const g = pts.map(([px, py]) => [nx + (px - nx) * 1.18, ny - 3 * s + (py - ny + 3 * s) * 1.12]); poly(b, g, o.gap !== undefined ? o.gap : T); }
  poly(b, pts, c);
  const nearW = arm(p.la || [5, -6, 14], 1);
  let eyesOut = [];
  if (ef > 0) {
    const eo = (fr ? [[-1.15, -4.2], [1.15, -4.2]] : [[0.6, -4.6], [2.6, -4.2]]).map(([u, v]) => [nx + (u * f * Math.cos(tr) - v * Math.sin(tr)) * s, ny - 3 * s + (u * f * Math.sin(tr) + v * Math.cos(tr)) * s]);
    eyesOut = eo;
    for (const [ex, ey] of eo) {
      if (s < 1.4) { P(b, ex, ey, ef > 1 ? Y3 : R5); if (ef > 1 && s >= 0.8) P(b, ex + f, ey, R5); }
      else { const r = Math.max(1, ri(s * 0.55)); ell(b, ri(ex), ri(ey), r + 1, r, R4); ell(b, ri(ex), ri(ey), r, Math.max(0, r - 1), ef > 1 ? R5 : R4); P(b, ex, ey, ef > 1 ? Y3 : R5); if (r > 1) P(b, ex + 1, ey, Y2); }
    }
  }
  if (s >= 0.9 && o.ash !== false) { // ash lifting off it: each flake keeps its own path and rises steadily
    const tt = o.time || 0;
    for (let k = 0; k < 6 + s * 4; k++) {
      const life = 2.2 + hash(k, 1, 7) * 1.6, ph = ((tt / life) + hash(k, 2, 7)) % 1, sway = Math.sin((tt + k) * 1.7) * 2 * s;
      const fx = nx + (hash(k, 3, 7) - 0.5) * 12 * s + sway, fy = ny - 4 * s - ph * 26 * s;
      if (ph < 0.85) P(b, ri(fx), ri(fy), ph < 0.4 ? K1 : T0);
    }
  }
  return { head: [nx, ny - 3 * s], sh: [sx, sy], hand: nearW, eyes: eyesOut };
}
function smoke(b, x0, y0, w, h, seed, t) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (x < 0 || y < 0 || x >= b.w || y >= b.h) continue;
    const k = y * b.w + x, c = b.d[k]; if (c === K0 || c === K1) continue;
    const n = (x > 0 && b.d[k - 1] === K0) + (x < b.w - 1 && b.d[k + 1] === K0) + (y > 0 && b.d[k - b.w] === K0) + (y < b.h - 1 && b.d[k + b.w] === K0);
    if (n && hash(x, y + t, seed) < 0.18 * n) b.d[k] = K1;
  }
}
// cold rim on the upper-left edges, two stepped layers
function rimLight(b, c) {
  const add = [], add2 = [];
  for (let y = 1; y < b.h; y++) for (let x = 1; x < b.w; x++) {
    const k = y * b.w + x; if (b.d[k] === T || EMISSIVE[b.d[k]]) continue;
    if (b.d[k - 1] === T || b.d[k - b.w] === T) add.push(k);
    else if (x > 1 && y > 1 && (b.d[k - 2] === T || b.d[k - 2 * b.w] === T) && bay(x, y) < 0.5) add2.push(k);
  }
  for (const k of add) b.d[k] = c; for (const k of add2) if (b.d[k] === K0) b.d[k] = DN[c] === K0 ? K1 : DN[c];
}

/* ---- gaits: one continuous cycle each, keyed at 6 fps ----
   walk: upright stalk seen front/back — hips rock, head stays put and tilted, arms swing late like pendulums
   crawl: low on all fours seen from behind — limbs splayed, alternate pairs reaching */
const GAIT_N = 6;
function ghostGait(kind, f, reach = 0) {
  const ph = ((f % GAIT_N) + GAIT_N) % GAIT_N, a = ph / GAIT_N * Math.PI * 2;
  const sw = Math.sin(a), swLag = Math.sin(a - 0.9), lift = k => Math.max(0, Math.sin(a + k)) ;
  if (kind === 'walk') return {
    front: 1, lean: sw * 3, head: [1 - sw * 0.6, 8], tilt: 22 - sw * 4, sx: sw * 1.4,
    la: [9 + swLag * 6 + reach * 30, -4 - reach * 20, 12], ra: [9 - swLag * 6, -4, 12],
    ll: [5, 3], rl: [5, 3], lift: [lift(0), lift(Math.PI)]
  };
  if (kind === 'crawl') return { // on all fours, from behind: torso foreshortened toward the ground, hands planted ahead
    front: 1, tk: 0.5, lean: sw * 3, head: [1, 13], tilt: 36 + sw * 6, sx: sw * 1.2,
    la: [26 + lift(0) * 10 + reach * 30, 22 - lift(0) * 24, 28], ra: [26 + lift(Math.PI) * 10, 22 - lift(Math.PI) * 24, 28],
    ll: [40, 44], rl: [40, 44], lift: [lift(Math.PI) * 0.7, lift(0) * 0.7]
  };
  return GPOSE.stand;
}
