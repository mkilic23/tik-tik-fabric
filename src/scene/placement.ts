import { DEFAULT_ROT, DIRS, RULES } from '../data/rules';
import { state } from '../state';
import { COLS, D, ROWS } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class PlacementPart {
  [key: string]: any;

  // =====================================================================
  // YERLEŞİM: yönler, bağlantılar, Fan alanı
  // =====================================================================
  nb(i, d) {
    const c = i % COLS + DIRS[d][0], r = Math.floor(i / COLS) + DIRS[d][1];
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return -1;
    return r * COLS + c;
  }
  rotOf(i) { return state.rot[i] ?? DEFAULT_ROT[state.grid[i]] ?? 0; }
  crankPorts(i) { const r = this.rotOf(i); return [r, (r + 1) % 4]; }
  suppliers(i) {
    // bu makineye enerji veren Krank'lar: Krank'ın oku bu kareyi gösteriyor olmalı
    const out = [];
    for (let d = 0; d < 4; d++) {
      const j = this.nb(i, d);
      if (j < 0 || state.grid[j] !== 'crank') continue;
      const back = (d + 2) % 4;              // Krank'tan bu makineye yön
      if (this.crankPorts(j).includes(back)) out.push(j);
    }
    return out;
  }
  // 💨 buhar sızıntısı
  isSteam(i) { return !!state.steam && state.steam.includes(i); }
  free(i) { return i >= 0 && !state.grid[i] && !this.isSteam(i); }
  steamCapped(s) { return state.grid.some((t, j) => t === 'fan' && (state.heat[j] || 0) < 1 && this.fanArea(j).includes(s)); }
  nearSteam(i) {
    const c = i % COLS, r = Math.floor(i / COLS);
    return (state.steam || []).some(s => Math.abs(s % COLS - c) <= 1 && Math.abs(Math.floor(s / COLS) - r) <= 1 && !this.steamCapped(s));
  }
  outputBlocked(i) { const n = this.nb(i, this.rotOf(i)); return n >= 0 && !!state.grid[n]; }
  fanArea(i) {
    const r = this.rotOf(i);
    const sx = (r === 0 || r === 3) ? 1 : -1, sy = (r === 0 || r === 1) ? 1 : -1;
    const c0 = i % COLS, r0 = Math.floor(i / COLS), out = [];
    [[0, 0], [sx, 0], [0, sy], [sx, sy]].forEach(([dx, dy]) => {
      const c = c0 + dx, rr = r0 + dy;
      if (c >= 0 && c < COLS && rr >= 0 && rr < ROWS) out.push(rr * COLS + c);
    });
    return out;
  }
  cooled(i) {
    return state.grid.some((t, j) => t === 'fan' && j !== i && (state.heat[j] || 0) < 1 && this.fanArea(j).includes(i));
  }

  drawPorts(g, i) {
    // oklar makinelerin üstünde ayrı bir katmanda çizilir (komşu makine örtmesin)
    const s = this.cell, a = s * 0.11, o = this.cellCenter(i), type = state.grid[i];
    const arrow = (d, col) => {
      const [dx, dy] = DIRS[d], px = -dy, py = dx;
      const cx = o.x + dx * s * 0.42, cy = o.y + dy * s * 0.42;
      g.fillStyle(0x0b0f1c, 0.9).fillTriangle(cx + dx * a * 1.25, cy + dy * a * 1.25, cx - dx * a * 0.55 + px * a * 1.05, cy - dy * a * 0.55 + py * a * 1.05, cx - dx * a * 0.55 - px * a * 1.05, cy - dy * a * 0.55 - py * a * 1.05);
      g.fillStyle(col, 1).fillTriangle(cx + dx * a, cy + dy * a, cx - dx * a * 0.4 + px * a * 0.8, cy - dy * a * 0.4 + py * a * 0.8, cx - dx * a * 0.4 - px * a * 0.8, cy - dy * a * 0.4 - py * a * 0.8);
    };
    if (type === 'crank') this.crankPorts(i).forEach(d => arrow(d, 0x4fd6e0));
    else if (type === 'press') arrow(this.rotOf(i), 0xffd84a);
    else if (type === 'mint') arrow(this.rotOf(i), 0x7fd47a);
    else if (type === 'fan') {
      const r = this.rotOf(i);
      const sx = (r === 0 || r === 3) ? 1 : -1, sy = (r === 0 || r === 1) ? 1 : -1;
      const cx = o.x + sx * s * 0.42, cy = o.y + sy * s * 0.42;
      g.lineStyle(s * 0.06, 0x0b0f1c, 0.9).strokeCircle(cx, cy, s * 0.1);
      g.fillStyle(0x8fb4ff, 1).fillCircle(cx, cy, s * 0.08);
      g.fillStyle(0xffffff, 0.7).fillCircle(cx - s * 0.02, cy - s * 0.02, s * 0.03);
    }
  }

  drawHeat(v, i) {
    const g = v.heatG; if (!g) return;
    const h = state.heat[i] || 0, s = this.cell;
    const w = s * 0.6, bh = s * 0.075, x = -w / 2, y = s * 0.29;
    g.clear();
    g.fillStyle(0x0b0f1c, 0.95).fillRoundedRect(x - 2 * D, y - 2 * D, w + 4 * D, bh + 4 * D, (bh + 4 * D) / 2);
    if (h > 0.01) {
      let col = h < 0.5 ? 0x5fd38a : h < RULES.needAt ? 0xffc23d : h < 1 ? 0xff8a3c : 0xe0564a;
      if (h >= 1 && Math.floor(this.time.now / 200) % 2) col = 0xffffff;
      g.fillStyle(col, 1).fillRoundedRect(x, y, Math.max(bh, w * h), bh, bh / 2);
    }
    // ! eşiği çizgisi
    g.fillStyle(0xffffff, 0.35).fillRect(x + w * RULES.needAt - 1 * D, y - 1 * D, 2 * D, bh + 2 * D);
  }

  // inşa ve üretim sırasında bağlantıları göster
  drawLinks() {
    const g = this.linkG; g.clear();
    this.portL.clear();
    if (state.phase !== 'build' && state.phase !== 'run') return;
    state.grid.forEach((t, i) => { if (t && this.cells[i]) this.drawPorts(this.portL, i); });
    this.drawMods(this.portL);
    const s = this.cell, gap = Math.max(2, s * 0.04);
    const cellRect = (j) => ({ x: this.gx + (j % COLS) * s, y: this.gy + Math.floor(j / COLS) * s });
    state.grid.forEach((t, i) => {
      if (!t) return;
      if (t === 'fan' && state.phase === 'build') {
        this.fanArea(i).forEach(j => { const r = cellRect(j); g.fillStyle(0x8fb4ff, 0.12).fillRoundedRect(r.x + gap, r.y + gap, s - gap * 2, s - gap * 2, s * 0.14); });
      }
      if (t === 'press' || t === 'mint') {
        const sup = this.suppliers(i);
        sup.forEach(j => {
          const a = this.cellCenter(i), b = this.cellCenter(j);
          g.lineStyle(s * 0.09, 0x4fd6e0, 0.25).lineBetween(a.x, a.y, b.x, b.y);
          g.lineStyle(s * 0.035, 0x4fd6e0, 0.9).lineBetween(a.x, a.y, b.x, b.y);
        });
        const r = cellRect(i);
        if (!sup.length) {
          g.lineStyle(3 * D, 0xe0564a, state.phase === 'build' ? 0.9 : 0.5).strokeRoundedRect(r.x + gap, r.y + gap, s - gap * 2, s - gap * 2, s * 0.14);
        }
        if (this.outputBlocked(i)) {
          const [dx, dy] = DIRS[this.rotOf(i)], c = this.cellCenter(i);
          const x = c.x + dx * s * 0.5, y = c.y + dy * s * 0.5, k = s * 0.09;
          g.lineStyle(4 * D, 0xe0564a, 1).lineBetween(x - k, y - k, x + k, y + k).lineBetween(x - k, y + k, x + k, y - k);
        }
      }
    });
  }

}
