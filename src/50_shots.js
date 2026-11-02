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
const DURATION = 78;
function renderAt(t) {
  fb.d.fill(K0);
  const s = SHOTS.find(s => t >= s.a && t < s.z);
  if (s) s.fn(t, t - s.a, s);
}
