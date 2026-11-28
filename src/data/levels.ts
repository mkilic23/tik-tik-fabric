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

// ---------- her levelin fikri ve 3. yıldız görevi ----------
// ★1 = hedefi tuttur, ★2 = sürenin RULES.timeStar kadarı kala bitir, ★3 = levelin özel görevi.
// Görev türleri: perfect (en az n Mükemmel tamir), money (en az n 💎 üret), cool (hiçbir makine
// tamamen kızmasın), pressure (basınç %n'i geçmesin), maxRep (en fazla n tamir).
const PLAN = [
  // Bölge 1: öğrenme
  ['Krank enerjiyi, Pres kıvılcımı yapar. Bağla, başlat, ilk tamirlerini yap.', { type: 'perfect', n: 2 }],
  ['Basıcı tanıtımı: kıvılcımın yanında biraz da 💎 üret.', { type: 'money', n: 4 }],
  ['Fan, 2x2 alanındaki makineleri yavaş ısıtır. Bu levelde kimse kızmasın.', { type: 'cool' }],
  ['İlk uzun vardiya: 90 saniye. Basıncı aşağıda tut.', { type: 'pressure', n: 60 }],
  ['Nefes leveli: acele yok, tamirleri tam zamanında yap.', { type: 'perfect', n: 5 }],
  ['Paslı Rıza 💎 fiyatlarını kırdı. Kasayı dolduralım!', { type: 'money', n: 8 }],
  ['Zor vardiya: makineler çabuk ısınıyor. Hiçbiri kızmasın.', { type: 'cool' }],
  ['İlk ✨ Altın saat: ara ara bir makine parlar, 10 saniye 3 kat üretir. Az dokun, akıllı yerleştir.', { type: 'maxRep', n: 14 }],
  ['Mükemmel serisi: ellerini ısıt!', { type: 'perfect', n: 8 }],
  ['Nuri Usta\'nın ilk sınavı. Fan ve Yalıtım Plakası tam bugünlük.', { type: 'pressure', n: 70 }],
  // Bölge 2: öncelik ve zamanlama
  ['Şehir 💎 ile ödüyor. Basıcıları çalıştır.', { type: 'money', n: 8 }],
  ['Az dokun: makineleri iyi yerleştiren az tamir eder.', { type: 'maxRep', n: 10 }],
  ['Belediye siparişi: basınç düşük kalsın.', { type: 'pressure', n: 55 }],
  ['Zor vardiya: büyük sipariş, makineler kızmasın.', { type: 'cool' }],
  ['Nefes leveli: kasaya biraz para koy.', { type: 'money', n: 10 }],
  ['Usta işi: tamirleri tam zamanında yap.', { type: 'perfect', n: 8 }],
  ['Paslı Rıza ile aynı siparişe girdik. Basınç düşük, kafa soğuk!', { type: 'pressure', n: 50 }],
  ['Uzun vardiya: Fan\'ları akıllı kullan, kimse kızmasın.', { type: 'cool' }],
  ['Az dokun: en fazla 15 tamirle hedefi tuttur.', { type: 'maxRep', n: 15 }],
  ['Paslı Rıza vidaları gevşetmiş! Ani ısınmalara mükemmel tamirle cevap ver.', { type: 'perfect', n: 10 }],
  // Bölge 3: her şey bir arada
  ['Festival hazırlığı: fener başına 💎 lazım.', { type: 'money', n: 12 }],
  ['Fener ustalığı: mükemmel tamir serisi.', { type: 'perfect', n: 10 }],
  ['Festival yaklaşıyor: basıncı düşük tut.', { type: 'pressure', n: 55 }],
  ['Zor vardiya: kalabalık fabrika, kimse kızmasın.', { type: 'cool' }],
  ['✨ Altın saat festivali: sık sık altın saat! Festival kasası dolsun.', { type: 'money', n: 15 }],
  ['Az dokun: iyi kurulmuş fabrika kendi kendine çalışır.', { type: 'maxRep', n: 16 }],
  ['Sakin vardiya: basınç %50\'yi geçmesin.', { type: 'pressure', n: 50 }],
  ['Uzun vardiya: ustalığını göster.', { type: 'perfect', n: 14 }],
  ['Finalden önce son prova: kimse kızmasın.', { type: 'cool' }],
  ['Fenerler Gecesi! Festivalin bütün fenerleri bizden.', { type: 'pressure', n: 75 }],
];
LEVELS.forEach((L, i) => { L.idea = PLAN[i][0]; L.task = PLAN[i][1]; });

// ✨ Altın saat: her 'every' saniyede bir rastgele bir makine 'dur' saniye parlar, çıktısı 'mult' kat olur
export const GOLD = { dur: 10, mult: 3 };
const GOLD_EVERY = { 7: 35, 12: 30, 17: 35, 21: 30, 24: 15, 27: 30 };   // level (0'dan) -> aralık (sn)
LEVELS.forEach((L, i) => { L.gold = GOLD_EVERY[i] || 0; });

// görevin yazısı
export function taskText(t) {
  if (t.type === 'perfect') return `En az ${t.n} Mükemmel tamir yap`;
  if (t.type === 'money') return `Bu levelde en az ${t.n} 💎 üret`;
  if (t.type === 'cool') return 'Hiçbir makine tamamen kızmasın';
  if (t.type === 'pressure') return `Basınç %${t.n}'i hiç geçmesin`;
  if (t.type === 'maxRep') return `En fazla ${t.n} tamirle bitir`;
  return '';
}
// görevin durumu: s = level içi sayaçlar (state.task)
export function taskState(t, s) {
  s = s || {};
  if (t.type === 'perfect') return { ok: (s.perfect || 0) >= t.n, failed: false, prog: `${Math.min(s.perfect || 0, t.n)}/${t.n} Mükemmel` };
  if (t.type === 'money') return { ok: (s.earned || 0) >= t.n, failed: false, prog: `${Math.min(s.earned || 0, t.n)}/${t.n} 💎` };
  if (t.type === 'cool') return { ok: !s.hot, failed: !!s.hot, prog: s.hot ? 'Bir makine kızdı ✗' : 'Kimse kızmadı' };
  if (t.type === 'pressure') return { ok: (s.maxP || 0) <= t.n, failed: (s.maxP || 0) > t.n, prog: `En yüksek basınç %${Math.round(s.maxP || 0)} / %${t.n}` };
  if (t.type === 'maxRep') return { ok: (s.repairs || 0) <= t.n, failed: (s.repairs || 0) > t.n, prog: `${s.repairs || 0}/${t.n} tamir` };
  return { ok: false, failed: false, prog: '' };
}
