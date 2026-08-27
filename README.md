# Wayborne Map Editor (Cartographer)

Fantastik / ortaçağ tarzı, tarayıcı üzerinde çalışan bir harita editörü. Tamamen vanilla JavaScript ve Canvas 2D ile yazılmıştır — framework, build adımı, bundler, npm bağımlılığı veya CDN varlığı yoktur. Karada, denizde, kıyıda, arazi dokularında, izometrik binalarda kullanılan her şey (894 sembol, 34 arazi tipi, onlarca izometrik yapı) kodun içinde üretilir; dışarıdan görsel dosyası yüklenmez.

Arayüz 11 dilde kullanılabilir: Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, İtalyanca, Portekizce, Hollandaca, Lehçe, Rusça, Arapça (bu sonuncusu sağdan sola yerleşimle). Sağ üstteki 🌐 simgesinden değiştirilir; tüm arayüz metinleri her 11 dilde eksiksiz çevrilidir.

## Çalıştırma

Derleme/kurulum gerektirmez, statik dosyalardır.

```bash
python3 serve.py 8000
# veya
python3 -m http.server 8000
# veya (Node varsa)
npx http-server . -p 8000 -c-1 -o
```

Tarayıcıda `http://localhost:8000/` adresini açın. **`index.html`'i doğrudan `file://` ile açmayın** — PNG/SVG dışa aktarım ve kıyı efekti `toDataURL`/`getImageData` kullanır, bu API'ler `file://` altında CORS tarafından engellenir.

## Karşılama sayfası

Uygulama artık düz editör yerine, üstte dört sekmeli bir karşılama ekranıyla açılır:

- **Ana Sayfa** — proje tanıtımı ve "Haritana başla" butonu.
- **Tuval** — hazır ölçülerden veya özel genişlik/yükseklikten yeni bir tuval oluşturur, `.json` dosyasından proje içe aktarır, ve bu tarayıcıda daha önce kaydedilmiş tuvalleri listeler (açma/silme). Kayıtlar tarayıcının `localStorage`'ında tutulur — backend yoktur, bu yüzden başka bir cihazdan görünmez; gerçek yedekleme/taşıma için hâlâ `.json` dışa/içe aktarma kullanılır. Editördeki "Kaydet" butonu `.json` indirmeye ek olarak bu listeyi de otomatik günceller. Ayrıca sessiz oto-kayıt vardır: editörden Ana Sayfa/Tuval gibi başka bir sekmeye geçildiğinde ve editördeyken her 10 dakikada bir, üzerinde çizim yapılmış tuval otomatik olarak bu listeye kaydedilir.
- **Tuval → Şablonla başla** — Boş tuval yerine hazır bir kıyı çizgisiyle başlamak için altı şablon: Kıta, Ada, Takımada, Krallık, Savaş alanı (altıgen ızgaralı) ve Boş tuval. Şablonlar yeni bir mekanik değildir; mevcut prosedürel kara üretecini hazır şablon/pürüzlülük değerleriyle çağırır, arazi türünü seçer ve gerekiyorsa ızgarayı açar. Boyut ve harita adı yeni-tuval formundan okunur.
- **Rehber** — sol araç çubuğundaki her aracın kısa açıklaması.
- **Topluluk** — proje hakkında ve GitHub bağlantısı.

Bir tuval oluşturulduğunda veya açıldığında, bildiğiniz editör ekranına geçilir; sol üstteki 🏠 ile karşılama ekranına dönülür.

## Üst araç çubuğu

