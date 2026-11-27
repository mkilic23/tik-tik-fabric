import Phaser from 'phaser';
import { BODY, MACHINES } from './data/machines';
import { C, D, FONT } from './theme';

// ---------- çizim yardımcıları ----------
export function rivet(g, x, y, r) {
  g.fillStyle(C.brassDark, 1).fillCircle(x, y + r * 0.25, r);
  g.fillStyle(C.brass, 1).fillCircle(x, y, r);
  g.fillStyle(C.brassHi, 0.9).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.4);
}
export function gauge(g, x, y, r, m) {
  g.fillStyle(C.brassDark, 1).fillCircle(x, y + r * 0.08, r * 1.18);
  g.fillStyle(C.brass, 1).fillCircle(x, y, r * 1.18);
  g.fillStyle(C.brassHi, 0.6).fillCircle(x - r * 0.25, y - r * 0.35, r * 0.85);
  g.fillStyle(C.brass, 1).fillCircle(x, y, r * 1.0);
  g.fillStyle(C.glass, 1).fillCircle(x, y, r * 0.92);
  g.fillStyle(m.dark, 1).fillCircle(x, y, r * 0.78);
  g.fillStyle(m.color, 1).fillCircle(x, y - r * 0.05, r * 0.7);
  // cam parlaması
  g.fillStyle(0xffffff, 0.35).fillEllipse(x - r * 0.25, y - r * 0.38, r * 0.7, r * 0.32);
}

