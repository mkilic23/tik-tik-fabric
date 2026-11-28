export const UPG = {
  money:  { name: 'Kumbara',       desc: 'Geçilen her levelde +1 💎',        cost: [8, 14, 20] },
  place:  { name: 'Fazla Tezgâh',  desc: 'Hemen +1 yerleştirme hakkı',       cost: [12, 24] },
  shield: { name: 'Sigorta',       desc: 'Patlama geri sayımı +2 saniye',    cost: [15] },
  offer:  { name: 'Geniş Vitrin',  desc: 'Dükkanda 4. teklif',               cost: [20] },
};
export const ENG = {
  cirak:   { name: 'Çırak',        cost: 0,  color: 0xcf7a3e, desc: 'Özel yeteneği yok. Herkes bir yerden başlar.' },
  tamirci: { name: 'Usta Tamirci', cost: 15, color: 0x5fd38a, desc: 'Mini oyunlarda Mükemmel alanı %60 daha geniş.' },
  tuccar:  { name: 'Tüccar',       cost: 15, color: 0xe0b450, desc: 'Dükkanda +1 teklif ve %20 indirim, ama makineler %15 yavaş.' },
};
// level öncesi güçlendiriciler: level penceresinde seçilir, o levelin denemesinde kullanılır
export const BOOST = {
  time: { name: '+15 sn',     icon: '⏱', color: 0x8fb4ff, desc: 'Level süresi 15 saniye uzar.', cost: 3 },
  cool: { name: 'Soğuk', icon: '❄', color: 0x7fd4e0, desc: 'Bütün makineler tamamen soğuk başlar.', cost: 3 },
  cash: { name: '+5 💎',      icon: '💎', color: 0x7fd47a, desc: 'Levele 5 💎 fazla parayla başlarsın.', cost: 3 },
};
