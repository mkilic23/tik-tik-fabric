import Phaser from 'phaser';
import { beep, buzz, sfx } from '../audio';
import { AREAS, LEVELS, PER_AREA } from '../data/levels';
import { ENG, UPG } from '../data/progress';
import { BOSS } from '../data/rules';
import { BTN_BRASS, BTN_GO, drawMachine, makeButton } from '../draw';
import { META, clearRun, newArea, saveMeta, saveRun, state } from '../state';
import { C, D, FONT, THEMES, T } from '../theme';
import { DialogPart } from './dialog';

// Menü sahnesi: alt çubukta 5 sekme. Ortadaki Atölye ana sayfadır.
const TABS = [
  { key: 'shop',  label: 'Dükkan' },
  { key: 'eng',   label: 'Ustalar' },
  { key: 'home',  label: 'Atölye' },
  { key: 'map',   label: 'Harita' },
  { key: 'stats', label: 'Rekorlar' },
];
const PURPLE = { bar: 0x2a1d47, barHi: 0x3d2a66, head: 0x3a2760, tab: 0xe0b450, tabDark: 0x9a7424 };
const BTN_OFF = { base: 0x3a4466, dark: 0x252d47, text: '#8e97b8' };
const BTN_RED = { base: 0xe0564a, dark: 0x8a2a22, text: '#fff2e8' };
const drawOwner = (g, x, y, s) => DialogPart.prototype.drawOwner.call(null, g, x, y, s);

export class Menu extends Phaser.Scene {
  [key: string]: any;
  constructor() { super('menu'); }

  init(data) { this.tab = (data && data.tab) || state.menuTab || 'home'; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H; this.pad = 16 * D;
    this.barH = Math.min(86 * D, H * 0.11);
    this.page = null; this.popup = null; this.drag = null;
    state.menuTab = this.tab;
    this.drawPage();
    this.drawBar();
    this.scale.once('resize', () => this.scene.restart({ tab: this.tab }));
    this.input.on('pointerdown', p => { this.drag = { y0: p.y, s0: this.scrollY || 0, moved: false }; });
    this.input.on('pointermove', p => {
      if (!this.drag || !p.isDown || !this.scrollBox) return;
      const dy = p.y - this.drag.y0;
      if (Math.abs(dy) > 8 * D) this.drag.moved = true;
      if (this.drag.moved) this.setScroll(this.drag.s0 + dy);
    });
    this.input.on('pointerup', () => { this.time.delayedCall(0, () => { this.drag = null; }); });
    (window as any).__menu = this;
  }

  // ---------- alt çubuk ----------
  drawBar() {
    const W = this.W, H = this.H, bh = this.barH, y0 = H - bh;
    const g = this.add.graphics().setDepth(200);
    g.fillStyle(0x000000, 0.35).fillRect(0, y0 - 6 * D, W, 6 * D);
    g.fillStyle(PURPLE.bar, 1).fillRect(0, y0, W, bh);
    g.fillStyle(PURPLE.barHi, 1).fillRect(0, y0, W, 3 * D);
    const sel = TABS.findIndex(t => t.key === this.tab);
    const sw = W / 5;
    TABS.forEach((t, i) => {
      const cx = sw * (i + 0.5), on = i === sel;
      const ic = this.add.graphics().setDepth(202);
      if (on) {
        // seçili sekme: yükseltilmiş pirinç kutu
        const tw = sw * 1.08, th = bh * 1.15, tx = cx - tw / 2, ty = H - th;
        g.fillStyle(PURPLE.tabDark, 1).fillRoundedRect(tx, ty + 4 * D, tw, th, { tl: 18 * D, tr: 18 * D, bl: 0, br: 0 });
        g.fillStyle(PURPLE.tab, 1).fillRoundedRect(tx, ty, tw, th, { tl: 18 * D, tr: 18 * D, bl: 0, br: 0 });
        g.fillStyle(0xffffff, 0.25).fillRoundedRect(tx + 8 * D, ty + 5 * D, tw - 16 * D, 6 * D, 3 * D);
        this.drawTabIcon(ic, t.key, cx, ty + th * 0.4, th * 0.26, true);
        this.add.text(cx, H - th * 0.17, t.label, { fontFamily: FONT, fontSize: Math.round(bh * 0.19) + 'px', fontStyle: '700', color: '#2a1a05' }).setOrigin(0.5).setDepth(203);
      } else {
        this.drawTabIcon(ic, t.key, cx, y0 + bh * 0.42, bh * 0.25, false);
        this.add.text(cx, y0 + bh * 0.82, t.label, { fontFamily: FONT, fontSize: Math.round(bh * 0.15) + 'px', fontStyle: '700', color: '#b9a8e0' }).setOrigin(0.5).setDepth(203);
      }
      const hit = this.add.rectangle(cx, y0 + bh / 2, sw, bh, 0, 0).setDepth(204).setInteractive();
      hit.on('pointerup', () => { if (t.key !== this.tab) { sfx.tap(); this.scene.restart({ tab: t.key }); } });
    });
  }

