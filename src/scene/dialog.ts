import { beep, sfx } from '../audio';
import { D, FONT } from '../theme';

// Build sahnesinin bir parçası: yöntemler sahneye eklenir (bkz. scene/Build.ts)
export class DialogPart {
  [key: string]: any;

  // =====================================================================
  // HİKÂYE: Nuri Usta konuşmaları
  // =====================================================================
  drawOwner(g, x, y, s) {
    // önlük
    g.fillStyle(0x6e3518, 1).fillRoundedRect(x - s * 0.55, y + s * 0.45, s * 1.1, s * 0.8, s * 0.3);
    g.fillStyle(0xcf7a3e, 1).fillRoundedRect(x - s * 0.35, y + s * 0.55, s * 0.7, s * 0.7, s * 0.12);
    g.fillStyle(0xe0b450, 1).fillCircle(x - s * 0.22, y + s * 0.66, s * 0.05).fillCircle(x + s * 0.22, y + s * 0.66, s * 0.05);
    // baş
    g.fillStyle(0xd9a37c, 1).fillCircle(x, y + s * 0.05, s * 0.46);
    g.fillStyle(0xf2c39b, 1).fillCircle(x, y, s * 0.45);
    g.fillStyle(0xe99a86, 0.6).fillCircle(x - s * 0.26, y + s * 0.1, s * 0.09).fillCircle(x + s * 0.26, y + s * 0.1, s * 0.09);
    // kasket
    g.fillStyle(0x3a2a22, 1).fillEllipse(x, y - s * 0.3, s * 1.0, s * 0.42);
    g.fillStyle(0x2a1d17, 1).fillEllipse(x + s * 0.18, y - s * 0.18, s * 0.75, s * 0.16);
    // gözler, kaşlar, bıyık
    g.fillStyle(0x2a1d17, 1).fillCircle(x - s * 0.15, y - s * 0.02, s * 0.045).fillCircle(x + s * 0.15, y - s * 0.02, s * 0.045);
    g.fillRect(x - s * 0.24, y - s * 0.13, s * 0.16, s * 0.035).fillRect(x + s * 0.08, y - s * 0.13, s * 0.16, s * 0.035);
    g.fillStyle(0x5a4a42, 1).fillEllipse(x - s * 0.12, y + s * 0.16, s * 0.28, s * 0.12).fillEllipse(x + s * 0.12, y + s * 0.16, s * 0.28, s * 0.12);
    g.fillStyle(0xb5645a, 1).fillEllipse(x, y + s * 0.26, s * 0.14, s * 0.06);
  }

  showDialog(lines, done) {
    const W = this.W, H = this.H, pad = this.pad;
    const k = this.add.container(0, 0).setDepth(130);
    this.banner.setVisible(false);
    const dim = this.add.rectangle(0, 0, W, H, 0x05070d, 0.6).setOrigin(0).setInteractive();
    const ps = Math.min(W * 0.2, 90 * D);
    const px = pad + ps * 0.7, py = H * 0.66;
    const g = this.add.graphics();
    this.drawOwner(g, px, py, ps);
    const name = this.add.text(px, py + ps * 1.35, 'Nuri Usta', { fontFamily: FONT, fontSize: Math.round(ps * 0.22) + 'px', fontStyle: '700', color: '#f0a76a' }).setOrigin(0.5, 0);
    const bw = W - pad * 2, fs = Math.round(Math.min(W * 0.046, 19 * D));
    const txt = this.add.text(pad + 18 * D, 0, '', { fontFamily: FONT, fontSize: fs + 'px', fontStyle: '500', color: '#1d1408', wordWrap: { width: bw - 36 * D }, lineSpacing: 4 * D });
    const more = this.add.text(W - pad - 16 * D, 0, 'Dokun ▶', { fontFamily: FONT, fontSize: Math.round(fs * 0.75) + 'px', fontStyle: '700', color: '#9a7424' }).setOrigin(1, 1);
    const bub = this.add.graphics();
    k.add([dim, g, name, bub, txt, more]);
    let li = 0, shown = 0, full = '';
    const layout = () => {
      txt.setText(full);
      const bh = txt.height + 50 * D, by = py - ps * 0.75 - bh - 18 * D;
      txt.setText(full.slice(0, shown)); txt.setY(by + 16 * D);
      more.setPosition(W - pad - 16 * D, by + bh - 10 * D);
      bub.clear();
      bub.fillStyle(0x000000, 0.3).fillRoundedRect(pad, by + 5 * D, bw, bh, 20 * D);
      bub.fillStyle(0xfff6e4, 1).fillRoundedRect(pad, by, bw, bh, 20 * D);
      bub.fillTriangle(px - 14 * D, by + bh - 2, px + 18 * D, by + bh - 2, px, by + bh + 22 * D);
      bub.lineStyle(3 * D, 0xe0b450, 1).strokeRoundedRect(pad, by, bw, bh, 20 * D);
    };
    const start = () => { full = lines[li]; shown = 0; layout(); more.setAlpha(0.3); };
    start();
    const ev = this.time.addEvent({ delay: 22, loop: true, callback: () => {
      if (!txt.scene) { ev.remove(); return; }
      if (shown < full.length) { shown += 1; txt.setText(full.slice(0, shown)); if (shown % 3 === 0) beep(420 + Math.random() * 120, 0.03, 'triangle', 0.05); if (shown >= full.length) more.setAlpha(1); }
    } });
    this.tweens.add({ targets: more, x: '-=4', duration: 400, yoyo: true, repeat: -1 });
    dim.on('pointerup', () => {
      if (shown < full.length) { shown = full.length; txt.setText(full); more.setAlpha(1); return; }
      li++;
      if (li >= lines.length) { ev.remove(); k.destroy(); this.dialog = null; sfx.pick(); if (done) done(); return; }
      start(); sfx.tap();
    });
    k.setAlpha(0); this.tweens.add({ targets: k, alpha: 1, duration: 200 });
    this.dialog = k;
  }


}