| Buton | İşlev |
|---|---|
| **Yeni** | Tuvali temizleyip yeni, boş bir harita başlatır. |
| **Aç** | Daha önce kaydedilmiş bir `.json` proje dosyasını yükler (tüm katmanlar, nesneler ve ayarlarla birlikte). |
| **Kaydet** | Projenin tamamını (raster katmanlar + vektör nesneler + ayarlar) `.json` dosyası olarak indirir. `Ctrl+S` kısayolu da aynı işi yapar. |
| **↶ / ↷ (Geri al / Yinele)** | 50 adıma kadar geri al/yinele geçmişi. `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`. |
| **PNG / PNG 2× / PNG 4×** | Haritayı normal, 2× veya 4× çözünürlükte PNG olarak dışa aktarır. |
| **SVG** | Haritayı gerçek vektör SVG olarak dışa aktarır — sembol yolları (`Path2D` verisi) doğrudan `<path>` olarak yazılır, bitmap gömme değildir. Kıyı parlaması ve yükselti gölgelendirmesi gibi raster efektler base64 `<image>` olarak gömülür. |
| **HTML** | Haritayı **tek bir `.html` dosyası** olarak dışa aktarır: görüntü ve küçük bir görüntüleyici (sürükle-kaydır, tekerlekle yakınlaş, çift tıkla sığdır) dosyanın içine gömülüdür. Dış istek, sunucu veya betik kütüphanesi yok — dosyayı yollayıp çift tıklamak yeterli. En uzun kenar (1280–4096 px) ve biçim (PNG kayıpsız / JPEG küçük dosya) seçilebilir. |
| **🔗 Paylaşım linki** | Sunucu yok: küçültülmüş bir JPEG görüntü doğrudan URL'nin `#` kısmına gömülür (linki e-posta/mesajla gönderdiğinde de hiçbir sunucuya yüklenmez). Karşı taraf linki açınca salt-okunur bir görüntüleyici (pan/zoom) açılır. Bir `<iframe>` göm kodu da otomatik üretilir. |
| **🖨 Baskı / PDF** | Haritayı sayfa boyu (A5–Tabloid), yön, kenar boşluğu ve DPI (96 / 150 / 300) seçerek tarayıcının baskı iletişimine gönderir. Oradan yazıcıya basılabilir ya da "PDF olarak kaydet" ile gerçek PDF üretilebilir; ayrı bir PDF kütüphanesi kullanılmaz. Harita, seçilen sayfanın basılabilir alanına en-boy oranı korunarak sığdırılır. |
| **GeoJSON** | Vektör katmanları (nehir, göl, yol, bölge/devlet/kültür, sembol, kaynak, etiket, harita bağlantısı) standart bir GeoJSON `FeatureCollection` olarak indirir — QGIS gibi CBS araçlarında açılabilir. Koordinatlar proje piksel uzayında kalır (hayalî bir dünyanın gerçek bir koordinat sistemi yok); dosya bunu `crs` alanında açıkça belirtir. Devletlerin hükümet biçimi/başkenti ve yerleşimlerin nüfusu `properties` içinde taşınır. |
| **Vurgu rengi** | Üst çubuktaki renk kutusu arayüzün vurgu rengini değiştirir (sağ tık: varsayılana dön). Tercih tarayıcıda saklanır, projeye yazılmaz. |
| **🌐 Dil** | 11 dilli arayüz dili seçici (bayraklı, açılır menü). Arapça seçildiğinde arayüz sağdan sola döner (araç rayı sağa, seçenek paneli sola geçer); tuval her zaman aynı kalır. |

## Araç çubuğu (sol taraf, dikey)

18 araç işleve göre **beş gruba** ayrılmıştır; her grup 3 veya 6 araç içerir, böylece
3 sütunlu ızgarada satırlar tam dolar. Her araç sağ paneldeki ilgili seçenekler
bölümünü açar ve tuşuyla da seçilebilir. Rehber sayfası da aynı gruplamayı kullanır.

### Gezinme

| Araç | Tuş | İşlev |
|---|---|---|
| **Seç** | `V` | Vektör nesneleri (nehir, yol, göl, bölge, sembol, etiket) seçmek, taşımak, düzenlemek için. Seçili bir yol/göl/bölgenin bezier tutamaçları (handle) buradan sürüklenir. |
| **Kement** | `X` | Raster lasso seçim — sürükleyerek kapalı bir alan çiz; Kara + Arazi + Yükselti katmanlarındaki o bölge, üzerinde duran semboller/kaynaklar/etiketler/harita bağlantılarıyla BİRLİKTE kaldırılıp taşınabilir/döndürülebilir hâle gelir (tutamaçla döndür). `Enter` ile onayla (tek adımlık geri alınabilir işlem), `Escape` ile iptal et, `Delete` ile alanı tamamen sil. |
| **Kaydır** | `Space` (basılı tutarak) | Tuvali sürükleyerek kaydırma; sağ tık ile de her araçtan bağımsız pan yapılabilir. |

### Arazi

