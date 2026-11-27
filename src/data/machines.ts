
export const MACHINES = {
  crank: { name: 'Krank',  sym: '⚡', color: 0x4fd6e0, dark: 0x1f8a93 },
  press: { name: 'Pres',   sym: '✦', color: 0xffd84a, dark: 0xb88a12 },
  mint:  { name: 'Basıcı', sym: '💎', color: 0x7fd47a, dark: 0x3d8a3a },
  fan:   { name: 'Fan',    sym: '',  color: 0x8fb4ff, dark: 0x3e62b0 },
};
export const ORDER = ['crank', 'press', 'mint', 'fan'];
// her türün gövde rengi: acele anında makineler rengiyle ayırt edilir
export const BODY = {
  crank: { dark: 0x1d4a57, mid: 0x2f7484, base: 0x3f97a8, hi: 0x8fe0ea },
  press: { dark: 0x7a5a12, mid: 0xb3861d, base: 0xd9a82c, hi: 0xffe08a },
  mint:  { dark: 0x1f5a2e, mid: 0x2f8a46, base: 0x45a85c, hi: 0xa3e6a8 },
  fan:   { dark: 0x2b3f7a, mid: 0x4563ad, base: 0x5b82cf, hi: 0xb5cdff },
};
export const ALERT_SYM = { crank: '⚡', press: '✦', mint: '💎', fan: '❄' };
// oyuncuya gösterilen tarif ve açıklama
export const INFO = {
  crank: { recipe: '→ ⚡ (2 yön)', title: 'Krank: enerji üretir',     body: 'Enerjiyi sadece mavi okların gösterdiği 2 komşuya verir. Dokun: döndür.' },
  press: { recipe: '⚡ → ✦',   title: 'Pres: kıvılcım yapar',          body: 'Krank\'ın okundan enerji alır. ✦ sarı oktan çıkar; ok boş kareyi göstermeli.' },
  mint:  { recipe: '⚡ → 💎',   title: 'Basıcı: para yapar',            body: 'Krank\'ın okundan enerji alır. 💎 yeşil oktan çıkar; ok boş kareyi göstermeli.' },
  fan:   { recipe: '2×2 soğutur', title: 'Fan: 2×2 alanı soğutur',     body: 'Mavi noktanın köşesindeki 2×2 alan yarı hızda ısınır. Dokun: alanı döndür.' },
};
