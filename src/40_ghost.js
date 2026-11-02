/* ==========================================================================
   GHOST — one silhouette: tiny head, sloped narrow shoulders, stilt legs,
   arms that reach past the knees. Built from keyed joints at any scale.
   Body colours are K0/K1 only; the eyes are the only emissive part.
   ========================================================================== */
// unit = 1px at scale 1 → standing height ≈ 104
const GPOSE = {
  stand:   { lean: 0,   head: [0, 0],     tilt: 0,   la: [4, 4, 6],      ra: [-4, -6, -4],   ll: [3, 0],    rl: [-3, 0],    crouch: 0 },
  tilt:    { lean: -2,  head: [5, 2],     tilt: 70,  la: [6, 2, 12],     ra: [-2, -4, 0],    ll: [4, 0],    rl: [-2, 0],    crouch: 0 },
  reach:   { lean: 22,  head: [6, 6],     tilt: -15, la: [70, 10, 10],   ra: [52, 20, 6],    ll: [12, 6],   rl: [-14, 14],  crouch: 4 },
  raised:  { lean: -4,  head: [0, 0],     tilt: 25,  la: [160, 20, -12], ra: [-170, -30, 20], ll: [6, 0],   rl: [-6, 0],    crouch: 0 },
  hunch:   { lean: 48,  head: [10, 14],   tilt: 100, la: [8, 0, 0],      ra: [-6, 10, 0],    ll: [30, 70],  rl: [-30, 70],  crouch: 18 },
  lunge:   { lean: 34,  head: [10, 8],    tilt: -30, la: [96, 6, 10],    ra: [84, -6, 14],   ll: [40, 30],  rl: [-36, 4],   crouch: 10 },
  behind:  { lean: 4,   head: [2, 4],     tilt: 12,  la: [20, -8, 0],    ra: [-20, 8, 0],  ll: [5, 0],    rl: [-5, 0],    crouch: 0 },
  lean:    { lean: 18,  head: [5, 10],    tilt: 30,  la: [26, 8, 4],     ra: [-10, -6, 2],   ll: [5, 0],    rl: [-5, 0],    crouch: 2 }
};
// draw ghost with feet centre at (x,y); s scale; pose name or object; ef = eye brightness 0..2; flip faces left
function drawGhost(b, x, y, s, pose, o = {}) {
  const p = typeof pose === 'string' ? GPOSE[pose] : pose, f = o.flip ? -1 : 1, ef = o.eyes === undefined ? 2 : o.eyes;
  const th = Math.max(2, ri(2.6 * s)), thA = Math.max(2, ri(1.9 * s)), dark = o.c || K0, rim = o.rim === undefined ? K1 : o.rim;
  const X = u => x + u * s * f, Y = u => y + u * s;
  const A = (ang, len) => [Math.sin(ang * D2R) * len * f, Math.cos(ang * D2R) * len];
  const legs = [p.ll, p.rl].map(([a, k]) => {
    const kk = a >= 0 ? k : -k, kn = [Math.sin(a * D2R) * 27, Math.cos(a * D2R) * 27];
    return [kn, [kn[0] + Math.sin((a - kk) * D2R) * 27, kn[1] + Math.cos((a - kk) * D2R) * 27]];
  });
  const drop = Math.max(legs[0][1][1], legs[1][1][1]);
  const hipU = [0, -drop];
  const lean = p.lean, shU = [hipU[0] + Math.sin(lean * D2R) * 36, hipU[1] - Math.cos(lean * D2R) * 36];
  const hx = X(hipU[0]), hy = Y(hipU[1]), sx = X(shU[0]), sy = Y(shU[1]);
  for (const [kn, ft] of legs) {
    const kx = X(kn[0]), ky = Y(hipU[1] + kn[1]), fx = X(ft[0]), fy = Y(hipU[1] + ft[1]);
    L(b, hx, hy, kx, ky, dark, th); L(b, kx, ky, fx, fy, dark, th);
    L(b, fx, fy, fx + 3 * s * f, fy, dark, Math.max(1, th - 1));
  }
  // torso: narrow, ribbed slightly, sloped shoulders
  const nx = -Math.cos(lean * D2R) * f, ny = -Math.sin(lean * D2R);
  const w1 = 4.4 * s, w2 = 2.6 * s;
  poly(b, [[sx + nx * w1, sy + ny * w1], [sx - nx * w1, sy - ny * w1], [hx - nx * w2, hy - ny * w2], [hx + nx * w2, hy + ny * w2]], dark);
  if (s >= 1.2) for (let i = 1; i < 5; i++) { const t = i / 5.5, px = lerp(sx, hx, t), py = lerp(sy, hy, t); L(b, px - nx * w2 * 0.8, py - ny * w2 * 0.8, px + nx * w2 * 0.2, py + ny * w2 * 0.2, rim); }
  // arms: upper 26, fore 26, hand+fingers 9 → reach past the knees
  for (const [side, arm] of [[1, p.la], [-1, p.ra]]) {
    const [ua, fa, ha] = arm;
    const ax = sx + nx * w1 * side * 0.9, ay = sy + ny * w1 * side * 0.9 + 1.5 * s;
    const [ex, ey] = A(ua, 26 * s), [wx, wy] = A(ua + fa, 26 * s);
    const e = [ax + ex, ay + ey], wr = [e[0] + wx, e[1] + wy];
    L(b, ax, ay, e[0], e[1], dark, thA); L(b, e[0], e[1], wr[0], wr[1], dark, thA);
    for (let k = -1; k <= 1; k++) { const [qx, qy] = A(ua + fa + ha + k * 9, 9 * s); L(b, wr[0], wr[1], wr[0] + qx, wr[1] + qy, dark, Math.max(1, thA - 1)); }
  }
  // neck + head (small, long skull, wrong tilt)
  const hdx = sx + (p.head[0] * s) * f, hdy = sy - 6 * s + p.head[1] * s;
  L(b, sx, sy, hdx, hdy + 2 * s, dark, Math.max(1, ri(s * 1.2)));
  const tr = p.tilt * D2R * f, hr = [3.4 * s, 5.4 * s];
  const pts = []; for (let i = 0; i < 14; i++) { const t = i / 14 * Math.PI * 2, ex = Math.cos(t) * hr[0], ey = Math.sin(t) * hr[1] * (Math.sin(t) < 0 ? 1.1 : 0.9); pts.push([hdx + ex * Math.cos(tr) - ey * Math.sin(tr), hdy - 2 * s + ex * Math.sin(tr) + ey * Math.cos(tr)]); }
  poly(b, pts, dark);
  // eyes: two hot points with a stepped ring (no blur)
  if (ef > 0) {
    const eo = [[-1.3, -2.6], [1.3, -2.6]].map(([u, v]) => [hdx + (u * Math.cos(tr) - v * Math.sin(tr)) * s, hdy - 2 * s + (u * Math.sin(tr) + v * Math.cos(tr)) * s]);
    const er = ri(s * 0.45);
    for (const [ex, ey] of eo) {
      if (er < 1) { P(b, ex, ey, ef > 1 ? Y3 : R5); if (ef > 1) P(b, ex + (ex > hdx ? 1 : -1), ey, R5); }
      else { if (ef > 1) ell(b, ri(ex), ri(ey), er + 1, er, R5); ell(b, ri(ex), ri(ey), er, Math.max(0, er - 1), ef > 1 ? Y3 : R5); }
    }
  }
  return { head: [hdx, hdy], sh: [sx, sy] };
}
// ragged smoky edge — dithered K0 noise around an existing silhouette region (for the giant)
function smoke(b, x0, y0, w, h, seed, t) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const k = y * b.w + x; if (x < 0 || y < 0 || x >= b.w || y >= b.h) continue;
    const c = b.d[k]; if (c === K0 || c === K1) continue;
    const n = (x > 0 && b.d[k - 1] === K0) + (x < b.w - 1 && b.d[k + 1] === K0) + (y > 0 && b.d[k - b.w] === K0) + (y < b.h - 1 && b.d[k + b.w] === K0);
    if (n && hash(x, y + t, seed) < 0.18 * n) b.d[k] = K1;
  }
}

// cold rim on the upper-left edges only: separates the silhouette from dark walls without lighting it
function rimLight(b, c) {
  const add = [];
  for (let y = 1; y < b.h; y++) for (let x = 1; x < b.w; x++) {
    const k = y * b.w + x; if (b.d[k] === T || EMISSIVE[b.d[k]]) continue;
    if (b.d[k - 1] === T || b.d[k - b.w] === T) add.push(k);
  }
  for (const k of add) b.d[k] = c;
}
