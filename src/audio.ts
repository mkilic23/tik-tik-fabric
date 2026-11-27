// ---------- ses ve titreşim ----------
export let audioCtx: any = null;
export function beep(freq, dur = 0.09, type = 'square', vol = 0.15) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + dur + 0.01);
  } catch (e) {}
}
export function boomSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = audioCtx.currentTime, len = 1.4, sr = audioCtx.sampleRate;
    const buf = audioCtx.createBuffer(1, sr * len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(120, t + len);
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.9, t);
    src.connect(lp).connect(g).connect(audioCtx.destination); src.start(t);
    const o = audioCtx.createOscillator(), og = audioCtx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.8);
    og.gain.setValueAtTime(0.8, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(og).connect(audioCtx.destination); o.start(t); o.stop(t + 0.95);
  } catch (e) {}
}
// ---------- müzik: makine sesleri ritme oturur ----------
// Her üretim sesi bir sonraki 8'lik vuruşa kaydırılır; makine türü çalgıyı,
// ızgaradaki yeri notayı belirler. Fabrika büyüdükçe müzik zenginleşir.
export const SCALE = [0, 3, 5, 7, 10, 12, 15, 17];   // minör pentatonik
export const Music = {
  bpm: 112, t0: null, used: {}, lastBeat: -1, noise: null,
  step() { return 60 / this.bpm / 2; },
  ctx() { if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); return audioCtx; },
  slot(ctx) {
    if (this.t0 === null) this.t0 = ctx.currentTime;
    const st = this.step(), n = Math.ceil((ctx.currentTime + 0.03 - this.t0) / st);
    return { n, t: this.t0 + n * st };
  },
  tone(ctx, t, freq, dur, type, vol, drop = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (drop !== 1) o.frequency.exponentialRampToValueAtTime(freq * drop, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  hiss(ctx, t, dur, vol, freq) {
    if (!this.noise) {
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    }
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(ctx.destination); s.start(t); s.stop(t + dur + 0.02);
  },
  note(type, i) {
    try {
      const ctx = this.ctx(); if (ctx.state !== 'running') return;
      const { n, t } = this.slot(ctx);
      const key = type + n; this.used[key] = (this.used[key] || 0) + 1;
      if (this.used[key] > 2) return;                       // aynı vuruşta aynı türden en fazla 2 ses
      if (n % 64 === 0) this.used = {};
      const sc = SCALE[(i * 3 + (i >> 2)) % SCALE.length];
      if (type === 'crank') this.tone(ctx, t, 55 * Math.pow(2, SCALE[i % 5] / 12), 0.28, 'triangle', 0.22, 0.7);
      else if (type === 'press') { this.tone(ctx, t, 660 * Math.pow(2, sc / 12), 0.07, 'square', 0.04); this.hiss(ctx, t, 0.05, 0.08, 7000); }
      else if (type === 'mint') { this.tone(ctx, t, 523 * Math.pow(2, sc / 12), 0.6, 'sine', 0.1); this.tone(ctx, t, 1046 * Math.pow(2, sc / 12), 0.3, 'sine', 0.025); }
    } catch (e) {}
  },
  // tur boyunca saat: her vuruşta tık-tak, Fan'lar varsa hafif rüzgâr; basınç yükselince tempo artar
  tick(fans, pressure) {
    try {
      if (!audioCtx || audioCtx.state !== 'running') return;
      const ctx = audioCtx;
      this.bpm = 112 + Math.round(Math.max(0, pressure - 50) * 0.5);
      const beat = 60 / this.bpm;
      if (this.t0 === null) this.t0 = ctx.currentTime;
      const b = Math.ceil((ctx.currentTime + 0.05 - this.t0) / beat);
      if (b === this.lastBeat) return;
      this.lastBeat = b;
      const t = this.t0 + b * beat;
      this.tone(ctx, t, b % 2 ? 900 : 1200, 0.025, 'triangle', 0.008);   // yumuşak saat
      if (fans && b % 2 === 0) this.hiss(ctx, t, 0.35, 0.05 + Math.min(0.06, fans * 0.015), 900);
      if (pressure >= 80 && b % 2 === 1) this.tone(ctx, t, 233, 0.12, 'sawtooth', 0.03);
    } catch (e) {}
  },
  reset() { this.t0 = null; this.lastBeat = -1; this.used = {}; },
};
export function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
export const sfx = {
  pick:  () => { beep(520, 0.06, 'triangle'); buzz(8); },
  place: () => { beep(260, 0.12, 'square', 0.2); setTimeout(() => beep(520, 0.05), 40); buzz(18); },
  bad:   () => { beep(140, 0.15, 'sawtooth', 0.12); buzz([10, 40, 10]); },
  tap:   () => { beep(760, 0.07); buzz(10); },
  trash: () => { beep(300, 0.18, 'sawtooth', 0.1); buzz(25); },
};