| Araç | Tuş | İşlev |
|---|---|---|
| **Kara** | `B` | Kara kütlesi fırçası — karayı boyar, deniz ile arasına otomatik kıyı efekti (glow) uygulanır. Aynı panelde **prosedürel kara üreteci** de bulunur: Kıta / Ada / Takımada şablonlarından biriyle, tohumlu Perlin gürültüsüne dayalı tek tıkla rastgele kıyı çizgisi üretir (detay/pürüzlülük ayarlanabilir, harici kütüphane kullanılmaz); üretim sürerken "Üret" düğmesindeki zar simgesi yuvarlanır. Bir **kapsama garantisi** kıtanın tuvalin en az %40'ını, ada/takımadanın en az %20'sini kaplamasını sağlar; takımada adaları birbirinden gerçekten ayrık, dağınık parçalar olarak üretir (tek bir kaynaşmış kara kütlesi değil). "Üret" düğmesinin üstündeki **Nehir / Göl / Arazi** onay kutuları işaretlenirse aynı tohumdan otomatik nehir, göl ve biyom da eklenir. Uyarı penceresi yalnızca ilk kullanımda çıkar. |
| **Deniz** | `E` | Silgi — boyanmış karayı (ve üzerindeki arazi dokusunu) tek adımda kaldırır. |
| **Doldur** | `F` | Kova doldurma — kalemle çizilmiş kapalı bir kıyı çevriminin (ring) içini tek tıkla dolduran flood-fill aracı; tıklanan pikselle aynı kara/deniz durumundaki bitişik alanı doldurur. |
| **Arazi** | `T` | 34 arazi tipinden biriyle doku boyar (otlak, orman, karanlık orman, tayga, bozkır, savan, çöl, bataklık, kayalık, kar/buz, arnavut kaldırımı, kırık taş yol, çamur yol, pis su akıntısı, süs çiçeği tarhı, çalı bordürü vb.). Her fırça darbesinde desen rastgele serpilir; iki darbe asla birebir aynı görünmez. Fırçanın kara sınırlarını aşmaması otomatik sağlanır. |
| **Yükselti** | `U` | Yükseklik/elevation fırçası — sürükleyerek araziyi yükseltir; "Alçaltma modu" işaretliyken çukurlaştırır. Sonuç, gölgelendirme (hillshade) ve/veya kontur çizgileri olarak otomatik render edilir; ayarlanabilir kontur aralığı vardır. Efekt yalnızca kara üzerinde görünür — denizde asılı kalmaz. |
| **Örnekle** | `I` | Doku eyedropper — haritanın bir bölgesinden dokuyu örnekleyip başka bir yere aynı stille "boyayabilme" aracı; ① alan seç → ② boyamaya başla akışıyla çalışır. |

### Su & Yollar

| Araç | Tuş | İşlev |
|---|---|---|
| **Nehir** | `R` | Tıklayarak yol noktaları eklenen akarsu çizim aracı; kavis/meander ayarı vardır. `Enter` ile bitirilir. Nehir yalnızca kara üzerinde render edilir — denizden karaya çizilirse denizdeki kısmı görünmez, kıyıda doğal biter. |
| **Göl** | `K` | Kapalı bir gölet/deniz gölü şekli çizer; kıyı rengi altındaki arazi dokusuna göre otomatik uyarlanır. Yalnızca kara üzerinde görünür — denize taşan veya tamamen denizde kalan kısım render edilmez. |
| **Yol** | `D` | Kervan güzergâhı / kara yolu çizim aracı, nehirle aynı mantıkta. |

### İşaretler

