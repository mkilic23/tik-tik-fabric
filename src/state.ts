import { RULES } from './data/rules';
import { AREAS, LEVELS, PER_AREA } from './data/levels';
import { COLS, ROWS, savedTheme } from './theme';

// Oyun durumu (ekran döndürülünce korunur)
export const state: any = { theme: savedTheme };

// ---------- kalıcı ilerleme (hurda, yıldızlar, açılımlar, mühendisler) ve kayıt ----------
// stars[n]: n. levelde alınan en iyi yıldız (0 = geçilmedi). Fabrika levelden levele taşınır;
// kaydedilen 'run' o levelin başındaki fabrikadır, kaybedince oradan tekrar oynanır.
export const META: any = { scrap: 0, lv: { money: 0, place: 0, shield: 0, offer: 0 }, eng: { cirak: true }, pick: 'cirak', runs: 0, stars: [], boost: { time: 2, cool: 2, cash: 2 }, tutorialDone: false, seenIntro: false };
try {
  const m = JSON.parse(localStorage.getItem('tiktik-meta') || 'null');
  if (m) {
    Object.assign(META, m);
    META.lv = Object.assign({ money: 0, place: 0, shield: 0, offer: 0 }, m.lv);
    META.eng = Object.assign({ cirak: true }, m.eng);
    if (!Array.isArray(META.stars)) META.stars = [];
    META.boost = Object.assign({ time: 2, cool: 2, cash: 2 }, m.boost);
  }
} catch (e) {}
export function saveMeta() { try { localStorage.setItem('tiktik-meta', JSON.stringify(META)); } catch (e) {} }

// fabrika kaydı: sadece kurulum aşamasında (level başında) yazılır
export const RUN_KEYS = ['grid', 'rot', 'heat', 'mod', 'round', 'res', 'places', 'offers', 'shopOpen', 'rerolls', 'serviceTaught', 'ventTaught', 'timeBonus'];
export function saveRun() {
  if (state.phase !== 'build') return;
  try { const o = {}; RUN_KEYS.forEach(k => { o[k] = state[k]; }); localStorage.setItem('tiktik-run', JSON.stringify(o)); } catch (e) {}
}
export function clearRun() { try { localStorage.removeItem('tiktik-run'); } catch (e) {} }
// level başındaki fabrikayı geri yükle (açılışta ve kaybedince)
export function loadRun() {
  try {
    const o = JSON.parse(localStorage.getItem('tiktik-run') || 'null');
    if (!o || !Array.isArray(o.grid) || o.grid.length !== COLS * ROWS || !(o.round < RULES.goals.length)) return false;
    RUN_KEYS.forEach(k => { if (o[k] !== undefined) state[k] = JSON.parse(JSON.stringify(o[k])); });
    state.phase = 'build'; state.needIntro = false; state.res.spark = 0; state.res.energy = 0;
    state.time = LEVELS[state.round].time; state.buf = new Array(COLS * ROWS).fill(0);
    state.result = null; state.pressure = 0; state.eng = META.pick;
    return true;
  } catch (e) { return false; }
}
// Usta Tamirci: mükemmel alanı çarpanı
export function PW() { return state.eng === 'tamirci' ? 1.6 : 1; }
// yıldız: hedef tutunca kalan süreye göre
export function starsFor(timeLeft, total) { const f = timeLeft / total; return f >= RULES.stars[0] ? 3 : f >= RULES.stars[1] ? 2 : 1; }
// şu anki levelin süresi
export function levelTime(r = state.round) { return LEVELS[r].time + (r === state.round ? state.timeBonus || 0 : 0); }

// yeni fabrika: 1. levelden başlar
export function newRun() {
  state.grid = new Array(COLS * ROWS).fill(null);
  state.round = 0;                                 // şu anki level (0'dan)
  state.phase = 'build';
  state.res = { spark: 0, energy: 0, money: RULES.startMoney };
  state.time = LEVELS[0].time;
  state.places = RULES.startPlaces + META.lv.place;
  state.eng = META.pick;
  state.result = null;
  state.pressure = 0;
  state.rot = new Array(COLS * ROWS).fill(null);   // makine yönleri
  state.heat = new Array(COLS * ROWS).fill(0);     // makine ısıları (0-1)
  state.buf = new Array(COLS * ROWS).fill(0);      // Krank'ta biriken enerji
  state.boomT = RULES.chapters[0].boom;
  state.needIntro = true;
  state.mod = new Array(COLS * ROWS).fill(null);   // takılı modüller
  state.offers = null; state.shopOpen = false; state.rerolls = 0;
  state.tutorialDone = META.tutorialDone;
}

// yeni bölge: fabrika sıfırlanır, bölgenin başlangıç parasıyla başlanır
export function newArea(a) {
  newRun();
  state.round = a * PER_AREA;
  state.res.money = AREAS[a].money;
  state.time = LEVELS[state.round].time;
  state.boomT = AREAS[a].boom;
  state.needIntro = a === 0;
}

// açılış: kayıtlı fabrika varsa yüklenir; her açılışta önce level haritası gösterilir
newRun();
loadRun();