  drawTabIcon(g, key, x, y, r, on) {
    const main = on ? 0x6e3518 : 0xe0b450, hi = on ? 0x9a4a22 : 0xffe3a8;
    if (key === 'shop') {          // tente ve tezgâh
      g.fillStyle(main, 1).fillRoundedRect(x - r, y - r * 0.2, r * 2, r * 1.1, r * 0.15);
      for (let i = 0; i < 4; i++) g.fillStyle(i % 2 ? hi : main, 1).fillRect(x - r + i * r * 0.5, y - r * 0.85, r * 0.5, r * 0.55);
      g.fillStyle(on ? 0xe0b450 : 0x2a1d47, 1).fillRect(x - r * 0.3, y + r * 0.2, r * 0.6, r * 0.7);
    } else if (key === 'eng') {    // anahtar
      g.lineStyle(r * 0.38, main, 1).lineBetween(x - r * 0.7, y + r * 0.7, x + r * 0.3, y - r * 0.3);
      g.fillStyle(main, 1).fillCircle(x + r * 0.45, y - r * 0.45, r * 0.5);
      g.fillStyle(on ? 0xe0b450 : 0x2a1d47, 1).fillRect(x + r * 0.35, y - r * 1.0, r * 0.3, r * 0.6);
    } else if (key === 'home') {   // testere çatılı fabrika
      g.fillStyle(main, 1).fillRect(x - r, y - r * 0.1, r * 2, r * 1.0);
      g.fillTriangle(x - r, y - r * 0.1, x - r * 0.33, y - r * 0.1, x - r, y - r * 0.75);
      g.fillTriangle(x - r * 0.33, y - r * 0.1, x + r * 0.33, y - r * 0.1, x - r * 0.33, y - r * 0.75);
      g.fillTriangle(x + r * 0.33, y - r * 0.1, x + r, y - r * 0.1, x + r * 0.33, y - r * 0.75);
      g.fillRect(x + r * 0.6, y - r * 1.05, r * 0.25, r * 0.6);
      g.fillStyle(on ? 0xe0b450 : 0x2a1d47, 1).fillRect(x - r * 0.2, y + r * 0.35, r * 0.4, r * 0.55);
    } else if (key === 'map') {    // konum iğnesi
      g.fillStyle(main, 1).fillCircle(x, y - r * 0.25, r * 0.65).fillTriangle(x - r * 0.6, y - r * 0.05, x + r * 0.6, y - r * 0.05, x, y + r * 0.95);
      g.fillStyle(on ? 0xe0b450 : 0x2a1d47, 1).fillCircle(x, y - r * 0.25, r * 0.28);
    } else {                       // kürsü
      g.fillStyle(main, 1).fillRect(x - r * 0.35, y - r * 0.6, r * 0.7, r * 1.5).fillRect(x - r, y - r * 0.1, r * 0.65, r * 1.0).fillRect(x + r * 0.35, y + r * 0.2, r * 0.65, r * 0.7);
      g.fillStyle(on ? 0xe0b450 : 0x2a1d47, 1).fillRect(x - r * 0.08, y - r * 0.4, r * 0.16, r * 0.5);
    }
  }

  // ---------- sayfalar ----------
  drawPage() {
    if (this.tab === 'home') this.pageHome();
    else if (this.tab === 'map') this.pageMap();
    else if (this.tab === 'shop') this.pageShop();
    else if (this.tab === 'eng') this.pageEng();
    else this.pageStats();
  }

