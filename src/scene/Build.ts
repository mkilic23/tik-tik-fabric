import { LEVELS, taskState, taskText } from '../data/levels';
import Phaser from 'phaser';
import { Music, beep, buzz, sfx } from '../audio';
import { INFO, MACHINES, ORDER } from '../data/machines';
import { BOSS, PROD, RULES } from '../data/rules';
import { STORY } from '../data/story';
import { BTN_BRASS, BTN_GO, drawMachine, makeButton, rivet } from '../draw';
import { META, levelTime, saveMeta, saveRun, state } from '../state';
import { C, COLS, D, FONT, ROWS, T, THEMES } from '../theme';
import { ShopPart } from './shop';
import { FlowPart } from './flow';
import { PlacementPart } from './placement';
import { HeatPart } from './heat';
import { DialogPart } from './dialog';
import { MinigamePart } from './minigames';

export class Build extends Phaser.Scene {
  [key: string]: any;

  constructor() { super('build'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    // level penceresinde seçilen güçlendiriciler
    const bp = state.boostPick;
    if (bp && state.phase === 'build') {
      if (bp.cool) state.heat = state.heat.map(() => 0);
      if (bp.cash) state.res.money += 5;
      if (bp.time) state.timeBonus = 15;
      state.boostPick = null;
      saveRun();
    }
    this.dialog = null; this.mg = null; this.shop = null; this.meta = null; this.choice = null; this.resultBox = null; this.boomed = false; this.pickMod = null; this.lastP = undefined; // sahne yeniden başlarken eski durum kalmasın

    const pad = 16 * D;
    this.pad = pad;
    const trayH = Math.min(H * 0.22, 170 * D);
    const topH = Math.min(H * 0.18, 136 * D);
    this.topH = topH;
    this.cell = Math.floor(Math.min((W - pad * 2) / COLS, (H - topH - trayH - pad * 2) / ROWS));
    this.gx = Math.round((W - this.cell * COLS) / 2);
    this.gy = Math.round(topH + pad + Math.max(0, (H - topH - trayH - pad * 2 - this.cell * ROWS) / 2));

    const bg = this.add.graphics();
    bg.fillGradientStyle(T.bgTop, T.bgTop, T.bgBot, T.bgBot, 1).fillRect(0, 0, W, H);
    bg.lineStyle(1 * D, T.line, T.lineA);
    for (let y = 0; y < H; y += 48 * D) bg.lineBetween(0, y, W, y);

    if (!this.textures.exists('spark')) {
      const t = this.make.graphics({ add: false } as any);
      t.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
      t.generateTexture('spark', 16, 16); t.destroy();
    }
    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 80 * D, max: 260 * D }, angle: { min: 200, max: 340 }, lifespan: 450,
      scale: { start: 0.55 * D, end: 0 }, tint: [C.spark, C.brassHi, 0xffffff], gravityY: 700 * D,
      blendMode: 'ADD', emitting: false,
    }).setDepth(50);

    this.buildHud();
    this.dangerG = this.add.graphics().setDepth(70);

    this.gridG = this.add.graphics();
    this.hl = this.add.graphics().setDepth(5);
    this.linkG = this.add.graphics().setDepth(6);
    this.portL = this.add.graphics().setDepth(28);
    this.goldG = this.add.graphics().setDepth(9).setBlendMode('ADD');   // altın saat parıltısı (makinelerin altında)
    this.goldR = this.add.graphics().setDepth(29);                      // altın saat süre halkası
    this.cells = new Array(COLS * ROWS).fill(null);
    this.drawGrid();

    // alt tepsi
    const trayY = H - trayH;
    this.trayTop = trayY;
    const tray = this.add.graphics();
    tray.fillStyle(T.panel, 1).fillRect(0, trayY, W, trayH);
    tray.fillStyle(T.panelHi, 1).fillRect(0, trayY, W, 2 * D);
    tray.fillStyle(0x000000, 0.25).fillRect(0, trayY - 6 * D, W, 6 * D);

    const rowH = Math.min(trayH * 0.3, 48 * D);
    this.slotTop = trayY + rowH + 6 * D;
    this.hint = this.add.text(pad, trayY + rowH / 2 + 4 * D, '', {
      fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.036, 15 * D)) + 'px', fontStyle: '500', color: T.hudDim,
      wordWrap: { width: W * 0.52 },
    }).setOrigin(0, 0.5);
    const bw = Math.min(W * 0.38, 170 * D), bh = rowH * 0.82;
    this.goBtn = makeButton(this, W - pad - bw / 2, trayY + rowH / 2 + 4 * D, bw, bh, '▶  Başlat', BTN_GO, () => this.startRound());

    const slotW = (W - pad * 2) / ORDER.length;
    const slotH = H - this.slotTop;
    const icon = Math.min(slotW * 0.5, slotH * 0.42);
    this.slots = ORDER.map((type, i) => {
      const x = pad + slotW * i + slotW / 2;
      const y = this.slotTop + slotH * 0.33;
      const vis = drawMachine(this, type, icon).setPosition(x, y);
      const name = this.add.text(x, y + icon * 0.58, MACHINES[type].name, {
        fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.034, 14 * D)) + 'px', fontStyle: '700', color: T.hud,
      }).setOrigin(0.5, 0);
      const recipe = this.add.text(x, name.y + name.height + 1 * D, INFO[type].recipe, {
        fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.032, 13 * D)) + 'px', fontStyle: '500', color: T.hudDim,
      }).setOrigin(0.5, 0);
      const ring = this.add.graphics().setPosition(x, y).setDepth(4).setVisible(false);
      ring.lineStyle(3 * D, 0x5fd38a, 1).strokeCircle(0, 0, icon * 0.72);
      this.tweens.add({ targets: ring, scale: { from: 0.9, to: 1.12 }, alpha: { from: 1, to: 0.3 }, duration: 600, yoyo: true, repeat: -1 });
      return { type, x, y, r: slotW / 2, vis, name, recipe, ring };
    });

    this.trashBg = this.add.rectangle(0, trayY, W, trayH, 0x3a1d22, 0.94).setOrigin(0).setDepth(19).setVisible(false);
    this.trashText = this.add.text(W / 2, trayY + trayH / 2, '✕  Kaldırmak için buraya bırak', {
      fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.044, 18 * D)) + 'px', fontStyle: '700', color: '#ffb3ab',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // bilgi kartı (makine açıklaması ve öğretici)
    const bnH = Math.min(84 * D, H * 0.11), bnW = W - pad * 2;
    this.banner = this.add.container(pad, trayY - bnH - 12 * D).setDepth(40).setVisible(false);
    this.bannerG = this.add.graphics();
    this.bannerT1 = this.add.text(14 * D, bnH * 0.3, '', { fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.042, 17 * D)) + 'px', fontStyle: '700', color: '#ffe3a8' }).setOrigin(0, 0.5);
    this.bannerT2 = this.add.text(14 * D, bnH * 0.66, '', { fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.035, 14 * D)) + 'px', fontStyle: '500', color: C.cream, wordWrap: { width: bnW - 28 * D } }).setOrigin(0, 0.5);
    this.banner.add([this.bannerG, this.bannerT1, this.bannerT2]);
    this.bannerSize = { w: bnW, h: bnH };
    this.goRing = this.add.graphics().setDepth(4).setVisible(false);
    this.goRing.lineStyle(3 * D, 0x5fd38a, 1).strokeRoundedRect(this.goBtn.x - this.goBtn.width / 2 - 6 * D, this.goBtn.y - this.goBtn.height / 2 - 6 * D, this.goBtn.width + 12 * D, this.goBtn.height + 12 * D, this.goBtn.height / 2 + 6 * D);
    this.tweens.add({ targets: this.goRing, alpha: { from: 1, to: 0.2 }, duration: 600, yoyo: true, repeat: -1 });

    state.grid.forEach((t, i) => { if (t) this.spawnCell(i, t, false); });

    this.drag = null;
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.scale.once('resize', () => this.scene.restart());

    // patlama geri sayımı
    this.countText = this.add.text(W / 2, this.gy + this.cell * ROWS / 2, '', { fontFamily: FONT, fontSize: Math.round(this.cell * 0.9) + 'px', fontStyle: '700', color: '#ffe3a8', stroke: '#7a1a12', strokeThickness: 8 * D }).setOrigin(0.5).setDepth(110).setVisible(false);

    this.refreshPhase();
    if (state.phase === 'build') state.time = levelTime();
    if (state.enterFx) { state.enterFx = false; this.playEnterFx(() => this.enterLevel()); }
    else this.enterLevel();
    (window as any).__scene = this; // test ve hata ayıklama için
  }

  // haritadan ya da yeniden kurulumdan sonra levele gir: sonuç, giriş konuşması ya da dükkan
  enterLevel() {
    if (state.phase === 'end' || state.phase === 'boom') { this.showResult(); return; }
    const n = state.round + 1;
    if (state.needIntro && state.round === 0) {
      // ekran yeniden kurulursa (döndürme) konuşma baştan gösterilir; bitince bir daha çıkmaz
      this.showDialog(META.seenIntro ? STORY.again : STORY.intro, () => { state.needIntro = false; META.seenIntro = true; saveMeta(); if (state.shopOpen) this.openShop(); });
      return;
    }
    if (state.shopOpen) { this.openShop(); return; }
    if (state.retry) this.flashTip(`Level ${n} tekrar`, `Fabrika bu levele girerkenki haline döndü. Hedef: ✦ ${RULES.goals[state.round]}`, 0x5fd38a, 3000);
    else if (state.round > 0) this.flashTip(`Level ${n}`, `Hedef: ✦ ${RULES.goals[state.round]}. Hazırsan ▶ Başlat.`, 0x5fd38a, 2500);
    state.retry = false;
  }

  // menüden gelişte: mor perde ve logo, sonra daire açılır; patron levelinde ZOR LEVEL rozeti
  playEnterFx(done) {
    const W = this.W, H = this.H, cx = W / 2, cy = H / 2, Rmax = Math.hypot(W, H) / 2 + 20 * D;
    const iris = this.add.graphics().setDepth(400), o = { r: 0 };
    const draw = () => { iris.clear(); const th = Rmax * 2; iris.lineStyle(th, 0x5b2a9a, 1).strokeCircle(cx, cy, o.r + th / 2); };
    draw();
    const r = Math.min(W, H) * 0.14;
    const logo = this.add.graphics().setDepth(401).setPosition(cx, cy);
    logo.fillStyle(0xe0a26a, 1);
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; logo.fillCircle(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1, r * 0.3); }
    logo.fillCircle(0, 0, r); logo.fillStyle(0x1b2238, 1).fillCircle(0, 0, r * 0.62);
    const star = this.add.star(cx, cy, 5, r * 0.22, r * 0.5, 0xffd84a).setDepth(402);
    logo.setAngle(90);
    this.tweens.add({ targets: [logo, star], scale: 0, duration: 260, delay: 120, ease: 'Back.in' });
    this.tweens.add({ targets: o, r: Rmax, duration: 480, delay: 280, ease: 'Cubic.out', onUpdate: draw, onComplete: () => {
      iris.destroy(); logo.destroy(); star.destroy();
      if (!BOSS[state.round]) { done(); return; }
      // patron leveli uyarısı
      const k = this.add.container(cx, this.gy + this.cell * ROWS / 2).setDepth(390);
      const g = this.add.graphics();
      const s = Math.min(W * 0.26, 110 * D);
      g.fillStyle(0x9a7424, 1).fillCircle(0, 4 * D, s * 0.55); g.fillStyle(0xffd84a, 1).fillCircle(0, 0, s * 0.55);
      const st = this.add.star(0, -s * 0.05, 8, s * 0.42, s * 0.62, 0xffb020);
      const sk = this.add.text(0, -s * 0.05, '☠', { fontFamily: FONT, fontSize: Math.round(s * 0.55) + 'px', color: '#2a1a05' }).setOrigin(0.5);
      const t1 = this.add.text(0, s * 0.65, 'ZOR LEVEL', { fontFamily: FONT, fontSize: Math.round(s * 0.36) + 'px', fontStyle: '700', color: '#ffffff', stroke: '#8a1a14', strokeThickness: 8 * D }).setOrigin(0.5);
      k.add([st, g, sk, t1]);
      const dim = this.add.rectangle(0, 0, W, H, 0x5a0a10, 0.45).setOrigin(0).setDepth(389);
      k.setScale(0);
      beep(180, 0.25, 'sawtooth', 0.15); buzz([60, 40, 60]);
      this.tweens.add({ targets: k, scale: 1, duration: 300, ease: 'Back.out' });
      this.tweens.add({ targets: st, angle: 45, duration: 1200 });
      this.tweens.add({ targets: [k, dim], alpha: 0, delay: 1300, duration: 300, onComplete: () => { k.destroy(); dim.destroy(); done(); } });
    } });
  }

  // hedef tamam ama görev sürüyor: oyun durur, oyuncu seçer
  askContinue(ts) {
    const W = this.W, H = this.H;
    const k = this.add.container(0, 0).setDepth(110);
    const dim = this.add.rectangle(0, 0, W, H, 0x05070d, 0.6).setOrigin(0).setInteractive();
    const cw = Math.min(W - this.pad * 2, 340 * D), ch = cw * 0.78, cx = W / 2, cy = this.gy + this.cell * ROWS / 2;
    const g = this.add.graphics();
    g.fillStyle(C.copperDark, 1).fillRoundedRect(cx - cw / 2, cy - ch / 2 + 6 * D, cw, ch, 22 * D);
    g.fillStyle(0x1d2540, 1).fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 22 * D);
    g.lineStyle(3 * D, 0xffd84a, 1).strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 22 * D);
    const fs = Math.round(cw * 0.06);
    const t1 = this.add.text(cx, cy - ch * 0.36, 'Hedef tamam! ✦', { fontFamily: FONT, fontSize: Math.round(fs * 1.3) + 'px', fontStyle: '700', color: '#7fe3a5' }).setOrigin(0.5);
    const t2 = this.add.text(cx, cy - ch * 0.14, `★ ${taskText(LEVELS[state.round].task)}\n${ts.prog}`, { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#ffe3a8', align: 'center', lineSpacing: 4 * D, wordWrap: { width: cw - 30 * D } }).setOrigin(0.5);
    const t3 = this.add.text(cx, cy + ch * 0.06, 'Süre yıldızı şimdiden hesaplandı. Devam edersen sadece görev için oynarsın.', { fontFamily: FONT, fontSize: Math.round(fs * 0.72) + 'px', fontStyle: '500', color: C.dim, align: 'center', wordWrap: { width: cw - 36 * D } }).setOrigin(0.5);
    const bw = (cw - 40 * D) / 2, bh = Math.min(50 * D, ch * 0.2), by = cy + ch * 0.32;
    const go = makeButton(this, cx - bw / 2 - 6 * D, by, bw, bh, 'Göreve devam', BTN_GO, () => { state.keepGoing = true; k.destroy(); this.choice = null; sfx.pick(); });
    const end = makeButton(this, cx + bw / 2 + 6 * D, by, bw, bh, 'Bitir', BTN_BRASS, () => { state.keepGoing = false; k.destroy(); this.choice = null; this.finishEarly(); });
    k.add([dim, g, t1, t2, t3, go, end]);
    this.choice = k;
    [523, 659].forEach((f, i) => setTimeout(() => beep(f, 0.1, 'triangle', 0.15), i * 90)); buzz(20);
  }

  toggleTheme() {
    if (this.mg || this.dialog || this.drag) return;
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    Object.assign(T, THEMES[state.theme]);
    try { localStorage.setItem('tiktik-theme', state.theme); } catch (e) {}
    sfx.tap();
    this.scene.restart();
  }
  // ---------- üst bilgi ----------
  factoryPts(x0, y0, fw, fh) {
    // testere dişi çatılı fabrika silueti + baca
    const x1 = x0 + fw, y1 = y0 + fh, by = y0 + fh * 0.45, th = fh * 0.2, tw = fw / 3;
    const cx0 = x0 + fw * 0.07, cx1 = x0 + fw * 0.22;
    const slope = (x) => by - th * (1 - (x - x0) / tw);
    return [[x0, y1], [x0, by - th], [cx0, slope(cx0)], [cx0, y0], [cx1, y0], [cx1, slope(cx1)],
      [x0 + tw, by], [x0 + tw, by - th], [x0 + 2 * tw, by], [x0 + 2 * tw, by - th], [x1, by], [x1, y1]]
      .map(([x, y]) => new Phaser.Math.Vector2(x, y));
  }
  buildHud() {
    const W = this.W, pad = this.pad, topH = this.topH;
    const row1 = topH * 0.2, row2 = topH * 0.53, row3 = topH * 0.85;
    const titleSize = Math.round(Math.min(W * 0.058, 24 * D));
    this.add.text(pad, row1 + 2 * D, 'TIK TIK FABRIC', { fontFamily: FONT, fontSize: titleSize + 'px', fontStyle: '700', color: '#6e3518' }).setOrigin(0, 0.5);
    this.add.text(pad, row1, 'TIK TIK FABRIC', { fontFamily: FONT, fontSize: titleSize + 'px', fontStyle: '700', color: '#f0a76a' }).setOrigin(0, 0.5);
    this.roundText = this.add.text(W - pad, row1, '', { fontFamily: FONT, fontSize: Math.round(Math.min(W * 0.034, 14 * D)) + 'px', fontStyle: '700', color: T.hud }).setOrigin(1, 0.5);
    // tema düğmesi (başlığın yanında)
    const tr = Math.min(W * 0.034, 14 * D);
    const tb = this.add.container(pad + Math.min(W * 0.46, 200 * D), row1).setSize(tr * 3, tr * 3).setInteractive();
    const tg = this.add.graphics();
    tg.fillStyle(state.theme === 'dark' ? 0x2c3654 : 0x2b2340, 1).fillCircle(0, 0, tr);
    if (state.theme === 'dark') { tg.fillStyle(0xffd84a, 1).fillCircle(0, 0, tr * 0.45); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; tg.lineStyle(1.6 * D, 0xffd84a, 1).lineBetween(Math.cos(a) * tr * 0.6, Math.sin(a) * tr * 0.6, Math.cos(a) * tr * 0.8, Math.sin(a) * tr * 0.8); } }
    else { tg.fillStyle(0xe9e4ff, 1).fillCircle(0, 0, tr * 0.6); tg.fillStyle(0x2b2340, 1).fillCircle(tr * 0.25, -tr * 0.2, tr * 0.5); }
    tb.add(tg);
    tb.on('pointerup', () => this.toggleTheme());
    this.themeBtn = tb;
    // harita düğmesi (sadece kurulumda)
    const mb = this.add.container(tb.x + tr * 2.9, row1).setSize(tr * 3, tr * 3).setInteractive();
    const mg = this.add.graphics();
    mg.fillStyle(state.theme === 'dark' ? 0x2c3654 : 0x2b2340, 1).fillCircle(0, 0, tr);
    mg.fillStyle(0xffe3a8, 1).fillTriangle(-tr * 0.55, -tr * 0.05, tr * 0.55, -tr * 0.05, 0, -tr * 0.6).fillRect(-tr * 0.38, -tr * 0.08, tr * 0.76, tr * 0.6);
    mg.fillStyle(state.theme === 'dark' ? 0x2c3654 : 0x2b2340, 1).fillRect(-tr * 0.12, tr * 0.18, tr * 0.24, tr * 0.34);
    mb.add(mg);
    mb.on('pointerup', () => { if (state.phase === 'build' && !this.dialog && !this.pickMod) { sfx.tap(); saveRun(); this.scene.start('menu', { tab: 'home' }); } });
    this.mapBtn = mb;
    const fs = Math.round(Math.min(W * 0.042, 17 * D));

    // basınç: sağda içi dolan fabrika
    const fw = Math.min(W * 0.2, 84 * D), fh = topH * 0.6;
    const fx = W - pad - fw, fy = topH * 0.37;
    this.fac = { x: fx, y: fy, w: fw, h: fh };
    const pts = this.factoryPts(fx, fy, fw, fh);
    const back = this.add.graphics();
    back.fillStyle(0x000000, 0.3).fillPoints(pts.map(p => new Phaser.Math.Vector2(p.x, p.y + 3 * D)), true);
    back.fillStyle(T.barBg, 1).fillPoints(pts, true);
    this.facFill = this.add.graphics();
    const maskG = this.make.graphics({ add: false } as any);
    maskG.fillStyle(0xffffff, 1).fillPoints(pts, true);
    this.facFill.setMask(maskG.createGeometryMask());
    const line = this.add.graphics();
    line.lineStyle(2.5 * D, T.facLine, 1).strokePoints(pts, true);
    this.pLabel = this.add.text(fx + fw / 2, fy + fh * 0.53, 'BASINÇ', { fontFamily: FONT, fontSize: Math.round(fs * 0.55) + 'px', fontStyle: '700', color: '#c9d2ee', stroke: '#0b0f1c', strokeThickness: 3 * D }).setOrigin(0.5);
    this.pText = this.add.text(fx + fw / 2, fy + fh * 0.8, '', { fontFamily: FONT, fontSize: Math.round(fs * 1.05) + 'px', fontStyle: '700', color: '#f6ecdb', stroke: '#0b0f1c', strokeThickness: 4 * D }).setOrigin(0.5);
    this.chimney = { x: fx + fw * 0.145, y: fy };

    // sol alan: hedef çubuğu, kaynaklar, soğutma
    const L = fx - 12 * D - pad;
    const barH = Math.max(18 * D, fs * 1.35);
    this.bar = { x: pad, y: row2 - barH / 2, w: L, h: barH };
    this.barG = this.add.graphics();
    this.sparkText = this.add.text(pad + L / 2, row2, '', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '700', color: '#1a1405' }).setOrigin(0.5);
    const vbW = Math.min(L * 0.42, 124 * D), vbH = Math.max(26 * D, fs * 1.55);
    this.ventBtn = makeButton(this, pad + L - vbW / 2, row3, vbW, vbH, `❄ Soğut ${RULES.ventCost}💎`, { base: 0x8fb4ff, dark: 0x3e62b0, text: '#0d1a33' }, () => this.vent());
    const restW = L - vbW - 6 * D, fs2 = Math.round(fs * 0.92);
    const mk = (i, key) => this.add.text(pad + restW * (i / 3), row3, '', { fontFamily: FONT, fontSize: fs2 + 'px', fontStyle: '700', color: key }).setOrigin(0, 0.5);
    this.energyText = mk(0, T.energy);
    this.moneyText = mk(1, T.money);
    this.timeText = mk(2, T.hud);
    this.lastRes = {};
    this.updateHud(true);
  }

  updateHud(force) {
    const r = state.res, goal = RULES.goals[state.round];
    this.roundText.setText(`Bölüm ${this.chapter() + 1} · Level ${state.round + 1}${BOSS[state.round] ? ' ☠' : ''}`).setColor(BOSS[state.round] ? (state.theme === 'light' ? '#c0392b' : '#ff8a7c') : T.hud);
    const b = this.bar, g = this.barG, f = Math.min(1, r.spark / goal);
    g.clear();
    g.fillStyle(T.barBg, 1).fillRoundedRect(b.x, b.y, b.w, b.h, b.h / 2);
    if (f > 0) {
      g.fillStyle(f >= 1 ? 0x5fd38a : 0xe0a72a, 1).fillRoundedRect(b.x, b.y, Math.max(b.h, b.w * f), b.h, b.h / 2);
      g.fillStyle(0xffffff, 0.25).fillRoundedRect(b.x + b.h * 0.3, b.y + b.h * 0.15, Math.max(0, b.w * f - b.h * 0.6), b.h * 0.22, b.h * 0.1);
    }
    g.lineStyle(2 * D, T.barLine, 1).strokeRoundedRect(b.x, b.y, b.w, b.h, b.h / 2);
    this.sparkText.setText(`✦ ${r.spark} / ${goal}`).setColor(f > 0.45 ? '#1a1405' : T.barText);
    this.energyText.setText(`⚡ ${r.energy}`);
    this.moneyText.setText(`💎 ${r.money}`);
    const t = Math.ceil(state.time);
    this.timeText.setText(`⏱ ${t}`).setColor(state.phase === 'run' && t <= 10 ? (state.theme === 'light' ? '#c0392b' : '#ff7a6b') : T.hud);
    // fabrika dolumu
    const fa = this.fac, pf = Math.min(1, state.pressure / 100), fg = this.facFill;
    fg.clear();
    if (pf > 0) {
      let col = pf >= 1 ? 0xe0564a : pf > 0.8 ? 0xe0564a : pf > 0.55 ? 0xff8a3c : 0xc8743a;
      if (pf >= 1 && Math.floor(this.time.now / 180) % 2) col = 0xffe3a8;
      const h = fa.h * pf, top = fa.y + fa.h - h;
      const wave = Math.sin(this.time.now / 260) * 2 * D;
      fg.fillStyle(col, 1).fillRect(fa.x, top + wave, fa.w * 0.5, h).fillRect(fa.x + fa.w * 0.5, top - wave, fa.w * 0.5, h);
      fg.fillStyle(0xffffff, 0.22).fillRect(fa.x, top + wave, fa.w * 0.5, 2.5 * D).fillRect(fa.x + fa.w * 0.5, top - wave, fa.w * 0.5, 2.5 * D);
    }
    const pInt = Math.floor(state.pressure);
    this.pText.setText(`%${pInt}`);
    if (this.lastP !== undefined && pInt >= this.lastP + 5 && !force) {
      this.tweens.killTweensOf(this.pText); this.pText.setScale(1);
      this.tweens.add({ targets: this.pText, scale: 1.2, duration: 90, yoyo: true });
    }
    if (force || Math.abs(pInt - (this.lastP ?? 0)) >= 5) this.lastP = pInt;
    ['spark', 'energy', 'money'].forEach(k => {
      if (!force && this.lastRes[k] !== undefined && r[k] > this.lastRes[k]) {
        const txt = k === 'spark' ? this.sparkText : k === 'energy' ? this.energyText : this.moneyText;
        this.tweens.killTweensOf(txt); txt.setScale(1);
        this.tweens.add({ targets: txt, scale: 1.12, duration: 70, yoyo: true });
      }
      this.lastRes[k] = r[k];
    });
  }

  vent() {
    if (state.phase !== 'build' || !state.heat.some(h => h > 0.01)) return;
    if (state.res.money < RULES.ventCost) {
      this.cameras.main.shake(80, 0.004); sfx.bad();
      this.flashTip('Yeterli para yok', `Soğutmak için ${RULES.ventCost} 💎 gerekiyor. Basıcı para üretir.`, MACHINES.mint.color, 2200);
      return;
    }
    state.res.money -= RULES.ventCost;
    state.heat = state.heat.map(h => Math.max(0, h - RULES.ventCool));
    beep(900, 0.25, 'sawtooth', 0.06); setTimeout(() => beep(500, 0.3, 'sawtooth', 0.05), 80); buzz(30);
    const smoke = this.add.particles(0, 0, 'spark', { speed: { min: 30 * D, max: 120 * D }, angle: { min: 240, max: 300 }, lifespan: 700, scale: { start: 0.8 * D, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [0xdfe6f5, 0x8fb4ff], emitting: false }).setDepth(60);
    this.cells.forEach((v, i) => { if (v) { const c = this.cellCenter(i); smoke.explode(8, c.x, c.y); } });
    smoke.explode(16, this.ventBtn.x, this.ventBtn.y);
    this.time.delayedCall(800, () => smoke.destroy());
    this.refreshPhase();
  }

  refreshPhase() {
    saveRun();
    if (state.phase === 'build') state.pressure = this.computePressure();
    const canVent = state.phase === 'build' && state.heat.some(h => h > 0.01);
    this.ventBtn.setAlpha(canVent ? (state.res.money >= RULES.ventCost ? 1 : 0.5) : 0.25);
    const build = state.phase === 'build';
    this.goBtn.setVisible(build);
    this.goBtn.label.setText('▶  Başlat');
    this.slots.forEach(s => { s.vis.setAlpha(build && state.places > 0 ? 1 : 0.35); s.name.setAlpha(build && state.places > 0 ? 1 : 0.35); s.recipe.setAlpha(s.name.alpha); });
    if (build) {
      const n = state.grid.filter(Boolean).length;
      this.hint.setText(state.places > 0
        ? `${state.places} yerleştirme hakkın var. Makineye dokun: döndür.`
        : (n ? 'Hakların bitti. Döndürebilir, taşıyabilir ya da başlatabilirsin.' : ''));
      this.goBtn.setAlpha(n ? 1 : 0.45);
    } else if (state.phase === 'run') {
      this.hint.setText('Isınan makineye (!) dokun, mini oyunla soğut.');
    }
    this.updateHud(true);
    this.tutorial();
  }

  update(_, dtMs) {
    const dt = dtMs / 1000;
    // türe özel hareket: çalışan makine hızlı, inşada yavaş, duran makine hareketsiz
    this.cells.forEach(v => {
      if (!v || !v.tick) return;
      const sp = state.phase === 'run' ? (v.svc === 'broken' || v.stalled === 'power' || v.stalled === 'blocked' || this.mg || this.dialog ? 0 : 1) : state.phase === 'build' ? 0.25 : 0;
      v.tick(dtMs, sp);
    });
    this.slots.forEach(s => { if (s.vis.tick) s.vis.tick(dtMs, 0.25); });
    // tur boyunca yıldız görevinin ilerlemesi alttaki yazıda
    if (state.phase === 'run' && state.task && state.tutorialDone) {
      this.taskT = (this.taskT || 0) + dt;
      if (this.taskT > 0.3) {
        this.taskT = 0;
        const ts = taskState(LEVELS[state.round].task, state.task);
        this.hint.setText(`★ ${taskText(LEVELS[state.round].task)}\n${ts.failed ? '✗ ' : ts.ok ? '✓ ' : ''}${ts.prog}`).setColor(ts.failed ? '#ff8a7c' : ts.ok ? '#7fe3a5' : T.hudDim);
      }
    } else if (this.hint.style.color !== T.hudDim) this.hint.setColor(T.hudDim);
    this.drawGold();
    this.drawDanger(dtMs);
    this.cells.forEach((v, i) => { if (v) this.drawHeat(v, i); });
    this.drawLinks();
    this.chimneySmoke(dt);
    this.tutT = (this.tutT || 0) + dt;
    if (this.tutT > 0.25) { this.tutT = 0; this.tutorial(); }
    if (state.phase !== 'run' || this.dialog || this.choice) { if (state.phase === 'build') this.updateHud(false); return; }

    state.time -= dt;
    // önce Krank'lar, sonra tüketiciler
    ['crank', 'press', 'mint'].forEach(type => {
      this.cells.forEach((v, i) => {
        if (!v || v.type !== type) return;
        v.t = (v.t || 0) + dt * this.speedOf(v, i);
        const every = PROD[type].every;
        if (v.t >= every) { v.t -= every; this.produce(i, v); }
        v.setAlpha(v.svc === 'broken' ? 0.45 : (v.stalled === 'power' || v.stalled === 'blocked') ? 0.6 : 1);
      });
    });
    this.cells.forEach(v => { if (v && v.type === 'fan') v.setAlpha(v.svc === 'broken' ? 0.45 : 1); });
    state.res.energy = state.buf.reduce((a, b) => a + b, 0);
    if (!this.mg) Music.tick(this.cells.filter((v, i) => v && v.type === 'fan' && state.heat[i] < 1).length, state.pressure);
    this.tickHeat(dt);
    this.tickJolt(dt);
    this.tickGold(dt);
    this.mgUpdate(dt);
    this.tickPressure(dt);
    if (state.phase !== 'run') return;
    const prev = Math.ceil(state.time + dt);
    if (Math.ceil(state.time) !== prev && state.time <= 5 && state.time > 0) { beep(1200, 0.05, 'square', 0.1); buzz(6); }
    this.updateHud(false);
    // hedef tutunca tur biter; kalan süre kadar 💎 bonus verilir.
    // Yıldız görevi hâlâ yapılabiliyorsa önce sorulur: göreve devam et ya da bitir.
    if (this.canFinish()) {
      if (state.goalHitT == null) state.goalHitT = state.time;
      const ts = taskState(LEVELS[state.round].task, state.task);
      if (ts.ok || ts.failed || state.keepGoing === false) { this.finishEarly(); return; }
      if (state.keepGoing == null && !this.mg) { this.askContinue(ts); return; }
    }
    if (state.time <= 0) { state.time = 0; this.endRound(); }
  }

  chimneySmoke(dt) {
    // basınç yükseldikçe bacadan duman çıkar
    const p = state.pressure;
    if (p < 25 || state.phase === 'boom') return;
    this.smokeT = (this.smokeT || 0) + dt * (0.6 + p / 40);
    if (this.smokeT < 1) return;
    this.smokeT = 0;
    const c = this.chimney, r = this.fac.w * 0.07;
    const puff = this.add.circle(c.x, c.y - r, r, p >= 80 ? 0x7a5048 : 0x8a90a6, 0.7).setDepth(3);
    this.tweens.add({ targets: puff, x: c.x + Phaser.Math.FloatBetween(-4, 10) * D, y: c.y - r * 6, scale: 2.2, alpha: 0, duration: 1100, onComplete: () => puff.destroy() });
  }

  // ---------- yardımcılar ----------
  drawGrid() {
    const g = this.gridG, s = this.cell, gap = Math.max(2, s * 0.04), rr = s * 0.14;
    g.clear();
    const wx = this.gx - 8 * D, wy = this.gy - 8 * D, ww = s * COLS + 16 * D, wh = s * ROWS + 16 * D;
    g.fillStyle(T.frame, 1).fillRoundedRect(wx - T.frameW * D, wy - T.frameW * D, ww + T.frameW * 2 * D, wh + T.frameW * 2 * D, 18 * D);
    g.fillStyle(T.well, 1).fillRoundedRect(wx, wy, ww, wh, 15 * D);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = this.gx + c * s + gap, y = this.gy + r * s + gap, w = s - gap * 2;
      g.fillStyle(T.cellLo, 1).fillRoundedRect(x, y, w, w, rr);
      g.fillStyle(T.cell, 1).fillRoundedRect(x, y + 2 * D, w, w - 2 * D, rr);
      if (T.cellLine) g.lineStyle(1 * D, T.cellLine, 0.15).strokeRoundedRect(x, y, w, w, rr);
      g.fillStyle(T.cellHi, 0.5).fillRoundedRect(x + w * 0.2, y + w - 4 * D, w * 0.6, 2 * D, 1 * D);
    }
    [[wx + 10 * D, wy + 10 * D], [wx + ww - 10 * D, wy + 10 * D], [wx + 10 * D, wy + wh - 10 * D], [wx + ww - 10 * D, wy + wh - 10 * D]]
      .forEach(([x, y]) => rivet(g, x, y, 3.5 * D));
  }
  cellCenter(i) {
    const c = i % COLS, r = Math.floor(i / COLS);
    return { x: this.gx + c * this.cell + this.cell / 2, y: this.gy + r * this.cell + this.cell / 2 };
  }
  cellAt(x, y) {
    const c = Math.floor((x - this.gx) / this.cell), r = Math.floor((y - this.gy) / this.cell);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return -1;
    return r * COLS + c;
  }
  spawnCell(i, type, animate) {
    const p = this.cellCenter(i);
    const v = drawMachine(this, type, this.cell * 0.78).setPosition(p.x, p.y).setDepth(10 + Math.floor(i / COLS));
    v.t = 0; v.cd = 0;
    v.heatG = this.add.graphics();
    v.add(v.heatG);
    this.cells[i] = v;
    this.drawHeat(v, i);
    if (animate) {
      v.y -= this.cell * 0.25; v.setScale(1.15);
      this.tweens.add({ targets: v, y: p.y, scale: 1, duration: 180, ease: 'Bounce.easeOut' });
      this.time.delayedCall(90, () => this.sparks.explode(14, p.x, p.y + this.cell * 0.35));
    }
  }
  ghostY(y) { return y - this.cell * 0.7; }

  // ---------- dokunma ----------
  onDown(p) {
    if (this.dialog || this.shop) return;
    if (state.phase === 'end' || state.phase === 'boom') return;
    if (this.mg) { const f = this['mgDown_' + this.mg.type]; if (f) f.call(this, this.mg, p); return; }
    if (state.phase === 'build' && state.places > 0 && p.y > this.slotTop) {
      const slot = this.slots.find(s => Math.abs(p.x - s.x) < s.r);
      if (slot) {
        this.startDrag(slot.type, -1, p);
        this.showInfo(slot.type);
        this.tweens.add({ targets: slot.vis, scale: 0.85, duration: 60, yoyo: true });
        return;
      }
    }
    if (p.y > this.slotTop) {
      const slot = this.slots.find(s => Math.abs(p.x - s.x) < s.r);
      if (slot) { this.showInfo(slot.type); return; }
    }
    const i = this.cellAt(p.x, p.y);
    if (i >= 0 && state.grid[i]) this.pending = { i, x: p.x, y: p.y };
  }

  startDrag(type, from, p) {
    const ghost = drawMachine(this, type, this.cell * 0.86).setDepth(30);
    ghost.setPosition(p.x, this.ghostY(p.y));
    this.tweens.add({ targets: ghost, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.drag = { type, from, ghost, rot: null, heat: 0 };
    if (from >= 0) {
      this.drag.rot = state.rot[from]; this.drag.heat = state.heat[from] || 0; this.drag.mod = state.mod[from];
      state.rot[from] = null; state.heat[from] = 0; state.mod[from] = null;
      this.setAlert(this.cells[from], null);
      this.cells[from].destroy();
      this.cells[from] = null;
      state.grid[from] = null;
      this.trashBg.setVisible(true);
      this.trashText.setVisible(true);
    }
    sfx.pick();
    this.updateHighlight(p);
  }

  onMove(p) {
    if (this.dialog || this.shop) return;
    if (this.mg) { const f = this['mgMove_' + this.mg.type]; if (f) f.call(this, this.mg, p); return; }
    if (this.pending && !this.drag) {
      // makineler yalnızca inşa evresinde taşınır
      if (state.phase === 'build' && Phaser.Math.Distance.Between(p.x, p.y, this.pending.x, this.pending.y) > 10 * D) {
        const { i } = this.pending;
        const type = state.grid[i];
        this.pending = null;
        this.startDrag(type, i, p);
      }
      return;
    }
    if (!this.drag) return;
    this.drag.ghost.setPosition(p.x, this.ghostY(p.y));
    this.updateHighlight(p);
  }

  updateHighlight(p) {
    const g = this.hl; g.clear();
    if (p.y > this.trayTop) return;
    const i = this.cellAt(p.x, this.ghostY(p.y));
    if (i < 0) return;
    const c = i % COLS, r = Math.floor(i / COLS), s = this.cell, gap = Math.max(2, s * 0.04);
    const ok = !state.grid[i];
    g.fillStyle(ok ? C.ok : C.bad, 0.18).fillRoundedRect(this.gx + c * s + gap, this.gy + r * s + gap, s - gap * 2, s - gap * 2, s * 0.14);
    g.lineStyle(3 * D, ok ? C.ok : C.bad, 1).strokeRoundedRect(this.gx + c * s + gap, this.gy + r * s + gap, s - gap * 2, s - gap * 2, s * 0.14);
  }

  onUp(p) {
    if (this.dialog || this.shop) return;
    if (this.mg) { const f = this['mgUp_' + this.mg.type]; if (f) f.call(this, this.mg, p); return; }
    if (this.pending && !this.drag) {
      const i = this.pending.i, v = this.cells[i];
      this.pending = null;
      if (v) {
        this.tweens.killTweensOf(v); v.setScale(1);
        this.tweens.add({ targets: v, scaleX: 1.1, scaleY: 0.88, duration: 55, yoyo: true });
        this.sparks.explode(10, p.x, p.y);
        sfx.tap();
        if (state.phase === 'run') {
          if ((state.heat[i] || 0) >= RULES.tapAt) this.openMinigame(i);
          else this.flashTip('Henüz soğuk', 'Isı çubuğu dolmaya başlayınca bakım yapabilirsin. ! çıkınca acele et.', MACHINES[v.type].color, 1800);
        }
        if (state.phase === 'build' && this.pickMod) { this.attachMod(i); return; }
        if (state.phase === 'build') {
          // dokununca döndür
          state.rot[i] = (this.rotOf(i) + 1) % 4;
          beep(520, 0.05, 'triangle', 0.12);
          this.showInfo(v.type);
          this.refreshPhase();
        }
      }
      return;
    }
    if (!this.drag) return;
    const { type, from, ghost } = this.drag;
    this.drag_rot = this.drag.rot; this.drag_heat = this.drag.heat; this.drag_mod = this.drag.mod || null;
    this.drag = null;
    this.tweens.killTweensOf(ghost);
    this.hl.clear();
    this.trashBg.setVisible(false);
    this.trashText.setVisible(false);

    const inTray = p.y > this.trayTop;
    const i = inTray ? -1 : this.cellAt(p.x, this.ghostY(p.y));
    if (i >= 0 && !state.grid[i]) {
      ghost.destroy();
      state.grid[i] = type;
      state.rot[i] = this.drag_rot; state.heat[i] = this.drag_heat; state.mod[i] = from >= 0 ? this.drag_mod : null;
      if (from < 0) state.places--;
      this.spawnCell(i, type, true);
      sfx.place();
    } else if (from >= 0 && (i < 0 || inTray)) {
      // kaldırılan makine hakkı geri verir
      state.places++;
      this.tweens.add({ targets: ghost, scale: 0, angle: 90, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
      sfx.trash();
    } else if (from >= 0) {
      ghost.destroy();
      state.grid[from] = type;
      state.rot[from] = this.drag_rot; state.heat[from] = this.drag_heat; state.mod[from] = this.drag_mod;
      this.spawnCell(from, type, false);
      this.cameras.main.shake(80, 0.004);
      sfx.bad();
    } else {
      if (i >= 0) { this.cameras.main.shake(80, 0.004); sfx.bad(); }
      this.tweens.add({ targets: ghost, alpha: 0, scale: 0.5, duration: 150, onComplete: () => ghost.destroy() });
    }
    this.refreshPhase();
  }
}

// parçaların yöntemlerini sahneye ekle
for (const P of [ShopPart, FlowPart, PlacementPart, HeatPart, DialogPart, MinigamePart]) {
  for (const n of Object.getOwnPropertyNames(P.prototype)) {
    if (n !== 'constructor') Object.defineProperty(Build.prototype, n, Object.getOwnPropertyDescriptor(P.prototype, n)!);
  }
}
