import Phaser from 'phaser';
import { beep, buzz } from '../audio';
import { BOSS, RULES } from '../data/rules';
import { META, state } from '../state';
import { D, FONT } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class HeatPart {
  [key: string]: any;

  // =====================================================================
  // ISI VE BASINÇ
  // =====================================================================
  chapter(r = state.round) { return Math.min(RULES.chapters.length - 1, Math.floor(r / RULES.roundsPer)); }
  boomDelay() { return RULES.chapters[this.chapter()].boom + 2 * META.lv.shield; }
  tickJolt(dt) {
    // patron: gevşek vidalar, ara ara bir makine aniden ısınır
    const B = BOSS[state.round];
    if (!B || !B.jolt || this.mg || this.dialog) return;
    state.joltT = (state.joltT ?? B.jolt) - dt;
    if (state.joltT > 0) return;
    state.joltT = B.jolt;
    const list = state.grid.map((t, i) => (t && state.heat[i] < 1 ? i : -1)).filter(i => i >= 0);
    if (!list.length) return;
    const i = Phaser.Utils.Array.GetRandom(list) as number, c = this.cellCenter(i);
    state.heat[i] = Math.min(1, state.heat[i] + B.joltAmt);
    this.cameras.main.shake(140, 0.006); beep(140, 0.15, 'sawtooth', 0.15); buzz([30, 30, 30]);
    const t = this.add.text(c.x, c.y - this.cell * 0.2, 'Vida gevşedi!', { fontFamily: FONT, fontSize: Math.round(this.cell * 0.2) + 'px', fontStyle: '700', color: '#ff8a7c', stroke: '#0b0f1c', strokeThickness: 4 * D }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: t, y: t.y - this.cell * 0.5, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    const v = this.cells[i]; if (v) this.tweens.add({ targets: v, angle: { from: -8, to: 8 }, duration: 50, yoyo: true, repeat: 3, onComplete: () => v.setAngle(0) });
  }
  tickHeat(dt) {
    if (this.mg || this.dialog) return;
    this.cells.forEach((v, i) => {
      if (!v) return;
      let h = state.heat[i] || 0;
      if (h < 1) {
        let rate = RULES.heatRate[v.type] * (v.rateJ || 1);
        if (v.stalled) rate *= RULES.idleHeat;
        if (v.type !== 'fan' && this.cooled(i)) rate *= RULES.fanCool;
        if (v.boost && state.time > v.boost.until) rate *= 1.25;
        if (this.hasRingNear(i)) rate *= RULES.ringHeat;
        if (state.mod[i] === 'plate') rate *= RULES.plateHeat;
        rate *= RULES.chapters[this.chapter()].heat * ((BOSS[state.round] && BOSS[state.round].heat) || 1);
        h = Math.min(1, h + rate * dt);
        state.heat[i] = h;
      }
      const svc = h >= 1 ? 'broken' : h >= RULES.needAt ? 'need' : 'ok';
      if (svc !== v.svc) {
        v.svc = svc;
        this.setAlert(v, svc === 'ok' ? null : svc);
        if (svc === 'need') {
          beep(660, 0.06, 'triangle', 0.12); setTimeout(() => beep(660, 0.06, 'triangle', 0.12), 120); buzz(15);
          if (!state.serviceTaught) this.flashTip('Makine ısınıyor!', 'Isı çubuğu dolunca ! çıkar. Makineye dokun, mini oyunla soğut. Tamamen ısınırsa durur.', 0xffc23d, 5000, () => { state.serviceTaught = true; });
        } else if (svc === 'broken') {
          beep(120, 0.25, 'sawtooth', 0.12); buzz(60); this.cameras.main.shake(100, 0.003);
        }
      }
    });
  }

  computePressure() {
    // Basınç = en sıcak makine türünün ortalaması ağırlıklı; bir türün hepsi kızarsa %100
    const byType: Record<string, number[]> = {};
    let sum = 0, n = 0;
    state.grid.forEach((t, i) => { if (!t) return; const h = state.heat[i] || 0; (byType[t] = byType[t] || []).push(h); sum += h; n++; });
    if (!n) return 0;
    let M = 0, full = false;
    Object.values(byType).forEach(a => { const avg = a.reduce((x, y) => x + y, 0) / a.length; M = Math.max(M, avg); if (a.every(h => h >= 1)) full = true; });
    if (full) return 100;
    const raw = 0.6 * M + 0.4 * (sum / n);
    return Math.min(99, 100 * Math.pow(raw, 0.8));
  }

  tickPressure(dt) {
    state.pressure = this.computePressure();
    if (state.pressure >= 100 && !this.dialog) {
      if (!state.pressureTaught) { state.pressureTaught = true; }
      if (!this.mg) state.boomT = (state.boomT ?? this.boomDelay()) - dt;
      const n = Math.max(1, Math.ceil(state.boomT));
      if (n !== this.lastCount) { this.lastCount = n; beep(1100, 0.12, 'square', 0.15); buzz(40); }
      this.countText.setText(`⚠ ${n}`).setVisible(true).setScale(1 + (state.boomT % 1) * 0.3);
      if (state.boomT <= 0) { this.countText.setVisible(false); this.explode(); }
    } else {
      state.boomT = this.boomDelay(); this.lastCount = null;
      this.countText.setVisible(false);
    }
  }

}
