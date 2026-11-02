/* ==========================================================================
   GIRL (shaded) — every part is a small solid (capsule / pillow / pleated cone)
   with a normal; each pixel is lit and stepped into its material ramp, then the
   silhouette gets a selective outline. Same proportions as before (unit = 1px at
   47px tall, feet at v=0). Fine detail fades out by itself at small sizes.
   ========================================================================== */
const GM = {
  hair: [K0, K1, T0, T1, T2], skin: [Y0, S1, S1, S0], shirt: [G2, G3, G4, G5, WH], skirt: [K0, K1, T0, T1, T2],
  pack: [R0, R1, R2, R3, R4], sock: [K0, K1, T0], shoe: [K0, K0, K1, G0, G1], metal: [G1, G3, G4, G5], strap: [R0, R1, R2, R3], ribbon: [R1, R2, R3, R4], charm: [G3, G5, WH, WH]
};
const GL = (() => { const l = Math.hypot(-0.35, -0.6, 0.72); return [-0.35 / l, -0.6 / l, 0.72 / l]; })(); // light: up-left, from the viewer's side
// capsule along a→b with radius r0→r1: returns [t, nx, ny, nz] or null
function gCap(u, v, ax, ay, bx, by, r0, r1) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = clamp(((u - ax) * dx + (v - ay) * dy) / l2, 0, 1);
  const px = ax + dx * t, py = ay + dy * t, r = lerp(r0, r1, t), ex = u - px, ey = v - py, d = Math.hypot(ex, ey);
  if (d > r) return null; const k = d / r; return [t, ex / (d || 1) * k, ey / (d || 1) * k, Math.sqrt(1 - k * k)];
}
// rounded box, slightly domed like a stuffed bag: [ex(edge dist), nx, ny, nz]
function gPillow(u, v, x0, y0, x1, y1, rad, dome) {
  const cx = clamp(u, x0 + rad, x1 - rad), cy = clamp(v, y0 + rad, y1 - rad), dx = u - cx, dy = v - cy;
  if (u < x0 || u > x1 || v < y0 || v > y1 || Math.hypot(dx, dy) > rad) return null;
  const ex = Math.min(u - x0, x1 - u, v - y0, y1 - v), k = clamp(1 - ex / dome, 0, 1);
  const gx = u - (x0 + x1) / 2, gy = v - (y0 + y1) / 2, gl = Math.hypot(gx / (x1 - x0), gy / (y1 - y0)) || 1;
  const nx = gx / (x1 - x0) / gl * k, ny = gy / (y1 - y0) / gl * k; return [ex, nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))];
}
const gShade = (m, base, n, x, y, span = 2.2) => { const lam = n[0] * GL[0] + n[1] * GL[1] + n[2] * GL[2], r = GM[m]; return r[clamp(Math.floor(base + lam * span + (bay(x, y) - 0.5) * 0.26), 0, r.length - 1)]; };

