import { sfx } from '../audio';
import { BOSS, RULES } from '../data/rules';
import { BTN_BRASS, BTN_GO, makeButton } from '../draw';
import { META, clearRun, newRun, saveRun, state } from '../state';
import { C, D, FONT } from '../theme';

const BTN_OFF = { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' };
const CHAPTER_NAMES = ['Bölüm 1 · Atölye', 'Bölüm 2 · Şehir Siparişi', 'Bölüm 3 · Fenerler Festivali'];

// Build sahnesinin bir parçası: level haritası (oyunun ana ekranı)
export class MapPart {
  [key: string]: any;

  openMap() {
    if (this.map) this.map.destroy();
    if (this.shop) { this.shop.destroy(); this.shop = null; }
    if (this.meta) { this.meta.destroy(); this.meta = null; }
    state.screen = 'map';
    const W = this.W, H = this.H, pad = this.pad;
    const k = this.add.container(0, 0).setDepth(125);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1f2a47, 0x1f2a47, 0x121829, 0x121829, 1).fillRect(0, 0, W, H);
    const blocker = this.add.rectangle(0, 0, W, H, 0, 0).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    k.add([bg, blocker, g]);
    const fsT = Math.round(Math.min(W * 0.075, 30 * D)), fs = Math.round(Math.min(W * 0.038, 16 * D)), fsS = Math.round(fs * 0.85);
    let y = Math.max(22 * D, H * 0.035);
    k.add(this.add.text(W / 2, y + 2 * D, 'TIK TIK FABRIC', { fontFamily: FONT, fontSize: fsT + 'px', fontStyle: '700', color: '#6e3518' }).setOrigin(0.5, 0));
    k.add(this.add.text(W / 2, y, 'TIK TIK FABRIC', { fontFamily: FONT, fontSize: fsT + 'px', fontStyle: '700', color: '#f0a76a' }).setOrigin(0.5, 0));
    y += fsT * 1.3;
    const total = META.stars.reduce((a, b) => a + (b || 0), 0);
    k.add(this.add.text(W / 2, y, `★ ${total} / ${RULES.goals.length * 3}     🔩 ${META.scrap} hurda`, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#c9d2ee' }).setOrigin(0.5, 0));
    y += fs * 2;

    // bölümler: her satırda 4 level
    const cur = state.round, per = RULES.roundsPer, nCh = Math.ceil(RULES.goals.length / per);
    const bottomH = Math.min(170 * D, H * 0.25);
    const avail = H - y - bottomH;
    const secH = Math.min(avail / nCh, 150 * D);
    const r = Math.min((W - pad * 2) / per * 0.32, secH * 0.26);
    for (let c = 0; c < nCh; c++) {
      const sy = y + c * secH;
      k.add(this.add.text(pad, sy, CHAPTER_NAMES[c] || `Bölüm ${c + 1}`, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '700', color: '#ffe3a8' }));
      const cy = sy + fsS * 1.6 + r * 1.2;
      const xs = Array.from({ length: per }, (_, i) => pad + (W - pad * 2) * (i + 0.5) / per);
      // yol çizgisi
      g.lineStyle(4 * D, 0x2c3654, 1).lineBetween(xs[0], cy, xs[per - 1], cy);
      for (let i = 0; i < per; i++) {
        const n = c * per + i; if (n >= RULES.goals.length) break;
        const x = xs[i], done = (META.stars[n] || 0) > 0 && n < cur, isCur = n === cur, locked = n > cur, boss = !!BOSS[n];
        if (n < cur) g.lineStyle(4 * D, 0x5fd38a, 1).lineBetween(x, cy, i < per - 1 ? xs[i + 1] : x, cy);
        const fill = isCur ? 0xe0b450 : n < cur ? 0x2e8a52 : 0x252d47;
        g.fillStyle(0x000000, 0.35).fillCircle(x, cy + 4 * D, r);
        g.fillStyle(fill, 1).fillCircle(x, cy, r);
        g.lineStyle(3 * D, boss ? 0xe0564a : isCur ? 0xffe3a8 : 0x3a4466, 1).strokeCircle(x, cy, r);
        const label = locked ? '🔒' : String(n + 1);
        k.add(this.add.text(x, cy, label, { fontFamily: FONT, fontSize: Math.round(r * (locked ? 0.7 : 0.9)) + 'px', fontStyle: '700', color: isCur ? '#2a1a05' : '#f6ecdb' }).setOrigin(0.5));
        if (boss) k.add(this.add.text(x + r * 0.75, cy - r * 0.75, '☠', { fontFamily: FONT, fontSize: Math.round(r * 0.5) + 'px', color: '#ff8a7c' }).setOrigin(0.5));
        const st = META.stars[n] || 0;
        if (st || n < cur) k.add(this.add.text(x, cy + r * 1.45, '★'.repeat(st) + '☆'.repeat(3 - st), { fontFamily: FONT, fontSize: Math.round(r * 0.42) + 'px', fontStyle: '700', color: '#ffd84a' }).setOrigin(0.5));
        if (isCur) {
          const ring = this.add.graphics().setPosition(x, cy);
          ring.lineStyle(3 * D, 0xffe3a8, 1).strokeCircle(0, 0, r * 1.25);
          this.tweens.add({ targets: ring, scale: { from: 0.95, to: 1.12 }, alpha: { from: 1, to: 0.2 }, duration: 700, yoyo: true, repeat: -1 });
          k.add(ring);
          const hit = this.add.circle(x, cy, r * 1.2, 0, 0).setInteractive();
          hit.on('pointerup', () => this.closeMap());
          k.add(hit);
        }
      }
    }

    // alt düğmeler
    const by = H - bottomH + 10 * D, bw = Math.min(W - pad * 2, 340 * D), bh = Math.min(56 * D, bottomH * 0.36);
    k.add(makeButton(this, W / 2, by + bh / 2, bw, bh, `▶  Level ${cur + 1}  ·  ✦ ${RULES.goals[cur]}`, BTN_GO, () => this.closeMap()));
    const hw = (bw - 10 * D) / 2, sy2 = by + bh * 1.6;
    k.add(makeButton(this, W / 2 - hw / 2 - 5 * D, sy2, hw, bh * 0.8, '🔧  Atölye', BTN_BRASS, () => { sfx.tap(); this.map.destroy(); this.map = null; state.screen = 'meta'; this.openMeta(); }));
    const reset = makeButton(this, W / 2 + hw / 2 + 5 * D, sy2, hw, bh * 0.8, this.resetAsk ? 'Emin misin?' : '↺  Yeni fabrika', this.resetAsk ? { base: 0xe0564a, dark: 0x8a2a22, text: '#fff2e8' } : BTN_OFF, () => this.mapReset());
    k.add(reset);
    k.add(this.add.text(W / 2, sy2 + bh * 0.65, 'Yeni fabrika: makineler sıfırlanır, 1. levelden başlarsın. Yıldız ve hurda kalır.', { fontFamily: FONT, fontSize: Math.round(fsS * 0.85) + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5, 0));
    this.map = k;
    this.banner.setVisible(false);
  }

  closeMap() {
    if (this.map) { this.map.destroy(); this.map = null; }
    state.screen = null; this.resetAsk = false;
    sfx.pick();
    this.enterLevel();
  }

  mapReset() {
    if (!this.resetAsk) { this.resetAsk = true; sfx.tap(); this.openMap(); this.time.delayedCall(3000, () => { if (this.resetAsk && this.map) { this.resetAsk = false; this.openMap(); } }); return; }
    this.resetAsk = false;
    clearRun(); newRun(); saveRun();
    sfx.pick();
    state.screen = 'map';
    this.scene.restart();
  }
}
