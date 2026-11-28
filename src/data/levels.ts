// ---------- leveller: 3 bölge x 10 level ----------
// Her level tek tur. Süre zorluğa göre 60 / 90 / 120 sn; her bölgenin 10. leveli patron.
// Hedef (✦) saniye başına üretim hızı x süre olarak hesaplanır; fabrika büyüdükçe hız artar.
export const AREAS = [
  { name: "Nuri Usta'nın Atölyesi", short: 'Atölye',  base: 12, heat: 0.6,  boom: 6, money: 10, sky: 0x2a2f5a, glow: 0xf0a76a },
  { name: 'Şehir Siparişi',         short: 'Şehir',   base: 15, heat: 0.78, boom: 5, money: 14, sky: 0x1f3550, glow: 0x7fd4e0 },
  { name: 'Fenerler Festivali',     short: 'Festival', base: 18, heat: 0.92, boom: 4, money: 18, sky: 0x3a2450, glow: 0xffd84a },
];
export const PER_AREA = 10;
const TIMES = [60, 60, 60, 90, 60, 90, 90, 120, 90, 120];   // bölge içi süre sırası (patron 120)

export const LEVELS = [];
AREAS.forEach((A, a) => {
  for (let i = 0; i < PER_AREA; i++) {
    const time = TIMES[i];
    const rate = A.base * (1 + 0.28 * i) / 60;               // saniyede ✦
    LEVELS.push({
      area: a, idx: i, time,
      goal: Math.round(rate * time),
      heat: +(A.heat * (1 + 0.025 * i)).toFixed(3),
      boom: A.boom,
      boss: i === PER_AREA - 1 ? ['heat', 'jolt', 'final'][a] : null,
    });
  }
});
