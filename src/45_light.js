/* ==========================================================================
   LIGHT — stepped bands along material ramps, dithered only at band seams.
   ========================================================================== */
// src: {x,y,r,k, sq:vertical squash, cone:{spread,w} (downward cone), fn:custom(x,y)->v}
function light(b, srcs, amb = 0, area = null, seam = 0.55, mask = null) {
  const x0 = area ? area[0] : 0, y0 = area ? area[1] : 0, x1 = area ? area[0] + area[2] : b.w, y1 = area ? area[1] + area[3] : b.h;
  for (let y = Math.max(0, y0); y < Math.min(b.h, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(b.w, x1); x++) {
      let v = amb;
      if (mask && !mask[y * b.w + x]) { v = mask.amb !== undefined ? mask.amb : amb; }
      else for (let i = 0; i < srcs.length; i++) {
        const s = srcs[i];
        if (s.fn) { v += s.fn(x, y); continue; }
        const dx = x - s.x, dy = (y - s.y) / (s.sq || 1);
        if (s.cone) { const yy = y - s.y; if (yy < -1) continue; if (Math.abs(dx) > yy * s.cone.spread + s.cone.w) continue; }
        const d = Math.sqrt(dx * dx + dy * dy); if (d < s.r) v += s.k * (1 - d / s.r);
      }
      let L = Math.floor(v + 0.5 + (bay(x, y) - 0.5) * seam);
      if (L === 0) continue;
      const k = y * b.w + x; let c = b.d[k]; if (c === T || EMISSIVE[c]) continue;
      if (L > 0) { if (L > 4) L = 4; while (L--) c = UP[c]; } else { if (L < -8) L = -8; while (L++) c = DN[c]; }
      b.d[k] = c;
    }
  }
}
// uniform shift (fades / blackouts) — stepped, never smooth
function shift(b, n, area = null) {
  if (!n) return;
  const map = new Uint8Array(256);
  for (let i = 0; i < 256; i++) { let c = i; if (n > 0) for (let k = 0; k < n; k++) c = UP[c]; else for (let k = 0; k < -n; k++) c = DN[c]; map[i] = c; }
  if (area) remapRect(b, area[0], area[1], area[2], area[3], map); else for (let i = 0; i < b.d.length; i++) b.d[i] = map[b.d[i]];
}
// darkness that also swallows emissives (true black-out / cut to black)
function blackout(b, keepEmissive = true) {
  for (let i = 0; i < b.d.length; i++) { const c = b.d[i]; if (keepEmissive && EMISSIVE[c]) continue; b.d[i] = K0; }
}
// stepped fade from black: lvl 0 (black) .. 4 (full)
function fadeIn(b, lvl) { if (lvl >= 4) return; if (lvl <= 0) { b.d.fill(K0); return; } shift(b, -(4 - lvl) * 2); }
