/* ==========================================================================
   PLAYER — integer-scaled canvas, start / pause / seek / replay, keyboard.
   ========================================================================== */
(function () {
  const $ = id => document.getElementById(id);
  const cv = $('c'), cx = cv.getContext('2d', { alpha: false }), frame = $('frame'), veil = $('veil'), bar = $('bar');
  cx.imageSmoothingEnabled = false;
  const img = cx.createImageData(W, H), u32 = new Uint32Array(img.data.buffer), pal = new Uint32Array(256);
  HEX.forEach((h, i) => { pal[i] = (255 << 24) | (parseInt(h.slice(4, 6), 16) << 16) | (parseInt(h.slice(2, 4), 16) << 8) | parseInt(h.slice(0, 2), 16); });
  function present() { const d = fb.d; for (let i = 0; i < d.length; i++) u32[i] = pal[d[i]]; cx.putImageData(img, 0, 0); }
  // whole-number scaling only, measured in device pixels
  function fit() {
    const dpr = window.devicePixelRatio || 1, vw = window.innerWidth * dpr, vh = (window.innerHeight - 32) * dpr;
    const k = Math.max(1, Math.floor(Math.min(vw / W, vh / H)));
    cv.style.width = (W * k / dpr) + 'px'; cv.style.height = (H * k / dpr) + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // clock: the audio clock when we have one, a performance clock otherwise
  let state = 'idle', pc0 = 0, pAt = 0, lastQ = -1, ended = false, poster = null;
  const now = () => state === 'idle' ? (poster !== null ? poster : pAt) : AU.ctx ? (AU.ctx.state === 'running' ? auNow() : pAt) : (state === 'playing' ? (performance.now() - pc0) / 1000 : pAt);
  function seek(t) {
    t = clamp(t, 0, DURATION - 0.01); ended = false; pAt = t; lastQ = -1;
    if (AU.ctx) auSeek(t); pc0 = performance.now() - t * 1000;
  }
  async function play() {
    try { auInit(); } catch (e) { AU.ctx = null; }
    if (ended) seek(0);
    if (AU.ctx) { if (state === 'idle') auSeek(pAt); await AU.ctx.resume().catch(() => { }); if (state !== 'idle') { AU.t0 = AU.ctx.currentTime - pAt; } }
    else pc0 = performance.now() - pAt * 1000;
    state = 'playing'; poster = null; veil.hidden = true; bar.hidden = false; $('pp').textContent = '❚❚'; $('pp').setAttribute('aria-label', 'Pause'); wake();
  }
  function pause() {
    if (state !== 'playing') return; pAt = now(); state = 'paused';
    if (AU.ctx) AU.ctx.suspend(); $('pp').textContent = '▶'; $('pp').setAttribute('aria-label', 'Play'); frame.classList.remove('idle');
  }
  function toggle() { if (state === 'playing') pause(); else play(); }
  function replay() { seek(0); if (AU.ctx) AU.t0 = AU.ctx.currentTime; play(); }
  function finish() {
    ended = true; state = 'paused'; pAt = DURATION; if (AU.ctx) AU.ctx.suspend();
    veil.querySelector('h1').textContent = '철거 예정'; $('go').textContent = '↺ 다시 보기 · REPLAY'; veil.hidden = false; frame.classList.remove('idle');
  }
  let idleT = 0; function wake() { frame.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (state === 'playing') frame.classList.add('idle'); }, 2200); }
  const fmt = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  function loop() {
    requestAnimationFrame(loop);
    if (state === 'playing') auSchedule();
    let t = now();
    if (state === 'playing' && t >= DURATION) { finish(); t = DURATION; }
    const q = Math.floor(t * 24); // picture changes at most 24×/s (holds and steps, never smooth)
    if (q !== lastQ) { lastQ = q; renderAt(Math.min(t, DURATION - 0.001)); present(); }
    if (state === 'idle') return;
    $('fill').style.width = (t / DURATION * 100) + '%'; $('time').textContent = fmt(t) + ' / ' + fmt(DURATION);
    $('track').setAttribute('aria-valuenow', Math.round(t));
  }
  // controls
  $('go').addEventListener('click', e => { e.stopPropagation(); ended ? replay() : play(); });
  $('pp').addEventListener('click', e => { e.stopPropagation(); toggle(); });
  $('rp').addEventListener('click', e => { e.stopPropagation(); replay(); });
  $('mute').addEventListener('click', e => { e.stopPropagation(); AU.muted = !AU.muted; $('mute').textContent = AU.muted ? 'MUTE' : 'SND'; if (AU.ctx) seek(now()); });
  $('fs').addEventListener('click', e => { e.stopPropagation(); const d = document; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const r = $('stage'); (r.requestFullscreen || r.webkitRequestFullscreen || (() => { })).call(r); } });
  document.addEventListener('fullscreenchange', fit);
  cv.addEventListener('click', () => { if (state !== 'idle') toggle(); });
  frame.addEventListener('mousemove', wake); frame.addEventListener('touchstart', wake, { passive: true });
  const tr = $('track'); let drag = false;
  const seekX = x => { const r = $('rail').getBoundingClientRect(); seek(clamp((x - r.left) / r.width, 0, 1) * DURATION); if (state === 'playing' && AU.ctx) AU.t0 = AU.ctx.currentTime - pAt; };
  tr.addEventListener('pointerdown', e => { e.stopPropagation(); drag = true; tr.setPointerCapture(e.pointerId); seekX(e.clientX); });
  tr.addEventListener('pointermove', e => { if (drag) seekX(e.clientX); });
  tr.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('keydown', e => {
    if (state === 'idle' && e.code !== 'Space' && e.key !== 'Enter') return;
    if (e.code === 'Space' || e.key === 'k') { e.preventDefault(); if (state === 'idle' || ended) $('go').click(); else toggle(); }
    else if (e.key === 'ArrowRight') { seek(now() + 5); if (state === 'playing' && AU.ctx) AU.t0 = AU.ctx.currentTime - pAt; wake(); }
    else if (e.key === 'ArrowLeft') { seek(now() - 5); if (state === 'playing' && AU.ctx) AU.t0 = AU.ctx.currentTime - pAt; wake(); }
    else if (e.key === 'r') replay(); else if (e.key === 'm') $('mute').click(); else if (e.key === 'f') $('fs').click();
  });
  // verification hooks (no effect on playback)
  window.__render = t => { renderAt(t); present(); return true; };
  window.__shots = SHOTS.map(s => [s.a, s.z, s.name]);
  // build every pre-rendered layer before the Start button appears (no hitches mid-film)
  const warm = SHOTS.map(s => s.a + 0.5).concat([63.1, 63.4, 63.7, 64.3, 64.6]); let wi = 0;
  const q = new URLSearchParams(location.search), still = q.has('t') ? parseFloat(q.get('t')) : null;
  (function step2() {
    if (wi < warm.length) { renderAt(warm[wi++]); return setTimeout(step2, 0); }
    $('load').style.display = 'none';
    poster = still !== null ? still : 7.0; pAt = still !== null ? still : 0;
    if (still === null) veil.hidden = false;
    window.__ready = true; requestAnimationFrame(loop);
  })();
})();
