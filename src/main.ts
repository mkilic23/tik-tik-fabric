import Phaser from 'phaser';
import { C, D } from './theme';
import { Build } from './scene/Build';
import { Menu } from './scene/Menu';
import { state, META, saveRun, PW } from './state';
import { Music } from './audio';

// test ve hata ayıklama için (tarayıcı konsolunda __g.state vb.)
(window as any).__g = { state, META, saveRun, PW, Music };

// ---------- başlat ----------
function boot() {
  const el = document.getElementById('game');
  const size = () => [Math.round(el.clientWidth * D), Math.round(el.clientHeight * D)];
  const [w, h] = size();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: el,
    backgroundColor: C.bgBot,
    antialias: true,
    scale: { mode: Phaser.Scale.NONE, width: w, height: h, zoom: 1 / D },
    input: { activePointers: 1 },
    scene: [Menu, Build],
  });
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const [nw, nh] = size();
      if (nw !== game.scale.width || nh !== game.scale.height) {
        game.scale.resize(nw, nh);
        game.scale.setZoom(1 / D);
      }
    }, 120);
  });
}
// Yazı tipini bekle (en fazla 1.5 sn), sonra başlat
Promise.race([
  document.fonts ? Promise.all([document.fonts.load('700 20px Fredoka'), document.fonts.load('500 20px Fredoka')]) : Promise.resolve(),
  new Promise(r => setTimeout(r, 1500)),
]).catch(() => {}).then(boot);

// Telefona kurulunca çevrimdışı da açılsın (önizleme linkinde sessizce atlanır)
if ('serviceWorker' in navigator && location.protocol === 'https:' && !/claude\.ai|claudeusercontent/.test(location.hostname)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
