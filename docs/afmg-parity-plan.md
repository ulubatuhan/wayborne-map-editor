# AFMG paritesi — yapılabilir özellikler iş planı

> **Durum (uygulandı):** Ortak altyapı (`Geo.traceContour`), **#1 Devlet/
> Kültür simülasyonunun çekirdeği** (devlet üretimi, kültür üretimi,
> `Cv.politicalMode` görünüm filtresi, `run-geo-contour-test.mjs`,
> `run-states-culture-test.mjs`), **#1c devlet editörü** (hükümet biçimi
> ve başkenti elle düzenleme, elle çizilen bölgeyi devlete dönüştürme ve
> geri alma — hepsi tek adımlık undo ile) ile **#2 Yerleşim nüfusu**
> hayata geçirildi
> — bkz. `js/canvas.js`'teki `Geo.traceContour`/`Geo.pointInPolygon`/
> `Cv.drawCapitalMark`, `js/tools.js`'teki `Tools.generateStates`/
> `generateCultures`/`cultureAt`/`makeState`/`unmakeState`/
> `setStateGovernment`/`pickCapitalAt`, ve CLAUDE.md'nin
> "State / culture generation" bölümü. Aşağıdaki öğeler **bilinçli olarak
> dışarıda bırakıldı**, mimari engel yok, sadece öncelik sırası
> gereği ertelendi: `cultureAt`'in otomatik isim üretimine bağlanması, #5
> (iklim simülasyonu), #6 (zones/notlar/isim-tabanı/yükselti-şablonu
> editörleri), #7 (GIS export), #9 (TTS/URL parametresi/tema). Aşağıdaki
> plan metni orijinal haliyle korunuyor — hangi kısmın yapıldığını
> yukarıdaki durum notundan takip edin.
>
> Kapsam: Azgaar's Fantasy Map Generator (AFMG) kıyaslamasında bulunan 9
> eksikten **#3 (Askeri katman / Battle Simulator) hariç** kalan 8'i kapsar.
> #3 kasıtlı olarak dışarıda bırakıldı — oyun mekaniği simülasyonu, harita
> editörü kapsamının dışında.
>
> Aşağıdaki 8 maddenin **tamamı mimariyle uyumlu ve yapılabilir** — hiçbiri
> backend, npm bağımlılığı veya build adımı gerektirmiyor; hepsi mevcut
> "ucuz N×N ızgara üzerinde hesapla, sonucu vektör nesnesi olarak katmana
> yaz, `History`'ye atomik push et" desenini (bkz. `Tools.autoLakes`,
> `Tools.autoBiome`, `Tools.generateRivers`) genişletiyor. Tek istisna
> Ollama entegrasyonu (#9c) — teknik olarak mümkün ama projenin "backend
> yok" felsefesiyle gerilimde, aşağıda ayrıca işaretlendi.
>
> Bu belge yalnızca **plan**dır — hiçbir kod değişikliği içermez. Uygulama
> ayrı bir oturumda, kullanıcı onayıyla devreye alınır (bkz. proje
> geçmişindeki `docs/city-generation-plan.md` / `docs/reference-image-scan-plan.md`
> akışı).

## Öncelik sırası (önerilen)

1. **Ortak altyapı: sınır izleyici (contour tracer)** — aşağıdaki 3 madde bunu paylaşır, önce bu yazılmalı.
2. **#6 Bölge/veri editör araçları** — küçük, bağımsız, hızlı kazanım.
3. **#1 Devlet/Kültür/Din simülasyonu** — en büyük ama en çok fark yaratan.
4. **#2 Yerleşim ekonomisi/nüfus** — #1'in doğal devamı, ondan bağımsız da yapılabilir.
5. **#7 GIS dışa aktarımı** — vektör katmanlar zaten hazır, düşük efor.
6. **#4 Amblem/heraldik üreteci** — #1'den sonra anlamlı (kime ait amblem?).
7. **#5 İklim simülasyonu** — `autoBiome`'u güçlendiren, izole yapılabilir iyileştirme.
8. **#8 Otomatik şehir üretimi** — zaten ayrı planı var (`docs/city-generation-plan.md`), burada sadece çapraz referans.
9. **#9 Küçük ekstralar** — TTS ve URL parametreleri ucuz, istenirse en sona bırakılabilir.

---

## Performans tasarım kuralları (FPS bütçesi garantisi)

Her yeni özelliğin iki ayrı bütçeye çarpması gerekiyor: **render-döngüsü**
(kare başına 16.67ms, `run-fps.mjs` idle/pan/zoom'da ölçüyor) ve **tek
seferlik üretim** (`run-perf-audit.mjs`: işlem başına <1sn, tam pipeline
<2sn). Aşağıdaki 8 maddenin çoğu ikinci bütçeye zaten güvenle sığıyor
(hepsi `autoLakes`/`autoBiome` sınıfı ucuz ızgara işi); asıl dikkat isteyen
**render-döngüsü** tarafı — iki madde (#1 kültür/din görünümü, #5 rüzgar
okları) yanlış uygulanırsa bunu kolayca ihlal edebilir. O yüzden bu iki
kural **zorunlu** — ilgili fazlarda tekrar referans veriliyor:

**Kural A — Yeni "görünüm katmanları" vektör olmalı, raster olmamalı.**
`territories` katmanı zaten çokgen nesnelerin listesi olarak render
ediliyor (`Cv`'de `renderMap`'in `'territories'` dalı) — kaç nesne olursa
olsun maliyet nesne sayısıyla orantılı, tuval boyutuyla değil. Kültür/din
bölgeleri **aynı şekilde** çokgen nesneleri olarak (`kind:'culture'`,
`kind:'religion'` gibi) `territories`'e eklenmeli, **asla** "her karede
2048×2048 pikseli yeniden boyayan bir overlay canvas'ı" olarak değil. Bu,
zaten yapılması planlanan şeyin (§1) doğal sonucu — ekstra iş değil,
sadece "sakın raster'a kayma" uyarısı.

**Kural B — Türetilmiş görselleştirmeler "dirty-ise-yeniden-üret, aksi
halde önbellekten kompozitle" desenini kullanmalı.** Kıyı parlaması
(`Cv.shoreDirty` → `Cv.buildShoreCanvas`) ve yükselti gölgelendirmesi
(`Cv.elevationDirty` → `Cv.buildElevationEffect`) zaten bu deseni
kullanıyor: pahalı hesaplama sadece kaynak veri değiştiğinde bir kez
çalışır, sonucu bir önbellek canvas'ına yazılır, her kare o önbellek
`drawImage` ile kompozitlenir. Rüzgar okları (#5) **aynı deseni** takip
etmeli: `Cv.windArrowsDirty` bayrağı + `Cv.buildWindArrowsCache()` —
oklar iklim verisi (deniz seviyesi/enlem/rüzgar yönü) her değiştiğinde bir
kez hesaplanıp sabit sayıda ok-simgesi olarak bir önbellek canvas'ına
çizilir; kare başına maliyet sabit bir `drawImage`, N×N ızgara boyutundan
bağımsız.

**Üçüncü, daha genel kural**: yeni bir "otomatik üret" adımı mevcut
"Üret" düğmesinin Nehir/Göl/Arazi zincirine **sessizce eklenmemeli**.
Devlet/kültür üretimi (§1) kendi ayrı düğmesinde kalmalı — aksi halde tam
pipeline'ın ölçülü süresi (şu an ~1.2-1.3sn, 2sn bütçenin altında) yeniden
doğrulanmadan büyür. Her yeni zincire eklenen adım `run-perf-audit.mjs`'e
yeni bir satır olarak eklenmeli.

---

## Ortak altyapı: `Geo.traceContour(mask, w, h)`

Devlet sınırları (#1), GIS dışa aktarımı (#7) ve ileride başka "ızgara
doldur → düzgün çokgen sınırı çiz" ihtiyaçları aynı temel araca muhtaç:
bir N×N ikili (0/1) ızgarayı alıp, dolu hücrelerin dış sınırını **marching
squares** ile iz sürüp tek/çoklu kapalı `pts` dizisi (polygon/multipolygon)
döndüren bir yardımcı. Şu an kod tabanında böyle bir iz sürücü yok —
`autoLakes` gölleri ızgaradan değil, doğrudan rastgele yarıçaplı bir
çokgenle "çiziyor"; kıyı çizgisi de vektör değil, blur+eşikleme ile raster
üretiliyor (bkz. `generateLandmass`). Devlet sınırları için bu kısayollar
yeterli değil — komşu devletlerin sınırlarının **birbirine tam oturması**
gerekiyor, bu da tek bir ortak ızgaradan tek geçişte iz sürmeyi gerektiriyor.

- **Yer**: `Geo.traceContour` (`js/canvas.js`'teki `Geo` nesnesine eklenir — path örnekleme/geometri yardımcılarının zaten yaşadığı yer).
- **Girdi**: `Uint8Array` veya benzeri ızgara + boyut; opsiyonel basitleştirme toleransı (Douglas-Peucker benzeri köşe azaltma, çıktı `pts` dizisini `Geo.sample`'ın işleyebileceği makul sayıda noktaya indirir).
- **Çıktı**: `[[ [x,y], [x,y], ... ], ...]` — her biri kapalı bir halka; delikli bölgeler (bir devletin içinde başka bir devletin enklavı) iç halka olarak ayrı döner.
- **Test**: bilinen basit şekiller (kare, L-şekli, iki ayrık ada) ızgaraya çizilip iz sürülür, üretilen alan/köşe sayısı ve halka sayısı doğrulanır — yeni `run-geo-contour-test.mjs`.

---

## #1 — Devlet / Kültür / Din simülasyonu

**Neden en büyük fark**: AFMG'yi "harita çizici"den "dünya üretici"ye
taşıyan asıl mekanik bu. Bizde `territories` katmanı şu an tamamen elle
çizilen, isim verilen düz bir dolgu (`Tools`'ta `startTerritory`/`territory`
aracı, `Cv.assignPoliticalColors` sadece renk ayrıştırıyor) — hiçbir
otomatik büyüme yok.

**Yaklaşım**: `autoLakes`/`autoBiome` ile aynı ölçekte ucuz bir N×N ızgara
üzerinde **çok-kaynaklı maliyet-mesafe büyümesi (multi-source cost-distance
flood)**:

1. Kullanıcı sayıyı seçer (örn. 3-8 devlet), her biri için başkent adayı
   kara üzerinde rastgele/uzaklık-ayrıştırmalı seçilir (mevcut `autoSettle`
   ve `autoLakes`'teki reddet-örnekle desenle aynı mantık).
2. Her başkent hücresinden eşzamanlı flood-fill başlar; her adımda hücre,
   en düşük "maliyet"e sahip komşu devlete katılır. Maliyet fonksiyonu:
   temel mesafe + yükselti farkı (dağlar geçişi zorlaştırır — `elevation`
   katmanından okunur) + deniz/kıyı cezası. `App.landgen`'deki gibi bir
   "büyüme oranı" (growth rate) parametresi her devletin başkentten ne
   kadar agresif yayıldığını (AFMG'nin "expansionism" değeri) belirler.
3. Sonuç ızgara, yukarıdaki ortak `Geo.traceContour` ile her devlet için
   ayrı bir/çok halkalı `pts` dizisine çevrilir ve `territories` katmanına
   `kind:'state'`, `government`, `capital`, `color` alanlarıyla yazılır —
   var olan elle-çizilmiş `territory` nesneleriyle **aynı render yolunu**
   kullanır (`Cv`'de ayrı kod gerekmez).
4. **Kültürler** aynı flood-fill algoritmasının bir varyasyonu — ayrı bir
   ızgara katmanında (devlet sınırlarından bağımsız, üst üste binebilir)
   `Names.js`'teki 7 kültürden biri her tohuma atanır; sonuç, bir burg'un
   hangi kültüre ait olduğunu (dolayısıyla `Names.generate` çağrısında
   hangi kültür kullanılacağını) belirler — mevcut isim üreteci artık
   "coğrafi olarak tutarlı" isimler üretir, her seferinde elle seçilen
   kültür yerine. **Render — Kural A zorunlu**: kültür/din bölgeleri
   `territories`'e `kind:'culture'`/`kind:'religion'` çokgen nesneleri
   olarak yazılır (devlet sınırlarıyla aynı yol); "Kültür görünümü" /
   "Din görünümü" sağ panel anahtarı sadece **hangi `kind`'in görünür
   olduğunu** değiştirir (mevcut katman `visible` mantığının bir
   varyasyonu) — hiçbir zaman 2048×2048'lik ayrı bir raster overlay
   canvas'ı hesaplanmaz/yeniden boyanmaz.
5. **Dinler** aynı desenin üçüncü bir katmanı; düşük öncelikli, istenirse
   #1'in son alt-fazı olarak ertelenebilir (görsel karşılığı devlet/kültür
   kadar güçlü değil). Render kuralı 4. maddedeki ile birebir aynı.
6. **Eyaletler (provinces)**: her devletin kendi iç ızgarasında daha küçük
   ölçekte aynı flood-fill'in tekrarı — devlet onaylandıktan sonra ikinci
   bir geçiş.
7. **Diplomasi editörü**: ayrı bir hesaplama gerektirmez — devlet
   çiftleri arası ilişki durumu (`savaş`/`barış`/`ittifak`) tutan basit bir
   veri tablosu + sağ panelde küçük bir matris/liste editörü. `Layers`
   serileştirmesine `App.diplomacy` gibi düz bir obje olarak eklenir.

**Fazlar**:
- 1a. `Geo.traceContour` (ortak altyapı, yukarıda).
- 1b. Devlet üretimi: flood-fill + sınır çizimi + sağ panelde "Devlet üret" düğmesi (`autoLakes`/`generateRoads` düğmeleriyle aynı yerde, Kara panelinin yanına — **"Üret" zincirine eklenmez**, bkz. performans kuralları § üçüncü madde). `run-perf-audit.mjs`'e `generateStates(2048)` satırı eklenir, <1sn doğrulanır.
- 1c. Devlet editörü: isim, hükümet biçimi (önceden tanımlı 6-8 tip: krallık, imparatorluk, teokrasi, cumhuriyet, konfederasyon...), başkenti işaretleme — `territory` seçiliyken sağ panelde ek alanlar.
- 1d. Kültür katmanı (Kural A: vektör çokgen, raster overlay değil) + `Names.generate`'in bölgeye göre otomatik kültür seçmesi. `run-fps.mjs`'e devlet+kültür+din birlikte görünürken idle/pan/zoom ölçümü eklenir (mevcut senaryoların yanına dördüncü bir "politik görünüm açık" senaryosu).
- 1e. Eyaletler (devlet içi ikinci flood-fill geçişi).
- 1f. Dinler (aynı desenin tekrarı, düşük öncelik, Kural A aynen geçerli).
- 1g. Diplomasi editörü (basit ilişki matrisi, render maliyeti yok — salt UI).

**Test**: determinizm (aynı tohum → aynı sınırlar — `Terrain.scatter`'ın
kasıtlı rastgeleliğinin aksine, burada sınırların birebir tekrarlanabilir
olması gerekir, `run-landgen-test.mjs`'teki biyom determinizm testiyle aynı
desen), sınırların birbirine tam oturması (komşu devletler arasında boşluk/
çakışma olmaması), performans bütçesi (`run-perf-audit.mjs`'e yeni satır),
FPS regresyonu yok (`run-fps.mjs`'in yeni "politik görünüm" senaryosu
idle/pan/zoom'da 16.67ms altında kalmalı — özellikle çok sayıda devlet/
kültür/din çokgeni aynı anda görünürken).

---

## #2 — Yerleşim ekonomisi / nüfus

`autoSettle` şu an sadece sembol yerleştiriyor (bkz. `js/tools.js` içindeki
`autoSettle`). AFMG'de her burg'un hesaplanan bir nüfusu, kıyı/nehir/başkente
yakınlık bonusu, kasaba/köy/başkent hiyerarşisi var.

**Yaklaşım**: `autoSettle` her sembolü yerleştirirken zaten bir "uygunluk"
puanı hesaplıyor olmalı (kıyı/nehir yakınlığı) — bunu genişletip nüfus
değeri üret: `pop = base * suitability * (#1'deki devlete/başkente yakınlıksa bonus)`.
Sonuç, sembol nesnesine `population` alanı olarak yazılır; sağ panelde
seçili bir yerleşim sembolünün nüfusu gösterilir/düzenlenebilir; harita
üzerinde (opsiyonel bir "nüfus etiketi" görünürlük anahtarı ile) sembolün
yanına küçük bir sayı render edilebilir. #1 (devlet) yoksa da çalışır
(sadece coğrafi uygunluk kullanır), #1 varsa başkente yakınlık bonusu ekler
— bu yüzden #1'den *bağımsız* uygulanabilir, sırası esnek.

**Fazlar**: 2a. nüfus formülü + sembol nesnesine alan ekleme, 2b. sağ
panelde gösterim/manuel düzenleme, 2c. (opsiyonel) haritada nüfus etiketi
render modu.

**Performans notu**: risk yok. Üretim tarafı `autoSettle`'a (ölçülü:
3.9-18.7ms/2048²) eklenen tek bir çarpım işlemi — ihmal edilebilir.
Render tarafı, nüfus etiketi açıkken sembol başına bir ekstra metin
çizimi — proje zaten yüzlerce sembol/etiketi aynı anda render ediyor
(Faz 4 şehir-blok kanıtı), bu sınıfta bir ekleme FPS'i etkilemez. Ayrı
bir test satırı gerekmiyor, mevcut `run-fps.mjs` senaryoları yeterli.

---

## #4 — Amblem / heraldik üreteci  ✅ uygulandı

> **Uygulandı** (`js/emblem.js`): 6 kalkan biçimi, 9 bölünme düzeni, 14
> motif, tinctür kuralına uyan renk seçimi, tohumlu ve deterministik
> üretim. `Tools.rollEmblem`/`clearEmblem` armayı seçili devlete tek
> adımlık undo ile yazar, `Cv.drawEmblem` siyasi görünümde başkentin
> üstüne basar (`Cv.emblems` anahtarıyla kapatılabilir), panelde
> önizleme ve 512² PNG indirme var. Testler
> `run-states-culture-test.mjs` içinde.


**Neden mümkün**: proje zaten "her şey kodda üretiliyor" ilkesiyle
çalışıyor (`iso.js`'teki izometrik bina üretimi, `symbols.js`'teki 894
sembol) — bir arma da aynı felsefeyle, `Path2D`/Canvas 2D primitifleriyle
üretilebilir. AFMG'nin kalkan-şekli + "charge" (üstteki sembol) + renk
paleti yaklaşımı doğrudan uyarlanabilir.

**Yaklaşım**: `symbols.js`'e yeni bir "amblem" kategorisi değil, ayrı küçük
bir modül (`js/emblem.js` veya `catalog2.js`'e ek bir bölüm): 6-8 kalkan
şekli (`Path2D` şablonu, 0-100 kutusunda), üstüne yerleştirilecek 15-20
basit heraldik motif (aslan, kartal, yıldız, kule, ağaç — mevcut
sembollerin bir alt kümesi düz siluet olarak yeniden kullanılabilir) ve bir
renk çifti (zemin + motif, mevcut `_hsl`/altın-açı renk dağıtımı yeniden
kullanılır). Tohumlu üretim (`Names.generate` gibi seed parametreli).
Devlet/kültür editöründe (#1c) "Amblem üret" düğmesi ile bir devlete/kültüre
atanır, seçili devletin bilgi panelinde küçük önizleme gösterilir, isteğe
bağlı olarak harita üzerinde başkent sembolünün yanına küçük ikon olarak
render edilebilir.

**Bağımlılık**: #1 (devlet/kültür) olmadan da bağımsız bir "amblem
üreteci" aracı olarak (rastgele arma üret, PNG/SVG olarak indir) tek
başına anlamlı — #1 varsa ekstra değer katıyor, gerekli değil.

**Performans notu**: risk yok. Üretim birkaç `Path2D` çizimi, ms
mertebesinde (mevcut tek bir sembolün çizim maliyetiyle aynı sınıf).
Panelde önizleme render-döngüsünün dışında; haritada başkent yanında
gösterilirse tek bir sembol nesnesi kadar maliyetli. Ayrı test satırı
gerekmez.

---

## #5 — İklim simülasyonu

`autoBiome` şu an enlem (tuval y ekseni) + yükselti + nem-gürültüsü
karışımı sezgisel bir bant mantığı kullanıyor (bkz. `CLAUDE.md`'deki
`autoBiome`/`pickBiome` açıklaması). AFMG haritayı küre üzerinde
konumlandırıp gerçek bir sıcaklık/yağış/rüzgar modeli hesaplıyor.

**Yaklaşım**: Tam bir atmosfer simülasyonu gerekmez — AFMG'nin kendisi de
basitleştirilmiş bir model kullanıyor. Uygulanabilir versiyon:
1. Tuval üstüne "haritanın küre üzerindeki konumu" için iki parametre
   ekle: ekvator çizgisinin y-konumu (varsayılan orta satır, ama
   kaydırılabilir — kutup bölgesi haritası da tanımlanabilsin) ve
   kuzey/güney yarımküre.
2. Bu iki parametreden **sıcaklık gradyanı** türet (ekvatordan uzaklaştıkça
   düşen sıcaklık — zaten `autoBiome`'un enlem bandı mantığının
   genellemesi, tek fark artık y-ekseni değil ekvator-mesafesi kullanılıyor).
3. **Basit rüzgar/yağış**: sabit bir enlem-bağımlı rüzgar yönü (ekvator
   yakını doğudan batıya, orta enlemler batıdan doğuya — gerçek Hadley
   hücresi şemasının kaba yaklaşımı) + dağların rüzgar-altı tarafında nem
   düşürme (yükselti gradyanına bakarak "yağış gölgesi" hücreleri işaretle).
   Bu, mevcut `noise.fbm()` nem alanının yerini almaz, onu **yönlendirir** —
   halihazırdaki moisture-noise'a bir "rüzgar-altı çarpanı" eklenir.
4. Sonuç `pickBiome`'a ekstra bir girdi olarak akar; mevcut biyom
   tablosunda yeni bir kategori gerekmez, sadece hangi hücrenin hangi
   nem/sıcaklık değerini aldığı değişir.
5. Sağ panelde küçük bir "rüzgar okları" görünürlük anahtarı. **Render —
   Kural B zorunlu**: oklar `Cv.windArrowsDirty` bayrağı + tek seferlik
   `Cv.buildWindArrowsCache()` ile üretilir (yükselti kontur çizgilerinin
   `Cv.elevationDirty`/`Cv.buildElevationEffect` desenindeki birebir aynı
   ikili) — iklim parametreleri (ekvator konumu/yarımküre) değişmediği
   sürece her kare sadece önbellek canvas'ını `drawImage` ile kompozitler,
   ok sayısı/ızgara boyutu kare-başı maliyete **hiç girmez**.

**Risk/verim notu**: bu madde en çok "sonuç aynı mı görünüyor" riskini
taşıyan — mevcut moisture-noise zaten organik/inandırıcı sonuç veriyor
(bu sezonun başında çözülen "checkerboard biyom" sorunu buradan
kaynaklanıyordu). Uygulanmadan önce görsel bir A/B karşılaştırması
(mevcut vs rüzgar-yönlendirmeli) yapılmalı — fayda görsel olarak
doğrulanamazsa bu madde ertelenebilir.

**Fazlar**: 5a. ekvator konumu/yarımküre parametresi + sıcaklık gradyanı
türetimi, 5b. rüzgar yönü + yağış-gölgesi çarpanının moisture-noise'a
eklenmesi (görsel A/B karşılaştırması burada yapılır — fayda yoksa dur),
5c. `Cv.buildWindArrowsCache()` + dirty-flag kompozitleme (Kural B),
sağ panel anahtarı. `run-perf-audit.mjs`'e `autoBiome+iklim(2048)` satırı,
`run-fps.mjs`'e "rüzgar okları açık" senaryosu eklenir.

**Test**: A/B görsel karşılaştırma sonucu (fayda kararı), biyom
determinizm testinin iklim çarpanıyla birlikte hâlâ geçtiği doğrulanır,
FPS regresyonu yok (önbellek doğru dirty-invalidate ediliyor mu — iklim
parametresi değişince önbellek yenileniyor, değişmeyince yenilenmiyor).

---

## #6 — Bölge/veri editör araçları

Dördü de küçük, birbirinden bağımsız, hızlı kazanım — tek fazda birlikte
yapılabilir:

- **Bölgeler (zones) editörü**: `territories` katmanındaki elle-çizim
  aracının tipini genişlet — nesneye `zoneType` alanı (savaş bölgesi,
  anomali, yasak bölge, av sahası... önceden tanımlı bir liste, kullanıcı
  metin de girebilir) ekle, her tip kendi dolgu deseni/rengiyle render
  edilsin (mevcut `territory` render yoluna `zoneType`'a göre stil seçimi
  eklemek yeterli, yeni katman gerekmez).
- **Notlar editörü**: herhangi bir vektör nesnesine (sembol, işaretçi,
  devlet, bölge bağlantısı) serbest metin notu iliştirme — nesne
  şemasına `note` alanı, sağ panelde seçili nesne için bir "not" metin
  kutusu, haritada küçük bir 📝-benzeri (SVG, emoji değil) gösterge.
  `.json` serileştirmede zaten var olan nesne alanlarının yanına eklenir,
  ayrı bir depolama gerekmez.
- **İsim tabanı (namesbase) editörü**: `Names.js`'teki 7 kültürün
  onset/nucleus/coda hece havuzlarını salt-okunur sabitler olmaktan
  çıkarıp `App.customCultures` gibi bir kullanıcı-tanımlı ek listeye
  izin ver — sağ panelde "Kültür ekle" formu (hece listeleri virgülle
  girilir), `Names.generate`'in kültür seçicisine bu özel kültürler de
  eklenir. `.json` proje kaydına dahil edilir (proje-özel, global değil).
- **Yükselti şablonu düzenleyici**: AFMG'nin tam node-tabanlı editörü
  yerine daha basit bir versiyon — `generateLandmass`'ın zaten açık
  parametreleri olan tohum sayısı/yarıçap aralığı/pürüzlülük/kapsama
  hedefini bir "özel şablon" olarak kaydetme (isim ver, mevcut 3 şablonun
  yanına dördüncü seçenek olarak listede görünsün). Tam bir görsel
  düğüm editörü değil, mevcut parametrelerin adlandırılıp saklanması —
  düşük efor, orta değer.

**Performans notu**: risk yok. Zones ve notlar mevcut nesne render
yoluna (dolgu stili seçimi / küçük ikon) katılıyor — nesne sayısı zaten
onlarca-yüzlerce mertebesinde test edilmiş bir yolda. Namesbase ve
yükselti şablonu editörleri render-döngüsüne hiç girmiyor (salt form/
depolama). Ayrı test satırı gerekmez.

---

## #7 — GIS veri dışa aktarımı

**Neden düşük efor**: `rivers`/`roads`/`territories`/`symbols` katmanları
zaten `pts`/`x,y` tabanlı vektör nesneleri — bir GeoJSON `FeatureCollection`
üretmek `Exporter`'a eklenecek yeni bir fonksiyon, yeni bir veri modeli
gerekmiyor.

**Yaklaşım**: `Exporter.geojson()` — her vektör katmanı nesnesini bir
GeoJSON `Feature`'a çevirir (`LineString` nehir/yol, `Polygon` bölge/göl/
devlet — devlet ise #1'in `Geo.traceContour` çıktısını doğrudan kullanır,
`Point` sembol/kaynak/işaretçi), `properties` alanına isim/tip/nüfus (#2
varsa) gibi meta veriyi koyar. Koordinat sistemi kayıtlı olarak proje
piksel uzayında kalır (gerçek enlem/boylam dönüşümü yapılmaz — AFMG de
gerçek coğrafi CRS kullanmıyor, kendi "harita birimi" sistemini kullanıyor,
biz de aynısını yaparız). `downloadFile` ile `.geojson` uzantılı indirme;
üst araç çubuğundaki dışa aktarma menüsüne PNG/SVG/HTML'in yanına eklenir.

**Bağımlılık**: yok — bugün bile (devlet/nüfus sistemleri olmadan) anlamlı,
#1/#2 eklendiğinde otomatik olarak daha zengin veri taşır.

**Performans notu**: risk sıfır — render döngüsünün tamamen dışında, tek
seferlik bir dışa aktarma çağrısı (PNG/SVG/HTML export'larıyla aynı
tetikleme yolu). Büyük katmanlarda (binlerce nesne) bile bu bir kullanıcı
etkileşimi anında çalışan, kare bütçesine hiç girmeyen bir işlem.

---

## #8 — Otomatik şehir üretimi

Zaten `docs/city-generation-plan.md`'de detaylı 5 fazlı bir plan var
(sokak ağı → OBB parsel bölme + bina doldurma → bölge boyama → sur/kapı
üreteci → ölçek doğrulama). Bu belge onu tekrarlamaz — burada sadece
AFMG paritesi bağlamında konumlandırılıyor: AFMG'nin "kasabaya tıkla,
otomatik harita üretsin" özelliğinin karşılığı bu plan; #1'deki devlet/
kültür sistemi tamamlanırsa şehir üretecinin bina paleti/duvar stili
kültüre göre seçilebilir hale gelir (culture→wall-material eşlemesi
`catalog2.js`'teki `CIVIC_CULTURE` ile zaten var, doğrudan bağlanabilir).

**Performans notu**: `city-generation-plan.md`'nin hedeflediği 80-250
sembollük ölçek, projenin zaten kanıtladığı render mimarisinin (görünür-
alan kırpması + kompozit önbellek, `CLAUDE.md`'nin ilk maddesi) doğrudan
kapsamında — üretim tarafı (`generateStreets`/`populateBlock`) `autoSettle`
sınıfında tek seferlik bir işlem olarak bütçelenmeli, kendi planında ayrı
ele alınıyor.

---

## #9 — Küçük ekstralar

- **9a. Sesli okuma (TTS)**: tarayıcının yerleşik `SpeechSynthesis` API'si
  — sıfır bağımlılık, sıfır backend. Seçili bir yerleşim/devlet/etiket
  adının yanına küçük bir 🔊 (SVG ikon) düğmesi, tıklanınca
  `speechSynthesis.speak(new SpeechSynthesisUtterance(name))`. Dil
  algılama basit (mevcut `UI.lang`'a göre `utterance.lang` ayarlanır).
  Çok düşük efor, dilenirse #6 ile aynı fazda yapılabilir.
- **9b. URL parametreleriyle deterministik üretim**: `?template=continent&seed=1234&w=2048` gibi
  bir sorgu dizesi okunup sayfa yüklenince otomatik `Exporter.newProject` +
  `Tools.generateLandmass` tetiklenir — paylaşılabilir "bu tohumla aynı
  haritayı tekrar üret" linki. Mevcut `buildShareURL`'in (görüntü gömen)
  yanına ikinci, çok daha küçük bir link türü olarak eklenir. Düşük efor.
- **9c. Tema özelleştirme (UI rengi/saydamlığı)**: mevcut CSS custom
  property yapısı (`main.css`/`shell.css`) zaten bunu destekleyecek
  şekilde kurulu — birkaç `--accent`/`--panel-alpha` değişkenini sağ üstte
  bir renk seçiciyle bağlamak yeterli, `localStorage`'da saklanır. Orta-düşük öncelik (kozmetik).
- **9d. Ollama entegrasyonu — ⚠️ önerilmiyor**: teknik olarak mümkün
  (kullanıcının kendi bilgisayarında çalışan bir Ollama sunucusuna
  `fetch('http://localhost:11434/...')` ile opsiyonel çağrı — biz backend
  barındırmıyoruz, kullanıcı kendi yerel sunucusuna bağlanıyor). Ancak:
  (1) projenin "framework yok, backend yok, her şey kod içinde üretilir"
  ilkesiyle gerilimde — dışarıdan bir çalışma zamanı bağımlılığı
  getiriyor; (2) CORS/güvenlik karmaşıklığı (yerel sunucuya tarayıcıdan
  istek, kullanıcının Ollama'yı `--origins` ile açması gerekir); (3) bu
  editörün odağı görsel harita üretimi, anlatı/lore metni değil. Öneri:
  bu maddeyi atla; kullanıcı ısrar ederse ayrı, izole bir "deneysel"
  özellik olarak ele alınmalı.

**Performans notu (9a-9c)**: risk sıfır — TTS tarayıcı API'sini
çağırıyor, canvas'a hiç dokunmuyor; URL parametreleri sayfa yüklenirken
bir kerelik `generateLandmass` çağrısına indirgeniyor (zaten ölçülü
bütçede); tema özelleştirme CSS custom property, canvas/render
döngüsüyle hiç kesişmiyor. (9d zaten önerilmiyor, performans tartışması
onunla ilgisiz — asıl gerekçe backend-yok ilkesiyle gerilim.)

---

## Açık sorular (uygulama öncesi karar gerektirir)

1. **#1 kapsamı**: devlet + kültür + eyalet + diplomasi hepsi tek seferde mi, yoksa devlet+kültür ilk faz, eyalet/din/diplomasi ikinci faz mı?
2. **#5 iklim simülasyonu**: mevcut biyom görünümünü gözle fark edilir şekilde iyileştirip iyileştirmeyeceği belirsiz — uygulamadan önce hızlı bir prototip/karşılaştırma mı yapılsın?
3. **#4 amblem**: devlet sistemi (#1) olmadan bağımsız bir araç olarak mı başlansın, yoksa #1'i mi beklesin?
4. **#9d Ollama**: yukarıdaki gerekçeyle atlanması öneriliyor — onaylanıyor mu?