function girlRender(b, cx, fy, o, front) {
  const s = o.s, yaw = front ? 0 : (o.yaw || 0), up = o.up || 0, br = (o.breath || 0) * 0.25, sw = o.sway || 0, sp = o.spread || 0, lift = o.lift || [0, 0], arm = o.arm || 0;
  const det = s >= 1.6, fine = s >= 2.4; // level of detail
  const hx = yaw * 0.5, hy = -up * 0.9, pk = sw * 0.35 - yaw * 0.8;
  const x0 = Math.floor(cx - 9 * s), x1 = Math.ceil(cx + 9 * s), y0 = Math.floor(fy - 48.5 * s), y1 = Math.ceil(fy + 1.5 * s);
  const tmp = new Buf(x1 - x0 + 1, y1 - y0 + 1); tmp.hq = true;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const u = (x + 0.5 - cx) / s, v = (y + 0.5 - fy) / s; let c = T, n;
    // ---------- head ----------
    const hu = u - hx, hv = v - (v < -41 ? hy : hy * 0.4), inHead = v < -36.4;
    const hem = -37.2 + Math.sin(hu * 2.4) * 0.18 + (fine ? (hash(Math.floor(hu * 2.5), 0, 9) - 0.5) * 0.35 : 0);
    const inHair = inHead && ((hu / 4.55) ** 2 + ((hv + 42.4) / 4.9) ** 2 < 1 && hv < hem) || ((hu / 4.6) ** 2 + ((hv + 41.6) / 5.2) ** 2 < 1 && hv < hem && Math.abs(hu) > 3.6);
    if (inHair) {
      if (front && hv > -42.6 && Math.abs(hu) < 2.6 && hv > -41.0) { /* face below the bangs */ }
      else {
        const nx = hu / 4.6, ny = (hv + 42) / 5.2, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        let base = 1.7; const shy = -44.8 + hu * hu * 0.06; if (Math.abs(hv - shy) < 0.7 && Math.abs(hu) < 3.6) base += 1.6; // sheen arc
        if (fine && vnoise(hu * 2.8, hv * 0.3, 21) < 0.32) base -= 0.9;                                      // strands
        c = gShade('hair', base, [nx, ny, nz], x, y, 1.6);
      }
    }
    if (inHead && c === T && !front && yaw > 0.15) { // turning: a rounded cheek, lashes and the tip of the nose come past the hair
      const f = yaw, fu = u - hx, fv = v - hy * 0.4, ccx = 3.7 + f * 0.7, ccy = -39.4;
      const e = ((fu - ccx) / (0.9 + f * 0.55)) ** 2 + ((fv - ccy) / 2.1) ** 2;
      if (e < 1) { const nx = (fu - ccx) / (0.9 + f * 0.55), ny = (fv - ccy) / 2.1; c = gShade('skin', 2.4, [nx, ny, Math.sqrt(Math.max(0, 1 - e))], x, y, 1.2); }
      if (f > 0.55 && Math.hypot((fu - ccx - 0.95 - f * 0.4) / 0.5, (fv + 40.0) / 0.45) < 1) c = gShade('skin', 2.6, [0.8, 0, 0.6], x, y);
      if (f > 0.55 && Math.abs(fv + 41.0) < 0.3 && fu > ccx && fu < ccx + 0.9 + f * 0.4) c = K0;
    }
    if (inHead && c === T && front) { // face: framed by the bob, the upper half in the shadow of her bangs
      const fu = u, fv = v, wv = 2.55 - Math.max(0, fv + 39.0) * 0.55;
      if (Math.abs(fu) < wv && fv > -42.6 && fv < -37.0) {
        const nx = fu / 2.7, ny = (fv + 39.6) / 3.0, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        let base = 2.5 - (fv < -40.7 ? 1.3 : 0) - (fv > -37.9 ? 0.6 : 0);
        c = gShade('skin', base, [nx, ny, nz], x, y, 1.2);
        if (Math.abs(fv + 40.3) < 0.28 && Math.abs(Math.abs(fu) - 1.05) < 0.38) c = K1;          // eyes, half lost in shade
        if (det && Math.abs(fv + 38.2) < 0.18 && Math.abs(fu) < 0.45) c = S1;                    // a closed mouth
        if (det && Math.abs(fu - 0.25) < 0.2 && fv > -39.6 && fv < -38.9) c = DN[c];             // the side of the nose
      }
      if (c === T && hv < -40.4 && hv > -43.2 && Math.abs(hu) < 2.9) c = gShade('hair', 1.4 + (fine && (Math.floor(hu * 2.4) % 2) ? -0.5 : 0), [hu / 4, 0.3, 0.9], x, y); // bangs, cut uneven
    }
    // neck / nape
    if (c === T && Math.abs(u) < 1.15 && v > -37.6 && v < -35 - br) c = gShade('skin', front ? 1.4 : 1.6, [u / 1.2, 0, 0.8], x, y);
    // ---------- backpack (behind her: only from the back) ----------
    const bx0 = -4.4 + pk, by0 = -34.2 - br * 0.6;
    if (c === T && !front && v > by0 - 1.2 && v < by0 + 14 && Math.abs(u) < 7) {
      // keychain: a little round charm on a short cord from the pocket zip, swinging late
      const kx = bx0 + 6.8 + sw * 0.9, ky = by0 + 11.2 + Math.abs(sw) * 0.2;
      if (det && Math.abs(u - lerp(bx0 + 6.6, kx, (v - (by0 + 7.6)) / (ky - by0 - 7.6))) < 0.18 && v > by0 + 7.6 && v < ky - 0.6) c = G4;
      if (det && Math.hypot(u - kx, v - ky) < 0.75) c = gShade('charm', 1.6, [(u - kx) / 0.8, (v - ky) / 0.8, 0.5], x, y);
      if (c === T) { const hd = gCap(u, v, bx0 + 3.4, by0 - 0.3, bx0 + 5.4, by0 - 0.3, 0.45, 0.45); if (hd && v < by0 + 0.1) c = gShade('strap', 1.8, [hd[1], hd[2], hd[3]], x, y); } // top handle
      if (c === T) {
        const pp = gPillow(u, v, bx0 + 1.2, by0 + 6.6, bx0 + 7.6, by0 + 12.6, 1.0, 1.6); // front pocket
        if (pp) {
          c = gShade('pack', 2.4, [pp[1], pp[2], pp[3]], x, y);
          if (Math.abs(v - (by0 + 7.5 + Math.abs(u - bx0 - 4.4) * 0.12)) < 0.22) c = det ? G2 : R1; // zip
          if (det && Math.abs(u - (bx0 + 6.6)) < 0.3 && Math.abs(v - (by0 + 7.6)) < 0.4) c = G5;      // pull
          if (fine && pp[0] < 0.55 && pp[0] > 0.3 && ((u + v) * 3 | 0) % 2) c = R1;                    // stitching
        } else {
          const pb = gPillow(u, v, bx0, by0, bx0 + 8.8, by0 + 13.4, 1.4, 2.6);
          if (pb) { c = gShade('pack', 2.3, [pb[1], pb[2], pb[3]], x, y); if (fine && pb[0] < 0.6 && pb[0] > 0.35 && ((u + v) * 3 | 0) % 2) c = R1; if (v > by0 + 12.6) c = R0; }
        }
      }
    }
    // ---------- arms (in front of the shirt, beside the pack) ----------
    if (c === T && v > -33 && v < -19 && Math.abs(u) > 3.6) for (const sd of [-1, 1]) {
      const ax = sd * 5.0 + sw * 0.2, ay = arm * sd * 0.7 * (front ? -1 : 1);
      const a1 = gCap(u, v, ax, -31.2, ax + sd * 0.25, -26.4 + ay * 0.5, 0.95, 0.8), a2 = gCap(u, v, ax + sd * 0.25, -26.4 + ay * 0.5, ax + sd * 0.2, -21.6 + ay, 0.8, 0.62);
      const hnd = gCap(u, v, ax + sd * 0.2, -21.6 + ay, ax + sd * 0.15, -20.2 + ay, 0.7, 0.55);
      const hit = a1 || a2 || hnd; if (hit) { c = gShade('skin', sd > 0 ? 1.7 : 2.1, [hit[1], hit[2], hit[3]], x, y, 1.6); if (det && a2 && a2[0] < 0.08) c = DN[c]; break; }
    }
    // ---------- shirt: torso + sleeves, folds ----------
    if (c === T && v > -36.5 && v < -25) {
      const sl = [-1, 1].map(sd => gCap(u, v, sd * 4.6, -34.4 - br, sd * 5.5, -31.0, 1.5, 1.25)).find(Boolean);
      const tw = lerp(5.3, 4.7, clamp((v + 35) / 9.8, 0, 1));
      if (sl || (Math.abs(u) < tw && v > -35.2 - br && v < -25.2)) {
        const nx = sl ? sl[1] : u / tw * 0.8, ny = sl ? sl[2] : -0.25, nz = sl ? sl[3] : Math.sqrt(1 - Math.min(0.9, (u / tw) ** 2 * 0.64));
        let base = 3.0;
        if (det && !sl && Math.abs(v - (-25.9 - Math.abs(Math.sin(u * 1.4)) * 0.4)) < 0.3) base -= 1.3;           // tucked-in bunching at the waist
        if (det && !sl && Math.abs(Math.abs(u) - 3.9 + (v + 31) * 0.18) < 0.22 && v > -32.5 && v < -28) base -= 1.0; // fold from the armpit
        if (sl && sl[0] > 0.82) base -= 0.9; // sleeve hem
        c = gShade('shirt', base, [nx, ny, nz], x, y, 1.6);
        if (front) { // collar + red ribbon + bag straps over the shoulders
          if (Math.abs(u) < 2.4 && v < -34 - br + Math.abs(u) * 0.35 && v > -35.6 - br) c = gShade('shirt', 3.6, [0, -0.4, 0.9], x, y);
          if (det && Math.abs(u) < 0.12 && v > -31.6 && v < -25.6) c = G3; // placket
          if ((Math.abs(u) < 1.4 && Math.abs(v + 33.9) < 0.35 + Math.abs(u) * 0.35) || (Math.abs(u) < 0.5 && v > -33.9 && v < -31.6 && Math.abs(u) < 0.25 + (v + 33.9) * 0.15)) c = gShade('ribbon', 2.2, [u / 1.4, 0, 0.8], x, y);
          if (Math.abs(Math.abs(u) - 3.6) < 0.55 && v > -35.2 && v < -27) c = gShade('strap', 1.6, [(Math.abs(u) - 3.6) * sign(u), 0, 0.8], x, y);
        } else if (Math.abs(Math.abs(u - pk * 0.4) - 3.8) < 0.6 && v > -35.2 - br && v < by0 + 0.8) c = gShade('strap', 1.3, [0, -0.5, 0.8], x, y); // straps rising over the shoulders
      }
    }
    // ---------- skirt: knife pleats fanning out ----------
    if (c === T && v > -25.8 && v < -12.2 + Math.abs(Math.sin(u * 2.4)) * 0.25) {
      const t2 = (v + 25.8) / 13.4, hw = lerp(4.7, 6.6, t2) + (front ? 0 : 0); const su = u - sw * 0.25 * t2;
      if (Math.abs(su) < hw) {
        const pw = hw * 2 / 13, k = Math.floor((su + hw) / pw), ph = ((su + hw) / pw) % 1;
        const face = k % 2 ? -0.55 : 0.45, nx = face * (1 - ph * 0.3) + su / hw * 0.3, nz = Math.sqrt(1 - nx * nx * 0.8);
        let base = 2.2 - (v < -25 ? 1.0 : 0); c = gShade('skirt', base, [nx, 0.1, nz], x, y, 1.8);
        if (det && ph < 0.12 && k % 2) c = K0;
      }
    }
    // ---------- legs: calf shape, knee pits, ribbed socks, loafers ----------
    if (c === T && v > -13.6) for (const sd of [-1, 1]) {
      const l = lift[sd < 0 ? 0 : 1], lx = sd * (2.3 + sp * 0.5), fb2 = -l * 2.8;
      const shoe = gPillow(u, v, lx - 1.35, fb2 - 1.5, lx + 1.35, fb2 + 0.2, 0.6, 0.9);
      if (shoe) { c = gShade('shoe', 2.0, [shoe[1], shoe[2], shoe[3]], x, y); if (l > 0.2 && v > fb2 - 0.6) c = G1; break; }
      const sock = gCap(u, v, lx, -6.6, lx, fb2 - 1.2, 1.12, 0.95);
      if (sock) { c = gShade('sock', 1.4, [sock[1], sock[2], sock[3]], x, y); if (det && sock[0] < 0.08) c = K0; if (fine && Math.floor((u - lx) * 3) % 2 && sock[0] < 0.2) c = DN[c]; break; }
      const calf = gCap(u, v, lx, -12.8, lx * 0.98, -6.6, 1.38, 1.1);
      const bulge = gCap(u, v, lx + sd * 0.1, -10.8, lx, -8.0, 1.5, 1.2);
      const hit = calf || bulge; if (hit) { c = gShade('skin', sd > 0 ? 1.6 : 2.0, [hit[1], hit[2], hit[3]], x, y, 1.5); if (det && !front && Math.abs(v + 12.0) < 0.22 && Math.abs(u - lx) < 0.7) c = DN[c]; break; }
    }
    // contact shadow
    if (c === T && v > -0.6 && v < 0.6 && Math.abs(u) < 6.5 && ((u / 6.5) ** 2 + (v / 0.6) ** 2) < 1 && bay(x, y) < 0.8) c = K0;
    if (c !== T) tmp.d[(y - y0) * tmp.w + (x - x0)] = c;
  }
  // selective outline: silhouette pixels drop one step (keeps colour, sharpens the read)
  const d = tmp.d, w = tmp.w, out = d.slice();
  for (let j = 0; j < tmp.h; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (d[k] === T) continue; if (i === 0 || j === 0 || i === w - 1 || j === tmp.h - 1 || d[k - 1] === T || d[k + 1] === T || d[k - w] === T || d[k + w] === T) out[k] = DN[d[k]]; }
  d.set(out);
  blit(b, tmp, x0, y0); b.hq = true;
}
function sign(v) { return v < 0 ? -1 : 1; }
// poses repeat (hand-keyed cycles), so each distinct pose is shaded once and reused
const GIRL_CACHE = new Map();
function girlCached(b, cx, fy, o, front) {
  const q = v => Math.round((v || 0) * 100) / 100, L = o.lift || [0, 0];
  const key = [front ? 1 : 0, q(o.s), q(o.yaw), q(o.up), q(o.breath), q(o.sway), q(o.spread), q(L[0]), q(L[1]), q(o.arm)].join();
  let e = GIRL_CACHE.get(key);
  if (!e) {
    const pad = Math.ceil(10 * o.s), hgt = Math.ceil(50 * o.s), tb = new Buf(pad * 2 + 1, hgt + 3);
    girlRender(tb, pad, hgt, o, front); e = { b: tb, ox: pad, oy: hgt };
    if (GIRL_CACHE.size > 600) GIRL_CACHE.clear(); GIRL_CACHE.set(key, e);
  }
  blit(b, e.b, ri(cx) - e.ox, ri(fy) - e.oy); b.hq = true;
}
function girlBack(b, cx, fy, o) { girlCached(b, cx, fy, o, false); }
function girlFront(b, cx, fy, o) { girlCached(b, cx, fy, o, true); }
