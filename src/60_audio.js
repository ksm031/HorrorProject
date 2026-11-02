/* ==========================================================================
   AUDIO — everything synthesised with Web Audio, scheduled against the same
   clock the picture uses (ctx.currentTime), so pause / seek / replay stay in sync.
   ========================================================================== */
const AU = { ctx: null, t0: 0, master: null, verb: null, dry: null, layers: {}, active: new Set(), cursor: 0, events: [], muted: false };

function auNoiseBuf(ctx, sec = 2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0); const r = rng(77);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; return b;
}
function auIR(ctx, sec, decay) {
  const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate), r = rng(5);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return b;
}
function auInit(offline) {
  if (AU.ctx && !offline) return;
  const ctx = offline || new (window.AudioContext || window.webkitAudioContext)(); AU.ctx = ctx;
  AU.noise = auNoiseBuf(ctx, 3);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
  AU.master = ctx.createGain(); AU.master.gain.value = 0.9; AU.master.connect(comp); comp.connect(ctx.destination);
  AU.verb = ctx.createConvolver(); AU.verb.buffer = auIR(ctx, 2.6, 3.2); const vg = ctx.createGain(); vg.gain.value = 0.55; AU.verb.connect(vg); vg.connect(AU.master);
  AU.room = ctx.createConvolver(); AU.room.buffer = auIR(ctx, 0.9, 4); const rg = ctx.createGain(); rg.gain.value = 0.5; AU.room.connect(rg); rg.connect(AU.master);
  AU.bus = ctx.createGain(); AU.bus.connect(AU.master); // everything goes through bus (lets us cut to total silence)
  // ---- continuous layers (gain driven by the timeline) ----
  const L = AU.layers, mk = (node, g = 0, send = null) => { const gn = ctx.createGain(); gn.gain.value = g; node.connect(gn); gn.connect(AU.bus); if (send) { const s = ctx.createGain(); s.gain.value = send; gn.connect(s); s.connect(AU.verb); } return gn; };
  const src = () => { const s = ctx.createBufferSource(); s.buffer = AU.noise; s.loop = true; s.start(); return s; };
  // cicadas: two pulsing voices of band-passed noise (AM at ~30 Hz, slow swells)
  const cic = ctx.createGain(); cic.gain.value = 0;
  for (const [f, am, sw, pan] of [[4300, 31, 0.13, -0.5], [5600, 37, 0.09, 0.6]]) {
    const n = src(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 5;
    const a = ctx.createGain(); a.gain.value = 0.5; const o = ctx.createOscillator(); o.frequency.value = am; const og = ctx.createGain(); og.gain.value = 0.5; o.connect(og); og.connect(a.gain); o.start();
    const s2 = ctx.createGain(); s2.gain.value = 0.6; const lo = ctx.createOscillator(); lo.frequency.value = sw; const lg = ctx.createGain(); lg.gain.value = 0.4; lo.connect(lg); lg.connect(s2.gain); lo.start();
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    n.connect(bp); bp.connect(a); a.connect(s2); s2.connect(p); p.connect(cic);
  }
  L.cicada = mk(cic, 0, 0.3);
  // mains hum of the wires (60 Hz grid) and the lamp buzz
  const hum = ctx.createGain(); hum.gain.value = 1;
  for (const [f, g, ty] of [[60, 0.5, 'sine'], [120, 0.35, 'sine'], [180, 0.18, 'triangle'], [240, 0.06, 'sawtooth']]) { const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f; const og = ctx.createGain(); og.gain.value = g; o.connect(og); og.connect(hum); o.start(); }
  const hlp = ctx.createBiquadFilter(); hlp.type = 'lowpass'; hlp.frequency.value = 500; hum.connect(hlp);
  L.hum = mk(hlp, 0);
  const bz = ctx.createOscillator(); bz.type = 'sawtooth'; bz.frequency.value = 120; const bbp = ctx.createBiquadFilter(); bbp.type = 'bandpass'; bbp.frequency.value = 1600; bbp.Q.value = 2; bz.connect(bbp); bz.start();
  L.buzz = mk(bbp, 0);
  // dread drone: detuned low saws through a lowpass
  const dr = ctx.createGain();
  for (const f of [43.0, 43.6, 64.7]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(dr); o.start(); }
  const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 140; dr.connect(dlp);
  L.drone = mk(dlp, 0, 0.2);
  // outdoor air: dark wind noise
  const wn = src(), wlp = ctx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 380; wn.connect(wlp);
  L.air = mk(wlp, 0);
  // CRT: static + line whine
  const st = src(), sbp = ctx.createBiquadFilter(); sbp.type = 'highpass'; sbp.frequency.value = 900; st.connect(sbp);
  L.stat = mk(sbp, 0, 0.1);
  const wh = ctx.createOscillator(); wh.frequency.value = 7800; wh.start(); L.whine = mk(wh, 0);
  AU.events = buildSoundEvents();
}

/* ---- one-shot voices ---- */
function auTrack(n, end) { AU.active.add(n); n.onended = () => AU.active.delete(n); n.stop(end); }
function nz(when, dur, o) { // filtered noise burst
  const ctx = AU.ctx, s = ctx.createBufferSource(); s.buffer = AU.noise;
  const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.value = o.f || 1000; f.Q.value = o.q || 1;
  if (o.f2) { f.frequency.setValueAtTime(o.f || 1000, when); f.frequency.exponentialRampToValueAtTime(o.f2, when + dur); }
  const g = ctx.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(o.v || 0.3, when + (o.a || 0.004)); g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
  const p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan || 0, -1, 1);
  s.connect(f); f.connect(g); g.connect(p); p.connect(AU.bus);
  if (o.verb) { const vs = ctx.createGain(); vs.gain.value = o.verb; p.connect(vs); vs.connect(o.room ? AU.room : AU.verb); }
  s.start(when, (when * 7.3) % 2); auTrack(s, when + dur + 0.05);
}
function tone(when, dur, o) { // pitched voice with pitch drop
  const ctx = AU.ctx, s = ctx.createOscillator(); s.type = o.type || 'sine'; s.frequency.value = o.f; if (o.f2) { s.frequency.setValueAtTime(o.f, when); s.frequency.exponentialRampToValueAtTime(o.f2, when + dur); }
  const g = ctx.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(o.v || 0.3, when + (o.a || 0.005)); g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
  let out = g; if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); out = f; }
  if (o.bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp; f.Q.value = o.q || 3; out.connect(f); out = f; }
  const p = ctx.createStereoPanner(); p.pan.value = clamp(o.pan || 0, -1, 1); out.connect(p); p.connect(AU.bus);
  if (o.verb) { const vs = ctx.createGain(); vs.gain.value = o.verb; p.connect(vs); vs.connect(o.room ? AU.room : AU.verb); }
  s.connect(g); s.start(when); auTrack(s, when + dur + 0.05);
}
const SFX = {
  step: (w, o) => { nz(w, 0.07 * (o.run ? 1 : 1.3), { f: o.stone ? 2200 : 1100, q: 0.9, v: (o.run ? 0.22 : 0.13) * (o.v || 1), pan: o.pan, verb: 0.25 }); tone(w, 0.05, { f: 110, f2: 60, v: o.run ? 0.18 : 0.1, pan: o.pan }); },
  scuff: (w, o) => nz(w, 0.22, { f: 1400, f2: 700, q: 0.7, v: 0.12, a: 0.03, pan: o.pan, verb: 0.2 }),
  bark: (w, o) => { for (let k = 0; k < (o.n || 1); k++) { const t = w + k * 0.34; tone(t, 0.16, { type: 'sawtooth', f: 520, f2: 260, v: 0.05 * (o.v || 1), bp: 820, q: 2.4, pan: o.pan, verb: 1.4 }); nz(t, 0.12, { f: 1100, q: 1.2, v: 0.03 * (o.v || 1), pan: o.pan, verb: 1.2 }); } },
  click: (w, o) => { nz(w, 0.02, { f: 3500, q: 0.8, v: 0.06 * (o.v || 1), type: 'highpass', pan: o.pan }); },
  relay: (w) => { tone(w, 0.12, { f: 140, f2: 70, v: 0.12 }); nz(w, 0.04, { f: 2500, q: 1, v: 0.06 }); },
  pop: (w, o) => { nz(w, 0.09, { f: 3000, q: 0.6, v: 0.16, pan: o.pan, verb: 0.6 }); tone(w, 0.3, { f: 2900, f2: 1700, v: 0.03, pan: o.pan, verb: 0.5 }); },
  breath: (w, o) => { const inh = o.in; nz(w, o.d || 0.42, { f: inh ? 900 : 1500, f2: inh ? 1800 : 700, q: 1.6, v: 0.05 * (o.v || 1), a: inh ? 0.18 : 0.05, pan: o.pan }); },
  flap: (w, o) => { for (let k = 0; k < 3; k++) nz(w + k * 0.07, 0.07, { f: 500, q: 0.9, v: 0.12, pan: o.pan }); },
  basin: (w, o) => { tone(w, 0.18, { f: 170, f2: 80, v: 0.35, pan: o.pan }); nz(w, 0.12, { f: 900, q: 1, v: 0.18, pan: o.pan }); tone(w + 0.16, 0.12, { f: 150, f2: 90, v: 0.2, pan: o.pan }); nz(w + 0.08, 0.7, { type: 'lowpass', f: 2400, f2: 400, v: 0.1, a: 0.02, pan: o.pan }); for (let k = 0; k < 4; k++) tone(w + 0.3 + k * 0.13, 0.08, { f: 120 - k * 10, v: 0.08 / (k + 1), pan: o.pan }); },
  thud: (w, o) => tone(w, 0.6, { f: 48, f2: 30, v: 0.4 * (o.v || 1), lp: 150, verb: 0.4 }),
  swell: (w, o) => tone(w, o.d || 1.2, { f: 36, f2: 30, v: 0.12, a: o.d ? o.d * 0.6 : 0.6, lp: 120 }),
  snap: (w) => { nz(w, 0.05, { type: 'highpass', f: 2500, v: 0.5, verb: 1 }); tone(w, 0.35, { type: 'square', f: 2600, f2: 400, v: 0.05, verb: 0.8 }); nz(w + 0.03, 0.8, { f: 5000, f2: 1500, q: 2, v: 0.08, verb: 0.6 }); tone(w, 0.5, { f: 90, f2: 40, v: 0.2 }); },
  slam: (w) => { nz(w, 0.3, { type: 'lowpass', f: 3200, f2: 300, v: 0.6, a: 0.002, verb: 1, room: true }); tone(w, 0.5, { f: 70, f2: 40, v: 0.6 }); for (const [f, d, v] of [[187, 1.3, 0.09], [433, 1.0, 0.06], [761, 0.8, 0.045], [1210, 0.6, 0.03], [1873, 0.4, 0.02]]) tone(w, d, { type: 'triangle', f, v, verb: 0.6, room: true }); },
  rustle: (w) => nz(w, 0.25, { f: 2600, q: 0.8, v: 0.02, a: 0.08 }),
  tvon: (w) => { nz(w, 0.03, { type: 'highpass', f: 4000, v: 0.15, room: true, verb: 0.4 }); tone(w, 0.5, { f: 60, f2: 50, v: 0.15 }); tone(w + 0.02, 0.4, { type: 'sawtooth', f: 15, f2: 120, v: 0.06, lp: 400 }); },
  sting: (w) => { // the reveal: one hard, dissonant hit
    tone(w, 0.9, { f: 58, f2: 26, v: 0.75, lp: 160 });
    nz(w, 0.7, { type: 'lowpass', f: 5000, f2: 300, v: 0.45, a: 0.002, verb: 0.5 });
    for (const f of [233, 247, 349, 370, 494, 523]) tone(w, 1.0, { type: 'sawtooth', f, f2: f * 0.86, v: 0.05, bp: 1400, q: 1.2, verb: 0.4 });
    tone(w + 0.02, 0.8, { type: 'sawtooth', f: 1900, f2: 2700, v: 0.05, bp: 2400, q: 5, verb: 0.6 });
  },
  lunge: (w) => { nz(w, 0.4, { f: 400, f2: 2200, q: 0.8, v: 0.3, a: 0.15 }); tone(w + 0.3, 0.5, { f: 70, f2: 35, v: 0.5, lp: 160 }); },
  cut: (w) => { AU.master.gain.setValueAtTime(0, w); },
  uncut: (w) => { AU.master.gain.setValueAtTime(AU.muted ? 0 : 0.9, w); },
  heart: (w) => { for (const [d, v] of [[0, 0.9], [0.24, 0.6]]) { tone(w + d, 0.22, { f: 62, f2: 34, v, lp: 140 }); nz(w + d, 0.12, { type: 'lowpass', f: 220, v: v * 0.4 }); } }
};