// ---------- makine çizimi ----------
// Her tür ayrı siluet ve renkte; k.tick(dt, hız) türe özel hareketi oynatır.
export function drawMachine(scene, type, s, withShadow = true) {
  const m = MACHINES[type], B = BODY[type];
  const k = scene.add.container(0, 0);
  const g = scene.add.graphics();
  const dep = s * 0.07;
  const box = (x, y, w, h, r) => {
    g.fillStyle(B.dark, 1).fillRoundedRect(x, y + dep, w, h, r);
    g.fillStyle(B.mid, 1).fillRoundedRect(x, y, w, h, r);
    g.fillStyle(B.base, 1).fillRoundedRect(x + w * 0.03, y + h * 0.03, w * 0.94, h * 0.8, r * 0.85);
    g.fillStyle(B.hi, 0.5).fillRoundedRect(x + w * 0.08, y + h * 0.06, w * 0.84, Math.min(h * 0.12, s * 0.09), r * 0.5);
  };
  const label = (x, y, size) => {
    const t = scene.add.text(x, y, m.sym, { fontFamily: FONT, fontSize: Math.round(size) + 'px', fontStyle: '700', color: '#0d1220' }).setOrigin(0.5);
    return t;
  };
  if (withShadow) g.fillStyle(0x000000, 0.35).fillEllipse(0, s * 0.47, s * (type === 'mint' ? 1.05 : 0.9), s * 0.16);
  const parts = [g];
  let tick: (dt: number, sp: number) => void = () => {};

  if (type === 'crank') {
    // dişli çark gövde + dönen kol
    const cy = -s * 0.03, R = s * 0.44;
    g.fillStyle(B.dark, 1).fillRoundedRect(-s * 0.3, s * 0.26, s * 0.6, s * 0.18, s * 0.05);   // ayak
    g.fillStyle(B.mid, 1).fillRoundedRect(-s * 0.3, s * 0.24, s * 0.6, s * 0.15, s * 0.05);
    const gear = scene.add.graphics().setPosition(0, cy);
    const pts = [];
    const N = 10;
    for (let i = 0; i < N * 4; i++) {
      const a = (i / (N * 4)) * Math.PI * 2, rr = (i % 4 < 2) ? R : R * 0.84;
      pts.push(new Phaser.Math.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    gear.fillStyle(B.dark, 1).fillPoints(pts.map(p => new Phaser.Math.Vector2(p.x, p.y + dep * 0.7)), true);
    gear.fillStyle(B.mid, 1).fillPoints(pts, true);
    gear.fillStyle(B.base, 1).fillCircle(0, 0, R * 0.76);
    gear.fillStyle(B.hi, 0.35).fillCircle(-R * 0.15, -R * 0.2, R * 0.5);
    gear.fillStyle(0x10162a, 1).fillCircle(0, 0, R * 0.52);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; gear.lineStyle(s * 0.04, B.mid, 1).lineBetween(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); }
    const arm = scene.add.graphics().setPosition(0, cy);
    arm.lineStyle(s * 0.07, C.copperDark, 1).lineBetween(0, 0, R * 0.62, 0);
    arm.fillStyle(C.copperDark, 1).fillCircle(R * 0.62, s * 0.012, s * 0.08);
    arm.fillStyle(C.copperHi, 1).fillCircle(R * 0.62, 0, s * 0.075);
    const hub = scene.add.graphics();
    hub.fillStyle(C.brassDark, 1).fillCircle(0, cy + s * 0.01, s * 0.13);
    hub.fillStyle(C.brass, 1).fillCircle(0, cy, s * 0.13);
    parts.push(gear, arm, hub, label(0, cy, s * 0.15));
    tick = (dt, sp) => { arm.rotation += dt * 0.006 * sp; gear.rotation += dt * 0.0012 * sp; };
  } else if (type === 'press') {
    // uzun kule + üstte iner kalkar piston
    const x = -s * 0.33, w = s * 0.66, top = -s * 0.2, h = s * 0.62;
    g.fillStyle(C.copperDark, 1).fillRect(-s * 0.4, -s * 0.5, s * 0.07, s * 0.36).fillRect(s * 0.33, -s * 0.5, s * 0.07, s * 0.36);
    g.fillStyle(C.brassDark, 1).fillRoundedRect(-s * 0.46, -s * 0.54, s * 0.92, s * 0.12, s * 0.04);
    g.fillStyle(C.brass, 1).fillRoundedRect(-s * 0.46, -s * 0.56, s * 0.92, s * 0.1, s * 0.04);
    g.fillStyle(C.brassHi, 0.7).fillRect(-s * 0.42, -s * 0.55, s * 0.84, s * 0.02);
    const piston = scene.add.graphics();
    box(x, top, w, h, s * 0.1);
    gauge(g, 0, top + h * 0.42, s * 0.17, m);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => rivet(g, a * s * 0.25, top + h * 0.42 + b * h * 0.3, s * 0.035));
    parts.push(piston, label(0, top + h * 0.42, s * 0.19));
    let ph = Math.random() * 6;
    const drawP = (o) => {
      piston.clear();
      const hy = -s * 0.36 + o * s * 0.1;
      piston.fillStyle(0xb9c2d6, 1).fillRect(-s * 0.04, -s * 0.44, s * 0.08, hy - (-s * 0.44));
      piston.fillStyle(B.dark, 1).fillRoundedRect(-s * 0.2, hy + s * 0.02, s * 0.4, s * 0.1, s * 0.03);
      piston.fillStyle(B.hi, 1).fillRoundedRect(-s * 0.2, hy, s * 0.4, s * 0.09, s * 0.03);
    };
    drawP(0);
    tick = (dt, sp) => { ph += dt * 0.008 * sp; drawP(Math.pow(Math.max(0, Math.sin(ph)), 3)); };
  } else if (type === 'mint') {
    // yayvan kasa + üstte huni, huniye elmas düşer
    const top = -s * 0.1, h = s * 0.52;
    g.fillStyle(C.copperDark, 1).fillRoundedRect(-s * 0.6, top + s * 0.06, s * 0.14, s * 0.08, s * 0.03);
    g.fillStyle(C.brassDark, 1).fillRoundedRect(-s * 0.58, top - s * 0.28, s * 0.05, s * 0.34, s * 0.02);
    rivet(g, -s * 0.555, top - s * 0.28, s * 0.07);
    // huni
    g.fillStyle(B.dark, 1).fillPoints([[-s * 0.3, -s * 0.46], [s * 0.3, -s * 0.46], [s * 0.16, top + 2], [-s * 0.16, top + 2]].map(([a, b]) => new Phaser.Math.Vector2(a, b + dep * 0.6)), true);
    g.fillStyle(B.mid, 1).fillPoints([[-s * 0.3, -s * 0.46], [s * 0.3, -s * 0.46], [s * 0.16, top + 2], [-s * 0.16, top + 2]].map(([a, b]) => new Phaser.Math.Vector2(a, b)), true);
    g.fillStyle(0x10162a, 1).fillRoundedRect(-s * 0.26, -s * 0.47, s * 0.52, s * 0.06, s * 0.03);
    box(-s * 0.5, top, s, h, s * 0.12);
    gauge(g, -s * 0.1, top + h * 0.45, s * 0.15, m);
    // çıkış oluğu
    g.fillStyle(0x10162a, 1).fillRoundedRect(s * 0.16, top + h * 0.3, s * 0.26, s * 0.16, s * 0.04);
    g.fillStyle(B.hi, 0.6).fillRect(s * 0.16, top + h * 0.3 + s * 0.13, s * 0.26, s * 0.03);
    rivet(g, -s * 0.42, top + h * 0.2, s * 0.03); rivet(g, s * 0.42, top + h * 0.2, s * 0.03);
    const gem = scene.add.graphics();
    parts.push(label(-s * 0.1, top + h * 0.45, s * 0.15), gem);
    let gt = Math.random();
    tick = (dt, sp) => {
      gt += dt * 0.0011 * sp; if (gt > 1) gt -= 1;
      gem.clear();
      const f = Math.min(1, gt / 0.6), y = -s * 0.78 + f * f * s * 0.34, r = s * 0.06, a = gt < 0.6 ? 1 : Math.max(0, 1 - (gt - 0.6) / 0.15);
      if (a <= 0 || sp <= 0.01) return;
      gem.fillStyle(0x1f8a93, a).fillTriangle(-r, y - r * 0.25, r, y - r * 0.25, 0, y + r);
      gem.fillStyle(0x8ff0f5, a).fillTriangle(-r, y - r * 0.25, 0, y - r * 0.25, 0, y + r);
      gem.fillStyle(0xc9fbff, a).fillTriangle(-r * 0.55, y - r * 0.7, r * 0.55, y - r * 0.7, 0, y - r * 0.25);
    };
  } else if (type === 'fan') {
    // yuvarlak kafes + dönen pervane
    const cy = -s * 0.05, R = s * 0.44;
    g.fillStyle(B.dark, 1).fillRoundedRect(-s * 0.32, s * 0.28, s * 0.64, s * 0.16, s * 0.05);
    g.fillStyle(B.mid, 1).fillRoundedRect(-s * 0.32, s * 0.26, s * 0.64, s * 0.14, s * 0.05);
    g.fillStyle(B.mid, 1).fillRect(-s * 0.06, cy + R * 0.8, s * 0.12, s * 0.18);
    g.fillStyle(B.dark, 1).fillCircle(0, cy + dep * 0.7, R);
    g.fillStyle(B.mid, 1).fillCircle(0, cy, R);
    g.fillStyle(B.base, 1).fillCircle(0, cy, R * 0.9);
    g.fillStyle(B.hi, 0.4).fillCircle(-R * 0.25, cy - R * 0.3, R * 0.45);
    g.fillStyle(0x10162a, 1).fillCircle(0, cy, R * 0.74);
    g.fillStyle(m.dark, 0.45).fillCircle(0, cy, R * 0.7);
    const blades = scene.add.graphics().setPosition(0, cy);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const p = (ang, rad) => ({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
      const a1 = p(a - 0.35, R * 0.66), a2 = p(a + 0.45, R * 0.66), a3 = p(a + 0.1, R * 0.15);
      blades.fillStyle(0xdfe9ff, 1).fillTriangle(0, 0, a1.x, a1.y, a2.x, a2.y);
      blades.fillStyle(0xffffff, 0.35).fillTriangle(0, 0, a1.x, a1.y, a3.x, a3.y);
    }
    blades.fillStyle(C.brass, 1).fillCircle(0, 0, s * 0.07);
    const cage = scene.add.graphics();
    cage.lineStyle(Math.max(1, s * 0.016), B.hi, 0.7);
    cage.strokeCircle(0, cy, R * 0.45); cage.strokeCircle(0, cy, R * 0.72);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; cage.lineBetween(Math.cos(a) * R * 0.74, cy + Math.sin(a) * R * 0.74, -Math.cos(a) * R * 0.74, cy - Math.sin(a) * R * 0.74); }
    parts.push(blades, cage);
    k.blades = blades;
    tick = (dt, sp) => { blades.rotation += dt * 0.012 * sp; };
  }
  k.add(parts);
  k.tick = tick;
  k.type = type;
  return k;
}

