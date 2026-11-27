# Tık Tık Fabric

Mobil, dokunmatik mini oyunlarla çalışan fabrika roguelike'ı. Phaser 3 + TypeScript + Vite ile web üzerinde geliştirilir, telefona uygulama (PWA) olarak kurulabilir; mağaza için ileride Capacitor ile paketlenir.

Tasarım belgesi ve yol haritası proje dosyalarında: `tasarim-belgesi.md`, `yol-haritasi.md`.

## Çalıştırma

```sh
npm install
npm run dev      # geliştirme sunucusu (aynı ağdaki telefondan da açılır)
npm run build    # dist/index.html: tek dosya, her yerde çalışır
```

`main` dalına her gönderimde GitHub Actions oyunu derleyip GitHub Pages'e yayınlar (`.github/workflows/pages.yml`).

## Kod düzeni

| Dosya | İçerik |
|---|---|
| `src/main.ts` | Phaser oyununu başlatır, ekran boyutunu izler, PWA kaydı |
| `src/theme.ts` | Piksel yoğunluğu (D), ızgara boyutu, renkler, koyu/açık tema |
| `src/data/rules.ts` | **Denge değerleri**: `RULES`, `PROD`, `SHOP`, `BOSS`, `GRADES` |
| `src/data/machines.ts` | Makine türleri, renkler, tarifler |
| `src/data/story.ts` | Nuri Usta'nın konuşmaları |
| `src/data/progress.ts` | Atölye yükseltmeleri (`UPG`) ve mühendisler (`ENG`) |
| `src/state.ts` | Oyun durumu, kalıcı ilerleme (`META`), kayıt/yükleme, `newRun` |
| `src/audio.ts` | Ses efektleri, titreşim, ritimli müzik |
| `src/draw.ts` | Makine çizimleri ve düğmeler |
| `src/scene/Build.ts` | Ana sahne: kurulum, üst bilgi, döngü, dokunma |
| `src/scene/shop.ts` | Dükkan ve modüller |
| `src/scene/meta.ts` | Nuri Usta'nın Atölyesi (koşular arası) |
| `src/scene/flow.ts` | Tur akışı, öğretici, patlama, sonuç ekranı, üretim |
| `src/scene/placement.ts` | Yönler, bağlantılar, Fan alanı |
| `src/scene/heat.ts` | Isı, basınç, patron etkileri |
| `src/scene/dialog.ts` | Konuşma balonları |
| `src/scene/minigames.ts` | Dört mini oyun |

Sahne parçaları ayrı sınıflar olarak yazılır ve `Build.ts` sonunda ana sahneye eklenir.

Tarayıcı konsolunda `__scene` (sahne) ve `__g.state` / `__g.META` hata ayıklama için açıktır.