| Araç | Tuş | İşlev |
|---|---|---|
| **Sembol** | `S` | ~200+ düz (ink-style) sembol ve onlarca izometrik bina/yapıdan (kale, kulübe, değirmen, köprü vb.) birini yerleştirir. Renk tonu (hue) ve "yıpranma/wear" (eskime lekesi) kaydırıcıları ile özelleştirilebilir; `[` / `]` ile döndürülür. **Fırça modu** açıkken sürükleyerek onlarca sembolü otomatik kümeleyerek dizer (orman/dağ sırası gibi); "Karaya kenetle" işaretliyken denize taşan noktalar otomatik atlanır ve sonradan deniz o bölgeye genişlerse sembol otomatik gizlenir. |
| **Kaynak** | `Y` | Maden, tarım, avlanma, balıkçılık, ticaret ve taş ocağı olmak üzere 6 türden birini seçip haritaya oyun-tasarımı amaçlı kaynak işareti yerleştirir (kervan/ticaret temalı haritalar için). |
| **Etiket** | `L` | Metin etiketi yerleştirir; hazır stil (başlık, şehir adı, bölge adı vb.) ön ayarları mevcuttur. **"Yola oturt"** işaretliyse ve tıklama bir nehre/yola yakınsa, etiket o çizginin gerçek şekline harf harf oturur (dairesel yay değil, çizilmiş eğrinin kendisi). | **Tipografi** bölümünden yazı ailesi (on tarihsel aile: eski kitap, anıtsal, Roma kitabesi, ünsiyal, gotik yazı, divani el yazısı, kalın serif, fantastik, sade, daktilo), kapıt (kurdele/levha/tomar/taş), büyük harf, dış hat + rengi ve gölge ayrı ayrı denetlenir; stil şablonu yalnızca bir başlangıç noktasıdır. Proje harici font yüklemez — her aile bir yığındır (macOS/Windows/Linux karşılıkları sırayla denenir), kurulu olanlar listede `·` ile işaretlenir. Ayrıca **ad üreteci**: yedi kültür (Batı, Akdeniz, Kuzey, Doğu, Taş, Orman halkı, Yaban) × sekiz coğrafi tür için hece tabanlı, sözlüksüz yer adı önerileri — öneriye tıklayınca metin alanına yazılır.
| **Çizim** | `N` | Serbest fırça — yalnızca **kendi eklediğin** katmanlara çizer (renk, boyut, sertlik, opaklık, silgi modu). Yerleşik katmanlara serbest boya sızdırmaz: kara maskesi ve yükselti gri tonu anlamlarını korur. |

### Bölge & Ölçüm

| Araç | Tuş | İşlev |
|---|---|---|
| **Bölge** | `G` | Toprak/bölge (territory) doldurma aracı — kesikli kenarlıklı, yarı saydam dolgulu kapalı bir alan çizer; sınır/siyasi harita amaçlı. |
| **Bölge bağlantısı** | `M` | Haritaya tıklayıp isim vererek yeni, boş bir **alt harita** (bölge/şehir haritası) oluşturur ve üzerine bir bağlantı iğnesi yerleştirir. Bkz. aşağıdaki "Çoklu harita" bölümü. |
| **Ölç** | `Q` | Sürüklenebilir mesafe cetveli — iki nokta arası gerçek mesafeyi ölçek çubuğuna göre hesaplayıp gösterir. Ölçüm çizgileri seçilip taşınabilir/silinebilir; PNG/SVG çıktısına dahil edilmez. |

Tüm çizim yolları (nehir/yol/göl/bölge) isteğe bağlı **bezier tutamaç** düzenlemeyi destekler: bir noktayı seçip tutamaçlarını sürükleyerek eğriyi elle şekillendirebilirsiniz; tutamaç eklenmemiş eski projeler otomatik (Catmull-Rom eşdeğeri) eğriyle bire bir aynı görünmeye devam eder.

**İklim modeli (ekvator, rüzgâr, yağış gölgesi):** "Arazi" panelindeki **İklim** bölümü, bir sonraki "Biyom ata" çalıştırmasının nasıl karar vereceğini belirler. **Ekvator konumu** kaydırıcısı sıcaklık kuşaklarının merkezini tuvalin ortasından kaydırır — ekvatoru yukarı çekince harita tek yarımküreli (üstte çöl/savan, altta buzul) bir dünyaya, uca çekince kutup haritasına dönüşür. **Yağış gölgesi etkisi** rüzgârın araziyle etkileşimini açar: enlem bandına göre (tropiklerde alizeler doğudan, orta enlemlerde batı rüzgârları, kutuplarda yine doğulu) rüzgâr yönünde birkaç hücre geriye bakılır, dağın arkasında kalan hücreler kurur, önündekiler nemlenir — böylece biyom bantları topografyaya bağlanır. **Rüzgâr oklarını göster** aynı modeli harita üstünde okla gösterir; oklar tek bir önbellek katmanına çizilir, iklim ayarı değişmediği sürece kare başına ek maliyeti yoktur. İklim kapalıyken `autoBiome` eskisiyle bit-bit aynı çıktıyı verir, yani eski projeler etkilenmez.

