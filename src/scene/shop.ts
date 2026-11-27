import Phaser from 'phaser';
import { beep, buzz, sfx } from '../audio';
import { RES, RULES, SHOP } from '../data/rules';
import { BTN_BRASS, BTN_GO, makeButton, rivet } from '../draw';
import { META, saveRun, state } from '../state';
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
  openShop() {
    if (this.shop) this.shop.destroy();
    if (!state.offers) this.rollOffers();
    const W = this.W, H = this.H, pad = this.pad;
    const k = this.add.container(0, 0).setDepth(120);
    const dim = this.add.rectangle(0, 0, W, H, 0x05070d, 0.7).setOrigin(0).setInteractive();
    const cw = W - pad * 2, gap = 10 * D;
    const nc = state.offers.length, cardW = (cw - gap * (nc - 1)) / nc, cardH = Math.min(cardW * 1.95, H * 0.4);
    const top = Math.max(this.topH * 0.5, H * 0.5 - cardH / 2 - 90 * D);
    const g = this.add.graphics();
    const fsT = Math.round(Math.min(W * 0.06, 25 * D)), fs = Math.round(Math.min(W * 0.034, 14 * D));
    const title = this.add.text(W / 2, top, 'Nuri Usta\'nın Dükkanı', { fontFamily: FONT, fontSize: fsT + 'px', fontStyle: '700', color: '#f0a76a' }).setOrigin(0.5, 0);
    const money = this.add.text(W / 2, top + fsT * 1.35, `Paran: 💎 ${state.res.money}`, { fontFamily: FONT, fontSize: Math.round(fsT * 0.7) + 'px', fontStyle: '700', color: RES.money.color }).setOrigin(0.5, 0);
    k.add([dim, g, title, money]);
    const cy0 = top + fsT * 2.6;
    state.offers.forEach((o, n) => {
      const it = SHOP[o.key], x = pad + n * (cardW + gap);
      g.fillStyle(0x000000, 0.35).fillRoundedRect(x, cy0 + 5 * D, cardW, cardH, 16 * D);
      g.fillStyle(o.sold ? 0x161c2e : 0x232c4a, 1).fillRoundedRect(x, cy0, cardW, cardH, 16 * D);
      g.lineStyle(2 * D, o.sold ? 0x2c3654 : it.color, 1).strokeRoundedRect(x, cy0, cardW, cardH, 16 * D);
      const ig = this.add.graphics().setAlpha(o.sold ? 0.3 : 1);
      this.drawShopIcon(ig, o.key, x + cardW / 2, cy0 + cardH * 0.2, cardW * 0.22);
      const name = this.add.text(x + cardW / 2, cy0 + cardH * 0.37, it.name, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: C.cream, align: 'center', wordWrap: { width: cardW - 12 * D } }).setOrigin(0.5, 0).setAlpha(o.sold ? 0.4 : 1);
      const desc = this.add.text(x + cardW / 2, name.y + name.height + 4 * D, it.desc, { fontFamily: FONT, fontSize: Math.round(fs * 0.86) + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: cardW - 14 * D }, lineSpacing: 1 * D }).setOrigin(0.5, 0).setAlpha(o.sold ? 0.4 : 1);
      k.add([ig, name, desc]);
      const bh = Math.min(38 * D, cardH * 0.15);
      if (o.sold) {
        k.add(this.add.text(x + cardW / 2, cy0 + cardH - bh * 0.8, 'Alındı ✓', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5));
      } else {
        const can = state.res.money >= this.price(o.key);
        const b = makeButton(this, x + cardW / 2, cy0 + cardH - bh * 0.8, cardW - 16 * D, bh, `${this.price(o.key)} 💎`, can ? BTN_GO : { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' }, () => this.buy(n));
        k.add(b);
      }
    });
    const by = cy0 + cardH + 34 * D, bw = (cw - gap) / 2, bh = Math.min(48 * D, H * 0.065);
    const rc = RULES.rerollCost + (state.rerolls || 0);
    const rb = makeButton(this, pad + bw / 2, by, bw, bh, `↻ Yenile ${rc}💎`, { base: 0x8fb4ff, dark: 0x3e62b0, text: '#0d1a33' }, () => this.reroll());
    rb.setAlpha(state.res.money >= rc ? 1 : 0.5);
    const cb = makeButton(this, W - pad - bw / 2, by, bw, bh, 'Devam  ▶', BTN_BRASS, () => this.closeShop());
    const inv = this.add.text(W / 2, by + bh * 0.9, 'Modülü aldıktan sonra takacağın makineye dokun.', { fontFamily: FONT, fontSize: Math.round(fs * 0.9) + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: cw } }).setOrigin(0.5, 0);
    k.add([rb, cb, inv]);
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
