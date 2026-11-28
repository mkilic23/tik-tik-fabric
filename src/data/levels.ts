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
  ['Buhar sızıntısı! Yanındaki makineler hızlı ısınır. Fan\'ın 2x2 alanı sızıntıyı kapatır. Kimse kızmasın.', { type: 'cool' }],
  ['İlk uzun vardiya: 90 saniye. Basıncı aşağıda tut.', { type: 'pressure', n: 60 }],
  ['Nefes leveli: acele yok, tamirleri tam zamanında yap.', { type: 'perfect', n: 5 }],
  ['Paslı Rıza 💎 fiyatlarını kırdı. Kasayı dolduralım!', { type: 'money', n: 8 }],
  ['Zor vardiya: makineler çabuk ısınıyor, borudan yine buhar sızıyor. Hiçbiri kızmasın.', { type: 'cool' }],
  ['İlk ✨ Altın saat: ara ara bir makine parlar, 10 saniye 3 kat üretir. Parlayan Basıcı bol 💎 getirir!', { type: 'money', n: 8 }],
  ['Mükemmel serisi: ellerini ısıt!', { type: 'perfect', n: 8 }],
  ['Nuri Usta\'nın ilk sınavı. Fan ve Yalıtım Plakası tam bugünlük.', { type: 'pressure', n: 70 }],
  // Bölge 2: öncelik ve zamanlama
  ['Sıralı sipariş: şehir önce ✦, sonra 💎, sonra yine ✦ istiyor. Üstteki çubuk sıradakini gösterir.', { type: 'money', n: 6 }],
  ['Az dokun: makineleri iyi yerleştiren az tamir eder.', { type: 'maxRep', n: 10 }],
  ['Belediye siparişi: basınç düşük kalsın.', { type: 'pressure', n: 55 }],
  ['Sıralı sipariş ve bir buhar sızıntısı: tamirleri tam zamanında yap.', { type: 'perfect', n: 8 }],
  ['Nefes leveli: kasaya biraz para koy.', { type: 'money', n: 10 }],
  ['Usta işi: tamirleri tam zamanında yap.', { type: 'perfect', n: 8 }],
  ['Paslı Rıza ile yarış! Aynı siparişi ondan önce bitir. Basınç düşük, kafa soğuk!', { type: 'pressure', n: 60 }],
  ['Uzun vardiya: iki buhar sızıntısı var. Fan\'ları akıllı kullan, kimse kızmasın.', { type: 'cool' }],
  ['Büyük sıralı sipariş: sırayla üret, en fazla 15 tamirle bitir.', { type: 'maxRep', n: 15 }],
  ['Paslı Rıza vidaları gevşetmiş! Ani ısınmalara mükemmel tamirle cevap ver.', { type: 'perfect', n: 10 }],
  // Bölge 3: her şey bir arada
  ['Festival hazırlığı: fener başına 💎 lazım.', { type: 'money', n: 12 }],
  ['Fener ustalığı: mükemmel tamir serisi.', { type: 'perfect', n: 10 }],
  ['Festival yaklaşıyor: basıncı düşük tut.', { type: 'pressure', n: 55 }],
  ['Kalabalık fabrika ve iki sızıntı. Basıcılarla kasayı doldur.', { type: 'money', n: 12 }],
  ['✨ Altın saat festivali: sık sık altın saat! Festival kasası dolsun.', { type: 'money', n: 15 }],
  ['Az dokun: iyi kurulmuş fabrika kendi kendine çalışır.', { type: 'maxRep', n: 16 }],
  ['İki sızıntılı vardiya: Fan\'larla kapat, basınç %50\'yi geçmesin.', { type: 'pressure', n: 50 }],
  ['Uzun vardiya: ustalığını göster.', { type: 'perfect', n: 14 }],
  ['Finalden önce son prova: kimse kızmasın.', { type: 'cool' }],
  ['Fenerler Gecesi! Paslı Rıza da son kez yarışmak istiyor. Festivalin bütün fenerleri bizden.', { type: 'pressure', n: 75 }],
];
LEVELS.forEach((L, i) => { L.idea = PLAN[i][0]; L.task = PLAN[i][1]; });

// ✨ Altın saat: her 'every' saniyede bir rastgele bir makine 'dur' saniye parlar, çıktısı 'mult' kat olur
export const GOLD = { dur: 10, mult: 3 };
const GOLD_EVERY = { 7: 35, 12: 30, 17: 35, 21: 30, 24: 15, 27: 30 };   // level (0'dan) -> aralık (sn)
LEVELS.forEach((L, i) => { L.gold = GOLD_EVERY[i] || 0; });

// 💨 Buhar sızıntısı: levelin başında boş bir kareye konur; çevresindeki 8 karedeki makineler
// RULES.steamHeat kat hızlı ısınır. Bir Fan'ın 2x2 alanı sızıntıyı kapsarsa buhar kesilir.
const STEAM = { 2: 1, 6: 1, 13: 1, 17: 2, 23: 2, 26: 2 };   // level (0'dan) -> sızıntı sayısı
LEVELS.forEach((L, i) => { L.steam = STEAM[i] || 0; });
// sızıntı için tercih edilen kareler (ortaya yakın), sonra geri kalanlar
export const STEAM_SPOTS = [14, 21, 15, 20, 9, 26, 13, 22, 8, 27, 16, 19];
for (let i = 0; i < 36; i++) if (!STEAM_SPOTS.includes(i)) STEAM_SPOTS.push(i);

// 📋 Sıralı sipariş: hedef sırayla tamamlanan 3 adım (önce ✦, sonra 💎, sonra yine ✦)
const ORDER = { 10: 0.35, 13: 0.4, 18: 0.4 };   // level (0'dan) -> ✦ adımı = hedefin bu kadarı
LEVELS.forEach((L, i) => {
  L.order = null;
  if (!ORDER[i]) return;
  const s = Math.max(4, Math.round(L.goal * ORDER[i])), m = Math.max(3, Math.round(L.goal * ORDER[i] * 0.38));
  L.order = [{ res: 'spark', n: s }, { res: 'money', n: m }, { res: 'spark', n: s }];
});
// 🏁 Paslı Rıza yarışı: Rıza'nın çubuğu, sürenin 'pace' kadarında hedefe ulaşır; ondan önce bitirmelisin
const RACE = { 16: 0.81, 29: 0.85 };   // her Mükemmel tamir Rıza'yı hedefin %2'si kadar geri iter
LEVELS.forEach((L, i) => { L.race = RACE[i] || 0; });
export const RES_SYM = { spark: '✦', money: '💎' };
// hedefin kısa yazısı: "✦ 40" ya da "✦6 → 💎3 → ✦6"
export function goalText(L) { return L.order ? L.order.map(o => RES_SYM[o.res] + o.n).join(' → ') : `✦ ${L.goal}`; }
// level penceresindeki küçük etiketler
export function levelTags(L) {
  const t = [];
  if (L.order) t.push('📋 Sıralı sipariş');
  if (L.race) t.push('🏁 Rıza yarışı');
  if (L.steam) t.push('💨 x' + L.steam);
  if (L.gold) t.push('✨ Altın saat');
  return t.join('   ');
}

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
