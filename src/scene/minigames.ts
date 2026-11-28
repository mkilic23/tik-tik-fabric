import Phaser from 'phaser';
import { beep, buzz, sfx } from '../audio';
import { ALERT_SYM, MACHINES } from '../data/machines';
import { GRADES, MG_TEXT, RULES } from '../data/rules';
import { PW, state } from '../state';
import { C, D, FONT, ROWS } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class MinigamePart {
  [key: string]: any;

  // =====================================================================
  // BAKIM VE MİNİ OYUNLAR
  // =====================================================================
  setAlert(v, kind) {
    if (v.alert) { v.alert.destroy(); v.alert = null; }
    if (!kind) return;
    const s = this.cell;
    const a = this.add.container(v.x + s * 0.3, v.y - s * 0.36).setDepth(45);
    const g = this.add.graphics();
    // balon makinenin renginde ve simgesiyle: hangi mini oyunun geleceği belli olur
    const col = MACHINES[v.type].color, R = s * 0.19, broken = kind === 'broken';
    g.fillStyle(0x000000, 0.35).fillCircle(0, 2 * D, R);
    g.fillStyle(broken ? 0xe0564a : 0xffc23d, 1).fillCircle(0, 0, R);
    g.fillStyle(col, 1).fillCircle(0, 0, R * 0.74);
    g.lineStyle(2 * D, 0x2a1405, 1).strokeCircle(0, 0, R);
    const t = this.add.text(0, 0, ALERT_SYM[v.type], { fontFamily: FONT, fontSize: Math.round(s * 0.2) + 'px', fontStyle: '700', color: '#0d1220' }).setOrigin(0.5);
    const tag = this.add.text(R * 0.75, -R * 0.75, broken ? '✕' : '!', { fontFamily: FONT, fontSize: Math.round(s * 0.17) + 'px', fontStyle: '700', color: '#ffffff', stroke: broken ? '#7a1a12' : '#7a4a05', strokeThickness: 4 * D }).setOrigin(0.5);
    a.add([g, t, tag]);
    this.tweens.add({ targets: a, y: a.y - s * 0.06, duration: kind === 'broken' ? 180 : 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    v.alert = a;
  }

  speedOf(v, i) {
    if (v.svc === 'broken') return 0;
    let m = 1;
    if (this.hasRingNear(i)) m *= RULES.ringSpeed;
    if (state.eng === 'tuccar') m *= 0.85;
    if (v.boost && state.time > v.boost.until) m *= v.boost.mult; // süre geri sayıyor: time > until iken aktif
    return m;
  }

  flashTip(title, body, accent, ms, done) {
    this.setBanner(title, body, accent);
    this.infoUntil = this.time.now + ms;
    if (done) this.time.delayedCall(ms, done);
  }

  // ---------- mini oyun paneli ----------
  openMinigame(i) {
    if (this.mg) return;
    const v = this.cells[i];
    const W = this.W, s = this.cell;
    const pw = W - this.pad * 2, ph = Math.min(s * 2.9, 290 * D);
    const mc = this.cellCenter(i);
    const gridMid = this.gy + s * ROWS / 2;
    let py = mc.y < gridMid ? mc.y + s * 0.62 : mc.y - s * 0.62 - ph;
    py = Phaser.Math.Clamp(py, 8 * D, this.trayTop - ph - 8 * D);
    const panel = this.add.container(this.pad, py).setDepth(80);
    const g = this.add.graphics();
    const m = MACHINES[v.type];
    // ok ucu makineye
    const tipX = mc.x - this.pad, up = mc.y < py;
    g.fillStyle(0x2a3456, 1);
    if (up) g.fillTriangle(tipX - 14 * D, 2, tipX + 14 * D, 2, tipX, -14 * D);
    else g.fillTriangle(tipX - 14 * D, ph - 2, tipX + 14 * D, ph - 2, tipX, ph + 14 * D);
    g.fillStyle(0x000000, 0.4).fillRoundedRect(0, 6 * D, pw, ph, 20 * D);
    g.fillStyle(0x232c4a, 1).fillRoundedRect(0, 0, pw, ph, 20 * D);
    g.lineStyle(3 * D, 0x2a3456, 1).strokeRoundedRect(0, 0, pw, ph, 20 * D);
    g.lineStyle(2 * D, m.color, 0.9).strokeRoundedRect(3 * D, 3 * D, pw - 6 * D, ph - 6 * D, 17 * D);
    const title = this.add.text(16 * D, 20 * D, MG_TEXT[v.type], { fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.042, 17 * D)) + 'px', fontStyle: '700', color: '#ffe3a8' }).setOrigin(0, 0.5);
    const timer = this.add.graphics();
    panel.add([g, title, timer]);
    const mg = {
      i, v, type: v.type, panel, pw, ph, timer, t: 0, limit: RULES.mgTime, done: false,
      cx: pw / 2, cy: ph * 0.58, gfx: this.add.graphics(), parts: {},
      local: (p) => ({ x: p.x - this.pad, y: p.y - py }),
    };
    panel.add(mg.gfx);
    this.mg = mg;
    panel.setScale(0.85).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 120, ease: 'Back.easeOut' });
    sfx.pick();
    this['mgInit_' + v.type](mg);
  }

  closeMinigame(grade) {
    const mg = this.mg; if (!mg || mg.done) return;
    mg.done = true;
    ((window as any).__grades = (window as any).__grades || []).push(mg.type + ':' + grade + '@' + mg.t.toFixed(2));
    const v = mg.v, i = mg.i;
    if (state.task) { state.task.repairs++; if (grade === 'perfect') state.task.perfect++; }
    // sonuç
    const R = GRADES[grade];
    const c = this.cellCenter(i);
    const pop = this.add.text(c.x, c.y - this.cell * 0.2, R.label, {
      fontFamily: FONT, fontSize: Math.round(this.cell * (grade === 'perfect' ? 0.36 : 0.28)) + 'px', fontStyle: '700', color: R.color,
      stroke: '#0b0f1c', strokeThickness: 5 * D,
    }).setOrigin(0.5).setDepth(90).setScale(0.4);
    this.tweens.add({ targets: pop, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.tweens.add({ targets: pop, y: pop.y - this.cell * 0.6, alpha: 0, delay: 650, duration: 400, onComplete: () => pop.destroy() });
    if (grade === 'perfect') {
      [784, 988, 1318].forEach((f, k) => setTimeout(() => beep(f, 0.09, 'triangle', 0.2), k * 60));
      buzz([15, 30, 25]); this.cameras.main.shake(90, 0.005);
      this.sparks.explode(26, c.x, c.y);
    } else if (grade === 'good') { beep(660, 0.1, 'triangle', 0.18); buzz(15); this.sparks.explode(10, c.x, c.y); }
    else { beep(200, 0.15, 'sawtooth', 0.1); buzz([10, 30, 10]); }

    // bakım ısıyı düşürür: Mükemmel tamamen soğutur
    state.heat[i] = Math.min(state.heat[i] || 0, RULES.afterGrade[grade]);
    v.svc = 'ok'; this.setAlert(v, null);
    const applyBoost = (target) => { if (R.mult > 1) target.boost = { mult: R.mult, until: state.time - R.secs }; };
    if (v.type === 'fan') {
      // fan: 2x2 alanındaki makineleri hızlandırır
      this.fanArea(i).forEach(j => {
        const n = this.cells[j];
        if (n && j !== i && R.mult > 1) { applyBoost(n); const nc = this.cellCenter(j); this.sparks.explode(8, nc.x, nc.y); }
      });
    } else applyBoost(v);

    const panel = mg.panel;
    this.tweens.add({ targets: panel, alpha: 0, scale: 0.9, duration: 140, delay: 120, onComplete: () => panel.destroy() });
    this.mg = null;
  }

  mgUpdate(dt) {
    const mg = this.mg; if (!mg) return;
    mg.t += dt;
    const f = Math.max(0, 1 - mg.t / mg.limit);
    const tg = mg.timer; tg.clear();
    tg.fillStyle(0x0b0f1c, 1).fillRoundedRect(mg.pw - 16 * D - mg.pw * 0.3, 14 * D, mg.pw * 0.3, 10 * D, 5 * D);
    tg.fillStyle(f > 0.35 ? 0x5fd38a : 0xe0564a, 1).fillRoundedRect(mg.pw - 16 * D - mg.pw * 0.3, 14 * D, Math.max(10 * D, mg.pw * 0.3 * f), 10 * D, 5 * D);
    this['mgStep_' + mg.type](mg, dt);
    if (this.mg === mg && mg.t >= mg.limit) this.closeMinigame('bad');
  }
  grade(mg, perfectT, goodT) { return mg.t <= perfectT ? 'perfect' : mg.t <= goodT ? 'good' : 'bad'; }

  // --- Krank: dönen çarka bıçak fırlat, yeşil hedef alttayken dokun ---
  mgInit_crank(mg) {
    mg.R = Math.min(mg.ph * 0.21, mg.pw * 0.22);
    mg.wx = mg.cx; mg.wy = mg.ph * 0.43;
    mg.dir = Math.random() < 0.5 ? 1 : -1;
    mg.zoneRel = Phaser.Math.FloatBetween(0, Math.PI * 2);    // hedefin çark üzerindeki yeri
    mg.wa = Math.PI / 2 - mg.zoneRel + Math.PI;               // hedef üstten başlar
    mg.base = Math.PI * 2 / 1.4; mg.phase = Phaser.Math.FloatBetween(0, 6);
    mg.thrown = false; mg.kt = 0; mg.hit = false;
    mg.kStart = mg.wy + mg.R * 1.75;                           // bıçak ucu başlangıçta
    mg.hint = this.add.text(16 * D, mg.ph - 18 * D, 'Yeşil alta gelince fırlat', { fontFamily: FONT, fontSize: Math.round(13 * D) + 'px', color: C.dim }).setOrigin(0, 0.5);
    mg.panel.add(mg.hint);
  }
  drawKnife(g, tx, ty, a, R) {
    // a: uçtan sapa doğru yön
    const c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
    const Lb = R * 0.62, Lh = R * 0.42, w = R * 0.13;
    const bx = tx + c * Lb, by = ty + s * Lb;
    g.fillStyle(0xdfe6f5, 1).fillTriangle(tx, ty, bx + px * w, by + py * w, bx - px * w, by - py * w);
    g.fillStyle(0x9aa6c2, 1).fillTriangle(tx, ty, bx, by, bx - px * w, by - py * w);
    g.lineStyle(w * 1.1, C.brass, 1).lineBetween(bx + px * w * 1.6, by + py * w * 1.6, bx - px * w * 1.6, by - py * w * 1.6);
    g.lineStyle(w * 1.3, C.copperDark, 1).lineBetween(bx, by, bx + c * Lh, by + s * Lh);
    g.fillStyle(C.copper, 1).fillCircle(bx + c * Lh, by + s * Lh, w * 0.8);
  }
  mgStep_crank(mg, dt) {
    if (!mg.hit) mg.wa += mg.dir * mg.base * (1 + 0.45 * Math.sin(mg.t * 3.2 + mg.phase)) * dt;
    const g = mg.gfx, R = mg.R, x = mg.wx, y = mg.wy;
    g.clear();
    // çark
    g.fillStyle(C.brassDark, 1).fillCircle(x, y + 4 * D, R);
    g.fillStyle(C.brass, 1).fillCircle(x, y, R);
    g.fillStyle(0x10162a, 1).fillCircle(x, y, R * 0.8);
    for (let k = 0; k < 6; k++) { const a = mg.wa + k * Math.PI / 3; g.lineStyle(R * 0.08, C.copperDark, 1).lineBetween(x, y, x + Math.cos(a) * R * 0.78, y + Math.sin(a) * R * 0.78); }
    g.fillStyle(C.copper, 1).fillCircle(x, y, R * 0.18);
    // hedef (geniş koyu yeşil: iyi, dar açık yeşil: mükemmel)
    const z = mg.wa + mg.zoneRel;
    const arc = (half, col) => { g.lineStyle(R * 0.2, col, 1); g.beginPath(); g.arc(x, y, R * 0.9, z - half, z + half, false); g.strokePath(); };
    arc(0.42, 0x2e8a52); arc(0.16 * PW(), 0x7fe3a5);
    // alttaki nişan işareti
    g.fillStyle(0xffffff, 0.5).fillTriangle(x - 7 * D, y + R + 8 * D, x + 7 * D, y + R + 8 * D, x, y + R + 1 * D);
    // bıçak
    if (mg.hit) {
      const a = mg.wa + mg.knRel, tx = x + Math.cos(a) * R * 0.82, ty = y + Math.sin(a) * R * 0.82;
      this.drawKnife(g, tx, ty, a, R);
    } else {
      if (mg.thrown) mg.kt = Math.min(1, mg.kt + dt / 0.09);
      const ty = Phaser.Math.Linear(mg.kStart, y + R * 0.82, mg.kt);
      this.drawKnife(g, x, ty, Math.PI / 2, R);
      if (mg.kt >= 1) {
        mg.hit = true; mg.knRel = Math.PI / 2 - mg.wa;
        const d = Math.abs(Phaser.Math.Angle.Wrap(Math.PI / 2 - z));
        const gr = d < 0.16 * PW() ? 'perfect' : d < 0.42 ? 'good' : 'bad';
        beep(gr === 'bad' ? 160 : 520, 0.07, 'square', 0.18); buzz(20);
        this.cameras.main.shake(70, 0.004);
        this.time.delayedCall(220, () => { if (this.mg === mg) this.closeMinigame(gr); });
      }
    }
  }
  mgDown_crank(mg) {
    if (mg.thrown) return;
    mg.thrown = true; beep(1200, 0.04, 'triangle', 0.1);
  }

  // --- Pres: ritim çubuğu ---
  mgInit_press(mg) {
    mg.bw = mg.pw * 0.8; mg.bx = (mg.pw - mg.bw) / 2; mg.bh = Math.min(44 * D, mg.ph * 0.2);
    mg.zone = Phaser.Math.FloatBetween(0.28, 0.72);
    mg.speed = 1 / 1.1; mg.pos = 0;
    mg.hint = this.add.text(mg.cx, mg.ph - 18 * D, 'İbre yeşil bölgedeyken dokun', { fontFamily: FONT, fontSize: Math.round(14 * D) + 'px', color: C.dim }).setOrigin(0.5);
    mg.panel.add(mg.hint);
  }
  mgStep_press(mg) {
    mg.pos = (Math.sin(mg.t * Math.PI * 2 * mg.speed - Math.PI / 2) + 1) / 2;
    const g = mg.gfx, y = mg.cy - mg.bh / 2;
    g.clear();
    g.fillStyle(0x0b0f1c, 1).fillRoundedRect(mg.bx, y, mg.bw, mg.bh, mg.bh * 0.3);
    g.fillStyle(0x2e8a52, 1).fillRect(mg.bx + mg.bw * (mg.zone - 0.12), y + 4 * D, mg.bw * 0.24, mg.bh - 8 * D);
    g.fillStyle(0x7fe3a5, 1).fillRect(mg.bx + mg.bw * (mg.zone - 0.045 * PW()), y + 4 * D, mg.bw * 0.09 * PW(), mg.bh - 8 * D);
    const nx = mg.bx + mg.bw * mg.pos;
    g.fillStyle(0xffd84a, 1).fillTriangle(nx - 10 * D, y - 14 * D, nx + 10 * D, y - 14 * D, nx, y + 2 * D);
    g.fillStyle(0xffffff, 1).fillRect(nx - 2 * D, y, 4 * D, mg.bh);
  }
  mgDown_press(mg) {
    const d = Math.abs(mg.pos - mg.zone);
    this.closeMinigame(d < 0.045 * PW() ? 'perfect' : d < 0.12 ? 'good' : 'bad');
  }

  // --- Basıcı: elmas düşerken kayan kalıbı tam altında durdur (tek dokunuş) ---
  mgInit_mint(mg) {
    mg.floor = mg.ph * 0.7; mg.dy0 = 50 * D;
    mg.fx = mg.cx + Phaser.Math.FloatBetween(-0.22, 0.22) * mg.pw;   // elmasın düştüğü yer
    mg.mw = Math.min(100 * D, mg.pw * 0.28);
    mg.A = mg.pw * 0.28; mg.om = Math.PI * 2 / 1.4; mg.ph0 = Phaser.Math.FloatBetween(0, 6);
    mg.T = 1.2; mg.gv = 2 * (mg.floor - mg.dy0) / (mg.T * mg.T);
    mg.locked = false; mg.landed = false; mg.mx = mg.cx;
    mg.hint = this.add.text(16 * D, mg.ph - 18 * D, 'Kalıp elmasın altına gelince dokun', { fontFamily: FONT, fontSize: Math.round(13 * D) + 'px', color: C.dim }).setOrigin(0, 0.5);
    mg.panel.add(mg.hint);
  }
  drawGem(g, x, y, r, a = 1) {
    g.fillStyle(0x1f8a93, a).fillTriangle(x - r, y - r * 0.25, x + r, y - r * 0.25, x, y + r);
    g.fillStyle(0x8ff0f5, a).fillTriangle(x - r, y - r * 0.25, x, y - r * 0.25, x, y + r);
    g.fillStyle(0xc9fbff, a).fillTriangle(x - r * 0.55, y - r * 0.7, x + r * 0.55, y - r * 0.7, x, y - r * 0.25);
    g.fillStyle(0x4fd6e0, a).fillTriangle(x - r, y - r * 0.25, x - r * 0.55, y - r * 0.7, x, y - r * 0.25).fillTriangle(x + r, y - r * 0.25, x + r * 0.55, y - r * 0.7, x, y - r * 0.25);
  }
  mgStep_mint(mg) {
    if (!mg.locked) mg.mx = mg.cx + Math.sin(mg.t * mg.om + mg.ph0) * mg.A;
    const t = Math.min(mg.t, mg.T);
    const gy = mg.dy0 + 0.5 * mg.gv * t * t;
    const g = mg.gfx, r = 14 * D, my = mg.floor + r * 0.4;
    g.clear();
    // ray
    g.fillStyle(0x0b0f1c, 1).fillRoundedRect(mg.cx - mg.A - mg.mw / 2, my + r * 0.9, mg.A * 2 + mg.mw, 8 * D, 4 * D);
    // düşüş çizgisi
    g.fillStyle(0xffffff, 0.08).fillRect(mg.fx - 1 * D, mg.dy0, 2 * D, mg.floor - mg.dy0);
    // kalıp
    const x0 = mg.mx - mg.mw / 2;
    g.fillStyle(C.copperDark, 1).fillRoundedRect(x0, my - r * 0.9 + 3 * D, mg.mw, r * 1.8, 8 * D);
    g.fillStyle(mg.locked ? C.copperHi : C.copper, 1).fillRoundedRect(x0, my - r * 0.9, mg.mw, r * 1.8, 8 * D);
    g.fillStyle(0x10162a, 1).fillRoundedRect(mg.mx - mg.mw * 0.3, my - r * 0.6, mg.mw * 0.6, r * 1.1, 5 * D);
    g.fillStyle(0x2e8a52, 1).fillRect(mg.mx - mg.mw * 0.28, my - r * 0.75, mg.mw * 0.56, 4 * D);
    g.fillStyle(0x7fe3a5, 1).fillRect(mg.mx - mg.mw * 0.09 * PW(), my - r * 0.75, mg.mw * 0.18 * PW(), 4 * D);
    // elmas
    if (!mg.landed) {
      this.drawGem(g, mg.fx, gy, r);
      if (mg.t >= mg.T) {
        mg.landed = true;
        const d = mg.locked ? Math.abs(mg.fx - mg.mx) / (mg.mw / 2) : 9;
        const gr = d < 0.3 * PW() ? 'perfect' : d < 0.8 ? 'good' : 'bad';
        beep(gr === 'bad' ? 150 : 700, 0.08, gr === 'bad' ? 'sawtooth' : 'triangle', 0.18); buzz(20);
        mg.result = gr;
        this.time.delayedCall(220, () => { if (this.mg === mg) this.closeMinigame(gr); });
      }
    } else if (mg.result !== 'bad') this.drawGem(g, mg.fx, mg.floor, r);
    else { this.drawGem(g, mg.fx - r * 0.6, mg.floor + r * 0.3, r * 0.45, 0.7); this.drawGem(g, mg.fx + r * 0.7, mg.floor + r * 0.4, r * 0.4, 0.7); }
  }
  mgDown_mint(mg) {
    if (mg.locked || mg.landed) return;
    mg.locked = true; beep(420, 0.05, 'square', 0.15);
  }

  // --- Fan: 5 hızlı dokunuş ---
  mgInit_fan(mg) {
    mg.taps = 0; mg.need = 5; mg.spin = 0; mg.rot = 0;
    mg.hint = this.add.text(mg.cx, mg.ph - 18 * D, 'Hızlıca 5 kez dokun', { fontFamily: FONT, fontSize: Math.round(14 * D) + 'px', color: C.dim }).setOrigin(0.5);
    mg.panel.add(mg.hint);
  }
  mgStep_fan(mg, dt) {
    mg.spin = Math.max(0, mg.spin - dt * 6); mg.rot += (1 + mg.spin * 3) * dt * 4;
    const g = mg.gfx, R = Math.min(mg.ph * 0.3, mg.pw * 0.25);
    g.clear();
    g.fillStyle(C.brassDark, 1).fillCircle(mg.cx, mg.cy + 3 * D, R);
    g.fillStyle(C.brass, 1).fillCircle(mg.cx, mg.cy, R);
    g.fillStyle(0x10162a, 1).fillCircle(mg.cx, mg.cy, R * 0.86);
    for (let k = 0; k < 4; k++) {
      const a = mg.rot + k * Math.PI / 2;
      g.fillStyle(0x8fb4ff, 1).fillTriangle(mg.cx, mg.cy, mg.cx + Math.cos(a - 0.35) * R * 0.78, mg.cy + Math.sin(a - 0.35) * R * 0.78, mg.cx + Math.cos(a + 0.45) * R * 0.78, mg.cy + Math.sin(a + 0.45) * R * 0.78);
    }
    g.fillStyle(C.brass, 1).fillCircle(mg.cx, mg.cy, R * 0.16);
    // dokunuş noktaları
    for (let k = 0; k < mg.need; k++) {
      const x = mg.cx + (k - (mg.need - 1) / 2) * 22 * D, y = mg.cy + R + 18 * D;
      g.fillStyle(k < mg.taps ? 0x8fb4ff : 0x2a3456, 1).fillCircle(x, y, 7 * D);
    }
  }
  mgDown_fan(mg) {
    mg.taps++; mg.spin = 1; beep(500 + mg.taps * 90, 0.05, 'square', 0.12); buzz(8);
    if (mg.taps >= mg.need) this.closeMinigame(this.grade(mg, 1.1 * PW(), 1.9));
  }

  flowEnergy(from, to) {
    // Krank'tan bu makineye uçan ⚡
    const f = this.cellCenter(from), tc = this.cellCenter(to);
    const bolt = this.add.text(f.x, f.y, '⚡', { fontFamily: FONT, fontSize: Math.round(this.cell * 0.24) + 'px', color: '#4fd6e0', stroke: '#0b0f1c', strokeThickness: 3 * D }).setOrigin(0.5).setDepth(55);
    this.tweens.add({ targets: bolt, x: tc.x, y: tc.y, duration: 320, ease: 'Sine.easeIn', onComplete: () => {
      bolt.destroy();
      this.sparks.explode(4, tc.x, tc.y);
    } });
  }

}
