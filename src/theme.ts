// Tüm çizim cihazın gerçek piksel yoğunluğunda yapılır (D = devicePixelRatio), böylece keskin görünür.

export const D = Math.min(window.devicePixelRatio || 1, 3);
export const COLS = 6, ROWS = 6;
export const C = {
  bgTop: 0x1a2340, bgBot: 0x0e1322,
  well: 0x0b0f1c, cell: 0x1c2440, cellHi: 0x2a3456, cellLo: 0x121829,
  panel: 0x1b2238, panelHi: 0x2c3654,
  ok: 0x5fd38a, bad: 0xe0564a,
  copperHi: 0xf0a76a, copper: 0xcf7a3e, copperMid: 0xb4622c, copperDark: 0x6e3518,
  brassHi: 0xfbe3a0, brass: 0xe0b450, brassDark: 0x9a7424,
  glass: 0x0d1220, spark: 0xffd84a,
  cream: '#f6ecdb', dim: '#8e97b8', faint: '#4a5272',
};
// tema: makineler aynı kalır; zemin, ızgara, tepsi ve üst bilgi değişir
export const THEMES = {
  dark:  { bgTop: 0x1a2340, bgBot: 0x0e1322, line: 0xffffff, lineA: 0.03, well: 0x0b0f1c, frame: 0x6e3518, frameW: 3,
           cell: 0x1c2440, cellHi: 0x2a3456, cellLo: 0x121829, cellLine: 0, panel: 0x1b2238, panelHi: 0x2c3654,
           hud: '#f6ecdb', hudDim: '#8e97b8', energy: '#4fd6e0', money: '#7fd47a', barBg: 0x0b0f1c, barLine: 0x2c3654, barText: '#ffd84a', facLine: 0x6e7aa3 },
  light: { bgTop: 0xfff4e0, bgBot: 0xffe3c7, line: 0x2b2340, lineA: 0.05, well: 0xf3d9bd, frame: 0x2b2340, frameW: 3,
           cell: 0xfff9ef, cellHi: 0xffffff, cellLo: 0xe8cfb3, cellLine: 0x2b2340, panel: 0xfff9ef, panelHi: 0x2b2340,
           hud: '#2b2340', hudDim: '#6b5f80', energy: '#1f8a93', money: '#2e8a52', barBg: 0xffffff, barLine: 0x2b2340, barText: '#2b2340', facLine: 0x2b2340 },
};
export let savedTheme = 'dark';
try { savedTheme = localStorage.getItem('tiktik-theme') === 'light' ? 'light' : 'dark'; } catch (e) {}
export const T: any = Object.assign({}, THEMES[savedTheme]);
export const FONT = '"Fredoka", system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