**Devlet & kültür otomatik üretimi:** "Bölge" aracının panelinde, elle çizmeye ek olarak **"👑 Devlet üret"** ve **"🎭 Kültür üret"** düğmeleri bulunur. Devlet üreteci, seçtiğiniz sayıda başkentten aynı anda büyüyen ve birbirine tam oturan devlet sınırları üretir — dağlık arazi genişlemeyi yavaşlatır, "Büyüklük çeşitliliği" kaydırıcısı bazı devletlerin diğerlerinden belirgin şekilde büyük çıkmasını sağlar. Her devlete otomatik bir isim (mevcut fantastik ad üreteciyle), bir hükümet biçimi (Krallık, İmparatorluk, Teokrasi, Cumhuriyet, Konfederasyon, Şehir Devleti) ve bir başkent ataması yapılır. **"Din üret"** aynı mekanizmayı bir üçüncü katman anlamıyla çalıştırır (inanç yayılımı da siyasi sınırları izlemez). Kültür üreteci aynı mekanizmayı devlet sınırlarından bağımsız çalıştırır; paneldeki **"Görünüm"** seçiciyle devlet / kültür / din sunumları arasında geçiş yapabilirsiniz — ikisi de elle çizdiğiniz bölgeleri korur, üstüne ekler, ve aynı tohumla her zaman aynı sonucu üretir (deterministik). Ayrıca **"Yerleşim yerleştir"** artık her yerleşime kıyı/eğim uygunluğu ve (varsa) başkente yakınlığa göre bir nüfus değeri atar.

**Eyaletler ve diplomasi:** **"Eyalet üret"** her devletin kendi sınırlarını alt bölgelere ayırır — eyalet sınırı ait olduğu devletin dışına taşmaz, devletin rengini daha açık bir tonla paylaşır. **Diplomasi** bölümünde iki devlet seçip aralarındaki ilişkiyi (Barış / İttifak / Savaş / Vasallık) tanımlarsın; barış dışındaki tüm ilişkiler altta liste hâlinde görünür ve `.json` proje kaydında saklanır. Her değişiklik tek adımda geri alınabilir.

**Şehir üretimi:** Bir bölge seçtiğinde "Bölge" panelindeki **Şehir Üretimi** bölümü açılır. **"Şehir üret"** o bölgenin sınırları içine yoğun bir ortaçağ şehri kurar: alan önce caddelerle bloklara, bloklar da ara sokaklarla parsellere bölünür ve her parsele bir bina yerleşir. Mahalle tipi (Zanaatkâr / Pazar / Soylu / Yoksul mahalle / Tapınak / Liman) hangi binaların çıkacağını belirler; bina sayısı (30-260) ve sokak genişliği ayarlanabilir, istenirse sınır boyunca **sur, kule ve kapı** eklenir. Binaların cephesi en yakın sokağa döner (izometrik çizim bozulmasın diye dik açıya yuvarlanarak). Tek tıkla üretilen şehrin tamamı tek bir `Ctrl+Z` ile kalkar. Aynı tohum her zaman aynı şehri üretir.

**Devlet editörü (seçili bölge):** Bir bölgeyi seçtiğinde ("Bölge" panelindeki **Seçili Bölge** bölümü ya da sağdaki "Bölgeler" sekmesinden tıklayarak) adını, hükümet biçimini ve başkentini elle düzenleyebilirsin. **"Başkenti haritadan seç"** düğmesi kısa ömürlü bir seçme modu açar: haritada tıkladığın nokta yeni başkent olur (deniz reddedilir, `Esc` ile iptal). Elle çizdiğin sıradan bir bölgeyi **"Devlete dönüştür"** ile resmî bir devlete çevirebilirsin — ad (yoksa otomatik üretilir), hükümet biçimi ve alanın içinde karada kalan bir başkent kazanır, üretilen devletlerle birebir aynı şekilde listelenir ve renklendirilir. **"Devlet olmaktan çıkar"** bu nitelikleri geri alır, poligonu ve renklerini korur. Bütün bu düzenlemeler tek adımlık `Ctrl+Z` ile geri alınabilir. Siyasi görünümde her devletin başkenti haritada küçük bir yıldızla gösterilir.

**Arma (heraldik) üreteci:** Seçili bir devletin panelinde **"Arma üret"** düğmesi prosedürel bir arma çizer: kalkan biçimi (6), bölünme düzeni (9) ve motif (14 — aslan, kartal, kule, taç, kılıç, ağaç, balık, yaban domuzu, çekiç, ay, güneş, anahtar, çapa, yıldız) rastgele seçilir, renkler ise gerçek heraldikteki **tinctür kuralına** uyar: zemin daima renk havuzundan (kırmızı/mavi/yeşil/siyah/mor), motif daima metal havuzundan (altın/gümüş) gelir — bu yüzden sonuç rastgele iki renk seçmekten belirgin biçimde daha "arma gibi" durur. Hiçbir görsel dosya yüklenmez; arma kodda çizilir ve proje kaydında yalnızca tohumu ile tanımı saklanır, aynı tohum her zaman aynı armayı verir. Armalar siyasi görünümde başkentin hemen üstünde görünür (üstteki **"Armaları göster"** kutusuyla kapatılabilir) ve **"PNG indir"** ile 512×512 saydam PNG olarak dışa aktarılabilir.

