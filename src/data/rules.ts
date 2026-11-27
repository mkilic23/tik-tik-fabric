// ---------- oyun kuralları (denge için tek yer) ----------
export const RULES = {
  roundTime: 60,                       // saniye
  goals: [15, 25, 40, 55, 75, 100, 130, 160, 190, 225, 260, 300], // 12 tur hedefi (✦): 3 bölüm x 4 tur
  roundsPer: 4,                        // bölüm başına tur
  chapters: [                          // bölüm zorluğu: ısınma çarpanı ve patlama geri sayımı
    { name: 'Atölye', heat: 0.7, boom: 5 },
    { name: 'Şehir Siparişi', heat: 0.9, boom: 4 },
    { name: 'Fenerler Festivali', heat: 1.0, boom: 3 },
  ],
  startPlaces: 3,                      // 1. turda yerleştirme hakkı
  placesPerRound: 2,                   // sonraki turlarda eklenen hak
  startMoney: 10,
  chapterKit: [0, 15, 30],             // bölüm 2/3'ten başlayınca verilen ek 💎 (kaçırılan turların yerine)
  heatRate: { crank: 0.045, press: 0.04, mint: 0.035, fan: 0.03 }, // saniyede ısınma (0-1)
  idleHeat: 0.4,                       // çalışamayan makine bu oranda ısınır
  fanCool: 0.5,                        // Fan'ın 2x2 alanındaki makineler yarı hızda ısınır
  needAt: 0.7,                         // bu ısıda ! çıkar
  tapAt: 0.35,                         // bu ısının üstünde bakım yapılabilir
  afterGrade: { perfect: 0, good: 0.15, bad: 0.35 }, // bakımdan sonra kalan ısı
  carryHeat: 0.6,                      // tur arasında ısının bu kadarı kalır
  missHeat: 0.6,                       // hedefin eksik oranı x 0.6 = eklenen ısı
  winCool: 0.1,                        // hedef tutunca ek soğuma
  ventCost: 5, ventCool: 0.25,         // soğutma: 5 💎 ile tüm makineler -%25 ısı
  bufMax: 4,                           // Krank'ın biriktirebildiği enerji
  mgTime: 4,                           // mini oyun süre sınırı
  bonusEvery: 3,                       // hedef tutunca: kalan her 3 sn = +1 💎 bonus
  ringSpeed: 1.3, ringHeat: 1.2,       // Halka komşularına: hız ve ısınma çarpanı
  plateHeat: 0.6,                      // Plaka: ısınma çarpanı
  rerollCost: 2,                       // dükkan yenileme (her yenilemede +1)
};
// her makine: kaç saniyede bir çalışır, ne harcar, ne üretir
export const PROD = {
  crank: { every: 1.0, cost: null,     out: 'energy' },
  press: { every: 1.5, cost: 'energy', out: 'spark' },
  mint:  { every: 2.5, cost: 'energy', out: 'money' },
  fan:   { every: 0,   cost: null,     out: null },
};
// dükkan teklifleri
export const SHOP = {
  ring:  { name: 'Güçlendirici Halka', cost: 6, mod: true, color: 0xe0b450, desc: 'Komşu makineler %30 hızlı çalışır ama biraz daha çok ısınır.' },
  plate: { name: 'Yalıtım Plakası',    cost: 5, mod: true, color: 0x9fb0c8, desc: 'Takılan makine %40 daha yavaş ısınır.' },
  place: { name: '+1 Yerleştirme',     cost: 4, color: 0x5fd38a, desc: 'Bir makine daha koyma hakkı.' },
  ice:   { name: 'Buz Kalıbı',         cost: 6, color: 0x8fb4ff, desc: 'Tüm makineleri hemen tamamen soğutur.' },
};
export const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];  // 0 yukarı, 1 sağ, 2 aşağı, 3 sol
export const DEFAULT_ROT = { crank: 1, press: 0, mint: 0, fan: 0 };
// patron turları (her bölümün son turu)
export const BOSS = {
  3:  { name: 'Sıcak Hava Dalgası', desc: 'Bu turda makineler %40 hızlı ısınır.', heat: 1.4,
        lines: ['Eyvah, sıcak hava dalgası geliyor! Bu vardiya bütün makineler %40 daha hızlı ısınacak.', 'Fan ve Yalıtım Plakası tam bugünlük. Hazırlan!'] },
  7:  { name: 'Gevşek Vidalar', desc: 'Her 10 saniyede bir makine aniden ısınır.', jolt: 10, joltAmt: 0.35,
        lines: ['Bu makinelerin vidaları gevşemiş... Bu vardiya ara ara bir makine aniden ısınacak.', 'Gözünü dört aç, kırmızı parlayanı hemen soğut!'] },
  11: { name: 'Final: Sıcak ve Gevşek', desc: '%25 hızlı ısınma ve her 12 saniyede ani ısınma.', heat: 1.25, jolt: 12, joltAmt: 0.3,
        lines: ['Final vardiyası evlat! Hem hava sıcak hem vidalar gevşek.', 'Bunu da atlatırsak festivalin bütün fenerleri bizden. Haydi!'] },
};
export const GRADES = {
  perfect: { label: 'MÜKEMMEL!', color: '#7fe3a5', mult: 2,   secs: 6 },
  good:    { label: 'İYİ',       color: '#ffe3a8', mult: 1.4, secs: 4 },
  bad:     { label: 'KÖTÜ',      color: '#ff8a7c', mult: 1,   secs: 0 },
};
export const MG_TEXT = { crank: 'Krank: bıçağı fırlat!', press: 'Pres: zamanla!', mint: 'Basıcı: kalıbı durdur!', fan: 'Fan: hızlandır!' };
export const RES = {
  spark:  { sym: '✦', color: '#ffd84a' },
  energy: { sym: '⚡', color: '#4fd6e0' },
  money:  { sym: '💎', color: '#7fd47a' },
};
