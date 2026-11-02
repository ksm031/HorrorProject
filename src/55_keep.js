/* kept pieces: red light map, the face in the sky, the TV picture */
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

function shotBlack() { fb.d.fill(K0); }