**Bağlantıyla harita üretme (URL parametreleri):** `?template=continent&seed=1234&w=2048` gibi bir adresle açıldığında editör doğrudan o tohumdan haritayı üretir. `template` (continent/island/archipelago) zorunlu; `seed`, `w`, `h`, `roughness`, `name` ve `rivers=1`/`lakes=1`/`terrain=1` isteğe bağlıdır. Görüntüyü adrese gömen 🔗 paylaşım linkinden farklı ve çok daha kısadır: görüntüyü değil *tarifi* taşır, karşı taraf aynı tohumdan aynı haritayı yeniden üretir.

## Çoklu harita (dünya ↔ bölge bağlantısı)

Büyük bir dünya haritasından, bir şehrin veya bölgenin kendi ayrıntılı haritasına geçiş yapılabilir — her biri kendi katmanlarına, nesnelerine ve geri al/yinele geçmişine sahip ayrı bir dokümandır:

1. **Bölge bağlantısı** aracıyla (`M`) haritaya tıklayın, bölgeye bir isim verin → yeni, boş bir alt harita oluşur ve üzerine bir iğne yerleşir.
2. **Seç** aracıyla iğneye çift tıklayın (veya seçince görünen **"Bölgeye gir →"** butonuna basın) → o bölge haritasına geçilir.
3. Sol üstte beliren gezinme çubuğundaki **"◀ Geri"** ile bir üst haritaya dönülür.

Bağlantı iğneleri yalnızca editör içi gezinme yardımcısıdır; PNG/SVG çıktısına dahil edilmez. `.json` proje dosyası tüm harita ağacını (dünya + tüm alt haritalar) tek seferde saklar.

**İç mekân haritaları:** Aynı mekanizma bir binanın iç mekânına (oda, salon, avlu) geçmek için de kullanılabilir — ayrı bir "iç mekân modu" yok, sadece normal bir alt harita. Oda şeklini **Kara** fırçasıyla boyayıp, **Arazi** panelindeki iç mekân dokularından biriyle (Ahşap/Taş zemin, Saman zemin, Halı, Mağara zemini, Taş duvar) işleyin, ardından **Sembol** kütüphanesinin **Eşya** kategorisinden (yatak, masa, sandalye, sandık, kitaplık, şömine, kazan, dolap, kasa, halı, pencere, iç kapı, duvar meşalesi, silah rafı, taht, örs) mobilya yerleştirin. Kıyı parlaması (shore) iç mekânda istenmiyorsa sağ panelden kapatılabilir.

## Sağ panel — seçenekler

Seçili araca göre değişen ayarlar burada görünür: fırça boyutu, opaklık, renk, kenarlık rengi/kalınlığı, kıyı stili (kumlu / kayalık / resif), **deniz rengi** (Kara aracının panelinde bir renk seçici — okyanus dokusu ve derinlik gradyanı anında yeni renkten türetilir, proje kaydında saklanır), yükselti gücü ve alçaltma modu, pusula gülü stili, ölçek çubuğu ayarları, ızgaraya yapış (snap-to-grid) açma/kapama, referans görsel yükleme/opaklık ve görünüm (yakınlaştır/sığdır) kontrolleri.

**Referans görsel — iz sürme (trace) modu:** Bir referans görsel yüklendikten sonra "İz sürme modu" işaretlenirse, görsel boyanan kara/arazi katmanlarının üstünde yarı saydam olarak gösterilmeye devam eder (normalde opak fırça darbeleri altında kalırdı) ve kara/deniz fırçası, referanstaki en yakın belirgin kenara (elle çizilmiş kıyı hattı gibi) otomatik kenetlenir. Bu mod yalnızca ekranda geçerlidir, PNG/SVG çıktısını etkilemez.