export function makeButton(scene, x, y, w, h, label, color, onTap) {
  const k = scene.add.container(x, y);
  const g = scene.add.graphics();
  const r = h / 2;
  g.fillStyle(0x000000, 0.3).fillRoundedRect(-w / 2, -h / 2 + 4 * D, w, h, r);
  g.fillStyle(color.dark, 1).fillRoundedRect(-w / 2, -h / 2 + 3 * D, w, h, r);
  g.fillStyle(color.base, 1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.fillStyle(0xffffff, 0.25).fillRoundedRect(-w / 2 + r * 0.6, -h / 2 + h * 0.12, w - r * 1.2, h * 0.22, h * 0.11);
  const t = scene.add.text(0, 0, label, {
    fontFamily: FONT, fontSize: Math.round(h * 0.42) + 'px', fontStyle: '700', color: color.text || '#2a1405',
  }).setOrigin(0.5);
  k.add([g, t]);
  k.label = t;
  k.setSize(w, h).setInteractive();
  k.on('pointerdown', () => { k.setScale(0.95); });
  k.on('pointerout', () => { k.setScale(1); });
  k.on('pointerup', () => { k.setScale(1); onTap(); });
  return k;
}
export const BTN_GO = { base: 0x5fd38a, dark: 0x2e8a52, text: '#0d2a18' };
export const BTN_BRASS = { base: 0xe0b450, dark: 0x9a7424, text: '#2a1a05' };