/* ---- the score: every event is tied to the picture's frame clock ---- */
function buildSoundEvents() {
  const E = [], ev = (t, k, o = {}) => E.push({ t, k, o });
  // S1: walk home, cicadas, a dog far below
  ev(3.4, 'bark', { n: 2, v: 0.8, pan: -0.6 }); ev(6.9, 'bark', { n: 1, v: 0.5, pan: 0.7 });
  // S2: her steps fade as she walks away up the alley (8 fps cycle, contact every 4th frame)
  for (let f = 0; f < 15 * 8; f++) if (f % 4 === 0) { const t = 9 + f / 8, z = 48 + (t - 9) * 4.6; ev(t, 'step', { v: clamp(48 / z, 0.25, 1) }); }
  ev(12.2, 'bark', { n: 3, v: 0.6, pan: 0.8 });
  for (const [a, z] of S2_BLACK) {
    for (let k = 0; k < 10; k++) { const t = a - 0.5 + k * 0.05; if (s2LampOn(t) !== s2LampOn(t - 0.05)) ev(t, 'click', { pan: 0.4 }); }
    ev(a, 'relay'); ev(z, 'click', { v: 0.8, pan: 0.4 });
  }
  for (const g of S2_GHOST) ev(g[0] - 0.05, 'swell', { d: 1.4 });
  // S3: the stop, cloth as she turns, a held breath — then it is there
  ev(24.02, 'scuff', { pan: 0 }); for (const [a] of S3_TURN) ev(a, 'rustle');
  for (let t = 25; t < 30; t += 2.1) ev(t, 'breath', { in: true, v: 0.4, d: 0.8 });
  ev(S3_REVEAL, 'sting'); ev(33.0, 'cut'); ev(33.42, 'uncut'); ev(33.44, 'breath', { in: true, v: 2.2, d: 0.35 });
  // S4: running (12 fps, contact every 4th frame), breathing, flaps, the basin, lamps dying behind her, marks
  for (let f = 0; f < 15 * 12; f++) { const t = 33.5 + f / 12; if (f % 4 === 0) ev(t, 'step', { run: true }); if (f % 8 === 2) ev(t, 'breath', { in: f % 16 === 2, v: 1.2, d: 0.3 }); }
  const lampDeath = (t, pan) => { ev(t, 'click', { pan }); ev(t + 0.34, 'pop', { pan }); };
  for (const l of S4A.lamps) { const t = s4aPass(l); if (t < 38) lampDeath(t, l.x > 0 ? 0.3 : -0.3); }
  for (const lz of [48, 86]) { const t = S4A.a + (lz - S4A.z0) / S4A.v; if (t < 38) { ev(t - 0.1, 'flap', { pan: -0.2 }); ev(t + 0.12, 'flap', { pan: 0.2 }); } }
  for (const l of S4B.lamps) { const t = s4bPass(l.z); if (t < 42.6) lampDeath(t, l.x > 0 ? 0.4 : -0.4); }
  ev(s4bPass(S4B.basin.z - 6), 'basin', { pan: -0.3 });
  for (const l of S4C.lamps) { const t = s4cPass(l.z); if (t < 48.5) lampDeath(t, l.x > 0 ? 0.4 : -0.4); }
  for (const t of [35.9, 36.75, 40.4, 41.4, 44.6, 46.0]) ev(t, 'thud', { v: 0.5 });
  ev(47.2, 'lunge');
  // S5: stairs (stone), heavy breath, the giant's stepped rise, wires snap
  for (let f = 0; f < 11 * 12; f++) { const t = 48.5 + f / 12; if (f % 4 === 0) ev(t, 'step', { run: true, stone: true, v: clamp(30 / (14 + (t - 48.5) * 6), 0.35, 1) }); if (f % 8 === 3) ev(t, 'breath', { in: f % 16 === 3, v: 1.4, d: 0.3 }); }
  for (let k = 0; k < 13; k++) ev(S5_RISE_T + k / 2.2, 'thud', { v: 0.35 + k * 0.04 });
  for (const t of S5_SNAP) ev(t, 'snap');
  // S6a: run in, stop — then nothing at all
  for (let f = 0; f < 12; f += 4) ev(59.5 + f / 12, 'step', { run: true });
  ev(60.5, 'scuff', {}); ev(60.56, 'cut'); ev(68.19, 'uncut');
  // S7: the slam, the TV, one heartbeat
  ev(68.2, 'slam'); ev(70.0, 'tvon'); ev(74.2, 'heart'); ev(74.6, 'cut');
  return E.sort((a, b) => a.t - b.t);
}
// layer gains as a function of film time (sampled ahead by the scheduler)
function layerGains(t) {
  const silent = t >= 60.5 && t < 68.2; // the dead end: total silence
  const out = { cicada: 0, hum: 0, buzz: 0, drone: 0, air: 0, stat: 0, whine: 0 };
  if (silent || t >= 74.6) return out;
  if (t < 15.0) out.cicada = t < 2 ? 0.3 * t / 2 : t < 9 ? 0.3 : 0.22; // cicadas stop dead at the first blackout
  if (t < 60.5) out.air = t < 24 ? 0.08 : t < 33.5 ? 0.04 : 0.07;
  if (t < 60.5) out.hum = t < 9 ? 0.02 : t < 24 ? 0.035 : t < 33.5 ? 0.07 : t < 48.5 ? 0.03 : 0.05;
  if (t >= 9 && t < 24) out.buzz = s2LampOn(t) ? 0.022 : 0;
  if (t >= 33.5 && t < 48.5) { const on = t < 38 ? S4A.lamps.some(l => lampLife(s4aPass(l), t)) : t < 42.6 ? S4B.lamps.some(l => lampLife(s4bPass(l.z), t)) : S4C.lamps.some(l => lampLife(s4cPass(l.z), t)); out.buzz = on ? 0.012 : 0; }
  if (t >= 31.9 && t < 33.5) { out.hum = 0; out.air = 0; out.drone = 0; out.buzz = 0; }
  if (t >= 15.6 && t < 60.5 && !(t >= 31.9 && t < 33.5)) out.drone = t < 24 ? 0.06 : t < 33.5 ? 0.1 : t < 48.5 ? 0.08 : 0.08 + clamp((t - 50) / 9, 0, 1) * 0.16;
  if (t >= 70.12 && t < 74.6) { out.stat = t < 70.9 ? 0.09 : 0.022; out.whine = 0.006; }
  return out;
}
/* ---- transport ---- */
function auNow() { return AU.ctx ? AU.ctx.currentTime - AU.t0 : 0; }
function auSchedule() {
  if (!AU.ctx || AU.ctx.state !== 'running') return;
  const now = auNow(), ahead = now + 0.25, base = AU.t0;
  while (AU.cursor < AU.events.length && AU.events[AU.cursor].t < ahead) {
    const e = AU.events[AU.cursor++]; if (e.t >= now - 0.03) SFX[e.k](Math.max(AU.ctx.currentTime, base + e.t), e.o);
  }
  // layers: sample the score at small steps across the lookahead window
  for (let k = 0; k <= 4; k++) {
    const tt = now + k * 0.05, g = layerGains(tt), when = Math.max(AU.ctx.currentTime, base + tt);
    for (const n in g) AU.layers[n].gain.setTargetAtTime(AU.muted ? 0 : g[n], when, 0.012);
  }
}
function auSeek(t) {
  if (!AU.ctx) return;
  for (const n of AU.active) { try { n.stop(); } catch (e) { } } AU.active.clear();
  for (const n in AU.layers) { const g = AU.layers[n].gain; g.cancelScheduledValues(0); g.setValueAtTime(0, AU.ctx.currentTime); }
  const silentAt = (t >= 60.56 && t < 68.19) || (t >= 33.0 && t < 33.42) || t >= 74.6;
  AU.master.gain.cancelScheduledValues(0); AU.master.gain.setValueAtTime(silentAt || AU.muted ? 0 : 0.9, AU.ctx.currentTime);
  AU.t0 = AU.ctx.currentTime - t; AU.cursor = 0; while (AU.cursor < AU.events.length && AU.events[AU.cursor].t < t) AU.cursor++;
}

// offline render of the whole score (verification only: levels, silences, clipping)
async function auOffline(sr = 22050) {
  const ctx = new OfflineAudioContext(2, sr * DURATION, sr); auInit(ctx); AU.t0 = 0;
  for (const e of AU.events) SFX[e.k](e.t, e.o);
  for (let t = 0; t < DURATION; t += 0.05) { const g = layerGains(t); for (const n in g) AU.layers[n].gain.setValueAtTime(g[n], t); }
  const buf = await ctx.startRendering(), L = buf.getChannelData(0), Rr = buf.getChannelData(1), out = [];
  for (let s = 0; s < DURATION; s += 0.5) { let pk = 0, ss = 0, n = 0; for (let i = Math.floor(s * sr); i < Math.min(L.length, Math.floor((s + 0.5) * sr)); i++) { const v = Math.max(Math.abs(L[i]), Math.abs(Rr[i])); pk = Math.max(pk, v); ss += L[i] * L[i]; n++; } out.push([s, pk, Math.sqrt(ss / Math.max(1, n))]); }
  return out;
}
