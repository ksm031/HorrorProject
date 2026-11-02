/* ==========================================================================
   SHOTS — each shot renders a pure function of time onto fb.
   ========================================================================== */
const fb = new Buf(W, H, K0);
const once = f => { let v; return () => v || (v = f()); };
const step = (t, fps) => Math.floor(t * fps); // hand-keyed timing helper
const ANIM = 10; // character animation rate (fps)

/* ---------- shot table ---------- */
const SHOTS = [];
function addShot(a, z, fn, name) { SHOTS.push({ a, z, fn, name }); }
// held beats: [story time, seconds held]. The film runs on film time; shots and score are written in
// story time; these holds stretch two still moments without touching anything else.
const HOLDS = [[29.3, 0.4], [60.9, 1.6]];
const DURATION = 78 + HOLDS.reduce((a, h) => a + h[1], 0);
function filmToStory(t) { let sh = 0; for (const [s, d] of HOLDS) { const st = s + sh; if (t < st) return t - sh; if (t < st + d) return s; sh += d; } return t - sh; }
function storyToFilm(s0) { let sh = 0; for (const [s, d] of HOLDS) { if (s0 < s) return s0 + sh; sh += d; } return s0 + sh; }
// stepped vignette: one band down at the corners, two at the very edge (dithered seam)
const VIG = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = ((x - 240) / 250) ** 2 + ((y - 135) / 150) ** 2 + (bay(x, y) - 0.5) * 0.22; VIG[y * W + x] = r > 1.32 ? 2 : r > 0.98 ? 1 : 0; }
function renderAt(tf) {
  const t = filmToStory(tf);
  fb.d.fill(K0);
  const s = SHOTS.find(s => t >= s.a && t < s.z);
  if (s) s.fn(t, t - s.a, s);
  for (let i = 0; i < fb.d.length; i++) { const v = VIG[i]; if (v) { let c = fb.d[i]; if (EMISSIVE[c]) continue; c = DN[c]; if (v > 1) c = DN[c]; fb.d[i] = c; } }
}