  header(title) {
    const W = this.W, hh = Math.min(78 * D, this.H * 0.095);
    const g = this.add.graphics().setDepth(150);
    g.fillStyle(PURPLE.head, 1).fillRect(0, 0, W, hh);
    g.fillStyle(0x000000, 0.3).fillRect(0, hh, W, 5 * D);
    g.fillStyle(0xffffff, 0.08).fillRect(0, hh - 4 * D, W, 4 * D);
    const fs = Math.round(hh * 0.4);
    this.add.text(W / 2, hh * 0.56 + 2 * D, title, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#1a1030' }).setOrigin(0.5).setDepth(151);
    this.add.text(W / 2, hh * 0.56, title, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5).setDepth(151);
    return hh;
  }

  pageBg(top, bot) {
    const g = this.add.graphics();
    g.fillGradientStyle(top, top, bot, bot, 1).fillRect(0, 0, this.W, this.H);
    return g;
  }

  // durum: şu anki level, bitti mi
  curLevel() { return Math.min(state.round, LEVELS.length - 1); }
  allDone() { return LEVELS.every((_, i) => (META.stars[i] || 0) > 0) && state.round === 0 && !state.grid.some(Boolean); }
  totalStars() { return META.stars.reduce((a, b) => a + (b || 0), 0); }

  play() {
    sfx.pick(); buzz(20);
    state.menuTab = 'home';
    this.scene.start('build');
  }

  // ===================== ATÖLYE (ana sayfa) =====================
  pageHome() {
    const W = this.W, H = this.H, pad = this.pad;
    const n = this.curLevel(), L = LEVELS[n], A = AREAS[L.area];
    // gece gökyüzü ve atölye duvarı
    this.pageBg(A.sky, 0x120c22);
    const g = this.add.graphics();
    const wallTop = H * 0.18;
    // pencere: ay ve şehir silueti
    const wx = W * 0.12, ww = W * 0.76, wy = wallTop + H * 0.02, wh = H * 0.26;
    g.fillStyle(0x0d1430, 1).fillRoundedRect(wx, wy, ww, wh, { tl: ww / 2, tr: ww / 2, bl: 8 * D, br: 8 * D });
    g.fillStyle(0xfff2c4, 0.9).fillCircle(wx + ww * 0.72, wy + wh * 0.32, ww * 0.07);
    g.fillStyle(0x0d1430, 1).fillCircle(wx + ww * 0.75, wy + wh * 0.29, ww * 0.06);
    const rnd = new Phaser.Math.RandomDataGenerator(['tik']);
    for (let i = 0; i < 9; i++) {
      const bw = ww / 9, bh = wh * rnd.realInRange(0.18, 0.45), bx = wx + i * bw;
      g.fillStyle(0x1b2346, 1).fillRect(bx, wy + wh - bh, bw - 2 * D, bh);
      for (let k = 0; k < 3; k++) if (rnd.frac() < 0.5) g.fillStyle(A.glow, 0.7).fillRect(bx + bw * 0.3, wy + wh - bh + 6 * D + k * 10 * D, 4 * D, 4 * D);
    }
    g.lineStyle(6 * D, 0x6e3518, 1).strokeRoundedRect(wx, wy, ww, wh, { tl: ww / 2, tr: ww / 2, bl: 8 * D, br: 8 * D });
    g.lineStyle(4 * D, 0x6e3518, 1).lineBetween(wx + ww / 2, wy, wx + ww / 2, wy + wh).lineBetween(wx, wy + wh * 0.55, wx + ww, wy + wh * 0.55);
    // tuğla duvar ve tezgâh
    const floorY = H * 0.6;
    g.fillStyle(0x3a2238, 1).fillRect(0, wy + wh + 6 * D, W, floorY - wy - wh - 6 * D);
    g.lineStyle(1 * D, 0x4a2c46, 1);
    for (let y = wy + wh + 6 * D; y < floorY; y += 16 * D) { g.lineBetween(0, y, W, y); for (let x = ((y / (16 * D)) % 2) * 20 * D; x < W; x += 40 * D) g.lineBetween(x, y, x, y + 16 * D); }
    g.fillStyle(0x6e3518, 1).fillRect(0, floorY, W, H - floorY);
    g.fillStyle(0x8a4a26, 1).fillRect(0, floorY, W, 8 * D);
    // asılı fenerler (titrek ışık)
    [0.14, 0.5, 0.86].forEach((fx, i) => {
      const x = W * fx, y = wallTop - 4 * D + (i === 1 ? -10 * D : 0);
      g.lineStyle(2 * D, 0x9a7424, 1).lineBetween(x, y - 40 * D, x, y);
      const glow = this.add.circle(x, y + 18 * D, 46 * D, A.glow, 0.18).setBlendMode('ADD');
      this.tweens.add({ targets: glow, alpha: { from: 0.12, to: 0.28 }, scale: { from: 0.92, to: 1.08 }, duration: 700 + i * 230, yoyo: true, repeat: -1 });
      g.fillStyle(0x9a7424, 1).fillRect(x - 9 * D, y, 18 * D, 5 * D);
      g.fillStyle(A.glow, 1).fillRoundedRect(x - 8 * D, y + 5 * D, 16 * D, 24 * D, 5 * D);
      g.fillStyle(0xffffff, 0.5).fillRect(x - 3 * D, y + 9 * D, 3 * D, 14 * D);
      g.fillStyle(0x9a7424, 1).fillRect(x - 9 * D, y + 28 * D, 18 * D, 4 * D);
    });
    // Nuri Usta ve çalışan makineler
    const s = Math.min(W * 0.24, H * 0.115);
    const og = this.add.graphics();
    drawOwner(og, W * 0.5, floorY - s * 1.25, s);
    this.tweens.add({ targets: og, y: -4 * D, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const ms = Math.min(W * 0.2, 90 * D);
    this.homeMachines = [['crank', 0.17], ['press', 0.83]].map(([t, fx]) => drawMachine(this, t, ms).setPosition(W * (fx as number), floorY - ms * 0.3));
    const sparks = this.add.particles(0, 0, this.sparkTex(), { x: { min: 0, max: W }, y: floorY, speedY: { min: -60 * D, max: -20 * D }, speedX: { min: -10 * D, max: 10 * D }, lifespan: 4000, scale: { start: 0.35 * D, end: 0 }, tint: [A.glow, 0xffffff], frequency: 280, blendMode: 'ADD' });
    sparks.setDepth(5);

    // üst çubuk: Nuri simgesi, yıldız, hurda, ayarlar
    const tb = Math.min(58 * D, H * 0.075), ty = Math.max(14 * D, H * 0.02);
    const tg = this.add.graphics().setDepth(20);
    tg.fillStyle(0x1a1030, 1).fillRoundedRect(pad, ty + 3 * D, tb, tb, 14 * D);
    tg.fillStyle(0x5b3fa0, 1).fillRoundedRect(pad, ty, tb, tb, 14 * D);
    tg.lineStyle(3 * D, 0xb9a8e0, 1).strokeRoundedRect(pad, ty, tb, tb, 14 * D);
    const av = this.add.graphics().setDepth(21);
    drawOwner(av, pad + tb / 2, ty + tb * 0.5, tb * 0.62);
    const am = this.make.graphics({ add: false } as any); am.fillStyle(0xffffff).fillRoundedRect(pad + 3 * D, ty + 3 * D, tb - 6 * D, tb - 6 * D, 11 * D);
    av.setMask(am.createGeometryMask());
    const pill = (x, w, icon, txt, col) => {
      const ph = tb * 0.62, py = ty + tb / 2;
      tg.fillStyle(0x1a1030, 1).fillRoundedRect(x, py - ph / 2 + 3 * D, w, ph, ph / 2);
      tg.fillStyle(0xf6ecdb, 1).fillRoundedRect(x, py - ph / 2, w, ph, ph / 2);
      tg.fillStyle(col, 1).fillCircle(x + ph / 2, py, ph * 0.56);
      this.add.text(x + ph / 2, py, icon, { fontFamily: FONT, fontSize: Math.round(ph * 0.55) + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5).setDepth(21);
      this.add.text(x + ph + (w - ph) / 2, py, txt, { fontFamily: FONT, fontSize: Math.round(ph * 0.5) + 'px', fontStyle: '700', color: '#3a2760' }).setOrigin(0.5).setDepth(21);
    };
    const gw = tb, gx = W - pad - gw;
    const span = gx - (pad + tb) - 24 * D, pw = span / 2;
    pill(pad + tb + 10 * D, pw - 4 * D, '★', `${this.totalStars()}/${LEVELS.length * 3}`, 0xe0a72a);
    pill(pad + tb + 14 * D + pw, pw - 4 * D, '🔩', `${META.scrap}`, 0x6c7594);
    tg.fillStyle(0x1a1030, 1).fillRoundedRect(gx, ty + 3 * D, gw, gw, 14 * D);
    tg.fillStyle(0x5b3fa0, 1).fillRoundedRect(gx, ty, gw, gw, 14 * D);
    this.drawGear(tg, gx + gw / 2, ty + gw / 2, gw * 0.3);
    const gh = this.add.rectangle(gx + gw / 2, ty + gw / 2, gw, gw, 0, 0).setDepth(22).setInteractive();
    gh.on('pointerup', () => this.openSettings());

    // bölge çubuğu: bu bölgedeki yıldızlar
    const by = ty + tb + 16 * D, bw = W - pad * 2, bH = Math.min(30 * D, H * 0.04);
    const a0 = L.area * PER_AREA, got = META.stars.slice(a0, a0 + PER_AREA).reduce((x, y) => x + (y || 0), 0), max = PER_AREA * 3;
    tg.fillStyle(0x1a1030, 1).fillRoundedRect(pad, by + 3 * D, bw, bH, bH / 2);
    tg.fillStyle(0x3a2760, 1).fillRoundedRect(pad, by, bw, bH, bH / 2);
    if (got) tg.fillStyle(0xe0a72a, 1).fillRoundedRect(pad, by, Math.max(bH, bw * got / max), bH, bH / 2);
    tg.lineStyle(2.5 * D, 0xe0b450, 1).strokeRoundedRect(pad, by, bw, bH, bH / 2);
    this.add.text(W / 2, by + bH / 2, `${A.name} · ★ ${got}/${max}`, { fontFamily: FONT, fontSize: Math.round(bH * 0.52) + 'px', fontStyle: '700', color: '#ffffff', stroke: '#1a1030', strokeThickness: 3 * D }).setOrigin(0.5).setDepth(21);

    // büyük LEVEL düğmesi
    const lw = Math.min(W * 0.66, 300 * D), lh = Math.min(84 * D, H * 0.1), lx = W / 2, ly = H - this.barH - lh * 1.15;
    if (this.allDone()) {
      const b = makeButton(this, lx, ly, lw, lh * 0.8, 'Hepsi bitti! ★', BTN_GO, () => this.play()); b.setDepth(30);
      this.add.text(W / 2, ly - lh * 0.85, 'Festival fenerleri yanıyor! Yeni fabrikayla yıldızlarını artırabilirsin.', { fontFamily: FONT, fontSize: Math.round(lh * 0.2) + 'px', fontStyle: '700', color: '#ffe3a8', align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5).setDepth(30);
    } else {
      const boss = !!BOSS[n];
      const bg2 = this.add.graphics().setDepth(30);
      bg2.fillStyle(0x1a1030, 0.9).fillRoundedRect(lx - lw / 2 - 8 * D, ly - lh / 2 - 8 * D, lw + 16 * D, lh + 22 * D, lh * 0.42);
      const btn = makeButton(this, lx, ly, lw, lh, `LEVEL ${n + 1}`, { base: 0xe0564a, dark: 0x8a2a22, text: '#fff8ee' }, () => this.play());
      btn.setDepth(31);
      btn.label.setStroke('#5a1a14', 6 * D).setFontSize(Math.round(lh * 0.42));
      this.tweens.add({ targets: btn, scale: { from: 1, to: 1.04 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const info = `⏱ ${L.time} sn  ·  ✦ ${L.goal}`;
      this.add.text(lx, ly - lh * 0.95, info, { fontFamily: FONT, fontSize: Math.round(lh * 0.24) + 'px', fontStyle: '700', color: '#ffe3a8', stroke: '#1a1030', strokeThickness: 4 * D }).setOrigin(0.5).setDepth(31);
      if (boss) {
        const bb = this.add.graphics().setDepth(32);
        const bx = lx, byy = ly + lh * 0.55, br = lh * 0.3;
        bb.fillStyle(0x5b3fa0, 1).fillCircle(bx, byy, br * 1.15);
        bb.fillStyle(0xe0564a, 1).fillCircle(bx, byy, br);
        this.add.text(bx, byy, '☠', { fontFamily: FONT, fontSize: Math.round(br * 1.2) + 'px', color: '#ffffff' }).setOrigin(0.5).setDepth(33);
      }
    }
  }

  sparkTex() {
    if (!this.textures.exists('spark')) {
      const t = this.make.graphics({ add: false } as any);
      t.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
      t.generateTexture('spark', 16, 16); t.destroy();
    }
    return 'spark';
  }

  drawGear(g, x, y, r) {
    g.fillStyle(0xe0b450, 1);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillCircle(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05, r * 0.32); }
    g.fillCircle(x, y, r);
    g.fillStyle(0x5b3fa0, 1).fillCircle(x, y, r * 0.45);
  }

  update(_, dt) {
    if (this.homeMachines) this.homeMachines.forEach(m => m.tick && m.tick(dt, 1));
  }

  // ayarlar: tema ve yeni fabrika
  openSettings() {
    sfx.tap();
    if (this.popup) this.popup.destroy();
    const W = this.W, H = this.H;
    const k = this.add.container(0, 0).setDepth(300);
    const dim = this.add.rectangle(0, 0, W, H, 0x05070d, 0.7).setOrigin(0).setInteractive();
    const cw = Math.min(W - this.pad * 2, 340 * D), ch = cw * 0.85, cx = W / 2, cy = H * 0.45;
    const g = this.add.graphics();
    g.fillStyle(0x1a1030, 1).fillRoundedRect(cx - cw / 2, cy - ch / 2 + 6 * D, cw, ch, 22 * D);
    g.fillStyle(0x3a2760, 1).fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 22 * D);
    g.lineStyle(3 * D, 0xb9a8e0, 1).strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 22 * D);
    const t = this.add.text(cx, cy - ch * 0.38, 'Ayarlar', { fontFamily: FONT, fontSize: Math.round(cw * 0.09) + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5);
    const bw = cw * 0.8, bh = Math.min(50 * D, ch * 0.16);
    const theme = makeButton(this, cx, cy - ch * 0.15, bw, bh, state.theme === 'dark' ? 'Oyun teması: Koyu' : 'Oyun teması: Açık', BTN_BRASS, () => {
      const nt = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nt; Object.assign(T, THEMES[nt]);
      try { localStorage.setItem('tiktik-theme', nt); } catch (e) {}
      this.openSettings();
    });
    const reset = makeButton(this, cx, cy + ch * 0.05, bw, bh, this.resetAsk ? 'Emin misin? Tekrar bas' : '↺ Yeni fabrika (1. bölge)', this.resetAsk ? BTN_RED : BTN_OFF, () => {
      if (!this.resetAsk) { this.resetAsk = true; this.openSettings(); return; }
      this.resetAsk = false; clearRun(); newArea(0); saveRun(); sfx.pick();
      this.scene.restart({ tab: 'home' });
    });
    const note = this.add.text(cx, cy + ch * 0.16, 'Yeni fabrika: makineler sıfırlanır, 1. levelden başlarsın. Yıldız ve hurda kalır.', { fontFamily: FONT, fontSize: Math.round(cw * 0.038) + 'px', fontStyle: '500', color: '#c9bde8', align: 'center', wordWrap: { width: cw * 0.85 } }).setOrigin(0.5, 0);
    const close = makeButton(this, cx, cy + ch * 0.38, bw * 0.6, bh, 'Kapat', BTN_GO, () => { this.resetAsk = false; k.destroy(); this.popup = null; });
    k.add([dim, g, t, theme, reset, note, close]);
    this.popup = k;
  }

  // ===================== HARİTA: dikey level yolu =====================
  pageMap() {
    const W = this.W, H = this.H;
    this.pageBg(0x2a1d47, 0x1a1030);
    const hh = this.header('Harita');
    const top = hh + 5 * D, bottom = H - this.barH;
    const view = bottom - top;
    // arka plan deseni
    const deco = this.add.graphics();
    deco.lineStyle(3 * D, 0x3a2a5e, 1);
    for (let i = 0; i < 14; i++) { const x = (i * 97 * D) % W, y = top + (i * 151 * D) % view; deco.strokeCircle(x, y, 18 * D + (i % 3) * 8 * D); }
    const k = this.add.container(0, 0);
    const cx = W / 2, step = Math.min(110 * D, view * 0.16), cardH = Math.min(190 * D, view * 0.3), cardW = Math.min(W * 0.62, 260 * D);
    const cur = this.curLevel();
    // içerik aşağıdan yukarı: bölge kartı, sonra 10 level
    let y = 0; const nodes = [];
    const g = this.add.graphics(); k.add(g);
    const items = [];
    AREAS.forEach((A, a) => {
      y -= cardH * 0.5 + 30 * D; items.push({ type: 'area', a, y }); y -= cardH * 0.5 + 20 * D;
      for (let i = 0; i < PER_AREA; i++) { const n = a * PER_AREA + i; y -= step; items.push({ type: 'level', n, y }); }
      y -= 20 * D;
    });
    const contentH = -y + cardH;
    // ray: alttan yukarı; geçilen kısım yeşil
    const railW = Math.min(28 * D, W * 0.07);
    const curItem = items.find(it => it.type === 'level' && it.n === cur);
    g.fillStyle(0x15102a, 1).fillRoundedRect(cx - railW / 2, y, railW, -y, railW / 2);
    g.lineStyle(3 * D, 0xe0b450, 1).strokeRoundedRect(cx - railW / 2, y, railW, -y, railW / 2);
    if (curItem) g.fillStyle(0x5fd38a, 1).fillRoundedRect(cx - railW / 2 + 4 * D, curItem.y, railW - 8 * D, -curItem.y, (railW - 8 * D) / 2);
    items.forEach(it => {
      if (it.type === 'area') {
        const A = AREAS[it.a], open = cur >= it.a * PER_AREA, x0 = cx - cardW / 2, y0 = it.y - cardH / 2;
        g.fillStyle(0x000000, 0.4).fillRoundedRect(x0, y0 + 6 * D, cardW, cardH, 22 * D);
        g.fillStyle(open ? 0x5fd38a : 0x3a2760, 1).fillRoundedRect(x0 - 5 * D, y0 - 5 * D, cardW + 10 * D, cardH + 10 * D, 26 * D);
        g.fillGradientStyle(A.sky, A.sky, 0x120c22, 0x120c22, 1).fillRect(x0 + 6 * D, y0 + 36 * D, cardW - 12 * D, cardH - 72 * D);
        // küçük sahne: ay, fenerler, siluet
        g.fillStyle(0xfff2c4, 0.85).fillCircle(x0 + cardW * 0.78, y0 + cardH * 0.36, cardW * 0.06);
        for (let i = 0; i < 6; i++) { const bw = (cardW - 12 * D) / 6, bh = (cardH * 0.18) * (0.6 + ((i * 7) % 5) / 5); g.fillStyle(0x1b2346, 1).fillRect(x0 + 6 * D + i * bw, y0 + cardH - 36 * D - bh, bw - 2 * D, bh); }
        [0.25, 0.5, 0.75].forEach(f => { g.fillStyle(A.glow, 1).fillRoundedRect(x0 + cardW * f - 5 * D, y0 + cardH * 0.4, 10 * D, 15 * D, 3 * D); });
        g.fillStyle(0x3a2760, 1).fillRoundedRect(x0 + 6 * D, y0 + 4 * D, cardW - 12 * D, 30 * D, 12 * D);
        k.add(this.add.text(cx, y0 + 19 * D, A.name, { fontFamily: FONT, fontSize: Math.round(15 * D) + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5));
        g.fillStyle(0x3a2760, 1).fillRoundedRect(cx - cardW * 0.32, y0 + cardH - 32 * D, cardW * 0.64, 26 * D, 12 * D);
        k.add(this.add.text(cx, y0 + cardH - 19 * D, `Level ${it.a * PER_AREA + 1}-${(it.a + 1) * PER_AREA}`, { fontFamily: FONT, fontSize: Math.round(13 * D) + 'px', fontStyle: '700', color: '#ffe3a8' }).setOrigin(0.5));
        if (!open) {
          g.fillStyle(0x05070d, 0.55).fillRect(x0 + 6 * D, y0 + 36 * D, cardW - 12 * D, cardH - 72 * D);
          k.add(this.add.text(cx, it.y, '🔒', { fontFamily: FONT, fontSize: Math.round(cardH * 0.22) + 'px' }).setOrigin(0.5));
        } else if (cur >= (it.a + 1) * PER_AREA || (META.stars[(it.a + 1) * PER_AREA - 1] || 0) > 0) {
          g.fillStyle(0x5fd38a, 1).fillCircle(cx, y0 + cardH + 4 * D, 16 * D);
          k.add(this.add.text(cx, y0 + cardH + 4 * D, '✓', { fontFamily: FONT, fontSize: Math.round(18 * D) + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5));
        }
      } else {
        const n = it.n, L = LEVELS[n], left = n % 2 === 0, done = n < cur || (META.stars[n] || 0) > 0 && n !== cur, isCur = n === cur;
        const pw = Math.min(W * 0.27, 112 * D), ph = Math.min(52 * D, step * 0.5);
        const px = left ? cx - railW / 2 - 14 * D - pw : cx + railW / 2 + 14 * D;
        const pc = isCur ? 0xe0b450 : done ? 0xf6ecdb : 0x4a3a72;
        g.fillStyle(0x000000, 0.35).fillRoundedRect(px, it.y - ph / 2 + 4 * D, pw, ph, ph / 2);
        g.fillStyle(pc, 1).fillRoundedRect(px, it.y - ph / 2, pw, ph, ph / 2);
        if (BOSS[n]) g.lineStyle(3 * D, 0xe0564a, 1).strokeRoundedRect(px, it.y - ph / 2, pw, ph, ph / 2);
        const tc = isCur ? '#2a1a05' : done ? '#3a2760' : '#9c8cc8';
        k.add(this.add.text(px + pw / 2, it.y - ph * 0.14, `Level ${n + 1}${BOSS[n] ? ' ☠' : ''}`, { fontFamily: FONT, fontSize: Math.round(ph * 0.34) + 'px', fontStyle: '700', color: tc }).setOrigin(0.5));
        const st = META.stars[n] || 0;
        k.add(this.add.text(px + pw / 2, it.y + ph * 0.24, done || st ? '★'.repeat(st) + '☆'.repeat(3 - st) : `⏱ ${L.time} sn`, { fontFamily: FONT, fontSize: Math.round(ph * 0.26) + 'px', fontStyle: '700', color: done || st ? '#e0a72a' : tc }).setOrigin(0.5));
        // ray üzerinde işaret
        if (done) { g.fillStyle(0x2e8a52, 1).fillCircle(cx, it.y, railW * 0.62); g.fillStyle(0x5fd38a, 1).fillCircle(cx, it.y, railW * 0.5); k.add(this.add.text(cx, it.y, '✓', { fontFamily: FONT, fontSize: Math.round(railW * 0.7) + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5)); }
        else if (isCur) {
          const m = this.add.graphics().setPosition(cx, it.y);
          m.fillStyle(0x9a7424, 1).fillCircle(0, 2 * D, railW * 0.78); m.fillStyle(0xffd84a, 1).fillCircle(0, 0, railW * 0.75);
          m.fillStyle(0x6e3518, 1).fillTriangle(-railW * 0.35, railW * 0.18, railW * 0.35, railW * 0.18, 0, -railW * 0.35);
          this.tweens.add({ targets: m, scale: { from: 1, to: 1.15 }, duration: 600, yoyo: true, repeat: -1 });
          k.add(m);
        } else g.fillStyle(0x4a3a72, 1).fillCircle(cx, it.y, railW * 0.3);
        // her 5 levelde hurda ödülü
        if ((n + 1) % 5 === 0) {
          const rx = left ? cx + railW / 2 + 40 * D : cx - railW / 2 - 40 * D;
          const got = (META.stars[n] || 0) > 0;
          g.fillStyle(got ? 0x2e8a52 : 0x3a2760, 1).fillCircle(rx, it.y, 22 * D);
          g.lineStyle(3 * D, got ? 0x5fd38a : 0xe0b450, 1).strokeCircle(rx, it.y, 22 * D);
          k.add(this.add.text(rx, it.y - 3 * D, '🔩', { fontFamily: FONT, fontSize: Math.round(16 * D) + 'px' }).setOrigin(0.5));
          k.add(this.add.text(rx, it.y + 26 * D, got ? 'alındı' : '+5', { fontFamily: FONT, fontSize: Math.round(11 * D) + 'px', fontStyle: '700', color: '#ffe3a8' }).setOrigin(0.5));
        }
        if (isCur) {
          const hit = this.add.rectangle(px + pw / 2, it.y, pw + 30 * D, ph + 20 * D, 0, 0).setInteractive();
          hit.on('pointerup', () => { if (!this.drag || !this.drag.moved) this.play(); });
          k.add(hit);
        }
      }
    });
    // kaydırma
    const mask = this.make.graphics({ add: false } as any); mask.fillStyle(0xffffff).fillRect(0, top, W, view);
    k.setMask(mask.createGeometryMask());
    this.scrollBox = { k, base: bottom - 10 * D, min: 0, max: Math.max(0, contentH - view + 40 * D) };
    k.y = this.scrollBox.base;
    // açılışta şu anki leveli ortala
    const target = curItem ? -curItem.y - view * 0.45 : 0;
    this.setScroll(Phaser.Math.Clamp(target, 0, this.scrollBox.max));
    // üstte/altta ipucu düğmeleri
  }

  setScroll(v) {
    const b = this.scrollBox; if (!b) return;
    this.scrollY = Phaser.Math.Clamp(v, b.min, b.max);
    b.k.y = b.base + this.scrollY;
  }

  // ===================== DÜKKAN: hurda ile kalıcı yükseltmeler =====================
  pageShop() {
    const W = this.W, H = this.H, pad = this.pad;
    this.pageBg(0x2a1d47, 0x1a1030);
    let y = this.header('Dükkan') + 16 * D;
    const fs = Math.round(Math.min(W * 0.04, 16 * D)), fsS = Math.round(fs * 0.86);
    y = this.scrapChip(y);
    this.add.text(W / 2, y, 'Level geçtikçe hurda kazanırsın. Yükseltmeler kalıcıdır.', { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: '#c9bde8', align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5, 0);
    y += fs * 2.2;
    const g = this.add.graphics();
    const keys = Object.keys(UPG), gap = 12 * D;
    const rh = Math.min(96 * D, (H - this.barH - y - 16 * D - gap * (keys.length - 1)) / keys.length);
    keys.forEach(key => {
      const u = UPG[key], lv = META.lv[key], max = u.cost.length, full = lv >= max;
      g.fillStyle(0x000000, 0.35).fillRoundedRect(pad, y + 5 * D, W - pad * 2, rh, 18 * D);
      g.fillStyle(0x3a2760, 1).fillRoundedRect(pad, y, W - pad * 2, rh, 18 * D);
      g.lineStyle(2.5 * D, full ? 0x5fd38a : 0xe0b450, 1).strokeRoundedRect(pad, y, W - pad * 2, rh, 18 * D);
      const ir = rh * 0.3;
      g.fillStyle(0x1a1030, 1).fillCircle(pad + 14 * D + ir, y + rh / 2, ir);
      this.add.text(pad + 14 * D + ir, y + rh / 2, ({ money: '🐷', place: '➕', shield: '🛡', offer: '🏪' })[key] || '⚙', { fontFamily: FONT, fontSize: Math.round(ir * 1.0) + 'px' }).setOrigin(0.5);
      const tx = pad + 28 * D + ir * 2;
      this.add.text(tx, y + rh * 0.3, u.name + '  ' + '●'.repeat(lv) + '○'.repeat(max - lv), { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0, 0.5);
      const bw = Math.min(100 * D, W * 0.25), bx = W - pad - 12 * D - bw / 2;
      this.add.text(tx, y + rh * 0.66, u.desc, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: '#c9bde8', wordWrap: { width: bx - bw / 2 - tx - 8 * D } }).setOrigin(0, 0.5);
      if (full) this.add.text(bx, y + rh / 2, 'Tam ✓', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5);
      else {
        const c = u.cost[lv], can = META.scrap >= c;
        makeButton(this, bx, y + rh / 2, bw, Math.min(44 * D, rh * 0.5), `${c} 🔩`, can ? BTN_GO : BTN_OFF, () => this.buyUpg(key));
      }
      y += rh + gap;
    });
  }

  scrapChip(y) {
    const W = this.W, ch = Math.min(46 * D, this.H * 0.06), cw = Math.min(W * 0.5, 200 * D);
    const g = this.add.graphics();
    g.fillStyle(0x1a1030, 1).fillRoundedRect(W / 2 - cw / 2, y + 3 * D, cw, ch, ch / 2);
    g.fillStyle(0xf6ecdb, 1).fillRoundedRect(W / 2 - cw / 2, y, cw, ch, ch / 2);
    this.add.text(W / 2, y + ch / 2, `🔩 ${META.scrap} hurda`, { fontFamily: FONT, fontSize: Math.round(ch * 0.45) + 'px', fontStyle: '700', color: '#3a2760' }).setOrigin(0.5);
    return y + ch + 14 * D;
  }

  buyUpg(key) {
    const u = UPG[key], lv = META.lv[key];
    if (lv >= u.cost.length) return;
    if (META.scrap < u.cost[lv]) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    META.scrap -= u.cost[lv]; META.lv[key] = lv + 1; saveMeta();
    if (key === 'place') { state.places += 1; saveRun(); }   // Fazla Tezgâh hemen işler
    [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle', 0.15), i * 70)); buzz(20);
    this.scene.restart({ tab: 'shop' });
  }

  // ===================== USTALAR: mühendis seçimi =====================
  pageEng() {
    const W = this.W, H = this.H, pad = this.pad;
    this.pageBg(0x2a1d47, 0x1a1030);
    let y = this.header('Ustalar') + 16 * D;
    y = this.scrapChip(y);
    const fs = Math.round(Math.min(W * 0.042, 17 * D)), fsS = Math.round(fs * 0.84);
    const g = this.add.graphics();
    const keys = Object.keys(ENG), gap = 14 * D;
    const rh = Math.min(130 * D, (H - this.barH - y - 16 * D - gap * (keys.length - 1)) / keys.length);
    keys.forEach(key => {
      const e = ENG[key], owned = !!META.eng[key], sel = META.pick === key;
      g.fillStyle(0x000000, 0.35).fillRoundedRect(pad, y + 5 * D, W - pad * 2, rh, 20 * D);
      g.fillStyle(sel ? 0x4a3580 : 0x3a2760, 1).fillRoundedRect(pad, y, W - pad * 2, rh, 20 * D);
      g.lineStyle(sel ? 4 * D : 2 * D, sel ? e.color : 0x5b3fa0, 1).strokeRoundedRect(pad, y, W - pad * 2, rh, 20 * D);
      const s = rh * 0.42, ox = pad + 16 * D + s * 0.6;
      const og = this.add.graphics();
      drawOwner(og, ox, y + rh * 0.4, s);
      og.fillStyle(e.color, 1).fillEllipse(ox, y + rh * 0.4 - s * 0.3, s * 1.02, s * 0.44);   // mühendisin şapka rengi
      const tx = ox + s * 0.9;
      const bw = Math.min(104 * D, W * 0.26), bx = W - pad - 12 * D - bw / 2;
      this.add.text(tx, y + rh * 0.26, e.name, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0, 0.5);
      this.add.text(tx, y + rh * 0.42, e.desc, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: '#c9bde8', wordWrap: { width: bx - bw / 2 - tx - 8 * D } }).setOrigin(0, 0);
      if (sel) this.add.text(bx, y + rh / 2, 'Seçili ✓', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5);
      else {
        const can = owned || META.scrap >= e.cost;
        makeButton(this, bx, y + rh / 2, bw, Math.min(44 * D, rh * 0.36), owned ? 'Seç' : `${e.cost} 🔩 Aç`, can ? (owned ? BTN_BRASS : BTN_GO) : BTN_OFF, () => this.pickEng(key));
      }
      y += rh + gap;
    });
  }

  pickEng(key) {
    const e = ENG[key];
    if (!META.eng[key]) {
      if (META.scrap < e.cost) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
      META.scrap -= e.cost; META.eng[key] = true;
      [523, 784].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle', 0.15), i * 80));
    } else sfx.tap();
    META.pick = key; state.eng = key; saveMeta();
    this.scene.restart({ tab: 'eng' });
  }

  // ===================== REKORLAR =====================
  pageStats() {
    const W = this.W, H = this.H, pad = this.pad;
    this.pageBg(0x2a1d47, 0x1a1030);
    let y = this.header('Rekorlar') + 18 * D;
    const fs = Math.round(Math.min(W * 0.042, 17 * D)), fsS = Math.round(fs * 0.84);
    const g = this.add.graphics();
    // toplam
    const th = Math.min(90 * D, H * 0.11);
    g.fillStyle(0xe0b450, 1).fillRoundedRect(pad, y, W - pad * 2, th, 20 * D);
    this.add.text(W / 2, y + th * 0.36, `★ ${this.totalStars()} / ${LEVELS.length * 3}`, { fontFamily: FONT, fontSize: Math.round(th * 0.34) + 'px', fontStyle: '700', color: '#2a1a05' }).setOrigin(0.5);
    const passed = META.stars.filter(s => s > 0).length;
    this.add.text(W / 2, y + th * 0.74, `${passed} level geçildi · ${META.scrap} 🔩 hurda`, { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '700', color: '#5a3a12' }).setOrigin(0.5);
    y += th + 18 * D;
    AREAS.forEach((A, a) => {
      const rh = Math.min(84 * D, H * 0.1);
      g.fillStyle(0x3a2760, 1).fillRoundedRect(pad, y, W - pad * 2, rh, 18 * D);
      g.fillStyle(A.glow, 1).fillRoundedRect(pad, y, 8 * D, rh, { tl: 18 * D, bl: 18 * D, tr: 0, br: 0 });
      const st = META.stars.slice(a * PER_AREA, (a + 1) * PER_AREA);
      const got = st.reduce((x, s) => x + (s || 0), 0);
      this.add.text(pad + 22 * D, y + rh * 0.3, A.name, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0, 0.5);
      this.add.text(W - pad - 16 * D, y + rh * 0.3, `★ ${got}/${PER_AREA * 3}`, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffd84a' }).setOrigin(1, 0.5);
      // 10 levelin yıldızları küçük kutularda
      const bw = (W - pad * 2 - 40 * D) / PER_AREA;
      for (let i = 0; i < PER_AREA; i++) {
        const s = st[i] || 0, x = pad + 22 * D + i * bw;
        g.fillStyle(s === 3 ? 0xe0a72a : s ? 0x8a6a2a : 0x2a1d47, 1).fillRoundedRect(x, y + rh * 0.56, bw - 4 * D, rh * 0.3, 6 * D);
        this.add.text(x + (bw - 4 * D) / 2, y + rh * 0.71, s ? String(s) : '', { fontFamily: FONT, fontSize: Math.round(rh * 0.2) + 'px', fontStyle: '700', color: '#ffffff' }).setOrigin(0.5);
      }
      y += rh + 12 * D;
    });
    this.add.text(W / 2, y + 10 * D, 'Dünya sıralaması mağaza sürümünde gelecek.', { fontFamily: FONT, fontSize: fsS + 'px', fontStyle: '500', color: '#9c8cc8', align: 'center', wordWrap: { width: W - pad * 2 } }).setOrigin(0.5, 0);
  }
}