**Referans görsel — coğrafya tarama:** "⌖ Coğrafyayı tara" düğmesi, yüklenen referans görseldeki kıyı çizgisini, gölleri ve nehirleri otomatik olarak tuvale çıkarır — harici bir yapay zekâ/model kullanmadan, saf görüntü işleme (k=2 renk kümelemesi, bağlı bileşen analizi, çift-BFS ile nehir gövdesi çıkarımı) ile. Şehir/dağ gibi harita işaretleri coğrafyaya karışmaz: küçük, kompakt ve rengi baskın kümesinden sapan lekeler önce ayıklanıp altındaki arazi kesintisiz devam ettirilir, sonra kıyı/nehir/göl sınıflandırması yapılır. Tarama sırasında aşamalı bir ilerleme çubuğu gösterilir (hazırlık → işaretleri ayıkla → altını doldur → kıyı → nehir/göl → katmanlara yaz), istenirse iptal edilebilir. Bu, mevcut karayı değiştiren yıkıcı bir işlemdir; her seferinde onay istenir.

Bir nesne seçildiğinde ek işlemler görünür: **Çoğalt**, **Sil**, öne/arkaya getir, en öne/en arkaya gönder, gruplama/grup çözme.

**Harita çerçevesi:** "Seç" panelinde, tuvalin etrafına dekoratif bir kenarlık uygulanabilir — Sade çizgi, Halat veya Süslü stillerinden biri; renk ve kalınlık ayarlanabilir. Hem PNG hem SVG çıktısına dahildir.

**Katman karışım (blend) modu:** Katmanlar panelinde her raster katman (Kara, Arazi, Yükselti) için Normal, Çarpma, Bindirme, Yumuşak ışık veya Ekranlama karışım modlarından biri seçilebilir — ışık/gölge efektleri veya doku katmanlarını birleştirmek için.

## Alt/yan panel sekmeleri

- **Katmanlar** — Referans görsel, Kara, Arazi, Yükselti, Bölgeler, Nehirler, Yollar, Semboller, Kaynaklar, Harita bağlantıları, Ölçümler, Etiketler, Kaplama olmak üzere 13 katman; her biri görünürlük ve opaklık kontrolüyle açılıp kapatılabilir, sıralanabilir. Bunlara ek olarak **"+ Katman ekle"** ile en fazla 12 kendi katmanını ekleyebilirsin: serbest çizim/not katmanları. Adları çift tıkla değiştirilir (dil değişse de değişmez), × ile silinir, yerleşik katmanlarla aynı şekilde sıralanır ve karışım modu alır. `.json` kaydı bu katmanları içeriğiyle birlikte taşır. **Katman ekleme/silme geri alınamaz** — silme onay ister.
- **Kütüphane** — Tüm sembol/bina kataloğu; kategoriye göre gezinilebilir ve arama kutusuyla filtrelenebilir. Kendi PNG sembolünüzü de yükleyip kütüphaneye ekleyebilirsiniz. İzometrik binalarda malzeme/çatı varyantları arasında yaşlanma (yosunlu, yanık, yıpranmış) ve kültürel çeşitlilik (kilden/kerpiç, bambu, Doğu Asya pagoda kuleleri) temaları da bulunur; binaların altında artık yuvarlak zemin diski yok.
- **Geçmiş** — Yapılan işlemlerin (fırça darbesi, nesne ekleme/silme vb.) kronolojik listesi; herhangi bir adıma geri dönülebilir.
- **Bölgeler** — İki alt bölüm: adlandırılmış siyasi bölgelerin listesi (tıklayınca seçilir ve tuval o bölgeye kayar) ve tüm harita ağacının (dünya haritası + iç içe geçmiş her bölge bağlantısı) girintili, tıklanabilir bir görünümü — herhangi bir düğüme tıklayarak doğrudan o alt haritaya atlanır, ayrı ayrı "◀ Geri"lere basmaya gerek yoktur.
- **Görevler** — Tarayıcının `localStorage`'ında tutulan, basit tıklanabilir bir yapılacaklar listesi (ekle / işaretle / sil). Belirli bir projeye değil, tüm oturuma aittir.

Sol ve sağ panellerin dış kenarında birer **kolçak düğmesi** bulunur; tuvale daha fazla yer açmak için paneli tek tıkla kapatıp tekrar açabilirsiniz.

## Diğer özellikler

