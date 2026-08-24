# Referans görselden otomatik coğrafya taraması: adım adım iş planı

> **Durum:** Planlama dokümanı, henüz uygulanmadı. `docs/city-generation-plan.md`
> ile birlikte **Opus 5** oturumunda ele alınacak. Bu dosya kendi başına
> yeterli olacak şekilde yazıldı (önceki sohbetin özeti dahil).

---

## 0) Önceki kararların özeti

- **Kapsam: yalnızca coğrafya** (kıyı/kara, nehir, göl). Şehir/sembol
  **tanıma** kapsam dışı — ML/AI-görme gerektirir, bu proje sıfır-backend
  mimarisiyle çelişir (ayrıntılı maliyet analizi sohbet geçmişinde).
- **Semboller "dağ" gibi yanlış coğrafyaya dönüşmemeli.** Görseldeki
  işaret/ikon benzeri lekeler (küçük + kompakt + yüksek yerel renk
  çeşitliliği) **önce tespit edilip maskelenir**, coğrafya
  sınıflandırmasına hiç girmez; maskeli alan çevresindeki arazinin
  çoğunluk oyuyla doldurulur (**"araziyi devam ettir"**) — yanlış bir
  özellik uydurmak yerine.
- **Yöntem: tamamen klasik görüntü işleme** (eşikleme, bağlı bileşen
  analizi, iskeletleştirme) — ML modeli yok, API çağrısı yok, ek
  bağımlılık yok. Mevcut `Tools._buildRefTrace`/`Tools.snapToRefEdge`
  (iz sürme modu, `js/tools.js:944-980`) altyapısının üzerine inşa
  edilir.
