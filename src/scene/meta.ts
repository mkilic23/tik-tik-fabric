import { beep, buzz, sfx } from '../audio';
import { ENG, UPG } from '../data/progress';
import { RULES } from '../data/rules';
import { BTN_BRASS, BTN_GO, makeButton } from '../draw';
import { META, clearRun, newRun, saveMeta, state } from '../state';
import { C, D, FONT } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class MetaPart {
  [key: string]: any;

  // =====================================================================
  // ATÖLYE: koşular arası kalıcı açılımlar
  // =====================================================================
  awardScrap(rounds, won) {
    const r0 = state.startRound || 0;   // ortadan başlanan koşuda sadece oynanan turlar sayılır
    const s = (rounds - r0) * 2 + (Math.floor(rounds / RULES.roundsPer) - Math.floor(r0 / RULES.roundsPer)) * 5 + (won ? 10 : 0);
    META.scrap += s; META.runs += 1; saveMeta(); clearRun();
    return s;
  }
  openMeta() {
    if (this.meta) this.meta.destroy();
    const W = this.W, H = this.H, pad = this.pad;
    const k = this.add.container(0, 0).setDepth(125);
    const dim = this.add.rectangle(0, 0, W, H, 0x05070d, 0.92).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    const fsT = Math.round(Math.min(W * 0.065, 27 * D)), fs = Math.round(Math.min(W * 0.036, 15 * D)), fsS = Math.round(fs * 0.85);
    let y = Math.max(24 * D, H * 0.04);
    const title = this.add.text(W / 2, y, 'Nuri Usta\'nın Atölyesi', { fontFamily: FONT, fontSize: fsT + 'px', fontStyle: '700', color: '#f0a76a' }).setOrigin(0.5, 0);
    y += fsT * 1.35;
    const scrap = this.add.text(W / 2, y, `🔩 ${META.scrap} hurda`, { fontFamily: FONT, fontSize: Math.round(fsT * 0.75) + 'px', fontStyle: '700', color: '#c9d2ee' }).setOrigin(0.5, 0);
    y += fsT * 1.3;
    const sub = this.add.text(W / 2, y, 'Hurdayla kalıcı yükseltmeler al. Her koşuda geçerli olur.', { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5, 0);
    y += sub.height + 16 * D;
    k.add([dim, g, title, scrap, sub]);
    // mühendisler
    const h1 = this.add.text(pad, y, 'Mühendis', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffe3a8' });
    k.add(h1); y += h1.height + 8 * D;
    const keys = Object.keys(ENG), gap = 8 * D, cw = (W - pad * 2 - gap * 2) / 3, ch = Math.min(cw * 1.15, H * 0.185);
    keys.forEach((key, n) => {
      const e = ENG[key], x = pad + n * (cw + gap), owned = !!META.eng[key], sel = META.pick === key;
      g.fillStyle(sel ? 0x2c3654 : 0x1b2238, 1).fillRoundedRect(x, y, cw, ch, 14 * D);
      g.lineStyle(sel ? 3 * D : 1.5 * D, sel ? e.color : 0x2c3654, 1).strokeRoundedRect(x, y, cw, ch, 14 * D);
      const nm = this.add.text(x + cw / 2, y + 10 * D, e.name, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: C.cream, align: 'center', wordWrap: { width: cw - 10 * D } }).setOrigin(0.5, 0);
      const ds = this.add.text(x + cw / 2, nm.y + nm.height + 4 * D, e.desc, { fontFamily: FONT, fontSize: Math.round(fsS * 0.92) + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: cw - 12 * D } }).setOrigin(0.5, 0);
      k.add([nm, ds]);
      const bh = Math.min(32 * D, ch * 0.2), by = y + ch - bh * 0.75;
      if (sel) k.add(this.add.text(x + cw / 2, by, 'Seçili ✓', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5));
      else {
        const can = owned || META.scrap >= e.cost;
        k.add(makeButton(this, x + cw / 2, by, cw - 14 * D, bh, owned ? 'Seç' : `${e.cost} 🔩 Aç`, can ? (owned ? BTN_BRASS : BTN_GO) : { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' }, () => this.metaEng(key)));
      }
    });
    y += ch + 14 * D;
    // yükseltmeler
    const h2 = this.add.text(pad, y, 'Yükseltmeler', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffe3a8' });
    k.add(h2); y += h2.height + 8 * D;
    const rh = Math.min(54 * D, H * 0.066);
    Object.keys(UPG).forEach(key => {
      const u = UPG[key], lv = META.lv[key], max = u.cost.length, full = lv >= max;
      g.fillStyle(0x1b2238, 1).fillRoundedRect(pad, y, W - pad * 2, rh, 12 * D);
      const nm = this.add.text(pad + 12 * D, y + rh * 0.3, u.name + '  ' + '●'.repeat(lv) + '○'.repeat(max - lv), { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: C.cream }).setOrigin(0, 0.5);
      const ds = this.add.text(pad + 12 * D, y + rh * 0.7, u.desc, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: C.dim }).setOrigin(0, 0.5);
      k.add([nm, ds]);
      const bw = Math.min(96 * D, W * 0.24), bx = W - pad - 10 * D - bw / 2;
      if (full) k.add(this.add.text(bx, y + rh / 2, 'Tam ✓', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5));
      else {
        const c = u.cost[lv], can = META.scrap >= c;
        k.add(makeButton(this, bx, y + rh / 2, bw, rh * 0.6, `${c} 🔩`, can ? BTN_GO : { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' }, () => this.metaBuy(key)));
      }
      y += rh + 6 * D;
    });
    // başlangıç bölümü
    y += 6 * D;
    const h3 = this.add.text(pad, y, 'Başlangıç bölümü', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffe3a8' });
    k.add(h3); y += h3.height + 8 * D;
    const nC = RULES.chapters.length, cbw = (W - pad * 2 - gap * (nC - 1)) / nC, cbh = Math.min(40 * D, H * 0.052);
    for (let c = 0; c < nC; c++) {
      const x = pad + c * (cbw + gap) + cbw / 2, open = c <= (META.maxCh || 0), sel = c === Math.min(META.startCh || 0, META.maxCh || 0);
      const label = open ? (sel ? `✓ Bölüm ${c + 1}` : `Bölüm ${c + 1}`) : `🔒 Bölüm ${c + 1}`;
      const st = !open ? { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' } : sel ? BTN_GO : BTN_BRASS;
      k.add(makeButton(this, x, y + cbh / 2, cbw, cbh, label, st, () => this.metaStart(c)));
    }
    y += cbh + 6 * D;
    const note = this.add.text(W / 2, y, (META.maxCh || 0) > 0 ? 'Ulaştığın bölümden başlayabilirsin. Hurda sadece oynadığın turlardan gelir.' : 'Bir bölüme ulaşınca oradan başlayabilirsin.', { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5, 0);
    k.add(note); y += note.height + 10 * D;
    const go = makeButton(this, W / 2, Math.min(y + 28 * D, H - 40 * D), Math.min(W * 0.7, 300 * D), Math.min(56 * D, H * 0.07), '▶  Yeni koşu', BTN_GO, () => this.closeMeta());
    k.add(go);
    this.meta = k;
    this.banner.setVisible(false);
  }
  metaEng(key) {
    const e = ENG[key];
    if (!META.eng[key]) {
      if (META.scrap < e.cost) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
      META.scrap -= e.cost; META.eng[key] = true;
      [523, 784].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle', 0.15), i * 80));
    } else sfx.tap();
    META.pick = key; saveMeta(); this.openMeta();
  }
  metaBuy(key) {
    const u = UPG[key], lv = META.lv[key];
    if (lv >= u.cost.length) return;
    if (META.scrap < u.cost[lv]) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    META.scrap -= u.cost[lv]; META.lv[key] = lv + 1; saveMeta();
    [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle', 0.15), i * 70)); buzz(20);
    this.openMeta();
  }
  metaStart(c) {
    if (c > (META.maxCh || 0)) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    META.startCh = c; saveMeta(); sfx.tap(); this.openMeta();
  }
  closeMeta() {
    if (this.meta) { this.meta.destroy(); this.meta = null; }
    newRun();                 // yükseltmeler yeni koşuya yansısın
    state.showMeta = false;
    sfx.pick();
    this.scene.restart();
  }

}
