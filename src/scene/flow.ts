import Phaser from 'phaser';
import { Music, beep, boomSound, buzz, sfx } from '../audio';
import { INFO, MACHINES } from '../data/machines';
import { BOSS, DIRS, PROD, RES, RULES } from '../data/rules';
import { STORY } from '../data/story';
import { BTN_BRASS, BTN_GO, makeButton } from '../draw';
import { META, clearRun, loadRun, newRun, saveMeta, saveRun, starsFor, state } from '../state';
import { C, COLS, D, FONT, ROWS } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class FlowPart {
  [key: string]: any;

  // ---------- açıklama kartı ----------
  setBanner(title, body, accent) {
    const { w, h } = this.bannerSize, g = this.bannerG;
    g.clear();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(0, 4 * D, w, h, 16 * D);
    g.fillStyle(0x232c4a, 0.97).fillRoundedRect(0, 0, w, h, 16 * D);
    g.lineStyle(2 * D, accent || C.brass, 1).strokeRoundedRect(0, 0, w, h, 16 * D);
    this.bannerT1.setText(title);
    this.bannerT2.setText(body);
    this.banner.setVisible(true);
  }
  showInfo(type) {
    const m = MACHINES[type], info = INFO[type];
    this.setBanner(info.title + '   ' + info.recipe, info.body, m.color);
    this.infoUntil = this.time.now + 2800;
  }
  tutorial() {
    // ilk turda adım adım yol göster
    this.slots.forEach(s => s.ring.setVisible(false));
    this.goRing.setVisible(false);
    if (this.dialog) return;
    if (this.infoUntil && this.time.now < this.infoUntil) return;
    if (state.round !== 0 || state.tutorialDone) {
      this.banner.setVisible(false);
      return;
    }
    const has = t => state.grid.includes(t);
    if (state.phase === 'build') {
      const presses = state.grid.map((t, i) => t === 'press' ? i : -1).filter(i => i >= 0);
      if (!has('crank')) {
        this.setBanner('1 / 3   Önce bir Krank koy', 'Krank enerji ⚡ üretir ama sadece mavi oklarının gösterdiği 2 komşuya verir.', MACHINES.crank.color);
        this.slots[0].ring.setVisible(true);
      } else if (!presses.length) {
        this.setBanner('2 / 3   Pres\'i Krank\'ın okunun önüne koy', 'Mavi okun gösterdiği kareye konan Pres enerji alır. Makineye dokunursan döner.', MACHINES.press.color);
        this.slots[1].ring.setVisible(true);
      } else if (!presses.some(i => this.suppliers(i).length)) {
        this.setBanner('⚠ Pres enerji alamıyor!', 'Kırmızı çerçeve: enerji yok. Krank\'a dokunup döndür ya da Pres\'i mavi okun önüne taşı.', 0xe0564a);
      } else if (presses.every(i => this.outputBlocked(i))) {
        this.setBanner('⚠ Pres\'in çıkışı kapalı!', 'Sarı ok boş bir kareyi göstermeli; kıvılcım oradan çıkar. Pres\'e dokunup döndür.', 0xe0564a);
      } else {
        this.setBanner('3 / 3   Hazırsın! ▶ Başlat\'a bas', `Mavi çizgi = enerji bağlantısı. 60 saniyede ✦ ${RULES.goals[0]} topla.`, 0x5fd38a);
        this.goRing.setVisible(true);
      }
    } else if (state.phase === 'run') {
      if (state.time > RULES.roundTime - 9) {
        this.setBanner('Makineler çalıştıkça ısınır', 'Alttaki çubuk ısıyı gösterir. Dolunca ! çıkar: dokun, mini oyunla soğut. Tamamen ısınan makine durur.', 0xffc23d);
      } else {
        this.banner.setVisible(false);
        state.tutorialDone = true; META.tutorialDone = true; saveMeta();
      }
    }
  }

  // ---------- tur akışı ----------
  canFinish() { return state.phase === 'run' && state.res.spark >= RULES.goals[state.round]; }
  earlyBonus() { return Math.floor(Math.max(0, state.time) / RULES.bonusEvery); }
  finishEarly() {
    if (!this.canFinish()) return;
    const bonus = this.earlyBonus();
    state.res.money += bonus;
    this.endRound(bonus);
  }

  startRound() {
    if (state.phase !== 'build') return;
    if (this.pickMod) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    state.shopOpen = false;
    if (!state.grid.some(Boolean)) { this.cameras.main.shake(80, 0.004); sfx.bad(); return; }
    state.phase = 'run';
    Music.reset();
    state.time = RULES.roundTime;
    state.res.spark = 0;
    state.res.energy = 0;
    state.buf.fill(0);
    state.boomT = this.boomDelay();
    // her makine biraz farklı ısınır, böylece uyarılar aynı anda gelmez
    this.cells.forEach((v, i) => {
      if (!v) return;
      v.t = 0; v.boost = null; v.stalled = false; v.svc = 'ok';
      v.rateJ = Phaser.Math.FloatBetween(0.8, 1.2);
      state.heat[i] = Math.max(state.heat[i] || 0, Phaser.Math.FloatBetween(0, 0.25));
    });
    state.joltT = BOSS[state.round] && BOSS[state.round].jolt;
    if (BOSS[state.round]) this.flashTip('☠ Patron leveli: ' + BOSS[state.round].name, BOSS[state.round].desc, 0xe0564a, 3500);
    beep(392, 0.12, 'triangle', 0.2); setTimeout(() => beep(523, 0.12, 'triangle', 0.2), 110); setTimeout(() => beep(784, 0.2, 'triangle', 0.2), 220);
    buzz(30);
    this.refreshPhase();
  }

  endRound(bonus = 0) {
    if (this.mg) { this.mg.panel.destroy(); this.mg = null; }
    this.countText.setVisible(false);
    this.cells.forEach(v => { if (v) { this.setAlert(v, null); v.setAlpha(1); v.svc = 'ok'; } });
    const goal = RULES.goals[state.round];
    const won = state.res.spark >= goal;
    const before = state.pressure;
    // tur arası: makineler biraz soğur; hedef tutmazsa eksik oranında ısınır
    const miss = won ? 0 : 1 - state.res.spark / goal;
    state.grid.forEach((t, i) => {
      if (!t) return;
      const h = state.heat[i] * RULES.carryHeat;
      state.heat[i] = Phaser.Math.Clamp(won ? h - RULES.winCool : h + miss * RULES.missHeat, 0, 1);
    });
    state.pressure = this.computePressure();
    const delta = Math.round(state.pressure - before);
    state.phase = 'end';
    state.result = { won, spark: state.res.spark, goal, bonus, delta, round: state.round, last: state.round === RULES.goals.length - 1 };
    if (state.pressure >= 100) { this.explode(); return; }
    if (won) {
      // level geçildi: yıldız, hurda ve kumbara
      const R = state.result, n = state.round;
      R.stars = starsFor(state.time);
      META.stars[n] = Math.max(META.stars[n] || 0, R.stars);
      R.scrap = this.awardScrap(R.stars, !!BOSS[n]);
      R.piggy = META.lv.money; state.res.money += R.piggy;
      saveMeta();
    }
    this.refreshPhase();
    if (state.result.last && won) this.showDialog(STORY.win, () => this.showResult());
    else this.showResult();
    if (won) { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.2), i * 100)); buzz([20, 40, 20]); }
    else { beep(220, 0.3, 'sawtooth', 0.15); setTimeout(() => beep(150, 0.4, 'sawtooth', 0.15), 200); buzz(120); }
  }

  // ---------- patlama ----------
  explode() {
    if (this.boomed) return;
    this.boomed = true;
    if (this.mg) { this.mg.panel.destroy(); this.mg = null; }
    state.phase = 'boom';
    state.pressure = 100;
    this.countText.setVisible(false);
    this.cells.forEach(v => { if (v) this.setAlert(v, null); });
    this.banner.setVisible(false); this.infoUntil = 0;
    state.result = Object.assign(state.result || {}, { boom: true, round: state.round });
    this.updateHud(true);
    this.refreshPhase();
    const W = this.W, H = this.H;
    // önce titreme ve siren, sonra BUM
    this.cells.forEach(v => { if (v) this.tweens.add({ targets: v, x: v.x + 3 * D, duration: 40, yoyo: true, repeat: 8 }); });
    [880, 660, 880, 660].forEach((f, k) => setTimeout(() => beep(f, 0.12, 'square', 0.12), k * 130));
    this.cameras.main.shake(600, 0.004);
    this.time.delayedCall(600, () => {
      boomSound(); buzz([200, 60, 300]);
      this.cameras.main.shake(700, 0.03);
      const flash = this.add.rectangle(0, 0, W, H, 0xfff2c4, 1).setOrigin(0).setDepth(95);
      this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
      const cx = this.gx + this.cell * COLS / 2, cy = this.gy + this.cell * ROWS / 2;
      if (!this.textures.exists('smoke')) {
        const t = this.make.graphics({ add: false });
        t.fillStyle(0xffffff, 1).fillCircle(32, 32, 32);
        t.generateTexture('smoke', 64, 64); t.destroy();
      }
      const fire = this.add.particles(0, 0, 'spark', {
        speed: { min: 200 * D, max: 900 * D }, angle: { min: 0, max: 360 }, lifespan: 900,
        scale: { start: 1.4 * D, end: 0 }, tint: [0xffd84a, 0xff8a3c, 0xffffff, 0xe0564a], gravityY: 500 * D,
        blendMode: 'ADD', emitting: false,
      }).setDepth(92);
      const smoke = this.add.particles(0, 0, 'smoke', {
        speed: { min: 30 * D, max: 160 * D }, angle: { min: 0, max: 360 }, lifespan: 1800,
        scale: { start: 0.6 * D, end: 2.2 * D }, alpha: { start: 0.5, end: 0 }, tint: [0x3a3f52, 0x55596b, 0x2a2e3c],
        emitting: false,
      }).setDepth(91);
      fire.explode(120, cx, cy);
      this.cells.forEach((v, i) => {
        if (!v) return;
        fire.explode(14, v.x, v.y); smoke.explode(4, v.x, v.y);
        const a = Math.atan2(v.y - cy, v.x - cx) + Phaser.Math.FloatBetween(-0.5, 0.5);
        const dist = Phaser.Math.FloatBetween(0.6, 1.1) * Math.max(W, H);
        this.tweens.add({ targets: v, x: v.x + Math.cos(a) * dist, y: v.y + Math.sin(a) * dist - H * 0.2, angle: Phaser.Math.Between(-540, 540), scale: 1.4, duration: 1100, ease: 'Quad.easeOut' });
      });
      smoke.explode(18, cx, cy);
      this.gridG.setAlpha(0.5);
      this.time.delayedCall(1500, () => this.showDialog(STORY.boom, () => this.showResult()));
    });
  }

  showResult() {
    if (this.resultBox) this.resultBox.destroy();
    const W = this.W, H = this.H, R = state.result;
    const k = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(0, 0, W, H, 0x05070d, 0.72).setOrigin(0).setInteractive();
    const cw = Math.min(W - this.pad * 2, 360 * D), ch = cw * 1.02;
    const cx = W / 2, cy = H * 0.45;
    const good = R.won && !R.boom;
    const g = this.add.graphics();
    g.fillStyle(C.copperDark, 1).fillRoundedRect(cx - cw / 2, cy - ch / 2 + 6 * D, cw, ch, 22 * D);
    g.fillStyle(0x1d2540, 1).fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 22 * D);
    g.lineStyle(3 * D, good ? 0x5fd38a : R.boom ? 0xff8a3c : 0xe0564a, 1).strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 22 * D);
    const n = R.round + 1;
    let title, big, sub, label, style, action;
    if (R.boom || !R.won) {
      title = R.boom ? 'FABRİKA PATLADI!' : 'Hedef tutmadı';
      big = R.boom ? `Level ${n}` : `✦ ${R.spark} / ${R.goal}`;
      sub = R.boom && R.round === 0 ? 'Bir türün bütün makineleri kızınca basınç %100 olur.\nIsınanları mini oyunla soğut, Fan 2×2 alanı korur.'
        : `Level ${n} tekrar oynanacak.\nFabrika bu levele girerkenki haline döner.`;
      label = '↻  Tekrar dene'; style = BTN_GO; action = 'retry';
    } else {
      title = R.last ? 'Bütün leveller bitti!' : `Level ${n} geçildi!`;
      big = '★'.repeat(R.stars) + '☆'.repeat(3 - R.stars);
      const extra = [];
      if (R.bonus) extra.push(`Erken bitirme: +${R.bonus} 💎`);
      if (R.piggy) extra.push(`Kumbara: +${R.piggy} 💎`);
      extra.push(`+${R.scrap} 🔩 hurda`);
      sub = extra.join('   ') + '\n' + (R.last ? 'Festival fenerleri senin sayende yanıyor!' : (BOSS[R.round + 1] ? `Sonraki: ☠ Patron leveli (✦ ${RULES.goals[R.round + 1]})` : `Sonraki: Level ${n + 1} (✦ ${RULES.goals[R.round + 1]})  ·  +${RULES.placesPerRound} hak`));
      label = R.last ? 'Haritaya dön' : 'Dükkana git  ▶'; style = BTN_GO; action = R.last ? 'map' : 'next';
    }
    const t1 = this.add.text(cx, cy - ch * 0.36, title, { fontFamily: FONT, fontSize: Math.round(cw * (R.boom ? 0.088 : 0.09)) + 'px', fontStyle: '700', color: good ? '#7fe3a5' : R.boom ? '#ffb36b' : '#ff8a7c' }).setOrigin(0.5);
    const t2 = this.add.text(cx, cy - ch * 0.2, big, { fontFamily: FONT, fontSize: Math.round(cw * (good ? 0.12 : 0.08)) + 'px', fontStyle: '700', color: '#ffd84a' }).setOrigin(0.5);
    const t3 = this.add.text(cx, cy - ch * 0.01, sub, { fontFamily: FONT, fontSize: Math.round(cw * 0.042) + 'px', fontStyle: '500', color: C.dim, align: 'center', lineSpacing: 4 * D, wordWrap: { width: cw - 28 * D } }).setOrigin(0.5);
    const bh = Math.min(ch * 0.16, 52 * D);
    const btn = makeButton(this, cx, cy + ch * 0.2, cw * 0.72, bh, label, style, () => this.afterResult(action));
    k.add([dim, g, t1, t2, t3, btn]);
    if (action !== 'map') k.add(makeButton(this, cx, cy + ch * 0.2 + bh * 1.2, cw * 0.5, bh * 0.8, '⌂  Harita', BTN_BRASS, () => this.afterResult('map')));
    k.setAlpha(0); this.tweens.add({ targets: k, alpha: 1, duration: 200 });
    this.resultBox = k;
  }

  // sonuç ekranından: 'next' sonraki level (önce dükkan), 'retry' aynı level, 'map' harita
  afterResult(action = 'next') {
    const R = state.result;
    if (this.resultBox) { this.resultBox.destroy(); this.resultBox = null; }
    this.boomed = false;
    const passed = R && R.won && !R.boom;
    if (!passed) {
      // kaybedince: fabrika levelin başındaki haline döner
      if (!loadRun()) { newRun(); }
      state.retry = action === 'retry';
      if (action === 'map') state.screen = 'map';
      this.scene.restart();
      return;
    }
    if (R.last) { clearRun(); newRun(); state.screen = 'map'; this.scene.restart(); return; }
    state.round++;
    state.phase = 'build';
    state.places += RULES.placesPerRound;
    state.res.spark = 0;
    state.res.energy = 0;
    state.time = RULES.roundTime;
    state.result = null;
    state.offers = null; state.rerolls = 0; state.shopOpen = true;
    saveRun();   // yeni levelin başlangıç kaydı
    if (action === 'map') { state.screen = 'map'; this.scene.restart(); return; }
    this.refreshPhase();
    // Nuri Usta önce az önceki levele tepki verir, hikâyeyi anlatır, sonra dükkan açılır
    const lines = [];
    if (R.bonus >= 5) lines.push(`Erken bitirdin, aferin! Kasaya ${R.bonus} 💎 bonus ekledim.`);
    else if (state.pressure >= 60) lines.push('Hedef tuttu ama fabrika kaynıyor! Dükkandan sonra Soğut düğmesine bir bak.');
    if (STORY.rounds[state.round]) lines.push(...STORY.rounds[state.round]);
    if (state.round % RULES.roundsPer === 0 && STORY.chapter[this.chapter()]) lines.push(...STORY.chapter[this.chapter()]);
    if (BOSS[state.round]) lines.push(...BOSS[state.round].lines);
    if (lines.length) { state.shopOpen = false; this.showDialog(lines, () => { state.shopOpen = true; this.openShop(); }); }
    else this.openShop();
    if (state.pressure >= 30 && !state.ventTaught) {
      state.ventTaught = true;
      this.flashTip('Fabrika sıcak mı? Soğut!', `Mavi ❄ Soğut düğmesi ${RULES.ventCost} 💎 karşılığında tüm makinelerin ısısını %${Math.round(RULES.ventCool * 100)} düşürür.`, 0x8fb4ff, 6000);
    }
  }

  drawDanger(dtMs) {
    const p = state.pressure, g = this.dangerG;
    g.clear();
    if (p < 65 || state.phase !== 'run') return;
    this.dangerT = (this.dangerT || 0) + dtMs * (p > 85 ? 0.012 : 0.007);
    const a = (0.25 + 0.25 * Math.sin(this.dangerT)) * ((p - 60) / 40);
    const w = 18 * D;
    g.fillStyle(0xe0564a, a);
    g.fillRect(0, 0, this.W, w); g.fillRect(0, this.H - w, this.W, w);
    g.fillRect(0, 0, w, this.H); g.fillRect(this.W - w, 0, w, this.H);
    const beat = Math.floor(this.dangerT / Math.PI);
    if (beat !== this.lastBeat) { this.lastBeat = beat; if (beat % 2 === 0) { beep(p > 85 ? 980 : 740, 0.08, 'square', 0.07); buzz(10); } }
  }

  // ---------- üretim ----------
  produce(i, v) {
    const p = PROD[v.type];
    if (!p.out) return false;
    const s = this.cell, c = this.cellCenter(i);
    let px = c.x, py = c.y - s * 0.3, dx = 0, dy = -1;
    if (v.type === 'crank') {
      // Krank enerjiyi kendinde biriktirir, oklarındaki makineler alır
      if (state.buf[i] >= RULES.bufMax) { v.stalled = 'full'; return false; }
      state.buf[i]++;
    } else {
      if (this.outputBlocked(i)) { v.stalled = 'blocked'; return false; }
      const sup = this.suppliers(i).filter(j => state.buf[j] > 0);
      if (!sup.length) { v.stalled = 'power'; return false; }
      sup.sort((a, b) => state.buf[b] - state.buf[a]);
      state.buf[sup[0]]--;
      this.flowEnergy(sup[0], i);
      state.res[p.out] += 1;
      [dx, dy] = DIRS[this.rotOf(i)];
      px = c.x + dx * s * 0.42; py = c.y + dy * s * 0.42;
    }
    v.stalled = false;
    const pop = this.add.text(px, py, `+1 ${RES[p.out].sym}`, {
      fontFamily: FONT, fontSize: Math.round(s * 0.2) + 'px', fontStyle: '700', color: RES[p.out].color,
      stroke: '#0b0f1c', strokeThickness: 4 * D,
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: pop, x: px + dx * s * 0.45, y: py + dy * s * 0.45, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => pop.destroy() });
    this.tweens.add({ targets: v, scaleY: 0.93, scaleX: 1.04, duration: 60, yoyo: true });
    Music.note(v.type, i);
    return true;
  }

}