- **Bu turun ek istekleri:**
  1. **Öncelik #1: minimum tarama süresi** — en optimize şekilde
     implemente edilmeli.
  2. Tarama sırasında **aşamalı bir ilerleme çubuğu** ("şu an ne
     yapılıyor" yazısıyla).
  3. Rastgele harita üretiminde (`btn-landgen`) **zar yuvarlama
     animasyonu**.

---

## 1) Performans mimarisi (öncelik #1 — önce bu kararlaştırılmalı)

Mevcut kod tabanında zaten kanıtlanmış, aynı sınıf problemi (büyük
piksel verisi üzerinde ağır işlem, UI donmadan) çözen bir desen var:
`Tools.autoBiome`'un **zaman-bütçeli chunk + `setTimeout(0)` arası**
yaklaşımı (bkz. `CLAUDE.md`: "~60ms zaman bütçesi... hızlı cihazda az
yield, yavaş cihazda sık ama kısa duraklama"). Taramanın **her**
piksel-yoğun aşaması bu deseni birebir kullanacak. Buna ek olarak:

### 1.1 Sabit çalışma çözünürlüğüne indirgeme

`generateLandmass`'ın blur+eşikleme geçişinin sabit `GEN_MAX=1024px`'e
indirgenmesiyle aynı gerekçe: kaynak görsel ne kadar büyük olursa olsun
(kullanıcı 4000×3000'lik bir tarama yükleyebilir), **iş her zaman sabit
bir çalışma ızgarasında** (`SCAN_GRID = 512` — kısa kenar bazlı, `sw ×
sh` şeklinde, `autoBiome`'un `N` hesaplama deseniyle aynı: `Math.max(24,
Math.min(90, ...))` yerine burada tek bir sabit üst sınır kâfi çünkü
girdi kullanıcı-yüklemesi, harita boyutuna bağlı değil) yapılır. Daha
yüksek çözünürlük doğruluğu neredeyse hiç artırmaz ama süreyi kareyle
katlar — tam olarak `CLAUDE.md`'nin belgelediği optimizasyon.

### 1.2 Tek seferlik piksel okuma

Görsel, **bir kez** küçük bir offscreen canvas'a `drawImage` ile
`SCAN_GRID` boyutuna indirgenir, **bir kez** `getImageData` çağrılır.
Sonuç, ham `Uint8ClampedArray` yerine önceden hesaplanmış tipli
dizilere dönüştürülür (`Float32Array` parlaklık, `Uint8Array`
kara/deniz ön-sınıflandırması) — **sonraki hiçbir aşama tekrar
`getImageData` çağırmaz**, hepsi bu diziler üzerinde çalışır. Bu,
`Tools.autoBiome`/`generateRivers`'ın zaten kullandığı "küçük canvas'a
indir, tek `getImageData`, sonra saf dizi işlemi" deseninin aynısı.

### 1.3 Yığın-tabanlı (özyinelemesiz) bağlı bileşen etiketleme

Flood-fill/bağlı bileşen analizi **özyinelemeli değil, açık bir
yığın/kuyruk ile** yazılır (büyük düz alanlarda özyineleme JS çağrı
yığınını taşırabilir — bu proje zaten `Tools.floodFill`'de bu dersi
almış, aynı deseni tekrar kullan). Etiketler `Int32Array`'de, ziyaret
durumu `Uint8Array`'de tutulur — nesne/obje tabanlı yapı yok.

### 1.4 Aşamalar ucuzdan pahalıya sıralanır, erken çıkış

Görsel yüklenemedi/tamamen tek renk/boş → ilk (en ucuz) aşamada tespit
edilip kullanıcıya mesaj verilir, kalan pahalı aşamalara hiç girilmez
(`generateRivers`'ın "kara yoksa erken çık" deseniyle aynı mantık).

### 1.5 Hedef bütçe (somut sayı)

`SCAN_GRID=512` (≈262K hücre) için: **tek kare asla ~55-60ms'yi
aşmasın** (`autoBiome` ile aynı bütçe), **toplam duvar-saati hedefi
orta seviye bir cihazda ~0.5-1.5 saniye** (birkaç yield arası). Bu,
performans regresyon testinde (bkz. §5) sayısal olarak doğrulanacak.

---

## 2) Boru hattı — 6 aşama, her biri kendi progress-callback'iyle

`Tools.scanReferenceImage(opts)` — **Promise döndürür**, tıpkı
`Tools.autoBiome(seed)` gibi. `opts.onProgress(stageIndex, stageCount,
stageKey, fraction)` her yield noktasında çağrılır (`fraction`: o
aşamanın kendi içindeki 0-1 ilerlemesi — satır satır işleniyorsa işlenen
satır oranı).

| # | Aşama (i18n anahtarı) | Ne yapar | Karmaşıklık / chunk stratejisi |
|---|---|---|---|
| 1 | `scan_prepare` — "Görsel hazırlanıyor" | Görseli `SCAN_GRID`'e indir, tek `getImageData`, parlaklık + kaba renk-kanalı dizilerini hesapla (§1.2) | Tek geçiş, chunk gerekmez (~10-30ms) |
| 2 | `scan_markers` — "İşaretler tespit ediliyor" | Bağlı bileşen etiketleme (§1.3) + her bileşen için boyut/kompaktlık/yerel-renk-çeşitliliği ölçütü (§0) → "muhtemel işaret" listesi | Satır-bloklu chunk (autoBiome deseni) |
| 3 | `scan_clean` — "İşaretler temizleniyor" | Her işaret bölgesini, sınırındaki halkanın çoğunluk oyuyla doldur (§0 "araziyi devam ettir") | İşaret sayısı genelde küçük (~onlarca) — tek chunk yeterli olabilir, yine de zaman-bütçeli döngüye sokulur (garanti için) |
| 4 | `scan_coast` — "Kıyı çizgisi çıkarılıyor" | Temizlenmiş görüntüde eşikleme + flood-fill ile kara/deniz maskesi, kontur takibiyle `landmass` fırça-darbesi/vektör konturuna çevir | Satır-bloklu chunk |
| 5 | `scan_water` — "Nehir ve göller ayrıştırılıyor" | İç (kıyıya değmeyen) su bileşenlerini işaretle → aspect-ratio/kompaktlık eşiğiyle nehir (ince-uzun → iskeletleştir → yol noktaları) vs göl (kapalı gövde → poligon) ayır | Bileşen sayısı kadar chunk (genelde az) |
| 6 | `scan_commit` — "Katmanlara yazılıyor" | Sonuçları gerçek `Layers` nesnelerine yaz: `landmass` rasterine boya, `rivers` katmanına nehir/göl vektör nesneleri; **tek atomik `History.pushCombo`** adımı (mevcut `generateLandmass`+`autoLakes` zincir deseniyle aynı — bkz. `runLandgen`) | Tek geçiş |

**Neden bu sıra:** 2→3 önce çalışmalı ki 4/5'teki coğrafya
sınıflandırması işaretleri hiç görmesin (§0'ın temel garantisi budur).

---

## 3) İlerleme çubuğu — UI tasarımı

`UI.modal()` bu iş için **uygun değil** (statik HTML + tek OK/Cancel,
canlı güncellenmiyor) — yeni, amaca özel bir bindirme gerekiyor:

### 3.1 Yeni DOM parçası: `#scan-progress`

```html
<div id="scan-progress" class="hidden" aria-live="polite">
  <div class="scan-progress-box">
    <div class="scan-progress-title" data-i18n="scan_title">Harita taranıyor…</div>
    <div class="scan-progress-bar-track">
      <div class="scan-progress-bar-fill" id="scan-progress-fill"></div>
    </div>
    <div class="scan-progress-stage" id="scan-progress-stage">Görsel hazırlanıyor…</div>
    <button class="btn" id="scan-progress-cancel" data-i18n="scan_cancel">İptal</button>
  </div>
</div>
```

- Konumu: `#modal` ile aynı seviyede (tam ekran karartma + ortalanmış
  kutu), ama **ayrı** bir eleman — modal'ın OK/Cancel akışına
  karışmasın.
- Görsel dil: mevcut ink/brass paleti (`--ink-800/900`, marka rengi —
  başlıktaki "WAYBORNE MAP EDİTÖR" pirinç tonuyla aynı vurgu rengi
  dolgu çubuğunda kullanılır). Yeşil/kırmızı gibi anlamsal renkler
  gerekmiyor — tek, sabit bir "ilerliyor" rengi yeterli.
- **İptal butonu:** `Tools.scanReferenceImage`'in dahili bir
  `cancelled` bayrağı kontrol etmesi + her `setTimeout(0)` yeniden
  girişinde bu bayrağı yoklaması yeterli (aynı chunk-döngüsü zaten var,
  ek kontrol maliyeti sıfıra yakın). İptalde: o ana kadar hiçbir katman
  yazılmamış olmalı (aşama 6'ya kadar hiçbir gerçek `Layers` mutasyonu
  yapılmıyor zaten — §2'nin 1-5. aşamaları yalnız bellekte çalışıyor,
  bu da iptali "ucuz" ve güvenli kılıyor).

### 3.2 Bağlama (`UI` tarafında)

```js
UI.showScanProgress = function () { $('scan-progress').classList.remove('hidden'); };
UI.hideScanProgress = function () { $('scan-progress').classList.add('hidden'); };
UI.updateScanProgress = function (stageIndex, stageCount, stageKey, fraction) {
  var pct = Math.round(((stageIndex + fraction) / stageCount) * 100);
  $('scan-progress-fill').style.width = pct + '%';
  $('scan-progress-stage').textContent = UI.t(stageKey) + ' · ' + pct + '%';
};
```

`btn-ref-scan` (yeni buton, referans panelinde) tıklanınca:
```js
UI.showScanProgress();
Tools.scanReferenceImage({ onProgress: UI.updateScanProgress })
  .then(function () { UI.hideScanProgress(); UI.refreshHistory(); Cv.requestRender(); })
  ['catch'](function () { UI.hideScanProgress(); /* iptal ya da hata mesajı */ });
```

Bu, `runLandgen`'in zincir + buton-disable desenini bire bir takip
ediyor, sadece metin yerine gerçek bir ilerleme çubuğu var.

### 3.3 i18n

Yeni anahtarlar (en az tr/en; diğer 9 dil `UI.t()`'nin İngilizce
fallback'ine güvenebilir, madem yapı zaten böyle çalışıyor):
`scan_title`, `scan_cancel`, `scan_prepare`, `scan_markers`,
`scan_clean`, `scan_coast`, `scan_water`, `scan_commit`.

---

## 4) Zar yuvarlama animasyonu (rastgele harita üretimi)

Hedef: `js/ui.js:1652`'deki `runLandgen()` — şu an butonu
`disabled=true` + metni `'⏳ …'` yapıyor. Bunun yerine:

- Küçük, tek-renk mürekkep tarzı bir zar SVG'si (`.ico-svg` kuralına
  uygun — `stroke="currentColor"`, emoji değil), 6 yüzü basit nokta
  düzenleriyle çizilmiş tek bir `<svg>` içinde (`<g class="face-1">`…
  `<g class="face-6">`, CSS ile sırayla `opacity`/`visibility`
  değiştirilir).
- CSS `@keyframes` ile hem **3B döner gibi** hafif bir `rotate3d`/`scale`
  hem de **yüz değişimi** (`steps(6)` timing fonksiyonuyla ~6 kareyi
  sırayla göster) — saf CSS, JS'de sadece animasyon class'ını
  ekleyip/kaldırmak yeterli.
- `runLandgen()`'deki mevcut disable/relabel bloğu:
  ```js
  if (btn) { btn.disabled = true; btn.classList.add('rolling-dice'); }
  // ...zincir...
  chain.then(function () {
    if (btn) { btn.disabled = false; btn.classList.remove('rolling-dice'); }
  });
  ```
  `.rolling-dice` class'ı buton içindeki zar SVG'sini görünür yapıp
  animasyonu başlatır — buton metni olduğu gibi kalabilir ya da zar
  ikonuyla geçici olarak değişebilir (tasarım tercihi, Opus 5 ile
  netleşir).
- **Neden bu kadar basit kalabilir:** yeni bağımlılık yok (saf
  SVG+CSS), performans maliyeti sıfıra yakın (CSS animasyonu GPU
  compositing'te), ve zaten var olan disable/relabel noktasına
  ekleniyor — mimari değişiklik gerektirmiyor.
- `prefers-reduced-motion` kontrolü eklenmeli (projenin genel
  erişilebilirlik ilkesiyle tutarlı olması için) — hareket azaltma
  tercih edilmişse zar dönmesin, sade bir "⏳" ile değiştirilsin.

---

## 5) Test planı

Yeni `run-refimg-scan-test.mjs`, mevcut CDP-tabanlı test iskeletiyle
(bkz. `CLAUDE.md § Tests`):

1. **Sentetik test görseli** (gerçek dosya yükleme yok — bir canvas'a
   programatik olarak çizilir): bilinen bir kara/deniz düzeni + içine
   gömülü, **tamamen kara alanın ortasında duran** küçük, çok renkli,
   kompakt bir "ikon benzeri" leke + bir ince-uzun "nehir" şekli + bir
   kapalı "göl" şekli.
2. `Tools.scanReferenceImage()` çağrılır, şunlar doğrulanır:
   - Promise çözülüyor (reddedilmiyor).
   - **İşaret maskeleme çalışıyor:** sonuç `landmass` katmanında,
     ikon-benzeri lekenin bulunduğu konumda **hâlâ kara var** (delik
     yok, yanlış bir "dağ"/anomali yok) — §0'ın temel garantisinin
     doğrudan testi.
   - Nehir/göl sayısı sentetik olarak çizilenle kabaca eşleşiyor.
   - `onProgress` çağrıları: aşama sırası beklenen sırayla (`scan_prepare`
     → … → `scan_commit`), genel ilerleme monotonik artıyor, sonunda 1.0'a
     ulaşıyor.
   - **Performans regresyon bekçisi:** toplam duvar-saati §1.5'teki
     hedef bütçenin altında (ör. `< 2000ms`) — ileride birisi
     optimizasyonu bozarsa bu test kırılır.
3. **İptal testi:** tarama başlatılır, birkaç yield sonra iptal
   tetiklenir, hiçbir `Layers` mutasyonunun gerçekleşmediği (aşama 6'ya
   hiç girilmediği) doğrulanır.

---

## 6) Uygulama sırası (öneri)

1. **§1 + §2'nin çekirdeği** (aşama 1-4: hazırlık, işaret tespiti,
   temizleme, kıyı çıkarımı) — tek başına test edilebilir bir milestone;
   §5'teki "delik yok" testi burada zaten anlamlı hâle gelir.
2. **§2 aşama 5-6** (nehir/göl ayrımı + katmanlara yazma) — kıyı
   çıkarımı doğrulandıktan sonra üstüne eklenir.
3. **§3 (ilerleme çubuğu UI'ı)** — çekirdek boru hattı `onProgress`
   çağırmaya zaten hazır olduğundan (§2 tasarımı baştan bunu
   öngörüyor), bu adım saf UI çalışması, pipeline'a dokunmaz.
4. **§5 performans regresyon testi** — 1-2 bittiği anda eklenmeli (geç
   kalınırsa optimizasyon kararları geriye dönük doğrulanamaz).
5. **§4 (zar animasyonu)** — tamamen bağımsız, herhangi bir noktada
   yapılabilir, önceliği en düşük (kullanıcı "mümkünse" dedi).

---

## Açık sorular (Opus 5 ile netleşecek)

1. İşaret tespiti eşikleri (§0'daki boyut/kompaktlık/renk-çeşitliliği
   sınırları) gerçek örnek harita görselleri üzerinde **görsel olarak**
   kalibre edilmeli — bu doküman yöntemi tarif ediyor, sayıları değil.
2. Nehir iskeletleştirme algoritmasının somut implementasyonu (Zhang-Suen
   benzeri ince bir thinning, ya da daha basit bir "orta-eksen
   örnekleme") — performans bütçesi göz önünde birkaç seçenek
   denenmeli.
3. İlerleme çubuğunun tam görsel tasarımı (§3.1 yalnız işlevsel bir
   iskelet) — marka diline oturtmak görsel bir karar.
4. Zar animasyonunun buton içinde mi yoksa buton yanında ayrı bir
   ikon olarak mı gösterileceği — küçük bir UX tercihi.
