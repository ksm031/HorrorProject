# 철거 예정 — Scheduled for Demolition

78-second Korean horror pixel-art cutscene. **`index.html` is the whole thing**: one self-contained file, no external requests, all sound synthesised with Web Audio after Start.

- Rendered on a fixed 480×270 indexed framebuffer (35-colour palette), shown at whole-number scale with nearest-neighbour.
- `src/` holds the editable source; `node tools/build.js` concatenates it into `index.html`.
- Verification: `node tools/check.js <prefix> <t...>` (stills, palette/err/network check), `node tools/audio.js` (offline level analysis), `node tools/play.js <prefix>` (transport + mobile).
- Controls: Space/K play-pause · ←/→ seek 5 s · R replay · M mute · F fullscreen. `index.html?t=42` shows a still.
