import Phaser from 'phaser';
import { beep, buzz, sfx } from '../audio';
import { RES, RULES, SHOP } from '../data/rules';
import { BTN_BRASS, BTN_GO, makeButton, rivet } from '../draw';
import { META, saveRun, state } from '../state';
import { LEVELS, goalText } from '../data/levels';
import { C, COLS, D, FONT } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class ShopPart {
  [key: string]: any;

  // =====================================================================
  // DÜKKAN VE MODÜLLER
  // =====================================================================
  hasRingNear(i) {
    for (let d = 0; d < 4; d++) { const j = this.nb(i, d); if (j >= 0 && state.grid[j] && state.mod[j] === 'ring') return true; }
    return false;
  }
  price(key) { return state.eng === 'tuccar' ? Math.ceil(SHOP[key].cost * 0.8) : SHOP[key].cost; }
  rollOffers() {
    const keys = Object.keys(SHOP);
    const n = Math.min(4, 3 + META.lv.offer + (state.eng === 'tuccar' ? 1 : 0));
    state.offers = Array.from({ length: n }, (_, i) => i).map(() => ({ key: Phaser.Utils.Array.GetRandom(keys), sold: false }));
    // en az bir modül olsun
    if (!state.offers.some(o => SHOP[o.key].mod)) state.offers[0].key = Math.random() < 0.5 ? 'ring' : 'plate';
  }
  drawShopIcon(g, key, x, y, r) {
    if (key === 'ring') {
      g.lineStyle(r * 0.34, C.brassDark, 1).strokeCircle(x, y + r * 0.08, r * 0.62);
      g.lineStyle(r * 0.3, C.brass, 1).strokeCircle(x, y, r * 0.62);
      g.lineStyle(r * 0.1, C.brassHi, 1).beginPath().arc(x, y, r * 0.66, Math.PI * 1.1, Math.PI * 1.6).strokePath();
      [0, 1, 2, 3].forEach(k => { const a = k * Math.PI / 2 + Math.PI / 4; rivet(g, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.09); });
    } else if (key === 'plate') {
      g.fillStyle(0x4a5878, 1).fillRoundedRect(x - r * 0.75, y - r * 0.5 + r * 0.1, r * 1.5, r * 1.0, r * 0.2);
      g.fillStyle(0x9fb0c8, 1).fillRoundedRect(x - r * 0.75, y - r * 0.5, r * 1.5, r * 1.0, r * 0.2);
      g.fillStyle(0xc9d6e8, 1).fillRect(x - r * 0.55, y - r * 0.12, r * 1.1, r * 0.08).fillRect(x - r * 0.55, y + r * 0.08, r * 1.1, r * 0.08);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => rivet(g, x + a * r * 0.58, y + b * r * 0.33, r * 0.08));
    } else if (key === 'place') {
      g.fillStyle(C.cellLo, 1).fillRoundedRect(x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4, r * 0.25);
      g.lineStyle(r * 0.1, 0x5fd38a, 1).strokeRoundedRect(x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4, r * 0.25);
      g.fillStyle(0x5fd38a, 1).fillRect(x - r * 0.4, y - r * 0.08, r * 0.8, r * 0.16).fillRect(x - r * 0.08, y - r * 0.4, r * 0.16, r * 0.8);
    } else if (key === 'ice') {
      g.fillStyle(0x8fb4ff, 0.25).fillCircle(x, y, r * 0.8);
      g.lineStyle(r * 0.14, 0xdfe9ff, 1);
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.lineBetween(x - Math.cos(a) * r * 0.65, y - Math.sin(a) * r * 0.65, x + Math.cos(a) * r * 0.65, y + Math.sin(a) * r * 0.65); }
      g.fillStyle(0xffffff, 1).fillCircle(x, y, r * 0.14);
    }
  }
  // dükkan: levellar arasında açılan tam ekran sayfa
  openShop() {
    if (this.shop) this.shop.destroy();
    if (!state.offers) this.rollOffers();
    const W = this.W, H = this.H, pad = this.pad;
    const k = this.add.container(0, 0).setDepth(120);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a2238, 0x2a2238, 0x121829, 0x121829, 1).fillRect(0, 0, W, H);
    // raf çizgileri (dükkan havası)
    bg.lineStyle(2 * D, 0x3a2f4a, 1);
    for (let yy = H * 0.3; yy < H; yy += 64 * D) bg.lineBetween(0, yy, W, yy);
    const blocker = this.add.rectangle(0, 0, W, H, 0, 0).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    k.add([bg, blocker, g]);
    const fsT = Math.round(Math.min(W * 0.068, 28 * D)), fs = Math.round(Math.min(W * 0.04, 16 * D)), fsS = Math.round(fs * 0.86);
    let y = Math.max(22 * D, H * 0.035);
    // Nuri Usta ve başlık
    const os = Math.min(W * 0.18, 76 * D);
    const og = this.add.graphics();
    this.drawOwner(og, pad + os * 0.5, y + os * 0.5, os * 0.8);
    k.add(og);
    const tx = pad + os * 1.15;
    k.add(this.add.text(tx, y + os * 0.1, 'Nuri Usta\'nın Dükkanı', { fontFamily: FONT, fontSize: fsT + 'px', fontStyle: '700', color: '#f0a76a' }));
    const next = state.round + 1;
    k.add(this.add.text(tx, y + os * 0.1 + fsT * 1.3, `Level ${next} öncesi alışveriş · Hedef ${goalText(LEVELS[state.round])}`, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: C.dim, wordWrap: { width: W - tx - pad } }));
    y += os * 1.6;
    // para ve haklar
    const chipH = Math.max(34 * D, fs * 2.1);
    g.fillStyle(0x0b0f1c, 0.6).fillRoundedRect(pad, y, W - pad * 2, chipH, chipH / 2);
    k.add(this.add.text(pad + 16 * D, y + chipH / 2, `💎 ${state.res.money}`, { fontFamily: FONT, fontSize: Math.round(fs * 1.15) + 'px', fontStyle: '700', color: '#7fd47a' }).setOrigin(0, 0.5));
    k.add(this.add.text(W - pad - 16 * D, y + chipH / 2, `Yerleştirme hakkı: ${state.places}`, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '700', color: '#c9d2ee' }).setOrigin(1, 0.5));
    y += chipH + 14 * D;
    // teklifler: alt alta geniş kartlar
    const n = state.offers.length, bottomH = Math.min(130 * D, H * 0.19);
    const gap = 10 * D, cardH = Math.min(118 * D, (H - y - bottomH - gap * (n - 1)) / n), cw = W - pad * 2;
    state.offers.forEach((o, i) => {
      const it = SHOP[o.key], cy = y + i * (cardH + gap);
      g.fillStyle(0x000000, 0.35).fillRoundedRect(pad, cy + 4 * D, cw, cardH, 16 * D);
      g.fillStyle(o.sold ? 0x161c2e : 0x232c4a, 1).fillRoundedRect(pad, cy, cw, cardH, 16 * D);
      g.lineStyle(2 * D, o.sold ? 0x2c3654 : it.color, 1).strokeRoundedRect(pad, cy, cw, cardH, 16 * D);
      const ir = Math.min(cardH * 0.3, 30 * D);
      const ig = this.add.graphics().setAlpha(o.sold ? 0.3 : 1);
      this.drawShopIcon(ig, o.key, pad + 14 * D + ir, cy + cardH / 2, ir);
      const bw = Math.min(100 * D, cw * 0.27), bx = pad + cw - 12 * D - bw / 2;
      const txL = pad + 28 * D + ir * 2, txW = bx - bw / 2 - 10 * D - txL;
      const name = this.add.text(txL, cy + cardH * 0.18, it.name, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: o.sold ? '#6c7594' : C.cream, wordWrap: { width: txW } });
      const desc = this.add.text(txL, name.y + name.height + 3 * D, it.desc, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: C.dim, wordWrap: { width: txW } });
      k.add([ig, name, desc]);
      const bh = Math.min(42 * D, cardH * 0.5);
      if (o.sold) k.add(this.add.text(bx, cy + cardH / 2, 'Alındı ✓', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5));
      else {
        const can = state.res.money >= this.price(o.key);
        k.add(makeButton(this, bx, cy + cardH / 2, bw, bh, `${this.price(o.key)} 💎`, can ? BTN_GO : { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' }, () => this.buy(i)));
      }
    });
    // alt: yenile ve fabrikaya dön
    const by = H - bottomH + 16 * D, bw2 = (W - pad * 2 - gap) / 2, bh2 = Math.min(52 * D, bottomH * 0.4);
    const rc = RULES.rerollCost + (state.rerolls || 0);
    const rb = makeButton(this, pad + bw2 / 2, by + bh2 / 2, bw2, bh2, `↻ Yenile ${rc}💎`, { base: 0x8fb4ff, dark: 0x3e62b0, text: '#0d1a33' }, () => this.reroll());
    rb.setAlpha(state.res.money >= rc ? 1 : 0.5);
    const cb = makeButton(this, W - pad - bw2 / 2, by + bh2 / 2, bw2, bh2, 'Fabrikaya  ▶', BTN_BRASS, () => this.closeShop());
    const inv = this.add.text(W / 2, by + bh2 + 10 * D, 'Modül alınca fabrikaya geçersin: takacağın makineye dokun.', { fontFamily: FONT, fontSize: Math.round(fsS * 0.92) + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5, 0);
    k.add([rb, cb, inv]);
    k.setAlpha(0); this.tweens.add({ targets: k, alpha: 1, duration: 160 });
    this.shop = k;
    this.banner.setVisible(false);
  }
  closeShop() {
    if (this.shop) { this.shop.destroy(); this.shop = null; }
    state.shopOpen = false;
    sfx.pick();
    this.refreshPhase();
  }
  reroll() {
    const rc = RULES.rerollCost + (state.rerolls || 0);
    if (state.res.money < rc) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    state.res.money -= rc; state.rerolls = (state.rerolls || 0) + 1;
    this.rollOffers(); sfx.tap();
    this.openShop();
  }
  buy(n) {
    const o = state.offers[n], it = SHOP[o.key];
    if (o.sold) return;
    if (state.res.money < this.price(o.key)) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    state.res.money -= this.price(o.key); o.sold = true;
    [660, 880].forEach((f, k) => setTimeout(() => beep(f, 0.08, 'triangle', 0.15), k * 70)); buzz(20);
    if (o.key === 'place') { state.places += 1; this.openShop(); }
    else if (o.key === 'ice') {
      state.heat = state.heat.map(() => 0);
      this.cells.forEach((v, i) => { if (v) { const c = this.cellCenter(i); this.sparks.explode(6, c.x, c.y); } });
      this.openShop();
    } else {
      // modül: dükkanı kapat, makine seçtir
      if (this.shop) { this.shop.destroy(); this.shop = null; }
      this.pickMod = o.key;
      this.setBanner(`${it.name}: bir makineye dokun`, it.desc, it.color);
      this.infoUntil = this.time.now + 1e9;
    }
    this.updateHud(true);
    saveRun();
  }
  attachMod(i) {
    this.time.delayedCall(10, saveRun);
    const key = this.pickMod, it = SHOP[key];
    state.mod[i] = key;
    this.pickMod = null; this.infoUntil = 0;
    const c = this.cellCenter(i);
    this.sparks.explode(18, c.x, c.y); sfx.place();
    const v = this.cells[i];
    this.tweens.add({ targets: v, scale: 1.12, duration: 90, yoyo: true });
    this.flashTip(`${it.name} takıldı`, key === 'ring' ? 'Turuncu karelerdeki komşular daha hızlı çalışır ama daha çok ısınır.' : 'Bu makine artık daha yavaş ısınır.', it.color, 2500);
    this.time.delayedCall(700, () => { if (state.phase === 'build' && state.shopOpen) this.openShop(); });
  }
  drawMods(g) {
    // modül rozetleri (sol üst köşe) ve Halka etki alanı
    const s = this.cell;
    state.grid.forEach((t, i) => {
      const m = t && state.mod[i]; if (!m || !this.cells[i]) return;
      const c = this.cellCenter(i);
      if (m === 'ring' && state.phase === 'build') {
        for (let d = 0; d < 4; d++) {
          const j = this.nb(i, d); if (j < 0) continue;
          const x = this.gx + (j % COLS) * s, y = this.gy + Math.floor(j / COLS) * s, gap = Math.max(2, s * 0.04);
          this.linkG.fillStyle(0xffa040, 0.13).fillRoundedRect(x + gap, y + gap, s - gap * 2, s - gap * 2, s * 0.14);
        }
      }
      g.fillStyle(0x0b0f1c, 0.92).fillCircle(c.x - s * 0.34, c.y - s * 0.34, s * 0.16);
      this.drawShopIcon(g, m, c.x - s * 0.34, c.y - s * 0.34, s * 0.125);
    });
  }

}
