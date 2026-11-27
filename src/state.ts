import { RULES } from './data/rules';
import { COLS, ROWS, savedTheme } from './theme';

// Oyun durumu (ekran döndürülünce korunur)
export const state: any = { theme: savedTheme };

// ---------- kalıcı ilerleme (hurda, açılımlar, mühendisler) ve kayıt ----------
export const META: any = { scrap: 0, lv: { money: 0, place: 0, shield: 0, offer: 0 }, eng: { cirak: true }, pick: 'cirak', runs: 0, maxCh: 0, startCh: 0 };
try { const m = JSON.parse(localStorage.getItem('tiktik-meta') || 'null'); if (m) { Object.assign(META, m); META.lv = Object.assign({ money: 0, place: 0, shield: 0, offer: 0 }, m.lv); META.eng = Object.assign({ cirak: true }, m.eng); } } catch (e) {}
export function saveMeta() { try { localStorage.setItem('tiktik-meta', JSON.stringify(META)); } catch (e) {} }
export const RUN_KEYS = ['grid', 'rot', 'heat', 'mod', 'round', 'res', 'places', 'offers', 'shopOpen', 'rerolls', 'seenIntro', 'tutorialDone', 'serviceTaught', 'ventTaught', 'eng', 'startRound'];
export function saveRun() {
  if (state.phase !== 'build' || state.showMeta) return;
  try { const o = {}; RUN_KEYS.forEach(k => { o[k] = state[k]; }); localStorage.setItem('tiktik-run', JSON.stringify(o)); } catch (e) {}
}
export function clearRun() { try { localStorage.removeItem('tiktik-run'); } catch (e) {} }
export function loadRun() {
  try {
    const o = JSON.parse(localStorage.getItem('tiktik-run') || 'null');
    if (!o || !Array.isArray(o.grid) || o.grid.length !== COLS * ROWS) return false;
    RUN_KEYS.forEach(k => { if (o[k] !== undefined) state[k] = o[k]; });
    state.phase = 'build'; state.needIntro = false; state.res.spark = 0; state.res.energy = 0;
    state.time = RULES.roundTime; state.buf = new Array(COLS * ROWS).fill(0);
    state.resumed = true;
    return true;
  } catch (e) { return false; }
}
// Usta Tamirci: mükemmel alanı çarpanı
export function PW() { return state.eng === 'tamirci' ? 1.6 : 1; }

export function newRun() {
  state.grid = new Array(COLS * ROWS).fill(null);
  state.round = 0;
  state.phase = 'build';
  state.res = { spark: 0, energy: 0, money: RULES.startMoney + 3 * META.lv.money };
  state.time = RULES.roundTime;
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
  // ulaşılmış bir bölümden başlama: kaçırılan turların hakkı ve ek para verilir
  const c = Math.min(META.startCh || 0, META.maxCh || 0);
  state.startRound = c * RULES.roundsPer; state.chStart = 0;
  if (c > 0) {
    state.round = state.startRound;
    state.places += RULES.placesPerRound * state.startRound;
    state.res.money += RULES.chapterKit[c];
    state.needIntro = false; state.shopOpen = true; state.chStart = c;
  }
}
newRun();
state.tutorialDone = false;
loadRun();   // yarım kalan koşu varsa kaldığı turun başından devam
