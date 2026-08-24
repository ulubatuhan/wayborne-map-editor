# Şehir-içi harita üretimi: araştırma + derin plan

> **Durum:** Planlama dokümanı, henüz uygulanmadı. Bu çalışma **Opus 5** ile
> yapılacak (görsel/tasarım kararları ağırlıklı). Bu dosya, o oturuma
> doğrudan başlangıç noktası olsun diye yazıldı — sorunun tanımı, rakip
> araştırması, teknik seçim gerekçesi ve somut, kod tabanına özel bir
> uygulama planı içeriyor.
>
> **Bağlam:** Faz 4 kapsamında (#46) sadece sembollerle kurulmuş bir "şehir
> bloğu" kanıtı üretildi (bkz. git geçmişi, "Şehir meydanı sembolleri"
> commit'i) — ama bu yalnızca ~15 sembolün elle tek tek yerleştirilmesiyle
> mümkün oldu. Kullanıcı geri bildirimi: bu mekanikle olsa olsa "Town of
> Salem" ölçeğinde seyrek bir kasaba çıkar, **Baldur's Gate ölçeğinde yoğun,
> sokağa-hizalı bir şehir çıkmaz.** Bu doküman "neden çıkmaz" ve "ne
> ekleyince çıkar"ı somutlaştırıyor.

---

## 1) Sorunun tam olarak ne olduğu

Mevcut kod tabanında (bkz. `CLAUDE.md` ve `js/tools.js`) şehir/yerleşim
üretimiyle ilgili üç mekanizma var, üçü de bu iş için **yanlış ölçekte**:

| Mekanizma | Ne yapıyor | Neden yetersiz |
|---|---|---|
| `Tools.autoSettle` (`tools.js:2180`) | Bölgesel haritada seyrek yerleşim **noktaları** (tek bir "şehir" ikonu = bütün bir şehir) dağıtıyor | Şehrin *içini* değil, dünya haritasındaki *varlığını* temsil ediyor |
| `Tools.generateRoads` (`tools.js:1984`) | Yerleşim noktalarını (yine tek-ikon şehirler) birbirine bölgesel yollarla bağlıyor (min. yayılan ağaç) | "Şehirden şehre yol", "şehir içinde sokak ızgarası" değil |
| `Tools.startSymbolBrush` / `symbolBrushStamp` (`tools.js:2291-2338`) | Organik, rastgele açı/mesafeyle sembol saçıyor (orman/kaya/dekor için doğru) | Sokağa hizasız, üst üste binme kontrolü yalnız "min. mesafe", döndürme tamamen rastgele (±60°) |

Kalan tek yol **tek tek `placeSymbol` tıklaması + elle döndürme** — bu,
Faz 4 #46'daki demo sahnesinin (~15 sembol) neden bir meydan/kavşak
hissi verip gerçek bir *şehir dokusu* vermediğini açıklıyor. 50-300
binalık yoğun bir sahne bu yöntemle pratik değil.

**Eksik olan tek şey şu:** bir alanı **sokaklara bölen**, sonra her bloğu
**sokağa hizalı, çakışmasız parsellere ayırıp bina dolduran** bir üretici.
Bu doküman, bunu bu proje için (vanilla JS, npm yok, tek dosyalık kod
tabanı, mevcut `Layers`/`History`/`Tools` mimarisi) nasıl kuracağımızı
planlıyor.

---

## 2) Rakip/teknik araştırması

### 2.1 Watabou — Medieval Fantasy City Generator ([watabou.itch.io](https://watabou.itch.io/medieval-fantasy-city-generator))

En alakalı referans — çünkü **"block-centric" (blok-merkezli)** yaklaşım
kullanıyor, **"road-centric" (yol-merkezli, ör. CityEngine)** değil.
[Devlog kayıtlarına göre](https://watabou.itch.io/medieval-fantasy-city-generator/devlog/34104/053-neighbourhoods-alleys-and-buildings):

- Önce şehir bir **merkez** (kale/pazar meydanı) etrafında **wards**
  (mahalleler/loncalar) olarak Voronoi-benzeri parçalanıyor.
- Wards, [0.7.0 sürümünden itibaren](https://watabou.itch.io/medieval-fantasy-city-generator/devlog/85275/070-districts)
  **districts** (bölgeler) halinde gruplanıyor — bölgeler önemli şehir
  özelliklerinin (kale, pazar, tapınak) etrafında "büyütülüyor" ve
  sınırları arazi/komşu bölgelerle şekilleniyor.
- **Her district'in kendi parametreleri var**: ara sokak ızgarasının ne
  kadar düzenli olduğu, binaların ne kadar büyük olduğu — yani pazar
  mahallesi organik/sık, soylu mahallesi düzenli/geniş görünüyor.
  "Continuous" seçeneği açıkken bu parametreler district'ler arası
  **kademeli** değişiyor (ani sıçrama olmasın diye).
- Sokaklar/ara yollar, blok şeklinden **türetiliyor** — yani önce blok
  poligonu var, sokak onun kenar boşluğu.

**Bu proje için çıkarım:** "önce gerçekçi bir trafik ağı simüle et, sonra
şehri o ağın etrafına inşa et" (CityEngine tarzı) yerine, "kullanıcı bir
alan çizsin, o alanı bloklara böl, blokları parsellere böl" — çok daha
basit, çok daha kontrol edilebilir, ve mevcut `Tools.autoLakes`/
`Tools.generateLandmass` gibi "kapalı alan içini doldur" desenine zaten
uygun.

### 2.2 Azgaar's Fantasy Map Generator — Burg üretici ([azgaar.github.io](https://azgaar.github.io/Fantasy-Map-Generator/))

Açık kaynak ([GitHub](https://github.com/Azgaar/Fantasy-Map-Generator)),
watabou'nun motoruyla aynı soy ağacından — "burg" (yerleşim) detay
görünümü büyük ölçüde watabou'nun ward/district mantığını kullanıyor.
Nüfus/konum parametrelerine göre otomatik popülasyon hesaplıyor. Bize asıl
faydası: **açık kaynak olduğu için** (isteğe bağlı) ward-subdivision
kodunun tam algoritmasına bakılabilir bir referans olması.

### 2.3 Parish & Müller, "Procedural Modeling of Cities" (2001) — CityEngine'in temeli

Alanın kurucu makalesi ([SIGGRAPH tarihçesi](https://history.siggraph.org/learning/procedural-modeling-of-cities-by-parish-and-muller/),
[genel özet](https://phiresky.github.io/procedural-cities/presentation.html)):

1. Girdi: arazi + **nüfus yoğunluğu haritası**.
2. **L-sistem** ile yol ağını büyütür (ana yollar nüfus yoğunluğunu takip
   eder, ikincil yollar ana yollardan dallanır) — global hedefler (şehir
   merkezine yakın yoğun ızgara) + yerel kısıtlar (arazi eğimi, mevcut
   yollarla çakışmama) birlikte üretiliyor.
3. Yol ağının çevrelediği her **blok**, parsellere bölünüyor.
4. Her parselde **CGA shape grammar** ile bina geometrisi üretiliyor
   (katman katman ekstrüzyon).
5. Sonraki nesil sistemler (CityEngine'in kendisi dahil) L-sistem yerine
   **tensör alanları** kullanıyor: yol ağı, bir tensör alanının özvektör
   alanına hizalı "hyperstreamline" izleri olarak çiziliyor — daha
   kontrol edilebilir global desenler (ızgara/radyal/organik) için.

**Bu proje için çıkarım:** Bu yaklaşım *çok* güçlü ama *çok* ağır —
nüfus yoğunluğu haritası, tensör alanı, L-sistem üretim kuralları hepsi
yeni kavramlar ve muhtemelen bir canvas-2D/npm'siz kod tabanında haftalar
sürer. **Fantastik bir harita editörü için gereğinden fazla mühendislik.**
Watabou'nun blok-merkezli, kullanıcı-yönlendirmeli yaklaşımı bu proje
için doğru ölçek.

### 2.4 Blok → parsel bölme algoritmaları (asıl ihtiyacımız olan parça)

Üç ana aile var ([karşılaştırmalı diyagram](https://www.researchgate.net/figure/Block-subdivision-algorithms-used-to-create-building-lots-From-left-to-right-recursive_fig5_350697980)):

| Yöntem | Nasıl çalışır | Karmaşıklık | Bu proje için uygunluk |
|---|---|---|---|
| **OBB (Object-Aligned Bounding Box) özyinelemeli bölme** | Poligona en dar kutuyu (OBB) oturt → **kısa eksen boyunca** böl (yani uzun kenara paralel bir çizgiyle ikiye ayır) → her parçaya aynı işlemi tekrarla → hedef alan/en-boy oranına ulaşınca dur | **Düşük** — sadece OBB hesabı + poligon-çizgi kesişimi + poligon kırpma gerekiyor | ✅ **En uygun.** Canvas 2D'de saf JS ile birkaç saatte yazılabilir, ağır geometri kütüphanesi gerekmez |
| **Straight Skeleton Subdivision (SSS)** | Poligonun "iskeletini" (kenarlardan içe doğru eşit hızda büzülen dalga cepheleri) çıkarıp parselleri bu iskelete göre tek adımda kurar | **Yüksek** — sağlam bir straight-skeleton implementasyonu kendi başına ciddi bir proje; uçlarda "sivri üçgen" artıkları temizlenmesi gerekiyor | ❌ Bu ölçekte gereksiz risk |
| **Offset/kenar-tabanlı bölme** | Blok sınırından içeri sabit derinlikte bir şerit ayır (bina derinliği), kalan iç boşluğu (varsa) tekrar işle | **Orta** | Faz 2 iyileştirmesi olarak düşünülebilir (köşe parselleri daha gerçekçi) |

**Karar: OBB özyinelemeli bölme.** Basitliği, npm-siz canvas 2D kod
tabanıyla uyumu ve "yeterince gerçekçi görünmesi" (amaç fotogerçekçi
simülasyon değil, hoş görünen bir fantastik harita — tıpkı watabou'nun
kendi felsefesi gibi: *"the goal is to produce a nice looking map, not an
accurate model of a city"*) nedeniyle net kazanan.

### 2.5 Dungeondraft / Dungeon Alchemist — üretici değil, "akıllı yerleştirme" modeli

Bunlar prosedürel *üretici* değil, **manuel yerleştirmeyi kolaylaştıran**
araçlar — ama UX dersleri var:

- Dungeondraft: `S` ile ızgaraya hizalama aç/kapa, özelleştirilebilir
  ızgara boyutu ([kaynak](https://dungeondraft-encyclopaedia.gitbook.io/guide/all-the-tools/settings-tab/map-settings)).
- Dungeon Alchemist: nesneler **"wall-clipped"** (yakın duvara otomatik
  doğru yönde yapışır) veya **"wall-forced"** (yalnız duvara monte
  edilebilir) olabiliyor; geçersiz yerleşimde kırmızı "Cannot Place"
  uyarısı çıkıyor ([kaynak](https://dungeonalchemist.fandom.com/wiki/Objects)).

**Bu proje için çıkarım:** Otomatik doldurma dışında, **manuel** sembol
yerleştirmeye de "en yakın sokak kenarına hizalanma" gibi bir yardımcı
mıknatıslama eklemek (ki `Cv.snapPoint` zaten ızgara/nokta yakalama
altyapısına sahip — bkz. `js/canvas.js`) hem otomatik hem elle
düzeltme senaryolarını güçlendirir.

---

## 3) Seçilen yaklaşım (özet karar)

**Blok-merkezli, kullanıcı-sınırlı, OBB-parsellemeli, district-parametreli**
bir boru hattı — tam bir trafik simülasyonu değil:

```
[1] Kullanıcı bir alan çizer (kement/bölge aracıyla — mevcut UX)
        │
[2] O alan, ana + ara sokaklarla BLOKLARA bölünür  (YENİ ARAÇ A)
        │
[3] Her blok, OBB özyinelemeli bölmeyle SOKAĞA-CEPHELİ PARSELLERE ayrılır
        │
[4] Her parsele, o bloğun "district tipi"ne uygun bir bina damgalanır,
    binanın dönüşü parselin sokak kenarına otomatik hizalanır  (YENİ ARAÇ B)
        │
[5] (opsiyonel) Alanın dış sınırı boyunca sur + kule + kapı dizilir (YENİ ARAÇ C)
```

Bu, mevcut kod tabanının zaten defalarca kanıtlanmış desenini birebir
takip ediyor: *"kullanıcı bir tohum/alan versin → algoritma o alanın
içini doldursun → tek bir atomik `History` adımı olarak kaydedilsin"* —
tıpkı `Tools.generateLandmass`, `Tools.autoBiome`, `Tools.autoLakes`,
`Tools.generateRivers`, `Tools.autoSettle` gibi.

---

## 4) Somut uygulama planı (fazlara bölünmüş)

### Faz A — Sokak ağı üretici: `Tools.generateCityBlocks(boundary, opts)`

**Girdi:** Kapalı bir poligon (kement aracıyla çizilen `Tools.lasso`
alanı ya da var olan bir `territory` nesnesi — ikisi de zaten kapalı
poligon üretiyor, `js/tools.js`'teki `liftSelection`/`Cv.lakeSmoothPts`
ile aynı veri şeklini paylaşıyorlar).

**Algoritma (öneri):**
1. Poligonun içine, `opts.mainStreets` sayıda **ana cadde** çiz — ya
   poligonun merkezinden kenarlara ışınsal (radyal, kale/meydan
   hissi) ya da paralel şeritler halinde (ızgara hissi) —
   `opts.pattern: 'radial' | 'grid' | 'organic'` parametresiyle seçilebilir
   (watabou'nun district-tipi parametrelerine paralel).
2. Ana caddelerin böldüğü her alt-alanı, `opts.blockSize` hedef alana
   ulaşana kadar **ara sokaklarla** özyinelemeli olarak ikiye böl (aynı
   OBB-kısa-eksen mantığı, ama bu kez "sokak" için — bkz. §2.4).
3. Sonuç: `roads` katmanına vektör sokak nesneleri (mevcut yol nesnesi
   şekliyle, `style` alanı sokak genişliğine göre ince/kalın) + belleğe
   (henüz katmana değil) **blok poligonları listesi**.
4. `Tools.generateLandmass`'taki **kapsama garantisi retry döngüsü**
   deseni burada da işe yarar: üretilen blok sayısı/ortalama alan
   `opts` hedefinden çok sapıyorsa (örn. tüm alan tek bir dev blok
   kaldıysa) parametreleri büyüt/küçült ve yeniden dene (sabit deneme
   sınırı, en iyi denemeyi tut).

**Performans notu:** `Tools.autoBiome`'un zaten kurduğu **zaman-bütçeli
chunk + `setTimeout(0)` arası** deseni (bkz. `CLAUDE.md`) burada da
şart — yüzlerce blok/parsel hesaplamak tek karede donmaya yol açabilir,
özellikle mobilde.

### Faz B — Parsel + otomatik bina doldurma: `Tools.populateBlock(blockPoly, opts)`

**Girdi:** Faz A'nın ürettiği bir blok poligonu + `opts.districtType`
(`'market' | 'noble' | 'craftsmen' | 'slum' | ...`).

**Algoritma:**
1. Blok poligonunu **OBB özyinelemeli bölme** ile hedef parsel
   alanına/en-boy oranına ulaşana kadar böl (§2.4).
2. Her parsel için: **en yakın sokak kenarının açısını** hesapla (parselin
   hangi kenarı bir sokağa bakıyor — bu bilgi Faz A'dan geliyor), bina
   sembolünü o açıyla **otomatik döndür** (rastgele değil!).
3. Bina tipini `districtType`'a göre ağırlıklı bir havuzdan seç — örn.
   `market` → `ic_stall_*`/`ic_bakery*`/`ic_smithy*` ağırlıklı,
   `noble` → büyük `ivh_*` (üst tier) + `ic_inn_stone` gibi taş yapılar,
   `slum` → küçük/düşük tier `ivh_*` sık aralıklı. (`catalog2.js`'teki
   `CIVIC_TIER` kavramı zaten "1-5 zenginlik seviyesi" fikrini
   taşıyor — buraya doğrudan bağlanabilir.)
4. Parsel alana sığmıyorsa (bina min. boyuttan küçük çıkıyorsa) o
   parseli atla — boş bahçe/avlu olarak bırak (gerçekçilik + doğal
   seyrekleşme).
5. Tek bir atomik `History.pushCombo` adımı (raster yok ama vektör
   `roads` + `symbols` katmanlarını birlikte değiştiriyor — mevcut
   `pushCombo` tam bunun için var, bkz. lasso taşıma örneği).

**Çakışma/aralık kontrolü:** `symbolBrushStamp`'taki `minGap` kontrolü
zaten var (bkz. §… yukarıda) — burada da parsel sınırları zaten
çakışmayı yapısal olarak engelliyor (her bina kendi parselinde), ekstra
kontrole gerek yok. Bu, saçma (brush) yöntemine göre büyük bir avantaj.

### Faz C — District (mahalle) boyama

Basit versiyon: kullanıcı Faz A'dan sonra, üretilen blokların üstüne
**kement ile bir alan seçip "bu bölge = pazar mahallesi" etiketlesin**
(mevcut `territory` nesnesi + renk zaten bunun için var — sadece Faz
B'nin `districtType` parametresini o territory'nin rengine/etiketine
bağlamak yeterli, yeni bir veri modeli gerekmez).

Gelişmiş versiyon (opsiyonel, watabou'nun "organik büyüme" modeli):
önemli bir sembolün (kale, tapınak, pazar meydanı) etrafından başlayıp
komşu blokları mesafeye göre otomatik district'lere ata — bu, Faz A/B
çalışıp kanıtlandıktan SONRA değerlendirilecek bir "nice to have".

### Faz D — Sur/kapı halkası üretici: `Tools.generateCityWall(boundary, opts)`

Faz A'nın girdisi olan aynı sınır poligonunu kullanır:
1. Poligon çevresi boyunca eşit aralıklarla kule (`itw_sq_*`/`itw_rd_*`)
   yerleştir (`Tools.autoLakes`'in poligon-içi örnekleme mantığına
   benzer ama bu kez **poligon sınırı boyunca** yürüme — `Geo` modülünde
   muhtemelen zaten bir "poligon çevresinde eşit aralıklı nokta" yardımcı
   fonksiyonu vardır ya da kolayca eklenir).
2. `opts.gateCount` kadar noktayı kule yerine kapı (`ik_freegate_*`)
   yap — tercihen ana caddelerin poligon sınırıyla kesiştiği noktalarda
   (Faz A'nın ana cadde uç noktalarıyla hizalı olsun diye).
3. Kuleler arasını düz duvar segmentleriyle (`wall()` yardımcı
   fonksiyonu zaten `catalog2.js`'te var) doldur.

### Faz E — Ölçek doğrulaması

Gerçek "Baldur's Gate hissi" için hedef: tek bir üretimde **80-250
sembol** (bina + sokak mobilyası). Mevcut performans test deseninin
(`run-fps.mjs`, `run-alltools-test.mjs`) aynısıyla:

- 200+ sembol içeren bir `symbols` katmanının pan/zoom FPS'i hâlâ bütçe
  içinde mi? (Mevcut FPS testleri raster katman ağırlıklıydı, vektör
  sembol yoğunluğu ayrıca test edilmemişti — bu, gerçek bir bilinmeyen.)
- Tek bir "şehir üret" tıklamasının `History` adımı büyüklüğü/undo
  performansı makul mü? (`History.pushCombo` zaten bbox-kırpma gibi
  optimizasyonlara sahip ama 250 sembollük tek bir vektör diff'i için
  ayrıca ölçülmeli.)
- Mobilde (`run-mobile-deep-test.mjs` deseniyle) bu üretici tetiklenip
  UI donmadan tamamlanabiliyor mu?

---

## 5) Mimari notlar / açık sorular

- **Yeni bir `Layers` katmanı gerekiyor mu?** Hayır — sokaklar `roads`
  katmanına, binalar `symbols` katmanına, district sınırları
  `territories` katmanına yazılabilir; hepsi zaten var olan vektör
  katman tipleri. Blok poligonlarının kendisi (ara hesaplama verisi)
  katmana hiç yazılmayabilir — yalnız üretim sırasında bellekte tutulur.
- **UI'da nereye oturur?** Muhtemelen mevcut "Üret" panelinin
  (`App.landgen` deseni) yanına, yeni bir "Şehir Üret" bölümü —
  `App.citygen = { pattern, blockSize, districtType, wallEnabled, ... }`
  gibi bir ayar nesnesiyle, tıpkı `App.landgen`/`App.sea` örnekleri gibi.
- **Çoklu-harita ile ilişkisi:** Bir "şehir" doğal olarak kendi
  region-link alt-haritası olur (bkz. `App.enterMap`) — dünya
  haritasındaki tek bir yerleşim ikonunun arkasında, bu yeni üreticiyle
  doldurulmuş ayrı bir tuval. Bu, zaten var olan iç-mekân alt-harita
  mekanizmasının doğal bir uzantısı, yeni bir "şehir modu" icat etmeye
  gerek yok.
- **Açık tasarım soruları (Opus 5 ile karara bağlanacak):**
  1. Sokak ağı deseni (`radial`/`grid`/`organic`) görsel olarak nasıl
     ayrışmalı — watabou'nun "district'e göre parametre" modelini mi
     taklit edelim, yoksa tek bir global stil mi yeterli?
  2. District bina havuzları (§ Faz B madde 3) hangi somut sembol
     id'leriyle eşlenecek — `catalog2.js`'teki `CIVIC_TIER`/kültür
     gridleriyle ne kadar derin entegre olmalı?
  3. Sur üretici (Faz D) her şehirde zorunlu mu, yoksa açık/kapalı bir
     seçenek mi (köy/kasaba ölçeğinde sur istenmeyebilir)?
  4. Faz A'nın "ana cadde" sayısı/deseni kullanıcıya kaç parametre
     olarak sunulmalı — aşırı parametre karmaşıklığından kaçınmak için
     `generateLandmass`'ın 3 şablonu (`continent`/`island`/`archipelago`)
     gibi 3-4 hazır "şehir şablonu" (ör. `walled-market-town`,
     `sprawling-port`, `radial-capital`) sunmak daha kullanıcı-dostu
     olabilir.

---

## 6) Önerilen uygulama sırası

1. **Faz A çekirdeği** (sadece sokak ağı, henüz bina yok) — tek başına
   test edilip görsel olarak onaylanabilir bir milestone.
2. **Faz B** (OBB parselleme + otomatik bina doldurma, tek district
   tipiyle) — bu ikisi birlikte zaten "Baldur's Gate hissi"nin
   %80'ini verir.
3. **Faz E ölçek doğrulaması** — B bittiği anda, büyük ölçekte perf
   sorunu çıkarsa erken yakalamak için hemen çalıştırılmalı.
4. **Faz C (district boyama)** ve **Faz D (sur üretici)** — cila
   katmanı, B kanıtlandıktan sonra.

---

## Kaynaklar

- [Medieval Fantasy City Generator — devlog: Districts](https://watabou.itch.io/medieval-fantasy-city-generator/devlog/85275/070-districts)
- [Medieval Fantasy City Generator — devlog: Neighbourhoods, alleys and buildings](https://watabou.itch.io/medieval-fantasy-city-generator/devlog/34104/053-neighbourhoods-alleys-and-buildings)
- [Medieval Fantasy City Generator (dene)](https://watabou.github.io/city.html)
- [Azgaar's Fantasy Map Generator](https://azgaar.github.io/Fantasy-Map-Generator/)
- [Azgaar/Fantasy-Map-Generator — GitHub (açık kaynak)](https://github.com/Azgaar/Fantasy-Map-Generator)
- ["Procedural modeling of cities" by Parish and Müller — SIGGRAPH tarihçesi](https://history.siggraph.org/learning/procedural-modeling-of-cities-by-parish-and-muller/)
- [Parish & Müller (2001) sunum özeti — yol ağı modellemesi](https://phiresky.github.io/procedural-cities/presentation.html)
- [Blok bölme algoritmaları karşılaştırması (diyagram)](https://www.researchgate.net/figure/Block-subdivision-algorithms-used-to-create-building-lots-From-left-to-right-recursive_fig5_350697980)
- [Procedural Generation For Dummies: Lot Subdivision — Martin Evans](https://martindevans.me/game-development/2015/12/27/Procedural-Generation-For-Dummies-Lots/)
- [Procedural Generation For Dummies: Road Generation — Martin Evans](https://martindevans.me/game-development/2015/12/11/Procedural-Generation-For-Dummies-Roads/)
- [Dungeondraft — Map Settings kılavuzu (ızgara/snap)](https://dungeondraft-encyclopaedia.gitbook.io/guide/all-the-tools/settings-tab/map-settings)
- [Dungeon Alchemist — Objects wiki (wall-clipped/wall-forced yerleştirme)](https://dungeonalchemist.fandom.com/wiki/Objects)
- [Subversion (video oyunu) — Introversion'ın yarım kalan şehir üretici projesi](https://en.wikipedia.org/wiki/Subversion_(video_game))