- **Ölçek çubuğu** — Haritada sürüklenip yeniden boyutlandırılabilen, birim/etiket özelleştirilebilir interaktif ölçek göstergesi (varsayılan etiket evrensel "km", dil değişse de anlamı korunur).
- **Sembol boyutlandırma** — Seçili bir sembolün köşelerinde çıkan tutamaçlardan sürükleyerek büyüt/küçült, çoğu tasarım programındaki gibi; döndürülmüş semboller için de doğru çalışır.
- **Pusula gülü (windrose)** — Klasik veya minimal stilde, haritaya yerleştirilebilen yön göstergesi.
- **Izgaraya yapış** — Sembol/nokta yerleştirmeyi belirli bir aralığa hizalar.
- **Minimap** — Sağ altta, tüm haritanın küçük genel görünümü ve hızlı gezinme.
- **Klavye kısayolları** — Araç seçimi için tek harf tuşları (yukarıdaki tabloda), yön tuşlarıyla kaydırma, `+`/`-`/`0` ile yakınlaştır/uzaklaştır/sığdır, `Delete` ile seçili nesneyi (veya son yol noktasını) sil, `Escape` ile çizimi iptal et.

## Sağdan sola diller (RTL)

Arayüz Arapça'yı destekler; `fa`/`he`/`ur` eklemek artık yalnızca veri işi. Yön `<html dir>`'e yazılır ve düzen
kendiliğinden aynalanır, çünkü yöne duyarlı CSS mantıksal özellikler kullanır (`border-inline-start`,
`padding-inline-end`, `inset-inline-end`, `text-align:start`). Tuvalin kendisi bir metin akışı olmadığı için
aynalanmaz.

Bundan bağımsız olarak **harita etiketleri** de düzeltildi: etiket motoru harf aralığı, yay ve yola oturma için
harfleri tek tek konumlandırıyordu; bu, Arapça/Farsça'da harflerin bitişme biçimlerini ve iki yönlü (bidi) sırayı
bozuyor, Hint yazılarında birleşik harfleri dağıtıyordu. Artık bu yazılarda etiket tek parça çiziliyor (harf aralığı
ve yay devre dışı, yola oturan etiket yolun orta noktasındaki teğete yerleşiyor); PNG ve SVG çıktısında da aynı
şekilde. Latin/Kiril etiketler eski davranışı aynen sürdürür. Bu düzeltme arayüz dili ne olursa olsun geçerlidir —
Türkçe arayüzde Arapça yer adı yazan biri de doğru sonucu alır.


## Ekran uyumluluğu

**Karşılama sayfaları** (Ana Sayfa / Tuval / Rehber / Topluluk) 360 piksellik telefondan
4K televizyona kadar tek akışkan ölçekle çalışır: tipografi ve boşluklar `clamp()` ile
viewport'a bağlı büyür, üst sınır çok büyük ekranda satır uzunluğunu okunur tutar.
640 piksel altında kart ızgaraları tek sütuna iner ve formlar tam genişliğe yayılır.

**Editör artık her ekran boyutunda açılır — eski "ekran çok küçük" kapısı kaldırıldı.**
Araç rayı + tuval + katman paneli yan yana çalışan üç sütunlu düzen ~860 piksel
altında tek sütuna iner; sol ve sağ paneller tuvalin üzerine kayan çekmecelere
dönüşür (kolçak düğmesiyle açılıp kapatılır, editöre ilk girişte dar ekranlarda
varsayılan kapalı başlarlar ki tuval hemen görünür olsun).

Dokunmatik cihazlarda çizim `pointer` olaylarıyla çalışır, yol araçları çift
dokunmayla bitirilebilir, ve **iki parmakla yakınlaştırma/kaydırma (pinch-zoom)**
desteklenir: ikinci parmak indiğinde birinci parmağın başlattığı tekli işlem
(varsa) önce düzgünce tamamlanır, sonra iki parmak birlikte tuvali yakınlaştırıp
kaydırır. Dar ekranlarda dokunma hedefleri (araç kareleri, sekmeler, düğmeler)
büyütülür; üst araç çubuğu sığmadığında kendi içinde yatay kaydırılabilir.
Çok-noktalı yol araçları (nehir/yol/bölge/göl/ölç) ve kement seçimi klavyesiz de
tamamlanır: tuvalin üzerinde beliren yüzen bir eylem çubuğu (bitir / iptal /
son noktayı geri al) aynı `Enter`/`Escape`/`Delete` işlevlerini dokunmatik
karşılıklarıyla sunar, böylece telefon/tablette klavye olmadan tam bir çizim
akışı (nehir çiz → bitir → sembol yerleştir → seç → sil) mümkündür.

## Mimari (geliştiriciler için)

Kod tabanının modül yapısı, yükleme sırası ve her dosyanın sorumluluğu için bkz. [`CLAUDE.md`](./CLAUDE.md).
