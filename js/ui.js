/* ============================================================
   Medieval Map Editor — ui.js  v3
   Paneller, i18n (TR/EN), katman listesi, sembol kütüphanesi,
   etiket şablonları, ölçek çubuğu, klavye.
   ============================================================ */
(function (global) {
  'use strict';

  /* innerHTML ile kurulan modal gövdelerinde kullanıcı metni (harita adı)
     ve çeviri dizeleri geçtiği için kaçış şart. */
  function esc(v) {
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var DICT = {
    tr: { tut_extras:'Araçların ötesinde — otomatik üreticiler', tut_extras_d:'Bunlar araç rayında değil; ilgili aracı seçtiğinde sağ panelde çıkarlar.', o_measurearea:'Alan olarak kapat',
      new:'Yeni', open:'Aç', save:'Kaydet', parchment:'Parşömen', grid:'Izgara', shore:'Kıyı',
      o_gridsec:'Izgara', o_gridtype:'Tür', o_grid_square:'Kare', o_grid_hex:'Altıgen', o_grid_dot:'Nokta', o_gridcell:'Hücre boyutu', o_gridcolor:'Renk', o_gridop:'Belirginlik', h_grid:'Izgarayı üst çubuktaki \'Izgara\' kutusundan aç/kapat. Altıgen ızgara masaüstü rol yapma oyunlarının standardıdır.',
      o_polsec:'Siyasi Harita', o_polmode:'Siyasi görünüm', o_polmute:'Arazi dokusunu sustur', o_pollegend:'Lejant göster', o_polfill:'Dolgu yoğunluğu', o_polcolors:'Devlet renklerini otomatik ata', o_polname:'Seçili bölgenin adı', o_polname_ph:'Devlet adı', h_political:'Siyasi görünüm ayrı bir katman değil; çizdiğin bölgeleri devlet alanı olarak sunar.', o_stategensec:'Devlet & Kültür Üretimi', o_polmodesel:'Görünüm', o_polmode_state:'Devletler', o_polmode_culture:'Kültürler', o_stcount:'Devlet sayısı', o_stvariety:'Büyüklük çeşitliliği', o_stategen_go:'👑 Devlet üret', h_stategen:'Kara üzerinde her başkentten eşzamanlı büyüyen, birbirine tam oturan devlet sınırları üretir. Mevcut elle çizilmiş bölgeleri korur, üstüne ekler.', o_cucount:'Kültür sayısı', o_culturegen_go:'🎭 Kültür üret', h_culturegen:'Devlet sınırlarından bağımsız, kendi ızgarasında büyüyen kültür bölgeleri üretir — üstteki "Görünüm" seçiciyle devlet/kültür sunumu arasında geçiş yapabilirsin.', o_stedit:'Seçili Bölge', h_stedit_none:'Düzenlemek için haritadan ya da sağdaki "Bölgeler" sekmesinden bir bölge seç.', o_stgov:'Hükümet biçimi', o_stcapital:'Başkent', o_stcapital_pick:'Başkenti haritadan seç', o_stcapital_cancel:'Başkent seçimini iptal et', o_stmake:'Devlete dönüştür', o_stunmake:'Devlet olmaktan çıkar', o_stemblem:'Arma', o_stemblem_gen:'Arma üret', o_stemblem_reroll:'Yeniden üret', o_stemblem_png:'PNG indir', o_stemblem_clear:'Armayı kaldır', h_stemblem:'Arma kodla çizilir; tohumu devletle birlikte kaydedilir, aynı tohum her zaman aynı armayı verir. Siyasi görünümde başkentin yanında görünür.', o_polemblem:'Armaları göster', m_emblem:'Arma üretildi', h_stedit:'Elle çizdiğin bir bölgeyi devlete dönüştürünce ad, hükümet biçimi ve başkent kazanır; üretilen devletlerle aynı şekilde listelenir ve renklendirilir.', m_stmade:'Bölge devlete dönüştürüldü', m_stunmade:'Bölge artık bir devlet değil', m_capitalpick:'Haritada başkentin yerine tıkla (Esc ile iptal)', st_capital_sea:'Başkent karada olmalı.', st_capital_set:'Başkent taşındı', o_provcount:'Devlet başına eyalet', o_provgen_go:'Eyalet üret', h_provgen:'Her devletin kendi sınırlarını alt bölgelere ayırır; eyalet sınırları ait olduğu devletin dışına taşmaz.', m_provgen:'eyalet üretildi', prov_nostate:'Önce devlet üret — eyaletler devletlerin içine bölünür.', prov_none:'Eyalet üretilemedi (devletler çok küçük).', o_diplosec:'Diplomasi', h_diplo_none:'İlişki tanımlamak için en az iki devlet gerekiyor.', o_diplo_a:'Devlet A', o_diplo_b:'Devlet B', o_diplo_rel:'İlişki', rel_peace:'Barış', rel_alliance:'İttifak', rel_war:'Savaş', rel_vassal:'Vasallık', diplo_same:'Aynı devlet kendisiyle ilişkilendirilemez.', o_polmode_religion:'Dinler', o_recount:'Din sayısı', o_religiongen_go:'Din üret', m_religiongen:'din bölgesi üretildi', o_citysec:'Şehir Üretimi', h_city_nosel:'Önce bir bölge seç — şehir o bölgenin sınırları içine üretilir.', o_citydistrict:'Mahalle tipi', o_citybuildings:'Bina sayısı', o_citystreet:'Sokak genişliği', o_citywall:'Sur ve kapı ekle', o_citygen_go:'Şehir üret', h_citygen:'Seçili bölgeyi caddeler ve ara sokaklarla bloklara, blokları parsellere böler; her parsele mahalle tipine uygun bir bina, cephesi en yakın sokağa dönük olacak şekilde yerleştirir. Tek adımda geri alınır.', m_citygen:'bina yerleştirildi', city_noarea:'Önce şehrin sığacağı bir bölge seç.', city_small:'Seçili bölge şehir için çok küçük.', dist_craftsmen:'Zanaatkâr', dist_market:'Pazar', dist_noble:'Soylu', dist_slum:'Yoksul mahalle', dist_temple:'Tapınak', dist_harbour:'Liman', accent_t:'Arayüz vurgu rengi (sağ tık: varsayılana dön)', o_speak:'Adı sesli oku', url_generated:'Bağlantıdaki tohumdan harita üretildi', url_badtemplate:'Bağlantıdaki şablon geçersiz.', exp_gis_t:'Vektör verisini GeoJSON olarak dışa aktar (QGIS vb.)', gis_done:'nesne GeoJSON olarak dışa aktarıldı', gis_empty:'Dışa aktarılacak vektör nesnesi yok.', m_stategen:'devlet üretildi', m_culturegen:'kültür bölgesi üretildi', stategen_noland:'Devlet üretmek için yeterli kara yok.', stategen_none:'Devlet/kültür üretilemedi.', gov_kingdom:'Krallık', gov_empire:'İmparatorluk', gov_theocracy:'Teokrasi', gov_republic:'Cumhuriyet', gov_confederation:'Konfederasyon', gov_citystate:'Şehir Devleti', m_polon:'Siyasi görünüm açık', m_poloff:'Fizikî görünüm', m_polcolored:'bölge renklendirildi', m_polempty:'Önce bölge çiz',
      o_nameculture:'Kültür', o_namefeature:'Tür', o_namegen:'🎲 Ad öner', o_nf_settlement:'Yerleşim', o_nf_city:'Şehir', o_nf_river:'Nehir', o_nf_mountain:'Dağ', o_nf_forest:'Orman', o_nf_region:'Bölge', o_nf_lake:'Göl', o_nf_sea:'Deniz',
      tpl_title:'Şablonla başla', tpl_desc:'Hazır bir kıyı çizgisiyle başla, sonra üzerine kendi dünyanı kur.', tpl_ready:'tuval hazır',
      tpl_continent:'Kıta', tpl_continent_d:'Geniş ana kara, girintili kıyılar', tpl_island:'Ada', tpl_island_d:'Tek büyük ada, çevresi açık deniz', tpl_archipelago:'Takımada', tpl_archipelago_d:'Dağınık adalar ve sığ boğazlar', tpl_kingdom:'Krallık', tpl_kingdom_d:'Yumuşak kıyılı, tarıma elverişli topraklar', tpl_battle:'Savaş alanı', tpl_battle_d:'Altıgen ızgaralı küçük arazi', tpl_blank:'Boş tuval', tpl_blank_d:'Her şeye sıfırdan başla',
      o_outlinecolor:'Dış hat rengi',
      exp_html_t:'Tek dosya HTML', exp_print_t:'Baskı / PDF', exp_png2_t:'2× çözünürlük', exp_png4_t:'4× çözünürlük', exp_maxdim:'En uzun kenar', exp_format:'Biçim', exp_fmt_png:'PNG · keskin, büyük dosya', exp_fmt_jpeg:'JPEG · küçük dosya', exp_title:'Başlık', exp_html_help:'Tek bir .html dosyası indirilir: harita ve küçük bir görüntüleyici içine gömülüdür. Sunucu gerekmez — dosyayı yollayıp çift tıklamak yeterli.', exp_page:'Sayfa boyu', exp_orient:'Yön', exp_portrait:'Dikey', exp_landscape:'Yatay', exp_margin:'Kenar boşluğu', exp_dpi:'Çözünürlük', exp_dpi_screen:'ekran', exp_dpi_normal:'normal baskı', exp_dpi_high:'yüksek kalite', exp_print_help:'Tarayıcının baskı penceresi açılır. Oradan yazıcıya gönderebilir ya da "PDF olarak kaydet" ile PDF üretebilirsin.', printing:'Baskı hazırlanıyor', print_failed:'Baskı penceresi açılamadı', viewer_hint:'sürükle · tekerlek · çift tık', viewer_in:'Yakınlaş', viewer_out:'Uzaklaş', viewer_fit:'Sığdır',
      exp_share_t:'Paylaşım linki', exp_share_gen:'🔗 Link oluştur', exp_share_link:'Link', exp_share_embedcode:'Embed kodu (iframe)', copy:'Kopyala', copied:'Kopyalandı',
      exp_share_help:'Sunucu yok — harita görüntüsü doğrudan linkin içine (URL\'nin # kısmına) gömülür. Link kimseye gönderilmeden hiçbir yere yüklenmez; büyük haritalarda link uzun olabilir.', exp_share_sizehint:'Link uzunluğu ≈ {kb} KB',
      share_editbtn:"Wayborne'da aç",
      t_sketch:'Çizim', o_sketch:'Çizim', h_sketch:'Serbest fırça, yalnızca kendi eklediğin katmanlara çizer. Katman panelinden "+ Katman ekle" ile bir katman ekle, listeden onu seç, sonra haritaya çiz.', o_hardness:'Sertlik', o_sketch_eraser:'Silgi modu', sketch_target:'Hedef katman', sketch_need_layer:'Önce kendi katmanını ekle ve listeden seç', layer_add:'+ Katman ekle', h_add_layer:'Kendi eklediğin katmanlar serbest çizim içindir; "Çizim" aracıyla üzerlerine boyayabilirsin.', layer_added:'Katman eklendi', layer_untitled:'Katman', layer_max:'En fazla 12 kullanıcı katmanı eklenebilir', layer_rename:'Katman adı', layer_rename_hint:'Adı değiştirmek için çift tıkla', layer_delete:'Katmanı sil', layer_delete_confirm:'Bu katmanı ve üzerindeki çizimi silmek istediğine emin misin?', tut_h_sketch:'Kendi eklediğin katmanlara serbest fırçayla çizer; renk, boyut, sertlik, opaklık ve silgi modu ayarlanabilir.',
      o_typography:'Tipografi', o_font:'Yazı ailesi', o_banner:'Kapıt', o_banner_none:'Yok', o_banner_ribbon:'Kurdele', o_banner_plate:'Levha', o_banner_scroll:'Tomar', o_banner_stone:'Taş', o_caps:'Büyük harf', o_outline:'Dış hat', o_shadow:'Gölge', h_font_missing:'Bu yazı ailesi bu cihazda kurulu değil; en yakın karşılığı kullanılıyor. Listede • ile işaretli olanlar kurulu.',
      grp_navigate:'Gezinme', grp_terrain:'Arazi', grp_water:'Su & Yollar', grp_markers:'İşaretler', grp_regions:'Bölge & Ölçüm',
      t_select:'Seç', t_landmass:'Kara', t_erase:'Deniz', t_fill:'Doldur', t_terrain:'Arazi', t_symbol:'Sembol',
      t_river:'Nehir', t_road:'Yol', t_label:'Etiket', t_pan:'Kaydır', t_eyedrop:'Örnekle', t_measure:'Ölç', h_measure:'Tıklayarak nokta ekle, çok parçalı bir mesafe ölçün. Enter / çift tık ile bitir, Esc ile iptal. Ölçüm çizgileri seçilip taşınabilir/silinebilir; PNG/SVG çıktısına dahil edilmez.',
      sc_title:'Klavye kısayolları', sc_general:'Genel', sc_undo:'Geri al', sc_redo:'Yinele', sc_save:'Kaydet',
      sc_pan:'Kaydır', sc_panfast:'Hızlı kaydır', sc_zoom:'Yakınlaştır / uzaklaştır', sc_fit:'Tümünü sığdır',
      sc_finish:'Yolu bitir', sc_cancel:'İptal / seçimi kaldır', sc_delete:'Seçileni sil', sc_rotsym:'Sembolü döndür', sc_help:'Bu ekranı aç',
      tpa_undo:'Son noktayı geri al', tpa_finish:'Bitir', tpa_cancel:'İptal', t_lasso:'Kement', h_lasso:'Sürükleyerek kapalı bir alan çiz: Kara + Arazi + Yükselti o alanda birlikte kaldırılıp taşınabilir hâle gelir. Sürükleyerek taşı, üstteki tutamaçla döndür. Enter ile onayla, Escape ile iptal et, Delete ile alanı tamamen sil.',
      o_landmass:'Kara / Kıyı', o_brushsize:'Fırça boyutu', o_rough:'Kıyı sertliği',
      o_landcolor:'Kara rengi', o_seacolor:'Deniz rengi', o_shorew:'Kıyı genişliği', o_shorestyle:'Kıyı stili', o_shore_sandy:'Kumsal', o_shore_rocky:'Kayalık', o_shore_reef:'Resif',
      o_smooth:'Kıyıyı yumuşat', o_clearland:'Karayı temizle',
      h_landmass:'Sürükleyerek kara çiz. "Deniz" aracı hem karayı hem araziyi siler.', o_landgen:'Rastgele kara üret', o_landgentpl:'Şablon', o_landgen_continent:'Kıta', o_landgen_island:'Ada', o_landgen_archipelago:'Takımada', o_landgenrough:'Detay / pürüzlülük',
      o_landgen_rivers:'Nehir ekle', o_landgen_lakes:'Göl ekle', o_landgen_terrain:'Arazi ekle', lakegen_none:'Uygun göl konumu bulunamadı.',
      o_landgen_go:'Üret', h_landgen:'Mevcut kara katmanının yerine geçer. Aynı ayarlarla tekrar tıklayınca yeni bir rastgele sonuç üretir.',
      o_terrain:'Arazi boyama', o_opacity:'Opaklık', o_clip:'Sadece karaya boya',
      o_biomegen:'Biyomu otomatik ata', o_biomegen_go:'🌍 Biyom ata', h_biomegen:'Yükselti ve enleme göre arazi katmanını otomatik doldurur; mevcut arazi katmanının yerine geçer.', biomegen_empty:'Önce kara çizilmeli.', o_zonetype:'Bölge tipi', o_zone_none:'— yok (siyasi bölge) —', o_zone_war:'Savaş bölgesi', o_zone_anomaly:'Anomali', o_zone_forbidden:'Yasak bölge', o_zone_hunting:'Av sahası', o_zone_quarantine:'Karantina', o_zone_sacred:'Kutsal alan', o_zone_trade:'Ticaret bölgesi', h_zonetype:'Tip verilen bir bölge devlet/kültür/din görünümlerinin hiçbirine ait olmaz; kendi tarama deseniyle her görünümde çizilir.', o_note:'Not', o_note_ph:'Bu nesneyle ilgili notun…', o_note_show:'Not işaretlerini haritada göster', o_nb_edit:'Kendi kültürünü ekle', o_nb_name:'Kültür adı', o_nb_bas:'Başlangıç heceleri: Ash, Bram, Dun', o_nb_orta:'Ara sesler: a, e, i', o_nb_son:'Bitiş heceleri: ford, dale, ton', o_nb_birlesik:'Birleşik (Ashford) — kapalıysa akıcı (Valeria)', o_nb_add:'Ekle', o_nb_del:'Seçili kültürü sil', h_nb:'Eklediğin kültür bu projeye özeldir, proje dosyasıyla birlikte kaydedilir ve kültür/din üretecinde de kullanılabilir.', nb_needname:'Önce bir kültür adı yaz.', nb_needsyl:'Başlangıç ve bitiş heceleri boş olamaz.', nb_builtin:'Yerleşik kültürler silinemez.', m_nbadded:'Kültür eklendi', m_nbdeleted:'Kültür silindi', o_lgsave:'Şablon olarak kaydet', o_lgdel:'Şablonu sil', o_lgsave_ask:'Şablona bir ad ver:', o_lgsave_def:'Kendi şablonum', m_lgsaved:'Şablon kaydedildi', h_lgpreset:'Kaydedilen şablon, o anki pürüzlülük ve nehir/göl/arazi seçimlerini adıyla saklar ve yukarıdaki listeye eklenir; proje dosyasıyla birlikte taşınır.', o_climate:'İklim', o_climate_on:'İklim modelini kullan', o_climate_eq:'Ekvator konumu', o_climate_str:'Yağış gölgesi etkisi', o_climate_wind:'Rüzgâr oklarını göster', h_climate:'Ekvatoru tuvalin ortasından kaydırarak tek yarımküreli ya da kutup haritaları yapabilirsin. Rüzgâr, dağların arkasında kalan hücrelerin nemini düşürür (yağış gölgesi), önündekileri nemlendirir — bir sonraki "Biyom ata" bunu hesaba katar.',
      o_rivergen:'Nehirleri otomatik üret', o_rivergen_go:'💧 Nehir üret', h_rivergen:'Yükselti gridinden denize akan nehirler ekler. "Yükselti" fırçasıyla dağ/tepe çizilmiş olması gerekir.', rivergen_noelev:'Önce "Yükselti" fırçasıyla dağ/tepe çizilmeli.', rivergen_none:'Uygun nehir kaynağı bulunamadı.',
      o_roadgen:'Yolları otomatik üret', o_roadgen_go:'🛤️ Yol üret', h_roadgen:'Yerleşim sembolleri arasında (şehir/kasaba/köy/kale/liman) yamaçtan kaçınan yollar çizer. Sembol yoksa birkaç rastgele kara noktasını bağlar.', roadgen_noland:'Yol için yeterli kara/nokta bulunamadı.', roadgen_none:'Hiçbir yol üretilemedi — kara parçaları birbirinden kopuk olabilir.',
      o_settlegen:'Yerleşimleri otomatik yerleştir', o_settlegen_go:'🏰 Yerleşim yerleştir', h_settlegen:'Düz ve kıyıya yakın kara üzerine şehir/kasaba/köy sembolleri dağıtır — en iyi konum kale/liman, geri kalanlar kasaba/köy olur. "Yol üret" bu sembolleri bulup birbirine bağlar. Her yerleşim, üzerinde durduğu kültür bölgesinin hece havuzundan bir ad alır.', o_settle_labels:'Adları etiket olarak da yaz', settlegen_noland:'Yerleşim için uygun kara bulunamadı.', settlegen_none:'Hiçbir yerleşim yerleştirilemedi.',
      o_symlegend:'Lejant',
      o_clearterrain:'Arazi katmanını temizle',
      h_terrain:'Doku her fırça vuruşunda rastgele serpilir — tekrar eden örüntü oluşmaz.', t_elevation:'Yükselti', o_elevation:'Yükselti', o_elevstrength:'Şiddet', o_elevlower:'Alçaltma modu', o_clearelevation:'Yükseltiyi temizle', o_elevdisplay:'Görünüm', o_elevhillshade:'Gölgelendirme (hillshade)', o_elevcontours:'Kontur çizgileri', o_contourinterval:'Kontur aralığı', h_elevation:'Sürükleyerek yükselt; "Alçaltma modu" işaretliyken çukurlaştırır. Gölgelendirme haritayı otomatik günceller.',
      o_symbol:'Sembol', o_size:'Boyut', o_rot:'Dönüş', o_hue:'Renk tonu',
      o_wear:'Yıpranma', o_jitter:'Yerleştirmede rastgelelik',
      h_symbol:'Kütüphaneden sembol seç, haritaya tıkla. "Seç" aracıyla taşı; Delete ile sil.',
      o_river:'Nehir', o_width:'Kalınlık', o_meander:'Kıvrım',
      o_taper:'Kaynakta incelt', o_color:'Renk',
      h_path:'Tıklayarak nokta ekle. Enter / çift tık ile bitir, Esc ile iptal.',
      o_road:'Yol / Kervan güzergâhı',
      o_label:'Etiket', o_preset:'Stil şablonu', o_curve:'Eğim', o_track:'Harf aralığı', o_snappath:'Yola oturt (nehir/yol)',
      h_label:'Şablon seç, metni yaz, haritaya tıkla. Seçili etikette ayarlar anında uygulanır.',
      o_eyedrop:'Doku Örnekleyici', o_eye_nosample:'Henüz örnekleme yapılmadı',
      o_eye_radius:'Örnekleme yarıçapı', o_eye_brush:'Fırça boyutu',
      o_eye_pick:'① Alan seç', o_eye_paint:'② Boyamaya başla', o_eye_clear:'Örneği temizle',
      h_eyedrop:'① Alan seç: sürükleyerek daire çiz. ② Boyamaya başla: dokuyu haritaya uygula.',
      eyeOk:'✓ Doku örneklendi', eyeFail:'Örnekleme başarısız — kara/arazi üstünde dene.',
      eyePick:'Haritada tıklayıp sürükle → daire boyutunu seç → bırak.',
      eyePaint:'Haritaya tıklayıp sürükle → doku uygulanır.',
      eyeNeed:'Önce ① Alan seç ile doku örnekle.',
      o_selection:'Seçim', o_nosel:'Seçili nesne yok', o_dup:'Çoğalt', o_del:'Sil',
      o_scalebar:'Ölçek çubuğu', o_scvis:'Haritada göster', o_sclen:'Uzunluk',
      o_scsize:'Yazı boyutu', o_scsegs:'Bölme sayısı',
      h_scale:'Ölçek çubuğunu haritada sürükleyerek taşıyabilirsin.',
      o_view:'Görünüm', o_fit:'Ekrana sığdır', o_100:'%100',
      h_pan:'Sağ tık + sürükle, orta tık, Space + sürükle veya yön tuşları ile kaydır.',
      tab_layers:'Katmanlar', tab_library:'Kütüphane', tab_history:'Geçmiş',
      tab_regions:'Bölgeler', tab_todo:'Görevler',
      regions_political:'Siyasi bölgeler', regions_political_empty:'Henüz adlandırılmış bölge yok. "Bölge" aracıyla çiz, sonra ad ver.',
      regions_maptree:'Harita ağacı',
      todo_placeholder:'Yeni görev...', todo_add:'Ekle', todo_empty:'Henüz görev yok.',
      panel_toggle_left:'Sol paneli aç/kapat', panel_toggle_right:'Sağ paneli aç/kapat',
      ref_title:'Referans görsel', ref_export:"Export'a dahil et", ref_clear:'Referansı kaldır', ref_trace:'İz sürme modu (üstte göster + kıyı kenetleme)', ref_scan:'⌖ Coğrafyayı tara', h_ref_scan:'Referans görseldeki kıyı, göl ve nehirleri otomatik çıkarır. Şehir/dağ gibi harita işaretleri coğrafyaya karıştırılmaz — altlarındaki arazi kesintisiz devam eder. Mevcut karayı değiştirir.', scan_title:'Harita taranıyor', scan_cancel:'İptal', scan_prepare:'Görsel hazırlanıyor', scan_markers:'Harita işaretleri ayıklanıyor', scan_clean:'İşaretlerin altındaki arazi tamamlanıyor', scan_coast:'Kıyı çizgisi çıkarılıyor', scan_water:'Nehir ve göller ayrıştırılıyor', scan_commit:'Katmanlara yazılıyor', scan_noimage:'Önce bir referans görsel yükleyin.', scan_flat:'Görselde birbirinden ayrışan iki renk bölgesi bulunamadı — kara/deniz ayrımı çıkarılamıyor.', scan_noland:'Görselde kara bulunamadı.', scan_failed:'Tarama tamamlanamadı.', scan_done:'Tarama tamam — {r} nehir, {l} göl; {m} harita işareti coğrafyaya karıştırılmadı.', layer_drag_hint:'Katmanı sürükleyip yeniden sıralamak için buradan tutun', blend_sourceover:'Normal', blend_multiply:'Çarpma', blend_overlay:'Bindirme', blend_softlight:'Yumuşak ışık', blend_screen:'Ekranlama', nav_home:'Ana Sayfa', nav_canvas:'Tuval', nav_tutorial:'Rehber', nav_community:'Topluluk', home_tagline:'Fantastik dünyalar için tarayıcı tabanlı harita editörü', home_desc:'Kara ve deniz sınırlarını çiz, ormanları ve dağları boya, kaleler ve köyler yerleştir, nehirler ve yollar döşe — hepsi tek bir tuvalde, kurulum gerektirmeden tarayıcında.', home_cta:'Haritana başla', home_video_caption:'Tanıtım videosu yakında', canvas_new_title:'Yeni tuval oluştur', canvas_custom:'Özel ölçü…', canvas_name_ph:'Harita adı', canvas_create:'Oluştur', canvas_import:'.json dosyasından içe aktar', canvas_saved_title:'Kayıtlı tuvaller', canvas_empty:'Bu tarayıcıda henüz kayıtlı bir tuval yok. Editördeyken "Kaydet" ile otomatik burada listelenir.', canvas_open:'Aç', canvas_delete:'Sil', canvas_delete_confirm:'Bu tuvali silmek istediğine emin misin? Bu işlem geri alınamaz.', canvas_unnamed:'Adsız harita', tutorial_title:'Rehber', tutorial_intro:'Sol araç çubuğundaki her araç, sağ panelde kendi ayarlarını açar. Aşağıda her aracın ne işe yaradığının kısa özeti var.', community_title:'Topluluk', community_desc:'Wayborne Map Editor açık kaynaklı, sürekli gelişen bir projedir.', community_github_desc:'Kaynak kod, hata bildirimi ve katkı', community_soon:'Yakında', lib_full:'Tarayıcı depolama alanı dolu — eski bir tuvali sil ya da .json olarak dışa aktar.', tut_h_select:'Nesneleri seç, taşı, döndür; Shift ile çoklu seçim yap.', tut_h_erase:'Boyanmış karayı ve üzerindeki arazi dokusunu tek adımda siler.', tut_h_fill:'Kapalı bir kıyı çevriminin içini tek tıkla doldurur.', tut_h_river:'Tıklayarak nokta ekle, akarsu çiz; Enter ile bitir.', tut_h_road:'Tıklayarak nokta ekle, yol çiz; Enter ile bitir.',
      sym_upload:'+ PNG Sembol yükle', sym_upload_done:'sembol yüklendi', sym_del:'Sil', sym_search:'Sembol ara...', sym_recent:'Son kullanılanlar',
      st_pos:'Konum', st_zoom:'Yakınlık', st_size:'Tuval', st_tool:'Araç',
      cancel:'Vazgeç', ok:'Tamam',
      locked:'Katman kilitli veya gizli.', needtext:'Önce etiket metnini yaz.', nopathnear:'Yakında nehir/yol bulunamadı.', fill_toolarge:'Alan çok büyük — kapalı bir sınır içinde deneyin.',
      exported:'Dışa aktarıldı:', saved:'Proje kaydedildi.', loaded:'Proje yüklendi.',
      badfile:'Geçersiz proje dosyası.', newmap:'Yeni harita oluşturuldu.',
      confirmNew:'Mevcut harita silinecek. Yeni tuval boyutunu seç:',
      confirmSize:'Tuval boyutunu değiştirmek mevcut katmanları ölçekler. Devam edilsin mi?',
      histStart:'Başlangıç', selNone:'Seçili nesne yok', symbols:'sembol',
      selScale:'Ölçek çubuğu seçili', o_front:'En öne', o_back:'En arkaya',
      o_fwd:'Öne getir', o_bwd:'Arkaya gönder',
      o_group:'Grupla', o_ungroup:'Grubu çöz',
      selMulti:'nesne seçili',
      t_lake:'Göl', o_lake:'Göl', h_lake:'Tıklayarak nokta ekle, 3+ nokta sonra Enter ile kapat.', t_territory:'Bölge', o_territory:'Bölge', o_territorycolor:'Dolgu rengi', o_territorybcolor:'Sınır rengi', h_territory:'Tıklayarak nokta ekle, 3+ nokta sonra Enter ile kapat.', t_regionlink:'Bölge bağlantısı', h_regionlink:'Haritaya tıkla, isim ver: yeni ve boş bir bölge haritası oluşturulur. Seç aracıyla iğneye çift tıklayarak o bölgeye gir, sol üstteki "Geri" ile dünya haritasına dön.', rl_newtitle:'Yeni bölge haritası', rl_placeholder:'Bölge adı', rl_default:'Adsız bölge', rl_open:'Bölgeye gir →', bc_back:'Geri', bc_world:'Dünya haritası', t_resource:'Kaynak', o_resourcetype:'Tür', rs_mine:'Maden', rs_farm:'Tarım', rs_hunting:'Avlanma', rs_fishing:'Balıkçılık', rs_trade:'Ticaret', rs_quarry:'Taş ocağı', h_resource:'Haritaya tıklayarak seçili türde bir kaynak işareti yerleştir.',
      o_lakecolor:'Göl rengi',
      o_symbbrush:'Fırça modu', o_symbdensity:'Yoğunluk', o_clipland:'Karaya kenetle (fırça)',
      o_windrose:'Pusula Gülü', o_wrvis:'Haritada göster', o_wrsize:'Boyut',
      o_wrstyle_classic:'Klasik', o_wrstyle_minimal:'Sade', o_wrstyle:'Stil', o_wrcolor:'Renk', h_windrose:'Haritada sürükleyerek taşı.',
      o_snap:'Izgaraya yapış', o_snapsize:'Izgara boyutu', o_frame:'Harita çerçevesi', o_frame_none:'Yok', o_frame_simple:'Sade çizgi', o_frame_rope:'Halat', o_frame_ornate:'Süslü', o_frame_color:'Renk'
    },
    en: { tut_extras:'Beyond the tools — automatic generators', tut_extras_d:'These are not on the tool rail; they appear in the right panel when you pick the related tool.', o_measurearea:'Close as area',
      new:'New', open:'Open', save:'Save', parchment:'Parchment', grid:'Grid', shore:'Shore',
      o_gridsec:'Grid', o_gridtype:'Type', o_grid_square:'Square', o_grid_hex:'Hex', o_grid_dot:'Dot', o_gridcell:'Cell size', o_gridcolor:'Colour', o_gridop:'Strength', h_grid:'Toggle the grid from the \'Grid\' box in the top bar. Hex is the tabletop RPG standard.',
      o_polsec:'Political Map', o_polmode:'Political view', o_polmute:'Mute terrain texture', o_pollegend:'Show legend', o_polfill:'Fill strength', o_polcolors:'Auto-assign state colours', o_polname:'Name of selected region', o_polname_ph:'State name', h_political:'Political view is not a separate layer; it presents the regions you drew as states.', o_stategensec:'State & Culture Generation', o_polmodesel:'View', o_polmode_state:'States', o_polmode_culture:'Cultures', o_stcount:'Number of states', o_stvariety:'Size variety', o_stategen_go:'👑 Generate states', h_stategen:'Generates state borders that grow simultaneously from each capital and fit neatly against each other. Keeps your hand-drawn regions, adds to them.', o_cucount:'Number of cultures', o_culturegen_go:'🎭 Generate cultures', h_culturegen:'Generates culture regions that grow on their own grid, independent of state borders — switch between state/culture presentation with the "View" selector above.', o_stedit:'Selected Region', h_stedit_none:'Select a region on the map or from the "Regions" tab on the right to edit it.', o_stgov:'Government type', o_stcapital:'Capital', o_stcapital_pick:'Pick capital on the map', o_stcapital_cancel:'Cancel capital picking', o_stmake:'Convert to state', o_stunmake:'Remove state status', o_stemblem:'Coat of arms', o_stemblem_gen:'Generate arms', o_stemblem_reroll:'Generate again', o_stemblem_png:'Download PNG', o_stemblem_clear:'Remove arms', h_stemblem:'The arms are drawn in code; the seed is saved with the state, so the same seed always yields the same arms. Shown next to the capital in political view.', o_polemblem:'Show coats of arms', m_emblem:'Arms generated', h_stedit:'Converting a hand-drawn region into a state gives it a name, a government type and a capital; it is then listed and coloured just like a generated state.', m_stmade:'Region converted into a state', m_stunmade:'Region is no longer a state', m_capitalpick:'Click the capital\'s position on the map (Esc to cancel)', st_capital_sea:'The capital must be on land.', st_capital_set:'Capital moved', o_provcount:'Provinces per state', o_provgen_go:'Generate provinces', h_provgen:'Divides each state\'s own borders into sub-regions; a province border never crosses the border of the state it belongs to.', m_provgen:'provinces generated', prov_nostate:'Generate states first — provinces are subdivisions of states.', prov_none:'Could not generate provinces (states too small).', o_diplosec:'Diplomacy', h_diplo_none:'At least two states are needed to define relations.', o_diplo_a:'State A', o_diplo_b:'State B', o_diplo_rel:'Relation', rel_peace:'Peace', rel_alliance:'Alliance', rel_war:'War', rel_vassal:'Vassalage', diplo_same:'A state cannot have a relation with itself.', o_polmode_religion:'Religions', o_recount:'Number of religions', o_religiongen_go:'Generate religions', m_religiongen:'religion regions generated', o_citysec:'City Generation', h_city_nosel:'Select a region first — the city is generated inside its boundary.', o_citydistrict:'District type', o_citybuildings:'Number of buildings', o_citystreet:'Street width', o_citywall:'Add walls and gates', o_citygen_go:'Generate city', h_citygen:'Splits the selected region into blocks with avenues and side streets, then the blocks into plots, and places a building suited to the district type on each plot, its front turned towards the nearest street. Undone in one step.', m_citygen:'buildings placed', city_noarea:'Select a region for the city to fit into first.', city_small:'The selected region is too small for a city.', dist_craftsmen:'Craftsmen', dist_market:'Market', dist_noble:'Noble', dist_slum:'Slum', dist_temple:'Temple', dist_harbour:'Harbour', accent_t:'Interface accent colour (right-click to reset)', o_speak:'Read the name aloud', url_generated:'Map generated from the seed in the link', url_badtemplate:'The template in the link is not valid.', exp_gis_t:'Export vector data as GeoJSON (QGIS etc.)', gis_done:'features exported as GeoJSON', gis_empty:'No vector objects to export.', m_stategen:'states generated', m_culturegen:'culture regions generated', stategen_noland:'Not enough land to generate states.', stategen_none:'Could not generate states/cultures.', gov_kingdom:'Kingdom', gov_empire:'Empire', gov_theocracy:'Theocracy', gov_republic:'Republic', gov_confederation:'Confederation', gov_citystate:'City-state', m_polon:'Political view on', m_poloff:'Physical view', m_polcolored:'regions coloured', m_polempty:'Draw a region first',
      o_nameculture:'Culture', o_namefeature:'Type', o_namegen:'🎲 Suggest name', o_nf_settlement:'Settlement', o_nf_city:'City', o_nf_river:'River', o_nf_mountain:'Mountain', o_nf_forest:'Forest', o_nf_region:'Region', o_nf_lake:'Lake', o_nf_sea:'Sea',
      tpl_title:'Start from a template', tpl_desc:'Begin with a ready-made coastline, then build your world on top of it.', tpl_ready:'canvas ready',
      tpl_continent:'Continent', tpl_continent_d:'Broad landmass with indented coasts', tpl_island:'Island', tpl_island_d:'A single large island in open sea', tpl_archipelago:'Archipelago', tpl_archipelago_d:'Scattered isles and shallow straits', tpl_kingdom:'Kingdom', tpl_kingdom_d:'Gentle coasts, farmable inland', tpl_battle:'Battle map', tpl_battle_d:'Small terrain with a hex grid', tpl_blank:'Blank canvas', tpl_blank_d:'Start from nothing',
      o_outlinecolor:'Outline colour',
      exp_html_t:'Single-file HTML', exp_print_t:'Print / PDF', exp_png2_t:'2× resolution', exp_png4_t:'4× resolution', exp_maxdim:'Longest edge', exp_format:'Format', exp_fmt_png:'PNG · sharp, large file', exp_fmt_jpeg:'JPEG · small file', exp_title:'Title', exp_html_help:'Downloads one .html file with the map and a small viewer embedded inside it. No server needed — send the file and double-click it.', exp_page:'Page size', exp_orient:'Orientation', exp_portrait:'Portrait', exp_landscape:'Landscape', exp_margin:'Margin', exp_dpi:'Resolution', exp_dpi_screen:'screen', exp_dpi_normal:'normal print', exp_dpi_high:'high quality', exp_print_help:'Opens your browser’s print dialog. From there you can send it to a printer or choose “Save as PDF”.', printing:'Preparing print', print_failed:'Could not open the print dialog', viewer_hint:'drag · wheel · double-click', viewer_in:'Zoom in', viewer_out:'Zoom out', viewer_fit:'Fit',
      exp_share_t:'Share link', exp_share_gen:'🔗 Generate link', exp_share_link:'Link', exp_share_embedcode:'Embed code (iframe)', copy:'Copy', copied:'Copied',
      exp_share_help:'No server — the map image is embedded directly in the link (the URL\'s # part). The link is never uploaded anywhere unless you send it yourself; large maps make longer links.', exp_share_sizehint:'Link length ≈ {kb} KB',
      share_editbtn:'Open in Wayborne',
      t_sketch:'Sketch', o_sketch:'Sketch', h_sketch:'A freehand brush that only draws on layers you add yourself. Add one with "+ Add layer" in the layer panel, select it in the list, then draw on the map.', o_hardness:'Hardness', o_sketch_eraser:'Eraser mode', sketch_target:'Target layer', sketch_need_layer:'Add your own layer first, then select it in the list', layer_add:'+ Add layer', h_add_layer:'Layers you add yourself are for freehand drawing; paint on them with the "Sketch" tool.', layer_added:'Layer added', layer_untitled:'Layer', layer_max:'At most 12 user layers can be added', layer_rename:'Layer name', layer_rename_hint:'Double-click to rename', layer_delete:'Delete layer', layer_delete_confirm:'Delete this layer and everything drawn on it?', tut_h_sketch:'Draws freehand on layers you add yourself; colour, size, hardness, opacity and an eraser mode are adjustable.',
      o_typography:'Typography', o_font:'Typeface', o_banner:'Banner', o_banner_none:'None', o_banner_ribbon:'Ribbon', o_banner_plate:'Plate', o_banner_scroll:'Scroll', o_banner_stone:'Stone', o_caps:'Uppercase', o_outline:'Outline', o_shadow:'Shadow', h_font_missing:'This typeface is not installed on this device; the closest match is used instead. Entries marked · are installed.',
      grp_navigate:'Navigate', grp_terrain:'Terrain', grp_water:'Water & Routes', grp_markers:'Markers', grp_regions:'Regions & Measure',
      t_select:'Select', t_landmass:'Land', t_erase:'Sea', t_fill:'Fill', t_terrain:'Terrain', t_symbol:'Symbol',
      t_river:'River', t_road:'Road', t_label:'Label', t_pan:'Pan', t_eyedrop:'Sample', t_measure:'Measure', h_measure:'Click to add points and measure a multi-segment distance. Enter / double-click to finish, Esc to cancel. Measurement lines can be selected, moved, or deleted; they are excluded from PNG/SVG export.',
      sc_title:'Keyboard shortcuts', sc_general:'General', sc_undo:'Undo', sc_redo:'Redo', sc_save:'Save',
      sc_pan:'Pan', sc_panfast:'Pan faster', sc_zoom:'Zoom in / out', sc_fit:'Fit to view',
      sc_finish:'Finish path', sc_cancel:'Cancel / deselect', sc_delete:'Delete selection', sc_rotsym:'Rotate symbol', sc_help:'Open this screen',
      tpa_undo:'Undo last point', tpa_finish:'Finish', tpa_cancel:'Cancel', t_lasso:'Lasso', h_lasso:'Drag to draw a closed area: Land + Terrain + Elevation are lifted together within it and become movable. Drag to move, use the top handle to rotate. Enter to commit, Escape to cancel, Delete to remove the area entirely.',
      o_landmass:'Landmass / Coast', o_brushsize:'Brush size', o_rough:'Coast roughness',
      o_landcolor:'Land colour', o_seacolor:'Sea colour', o_shorew:'Shore width', o_shorestyle:'Shore style', o_shore_sandy:'Sandy', o_shore_rocky:'Rocky', o_shore_reef:'Reef',
      o_smooth:'Smooth coastline', o_clearland:'Clear landmass',
      h_landmass:'Drag to paint land. The "Sea" tool erases both land and terrain.', o_landgen:'Generate random land', o_landgentpl:'Template', o_landgen_continent:'Continent', o_landgen_island:'Island', o_landgen_archipelago:'Archipelago', o_landgenrough:'Detail / roughness',
      o_landgen_rivers:'Add rivers', o_landgen_lakes:'Add lakes', o_landgen_terrain:'Add terrain', lakegen_none:'No suitable lake spot found.',
      o_landgen_go:'Generate', h_landgen:'Replaces the current land layer. Click again with the same settings for a new random result.',
      o_terrain:'Terrain painting', o_opacity:'Opacity', o_clip:'Paint on land only',
      o_biomegen:'Auto-assign biomes', o_biomegen_go:'🌍 Assign biomes', h_biomegen:'Fills the terrain layer automatically by elevation and latitude; replaces the current terrain layer.', biomegen_empty:'Draw land first.', o_zonetype:'Zone type', o_zone_none:'— none (political region) —', o_zone_war:'War zone', o_zone_anomaly:'Anomaly', o_zone_forbidden:'Forbidden zone', o_zone_hunting:'Hunting ground', o_zone_quarantine:'Quarantine', o_zone_sacred:'Sacred ground', o_zone_trade:'Trade zone', h_zonetype:'A region with a type belongs to none of the state/culture/religion views; it is drawn with its own hatch pattern in every view.', o_note:'Note', o_note_ph:'Your note about this object…', o_note_show:'Show note marks on the map', o_nb_edit:'Add your own culture', o_nb_name:'Culture name', o_nb_bas:'Opening syllables: Ash, Bram, Dun', o_nb_orta:'Middle sounds: a, e, i', o_nb_son:'Closing syllables: ford, dale, ton', o_nb_birlesik:'Compound (Ashford) — off means flowing (Valeria)', o_nb_add:'Add', o_nb_del:'Delete selected culture', h_nb:'A culture you add belongs to this project, is saved with the project file, and can also be used by the culture/religion generator.', nb_needname:'Type a culture name first.', nb_needsyl:'Opening and closing syllables cannot be empty.', nb_builtin:'Built-in cultures cannot be deleted.', m_nbadded:'Culture added', m_nbdeleted:'Culture deleted', o_lgsave:'Save as template', o_lgdel:'Delete template', o_lgsave_ask:'Name this template:', o_lgsave_def:'My template', m_lgsaved:'Template saved', h_lgpreset:'A saved template stores the current roughness and river/lake/terrain choices under a name and adds it to the list above; it travels with the project file.', o_climate:'Climate', o_climate_on:'Use the climate model', o_climate_eq:'Equator position', o_climate_str:'Rain-shadow strength', o_climate_wind:'Show wind arrows', h_climate:'Move the equator away from the middle of the canvas to make single-hemisphere or polar maps. Wind dries the cells behind mountains (rain shadow) and moistens the ones in front — the next "Assign biomes" run takes this into account.',
      o_rivergen:'Auto-generate rivers', o_rivergen_go:'💧 Generate rivers', h_rivergen:'Adds rivers flowing to the sea from the elevation grid. Requires mountains/hills painted with the "Elevation" brush.', rivergen_noelev:'Paint mountains/hills with the "Elevation" brush first.', rivergen_none:'No suitable river source found.',
      o_roadgen:'Auto-generate roads', o_roadgen_go:'🛤️ Generate roads', h_roadgen:'Draws roads between settlement symbols (city/town/village/castle/port) avoiding steep slopes. Connects a few random land points if there are no settlements.', roadgen_noland:'Not enough land/points found for roads.', roadgen_none:'No roads could be generated — landmasses may be disconnected.',
      o_settlegen:'Auto-place settlements', o_settlegen_go:'🏰 Place settlements', h_settlegen:'Scatters city/town/village symbols on flat land near the coast — the best spot gets a castle/port, the rest get towns/villages. "Generate roads" finds these symbols and connects them. Each settlement is named from the syllable pool of the culture region it sits in.', o_settle_labels:'Also write the names as labels', settlegen_noland:'No suitable land found for settlements.', settlegen_none:'No settlements could be placed.',
      o_symlegend:'Legend',
      o_clearterrain:'Clear terrain layer',
      h_terrain:'Marks scatter randomly on every stroke — no repeating pattern.', t_elevation:'Elevation', o_elevation:'Elevation', o_elevstrength:'Strength', o_elevlower:'Lower mode', o_clearelevation:'Clear elevation', o_elevdisplay:'Display', o_elevhillshade:'Hillshade', o_elevcontours:'Contour lines', o_contourinterval:'Contour interval', h_elevation:'Drag to raise terrain; enable "Lower mode" to carve it down. Hillshade updates the map automatically.',
      o_symbol:'Symbol', o_size:'Size', o_rot:'Rotation', o_hue:'Hue shift',
      o_wear:'Wear', o_jitter:'Randomise placement',
      h_symbol:'Pick a symbol, click the map. Use "Select" to move; Delete to remove.',
      o_river:'River', o_width:'Width', o_meander:'Meander',
      o_taper:'Taper at source', o_color:'Colour',
      h_path:'Click to add points. Enter / double-click to finish, Esc to cancel.',
      o_road:'Road / Caravan route',
      o_label:'Label', o_preset:'Style preset', o_curve:'Curve', o_track:'Letter spacing', o_snappath:'Snap to path (river/road)',
      h_label:'Pick a preset, type the text, click the map. Live-applies to a selected label.',
      o_eyedrop:'Texture Sampler', o_eye_nosample:'No sample yet',
      o_eye_radius:'Sample radius', o_eye_brush:'Brush size',
      o_eye_pick:'① Pick area', o_eye_paint:'② Start painting', o_eye_clear:'Clear sample',
      h_eyedrop:'① Pick area: drag a circle. ② Paint: apply the sampled texture.',
      eyeOk:'✓ Texture sampled', eyeFail:'Sampling failed — try over land/terrain.',
      eyePick:'Click and drag on the map → set circle size → release.',
      eyePaint:'Click and drag on the map → texture is applied.',
      eyeNeed:'Sample a texture with ① Pick area first.',
      o_selection:'Selection', o_nosel:'Nothing selected', o_dup:'Duplicate', o_del:'Delete',
      o_scalebar:'Scale bar', o_scvis:'Show on map', o_sclen:'Length',
      o_scsize:'Text size', o_scsegs:'Segments',
      h_scale:'Drag the scale bar on the map to reposition it.',
      o_view:'View', o_fit:'Fit to screen', o_100:'100%',
      h_pan:'Right-click drag, middle-click, Space + drag, or arrow keys to pan.',
      tab_layers:'Layers', tab_library:'Library', tab_history:'History',
      tab_regions:'Regions', tab_todo:'To-do',
      regions_political:'Political regions', regions_political_empty:'No named regions yet. Draw with the "Territory" tool, then give it a name.',
      regions_maptree:'Map tree',
      todo_placeholder:'New task...', todo_add:'Add', todo_empty:'No tasks yet.',
      panel_toggle_left:'Toggle left panel', panel_toggle_right:'Toggle right panel',
      ref_title:'Reference image', ref_export:'Include in export', ref_clear:'Remove reference', ref_trace:'Trace mode (show on top + coastline snap)', ref_scan:'⌖ Scan geography', h_ref_scan:'Extracts the coastline, lakes and rivers from the reference image. Map markers such as cities and mountains are kept out of the geography — the terrain beneath them continues uninterrupted. Replaces the current land.', scan_title:'Scanning map', scan_cancel:'Cancel', scan_prepare:'Preparing image', scan_markers:'Picking out map markers', scan_clean:'Filling terrain under markers', scan_coast:'Extracting coastline', scan_water:'Separating rivers and lakes', scan_commit:'Writing to layers', scan_noimage:'Load a reference image first.', scan_flat:'No two distinct colour regions found in the image — land and sea cannot be told apart.', scan_noland:'No land found in the image.', scan_failed:'The scan could not be completed.', scan_done:'Scan complete — {r} rivers, {l} lakes; {m} map markers kept out of the geography.', layer_drag_hint:'Grab here to drag and reorder the layer', blend_sourceover:'Normal', blend_multiply:'Multiply', blend_overlay:'Overlay', blend_softlight:'Soft light', blend_screen:'Screen', nav_home:'Home', nav_canvas:'Canvas', nav_tutorial:'Tutorial', nav_community:'Community', home_tagline:'A browser-based map editor for fantasy worlds', home_desc:'Draw land and sea boundaries, paint forests and mountains, place castles and villages, lay down rivers and roads — all on one canvas, in your browser, no install required.', home_cta:'Start your map', home_video_caption:'Intro video coming soon', canvas_new_title:'Create a new canvas', canvas_custom:'Custom size…', canvas_name_ph:'Map name', canvas_create:'Create', canvas_import:'Import from .json file', canvas_saved_title:'Saved canvases', canvas_empty:'No canvases saved in this browser yet. They\'re listed here automatically when you hit "Save" in the editor.', canvas_open:'Open', canvas_delete:'Delete', canvas_delete_confirm:'Delete this canvas? This cannot be undone.', canvas_unnamed:'Untitled map', tutorial_title:'Tutorial', tutorial_intro:'Each tool in the left toolbar opens its own settings in the right panel. Below is a quick summary of what each tool does.', community_title:'Community', community_desc:'Wayborne Map Editor is an open-source, actively evolving project.', community_github_desc:'Source code, bug reports and contributions', community_soon:'Coming soon', lib_full:'Browser storage is full — delete an old canvas or export it as .json.', tut_h_select:'Select, move and rotate objects; Shift-click for multi-select.', tut_h_erase:'Erases painted land and the terrain texture on top of it in one step.', tut_h_fill:'Fills the inside of a closed coastline outline with one click.', tut_h_river:'Click to add points and draw a river; Enter to finish.', tut_h_road:'Click to add points and draw a road; Enter to finish.',
      sym_upload:'+ Upload PNG Symbol', sym_upload_done:'symbol(s) loaded', sym_del:'Delete', sym_search:'Search symbols...', sym_recent:'Recently used',
      st_pos:'Pos', st_zoom:'Zoom', st_size:'Canvas', st_tool:'Tool',
      cancel:'Cancel', ok:'OK',
      locked:'Layer is locked or hidden.', needtext:'Type the label text first.', nopathnear:'No river/road found nearby.', fill_toolarge:'Area too large — try inside a closed boundary.',
      exported:'Exported:', saved:'Project saved.', loaded:'Project loaded.',
      badfile:'Invalid project file.', newmap:'New map created.',
      confirmNew:'The current map will be discarded. Choose a canvas size:',
      confirmSize:'Changing canvas size rescales existing layers. Continue?',
      histStart:'Start', selNone:'Nothing selected', symbols:'symbols',
      selScale:'Scale bar selected', o_front:'Bring to front', o_back:'Send to back',
      o_fwd:'Bring forward', o_bwd:'Send backward',
      o_group:'Group', o_ungroup:'Ungroup',
      selMulti:'objects selected',
      t_lake:'Lake', o_lake:'Lake', h_lake:'Click to add points, 3+ points then Enter to close.', t_territory:'Territory', o_territory:'Territory', o_territorycolor:'Fill colour', o_territorybcolor:'Border colour', h_territory:'Click to add points, 3+ points then Enter to close.', t_regionlink:'Region link', h_regionlink:'Click the map and name it: a new, blank region map is created. Double-click the pin with the Select tool to enter it; use "Back" top-left to return to the world map.', rl_newtitle:'New region map', rl_placeholder:'Region name', rl_default:'Unnamed region', rl_open:'Enter region →', bc_back:'Back', bc_world:'World map', t_resource:'Resource', o_resourcetype:'Type', rs_mine:'Mine', rs_farm:'Farmland', rs_hunting:'Hunting ground', rs_fishing:'Fishing spot', rs_trade:'Trade post', rs_quarry:'Quarry', h_resource:'Click the map to place a resource marker of the selected type.',
      o_lakecolor:'Lake colour',
      o_symbbrush:'Brush mode', o_symbdensity:'Density', o_clipland:'Clip to land (brush)',
      o_windrose:'Windrose', o_wrvis:'Show on map', o_wrsize:'Size',
      o_wrstyle_classic:'Classic', o_wrstyle_minimal:'Minimal', o_wrstyle:'Style', o_wrcolor:'Colour', h_windrose:'Drag on the map to reposition.',
      o_snap:'Snap to grid', o_snapsize:'Grid size', o_frame:'Map frame', o_frame_none:'None', o_frame_simple:'Simple line', o_frame_rope:'Rope', o_frame_ornate:'Ornate', o_frame_color:'Colour'
    },
    de: { tut_extras:'Über die Werkzeuge hinaus — automatische Generatoren', tut_extras_d:'Diese sind nicht in der Werkzeugleiste; sie erscheinen im rechten Panel, wenn du das zugehörige Werkzeug wählst.', o_measurearea:'Als Fläche schließen', tpa_undo:'Letzten Punkt zurücknehmen', tpa_finish:'Fertig', tpa_cancel:'Abbrechen',
      new:'Neu', open:'Öffnen', save:'Speichern', parchment:'Pergament', grid:'Raster', shore:'Küste',
      o_gridsec:'Raster', o_gridtype:'Typ', o_grid_square:'Quadrat', o_grid_hex:'Hexagon', o_grid_dot:'Punkt', o_gridcell:'Zellengröße', o_gridcolor:'Farbe', o_gridop:'Stärke', h_grid:'Raster über das Kästchen \'Raster\' oben ein-/ausschalten. Hexfelder sind Standard im Pen-and-Paper.',
      o_polsec:'Politische Karte', o_polmode:'Politische Ansicht', o_polmute:'Geländetextur dämpfen', o_pollegend:'Legende zeigen', o_polfill:'Füllstärke', o_polcolors:'Staatsfarben automatisch vergeben', o_polname:'Name der gewählten Region', o_polname_ph:'Staatsname', h_political:'Die politische Ansicht ist keine eigene Ebene; sie zeigt die gezeichneten Regionen als Staaten.', o_stategensec:'Staaten- & Kulturerzeugung', o_polmodesel:'Ansicht', o_polmode_state:'Staaten', o_polmode_culture:'Kulturen', o_stcount:'Anzahl der Staaten', o_stvariety:'Größenvielfalt', o_stategen_go:'👑 Staaten erzeugen', h_stategen:'Erzeugt Staatsgrenzen, die gleichzeitig von jeder Hauptstadt aus wachsen und nahtlos aneinander anliegen. Deine handgezeichneten Regionen bleiben erhalten, es wird nur ergänzt.', o_cucount:'Anzahl der Kulturen', o_culturegen_go:'🎭 Kulturen erzeugen', h_culturegen:'Erzeugt Kulturregionen, die auf einem eigenen Raster wachsen, unabhängig von Staatsgrenzen — mit der Auswahl „Ansicht" oben zwischen Staaten-/Kulturdarstellung wechseln.', o_stedit:'Ausgewählte Region', h_stedit_none:'Wähle eine Region auf der Karte oder im Reiter „Regionen" rechts, um sie zu bearbeiten.', o_stgov:'Regierungsform', o_stcapital:'Hauptstadt', o_stcapital_pick:'Hauptstadt auf der Karte wählen', o_stcapital_cancel:'Hauptstadtwahl abbrechen', o_stmake:'In Staat umwandeln', o_stunmake:'Staatsstatus entfernen', o_stemblem:'Wappen', o_stemblem_gen:'Wappen erzeugen', o_stemblem_reroll:'Neu erzeugen', o_stemblem_png:'PNG herunterladen', o_stemblem_clear:'Wappen entfernen', h_stemblem:'Das Wappen wird im Code gezeichnet; der Startwert wird mit dem Staat gespeichert, derselbe Startwert ergibt immer dasselbe Wappen. In der politischen Ansicht neben der Hauptstadt sichtbar.', o_polemblem:'Wappen anzeigen', m_emblem:'Wappen erzeugt', h_stedit:'Wird eine handgezeichnete Region in einen Staat umgewandelt, erhält sie Namen, Regierungsform und Hauptstadt; sie wird dann wie ein erzeugter Staat aufgelistet und eingefärbt.', m_stmade:'Region in einen Staat umgewandelt', m_stunmade:'Region ist kein Staat mehr', m_capitalpick:'Klicke die Position der Hauptstadt auf der Karte an (Esc zum Abbrechen)', st_capital_sea:'Die Hauptstadt muss an Land liegen.', st_capital_set:'Hauptstadt verschoben', o_provcount:'Provinzen pro Staat', o_provgen_go:'Provinzen erzeugen', h_provgen:'Teilt die Grenzen jedes Staates in Unterregionen; eine Provinzgrenze überschreitet nie die Grenze ihres Staates.', m_provgen:'Provinzen erzeugt', prov_nostate:'Erzeuge zuerst Staaten — Provinzen sind Unterteilungen von Staaten.', prov_none:'Provinzen konnten nicht erzeugt werden (Staaten zu klein).', o_diplosec:'Diplomatie', h_diplo_none:'Für Beziehungen werden mindestens zwei Staaten benötigt.', o_diplo_a:'Staat A', o_diplo_b:'Staat B', o_diplo_rel:'Beziehung', rel_peace:'Frieden', rel_alliance:'Bündnis', rel_war:'Krieg', rel_vassal:'Vasallität', diplo_same:'Ein Staat kann keine Beziehung zu sich selbst haben.', o_polmode_religion:'Religionen', o_recount:'Anzahl der Religionen', o_religiongen_go:'Religionen erzeugen', m_religiongen:'Religionsgebiete erzeugt', o_citysec:'Stadterzeugung', h_city_nosel:'Wähle zuerst eine Region — die Stadt entsteht innerhalb ihrer Grenzen.', o_citydistrict:'Viertelstyp', o_citybuildings:'Anzahl der Gebäude', o_citystreet:'Straßenbreite', o_citywall:'Mauern und Tore hinzufügen', o_citygen_go:'Stadt erzeugen', h_citygen:'Teilt die gewählte Region mit Hauptstraßen und Gassen in Blöcke, die Blöcke in Parzellen, und setzt auf jede Parzelle ein zum Viertelstyp passendes Gebäude, dessen Front zur nächsten Straße zeigt. In einem Schritt rückgängig.', m_citygen:'Gebäude platziert', city_noarea:'Wähle zuerst eine Region, in die die Stadt passt.', city_small:'Die gewählte Region ist zu klein für eine Stadt.', dist_craftsmen:'Handwerker', dist_market:'Markt', dist_noble:'Adel', dist_slum:'Armenviertel', dist_temple:'Tempel', dist_harbour:'Hafen', accent_t:'Akzentfarbe der Oberfläche (Rechtsklick: zurücksetzen)', o_speak:'Namen vorlesen', url_generated:'Karte aus dem Seed im Link erzeugt', url_badtemplate:'Die Vorlage im Link ist ungültig.', exp_gis_t:'Vektordaten als GeoJSON exportieren (QGIS usw.)', gis_done:'Objekte als GeoJSON exportiert', gis_empty:'Keine Vektorobjekte zum Exportieren.', m_stategen:'Staaten erzeugt', m_culturegen:'Kulturregionen erzeugt', stategen_noland:'Nicht genug Land, um Staaten zu erzeugen.', stategen_none:'Staaten/Kulturen konnten nicht erzeugt werden.', gov_kingdom:'Königreich', gov_empire:'Kaiserreich', gov_theocracy:'Theokratie', gov_republic:'Republik', gov_confederation:'Konföderation', gov_citystate:'Stadtstaat', m_polon:'Politische Ansicht an', m_poloff:'Physische Ansicht', m_polcolored:'Regionen eingefärbt', m_polempty:'Zuerst eine Region zeichnen',
      o_nameculture:'Kultur', o_namefeature:'Typ', o_namegen:'🎲 Namen vorschlagen', o_nf_settlement:'Siedlung', o_nf_city:'Stadt', o_nf_river:'Fluss', o_nf_mountain:'Berg', o_nf_forest:'Wald', o_nf_region:'Region', o_nf_lake:'See', o_nf_sea:'Meer',
      tpl_title:'Mit einer Vorlage beginnen', tpl_desc:'Starte mit einer fertigen Küstenlinie und baue deine Welt darauf auf.', tpl_ready:'Leinwand bereit',
      tpl_continent:'Kontinent', tpl_continent_d:'Weite Landmasse mit zerklüfteten Küsten', tpl_island:'Insel', tpl_island_d:'Eine große Insel im offenen Meer', tpl_archipelago:'Archipel', tpl_archipelago_d:'Verstreute Inseln und flache Meerengen', tpl_kingdom:'Königreich', tpl_kingdom_d:'Sanfte Küsten, fruchtbares Hinterland', tpl_battle:'Schlachtkarte', tpl_battle_d:'Kleines Gelände mit Hexfeld-Raster', tpl_blank:'Leere Leinwand', tpl_blank_d:'Ganz von vorn anfangen',
      o_outlinecolor:'Konturfarbe',
      exp_html_t:'Einzeldatei-HTML', exp_print_t:'Drucken / PDF', exp_png2_t:'2× Auflösung', exp_png4_t:'4× Auflösung', exp_maxdim:'Längste Kante', exp_format:'Format', exp_fmt_png:'PNG · scharf, große Datei', exp_fmt_jpeg:'JPEG · kleine Datei', exp_title:'Titel', exp_html_help:'Lädt eine einzelne .html-Datei mit der Karte und einem kleinen Betrachter darin herunter. Kein Server nötig — Datei verschicken und doppelklicken.', exp_page:'Seitenformat', exp_orient:'Ausrichtung', exp_portrait:'Hochformat', exp_landscape:'Querformat', exp_margin:'Rand', exp_dpi:'Auflösung', exp_dpi_screen:'Bildschirm', exp_dpi_normal:'normaler Druck', exp_dpi_high:'hohe Qualität', exp_print_help:'Öffnet den Druckdialog des Browsers. Dort kannst du drucken oder „Als PDF speichern“ wählen.', printing:'Druck wird vorbereitet', print_failed:'Druckdialog konnte nicht geöffnet werden', viewer_hint:'ziehen · Rad · Doppelklick', viewer_in:'Vergrößern', viewer_out:'Verkleinern', viewer_fit:'Einpassen',
      t_sketch:'Skizze', o_sketch:'Skizze', h_sketch:'Ein Freihandpinsel, der nur auf selbst hinzugefügten Ebenen zeichnet. Füge im Ebenenpanel mit „+ Ebene hinzufügen“ eine hinzu, wähle sie in der Liste und zeichne dann auf der Karte.', o_hardness:'Härte', o_sketch_eraser:'Radiermodus', sketch_target:'Zielebene', sketch_need_layer:'Füge zuerst eine eigene Ebene hinzu und wähle sie in der Liste', layer_add:'+ Ebene hinzufügen', h_add_layer:'Selbst hinzugefügte Ebenen dienen dem freien Zeichnen; male mit dem Werkzeug „Skizze“ darauf.', layer_added:'Ebene hinzugefügt', layer_untitled:'Ebene', layer_max:'Höchstens 12 eigene Ebenen möglich', layer_rename:'Ebenenname', layer_rename_hint:'Zum Umbenennen doppelklicken', layer_delete:'Ebene löschen', layer_delete_confirm:'Diese Ebene und alles darauf Gezeichnete löschen?', tut_h_sketch:'Zeichnet freihändig auf selbst hinzugefügten Ebenen; Farbe, Größe, Härte, Deckkraft und ein Radiermodus sind einstellbar.',
      o_typography:'Typografie', o_font:'Schriftart', o_banner:'Banner', o_banner_none:'Keins', o_banner_ribbon:'Band', o_banner_plate:'Tafel', o_banner_scroll:'Schriftrolle', o_banner_stone:'Stein', o_caps:'Großbuchstaben', o_outline:'Kontur', o_shadow:'Schatten', h_font_missing:'Diese Schriftart ist auf diesem Gerät nicht installiert; die nächstbeste wird verwendet. Mit · markierte Einträge sind installiert.',
      grp_navigate:'Navigation', grp_terrain:'Gelände', grp_water:'Wasser & Wege', grp_markers:'Marker', grp_regions:'Regionen & Maß',
      t_select:'Auswahl', t_landmass:'Land', t_erase:'Meer', t_fill:'Füllen', t_terrain:'Gelände', t_symbol:'Symbol',
      t_river:'Fluss', t_road:'Straße', t_label:'Beschriftung', t_pan:'Verschieben', t_eyedrop:'Pipette', t_measure:'Messen', h_measure:'Klicken, um Punkte hinzuzufügen und eine mehrteilige Entfernung zu messen. Enter / Doppelklick zum Abschließen, Esc zum Abbrechen. Messlinien können ausgewählt, verschoben oder gelöscht werden; sie sind vom PNG/SVG-Export ausgeschlossen.', t_lasso:'Lasso', h_lasso:'Ziehen, um einen geschlossenen Bereich zu zeichnen: Land + Gelände + Höhenrelief werden darin gemeinsam angehoben und verschiebbar. Ziehen zum Verschieben, oberer Griff zum Drehen. Enter bestätigt, Escape bricht ab, Entf löscht den Bereich vollständig.',
      o_landmass:'Land / Küste', o_brushsize:'Pinselgröße', o_rough:'Küstenrauheit',
      o_landcolor:'Landfarbe', o_shorew:'Küstenbreite', o_shorestyle:'Küstenstil', o_shore_sandy:'Sandig', o_shore_rocky:'Felsig', o_shore_reef:'Riff',
      o_smooth:'Küste glätten', o_clearland:'Land löschen',
      h_landmass:'Ziehen, um Land zu malen. Das Werkzeug "Meer" löscht Land und Gelände gleichzeitig.', o_landgen:'Zufälliges Land erzeugen', o_landgentpl:'Vorlage', o_landgen_continent:'Kontinent', o_landgen_island:'Insel', o_landgen_archipelago:'Archipel', o_landgenrough:'Detail / Rauheit', o_landgen_go:'Erzeugen', h_landgen:'Ersetzt die aktuelle Landebene. Erneut klicken mit denselben Einstellungen ergibt ein neues Zufallsergebnis.',
      o_terrain:'Gelände malen', o_opacity:'Deckkraft', o_clip:'Nur auf Land malen',
      o_clearterrain:'Geländeebene löschen',
      h_terrain:'Muster werden bei jedem Pinselstrich zufällig gestreut — kein wiederholtes Muster.', t_elevation:'Höhe', o_elevation:'Höhenrelief', o_elevstrength:'Stärke', o_elevlower:'Absenkmodus', o_clearelevation:'Höhendaten löschen', o_elevdisplay:'Anzeige', o_elevhillshade:'Schummerung (Hillshade)', o_elevcontours:'Höhenlinien', o_contourinterval:'Höhenlinienabstand', h_elevation:'Ziehen zum Anheben; bei aktivem "Absenkmodus" wird das Gelände vertieft. Die Schummerung aktualisiert sich automatisch.',
      o_symbol:'Symbol', o_size:'Größe', o_rot:'Drehung', o_hue:'Farbton',
      o_wear:'Abnutzung', o_jitter:'Zufällige Platzierung',
      h_symbol:'Symbol aus der Bibliothek wählen, auf die Karte klicken. Mit "Auswahl" verschieben; Entf zum Löschen.',
      o_river:'Fluss', o_width:'Breite', o_meander:'Mäander',
      o_taper:'An der Quelle verjüngen', o_color:'Farbe',
      h_path:'Klicken, um Punkte hinzuzufügen. Enter/Doppelklick zum Beenden, Esc zum Abbrechen.',
      o_road:'Straße / Karawanenroute',
      o_label:'Beschriftung', o_preset:'Stilvorlage', o_curve:'Krümmung', o_track:'Zeichenabstand', o_snappath:'An Pfad ausrichten (Fluss/Straße)',
      h_label:'Vorlage wählen, Text eingeben, auf die Karte klicken. Wirkt sofort bei ausgewählter Beschriftung.',
      o_eyedrop:'Texturpipette', o_eye_nosample:'Noch keine Probe entnommen',
      o_eye_radius:'Probenradius', o_eye_brush:'Pinselgröße',
      o_eye_pick:'① Bereich wählen', o_eye_paint:'② Malen starten', o_eye_clear:'Probe löschen',
      h_eyedrop:'① Bereich wählen: Kreis aufziehen. ② Malen: Textur auf die Karte auftragen.',
      eyeOk:'✓ Textur entnommen', eyeFail:'Entnahme fehlgeschlagen — über Land/Gelände versuchen.',
      eyePick:'Auf der Karte klicken und ziehen → Kreisgröße wählen → loslassen.',
      eyePaint:'Auf der Karte klicken und ziehen → Textur wird aufgetragen.',
      eyeNeed:'Zuerst mit ① Bereich wählen eine Textur entnehmen.',
      o_selection:'Auswahl', o_nosel:'Nichts ausgewählt', o_dup:'Duplizieren', o_del:'Löschen',
      o_scalebar:'Maßstabsleiste', o_scvis:'Auf der Karte anzeigen', o_sclen:'Länge',
      o_scsize:'Textgröße', o_scsegs:'Segmente',
      h_scale:'Maßstabsleiste auf der Karte ziehen, um sie zu verschieben.',
      o_view:'Ansicht', o_fit:'An Fenster anpassen', o_100:'100 %',
      h_pan:'Rechtsklick + ziehen, Mittelklick, Leertaste + ziehen oder Pfeiltasten zum Verschieben.',
      tab_layers:'Ebenen', tab_library:'Bibliothek', tab_history:'Verlauf',
      ref_title:'Referenzbild', ref_export:'In Export einschließen', ref_clear:'Referenz entfernen', ref_trace:'Nachzeichenmodus (oben anzeigen + Küstenlinie einrasten)', ref_scan:'⌖ Geografie scannen', h_ref_scan:'Extrahiert Küstenlinie, Seen und Flüsse aus dem Referenzbild. Kartensymbole wie Städte und Berge fließen nicht in die Geografie ein — das Gelände darunter läuft ununterbrochen weiter. Ersetzt das vorhandene Land.', scan_title:'Karte wird gescannt', scan_cancel:'Abbrechen', scan_prepare:'Bild wird vorbereitet', scan_markers:'Kartensymbole werden aussortiert', scan_clean:'Gelände unter den Symbolen wird ergänzt', scan_coast:'Küstenlinie wird extrahiert', scan_water:'Flüsse und Seen werden getrennt', scan_commit:'Wird in Ebenen geschrieben', scan_noimage:'Lade zuerst ein Referenzbild.', scan_flat:'Im Bild wurden keine zwei unterscheidbaren Farbbereiche gefunden — Land und Meer lassen sich nicht trennen.', scan_noland:'Im Bild wurde kein Land gefunden.', scan_failed:'Der Scan konnte nicht abgeschlossen werden.', scan_done:'Scan fertig — {r} Flüsse, {l} Seen; {m} Kartensymbole ausgespart.', layer_drag_hint:'Zum Verschieben der Ebene hier ziehen', blend_sourceover:'Normal', blend_multiply:'Multiplizieren', blend_overlay:'Überlagern', blend_softlight:'Weiches Licht', blend_screen:'Negativ multiplizieren', nav_home:'Startseite', nav_canvas:'Leinwand', nav_tutorial:'Anleitung', nav_community:'Community', home_tagline:'Ein browserbasierter Karteneditor für Fantasiewelten', home_desc:'Zeichne Land- und Meeresgrenzen, male Wälder und Berge, platziere Burgen und Dörfer, lege Flüsse und Straßen an — alles auf einer Leinwand, im Browser, ohne Installation.', home_cta:'Karte starten', home_video_caption:'Vorstellungsvideo folgt bald', canvas_new_title:'Neue Leinwand erstellen', canvas_custom:'Benutzerdefiniert…', canvas_name_ph:'Kartenname', canvas_create:'Erstellen', canvas_import:'Aus .json-Datei importieren', canvas_saved_title:'Gespeicherte Leinwände', canvas_empty:'In diesem Browser sind noch keine Leinwände gespeichert. Sie erscheinen hier automatisch, sobald du im Editor auf "Speichern" klickst.', canvas_open:'Öffnen', canvas_delete:'Löschen', canvas_delete_confirm:'Diese Leinwand löschen? Das kann nicht rückgängig gemacht werden.', canvas_unnamed:'Unbenannte Karte', tutorial_title:'Anleitung', tutorial_intro:'Jedes Werkzeug in der linken Werkzeugleiste öffnet seine eigenen Einstellungen im rechten Panel. Unten eine kurze Übersicht, was jedes Werkzeug macht.', community_title:'Community', community_desc:'Wayborne Map Editor ist ein quelloffenes, stetig weiterentwickeltes Projekt.', community_github_desc:'Quellcode, Fehlermeldungen und Beiträge', community_soon:'Demnächst', lib_full:'Der Browserspeicher ist voll — lösche eine alte Leinwand oder exportiere sie als .json.', tut_h_select:'Objekte auswählen, verschieben, drehen; Shift-Klick für Mehrfachauswahl.', tut_h_erase:'Löscht bemaltes Land und die darüberliegende Geländetextur in einem Schritt.', tut_h_fill:'Füllt das Innere eines geschlossenen Küstenumrisses mit einem Klick.', tut_h_river:'Klicken, um Punkte hinzuzufügen und einen Fluss zu zeichnen; Enter zum Beenden.', tut_h_road:'Klicken, um Punkte hinzuzufügen und eine Straße zu zeichnen; Enter zum Beenden.',
      sym_upload:'+ PNG-Symbol hochladen', sym_upload_done:'Symbol(e) geladen', sym_del:'Löschen', sym_search:'Symbole durchsuchen...', sym_recent:'Zuletzt verwendet',
      st_pos:'Position', st_zoom:'Zoom', st_size:'Leinwand', st_tool:'Werkzeug',
      cancel:'Abbrechen', ok:'OK',
      locked:'Ebene ist gesperrt oder ausgeblendet.', needtext:'Zuerst den Beschriftungstext eingeben.', nopathnear:'In der Nähe kein Fluss/keine Straße gefunden.', fill_toolarge:'Fläche zu groß — innerhalb einer geschlossenen Grenze versuchen.',
      exported:'Exportiert:', saved:'Projekt gespeichert.', loaded:'Projekt geladen.',
      badfile:'Ungültige Projektdatei.', newmap:'Neue Karte erstellt.',
      confirmNew:'Die aktuelle Karte wird verworfen. Leinwandgröße wählen:',
      confirmSize:'Das Ändern der Leinwandgröße skaliert vorhandene Ebenen. Fortfahren?',
      histStart:'Anfang', selNone:'Nichts ausgewählt', symbols:'Symbole',
      selScale:'Maßstabsleiste ausgewählt', o_front:'In den Vordergrund', o_back:'In den Hintergrund',
      o_fwd:'Eine Ebene vor', o_bwd:'Eine Ebene zurück',
      o_group:'Gruppieren', o_ungroup:'Gruppierung aufheben',
      selMulti:'Objekte ausgewählt',
      t_lake:'See', o_lake:'See', h_lake:'Klicken, um Punkte hinzuzufügen, ab 3 Punkten mit Enter schließen.', t_territory:'Gebiet', o_territory:'Gebiet', o_territorycolor:'Füllfarbe', o_territorybcolor:'Randfarbe', h_territory:'Klicken, um Punkte hinzuzufügen, ab 3 Punkten mit Enter schließen.', t_regionlink:'Regionsverknüpfung', h_regionlink:'Auf die Karte klicken und benennen: Es wird eine neue, leere Regionskarte erstellt. Mit dem Auswahlwerkzeug per Doppelklick auf die Nadel diese Region betreten; oben links mit "Zurück" zur Weltkarte zurückkehren.', rl_newtitle:'Neue Regionskarte', rl_placeholder:'Regionsname', rl_default:'Unbenannte Region', rl_open:'Region betreten →', bc_back:'Zurück', bc_world:'Weltkarte', t_resource:'Ressource', o_resourcetype:'Typ', rs_mine:'Mine', rs_farm:'Ackerland', rs_hunting:'Jagdgrund', rs_fishing:'Fischgrund', rs_trade:'Handelsposten', rs_quarry:'Steinbruch', h_resource:'Auf die Karte klicken, um eine Ressourcenmarkierung des gewählten Typs zu platzieren.',
      o_lakecolor:'Seefarbe',
      o_symbbrush:'Pinselmodus', o_symbdensity:'Dichte', o_clipland:'An Land klemmen (Pinsel)',
      o_windrose:'Windrose', o_wrvis:'Auf der Karte anzeigen', o_wrsize:'Größe',
      o_wrstyle_classic:'Klassisch', o_wrstyle_minimal:'Schlicht', o_wrstyle:'Stil', o_wrcolor:'Farbe', h_windrose:'Auf der Karte ziehen, um sie zu verschieben.',
      o_snap:'Am Raster ausrichten', o_snapsize:'Rastergröße', o_frame:'Kartenrahmen', o_frame_none:'Kein', o_frame_simple:'Einfache Linie', o_frame_rope:'Seil', o_frame_ornate:'Verziert', o_frame_color:'Farbe',
      biomegen_empty:'Zuerst Land zeichnen.', o_zonetype:'Zonentyp', o_zone_none:'— keiner (politische Region) —', o_zone_war:'Kriegsgebiet', o_zone_anomaly:'Anomalie', o_zone_forbidden:'Sperrgebiet', o_zone_hunting:'Jagdrevier', o_zone_quarantine:'Quarantäne', o_zone_sacred:'Heiliger Bezirk', o_zone_trade:'Handelszone', h_zonetype:'Eine Region mit einem Typ gehört zu keiner der Ansichten Staat/Kultur/Religion; sie wird in jeder Ansicht mit ihrer eigenen Schraffur gezeichnet.', o_note:'Notiz', o_note_ph:'Deine Notiz zu diesem Objekt…', o_note_show:'Notizmarken auf der Karte anzeigen', o_nb_edit:'Eigene Kultur hinzufügen', o_nb_name:'Name der Kultur', o_nb_bas:'Anfangssilben: Ash, Bram, Dun', o_nb_orta:'Mittellaute: a, e, i', o_nb_son:'Endsilben: ford, dale, ton', o_nb_birlesik:'Zusammengesetzt (Ashford) — aus heißt fließend (Valeria)', o_nb_add:'Hinzufügen', o_nb_del:'Ausgewählte Kultur löschen', h_nb:'Eine von dir hinzugefügte Kultur gehört zu diesem Projekt, wird mit der Projektdatei gespeichert und kann auch vom Kultur-/Religionsgenerator genutzt werden.', nb_needname:'Gib zuerst einen Namen für die Kultur ein.', nb_needsyl:'Anfangs- und Endsilben dürfen nicht leer sein.', nb_builtin:'Eingebaute Kulturen können nicht gelöscht werden.', m_nbadded:'Kultur hinzugefügt', m_nbdeleted:'Kultur gelöscht', o_lgsave:'Als Vorlage speichern', o_lgdel:'Vorlage löschen', o_lgsave_ask:'Name für diese Vorlage:', o_lgsave_def:'Meine Vorlage', m_lgsaved:'Vorlage gespeichert', h_lgpreset:'Eine gespeicherte Vorlage hält die aktuelle Rauheit und die Fluss-/See-/Gelände-Auswahl unter einem Namen fest und fügt sie der Liste oben hinzu; sie wandert mit der Projektdatei mit.', o_climate:'Klima', o_climate_on:'Klimamodell verwenden', o_climate_eq:'Position des Äquators', o_climate_str:'Stärke des Regenschattens', o_climate_wind:'Windpfeile anzeigen', h_climate:'Verschiebe den Äquator aus der Mitte der Leinwand, um Karten einer einzelnen Hemisphäre oder Polarkarten zu erstellen. Der Wind trocknet die Zellen hinter den Bergen aus (Regenschatten) und befeuchtet die davor — der nächste Lauf von „Biome zuweisen“ berücksichtigt das.', copied:'Kopiert', copy:'Kopieren', exp_share_embedcode:'Einbettungscode (iframe)', exp_share_gen:'🔗 Link erzeugen', exp_share_help:'Kein Server — das Kartenbild wird direkt im Link eingebettet (im #-Teil der URL). Der Link wird nirgendwo hochgeladen, außer Sie senden ihn selbst; bei großen Karten wird der Link länger.', exp_share_link:'Link', exp_share_sizehint:'Linklänge ≈ {kb} KB', exp_share_t:'Freigabelink', h_biomegen:'Füllt die Geländeebene automatisch anhand von Höhe und Breitengrad; ersetzt die aktuelle Geländeebene.', h_rivergen:'Fügt Flüsse hinzu, die anhand des Höhenrasters ins Meer fließen. Erfordert mit dem Werkzeug „Höhe“ gemalte Berge/Hügel.', h_roadgen:'Zeichnet Straßen zwischen Siedlungssymbolen (Stadt/Ort/Dorf/Burg/Hafen) und meidet steile Hänge. Verbindet ein paar zufällige Landpunkte, falls keine Siedlungen vorhanden sind.', h_settlegen:'Verteilt Stadt-/Ort-/Dorfsymbole auf flachem Land nahe der Küste — der beste Platz erhält eine Burg/einen Hafen, der Rest Städte/Dörfer. „Straßen erzeugen“ findet diese Symbole und verbindet sie. Jede Siedlung erhält ihren Namen aus dem Silbenvorrat der Kulturregion, in der sie liegt.', o_settle_labels:'Namen auch als Beschriftungen schreiben', lakegen_none:'Kein geeigneter Seeplatz gefunden.', o_biomegen:'Biome automatisch zuweisen', o_biomegen_go:'🌍 Biome zuweisen', o_landgen_lakes:'Seen hinzufügen', o_landgen_rivers:'Flüsse hinzufügen', o_landgen_terrain:'Gelände hinzufügen', o_rivergen:'Flüsse automatisch erzeugen', o_rivergen_go:'💧 Flüsse erzeugen', o_roadgen:'Straßen automatisch erzeugen', o_roadgen_go:'🛤️ Straßen erzeugen', o_seacolor:'Meeresfarbe', o_settlegen:'Siedlungen automatisch platzieren', o_settlegen_go:'🏰 Siedlungen platzieren', o_symlegend:'Legende', panel_toggle_left:'Linkes Panel ein-/ausblenden', panel_toggle_right:'Rechtes Panel ein-/ausblenden', regions_maptree:'Kartenbaum', regions_political:'Politische Regionen', regions_political_empty:'Noch keine benannten Regionen. Mit dem Werkzeug „Gebiet“ zeichnen und dann benennen.', rivergen_noelev:'Zuerst mit dem Werkzeug „Höhe“ Berge/Hügel malen.', rivergen_none:'Keine geeignete Flussquelle gefunden.', roadgen_noland:'Nicht genug Land/Punkte für Straßen gefunden.', roadgen_none:'Es konnten keine Straßen erzeugt werden — Landmassen sind möglicherweise nicht verbunden.', sc_cancel:'Abbrechen / Auswahl aufheben', sc_delete:'Auswahl löschen', sc_finish:'Pfad abschließen', sc_fit:'An Fenster anpassen', sc_general:'Allgemein', sc_help:'Diesen Bildschirm öffnen', sc_pan:'Verschieben', sc_panfast:'Schneller verschieben', sc_redo:'Wiederholen', sc_rotsym:'Symbol drehen', sc_save:'Speichern', sc_title:'Tastenkürzel', sc_undo:'Rückgängig', sc_zoom:'Vergrößern / verkleinern', settlegen_noland:'Kein geeignetes Land für Siedlungen gefunden.', settlegen_none:'Es konnten keine Siedlungen platziert werden.', share_editbtn:'In Wayborne öffnen', tab_regions:'Regionen', tab_todo:'Aufgaben', todo_add:'Hinzufügen', todo_empty:'Noch keine Aufgaben.', todo_placeholder:'Neue Aufgabe...'
    },
    fr: { tut_extras:'Au-delà des outils — générateurs automatiques', tut_extras_d:'Ceux-ci ne sont pas dans la barre d\'outils ; ils apparaissent dans le panneau de droite lorsque vous choisissez l\'outil correspondant.', o_measurearea:'Fermer en surface', tpa_undo:'Annuler le dernier point', tpa_finish:'Terminer', tpa_cancel:'Annuler',
      new:'Nouveau', open:'Ouvrir', save:'Enregistrer', parchment:'Parchemin', grid:'Grille', shore:'Rivage',
      o_gridsec:'Grille', o_gridtype:'Type', o_grid_square:'Carré', o_grid_hex:'Hexagone', o_grid_dot:'Point', o_gridcell:'Taille de cellule', o_gridcolor:'Couleur', o_gridop:'Intensité', h_grid:'Activez la grille via la case \'Grille\' en haut. L\'hexagone est le standard du jeu de rôle sur table.',
      o_polsec:'Carte politique', o_polmode:'Vue politique', o_polmute:'Atténuer la texture du terrain', o_pollegend:'Afficher la légende', o_polfill:'Intensité du remplissage', o_polcolors:'Attribuer les couleurs d\'État', o_polname:'Nom de la région sélectionnée', o_polname_ph:'Nom de l\'État', h_political:'La vue politique n\'est pas un calque distinct ; elle présente vos régions comme des États.', o_stategensec:'Génération d\'États et de cultures', o_polmodesel:'Vue', o_polmode_state:'États', o_polmode_culture:'Cultures', o_stcount:'Nombre d\'États', o_stvariety:'Variété de taille', o_stategen_go:'👑 Générer les États', h_stategen:'Génère des frontières d\'États qui grandissent simultanément depuis chaque capitale et s\'ajustent parfaitement les unes aux autres. Conserve vos régions dessinées à la main, s\'y ajoute.', o_cucount:'Nombre de cultures', o_culturegen_go:'🎭 Générer les cultures', h_culturegen:'Génère des régions culturelles qui grandissent sur leur propre grille, indépendamment des frontières d\'États — basculez entre la présentation États/cultures avec le sélecteur « Vue » ci-dessus.', o_stedit:'Région sélectionnée', h_stedit_none:'Sélectionnez une région sur la carte ou dans l\'onglet « Régions » à droite pour la modifier.', o_stgov:'Forme de gouvernement', o_stcapital:'Capitale', o_stcapital_pick:'Choisir la capitale sur la carte', o_stcapital_cancel:'Annuler le choix de la capitale', o_stmake:'Convertir en État', o_stunmake:'Retirer le statut d\'État', o_stemblem:'Blason', o_stemblem_gen:'Générer un blason', o_stemblem_reroll:'Régénérer', o_stemblem_png:'Télécharger le PNG', o_stemblem_clear:'Retirer le blason', h_stemblem:'Le blason est dessiné par le code ; sa graine est enregistrée avec l’État, la même graine donne toujours le même blason. Affiché près de la capitale en vue politique.', o_polemblem:'Afficher les blasons', m_emblem:'Blason généré', h_stedit:'Convertir une région dessinée à la main en État lui donne un nom, une forme de gouvernement et une capitale ; elle est ensuite listée et colorée comme un État généré.', m_stmade:'Région convertie en État', m_stunmade:'La région n\'est plus un État', m_capitalpick:'Cliquez sur l\'emplacement de la capitale sur la carte (Échap pour annuler)', st_capital_sea:'La capitale doit être sur la terre ferme.', st_capital_set:'Capitale déplacée', o_provcount:'Provinces par État', o_provgen_go:'Générer les provinces', h_provgen:'Découpe les frontières de chaque État en sous-régions ; une frontière de province ne dépasse jamais celle de son État.', m_provgen:'provinces générées', prov_nostate:'Générez d\'abord des États — les provinces en sont des subdivisions.', prov_none:'Impossible de générer des provinces (États trop petits).', o_diplosec:'Diplomatie', h_diplo_none:'Au moins deux États sont nécessaires pour définir des relations.', o_diplo_a:'État A', o_diplo_b:'État B', o_diplo_rel:'Relation', rel_peace:'Paix', rel_alliance:'Alliance', rel_war:'Guerre', rel_vassal:'Vassalité', diplo_same:'Un État ne peut avoir de relation avec lui-même.', o_polmode_religion:'Religions', o_recount:'Nombre de religions', o_religiongen_go:'Générer les religions', m_religiongen:'régions religieuses générées', o_citysec:'Génération de ville', h_city_nosel:'Sélectionnez d\'abord une région : la ville est générée à l\'intérieur de ses limites.', o_citydistrict:'Type de quartier', o_citybuildings:'Nombre de bâtiments', o_citystreet:'Largeur des rues', o_citywall:'Ajouter remparts et portes', o_citygen_go:'Générer la ville', h_citygen:'Découpe la région choisie en îlots par des avenues et des ruelles, puis les îlots en parcelles, et pose sur chaque parcelle un bâtiment adapté au type de quartier, façade tournée vers la rue la plus proche. Annulé en une seule étape.', m_citygen:'bâtiments placés', city_noarea:'Sélectionnez d\'abord une région pouvant accueillir la ville.', city_small:'La région sélectionnée est trop petite pour une ville.', dist_craftsmen:'Artisans', dist_market:'Marché', dist_noble:'Noble', dist_slum:'Quartier pauvre', dist_temple:'Temple', dist_harbour:'Port', accent_t:'Couleur d\'accent de l\'interface (clic droit : réinitialiser)', o_speak:'Lire le nom à voix haute', url_generated:'Carte générée à partir de la graine du lien', url_badtemplate:'Le modèle indiqué dans le lien n\'est pas valide.', exp_gis_t:'Exporter les données vectorielles en GeoJSON (QGIS, etc.)', gis_done:'objets exportés en GeoJSON', gis_empty:'Aucun objet vectoriel à exporter.', m_stategen:'États générés', m_culturegen:'régions culturelles générées', stategen_noland:'Pas assez de terre pour générer des États.', stategen_none:'Impossible de générer des États/cultures.', gov_kingdom:'Royaume', gov_empire:'Empire', gov_theocracy:'Théocratie', gov_republic:'République', gov_confederation:'Confédération', gov_citystate:'Cité-État', m_polon:'Vue politique activée', m_poloff:'Vue physique', m_polcolored:'régions colorées', m_polempty:'Dessinez d\'abord une région',
      o_nameculture:'Culture', o_namefeature:'Type', o_namegen:'🎲 Proposer un nom', o_nf_settlement:'Village', o_nf_city:'Ville', o_nf_river:'Rivière', o_nf_mountain:'Montagne', o_nf_forest:'Forêt', o_nf_region:'Région', o_nf_lake:'Lac', o_nf_sea:'Mer',
      tpl_title:'Partir d’un modèle', tpl_desc:'Commence avec un littoral tout prêt, puis bâtis ton monde par-dessus.', tpl_ready:'toile prête',
      tpl_continent:'Continent', tpl_continent_d:'Vaste masse terrestre aux côtes découpées', tpl_island:'Île', tpl_island_d:'Une grande île en pleine mer', tpl_archipelago:'Archipel', tpl_archipelago_d:'Îles éparses et détroits peu profonds', tpl_kingdom:'Royaume', tpl_kingdom_d:'Côtes douces, terres cultivables', tpl_battle:'Carte de bataille', tpl_battle_d:'Petit terrain avec grille hexagonale', tpl_blank:'Toile vierge', tpl_blank_d:'Tout créer depuis zéro',
      o_outlinecolor:'Couleur du contour',
      exp_html_t:'HTML en un seul fichier', exp_print_t:'Imprimer / PDF', exp_png2_t:'Résolution 2×', exp_png4_t:'Résolution 4×', exp_maxdim:'Plus grand côté', exp_format:'Format', exp_fmt_png:'PNG · net, fichier lourd', exp_fmt_jpeg:'JPEG · fichier léger', exp_title:'Titre', exp_html_help:'Télécharge un seul fichier .html contenant la carte et une petite visionneuse. Aucun serveur requis — envoyez le fichier et double-cliquez.', exp_page:'Format de page', exp_orient:'Orientation', exp_portrait:'Portrait', exp_landscape:'Paysage', exp_margin:'Marge', exp_dpi:'Résolution', exp_dpi_screen:'écran', exp_dpi_normal:'impression normale', exp_dpi_high:'haute qualité', exp_print_help:'Ouvre la fenêtre d’impression du navigateur. Vous pouvez y imprimer ou choisir « Enregistrer au format PDF ».', printing:'Préparation de l’impression', print_failed:'Impossible d’ouvrir la fenêtre d’impression', viewer_hint:'glisser · molette · double-clic', viewer_in:'Zoom avant', viewer_out:'Zoom arrière', viewer_fit:'Ajuster',
      t_sketch:'Croquis', o_sketch:'Croquis', h_sketch:'Un pinceau à main levée qui ne dessine que sur les calques que vous ajoutez vous-même. Ajoutez-en un avec « + Ajouter un calque » dans le panneau des calques, sélectionnez-le dans la liste, puis dessinez sur la carte.', o_hardness:'Dureté', o_sketch_eraser:'Mode gomme', sketch_target:'Calque cible', sketch_need_layer:'Ajoutez d’abord votre propre calque, puis sélectionnez-le dans la liste', layer_add:'+ Ajouter un calque', h_add_layer:'Les calques que vous ajoutez servent au dessin libre ; peignez dessus avec l’outil « Croquis ».', layer_added:'Calque ajouté', layer_untitled:'Calque', layer_max:'12 calques utilisateur au maximum', layer_rename:'Nom du calque', layer_rename_hint:'Double-cliquez pour renommer', layer_delete:'Supprimer le calque', layer_delete_confirm:'Supprimer ce calque et tout ce qui y est dessiné ?', tut_h_sketch:'Dessine à main levée sur les calques que vous ajoutez ; couleur, taille, dureté, opacité et mode gomme réglables.',
      o_typography:'Typographie', o_font:'Police', o_banner:'Bannière', o_banner_none:'Aucune', o_banner_ribbon:'Ruban', o_banner_plate:'Plaque', o_banner_scroll:'Parchemin', o_banner_stone:'Pierre', o_caps:'Majuscules', o_outline:'Contour', o_shadow:'Ombre', h_font_missing:'Cette police n’est pas installée sur cet appareil ; la plus proche est utilisée. Les entrées marquées · sont installées.',
      grp_navigate:'Navigation', grp_terrain:'Terrain', grp_water:'Eaux & Routes', grp_markers:'Repères', grp_regions:'Régions & Mesure',
      t_select:'Sélection', t_landmass:'Terre', t_erase:'Mer', t_fill:'Remplir', t_terrain:'Terrain', t_symbol:'Symbole',
      t_river:'Rivière', t_road:'Route', t_label:'Étiquette', t_pan:'Déplacer', t_eyedrop:'Pipette', t_measure:'Mesurer', h_measure:'Cliquez pour ajouter des points et mesurer une distance en plusieurs segments. Entrée / double-clic pour terminer, Échap pour annuler. Les lignes de mesure peuvent être sélectionnées, déplacées ou supprimées ; elles sont exclues de l\'export PNG/SVG.', t_lasso:'Lasso', h_lasso:'Faites glisser pour tracer une zone fermée : Terre + Terrain + Relief y sont soulevés ensemble et deviennent déplaçables. Glissez pour déplacer, utilisez la poignée du haut pour pivoter. Entrée pour valider, Échap pour annuler, Suppr pour effacer entièrement la zone.',
      o_landmass:'Terre / Côte', o_brushsize:'Taille du pinceau', o_rough:'Irrégularité de la côte',
      o_landcolor:'Couleur de la terre', o_shorew:'Largeur du rivage', o_shorestyle:'Style de côte', o_shore_sandy:'Sablonneuse', o_shore_rocky:'Rocheuse', o_shore_reef:'Récif',
      o_smooth:'Lisser la côte', o_clearland:'Effacer la terre',
      h_landmass:"Glisser pour peindre la terre. L'outil « Mer » efface à la fois la terre et le terrain.", o_landgen:'Générer une terre aléatoire', o_landgentpl:'Modèle', o_landgen_continent:'Continent', o_landgen_island:'Île', o_landgen_archipelago:'Archipel', o_landgenrough:'Détail / rugosité', o_landgen_go:'Générer', h_landgen:'Remplace la couche de terre actuelle. Cliquez à nouveau avec les mêmes réglages pour un nouveau résultat aléatoire.',
      o_terrain:'Peinture de terrain', o_opacity:'Opacité', o_clip:'Peindre uniquement sur la terre',
      o_clearterrain:'Effacer le calque de terrain',
      h_terrain:'Les motifs sont dispersés aléatoirement à chaque coup de pinceau — aucun motif répétitif.', t_elevation:'Relief', o_elevation:'Relief', o_elevstrength:'Intensité', o_elevlower:'Mode abaissement', o_clearelevation:'Effacer le relief', o_elevdisplay:'Affichage', o_elevhillshade:'Estompage (hillshade)', o_elevcontours:'Courbes de niveau', o_contourinterval:'Intervalle des courbes', h_elevation:'Faites glisser pour surélever ; activez le « mode abaissement » pour creuser. L\'estompage se met à jour automatiquement.',
      o_symbol:'Symbole', o_size:'Taille', o_rot:'Rotation', o_hue:'Teinte',
      o_wear:'Usure', o_jitter:'Placement aléatoire',
      h_symbol:'Choisissez un symbole dans la bibliothèque, cliquez sur la carte. Utilisez « Sélection » pour déplacer ; Suppr pour effacer.',
      o_river:'Rivière', o_width:'Largeur', o_meander:'Méandre',
      o_taper:'Affiner à la source', o_color:'Couleur',
      h_path:'Cliquez pour ajouter des points. Entrée / double-clic pour terminer, Échap pour annuler.',
      o_road:'Route / Route caravanière',
      o_label:'Étiquette', o_preset:'Style prédéfini', o_curve:'Courbure', o_track:'Espacement des lettres', o_snappath:'Coller au tracé (rivière/route)',
      h_label:"Choisissez un style, saisissez le texte, cliquez sur la carte. S'applique instantanément à l'étiquette sélectionnée.",
      o_eyedrop:'Pipette de texture', o_eye_nosample:"Aucun échantillon pour l'instant",
      o_eye_radius:"Rayon d'échantillonnage", o_eye_brush:'Taille du pinceau',
      o_eye_pick:'① Choisir une zone', o_eye_paint:'② Commencer à peindre', o_eye_clear:"Effacer l'échantillon",
      h_eyedrop:'① Choisir une zone : tracez un cercle. ② Peindre : appliquez la texture sur la carte.',
      eyeOk:'✓ Texture échantillonnée', eyeFail:"Échec de l'échantillonnage — essayez sur la terre/le terrain.",
      eyePick:'Cliquez et glissez sur la carte → définissez la taille du cercle → relâchez.',
      eyePaint:'Cliquez et glissez sur la carte → la texture est appliquée.',
      eyeNeed:"Échantillonnez d'abord une texture avec ① Choisir une zone.",
      o_selection:'Sélection', o_nosel:'Rien de sélectionné', o_dup:'Dupliquer', o_del:'Supprimer',
      o_scalebar:'Échelle', o_scvis:'Afficher sur la carte', o_sclen:'Longueur',
      o_scsize:'Taille du texte', o_scsegs:'Segments',
      h_scale:"Faites glisser l'échelle sur la carte pour la repositionner.",
      o_view:'Vue', o_fit:"Ajuster à l'écran", o_100:'100 %',
      h_pan:'Clic droit + glisser, clic molette, Espace + glisser, ou flèches pour vous déplacer.',
      tab_layers:'Calques', tab_library:'Bibliothèque', tab_history:'Historique',
      ref_title:'Image de référence', ref_export:"Inclure dans l'export", ref_clear:'Retirer la référence', ref_trace:'Mode de calque (afficher au-dessus + accrochage au littoral)', ref_scan:'⌖ Scanner la géographie', h_ref_scan:'Extrait le littoral, les lacs et les rivières de l\'image de référence. Les symboles de carte comme les villes et les montagnes ne sont pas intégrés à la géographie — le terrain en dessous se poursuit sans interruption. Remplace la terre actuelle.', scan_title:'Analyse de la carte', scan_cancel:'Annuler', scan_prepare:'Préparation de l\'image', scan_markers:'Repérage des symboles de carte', scan_clean:'Complétion du terrain sous les symboles', scan_coast:'Extraction du littoral', scan_water:'Séparation des rivières et des lacs', scan_commit:'Écriture dans les calques', scan_noimage:'Chargez d\'abord une image de référence.', scan_flat:'Aucune zone de couleur distincte trouvée dans l\'image — impossible de distinguer la terre de la mer.', scan_noland:'Aucune terre trouvée dans l\'image.', scan_failed:'L\'analyse n\'a pas pu être terminée.', scan_done:'Analyse terminée — {r} rivières, {l} lacs ; {m} symboles de carte écartés.', layer_drag_hint:'Saisissez ici pour glisser-déposer le calque', blend_sourceover:'Normal', blend_multiply:'Produit', blend_overlay:'Incrustation', blend_softlight:'Lumière douce', blend_screen:'Superposition', nav_home:'Accueil', nav_canvas:'Toile', nav_tutorial:'Tutoriel', nav_community:'Communauté', home_tagline:'Un éditeur de cartes pour mondes fantastiques, dans le navigateur', home_desc:'Dessinez les frontières terre/mer, peignez forêts et montagnes, placez châteaux et villages, tracez rivières et routes — tout sur une seule toile, dans votre navigateur, sans installation.', home_cta:'Commencer votre carte', home_video_caption:'Vidéo de présentation bientôt disponible', canvas_new_title:'Créer une nouvelle toile', canvas_custom:'Taille personnalisée…', canvas_name_ph:'Nom de la carte', canvas_create:'Créer', canvas_import:'Importer depuis un fichier .json', canvas_saved_title:'Toiles enregistrées', canvas_empty:'Aucune toile enregistrée dans ce navigateur pour l\'instant. Elles apparaissent ici automatiquement dès que vous cliquez sur « Enregistrer » dans l\'éditeur.', canvas_open:'Ouvrir', canvas_delete:'Supprimer', canvas_delete_confirm:'Supprimer cette toile ? Cette action est irréversible.', canvas_unnamed:'Carte sans titre', tutorial_title:'Tutoriel', tutorial_intro:'Chaque outil de la barre latérale gauche ouvre ses propres réglages dans le panneau de droite. Voici un résumé rapide du rôle de chaque outil.', community_title:'Communauté', community_desc:'Wayborne Map Editor est un projet open source en constante évolution.', community_github_desc:'Code source, rapports de bugs et contributions', community_soon:'Bientôt disponible', lib_full:'Le stockage du navigateur est plein — supprimez une ancienne toile ou exportez-la en .json.', tut_h_select:'Sélectionnez, déplacez et faites pivoter des objets ; Maj+clic pour la sélection multiple.', tut_h_erase:'Efface la terre peinte et la texture de terrain qui s\'y trouve, en une seule fois.', tut_h_fill:'Remplit l\'intérieur d\'un contour côtier fermé en un clic.', tut_h_river:'Cliquez pour ajouter des points et tracer une rivière ; Entrée pour terminer.', tut_h_road:'Cliquez pour ajouter des points et tracer une route ; Entrée pour terminer.',
      sym_upload:'+ Importer un symbole PNG', sym_upload_done:'symbole(s) chargé(s)', sym_del:'Supprimer', sym_search:'Rechercher un symbole...', sym_recent:'Récemment utilisés',
      st_pos:'Position', st_zoom:'Zoom', st_size:'Toile', st_tool:'Outil',
      cancel:'Annuler', ok:'OK',
      locked:'Le calque est verrouillé ou masqué.', needtext:"Saisissez d'abord le texte de l'étiquette.", nopathnear:"Aucune rivière/route trouvée à proximité.", fill_toolarge:'Zone trop grande — essayez à l\'intérieur d\'une limite fermée.',
      exported:'Exporté :', saved:'Projet enregistré.', loaded:'Projet chargé.',
      badfile:'Fichier de projet invalide.', newmap:'Nouvelle carte créée.',
      confirmNew:'La carte actuelle sera abandonnée. Choisissez une taille de toile :',
      confirmSize:'Changer la taille de la toile redimensionne les calques existants. Continuer ?',
      histStart:'Début', selNone:'Rien de sélectionné', symbols:'symboles',
      selScale:'Échelle sélectionnée',
 o_front:'Mettre au premier plan', o_back:"Mettre à l'arrière-plan",
      o_fwd:'Avancer', o_bwd:'Reculer',
      o_group:'Grouper', o_ungroup:'Dissocier',
      selMulti:'objets sélectionnés',
      t_lake:'Lac', o_lake:'Lac', h_lake:'Cliquez pour ajouter des points, puis Entrée (3 points min.) pour fermer.', t_territory:'Territoire', o_territory:'Territoire', o_territorycolor:'Couleur de remplissage', o_territorybcolor:'Couleur de bordure', h_territory:'Cliquez pour ajouter des points, puis Entrée (3 points min.) pour fermer.', t_regionlink:'Lien de région', h_regionlink:'Cliquez sur la carte et nommez-la : une nouvelle carte de région vierge est créée. Double-cliquez sur l\'épingle avec l\'outil Sélection pour y entrer ; utilisez « Retour » en haut à gauche pour revenir à la carte du monde.', rl_newtitle:'Nouvelle carte de région', rl_placeholder:'Nom de la région', rl_default:'Région sans nom', rl_open:'Entrer dans la région →', bc_back:'Retour', bc_world:'Carte du monde', t_resource:'Ressource', o_resourcetype:'Type', rs_mine:'Mine', rs_farm:'Terres agricoles', rs_hunting:'Terrain de chasse', rs_fishing:'Zone de pêche', rs_trade:'Comptoir commercial', rs_quarry:'Carrière', h_resource:'Cliquez sur la carte pour placer un marqueur de ressource du type sélectionné.',
      o_lakecolor:'Couleur du lac',
      o_symbbrush:'Mode pinceau', o_symbdensity:'Densité', o_clipland:'Limiter à la terre (pinceau)',
      o_windrose:'Rose des vents', o_wrvis:'Afficher sur la carte', o_wrsize:'Taille',
      o_wrstyle_classic:'Classique', o_wrstyle_minimal:'Minimaliste', o_wrstyle:'Style', o_wrcolor:'Couleur', h_windrose:'Faites glisser sur la carte pour repositionner.',
      o_snap:'Aligner sur la grille', o_snapsize:'Taille de la grille', o_frame:'Cadre de la carte', o_frame_none:'Aucun', o_frame_simple:'Ligne simple', o_frame_rope:'Corde', o_frame_ornate:'Orné', o_frame_color:'Couleur',
      biomegen_empty:'Dessinez d\'abord la terre.', o_zonetype:'Type de zone', o_zone_none:'— aucun (région politique) —', o_zone_war:'Zone de guerre', o_zone_anomaly:'Anomalie', o_zone_forbidden:'Zone interdite', o_zone_hunting:'Terrain de chasse', o_zone_quarantine:'Quarantaine', o_zone_sacred:'Lieu sacré', o_zone_trade:'Zone commerciale', h_zonetype:'Une région dotée d’un type n’appartient à aucune des vues État / culture / religion ; elle est dessinée avec sa propre trame dans toutes les vues.', o_note:'Note', o_note_ph:'Votre note sur cet objet…', o_note_show:'Afficher les marques de note sur la carte', o_nb_edit:'Ajouter votre propre culture', o_nb_name:'Nom de la culture', o_nb_bas:'Syllabes initiales : Ash, Bram, Dun', o_nb_orta:'Sons médians : a, e, i', o_nb_son:'Syllabes finales : ford, dale, ton', o_nb_birlesik:'Composé (Ashford) — décoché : fluide (Valeria)', o_nb_add:'Ajouter', o_nb_del:'Supprimer la culture sélectionnée', h_nb:'Une culture que vous ajoutez appartient à ce projet, est enregistrée avec le fichier de projet et peut aussi servir au générateur de cultures/religions.', nb_needname:'Saisissez d’abord un nom de culture.', nb_needsyl:'Les syllabes initiales et finales ne peuvent pas être vides.', nb_builtin:'Les cultures intégrées ne peuvent pas être supprimées.', m_nbadded:'Culture ajoutée', m_nbdeleted:'Culture supprimée', o_lgsave:'Enregistrer comme modèle', o_lgdel:'Supprimer le modèle', o_lgsave_ask:'Nommez ce modèle :', o_lgsave_def:'Mon modèle', m_lgsaved:'Modèle enregistré', h_lgpreset:'Un modèle enregistré conserve sous un nom la rugosité actuelle et les choix rivière/lac/terrain, et l’ajoute à la liste ci-dessus ; il voyage avec le fichier de projet.', o_climate:'Climat', o_climate_on:'Utiliser le modèle climatique', o_climate_eq:'Position de l’équateur', o_climate_str:'Intensité de l’ombre pluviométrique', o_climate_wind:'Afficher les flèches de vent', h_climate:'Déplacez l’équateur hors du centre de la toile pour créer des cartes d’un seul hémisphère ou des cartes polaires. Le vent assèche les cellules situées derrière les montagnes (ombre pluviométrique) et humidifie celles qui sont devant — le prochain « Attribuer les biomes » en tient compte.', copied:'Copié', copy:'Copier', exp_share_embedcode:'Code d\'intégration (iframe)', exp_share_gen:'🔗 Générer le lien', exp_share_help:'Aucun serveur — l\'image de la carte est intégrée directement dans le lien (la partie # de l\'URL). Le lien n\'est jamais envoyé nulle part sauf si vous le partagez vous-même ; les grandes cartes donnent des liens plus longs.', exp_share_link:'Lien', exp_share_sizehint:'Longueur du lien ≈ {kb} Ko', exp_share_t:'Lien de partage', h_biomegen:'Remplit automatiquement le calque de terrain selon l\'altitude et la latitude ; remplace le calque de terrain actuel.', h_rivergen:'Ajoute des rivières qui s\'écoulent vers la mer à partir de la grille d\'altitude. Nécessite des montagnes/collines peintes avec l\'outil « Relief ».', h_roadgen:'Trace des routes entre les symboles de peuplement (ville/bourg/village/château/port) en évitant les pentes raides. Relie quelques points de terre aléatoires s\'il n\'y a pas de peuplements.', h_settlegen:'Répartit des symboles de ville/bourg/village sur un terrain plat près de la côte — le meilleur emplacement reçoit un château/port, le reste des villes/villages. « Générer les routes » trouve ces symboles et les relie. Chaque implantation reçoit un nom tiré du répertoire de syllabes de la région culturelle où elle se trouve.', o_settle_labels:'Écrire aussi les noms comme étiquettes', lakegen_none:'Aucun emplacement adapté trouvé pour un lac.', o_biomegen:'Attribuer les biomes automatiquement', o_biomegen_go:'🌍 Attribuer les biomes', o_landgen_lakes:'Ajouter des lacs', o_landgen_rivers:'Ajouter des rivières', o_landgen_terrain:'Ajouter le terrain', o_rivergen:'Générer les rivières automatiquement', o_rivergen_go:'💧 Générer les rivières', o_roadgen:'Générer les routes automatiquement', o_roadgen_go:'🛤️ Générer les routes', o_seacolor:'Couleur de la mer', o_settlegen:'Placer les peuplements automatiquement', o_settlegen_go:'🏰 Placer les peuplements', o_symlegend:'Légende', panel_toggle_left:'Afficher/masquer le panneau gauche', panel_toggle_right:'Afficher/masquer le panneau droit', regions_maptree:'Arborescence des cartes', regions_political:'Régions politiques', regions_political_empty:'Aucune région nommée pour l\'instant. Dessinez avec l\'outil « Territoire », puis donnez-lui un nom.', rivergen_noelev:'Peignez d\'abord des montagnes/collines avec l\'outil « Relief ».', rivergen_none:'Aucune source de rivière adaptée trouvée.', roadgen_noland:'Pas assez de terre/points trouvés pour les routes.', roadgen_none:'Aucune route n\'a pu être générée — les masses terrestres sont peut-être déconnectées.', sc_cancel:'Annuler / désélectionner', sc_delete:'Supprimer la sélection', sc_finish:'Terminer le tracé', sc_fit:'Ajuster à l\'écran', sc_general:'Général', sc_help:'Ouvrir cet écran', sc_pan:'Déplacer', sc_panfast:'Déplacement rapide', sc_redo:'Rétablir', sc_rotsym:'Faire pivoter le symbole', sc_save:'Enregistrer', sc_title:'Raccourcis clavier', sc_undo:'Annuler', sc_zoom:'Zoomer / dézoomer', settlegen_noland:'Aucun terrain adapté trouvé pour les peuplements.', settlegen_none:'Aucun peuplement n\'a pu être placé.', share_editbtn:'Ouvrir dans Wayborne', tab_regions:'Régions', tab_todo:'À faire', todo_add:'Ajouter', todo_empty:'Aucune tâche pour l\'instant.', todo_placeholder:'Nouvelle tâche...'
    },
    es: { tut_extras:'Más allá de las herramientas: generadores automáticos', tut_extras_d:'No están en la barra de herramientas; aparecen en el panel derecho al elegir la herramienta relacionada.', o_measurearea:'Cerrar como área', tpa_undo:'Deshacer el último punto', tpa_finish:'Finalizar', tpa_cancel:'Cancelar',
      new:'Nuevo', open:'Abrir', save:'Guardar', parchment:'Pergamino', grid:'Cuadrícula', shore:'Costa',
      o_gridsec:'Cuadrícula', o_gridtype:'Tipo', o_grid_square:'Cuadrado', o_grid_hex:'Hexágono', o_grid_dot:'Punto', o_gridcell:'Tamaño de celda', o_gridcolor:'Color', o_gridop:'Intensidad', h_grid:'Activa la cuadrícula desde la casilla \'Cuadrícula\' de arriba. El hexágono es el estándar del rol de mesa.',
      o_polsec:'Mapa político', o_polmode:'Vista política', o_polmute:'Atenuar textura del terreno', o_pollegend:'Mostrar leyenda', o_polfill:'Intensidad de relleno', o_polcolors:'Asignar colores de estado', o_polname:'Nombre de la región seleccionada', o_polname_ph:'Nombre del estado', h_political:'La vista política no es una capa aparte; presenta las regiones dibujadas como estados.', o_stategensec:'Generación de estados y culturas', o_polmodesel:'Vista', o_polmode_state:'Estados', o_polmode_culture:'Culturas', o_stcount:'Número de estados', o_stvariety:'Variedad de tamaño', o_stategen_go:'👑 Generar estados', h_stategen:'Genera fronteras de estados que crecen simultáneamente desde cada capital y encajan perfectamente entre sí. Conserva tus regiones dibujadas a mano, se añade a ellas.', o_cucount:'Número de culturas', o_culturegen_go:'🎭 Generar culturas', h_culturegen:'Genera regiones culturales que crecen en su propia cuadrícula, independientes de las fronteras de los estados — cambia entre la presentación de estados/culturas con el selector «Vista» de arriba.', o_stedit:'Región seleccionada', h_stedit_none:'Selecciona una región en el mapa o en la pestaña «Regiones» de la derecha para editarla.', o_stgov:'Forma de gobierno', o_stcapital:'Capital', o_stcapital_pick:'Elegir la capital en el mapa', o_stcapital_cancel:'Cancelar la elección de capital', o_stmake:'Convertir en estado', o_stunmake:'Quitar el estatus de estado', o_stemblem:'Escudo de armas', o_stemblem_gen:'Generar escudo', o_stemblem_reroll:'Generar de nuevo', o_stemblem_png:'Descargar PNG', o_stemblem_clear:'Quitar escudo', h_stemblem:'El escudo se dibuja en código; su semilla se guarda con el estado, así que la misma semilla da siempre el mismo escudo. Se muestra junto a la capital en la vista política.', o_polemblem:'Mostrar escudos', m_emblem:'Escudo generado', h_stedit:'Al convertir una región dibujada a mano en un estado, esta recibe un nombre, una forma de gobierno y una capital; después se lista y colorea igual que un estado generado.', m_stmade:'Región convertida en estado', m_stunmade:'La región ya no es un estado', m_capitalpick:'Haz clic en la posición de la capital en el mapa (Esc para cancelar)', st_capital_sea:'La capital debe estar en tierra firme.', st_capital_set:'Capital trasladada', o_provcount:'Provincias por estado', o_provgen_go:'Generar provincias', h_provgen:'Divide las fronteras de cada estado en subregiones; el límite de una provincia nunca sale del estado al que pertenece.', m_provgen:'provincias generadas', prov_nostate:'Genera estados primero: las provincias son subdivisiones de los estados.', prov_none:'No se pudieron generar provincias (estados demasiado pequeños).', o_diplosec:'Diplomacia', h_diplo_none:'Se necesitan al menos dos estados para definir relaciones.', o_diplo_a:'Estado A', o_diplo_b:'Estado B', o_diplo_rel:'Relación', rel_peace:'Paz', rel_alliance:'Alianza', rel_war:'Guerra', rel_vassal:'Vasallaje', diplo_same:'Un estado no puede tener una relación consigo mismo.', o_polmode_religion:'Religiones', o_recount:'Número de religiones', o_religiongen_go:'Generar religiones', m_religiongen:'regiones religiosas generadas', o_citysec:'Generación de ciudad', h_city_nosel:'Selecciona primero una región: la ciudad se genera dentro de sus límites.', o_citydistrict:'Tipo de barrio', o_citybuildings:'Número de edificios', o_citystreet:'Ancho de las calles', o_citywall:'Añadir murallas y puertas', o_citygen_go:'Generar ciudad', h_citygen:'Divide la región seleccionada en manzanas mediante avenidas y callejuelas, luego las manzanas en parcelas, y coloca en cada parcela un edificio acorde al tipo de barrio, con la fachada orientada a la calle más cercana. Se deshace en un solo paso.', m_citygen:'edificios colocados', city_noarea:'Selecciona primero una región donde quepa la ciudad.', city_small:'La región seleccionada es demasiado pequeña para una ciudad.', dist_craftsmen:'Artesanos', dist_market:'Mercado', dist_noble:'Noble', dist_slum:'Barrio pobre', dist_temple:'Templo', dist_harbour:'Puerto', accent_t:'Color de acento de la interfaz (clic derecho: restablecer)', o_speak:'Leer el nombre en voz alta', url_generated:'Mapa generado a partir de la semilla del enlace', url_badtemplate:'La plantilla del enlace no es válida.', exp_gis_t:'Exportar los datos vectoriales como GeoJSON (QGIS, etc.)', gis_done:'objetos exportados como GeoJSON', gis_empty:'No hay objetos vectoriales que exportar.', m_stategen:'estados generados', m_culturegen:'regiones culturales generadas', stategen_noland:'No hay suficiente tierra para generar estados.', stategen_none:'No se pudieron generar estados/culturas.', gov_kingdom:'Reino', gov_empire:'Imperio', gov_theocracy:'Teocracia', gov_republic:'República', gov_confederation:'Confederación', gov_citystate:'Ciudad-estado', m_polon:'Vista política activada', m_poloff:'Vista física', m_polcolored:'regiones coloreadas', m_polempty:'Dibuja primero una región',
      o_nameculture:'Cultura', o_namefeature:'Tipo', o_namegen:'🎲 Sugerir nombre', o_nf_settlement:'Asentamiento', o_nf_city:'Ciudad', o_nf_river:'Río', o_nf_mountain:'Montaña', o_nf_forest:'Bosque', o_nf_region:'Región', o_nf_lake:'Lago', o_nf_sea:'Mar',
      tpl_title:'Empezar con una plantilla', tpl_desc:'Comienza con una costa ya hecha y construye tu mundo sobre ella.', tpl_ready:'lienzo listo',
      tpl_continent:'Continente', tpl_continent_d:'Gran masa de tierra con costas recortadas', tpl_island:'Isla', tpl_island_d:'Una gran isla en mar abierto', tpl_archipelago:'Archipiélago', tpl_archipelago_d:'Islas dispersas y estrechos poco profundos', tpl_kingdom:'Reino', tpl_kingdom_d:'Costas suaves, interior cultivable', tpl_battle:'Mapa de batalla', tpl_battle_d:'Terreno pequeño con rejilla hexagonal', tpl_blank:'Lienzo en blanco', tpl_blank_d:'Empezar desde cero',
      o_outlinecolor:'Color del contorno',
      exp_html_t:'HTML de un solo archivo', exp_print_t:'Imprimir / PDF', exp_png2_t:'Resolución 2×', exp_png4_t:'Resolución 4×', exp_maxdim:'Lado más largo', exp_format:'Formato', exp_fmt_png:'PNG · nítido, archivo grande', exp_fmt_jpeg:'JPEG · archivo pequeño', exp_title:'Título', exp_html_help:'Descarga un único archivo .html con el mapa y un pequeño visor incrustado. No hace falta servidor — envía el archivo y haz doble clic.', exp_page:'Tamaño de página', exp_orient:'Orientación', exp_portrait:'Vertical', exp_landscape:'Horizontal', exp_margin:'Margen', exp_dpi:'Resolución', exp_dpi_screen:'pantalla', exp_dpi_normal:'impresión normal', exp_dpi_high:'alta calidad', exp_print_help:'Abre el diálogo de impresión del navegador. Desde allí puedes imprimir o elegir «Guardar como PDF».', printing:'Preparando la impresión', print_failed:'No se pudo abrir el diálogo de impresión', viewer_hint:'arrastrar · rueda · doble clic', viewer_in:'Acercar', viewer_out:'Alejar', viewer_fit:'Ajustar',
      t_sketch:'Boceto', o_sketch:'Boceto', h_sketch:'Un pincel libre que solo dibuja en las capas que añades tú. Añade una con «+ Añadir capa» en el panel de capas, selecciónala en la lista y luego dibuja en el mapa.', o_hardness:'Dureza', o_sketch_eraser:'Modo borrador', sketch_target:'Capa de destino', sketch_need_layer:'Añade primero tu propia capa y selecciónala en la lista', layer_add:'+ Añadir capa', h_add_layer:'Las capas que añades sirven para dibujo libre; pinta sobre ellas con la herramienta «Boceto».', layer_added:'Capa añadida', layer_untitled:'Capa', layer_max:'Se pueden añadir 12 capas de usuario como máximo', layer_rename:'Nombre de la capa', layer_rename_hint:'Haz doble clic para renombrar', layer_delete:'Eliminar capa', layer_delete_confirm:'¿Eliminar esta capa y todo lo dibujado en ella?', tut_h_sketch:'Dibuja a mano alzada en las capas que añades tú; color, tamaño, dureza, opacidad y modo borrador ajustables.',
      o_typography:'Tipografía', o_font:'Tipo de letra', o_banner:'Banderola', o_banner_none:'Ninguna', o_banner_ribbon:'Cinta', o_banner_plate:'Placa', o_banner_scroll:'Pergamino', o_banner_stone:'Piedra', o_caps:'Mayúsculas', o_outline:'Contorno', o_shadow:'Sombra', h_font_missing:'Esta tipografía no está instalada en este dispositivo; se usa la más parecida. Las entradas marcadas con · están instaladas.',
      grp_navigate:'Navegación', grp_terrain:'Terreno', grp_water:'Agua y Rutas', grp_markers:'Marcadores', grp_regions:'Regiones y Medida',
      t_select:'Seleccionar', t_landmass:'Tierra', t_erase:'Mar', t_fill:'Rellenar', t_terrain:'Terreno', t_symbol:'Símbolo',
      t_river:'Río', t_road:'Camino', t_label:'Etiqueta', t_pan:'Desplazar', t_eyedrop:'Muestra', t_measure:'Medir', h_measure:'Haz clic para añadir puntos y medir una distancia de varios segmentos. Intro / doble clic para terminar, Esc para cancelar. Las líneas de medición se pueden seleccionar, mover o eliminar; se excluyen de la exportación PNG/SVG.', t_lasso:'Lazo', h_lasso:'Arrastra para trazar un área cerrada: Tierra + Terreno + Relieve se levantan juntos dentro de ella y se vuelven movibles. Arrastra para mover, usa el tirador superior para rotar. Intro para confirmar, Esc para cancelar, Supr para eliminar el área por completo.',
      o_landmass:'Tierra / Costa', o_brushsize:'Tamaño del pincel', o_rough:'Rugosidad de la costa',
      o_landcolor:'Color de la tierra', o_shorew:'Ancho de la costa', o_shorestyle:'Estilo de costa', o_shore_sandy:'Arenosa', o_shore_rocky:'Rocosa', o_shore_reef:'Arrecife',
      o_smooth:'Suavizar costa', o_clearland:'Borrar tierra',
      h_landmass:'Arrastra para pintar tierra. La herramienta «Mar» borra tanto la tierra como el terreno.', o_landgen:'Generar tierra aleatoria', o_landgentpl:'Plantilla', o_landgen_continent:'Continente', o_landgen_island:'Isla', o_landgen_archipelago:'Archipiélago', o_landgenrough:'Detalle / rugosidad', o_landgen_go:'Generar', h_landgen:'Reemplaza la capa de tierra actual. Vuelve a hacer clic con los mismos ajustes para un nuevo resultado aleatorio.',
      o_terrain:'Pintura de terreno', o_opacity:'Opacidad', o_clip:'Pintar solo sobre tierra',
      o_clearterrain:'Borrar capa de terreno',
      h_terrain:'Los motivos se dispersan aleatoriamente en cada trazo — sin patrones repetidos.', t_elevation:'Relieve', o_elevation:'Relieve', o_elevstrength:'Intensidad', o_elevlower:'Modo de rebajar', o_clearelevation:'Borrar relieve', o_elevdisplay:'Visualización', o_elevhillshade:'Sombreado (hillshade)', o_elevcontours:'Curvas de nivel', o_contourinterval:'Intervalo de curvas', h_elevation:'Arrastra para elevar el terreno; activa el «modo de rebajar» para hundirlo. El sombreado se actualiza automáticamente.',
      o_symbol:'Símbolo', o_size:'Tamaño', o_rot:'Rotación', o_hue:'Tono',
      o_wear:'Desgaste', o_jitter:'Colocación aleatoria',
      h_symbol:'Elige un símbolo de la biblioteca, haz clic en el mapa. Usa «Seleccionar» para mover; Supr para borrar.',
      o_river:'Río', o_width:'Ancho', o_meander:'Meandro',
      o_taper:'Adelgazar en el nacimiento', o_color:'Color',
      h_path:'Haz clic para añadir puntos. Intro / doble clic para terminar, Esc para cancelar.',
      o_road:'Camino / Ruta de caravanas',
      o_label:'Etiqueta', o_preset:'Estilo predefinido', o_curve:'Curvatura', o_track:'Espaciado de letras', o_snappath:'Ajustar a la ruta (río/camino)',
      h_label:'Elige un estilo, escribe el texto, haz clic en el mapa. Se aplica al instante a la etiqueta seleccionada.',
      o_eyedrop:'Muestreador de textura', o_eye_nosample:'Aún no hay muestra',
      o_eye_radius:'Radio de muestreo', o_eye_brush:'Tamaño del pincel',
      o_eye_pick:'① Elegir área', o_eye_paint:'② Empezar a pintar', o_eye_clear:'Borrar muestra',
      h_eyedrop:'① Elegir área: arrastra para dibujar un círculo. ② Pintar: aplica la textura al mapa.',
      eyeOk:'✓ Textura muestreada', eyeFail:'Muestreo fallido — prueba sobre tierra/terreno.',
      eyePick:'Haz clic y arrastra en el mapa → ajusta el tamaño del círculo → suelta.',
      eyePaint:'Haz clic y arrastra en el mapa → se aplica la textura.',
      eyeNeed:'Primero muestrea una textura con ① Elegir área.',
      o_selection:'Selección', o_nosel:'Nada seleccionado', o_dup:'Duplicar', o_del:'Borrar',
      o_scalebar:'Barra de escala', o_scvis:'Mostrar en el mapa', o_sclen:'Longitud',
      o_scsize:'Tamaño del texto', o_scsegs:'Segmentos',
      h_scale:'Arrastra la barra de escala en el mapa para reposicionarla.',
      o_view:'Vista', o_fit:'Ajustar a la pantalla', o_100:'100 %',
      h_pan:'Clic derecho + arrastrar, clic central, Espacio + arrastrar, o flechas para desplazarte.',
      tab_layers:'Capas', tab_library:'Biblioteca', tab_history:'Historial',
      ref_title:'Imagen de referencia', ref_export:'Incluir en la exportación', ref_clear:'Quitar referencia', ref_trace:'Modo de calco (mostrar encima + ajuste a la costa)', ref_scan:'⌖ Escanear geografía', h_ref_scan:'Extrae la costa, los lagos y los ríos de la imagen de referencia. Los símbolos del mapa como ciudades y montañas no se mezclan con la geografía: el terreno bajo ellos continúa sin interrupción. Sustituye la tierra actual.', scan_title:'Escaneando el mapa', scan_cancel:'Cancelar', scan_prepare:'Preparando la imagen', scan_markers:'Separando los símbolos del mapa', scan_clean:'Completando el terreno bajo los símbolos', scan_coast:'Extrayendo la costa', scan_water:'Separando ríos y lagos', scan_commit:'Escribiendo en las capas', scan_noimage:'Carga primero una imagen de referencia.', scan_flat:'No se hallaron dos zonas de color diferenciadas en la imagen: no se puede distinguir tierra de mar.', scan_noland:'No se encontró tierra en la imagen.', scan_failed:'No se pudo completar el escaneo.', scan_done:'Escaneo listo: {r} ríos, {l} lagos; {m} símbolos del mapa excluidos.', layer_drag_hint:'Arrastra desde aquí para reordenar la capa', blend_sourceover:'Normal', blend_multiply:'Multiplicar', blend_overlay:'Superposición', blend_softlight:'Luz suave', blend_screen:'Trama', nav_home:'Inicio', nav_canvas:'Lienzo', nav_tutorial:'Tutorial', nav_community:'Comunidad', home_tagline:'Un editor de mapas para mundos de fantasía, en el navegador', home_desc:'Dibuja los límites entre tierra y mar, pinta bosques y montañas, coloca castillos y aldeas, traza ríos y caminos — todo en un solo lienzo, en tu navegador, sin instalación.', home_cta:'Empieza tu mapa', home_video_caption:'Vídeo de presentación próximamente', canvas_new_title:'Crear un nuevo lienzo', canvas_custom:'Tamaño personalizado…', canvas_name_ph:'Nombre del mapa', canvas_create:'Crear', canvas_import:'Importar desde archivo .json', canvas_saved_title:'Lienzos guardados', canvas_empty:'Aún no hay lienzos guardados en este navegador. Se listan aquí automáticamente al pulsar «Guardar» en el editor.', canvas_open:'Abrir', canvas_delete:'Eliminar', canvas_delete_confirm:'¿Eliminar este lienzo? Esta acción no se puede deshacer.', canvas_unnamed:'Mapa sin título', tutorial_title:'Tutorial', tutorial_intro:'Cada herramienta de la barra izquierda abre sus propios ajustes en el panel derecho. Aquí tienes un resumen rápido de lo que hace cada una.', community_title:'Comunidad', community_desc:'Wayborne Map Editor es un proyecto de código abierto en constante evolución.', community_github_desc:'Código fuente, reportes de errores y contribuciones', community_soon:'Próximamente', lib_full:'El almacenamiento del navegador está lleno — elimina un lienzo antiguo o expórtalo como .json.', tut_h_select:'Selecciona, mueve y rota objetos; Mayús+clic para selección múltiple.', tut_h_erase:'Borra la tierra pintada y la textura de terreno que tiene encima, en un solo paso.', tut_h_fill:'Rellena el interior de un contorno costero cerrado con un solo clic.', tut_h_river:'Haz clic para añadir puntos y dibujar un río; Intro para terminar.', tut_h_road:'Haz clic para añadir puntos y dibujar un camino; Intro para terminar.',
      sym_upload:'+ Subir símbolo PNG', sym_upload_done:'símbolo(s) cargado(s)', sym_del:'Borrar', sym_search:'Buscar símbolos...', sym_recent:'Usados recientemente',
      st_pos:'Posición', st_zoom:'Zoom', st_size:'Lienzo', st_tool:'Herramienta',
      cancel:'Cancelar', ok:'Aceptar',
      locked:'La capa está bloqueada u oculta.', needtext:'Escribe primero el texto de la etiqueta.', nopathnear:'No se encontró ningún río/camino cerca.', fill_toolarge:'Área demasiado grande — pruébalo dentro de un límite cerrado.',
      exported:'Exportado:', saved:'Proyecto guardado.', loaded:'Proyecto cargado.',
      badfile:'Archivo de proyecto no válido.', newmap:'Mapa nuevo creado.',
      confirmNew:'Se descartará el mapa actual. Elige un tamaño de lienzo:',
      confirmSize:'Cambiar el tamaño del lienzo reescala las capas existentes. ¿Continuar?',
      histStart:'Inicio', selNone:'Nada seleccionado', symbols:'símbolos',
      selScale:'Barra de escala seleccionada', o_front:'Traer al frente', o_back:'Enviar al fondo',
      o_fwd:'Avanzar', o_bwd:'Retroceder',
      o_group:'Agrupar', o_ungroup:'Desagrupar',
      selMulti:'objetos seleccionados',
      t_lake:'Lago', o_lake:'Lago', h_lake:'Haz clic para añadir puntos; con 3 o más, pulsa Intro para cerrar.', t_territory:'Territorio', o_territory:'Territorio', o_territorycolor:'Color de relleno', o_territorybcolor:'Color del borde', h_territory:'Haz clic para añadir puntos; con 3 o más, pulsa Intro para cerrar.', t_regionlink:'Enlace de región', h_regionlink:'Haz clic en el mapa y dale un nombre: se crea un nuevo mapa de región en blanco. Haz doble clic en el pin con la herramienta Selección para entrar; usa «Atrás» arriba a la izquierda para volver al mapa del mundo.', rl_newtitle:'Nuevo mapa de región', rl_placeholder:'Nombre de la región', rl_default:'Región sin nombre', rl_open:'Entrar en la región →', bc_back:'Atrás', bc_world:'Mapa del mundo', t_resource:'Recurso', o_resourcetype:'Tipo', rs_mine:'Mina', rs_farm:'Tierras de cultivo', rs_hunting:'Zona de caza', rs_fishing:'Zona de pesca', rs_trade:'Puesto comercial', rs_quarry:'Cantera', h_resource:'Haz clic en el mapa para colocar un marcador de recurso del tipo seleccionado.',
      o_lakecolor:'Color del lago',
      o_symbbrush:'Modo pincel', o_symbdensity:'Densidad', o_clipland:'Ajustar a tierra (pincel)',
      o_windrose:'Rosa de los vientos', o_wrvis:'Mostrar en el mapa', o_wrsize:'Tamaño',
      o_wrstyle_classic:'Clásico', o_wrstyle_minimal:'Minimalista', o_wrstyle:'Estilo', o_wrcolor:'Color', h_windrose:'Arrastra en el mapa para reposicionarla.',
      o_snap:'Ajustar a la cuadrícula', o_snapsize:'Tamaño de la cuadrícula', o_frame:'Marco del mapa', o_frame_none:'Ninguno', o_frame_simple:'Línea simple', o_frame_rope:'Cuerda', o_frame_ornate:'Ornamentado', o_frame_color:'Color',
      biomegen_empty:'Dibuja primero la tierra.', o_zonetype:'Tipo de zona', o_zone_none:'— ninguno (región política) —', o_zone_war:'Zona de guerra', o_zone_anomaly:'Anomalía', o_zone_forbidden:'Zona prohibida', o_zone_hunting:'Coto de caza', o_zone_quarantine:'Cuarentena', o_zone_sacred:'Lugar sagrado', o_zone_trade:'Zona comercial', h_zonetype:'Una región con tipo no pertenece a ninguna de las vistas de estado, cultura o religión; se dibuja con su propia trama en todas las vistas.', o_note:'Nota', o_note_ph:'Tu nota sobre este objeto…', o_note_show:'Mostrar marcas de nota en el mapa', o_nb_edit:'Añade tu propia cultura', o_nb_name:'Nombre de la cultura', o_nb_bas:'Sílabas iniciales: Ash, Bram, Dun', o_nb_orta:'Sonidos intermedios: a, e, i', o_nb_son:'Sílabas finales: ford, dale, ton', o_nb_birlesik:'Compuesto (Ashford); desactivado: fluido (Valeria)', o_nb_add:'Añadir', o_nb_del:'Eliminar la cultura seleccionada', h_nb:'La cultura que añadas pertenece a este proyecto, se guarda con el archivo del proyecto y también puede usarla el generador de culturas y religiones.', nb_needname:'Escribe primero un nombre de cultura.', nb_needsyl:'Las sílabas iniciales y finales no pueden estar vacías.', nb_builtin:'Las culturas integradas no se pueden eliminar.', m_nbadded:'Cultura añadida', m_nbdeleted:'Cultura eliminada', o_lgsave:'Guardar como plantilla', o_lgdel:'Eliminar plantilla', o_lgsave_ask:'Ponle nombre a esta plantilla:', o_lgsave_def:'Mi plantilla', m_lgsaved:'Plantilla guardada', h_lgpreset:'Una plantilla guardada conserva con un nombre la rugosidad actual y las opciones de río/lago/terreno, y se añade a la lista de arriba; viaja con el archivo del proyecto.', o_climate:'Clima', o_climate_on:'Usar el modelo climático', o_climate_eq:'Posición del ecuador', o_climate_str:'Intensidad de la sombra orográfica', o_climate_wind:'Mostrar las flechas de viento', h_climate:'Desplaza el ecuador fuera del centro del lienzo para crear mapas de un solo hemisferio o mapas polares. El viento seca las celdas situadas detrás de las montañas (sombra orográfica) y humedece las que están delante; la siguiente ejecución de «Asignar biomas» lo tiene en cuenta.', copied:'Copiado', copy:'Copiar', exp_share_embedcode:'Código para incrustar (iframe)', exp_share_gen:'🔗 Generar enlace', exp_share_help:'Sin servidor — la imagen del mapa se incrusta directamente en el enlace (la parte # de la URL). El enlace nunca se sube a ningún sitio salvo que tú lo envíes; los mapas grandes generan enlaces más largos.', exp_share_link:'Enlace', exp_share_sizehint:'Longitud del enlace ≈ {kb} KB', exp_share_t:'Enlace para compartir', h_biomegen:'Rellena automáticamente la capa de terreno según la altitud y la latitud; sustituye la capa de terreno actual.', h_rivergen:'Añade ríos que fluyen hacia el mar a partir de la cuadrícula de altitud. Requiere montañas/colinas pintadas con el pincel «Relieve».', h_roadgen:'Traza caminos entre los símbolos de asentamiento (ciudad/pueblo/aldea/castillo/puerto) evitando pendientes pronunciadas. Conecta algunos puntos de tierra aleatorios si no hay asentamientos.', h_settlegen:'Distribuye símbolos de ciudad/pueblo/aldea sobre terreno llano cerca de la costa — el mejor lugar recibe un castillo/puerto, el resto pueblos/aldeas. «Generar caminos» encuentra estos símbolos y los conecta. Cada asentamiento recibe un nombre del repertorio de sílabas de la región cultural en la que se encuentra.', o_settle_labels:'Escribir también los nombres como etiquetas', lakegen_none:'No se encontró un lugar adecuado para un lago.', o_biomegen:'Asignar biomas automáticamente', o_biomegen_go:'🌍 Asignar biomas', o_landgen_lakes:'Añadir lagos', o_landgen_rivers:'Añadir ríos', o_landgen_terrain:'Añadir terreno', o_rivergen:'Generar ríos automáticamente', o_rivergen_go:'💧 Generar ríos', o_roadgen:'Generar caminos automáticamente', o_roadgen_go:'🛤️ Generar caminos', o_seacolor:'Color del mar', o_settlegen:'Colocar asentamientos automáticamente', o_settlegen_go:'🏰 Colocar asentamientos', o_symlegend:'Leyenda', panel_toggle_left:'Mostrar/ocultar el panel izquierdo', panel_toggle_right:'Mostrar/ocultar el panel derecho', regions_maptree:'Árbol de mapas', regions_political:'Regiones políticas', regions_political_empty:'Aún no hay regiones con nombre. Dibuja con la herramienta «Territorio» y luego dale un nombre.', rivergen_noelev:'Pinta primero montañas/colinas con el pincel «Relieve».', rivergen_none:'No se encontró una fuente de río adecuada.', roadgen_noland:'No se encontró suficiente tierra/puntos para caminos.', roadgen_none:'No se pudo generar ningún camino — las masas de tierra pueden estar desconectadas.', sc_cancel:'Cancelar / deseleccionar', sc_delete:'Eliminar selección', sc_finish:'Terminar el trazado', sc_fit:'Ajustar a la pantalla', sc_general:'General', sc_help:'Abrir esta pantalla', sc_pan:'Desplazar', sc_panfast:'Desplazar más rápido', sc_redo:'Rehacer', sc_rotsym:'Rotar símbolo', sc_save:'Guardar', sc_title:'Atajos de teclado', sc_undo:'Deshacer', sc_zoom:'Acercar / alejar', settlegen_noland:'No se encontró tierra adecuada para asentamientos.', settlegen_none:'No se pudo colocar ningún asentamiento.', share_editbtn:'Abrir en Wayborne', tab_regions:'Regiones', tab_todo:'Tareas', todo_add:'Añadir', todo_empty:'Aún no hay tareas.', todo_placeholder:'Nueva tarea...'
    },
    it: { tut_extras:'Oltre gli strumenti — generatori automatici', tut_extras_d:'Non si trovano nella barra degli strumenti; compaiono nel pannello di destra quando selezioni lo strumento corrispondente.', o_measurearea:'Chiudi come area', tpa_undo:'Annulla ultimo punto', tpa_finish:'Termina', tpa_cancel:'Annulla',
      new:'Nuovo', open:'Apri', save:'Salva', parchment:'Pergamena', grid:'Griglia', shore:'Costa',
      o_gridsec:'Griglia', o_gridtype:'Tipo', o_grid_square:'Quadrato', o_grid_hex:'Esagono', o_grid_dot:'Punto', o_gridcell:'Dimensione cella', o_gridcolor:'Colore', o_gridop:'Intensità', h_grid:'Attiva la griglia dalla casella \'Griglia\' in alto. L\'esagono è lo standard dei giochi di ruolo da tavolo.',
      o_polsec:'Mappa politica', o_polmode:'Vista politica', o_polmute:'Attenua la texture del terreno', o_pollegend:'Mostra legenda', o_polfill:'Intensità riempimento', o_polcolors:'Assegna colori agli stati', o_polname:'Nome della regione selezionata', o_polname_ph:'Nome dello stato', h_political:'La vista politica non è un livello separato; presenta le regioni disegnate come stati.', o_stategensec:'Generazione di stati e culture', o_polmodesel:'Vista', o_polmode_state:'Stati', o_polmode_culture:'Culture', o_stcount:'Numero di stati', o_stvariety:'Varietà di dimensione', o_stategen_go:'👑 Genera stati', h_stategen:'Genera confini di stato che crescono simultaneamente da ogni capitale e si adattano perfettamente tra loro. Mantiene le regioni disegnate a mano, si aggiunge ad esse.', o_cucount:'Numero di culture', o_culturegen_go:'🎭 Genera culture', h_culturegen:'Genera regioni culturali che crescono sulla propria griglia, indipendentemente dai confini di stato — passa dalla presentazione stati/culture con il selettore "Vista" sopra.', o_stedit:'Regione selezionata', h_stedit_none:'Seleziona una regione sulla mappa o dalla scheda "Regioni" a destra per modificarla.', o_stgov:'Forma di governo', o_stcapital:'Capitale', o_stcapital_pick:'Scegli la capitale sulla mappa', o_stcapital_cancel:'Annulla la scelta della capitale', o_stmake:'Converti in stato', o_stunmake:'Rimuovi lo stato di stato', o_stemblem:'Stemma', o_stemblem_gen:'Genera stemma', o_stemblem_reroll:'Rigenera', o_stemblem_png:'Scarica PNG', o_stemblem_clear:'Rimuovi stemma', h_stemblem:'Lo stemma è disegnato nel codice; il seme viene salvato con lo stato, lo stesso seme dà sempre lo stesso stemma. Compare accanto alla capitale nella vista politica.', o_polemblem:'Mostra gli stemmi', m_emblem:'Stemma generato', h_stedit:'Convertendo una regione disegnata a mano in uno stato, questa riceve un nome, una forma di governo e una capitale; viene poi elencata e colorata come uno stato generato.', m_stmade:'Regione convertita in stato', m_stunmade:'La regione non è più uno stato', m_capitalpick:'Clicca la posizione della capitale sulla mappa (Esc per annullare)', st_capital_sea:'La capitale deve trovarsi sulla terraferma.', st_capital_set:'Capitale spostata', o_provcount:'Province per stato', o_provgen_go:'Genera province', h_provgen:'Divide i confini di ogni stato in sottoregioni; il confine di una provincia non esce mai da quello del suo stato.', m_provgen:'province generate', prov_nostate:'Genera prima gli stati: le province sono suddivisioni degli stati.', prov_none:'Impossibile generare province (stati troppo piccoli).', o_diplosec:'Diplomazia', h_diplo_none:'Servono almeno due stati per definire delle relazioni.', o_diplo_a:'Stato A', o_diplo_b:'Stato B', o_diplo_rel:'Relazione', rel_peace:'Pace', rel_alliance:'Alleanza', rel_war:'Guerra', rel_vassal:'Vassallaggio', diplo_same:'Uno stato non può avere una relazione con se stesso.', o_polmode_religion:'Religioni', o_recount:'Numero di religioni', o_religiongen_go:'Genera religioni', m_religiongen:'regioni religiose generate', o_citysec:'Generazione della città', h_city_nosel:'Seleziona prima una regione: la città viene generata entro i suoi confini.', o_citydistrict:'Tipo di quartiere', o_citybuildings:'Numero di edifici', o_citystreet:'Larghezza delle strade', o_citywall:'Aggiungi mura e porte', o_citygen_go:'Genera città', h_citygen:'Divide la regione scelta in isolati con viali e vicoli, poi gli isolati in lotti, e su ogni lotto colloca un edificio adatto al tipo di quartiere, con la facciata rivolta verso la strada più vicina. Si annulla in un solo passo.', m_citygen:'edifici collocati', city_noarea:'Seleziona prima una regione in cui far stare la città.', city_small:'La regione selezionata è troppo piccola per una città.', dist_craftsmen:'Artigiani', dist_market:'Mercato', dist_noble:'Nobile', dist_slum:'Quartiere povero', dist_temple:'Tempio', dist_harbour:'Porto', accent_t:'Colore d\'accento dell\'interfaccia (clic destro: ripristina)', o_speak:'Leggi il nome ad alta voce', url_generated:'Mappa generata dal seme presente nel link', url_badtemplate:'Il modello indicato nel link non è valido.', exp_gis_t:'Esporta i dati vettoriali come GeoJSON (QGIS ecc.)', gis_done:'oggetti esportati come GeoJSON', gis_empty:'Nessun oggetto vettoriale da esportare.', m_stategen:'stati generati', m_culturegen:'regioni culturali generate', stategen_noland:'Terra insufficiente per generare stati.', stategen_none:'Impossibile generare stati/culture.', gov_kingdom:'Regno', gov_empire:'Impero', gov_theocracy:'Teocrazia', gov_republic:'Repubblica', gov_confederation:'Confederazione', gov_citystate:'Città-stato', m_polon:'Vista politica attiva', m_poloff:'Vista fisica', m_polcolored:'regioni colorate', m_polempty:'Disegna prima una regione',
      o_nameculture:'Cultura', o_namefeature:'Tipo', o_namegen:'🎲 Suggerisci nome', o_nf_settlement:'Insediamento', o_nf_city:'Città', o_nf_river:'Fiume', o_nf_mountain:'Montagna', o_nf_forest:'Foresta', o_nf_region:'Regione', o_nf_lake:'Lago', o_nf_sea:'Mare',
      tpl_title:'Parti da un modello', tpl_desc:'Inizia con una costa già pronta, poi costruiscici sopra il tuo mondo.', tpl_ready:'tela pronta',
      tpl_continent:'Continente', tpl_continent_d:'Ampia massa continentale dalle coste frastagliate', tpl_island:'Isola', tpl_island_d:'Una grande isola in mare aperto', tpl_archipelago:'Arcipelago', tpl_archipelago_d:'Isole sparse e stretti poco profondi', tpl_kingdom:'Regno', tpl_kingdom_d:'Coste dolci, entroterra coltivabile', tpl_battle:'Mappa di battaglia', tpl_battle_d:'Piccolo terreno con griglia esagonale', tpl_blank:'Tela vuota', tpl_blank_d:'Partire da zero',
      o_outlinecolor:'Colore del contorno',
      exp_html_t:'HTML in un solo file', exp_print_t:'Stampa / PDF', exp_png2_t:'Risoluzione 2×', exp_png4_t:'Risoluzione 4×', exp_maxdim:'Lato più lungo', exp_format:'Formato', exp_fmt_png:'PNG · nitido, file grande', exp_fmt_jpeg:'JPEG · file piccolo', exp_title:'Titolo', exp_html_help:'Scarica un unico file .html con la mappa e un piccolo visualizzatore incorporato. Nessun server richiesto — invia il file e fai doppio clic.', exp_page:'Formato pagina', exp_orient:'Orientamento', exp_portrait:'Verticale', exp_landscape:'Orizzontale', exp_margin:'Margine', exp_dpi:'Risoluzione', exp_dpi_screen:'schermo', exp_dpi_normal:'stampa normale', exp_dpi_high:'alta qualità', exp_print_help:'Apre la finestra di stampa del browser. Da lì puoi stampare o scegliere «Salva come PDF».', printing:'Preparazione della stampa', print_failed:'Impossibile aprire la finestra di stampa', viewer_hint:'trascina · rotella · doppio clic', viewer_in:'Ingrandisci', viewer_out:'Riduci', viewer_fit:'Adatta',
      t_sketch:'Schizzo', o_sketch:'Schizzo', h_sketch:'Un pennello a mano libera che disegna solo sui livelli che aggiungi tu. Aggiungine uno con «+ Aggiungi livello» nel pannello dei livelli, selezionalo nell’elenco, poi disegna sulla mappa.', o_hardness:'Durezza', o_sketch_eraser:'Modalità gomma', sketch_target:'Livello di destinazione', sketch_need_layer:'Aggiungi prima un tuo livello e selezionalo nell’elenco', layer_add:'+ Aggiungi livello', h_add_layer:'I livelli che aggiungi servono al disegno libero; dipingici sopra con lo strumento «Schizzo».', layer_added:'Livello aggiunto', layer_untitled:'Livello', layer_max:'Si possono aggiungere al massimo 12 livelli utente', layer_rename:'Nome del livello', layer_rename_hint:'Doppio clic per rinominare', layer_delete:'Elimina livello', layer_delete_confirm:'Eliminare questo livello e tutto ciò che vi è disegnato?', tut_h_sketch:'Disegna a mano libera sui livelli che aggiungi tu; colore, dimensione, durezza, opacità e modalità gomma regolabili.',
      o_typography:'Tipografia', o_font:'Carattere', o_banner:'Cartiglio', o_banner_none:'Nessuno', o_banner_ribbon:'Nastro', o_banner_plate:'Targa', o_banner_scroll:'Pergamena', o_banner_stone:'Pietra', o_caps:'Maiuscolo', o_outline:'Contorno', o_shadow:'Ombra', h_font_missing:'Questo carattere non è installato su questo dispositivo; viene usato il più simile. Le voci con · sono installate.',
      grp_navigate:'Navigazione', grp_terrain:'Terreno', grp_water:'Acque e Vie', grp_markers:'Segnalini', grp_regions:'Regioni e Misura',
      t_select:'Seleziona', t_landmass:'Terra', t_erase:'Mare', t_fill:'Riempi', t_terrain:'Terreno', t_symbol:'Simbolo',
      t_river:'Fiume', t_road:'Strada', t_label:'Etichetta', t_pan:'Sposta', t_eyedrop:'Campiona', t_measure:'Misura', h_measure:'Fai clic per aggiungere punti e misurare una distanza a più segmenti. Invio / doppio clic per terminare, Esc per annullare. Le linee di misura possono essere selezionate, spostate o eliminate; sono escluse dall\'esportazione PNG/SVG.', t_lasso:'Laccio', h_lasso:'Trascina per disegnare un\'area chiusa: Terra + Terreno + Rilievo vengono sollevati insieme al suo interno e diventano spostabili. Trascina per spostare, usa la maniglia superiore per ruotare. Invio per confermare, Esc per annullare, Canc per eliminare completamente l\'area.',
      o_landmass:'Terra / Costa', o_brushsize:'Dimensione pennello', o_rough:'Irregolarità della costa',
      o_landcolor:'Colore della terra', o_shorew:'Larghezza della costa', o_shorestyle:'Stile della costa', o_shore_sandy:'Sabbiosa', o_shore_rocky:'Rocciosa', o_shore_reef:'Barriera corallina',
      o_smooth:'Smussa la costa', o_clearland:'Cancella terra',
      h_landmass:'Trascina per disegnare la terra. Lo strumento «Mare» cancella sia la terra sia il terreno.', o_landgen:'Genera terra casuale', o_landgentpl:'Modello', o_landgen_continent:'Continente', o_landgen_island:'Isola', o_landgen_archipelago:'Arcipelago', o_landgenrough:'Dettaglio / rugosità', o_landgen_go:'Genera', h_landgen:'Sostituisce il livello di terra attuale. Clicca di nuovo con le stesse impostazioni per un nuovo risultato casuale.',
      o_terrain:'Pittura del terreno', o_opacity:'Opacità', o_clip:'Dipingi solo sulla terra',
      o_clearterrain:'Cancella livello terreno',
      h_terrain:'I motivi vengono sparsi casualmente a ogni pennellata — nessun motivo ripetuto.', t_elevation:'Rilievo', o_elevation:'Rilievo', o_elevstrength:'Intensità', o_elevlower:'Modalità abbassamento', o_clearelevation:'Cancella rilievo', o_elevdisplay:'Visualizzazione', o_elevhillshade:'Ombreggiatura (hillshade)', o_elevcontours:'Curve di livello', o_contourinterval:'Intervallo curve di livello', h_elevation:'Trascina per sollevare il terreno; attiva la "modalità abbassamento" per scavarlo. L\'ombreggiatura si aggiorna automaticamente.',
      o_symbol:'Simbolo', o_size:'Dimensione', o_rot:'Rotazione', o_hue:'Tonalità',
      o_wear:'Usura', o_jitter:'Posizionamento casuale',
      h_symbol:'Scegli un simbolo dalla libreria, clicca sulla mappa. Usa «Seleziona» per spostare; Canc per eliminare.',
      o_river:'Fiume', o_width:'Spessore', o_meander:'Meandro',
      o_taper:'Assottiglia alla sorgente', o_color:'Colore',
      h_path:'Clicca per aggiungere punti. Invio / doppio clic per terminare, Esc per annullare.',
      o_road:'Strada / Rotta carovaniera',
      o_label:'Etichetta', o_preset:'Stile predefinito', o_curve:'Curvatura', o_track:'Spaziatura lettere', o_snappath:'Aggancia al tracciato (fiume/strada)',
      h_label:"Scegli uno stile, scrivi il testo, clicca sulla mappa. Si applica subito all'etichetta selezionata.",
      o_eyedrop:'Campionatore texture', o_eye_nosample:'Nessun campione ancora',
      o_eye_radius:'Raggio campionamento', o_eye_brush:'Dimensione pennello',
      o_eye_pick:'① Scegli area', o_eye_paint:'② Inizia a dipingere', o_eye_clear:'Cancella campione',
      h_eyedrop:'① Scegli area: trascina per disegnare un cerchio. ② Dipingi: applica la texture alla mappa.',
      eyeOk:'✓ Texture campionata', eyeFail:'Campionamento non riuscito — prova su terra/terreno.',
      eyePick:'Clicca e trascina sulla mappa → imposta la dimensione del cerchio → rilascia.',
      eyePaint:'Clicca e trascina sulla mappa → la texture viene applicata.',
      eyeNeed:'Prima campiona una texture con ① Scegli area.',
      o_selection:'Selezione', o_nosel:'Nessun oggetto selezionato', o_dup:'Duplica', o_del:'Elimina',
      o_scalebar:'Barra della scala', o_scvis:'Mostra sulla mappa', o_sclen:'Lunghezza',
      o_scsize:'Dimensione testo', o_scsegs:'Segmenti',
      h_scale:'Trascina la barra della scala sulla mappa per riposizionarla.',
      o_view:'Visualizza', o_fit:'Adatta allo schermo', o_100:'100%',
      h_pan:'Clic destro + trascina, clic centrale, Spazio + trascina, o frecce per spostarti.',
      tab_layers:'Livelli', tab_library:'Libreria', tab_history:'Cronologia',
      ref_title:'Immagine di riferimento', ref_export:"Includi nell'esportazione", ref_clear:'Rimuovi riferimento', ref_trace:'Modalità ricalco (mostra sopra + aggancio alla costa)', ref_scan:'⌖ Scansiona la geografia', h_ref_scan:'Estrae costa, laghi e fiumi dall\'immagine di riferimento. I simboli della mappa come città e montagne non entrano nella geografia: il terreno sotto di essi prosegue senza interruzioni. Sostituisce la terra attuale.', scan_title:'Scansione della mappa', scan_cancel:'Annulla', scan_prepare:'Preparazione dell\'immagine', scan_markers:'Individuazione dei simboli della mappa', scan_clean:'Completamento del terreno sotto i simboli', scan_coast:'Estrazione della costa', scan_water:'Separazione di fiumi e laghi', scan_commit:'Scrittura sui livelli', scan_noimage:'Carica prima un\'immagine di riferimento.', scan_flat:'Nessuna coppia di aree di colore distinte trovata nell\'immagine: impossibile distinguere terra e mare.', scan_noland:'Nessuna terra trovata nell\'immagine.', scan_failed:'Impossibile completare la scansione.', scan_done:'Scansione completata — {r} fiumi, {l} laghi; {m} simboli della mappa esclusi.', layer_drag_hint:'Trascina da qui per riordinare il livello', blend_sourceover:'Normale', blend_multiply:'Moltiplica', blend_overlay:'Overlay', blend_softlight:'Luce soffusa', blend_screen:'Scherma', nav_home:'Home', nav_canvas:'Tela', nav_tutorial:'Guida', nav_community:'Community', home_tagline:'Un editor di mappe per mondi fantasy, nel browser', home_desc:'Disegna i confini tra terra e mare, colora foreste e montagne, posiziona castelli e villaggi, traccia fiumi e strade — tutto su un\'unica tela, nel browser, senza installazione.', home_cta:'Inizia la tua mappa', home_video_caption:'Video di presentazione in arrivo', canvas_new_title:'Crea una nuova tela', canvas_custom:'Dimensione personalizzata…', canvas_name_ph:'Nome della mappa', canvas_create:'Crea', canvas_import:'Importa da file .json', canvas_saved_title:'Tele salvate', canvas_empty:'Nessuna tela salvata in questo browser. Vengono elencate qui automaticamente quando premi "Salva" nell\'editor.', canvas_open:'Apri', canvas_delete:'Elimina', canvas_delete_confirm:'Eliminare questa tela? L\'operazione non può essere annullata.', canvas_unnamed:'Mappa senza titolo', tutorial_title:'Guida', tutorial_intro:'Ogni strumento nella barra laterale sinistra apre le proprie impostazioni nel pannello destro. Di seguito un breve riepilogo di cosa fa ciascuno strumento.', community_title:'Community', community_desc:'Wayborne Map Editor è un progetto open source in continua evoluzione.', community_github_desc:'Codice sorgente, segnalazioni di bug e contributi', community_soon:'Prossimamente', lib_full:'La memoria del browser è piena — elimina una tela vecchia oppure esportala come .json.', tut_h_select:'Seleziona, sposta e ruota gli oggetti; Shift+clic per la selezione multipla.', tut_h_erase:'Cancella la terra dipinta e la texture del terreno sovrastante in un solo passaggio.', tut_h_fill:'Riempie l\'interno di un contorno costiero chiuso con un clic.', tut_h_river:'Clicca per aggiungere punti e disegnare un fiume; Invio per terminare.', tut_h_road:'Clicca per aggiungere punti e disegnare una strada; Invio per terminare.',
      sym_upload:'+ Carica simbolo PNG', sym_upload_done:'simbolo/i caricato/i', sym_del:'Elimina', sym_search:'Cerca simboli...', sym_recent:'Usati di recente',
      st_pos:'Posizione', st_zoom:'Zoom', st_size:'Tela', st_tool:'Strumento',
      cancel:'Annulla', ok:'OK',
      locked:'Il livello è bloccato o nascosto.', needtext:"Scrivi prima il testo dell'etichetta.", nopathnear:'Nessun fiume/strada trovato nelle vicinanze.', fill_toolarge:'Area troppo grande — prova all\'interno di un confine chiuso.',
      exported:'Esportato:', saved:'Progetto salvato.', loaded:'Progetto caricato.',
      badfile:'File di progetto non valido.', newmap:'Nuova mappa creata.',
      confirmNew:'La mappa attuale verrà eliminata. Scegli una dimensione della tela:',
      confirmSize:'Cambiare la dimensione della tela ridimensiona i livelli esistenti. Continuare?',
      histStart:'Inizio', selNone:'Nessun oggetto selezionato', symbols:'simboli',
      selScale:'Barra della scala selezionata', o_front:'Porta in primo piano', o_back:'Porta sullo sfondo',
      o_fwd:'Avanti di uno', o_bwd:'Indietro di uno',
      o_group:'Raggruppa', o_ungroup:'Separa',
      selMulti:'oggetti selezionati',
      t_lake:'Lago', o_lake:'Lago', h_lake:'Clicca per aggiungere punti, con 3+ punti premi Invio per chiudere.', t_territory:'Territorio', o_territory:'Territorio', o_territorycolor:'Colore di riempimento', o_territorybcolor:'Colore del bordo', h_territory:'Clicca per aggiungere punti, con 3+ punti premi Invio per chiudere.', t_regionlink:'Collegamento regione', h_regionlink:'Clicca sulla mappa e assegna un nome: viene creata una nuova mappa regionale vuota. Fai doppio clic sullo spillo con lo strumento Seleziona per entrarci; usa "Indietro" in alto a sinistra per tornare alla mappa del mondo.', rl_newtitle:'Nuova mappa regionale', rl_placeholder:'Nome della regione', rl_default:'Regione senza nome', rl_open:'Entra nella regione →', bc_back:'Indietro', bc_world:'Mappa del mondo', t_resource:'Risorsa', o_resourcetype:'Tipo', rs_mine:'Miniera', rs_farm:'Terreno agricolo', rs_hunting:'Terreno di caccia', rs_fishing:'Zona di pesca', rs_trade:'Posto di commercio', rs_quarry:'Cava', h_resource:'Clicca sulla mappa per posizionare un indicatore di risorsa del tipo selezionato.',
      o_lakecolor:'Colore del lago',
      o_symbbrush:'Modalità pennello', o_symbdensity:'Densità', o_clipland:'Limita alla terra (pennello)',
      o_windrose:'Rosa dei venti', o_wrvis:'Mostra sulla mappa', o_wrsize:'Dimensione',
      o_wrstyle_classic:'Classico', o_wrstyle_minimal:'Minimalista', o_wrstyle:'Stile', o_wrcolor:'Colore', h_windrose:'Trascina sulla mappa per riposizionarla.',
      o_snap:'Aggancia alla griglia', o_snapsize:'Dimensione griglia', o_frame:'Cornice della mappa', o_frame_none:'Nessuna', o_frame_simple:'Linea semplice', o_frame_rope:'Corda', o_frame_ornate:'Ornata', o_frame_color:'Colore',
      biomegen_empty:'Disegna prima la terra.', o_zonetype:'Tipo di zona', o_zone_none:'— nessuno (regione politica) —', o_zone_war:'Zona di guerra', o_zone_anomaly:'Anomalia', o_zone_forbidden:'Zona proibita', o_zone_hunting:'Riserva di caccia', o_zone_quarantine:'Quarantena', o_zone_sacred:'Luogo sacro', o_zone_trade:'Zona commerciale', h_zonetype:'Una regione con un tipo non appartiene a nessuna delle viste stato/cultura/religione: viene disegnata con il proprio retino in ogni vista.', o_note:'Nota', o_note_ph:'La tua nota su questo oggetto…', o_note_show:'Mostra i segni di nota sulla mappa', o_nb_edit:'Aggiungi la tua cultura', o_nb_name:'Nome della cultura', o_nb_bas:'Sillabe iniziali: Ash, Bram, Dun', o_nb_orta:'Suoni centrali: a, e, i', o_nb_son:'Sillabe finali: ford, dale, ton', o_nb_birlesik:'Composto (Ashford) — disattivato: fluido (Valeria)', o_nb_add:'Aggiungi', o_nb_del:'Elimina la cultura selezionata', h_nb:'La cultura che aggiungi appartiene a questo progetto, viene salvata con il file di progetto e può essere usata anche dal generatore di culture/religioni.', nb_needname:'Scrivi prima un nome per la cultura.', nb_needsyl:'Le sillabe iniziali e finali non possono essere vuote.', nb_builtin:'Le culture predefinite non si possono eliminare.', m_nbadded:'Cultura aggiunta', m_nbdeleted:'Cultura eliminata', o_lgsave:'Salva come modello', o_lgdel:'Elimina modello', o_lgsave_ask:'Dai un nome a questo modello:', o_lgsave_def:'Il mio modello', m_lgsaved:'Modello salvato', h_lgpreset:'Un modello salvato conserva sotto un nome la rugosità attuale e le scelte fiume/lago/terreno e lo aggiunge all’elenco qui sopra; viaggia con il file di progetto.', o_climate:'Clima', o_climate_on:'Usa il modello climatico', o_climate_eq:'Posizione dell’equatore', o_climate_str:'Intensità dell’ombra pluviometrica', o_climate_wind:'Mostra le frecce del vento', h_climate:'Sposta l’equatore dal centro della tela per creare mappe di un solo emisfero o mappe polari. Il vento asciuga le celle dietro le montagne (ombra pluviometrica) e inumidisce quelle davanti — la prossima esecuzione di «Assegna biomi» ne tiene conto.', copied:'Copiato', copy:'Copia', exp_share_embedcode:'Codice di incorporamento (iframe)', exp_share_gen:'🔗 Genera link', exp_share_help:'Nessun server — l\'immagine della mappa è incorporata direttamente nel link (la parte # dell\'URL). Il link non viene mai caricato da nessuna parte a meno che tu non lo invii tu stesso; le mappe grandi generano link più lunghi.', exp_share_link:'Link', exp_share_sizehint:'Lunghezza del link ≈ {kb} KB', exp_share_t:'Link di condivisione', h_biomegen:'Riempie automaticamente il livello del terreno in base ad altitudine e latitudine; sostituisce il livello del terreno attuale.', h_rivergen:'Aggiunge fiumi che scorrono verso il mare a partire dalla griglia di altitudine. Richiede montagne/colline dipinte con il pennello «Rilievo».', h_roadgen:'Traccia strade tra i simboli degli insediamenti (città/paese/villaggio/castello/porto) evitando i pendii ripidi. Collega alcuni punti di terra casuali se non ci sono insediamenti.', h_settlegen:'Distribuisce simboli di città/paese/villaggio su terreno pianeggiante vicino alla costa — il punto migliore riceve un castello/porto, il resto paesi/villaggi. «Genera strade» trova questi simboli e li collega. Ogni insediamento riceve un nome dal repertorio di sillabe della regione culturale in cui si trova.', o_settle_labels:'Scrivi i nomi anche come etichette', lakegen_none:'Nessun punto adatto trovato per un lago.', o_biomegen:'Assegna automaticamente i biomi', o_biomegen_go:'🌍 Assegna biomi', o_landgen_lakes:'Aggiungi laghi', o_landgen_rivers:'Aggiungi fiumi', o_landgen_terrain:'Aggiungi terreno', o_rivergen:'Genera automaticamente i fiumi', o_rivergen_go:'💧 Genera fiumi', o_roadgen:'Genera automaticamente le strade', o_roadgen_go:'🛤️ Genera strade', o_seacolor:'Colore del mare', o_settlegen:'Posiziona automaticamente gli insediamenti', o_settlegen_go:'🏰 Posiziona insediamenti', o_symlegend:'Legenda', panel_toggle_left:'Mostra/nascondi il pannello sinistro', panel_toggle_right:'Mostra/nascondi il pannello destro', regions_maptree:'Albero delle mappe', regions_political:'Regioni politiche', regions_political_empty:'Ancora nessuna regione denominata. Disegna con lo strumento «Territorio», poi assegnale un nome.', rivergen_noelev:'Dipingi prima montagne/colline con il pennello «Rilievo».', rivergen_none:'Nessuna sorgente fluviale adatta trovata.', roadgen_noland:'Non è stata trovata terra/punti sufficienti per le strade.', roadgen_none:'Non è stato possibile generare strade — le masse di terra potrebbero essere separate.', sc_cancel:'Annulla / deseleziona', sc_delete:'Elimina selezione', sc_finish:'Termina il percorso', sc_fit:'Adatta allo schermo', sc_general:'Generale', sc_help:'Apri questa schermata', sc_pan:'Sposta', sc_panfast:'Sposta più velocemente', sc_redo:'Ripeti', sc_rotsym:'Ruota simbolo', sc_save:'Salva', sc_title:'Scorciatoie da tastiera', sc_undo:'Annulla', sc_zoom:'Ingrandisci / riduci', settlegen_noland:'Non è stata trovata terra adatta per gli insediamenti.', settlegen_none:'Non è stato possibile posizionare alcun insediamento.', share_editbtn:'Apri in Wayborne', tab_regions:'Regioni', tab_todo:'Attività', todo_add:'Aggiungi', todo_empty:'Ancora nessuna attività.', todo_placeholder:'Nuova attività...'
    },
    pt: { tut_extras:'Para além das ferramentas — geradores automáticos', tut_extras_d:'Não estão na barra de ferramentas; aparecem no painel da direita quando escolhe a ferramenta correspondente.', o_measurearea:'Fechar como área', tpa_undo:'Desfazer o último ponto', tpa_finish:'Concluir', tpa_cancel:'Cancelar',
      new:'Novo', open:'Abrir', save:'Guardar', parchment:'Pergaminho', grid:'Grelha', shore:'Costa',
      o_gridsec:'Grelha', o_gridtype:'Tipo', o_grid_square:'Quadrado', o_grid_hex:'Hexágono', o_grid_dot:'Ponto', o_gridcell:'Tamanho da célula', o_gridcolor:'Cor', o_gridop:'Intensidade', h_grid:'Ative a grelha na caixa \'Grelha\' no topo. O hexágono é o padrão do RPG de mesa.',
      o_polsec:'Mapa político', o_polmode:'Vista política', o_polmute:'Atenuar textura do terreno', o_pollegend:'Mostrar legenda', o_polfill:'Intensidade do preenchimento', o_polcolors:'Atribuir cores dos estados', o_polname:'Nome da região selecionada', o_polname_ph:'Nome do estado', h_political:'A vista política não é uma camada separada; apresenta as regiões desenhadas como estados.', o_stategensec:'Geração de estados e culturas', o_polmodesel:'Vista', o_polmode_state:'Estados', o_polmode_culture:'Culturas', o_stcount:'Número de estados', o_stvariety:'Variedade de tamanho', o_stategen_go:'👑 Gerar estados', h_stategen:'Gera fronteiras de estados que crescem simultaneamente a partir de cada capital e se encaixam perfeitamente entre si. Mantém as suas regiões desenhadas à mão, adiciona-se a elas.', o_cucount:'Número de culturas', o_culturegen_go:'🎭 Gerar culturas', h_culturegen:'Gera regiões culturais que crescem na sua própria grelha, independentemente das fronteiras dos estados — alterne entre a apresentação de estados/culturas com o seletor "Vista" acima.', o_stedit:'Região selecionada', h_stedit_none:'Selecione uma região no mapa ou no separador "Regiões" à direita para a editar.', o_stgov:'Forma de governo', o_stcapital:'Capital', o_stcapital_pick:'Escolher a capital no mapa', o_stcapital_cancel:'Cancelar a escolha da capital', o_stmake:'Converter em estado', o_stunmake:'Remover o estatuto de estado', o_stemblem:'Brasão', o_stemblem_gen:'Gerar brasão', o_stemblem_reroll:'Gerar de novo', o_stemblem_png:'Descarregar PNG', o_stemblem_clear:'Remover brasão', h_stemblem:'O brasão é desenhado em código; a semente é guardada com o estado, pelo que a mesma semente dá sempre o mesmo brasão. Aparece junto à capital na vista política.', o_polemblem:'Mostrar brasões', m_emblem:'Brasão gerado', h_stedit:'Ao converter uma região desenhada à mão num estado, esta recebe um nome, uma forma de governo e uma capital; passa depois a ser listada e colorida como um estado gerado.', m_stmade:'Região convertida em estado', m_stunmade:'A região já não é um estado', m_capitalpick:'Clique na posição da capital no mapa (Esc para cancelar)', st_capital_sea:'A capital tem de estar em terra firme.', st_capital_set:'Capital deslocada', o_provcount:'Províncias por estado', o_provgen_go:'Gerar províncias', h_provgen:'Divide as fronteiras de cada estado em sub-regiões; o limite de uma província nunca sai do estado a que pertence.', m_provgen:'províncias geradas', prov_nostate:'Gere estados primeiro — as províncias são subdivisões dos estados.', prov_none:'Não foi possível gerar províncias (estados demasiado pequenos).', o_diplosec:'Diplomacia', h_diplo_none:'São necessários pelo menos dois estados para definir relações.', o_diplo_a:'Estado A', o_diplo_b:'Estado B', o_diplo_rel:'Relação', rel_peace:'Paz', rel_alliance:'Aliança', rel_war:'Guerra', rel_vassal:'Vassalagem', diplo_same:'Um estado não pode ter uma relação consigo próprio.', o_polmode_religion:'Religiões', o_recount:'Número de religiões', o_religiongen_go:'Gerar religiões', m_religiongen:'regiões religiosas geradas', o_citysec:'Geração de cidade', h_city_nosel:'Selecione primeiro uma região — a cidade é gerada dentro dos seus limites.', o_citydistrict:'Tipo de bairro', o_citybuildings:'Número de edifícios', o_citystreet:'Largura das ruas', o_citywall:'Adicionar muralhas e portas', o_citygen_go:'Gerar cidade', h_citygen:'Divide a região selecionada em quarteirões com avenidas e ruelas, depois os quarteirões em lotes, e coloca em cada lote um edifício adequado ao tipo de bairro, com a fachada virada para a rua mais próxima. Desfaz-se num único passo.', m_citygen:'edifícios colocados', city_noarea:'Selecione primeiro uma região onde a cidade caiba.', city_small:'A região selecionada é demasiado pequena para uma cidade.', dist_craftsmen:'Artesãos', dist_market:'Mercado', dist_noble:'Nobre', dist_slum:'Bairro pobre', dist_temple:'Templo', dist_harbour:'Porto', accent_t:'Cor de destaque da interface (clique direito: repor)', o_speak:'Ler o nome em voz alta', url_generated:'Mapa gerado a partir da semente da ligação', url_badtemplate:'O modelo indicado na ligação não é válido.', exp_gis_t:'Exportar os dados vetoriais como GeoJSON (QGIS, etc.)', gis_done:'objetos exportados como GeoJSON', gis_empty:'Não há objetos vetoriais para exportar.', m_stategen:'estados gerados', m_culturegen:'regiões culturais geradas', stategen_noland:'Terra insuficiente para gerar estados.', stategen_none:'Não foi possível gerar estados/culturas.', gov_kingdom:'Reino', gov_empire:'Império', gov_theocracy:'Teocracia', gov_republic:'República', gov_confederation:'Confederação', gov_citystate:'Cidade-estado', m_polon:'Vista política ativa', m_poloff:'Vista física', m_polcolored:'regiões coloridas', m_polempty:'Desenhe primeiro uma região',
      o_nameculture:'Cultura', o_namefeature:'Tipo', o_namegen:'🎲 Sugerir nome', o_nf_settlement:'Povoação', o_nf_city:'Cidade', o_nf_river:'Rio', o_nf_mountain:'Montanha', o_nf_forest:'Floresta', o_nf_region:'Região', o_nf_lake:'Lago', o_nf_sea:'Mar',
      tpl_title:'Começar por um modelo', tpl_desc:'Comece com uma linha costeira pronta e construa o seu mundo por cima.', tpl_ready:'tela pronta',
      tpl_continent:'Continente', tpl_continent_d:'Vasta massa de terra com costas recortadas', tpl_island:'Ilha', tpl_island_d:'Uma grande ilha em mar aberto', tpl_archipelago:'Arquipélago', tpl_archipelago_d:'Ilhas dispersas e estreitos rasos', tpl_kingdom:'Reino', tpl_kingdom_d:'Costas suaves, interior cultivável', tpl_battle:'Mapa de batalha', tpl_battle_d:'Terreno pequeno com grelha hexagonal', tpl_blank:'Tela vazia', tpl_blank_d:'Começar do zero',
      o_outlinecolor:'Cor do contorno',
      exp_html_t:'HTML em ficheiro único', exp_print_t:'Imprimir / PDF', exp_png2_t:'Resolução 2×', exp_png4_t:'Resolução 4×', exp_maxdim:'Lado mais longo', exp_format:'Formato', exp_fmt_png:'PNG · nítido, ficheiro grande', exp_fmt_jpeg:'JPEG · ficheiro pequeno', exp_title:'Título', exp_html_help:'Transfere um único ficheiro .html com o mapa e um pequeno visualizador embutido. Não precisa de servidor — envie o ficheiro e faça duplo clique.', exp_page:'Tamanho da página', exp_orient:'Orientação', exp_portrait:'Retrato', exp_landscape:'Paisagem', exp_margin:'Margem', exp_dpi:'Resolução', exp_dpi_screen:'ecrã', exp_dpi_normal:'impressão normal', exp_dpi_high:'alta qualidade', exp_print_help:'Abre a janela de impressão do navegador. A partir daí pode imprimir ou escolher «Guardar como PDF».', printing:'A preparar a impressão', print_failed:'Não foi possível abrir a janela de impressão', viewer_hint:'arrastar · roda · duplo clique', viewer_in:'Aproximar', viewer_out:'Afastar', viewer_fit:'Ajustar',
      t_sketch:'Esboço', o_sketch:'Esboço', h_sketch:'Um pincel livre que só desenha nas camadas que você adiciona. Adicione uma com «+ Adicionar camada» no painel de camadas, selecione-a na lista e depois desenhe no mapa.', o_hardness:'Dureza', o_sketch_eraser:'Modo borracha', sketch_target:'Camada de destino', sketch_need_layer:'Adicione primeiro a sua própria camada e selecione-a na lista', layer_add:'+ Adicionar camada', h_add_layer:'As camadas que você adiciona servem para desenho livre; pinte nelas com a ferramenta «Esboço».', layer_added:'Camada adicionada', layer_untitled:'Camada', layer_max:'No máximo 12 camadas de utilizador', layer_rename:'Nome da camada', layer_rename_hint:'Faça duplo clique para renomear', layer_delete:'Apagar camada', layer_delete_confirm:'Apagar esta camada e tudo o que está desenhado nela?', tut_h_sketch:'Desenha à mão livre nas camadas que você adiciona; cor, tamanho, dureza, opacidade e modo borracha ajustáveis.',
      o_typography:'Tipografia', o_font:'Tipo de letra', o_banner:'Faixa', o_banner_none:'Nenhuma', o_banner_ribbon:'Fita', o_banner_plate:'Placa', o_banner_scroll:'Pergaminho', o_banner_stone:'Pedra', o_caps:'Maiúsculas', o_outline:'Contorno', o_shadow:'Sombra', h_font_missing:'Este tipo de letra não está instalado neste dispositivo; é usado o mais próximo. As entradas marcadas com · estão instaladas.',
      grp_navigate:'Navegação', grp_terrain:'Terreno', grp_water:'Água e Rotas', grp_markers:'Marcadores', grp_regions:'Regiões e Medida',
      t_select:'Selecionar', t_landmass:'Terra', t_erase:'Mar', t_fill:'Preencher', t_terrain:'Terreno', t_symbol:'Símbolo',
      t_river:'Rio', t_road:'Estrada', t_label:'Etiqueta', t_pan:'Deslocar', t_eyedrop:'Amostra', t_measure:'Medir', h_measure:'Clique para adicionar pontos e medir uma distância em vários segmentos. Enter / duplo clique para terminar, Esc para cancelar. As linhas de medição podem ser selecionadas, movidas ou eliminadas; são excluídas da exportação PNG/SVG.', t_lasso:'Laço', h_lasso:'Arraste para desenhar uma área fechada: Terra + Terreno + Relevo são levantados juntos nessa área e tornam-se móveis. Arraste para mover, use a pega superior para rodar. Enter para confirmar, Esc para cancelar, Delete para eliminar a área por completo.',
      o_landmass:'Terra / Costa', o_brushsize:'Tamanho do pincel', o_rough:'Irregularidade da costa',
      o_landcolor:'Cor da terra', o_shorew:'Largura da costa', o_shorestyle:'Estilo da costa', o_shore_sandy:'Arenosa', o_shore_rocky:'Rochosa', o_shore_reef:'Recife',
      o_smooth:'Suavizar costa', o_clearland:'Limpar terra',
      h_landmass:'Arraste para pintar terra. A ferramenta «Mar» apaga a terra e o terreno em simultâneo.', o_landgen:'Gerar terra aleatória', o_landgentpl:'Modelo', o_landgen_continent:'Continente', o_landgen_island:'Ilha', o_landgen_archipelago:'Arquipélago', o_landgenrough:'Detalhe / rugosidade', o_landgen_go:'Gerar', h_landgen:'Substitui a camada de terra atual. Clique novamente com as mesmas definições para um novo resultado aleatório.',
      o_terrain:'Pintura de terreno', o_opacity:'Opacidade', o_clip:'Pintar só sobre terra',
      o_clearterrain:'Limpar camada de terreno',
      h_terrain:'Os motivos são espalhados aleatoriamente a cada pincelada — sem padrões repetidos.', t_elevation:'Relevo', o_elevation:'Relevo', o_elevstrength:'Intensidade', o_elevlower:'Modo de rebaixar', o_clearelevation:'Limpar relevo', o_elevdisplay:'Visualização', o_elevhillshade:'Sombreamento (hillshade)', o_elevcontours:'Linhas de contorno', o_contourinterval:'Intervalo das curvas', h_elevation:'Arraste para elevar o terreno; ative o "modo de rebaixar" para escavá-lo. O sombreamento atualiza-se automaticamente.',
      o_symbol:'Símbolo', o_size:'Tamanho', o_rot:'Rotação', o_hue:'Matiz',
      o_wear:'Desgaste', o_jitter:'Colocação aleatória',
      h_symbol:'Escolha um símbolo na biblioteca, clique no mapa. Use «Selecionar» para mover; Delete para apagar.',
      o_river:'Rio', o_width:'Largura', o_meander:'Meandro',
      o_taper:'Afinar na nascente', o_color:'Cor',
      h_path:'Clique para adicionar pontos. Enter / duplo clique para terminar, Esc para cancelar.',
      o_road:'Estrada / Rota de caravanas',
      o_label:'Etiqueta', o_preset:'Estilo predefinido', o_curve:'Curvatura', o_track:'Espaçamento das letras', o_snappath:'Ajustar ao trajeto (rio/estrada)',
      h_label:'Escolha um estilo, escreva o texto, clique no mapa. Aplica-se de imediato à etiqueta selecionada.',
      o_eyedrop:'Amostrador de textura', o_eye_nosample:'Ainda sem amostra',
      o_eye_radius:'Raio de amostragem', o_eye_brush:'Tamanho do pincel',
      o_eye_pick:'① Escolher área', o_eye_paint:'② Começar a pintar', o_eye_clear:'Limpar amostra',
      h_eyedrop:'① Escolher área: arraste para desenhar um círculo. ② Pintar: aplica a textura ao mapa.',
      eyeOk:'✓ Textura amostrada', eyeFail:'Falha na amostragem — tente sobre terra/terreno.',
      eyePick:'Clique e arraste no mapa → defina o tamanho do círculo → solte.',
      eyePaint:'Clique e arraste no mapa → a textura é aplicada.',
      eyeNeed:'Primeiro faça uma amostra com ① Escolher área.',
      o_selection:'Seleção', o_nosel:'Nada selecionado', o_dup:'Duplicar', o_del:'Apagar',
      o_scalebar:'Barra de escala', o_scvis:'Mostrar no mapa', o_sclen:'Comprimento',
      o_scsize:'Tamanho do texto', o_scsegs:'Segmentos',
      h_scale:'Arraste a barra de escala no mapa para a reposicionar.',
      o_view:'Vista', o_fit:'Ajustar ao ecrã', o_100:'100%',
      h_pan:'Clique direito + arrastar, clique do meio, Espaço + arrastar, ou setas para deslocar.',
      tab_layers:'Camadas', tab_library:'Biblioteca', tab_history:'Histórico',
      ref_title:'Imagem de referência', ref_export:'Incluir na exportação', ref_clear:'Remover referência', ref_trace:'Modo de decalque (mostrar por cima + fixação ao litoral)', ref_scan:'⌖ Digitalizar geografia', h_ref_scan:'Extrai o litoral, os lagos e os rios da imagem de referência. Símbolos do mapa como cidades e montanhas não entram na geografia — o terreno por baixo continua sem interrupção. Substitui a terra atual.', scan_title:'A digitalizar o mapa', scan_cancel:'Cancelar', scan_prepare:'A preparar a imagem', scan_markers:'A separar os símbolos do mapa', scan_clean:'A completar o terreno sob os símbolos', scan_coast:'A extrair o litoral', scan_water:'A separar rios e lagos', scan_commit:'A escrever nas camadas', scan_noimage:'Carregue primeiro uma imagem de referência.', scan_flat:'Não foram encontradas duas zonas de cor distintas na imagem — não é possível separar terra e mar.', scan_noland:'Não foi encontrada terra na imagem.', scan_failed:'Não foi possível concluir a digitalização.', scan_done:'Digitalização concluída — {r} rios, {l} lagos; {m} símbolos do mapa excluídos.', layer_drag_hint:'Arraste a partir daqui para reordenar a camada', blend_sourceover:'Normal', blend_multiply:'Multiplicar', blend_overlay:'Sobrepor', blend_softlight:'Luz suave', blend_screen:'Ecrã', nav_home:'Início', nav_canvas:'Tela', nav_tutorial:'Tutorial', nav_community:'Comunidade', home_tagline:'Um editor de mapas para mundos de fantasia, no navegador', home_desc:'Desenha as fronteiras entre terra e mar, pinta florestas e montanhas, posiciona castelos e aldeias, traça rios e estradas — tudo numa só tela, no navegador, sem instalação.', home_cta:'Começa o teu mapa', home_video_caption:'Vídeo de apresentação brevemente', canvas_new_title:'Criar nova tela', canvas_custom:'Tamanho personalizado…', canvas_name_ph:'Nome do mapa', canvas_create:'Criar', canvas_import:'Importar de ficheiro .json', canvas_saved_title:'Telas guardadas', canvas_empty:'Ainda não há telas guardadas neste navegador. São listadas aqui automaticamente ao clicar em "Guardar" no editor.', canvas_open:'Abrir', canvas_delete:'Eliminar', canvas_delete_confirm:'Eliminar esta tela? Esta ação não pode ser desfeita.', canvas_unnamed:'Mapa sem título', tutorial_title:'Tutorial', tutorial_intro:'Cada ferramenta na barra lateral esquerda abre as suas próprias definições no painel direito. Abaixo, um breve resumo do que cada uma faz.', community_title:'Comunidade', community_desc:'Wayborne Map Editor é um projeto de código aberto em constante evolução.', community_github_desc:'Código-fonte, relatórios de erros e contribuições', community_soon:'Brevemente', lib_full:'O armazenamento do navegador está cheio — elimina uma tela antiga ou exporta-a como .json.', tut_h_select:'Seleciona, move e roda objetos; Shift+clique para seleção múltipla.', tut_h_erase:'Apaga a terra pintada e a textura de terreno sobre ela, num só passo.', tut_h_fill:'Preenche o interior de um contorno costeiro fechado com um clique.', tut_h_river:'Clica para adicionar pontos e desenhar um rio; Enter para terminar.', tut_h_road:'Clica para adicionar pontos e desenhar uma estrada; Enter para terminar.',
      sym_upload:'+ Carregar símbolo PNG', sym_upload_done:'símbolo(s) carregado(s)', sym_del:'Apagar', sym_search:'Pesquisar símbolos...', sym_recent:'Usados recentemente',
      st_pos:'Posição', st_zoom:'Zoom', st_size:'Tela', st_tool:'Ferramenta',
      cancel:'Cancelar', ok:'OK',
      locked:'A camada está bloqueada ou oculta.', needtext:'Escreva primeiro o texto da etiqueta.', nopathnear:'Nenhum rio/estrada encontrado nas proximidades.', fill_toolarge:'Área demasiado grande — tente dentro de um limite fechado.',
      exported:'Exportado:', saved:'Projeto guardado.', loaded:'Projeto carregado.',
      badfile:'Ficheiro de projeto inválido.', newmap:'Novo mapa criado.',
      confirmNew:'O mapa atual será descartado. Escolha um tamanho de tela:',
      confirmSize:'Alterar o tamanho da tela redimensiona as camadas existentes. Continuar?',
      histStart:'Início', selNone:'Nada selecionado', symbols:'símbolos',
      selScale:'Barra de escala selecionada', o_front:'Trazer para a frente', o_back:'Enviar para trás',
      o_fwd:'Avançar', o_bwd:'Recuar',
      o_group:'Agrupar', o_ungroup:'Desagrupar',
      selMulti:'objetos selecionados',
      t_lake:'Lago', o_lake:'Lago', h_lake:'Clique para adicionar pontos; com 3+ pontos, prima Enter para fechar.', t_territory:'Território', o_territory:'Território', o_territorycolor:'Cor de preenchimento', o_territorybcolor:'Cor do contorno', h_territory:'Clique para adicionar pontos; com 3+ pontos, prima Enter para fechar.', t_regionlink:'Ligação de região', h_regionlink:'Clique no mapa e dê um nome: é criado um novo mapa de região em branco. Faça duplo clique no marcador com a ferramenta Selecionar para entrar; use "Voltar" no canto superior esquerdo para regressar ao mapa do mundo.', rl_newtitle:'Novo mapa de região', rl_placeholder:'Nome da região', rl_default:'Região sem nome', rl_open:'Entrar na região →', bc_back:'Voltar', bc_world:'Mapa do mundo', t_resource:'Recurso', o_resourcetype:'Tipo', rs_mine:'Mina', rs_farm:'Terra agrícola', rs_hunting:'Terreno de caça', rs_fishing:'Zona de pesca', rs_trade:'Posto de comércio', rs_quarry:'Pedreira', h_resource:'Clique no mapa para colocar um marcador de recurso do tipo selecionado.',
      o_lakecolor:'Cor do lago',
      o_symbbrush:'Modo pincel', o_symbdensity:'Densidade', o_clipland:'Restringir à terra (pincel)',
      o_windrose:'Rosa dos ventos', o_wrvis:'Mostrar no mapa', o_wrsize:'Tamanho',
      o_wrstyle_classic:'Clássico', o_wrstyle_minimal:'Minimalista', o_wrstyle:'Estilo', o_wrcolor:'Cor', h_windrose:'Arraste no mapa para reposicionar.',
      o_snap:'Alinhar à grelha', o_snapsize:'Tamanho da grelha', o_frame:'Moldura do mapa', o_frame_none:'Nenhuma', o_frame_simple:'Linha simples', o_frame_rope:'Corda', o_frame_ornate:'Ornamentada', o_frame_color:'Cor',
      biomegen_empty:'Desenhe primeiro a terra.', o_zonetype:'Tipo de zona', o_zone_none:'— nenhum (região política) —', o_zone_war:'Zona de guerra', o_zone_anomaly:'Anomalia', o_zone_forbidden:'Zona proibida', o_zone_hunting:'Coutada de caça', o_zone_quarantine:'Quarentena', o_zone_sacred:'Lugar sagrado', o_zone_trade:'Zona comercial', h_zonetype:'Uma região com tipo não pertence a nenhuma das vistas de estado/cultura/religião; é desenhada com a sua própria trama em todas as vistas.', o_note:'Nota', o_note_ph:'A sua nota sobre este objeto…', o_note_show:'Mostrar marcas de nota no mapa', o_nb_edit:'Adicione a sua própria cultura', o_nb_name:'Nome da cultura', o_nb_bas:'Sílabas iniciais: Ash, Bram, Dun', o_nb_orta:'Sons intermédios: a, e, i', o_nb_son:'Sílabas finais: ford, dale, ton', o_nb_birlesik:'Composto (Ashford) — desligado: fluido (Valeria)', o_nb_add:'Adicionar', o_nb_del:'Eliminar a cultura selecionada', h_nb:'A cultura que adicionar pertence a este projeto, é guardada com o ficheiro do projeto e também pode ser usada pelo gerador de culturas/religiões.', nb_needname:'Escreva primeiro um nome de cultura.', nb_needsyl:'As sílabas iniciais e finais não podem estar vazias.', nb_builtin:'As culturas integradas não podem ser eliminadas.', m_nbadded:'Cultura adicionada', m_nbdeleted:'Cultura eliminada', o_lgsave:'Guardar como modelo', o_lgdel:'Eliminar modelo', o_lgsave_ask:'Dê um nome a este modelo:', o_lgsave_def:'O meu modelo', m_lgsaved:'Modelo guardado', h_lgpreset:'Um modelo guardado conserva sob um nome a rugosidade atual e as escolhas de rio/lago/terreno e acrescenta-o à lista acima; viaja com o ficheiro do projeto.', o_climate:'Clima', o_climate_on:'Usar o modelo climático', o_climate_eq:'Posição do equador', o_climate_str:'Intensidade da sombra de chuva', o_climate_wind:'Mostrar as setas de vento', h_climate:'Desloque o equador do centro da tela para criar mapas de um só hemisfério ou mapas polares. O vento seca as células atrás das montanhas (sombra de chuva) e humedece as que estão à frente — a próxima execução de «Atribuir biomas» tem isto em conta.', copied:'Copiado', copy:'Copiar', exp_share_embedcode:'Código de incorporação (iframe)', exp_share_gen:'🔗 Gerar link', exp_share_help:'Sem servidor — a imagem do mapa é incorporada diretamente no link (a parte # do URL). O link nunca é enviado para lado nenhum a menos que o envies tu próprio; mapas grandes geram links mais longos.', exp_share_link:'Link', exp_share_sizehint:'Comprimento do link ≈ {kb} KB', exp_share_t:'Link de partilha', h_biomegen:'Preenche automaticamente a camada de terreno com base na altitude e na latitude; substitui a camada de terreno atual.', h_rivergen:'Adiciona rios que fluem até ao mar a partir da grelha de altitude. Requer montanhas/colinas pintadas com o pincel «Relevo».', h_roadgen:'Traça estradas entre os símbolos de povoações (cidade/vila/aldeia/castelo/porto) evitando declives acentuados. Liga alguns pontos de terra aleatórios se não houver povoações.', h_settlegen:'Distribui símbolos de cidade/vila/aldeia em terreno plano perto da costa — o melhor local recebe um castelo/porto, os restantes vilas/aldeias. «Gerar estradas» encontra estes símbolos e liga-os. Cada povoação recebe um nome a partir do repertório de sílabas da região cultural onde se encontra.', o_settle_labels:'Escrever também os nomes como etiquetas', lakegen_none:'Não foi encontrado um local adequado para um lago.', o_biomegen:'Atribuir biomas automaticamente', o_biomegen_go:'🌍 Atribuir biomas', o_landgen_lakes:'Adicionar lagos', o_landgen_rivers:'Adicionar rios', o_landgen_terrain:'Adicionar terreno', o_rivergen:'Gerar rios automaticamente', o_rivergen_go:'💧 Gerar rios', o_roadgen:'Gerar estradas automaticamente', o_roadgen_go:'🛤️ Gerar estradas', o_seacolor:'Cor do mar', o_settlegen:'Colocar povoações automaticamente', o_settlegen_go:'🏰 Colocar povoações', o_symlegend:'Legenda', panel_toggle_left:'Mostrar/ocultar o painel esquerdo', panel_toggle_right:'Mostrar/ocultar o painel direito', regions_maptree:'Árvore de mapas', regions_political:'Regiões políticas', regions_political_empty:'Ainda não há regiões com nome. Desenha com a ferramenta «Território» e depois dá-lhe um nome.', rivergen_noelev:'Pinta primeiro montanhas/colinas com o pincel «Relevo».', rivergen_none:'Não foi encontrada uma nascente adequada.', roadgen_noland:'Não foi encontrada terra/pontos suficientes para estradas.', roadgen_none:'Não foi possível gerar estradas — as massas de terra podem estar desligadas entre si.', sc_cancel:'Cancelar / desmarcar seleção', sc_delete:'Eliminar seleção', sc_finish:'Terminar o traçado', sc_fit:'Ajustar ao ecrã', sc_general:'Geral', sc_help:'Abrir este ecrã', sc_pan:'Deslocar', sc_panfast:'Deslocar mais depressa', sc_redo:'Refazer', sc_rotsym:'Rodar símbolo', sc_save:'Guardar', sc_title:'Atalhos de teclado', sc_undo:'Desfazer', sc_zoom:'Aumentar / diminuir zoom', settlegen_noland:'Não foi encontrada terra adequada para povoações.', settlegen_none:'Não foi possível colocar nenhuma povoação.', share_editbtn:'Abrir no Wayborne', tab_regions:'Regiões', tab_todo:'Tarefas', todo_add:'Adicionar', todo_empty:'Ainda não há tarefas.', todo_placeholder:'Nova tarefa...'
    },
    nl: { tut_extras:'Verder dan de gereedschappen — automatische generatoren', tut_extras_d:'Deze staan niet op de gereedschapsbalk; ze verschijnen in het rechterpaneel wanneer je het bijbehorende gereedschap kiest.', o_measurearea:'Als gebied sluiten', tpa_undo:'Laatste punt ongedaan maken', tpa_finish:'Voltooien', tpa_cancel:'Annuleren',
      new:'Nieuw', open:'Openen', save:'Opslaan', parchment:'Perkament', grid:'Raster', shore:'Kust',
      o_gridsec:'Raster', o_gridtype:'Type', o_grid_square:'Vierkant', o_grid_hex:'Zeshoek', o_grid_dot:'Punt', o_gridcell:'Celgrootte', o_gridcolor:'Kleur', o_gridop:'Sterkte', h_grid:'Schakel het raster in via het vakje \'Raster\' bovenaan. Zeshoeken zijn de standaard bij tafelrollenspellen.',
      o_polsec:'Politieke kaart', o_polmode:'Politieke weergave', o_polmute:'Terreintextuur dempen', o_pollegend:'Legenda tonen', o_polfill:'Vulsterkte', o_polcolors:'Staatskleuren automatisch toewijzen', o_polname:'Naam van geselecteerde regio', o_polname_ph:'Staatsnaam', h_political:'De politieke weergave is geen aparte laag; ze toont je regio\'s als staten.', o_stategensec:'Staten- & cultuurgeneratie', o_polmodesel:'Weergave', o_polmode_state:'Staten', o_polmode_culture:'Culturen', o_stcount:'Aantal staten', o_stvariety:'Groottevariatie', o_stategen_go:'👑 Staten genereren', h_stategen:'Genereert staatsgrenzen die gelijktijdig vanaf elke hoofdstad groeien en precies op elkaar aansluiten. Behoudt je handgetekende regio\'s, voegt eraan toe.', o_cucount:'Aantal culturen', o_culturegen_go:'🎭 Culturen genereren', h_culturegen:'Genereert cultuurregio\'s die op hun eigen raster groeien, onafhankelijk van staatsgrenzen — wissel met de "Weergave"-keuze hierboven tussen staten-/cultuurpresentatie.', o_stedit:'Geselecteerde regio', h_stedit_none:'Selecteer een regio op de kaart of in het tabblad "Regio\'s" rechts om deze te bewerken.', o_stgov:'Regeringsvorm', o_stcapital:'Hoofdstad', o_stcapital_pick:'Hoofdstad op de kaart kiezen', o_stcapital_cancel:'Hoofdstadkeuze annuleren', o_stmake:'Omzetten naar staat', o_stunmake:'Staatsstatus verwijderen', o_stemblem:'Wapenschild', o_stemblem_gen:'Wapen genereren', o_stemblem_reroll:'Opnieuw genereren', o_stemblem_png:'PNG downloaden', o_stemblem_clear:'Wapen verwijderen', h_stemblem:'Het wapen wordt in code getekend; de seed wordt met de staat opgeslagen, dezelfde seed geeft altijd hetzelfde wapen. Te zien naast de hoofdstad in de politieke weergave.', o_polemblem:'Wapenschilden tonen', m_emblem:'Wapen gegenereerd', h_stedit:'Als je een handgetekende regio omzet naar een staat, krijgt deze een naam, een regeringsvorm en een hoofdstad; daarna wordt hij net als een gegenereerde staat weergegeven en ingekleurd.', m_stmade:'Regio omgezet naar een staat', m_stunmade:'Regio is geen staat meer', m_capitalpick:'Klik op de plek van de hoofdstad op de kaart (Esc om te annuleren)', st_capital_sea:'De hoofdstad moet op het land liggen.', st_capital_set:'Hoofdstad verplaatst', o_provcount:'Provincies per staat', o_provgen_go:'Provincies genereren', h_provgen:'Verdeelt de grenzen van elke staat in deelgebieden; een provinciegrens komt nooit buiten de staat waartoe zij behoort.', m_provgen:'provincies gegenereerd', prov_nostate:'Genereer eerst staten — provincies zijn onderverdelingen van staten.', prov_none:'Kon geen provincies genereren (staten te klein).', o_diplosec:'Diplomatie', h_diplo_none:'Er zijn minstens twee staten nodig om relaties te bepalen.', o_diplo_a:'Staat A', o_diplo_b:'Staat B', o_diplo_rel:'Relatie', rel_peace:'Vrede', rel_alliance:'Bondgenootschap', rel_war:'Oorlog', rel_vassal:'Vazalschap', diplo_same:'Een staat kan geen relatie met zichzelf hebben.', o_polmode_religion:'Religies', o_recount:'Aantal religies', o_religiongen_go:'Religies genereren', m_religiongen:'religiegebieden gegenereerd', o_citysec:'Stadsgeneratie', h_city_nosel:'Selecteer eerst een regio — de stad wordt binnen de grenzen ervan gegenereerd.', o_citydistrict:'Wijktype', o_citybuildings:'Aantal gebouwen', o_citystreet:'Straatbreedte', o_citywall:'Muren en poorten toevoegen', o_citygen_go:'Stad genereren', h_citygen:'Verdeelt de gekozen regio met lanen en straatjes in blokken, de blokken in percelen, en plaatst op elk perceel een gebouw dat bij het wijktype past, met de voorkant naar de dichtstbijzijnde straat. In één stap ongedaan te maken.', m_citygen:'gebouwen geplaatst', city_noarea:'Selecteer eerst een regio waar de stad in past.', city_small:'De geselecteerde regio is te klein voor een stad.', dist_craftsmen:'Ambachtslieden', dist_market:'Markt', dist_noble:'Adel', dist_slum:'Achterbuurt', dist_temple:'Tempel', dist_harbour:'Haven', accent_t:'Accentkleur van de interface (rechtsklik: herstellen)', o_speak:'Naam voorlezen', url_generated:'Kaart gegenereerd uit de seed in de link', url_badtemplate:'Het sjabloon in de link is niet geldig.', exp_gis_t:'Vectorgegevens als GeoJSON exporteren (QGIS enz.)', gis_done:'objecten geëxporteerd als GeoJSON', gis_empty:'Geen vectorobjecten om te exporteren.', m_stategen:'staten gegenereerd', m_culturegen:'cultuurregio\'s gegenereerd', stategen_noland:'Niet genoeg land om staten te genereren.', stategen_none:'Kon geen staten/culturen genereren.', gov_kingdom:'Koninkrijk', gov_empire:'Keizerrijk', gov_theocracy:'Theocratie', gov_republic:'Republiek', gov_confederation:'Confederatie', gov_citystate:'Stadstaat', m_polon:'Politieke weergave aan', m_poloff:'Fysieke weergave', m_polcolored:'regio\'s gekleurd', m_polempty:'Teken eerst een regio',
      o_nameculture:'Cultuur', o_namefeature:'Type', o_namegen:'🎲 Naam voorstellen', o_nf_settlement:'Nederzetting', o_nf_city:'Stad', o_nf_river:'Rivier', o_nf_mountain:'Berg', o_nf_forest:'Bos', o_nf_region:'Regio', o_nf_lake:'Meer', o_nf_sea:'Zee',
      tpl_title:'Begin met een sjabloon', tpl_desc:'Start met een kant-en-klare kustlijn en bouw daarop je wereld.', tpl_ready:'canvas klaar',
      tpl_continent:'Continent', tpl_continent_d:'Brede landmassa met grillige kusten', tpl_island:'Eiland', tpl_island_d:'Eén groot eiland in open zee', tpl_archipelago:'Archipel', tpl_archipelago_d:'Verspreide eilanden en ondiepe zeestraten', tpl_kingdom:'Koninkrijk', tpl_kingdom_d:'Zachte kusten, vruchtbaar achterland', tpl_battle:'Slagveldkaart', tpl_battle_d:'Klein terrein met hexraster', tpl_blank:'Leeg canvas', tpl_blank_d:'Helemaal opnieuw beginnen',
      o_outlinecolor:'Omlijningskleur',
      exp_html_t:'HTML in één bestand', exp_print_t:'Afdrukken / PDF', exp_png2_t:'2× resolutie', exp_png4_t:'4× resolutie', exp_maxdim:'Langste zijde', exp_format:'Formaat', exp_fmt_png:'PNG · scherp, groot bestand', exp_fmt_jpeg:'JPEG · klein bestand', exp_title:'Titel', exp_html_help:'Downloadt één .html-bestand met de kaart en een kleine viewer erin. Geen server nodig — stuur het bestand en dubbelklik erop.', exp_page:'Paginaformaat', exp_orient:'Richting', exp_portrait:'Staand', exp_landscape:'Liggend', exp_margin:'Marge', exp_dpi:'Resolutie', exp_dpi_screen:'scherm', exp_dpi_normal:'normale afdruk', exp_dpi_high:'hoge kwaliteit', exp_print_help:'Opent het afdrukvenster van de browser. Daar kun je afdrukken of “Opslaan als pdf” kiezen.', printing:'Afdruk wordt voorbereid', print_failed:'Kon het afdrukvenster niet openen', viewer_hint:'slepen · wiel · dubbelklik', viewer_in:'Inzoomen', viewer_out:'Uitzoomen', viewer_fit:'Passend',
      t_sketch:'Schets', o_sketch:'Schets', h_sketch:'Een vrije-handpenseel dat alleen tekent op lagen die je zelf toevoegt. Voeg er een toe met “+ Laag toevoegen” in het lagenpaneel, selecteer hem in de lijst en teken dan op de kaart.', o_hardness:'Hardheid', o_sketch_eraser:'Gummodus', sketch_target:'Doellaag', sketch_need_layer:'Voeg eerst je eigen laag toe en selecteer hem in de lijst', layer_add:'+ Laag toevoegen', h_add_layer:'Lagen die je zelf toevoegt zijn voor vrij tekenen; schilder erop met het gereedschap “Schets”.', layer_added:'Laag toegevoegd', layer_untitled:'Laag', layer_max:'Maximaal 12 eigen lagen', layer_rename:'Laagnaam', layer_rename_hint:'Dubbelklik om te hernoemen', layer_delete:'Laag verwijderen', layer_delete_confirm:'Deze laag en alles wat erop getekend is verwijderen?', tut_h_sketch:'Tekent uit de vrije hand op lagen die je zelf toevoegt; kleur, grootte, hardheid, dekking en een gummodus zijn instelbaar.',
      o_typography:'Typografie', o_font:'Lettertype', o_banner:'Banier', o_banner_none:'Geen', o_banner_ribbon:'Lint', o_banner_plate:'Plaat', o_banner_scroll:'Perkament', o_banner_stone:'Steen', o_caps:'Hoofdletters', o_outline:'Omlijning', o_shadow:'Schaduw', h_font_missing:'Dit lettertype is niet op dit apparaat geïnstalleerd; het dichtstbijzijnde wordt gebruikt. Items met · zijn geïnstalleerd.',
      grp_navigate:'Navigatie', grp_terrain:'Terrein', grp_water:'Water & Routes', grp_markers:'Markeringen', grp_regions:"Regio's & Meten",
      t_select:'Selecteren', t_landmass:'Land', t_erase:'Zee', t_fill:'Vullen', t_terrain:'Terrein', t_symbol:'Symbool',
      t_river:'Rivier', t_road:'Weg', t_label:'Label', t_pan:'Verschuiven', t_eyedrop:'Pipet', t_measure:'Meten', h_measure:'Klik om punten toe te voegen en een meerdelige afstand te meten. Enter / dubbelklik om te voltooien, Escape om te annuleren. Meetlijnen kunnen worden geselecteerd, verplaatst of verwijderd; ze worden niet meegenomen in de PNG/SVG-export.', t_lasso:'Lasso', h_lasso:'Sleep om een gesloten gebied te tekenen: Land + Terrein + Reliëf worden daarbinnen samen opgetild en verplaatsbaar. Sleep om te verplaatsen, gebruik de bovenste handgreep om te draaien. Enter om te bevestigen, Escape om te annuleren, Delete om het gebied volledig te verwijderen.',
      o_landmass:'Land / Kust', o_brushsize:'Penseelgrootte', o_rough:'Ruwheid van de kust',
      o_landcolor:'Landkleur', o_shorew:'Kustbreedte', o_shorestyle:'Kuststijl', o_shore_sandy:'Zandig', o_shore_rocky:'Rotsachtig', o_shore_reef:'Rif',
      o_smooth:'Kust gladstrijken', o_clearland:'Land wissen',
      h_landmass:'Sleep om land te tekenen. Het gereedschap "Zee" wist zowel land als terrein.', o_landgen:'Willekeurig land genereren', o_landgentpl:'Sjabloon', o_landgen_continent:'Continent', o_landgen_island:'Eiland', o_landgen_archipelago:'Archipel', o_landgenrough:'Detail / ruwheid', o_landgen_go:'Genereren', h_landgen:'Vervangt de huidige landlaag. Klik opnieuw met dezelfde instellingen voor een nieuw willekeurig resultaat.',
      o_terrain:'Terrein schilderen', o_opacity:'Dekking', o_clip:'Alleen op land schilderen',
      o_clearterrain:'Terreinlaag wissen',
      h_terrain:'Patronen worden bij elke penseelstreek willekeurig verspreid — geen herhalend patroon.', t_elevation:'Reliëf', o_elevation:'Reliëf', o_elevstrength:'Sterkte', o_elevlower:'Verlagingsmodus', o_clearelevation:'Reliëf wissen', o_elevdisplay:'Weergave', o_elevhillshade:'Reliëfschaduw (hillshade)', o_elevcontours:'Hoogtelijnen', o_contourinterval:'Interval hoogtelijnen', h_elevation:'Sleep om te verhogen; schakel "Verlagingsmodus" in om te verlagen. De reliëfschaduw wordt automatisch bijgewerkt.',
      o_symbol:'Symbool', o_size:'Grootte', o_rot:'Rotatie', o_hue:'Tint',
      o_wear:'Verwering', o_jitter:'Willekeurige plaatsing',
      h_symbol:'Kies een symbool uit de bibliotheek, klik op de kaart. Gebruik "Selecteren" om te verplaatsen; Delete om te wissen.',
      o_river:'Rivier', o_width:'Breedte', o_meander:'Meandering',
      o_taper:'Versmallen bij de bron', o_color:'Kleur',
      h_path:'Klik om punten toe te voegen. Enter / dubbelklik om te voltooien, Esc om te annuleren.',
      o_road:'Weg / Karavaanroute',
      o_label:'Label', o_preset:'Stijlvoorinstelling', o_curve:'Kromming', o_track:'Letterspatiëring', o_snappath:'Uitlijnen op pad (rivier/weg)',
      h_label:'Kies een stijl, typ de tekst, klik op de kaart. Wordt direct toegepast op een geselecteerd label.',
      o_eyedrop:'Textuurpipet', o_eye_nosample:'Nog geen monster genomen',
      o_eye_radius:'Bemonsteringsstraal', o_eye_brush:'Penseelgrootte',
      o_eye_pick:'① Gebied kiezen', o_eye_paint:'② Beginnen met schilderen', o_eye_clear:'Monster wissen',
      h_eyedrop:'① Gebied kiezen: sleep om een cirkel te tekenen. ② Schilderen: breng de textuur aan op de kaart.',
      eyeOk:'✓ Textuur bemonsterd', eyeFail:'Bemonstering mislukt — probeer boven land/terrein.',
      eyePick:'Klik en sleep op de kaart → stel de cirkelgrootte in → laat los.',
      eyePaint:'Klik en sleep op de kaart → de textuur wordt toegepast.',
      eyeNeed:'Neem eerst een monster met ① Gebied kiezen.',
      o_selection:'Selectie', o_nosel:'Niets geselecteerd', o_dup:'Dupliceren', o_del:'Verwijderen',
      o_scalebar:'Schaalbalk', o_scvis:'Tonen op de kaart', o_sclen:'Lengte',
      o_scsize:'Tekstgrootte', o_scsegs:'Segmenten',
      h_scale:'Sleep de schaalbalk op de kaart om deze te verplaatsen.',
      o_view:'Weergave', o_fit:'Passend maken', o_100:'100%',
      h_pan:'Rechtsklikken + slepen, middelklik, Spatie + slepen, of pijltjestoetsen om te verschuiven.',
      tab_layers:'Lagen', tab_library:'Bibliotheek', tab_history:'Geschiedenis',
      ref_title:'Referentieafbeelding', ref_export:'Opnemen in export', ref_clear:'Referentie verwijderen', ref_trace:'Overtrekmodus (bovenop tonen + kustlijn uitlijnen)', ref_scan:'⌖ Geografie scannen', h_ref_scan:'Haalt de kustlijn, meren en rivieren uit de referentieafbeelding. Kaartsymbolen zoals steden en bergen komen niet in de geografie terecht — het terrein eronder loopt ononderbroken door. Vervangt het huidige land.', scan_title:'Kaart wordt gescand', scan_cancel:'Annuleren', scan_prepare:'Afbeelding voorbereiden', scan_markers:'Kaartsymbolen eruit filteren', scan_clean:'Terrein onder de symbolen aanvullen', scan_coast:'Kustlijn extraheren', scan_water:'Rivieren en meren scheiden', scan_commit:'Naar lagen schrijven', scan_noimage:'Laad eerst een referentieafbeelding.', scan_flat:'Geen twee onderscheidbare kleurgebieden gevonden in de afbeelding — land en zee zijn niet te scheiden.', scan_noland:'Geen land gevonden in de afbeelding.', scan_failed:'De scan kon niet worden voltooid.', scan_done:'Scan klaar — {r} rivieren, {l} meren; {m} kaartsymbolen overgeslagen.', layer_drag_hint:'Sleep hiervandaan om de laag te herschikken', blend_sourceover:'Normaal', blend_multiply:'Vermenigvuldigen', blend_overlay:'Overlay', blend_softlight:'Zacht licht', blend_screen:'Zeef', nav_home:'Home', nav_canvas:'Canvas', nav_tutorial:'Handleiding', nav_community:'Community', home_tagline:'Een browsergebaseerde kaarteditor voor fantasiewerelden', home_desc:'Teken land- en zeegrenzen, schilder bossen en bergen, plaats kastelen en dorpen, leg rivieren en wegen aan — alles op één canvas, in je browser, zonder installatie.', home_cta:'Begin je kaart', home_video_caption:'Introductievideo binnenkort', canvas_new_title:'Nieuw canvas maken', canvas_custom:'Aangepaste afmeting…', canvas_name_ph:'Kaartnaam', canvas_create:'Aanmaken', canvas_import:'Importeren uit .json-bestand', canvas_saved_title:'Opgeslagen canvassen', canvas_empty:'Nog geen opgeslagen canvassen in deze browser. Ze verschijnen hier automatisch zodra je in de editor op "Opslaan" klikt.', canvas_open:'Openen', canvas_delete:'Verwijderen', canvas_delete_confirm:'Dit canvas verwijderen? Dit kan niet ongedaan worden gemaakt.', canvas_unnamed:'Naamloze kaart', tutorial_title:'Handleiding', tutorial_intro:'Elk gereedschap in de linker werkbalk opent zijn eigen instellingen in het rechterpaneel. Hieronder een korte samenvatting van wat elk gereedschap doet.', community_title:'Community', community_desc:'Wayborne Map Editor is een open source project dat voortdurend evolueert.', community_github_desc:'Broncode, bugmeldingen en bijdragen', community_soon:'Binnenkort', lib_full:'De browseropslag is vol — verwijder een oud canvas of exporteer het als .json.', tut_h_select:'Selecteer, verplaats en draai objecten; Shift-klik voor meervoudige selectie.', tut_h_erase:'Wist geschilderd land en de terreintextuur erop in één stap.', tut_h_fill:'Vult het binnenste van een gesloten kustlijn met één klik.', tut_h_river:'Klik om punten toe te voegen en een rivier te tekenen; Enter om te voltooien.', tut_h_road:'Klik om punten toe te voegen en een weg te tekenen; Enter om te voltooien.',
      sym_upload:'+ PNG-symbool uploaden', sym_upload_done:'symbo(o)l(en) geladen', sym_del:'Verwijderen', sym_search:'Symbolen zoeken...', sym_recent:'Recent gebruikt',
      st_pos:'Positie', st_zoom:'Zoom', st_size:'Canvas', st_tool:'Gereedschap',
      cancel:'Annuleren', ok:'OK',
      locked:'Laag is vergrendeld of verborgen.', needtext:'Typ eerst de labeltekst.', nopathnear:'Geen rivier/weg in de buurt gevonden.', fill_toolarge:'Gebied te groot — probeer binnen een gesloten grens.',
      exported:'Geëxporteerd:', saved:'Project opgeslagen.', loaded:'Project geladen.',
      badfile:'Ongeldig projectbestand.', newmap:'Nieuwe kaart aangemaakt.',
      confirmNew:'De huidige kaart wordt verwijderd. Kies een canvasgrootte:',
      confirmSize:'Het wijzigen van de canvasgrootte schaalt bestaande lagen. Doorgaan?',
      histStart:'Begin', selNone:'Niets geselecteerd', symbols:'symbolen',
      selScale:'Schaalbalk geselecteerd', o_front:'Naar voorgrond', o_back:'Naar achtergrond',
      o_fwd:'Naar voren', o_bwd:'Naar achteren',
      o_group:'Groeperen', o_ungroup:'Groepering opheffen',
      selMulti:'objecten geselecteerd',
      t_lake:'Meer', o_lake:'Meer', h_lake:'Klik om punten toe te voegen, druk vanaf 3 punten op Enter om te sluiten.', t_territory:'Gebied', o_territory:'Gebied', o_territorycolor:'Vulkleur', o_territorybcolor:'Randkleur', h_territory:'Klik om punten toe te voegen, druk vanaf 3 punten op Enter om te sluiten.', t_regionlink:'Regiokoppeling', h_regionlink:'Klik op de kaart en geef een naam: er wordt een nieuwe, lege regiokaart gemaakt. Dubbelklik met het selectiegereedschap op de speld om deze te openen; gebruik linksboven "Terug" om naar de wereldkaart te gaan.', rl_newtitle:'Nieuwe regiokaart', rl_placeholder:'Regionaam', rl_default:'Naamloze regio', rl_open:'Regio openen →', bc_back:'Terug', bc_world:'Wereldkaart', t_resource:'Grondstof', o_resourcetype:'Type', rs_mine:'Mijn', rs_farm:'Landbouwgrond', rs_hunting:'Jachtgebied', rs_fishing:'Visgebied', rs_trade:'Handelspost', rs_quarry:'Steengroeve', h_resource:'Klik op de kaart om een grondstofmarkering van het geselecteerde type te plaatsen.',
      o_lakecolor:'Kleur van het meer',
      o_symbbrush:'Penseelmodus', o_symbdensity:'Dichtheid', o_clipland:'Beperken tot land (penseel)',
      o_windrose:'Windroos', o_wrvis:'Tonen op de kaart', o_wrsize:'Grootte',
      o_wrstyle_classic:'Klassiek', o_wrstyle_minimal:'Minimalistisch', o_wrstyle:'Stijl', o_wrcolor:'Kleur', h_windrose:'Sleep op de kaart om te verplaatsen.',
      o_snap:'Uitlijnen op raster', o_snapsize:'Rastergrootte', o_frame:'Kaartlijst', o_frame_none:'Geen', o_frame_simple:'Eenvoudige lijn', o_frame_rope:'Touw', o_frame_ornate:'Versierd', o_frame_color:'Kleur',
      biomegen_empty:'Teken eerst land.', o_zonetype:'Zonetype', o_zone_none:'— geen (politieke regio) —', o_zone_war:'Oorlogsgebied', o_zone_anomaly:'Anomalie', o_zone_forbidden:'Verboden gebied', o_zone_hunting:'Jachtgebied', o_zone_quarantine:'Quarantaine', o_zone_sacred:'Heilige grond', o_zone_trade:'Handelszone', h_zonetype:'Een regio met een type hoort bij geen van de weergaven staat/cultuur/religie; hij wordt in elke weergave met zijn eigen arcering getekend.', o_note:'Notitie', o_note_ph:'Je notitie over dit object…', o_note_show:'Notitiemarkeringen op de kaart tonen', o_nb_edit:'Voeg je eigen cultuur toe', o_nb_name:'Naam van de cultuur', o_nb_bas:'Beginlettergrepen: Ash, Bram, Dun', o_nb_orta:'Middenklanken: a, e, i', o_nb_son:'Eindlettergrepen: ford, dale, ton', o_nb_birlesik:'Samengesteld (Ashford) — uit betekent vloeiend (Valeria)', o_nb_add:'Toevoegen', o_nb_del:'Geselecteerde cultuur verwijderen', h_nb:'Een cultuur die je toevoegt hoort bij dit project, wordt met het projectbestand opgeslagen en kan ook door de cultuur-/religiegenerator worden gebruikt.', nb_needname:'Typ eerst een naam voor de cultuur.', nb_needsyl:'Begin- en eindlettergrepen mogen niet leeg zijn.', nb_builtin:'Ingebouwde culturen kunnen niet worden verwijderd.', m_nbadded:'Cultuur toegevoegd', m_nbdeleted:'Cultuur verwijderd', o_lgsave:'Als sjabloon opslaan', o_lgdel:'Sjabloon verwijderen', o_lgsave_ask:'Geef dit sjabloon een naam:', o_lgsave_def:'Mijn sjabloon', m_lgsaved:'Sjabloon opgeslagen', h_lgpreset:'Een opgeslagen sjabloon bewaart de huidige ruwheid en de keuzes rivier/meer/terrein onder een naam en voegt het toe aan de lijst hierboven; het reist mee met het projectbestand.', o_climate:'Klimaat', o_climate_on:'Klimaatmodel gebruiken', o_climate_eq:'Positie van de evenaar', o_climate_str:'Sterkte van de regenschaduw', o_climate_wind:'Windpijlen tonen', h_climate:'Verplaats de evenaar uit het midden van het canvas om kaarten van één halfrond of poolkaarten te maken. Wind droogt de cellen achter bergen uit (regenschaduw) en bevochtigt die ervoor — de volgende run van "Biomen toewijzen" houdt hier rekening mee.', copied:'Gekopieerd', copy:'Kopiëren', exp_share_embedcode:'Insluitcode (iframe)', exp_share_gen:'🔗 Link genereren', exp_share_help:'Geen server — de kaartafbeelding wordt direct in de link ingesloten (het #-gedeelte van de URL). De link wordt nergens geüpload, tenzij je hem zelf verstuurt; grote kaarten geven langere links.', exp_share_link:'Link', exp_share_sizehint:'Linklengte ≈ {kb} KB', exp_share_t:'Deellink', h_biomegen:'Vult de terreinlaag automatisch op basis van hoogte en breedtegraad; vervangt de huidige terreinlaag.', h_rivergen:'Voegt rivieren toe die vanaf het hoogterooster naar zee stromen. Vereist bergen/heuvels geschilderd met het penseel "Reliëf".', h_roadgen:'Tekent wegen tussen nederzettingssymbolen (stad/dorp/gehucht/kasteel/haven) en vermijdt steile hellingen. Verbindt enkele willekeurige landpunten als er geen nederzettingen zijn.', h_settlegen:'Verspreidt stad-/dorp-/gehuchtsymbolen over vlak land bij de kust — de beste plek krijgt een kasteel/haven, de rest steden/dorpen. "Wegen genereren" vindt deze symbolen en verbindt ze. Elke nederzetting krijgt een naam uit de lettergreepvoorraad van de cultuurregio waarin hij ligt.', o_settle_labels:'Namen ook als labels schrijven', lakegen_none:'Geen geschikte plek voor een meer gevonden.', o_biomegen:'Biomen automatisch toewijzen', o_biomegen_go:'🌍 Biomen toewijzen', o_landgen_lakes:'Meren toevoegen', o_landgen_rivers:'Rivieren toevoegen', o_landgen_terrain:'Terrein toevoegen', o_rivergen:'Rivieren automatisch genereren', o_rivergen_go:'💧 Rivieren genereren', o_roadgen:'Wegen automatisch genereren', o_roadgen_go:'🛤️ Wegen genereren', o_seacolor:'Zeekleur', o_settlegen:'Nederzettingen automatisch plaatsen', o_settlegen_go:'🏰 Nederzettingen plaatsen', o_symlegend:'Legenda', panel_toggle_left:'Linkerpaneel in-/uitschakelen', panel_toggle_right:'Rechterpaneel in-/uitschakelen', regions_maptree:'Kaartboom', regions_political:'Politieke regio\'s', regions_political_empty:'Nog geen benoemde regio\'s. Teken met het gereedschap "Gebied" en geef het daarna een naam.', rivergen_noelev:'Schilder eerst bergen/heuvels met het penseel "Reliëf".', rivergen_none:'Geen geschikte rivierbron gevonden.', roadgen_noland:'Onvoldoende land/punten gevonden voor wegen.', roadgen_none:'Er konden geen wegen worden gegenereerd — landmassa\'s zijn mogelijk niet verbonden.', sc_cancel:'Annuleren / deselecteren', sc_delete:'Selectie verwijderen', sc_finish:'Pad voltooien', sc_fit:'Passend maken', sc_general:'Algemeen', sc_help:'Dit scherm openen', sc_pan:'Verschuiven', sc_panfast:'Sneller verschuiven', sc_redo:'Opnieuw', sc_rotsym:'Symbool draaien', sc_save:'Opslaan', sc_title:'Sneltoetsen', sc_undo:'Ongedaan maken', sc_zoom:'In-/uitzoomen', settlegen_noland:'Geen geschikt land gevonden voor nederzettingen.', settlegen_none:'Er konden geen nederzettingen worden geplaatst.', share_editbtn:'Openen in Wayborne', tab_regions:'Regio\'s', tab_todo:'Taken', todo_add:'Toevoegen', todo_empty:'Nog geen taken.', todo_placeholder:'Nieuwe taak...'
    },
    pl: { tut_extras:'Poza narzędziami — generatory automatyczne', tut_extras_d:'Nie ma ich na pasku narzędzi; pojawiają się w prawym panelu po wybraniu powiązanego narzędzia.', o_measurearea:'Zamknij jako obszar', tpa_undo:'Cofnij ostatni punkt', tpa_finish:'Zakończ', tpa_cancel:'Anuluj',
      new:'Nowy', open:'Otwórz', save:'Zapisz', parchment:'Pergamin', grid:'Siatka', shore:'Wybrzeże',
      o_gridsec:'Siatka', o_gridtype:'Typ', o_grid_square:'Kwadrat', o_grid_hex:'Heksagon', o_grid_dot:'Kropka', o_gridcell:'Rozmiar komórki', o_gridcolor:'Kolor', o_gridop:'Intensywność', h_grid:'Włącz siatkę polem \'Siatka\' na górze. Heksy to standard w RPG-ach stołowych.',
      o_polsec:'Mapa polityczna', o_polmode:'Widok polityczny', o_polmute:'Wycisz teksturę terenu', o_pollegend:'Pokaż legendę', o_polfill:'Siła wypełnienia', o_polcolors:'Przypisz kolory państw', o_polname:'Nazwa zaznaczonego regionu', o_polname_ph:'Nazwa państwa', h_political:'Widok polityczny nie jest osobną warstwą; przedstawia narysowane regiony jako państwa.', o_stategensec:'Generowanie państw i kultur', o_polmodesel:'Widok', o_polmode_state:'Państwa', o_polmode_culture:'Kultury', o_stcount:'Liczba państw', o_stvariety:'Zróżnicowanie wielkości', o_stategen_go:'👑 Generuj państwa', h_stategen:'Generuje granice państw, które rosną jednocześnie z każdej stolicy i idealnie do siebie przylegają. Zachowuje ręcznie narysowane regiony, dodaje do nich.', o_cucount:'Liczba kultur', o_culturegen_go:'🎭 Generuj kultury', h_culturegen:'Generuje regiony kulturowe rosnące na własnej siatce, niezależnie od granic państw — przełączaj prezentację państwa/kultury selektorem "Widok" powyżej.', o_stedit:'Zaznaczony region', h_stedit_none:'Aby edytować, zaznacz region na mapie lub w zakładce „Regiony" po prawej.', o_stgov:'Forma rządu', o_stcapital:'Stolica', o_stcapital_pick:'Wskaż stolicę na mapie', o_stcapital_cancel:'Anuluj wskazywanie stolicy', o_stmake:'Przekształć w państwo', o_stunmake:'Usuń status państwa', o_stemblem:'Herb', o_stemblem_gen:'Wygeneruj herb', o_stemblem_reroll:'Wygeneruj ponownie', o_stemblem_png:'Pobierz PNG', o_stemblem_clear:'Usuń herb', h_stemblem:'Herb jest rysowany w kodzie; ziarno zapisuje się razem z państwem, więc to samo ziarno zawsze daje ten sam herb. Widoczny obok stolicy w widoku politycznym.', o_polemblem:'Pokaż herby', m_emblem:'Herb wygenerowany', h_stedit:'Przekształcenie ręcznie narysowanego regionu w państwo nadaje mu nazwę, formę rządu i stolicę; następnie jest wyświetlany i kolorowany tak samo jak wygenerowane państwo.', m_stmade:'Region przekształcony w państwo', m_stunmade:'Region nie jest już państwem', m_capitalpick:'Kliknij położenie stolicy na mapie (Esc, aby anulować)', st_capital_sea:'Stolica musi znajdować się na lądzie.', st_capital_set:'Stolica przeniesiona', o_provcount:'Prowincji na państwo', o_provgen_go:'Generuj prowincje', h_provgen:'Dzieli granice każdego państwa na podregiony; granica prowincji nigdy nie wychodzi poza państwo, do którego należy.', m_provgen:'prowincji wygenerowano', prov_nostate:'Najpierw wygeneruj państwa — prowincje są ich podziałem.', prov_none:'Nie udało się wygenerować prowincji (państwa za małe).', o_diplosec:'Dyplomacja', h_diplo_none:'Do określenia relacji potrzebne są co najmniej dwa państwa.', o_diplo_a:'Państwo A', o_diplo_b:'Państwo B', o_diplo_rel:'Relacja', rel_peace:'Pokój', rel_alliance:'Sojusz', rel_war:'Wojna', rel_vassal:'Lenno', diplo_same:'Państwo nie może mieć relacji samo ze sobą.', o_polmode_religion:'Religie', o_recount:'Liczba religii', o_religiongen_go:'Generuj religie', m_religiongen:'obszarów religijnych wygenerowano', o_citysec:'Generowanie miasta', h_city_nosel:'Najpierw zaznacz region — miasto powstanie w jego granicach.', o_citydistrict:'Typ dzielnicy', o_citybuildings:'Liczba budynków', o_citystreet:'Szerokość ulic', o_citywall:'Dodaj mury i bramy', o_citygen_go:'Generuj miasto', h_citygen:'Dzieli zaznaczony region alejami i uliczkami na kwartały, kwartały na działki, a na każdej działce stawia budynek pasujący do typu dzielnicy, frontem do najbliższej ulicy. Cofa się jednym krokiem.', m_citygen:'budynków rozmieszczono', city_noarea:'Najpierw zaznacz region, w którym zmieści się miasto.', city_small:'Zaznaczony region jest za mały na miasto.', dist_craftsmen:'Rzemieślnicza', dist_market:'Targowa', dist_noble:'Szlachecka', dist_slum:'Biedna', dist_temple:'Świątynna', dist_harbour:'Portowa', accent_t:'Kolor akcentu interfejsu (prawy przycisk: przywróć)', o_speak:'Przeczytaj nazwę na głos', url_generated:'Mapa wygenerowana z ziarna z linku', url_badtemplate:'Szablon podany w linku jest nieprawidłowy.', exp_gis_t:'Eksportuj dane wektorowe jako GeoJSON (QGIS itd.)', gis_done:'obiektów wyeksportowano jako GeoJSON', gis_empty:'Brak obiektów wektorowych do eksportu.', m_stategen:'wygenerowano państw', m_culturegen:'wygenerowano regionów kulturowych', stategen_noland:'Za mało lądu, aby wygenerować państwa.', stategen_none:'Nie udało się wygenerować państw/kultur.', gov_kingdom:'Królestwo', gov_empire:'Cesarstwo', gov_theocracy:'Teokracja', gov_republic:'Republika', gov_confederation:'Konfederacja', gov_citystate:'Miasto-państwo', m_polon:'Widok polityczny włączony', m_poloff:'Widok fizyczny', m_polcolored:'regionów pokolorowano', m_polempty:'Najpierw narysuj region',
      o_nameculture:'Kultura', o_namefeature:'Typ', o_namegen:'🎲 Zaproponuj nazwę', o_nf_settlement:'Osada', o_nf_city:'Miasto', o_nf_river:'Rzeka', o_nf_mountain:'Góra', o_nf_forest:'Las', o_nf_region:'Region', o_nf_lake:'Jezioro', o_nf_sea:'Morze',
      tpl_title:'Zacznij od szablonu', tpl_desc:'Zacznij od gotowej linii brzegowej, a potem zbuduj na niej swój świat.', tpl_ready:'płótno gotowe',
      tpl_continent:'Kontynent', tpl_continent_d:'Rozległy ląd o poszarpanych wybrzeżach', tpl_island:'Wyspa', tpl_island_d:'Jedna duża wyspa na otwartym morzu', tpl_archipelago:'Archipelag', tpl_archipelago_d:'Rozproszone wyspy i płytkie cieśniny', tpl_kingdom:'Królestwo', tpl_kingdom_d:'Łagodne brzegi, żyzne wnętrze', tpl_battle:'Mapa bitwy', tpl_battle_d:'Mały teren z siatką heksagonalną', tpl_blank:'Puste płótno', tpl_blank_d:'Zacznij od zera',
      o_outlinecolor:'Kolor obrysu',
      exp_html_t:'HTML w jednym pliku', exp_print_t:'Drukuj / PDF', exp_png2_t:'Rozdzielczość 2×', exp_png4_t:'Rozdzielczość 4×', exp_maxdim:'Dłuższy bok', exp_format:'Format', exp_fmt_png:'PNG · ostry, duży plik', exp_fmt_jpeg:'JPEG · mały plik', exp_title:'Tytuł', exp_html_help:'Pobiera jeden plik .html z mapą i małą przeglądarką w środku. Serwer niepotrzebny — wyślij plik i kliknij dwukrotnie.', exp_page:'Rozmiar strony', exp_orient:'Orientacja', exp_portrait:'Pionowa', exp_landscape:'Pozioma', exp_margin:'Margines', exp_dpi:'Rozdzielczość', exp_dpi_screen:'ekran', exp_dpi_normal:'zwykły druk', exp_dpi_high:'wysoka jakość', exp_print_help:'Otwiera okno drukowania przeglądarki. Stamtąd możesz wydrukować albo wybrać „Zapisz jako PDF”.', printing:'Przygotowywanie wydruku', print_failed:'Nie udało się otworzyć okna drukowania', viewer_hint:'przeciągnij · kółko · dwuklik', viewer_in:'Powiększ', viewer_out:'Pomniejsz', viewer_fit:'Dopasuj',
      t_sketch:'Szkic', o_sketch:'Szkic', h_sketch:'Pędzel odręczny rysujący wyłącznie na warstwach dodanych przez ciebie. Dodaj warstwę przyciskiem „+ Dodaj warstwę” w panelu warstw, zaznacz ją na liście, a potem rysuj po mapie.', o_hardness:'Twardość', o_sketch_eraser:'Tryb gumki', sketch_target:'Warstwa docelowa', sketch_need_layer:'Najpierw dodaj własną warstwę i zaznacz ją na liście', layer_add:'+ Dodaj warstwę', h_add_layer:'Warstwy dodane przez ciebie służą do swobodnego rysowania; maluj po nich narzędziem „Szkic”.', layer_added:'Dodano warstwę', layer_untitled:'Warstwa', layer_max:'Można dodać najwyżej 12 własnych warstw', layer_rename:'Nazwa warstwy', layer_rename_hint:'Kliknij dwukrotnie, aby zmienić nazwę', layer_delete:'Usuń warstwę', layer_delete_confirm:'Usunąć tę warstwę i wszystko, co na niej narysowano?', tut_h_sketch:'Rysuje odręcznie na warstwach dodanych przez ciebie; kolor, rozmiar, twardość, krycie i tryb gumki są regulowane.',
      o_typography:'Typografia', o_font:'Krój pisma', o_banner:'Banderola', o_banner_none:'Brak', o_banner_ribbon:'Wstęga', o_banner_plate:'Tablica', o_banner_scroll:'Zwój', o_banner_stone:'Kamień', o_caps:'Wersaliki', o_outline:'Obrys', o_shadow:'Cień', h_font_missing:'Ten krój pisma nie jest zainstalowany na tym urządzeniu; użyto najbliższego zamiennika. Pozycje oznaczone · są zainstalowane.',
      grp_navigate:'Nawigacja', grp_terrain:'Teren', grp_water:'Woda i Drogi', grp_markers:'Znaczniki', grp_regions:'Regiony i Pomiar',
      t_select:'Zaznacz', t_landmass:'Ląd', t_erase:'Morze', t_fill:'Wypełnij', t_terrain:'Teren', t_symbol:'Symbol',
      t_river:'Rzeka', t_road:'Droga', t_label:'Etykieta', t_pan:'Przesuń', t_eyedrop:'Próbnik', t_measure:'Mierz', h_measure:'Kliknij, aby dodać punkty i zmierzyć wieloodcinkową odległość. Enter / podwójne kliknięcie kończy, Esc anuluje. Linie pomiarowe można zaznaczać, przesuwać lub usuwać; nie są uwzględniane w eksporcie PNG/SVG.', t_lasso:'Lasso', h_lasso:'Przeciągnij, aby narysować zamknięty obszar: Ląd + Teren + Rzeźba terenu są w nim razem podnoszone i stają się przesuwalne. Przeciągnij, aby przesunąć, użyj górnego uchwytu, aby obrócić. Enter zatwierdza, Escape anuluje, Delete całkowicie usuwa obszar.',
      o_landmass:'Ląd / Wybrzeże', o_brushsize:'Rozmiar pędzla', o_rough:'Nieregularność wybrzeża',
      o_landcolor:'Kolor lądu', o_shorew:'Szerokość wybrzeża', o_shorestyle:'Styl wybrzeża', o_shore_sandy:'Piaszczyste', o_shore_rocky:'Skaliste', o_shore_reef:'Rafa',
      o_smooth:'Wygładź wybrzeże', o_clearland:'Wyczyść ląd',
      h_landmass:'Przeciągnij, aby malować ląd. Narzędzie „Morze” usuwa zarówno ląd, jak i teren.', o_landgen:'Generuj losowy ląd', o_landgentpl:'Szablon', o_landgen_continent:'Kontynent', o_landgen_island:'Wyspa', o_landgen_archipelago:'Archipelag', o_landgenrough:'Szczegółowość / chropowatość', o_landgen_go:'Generuj', h_landgen:'Zastępuje bieżącą warstwę lądu. Kliknij ponownie z tymi samymi ustawieniami, aby uzyskać nowy losowy wynik.',
      o_terrain:'Malowanie terenu', o_opacity:'Krycie', o_clip:'Maluj tylko na lądzie',
      o_clearterrain:'Wyczyść warstwę terenu',
      h_terrain:'Wzory są losowo rozrzucane przy każdym pociągnięciu — bez powtarzającego się wzoru.', t_elevation:'Wysokość', o_elevation:'Rzeźba terenu', o_elevstrength:'Siła', o_elevlower:'Tryb obniżania', o_clearelevation:'Wyczyść rzeźbę terenu', o_elevdisplay:'Wyświetlanie', o_elevhillshade:'Cieniowanie (hillshade)', o_elevcontours:'Warstwice', o_contourinterval:'Odstęp warstwic', h_elevation:'Przeciągnij, aby podnieść teren; włącz „tryb obniżania”, aby go zagłębić. Cieniowanie aktualizuje się automatycznie.',
      o_symbol:'Symbol', o_size:'Rozmiar', o_rot:'Obrót', o_hue:'Odcień',
      o_wear:'Zużycie', o_jitter:'Losowe rozmieszczenie',
      h_symbol:'Wybierz symbol z biblioteki, kliknij na mapie. Użyj „Zaznacz”, aby przesunąć; Delete, aby usunąć.',
      o_river:'Rzeka', o_width:'Szerokość', o_meander:'Meandrowanie',
      o_taper:'Zwężaj przy źródle', o_color:'Kolor',
      h_path:'Kliknij, aby dodać punkty. Enter / podwójne kliknięcie kończy, Esc anuluje.',
      o_road:'Droga / Szlak karawan',
      o_label:'Etykieta', o_preset:'Styl predefiniowany', o_curve:'Wygięcie', o_track:'Odstępy między literami', o_snappath:'Dopasuj do ścieżki (rzeka/droga)',
      h_label:'Wybierz styl, wpisz tekst, kliknij na mapie. Zmiany stosują się od razu do zaznaczonej etykiety.',
      o_eyedrop:'Próbnik tekstury', o_eye_nosample:'Brak pobranej próbki',
      o_eye_radius:'Promień próbkowania', o_eye_brush:'Rozmiar pędzla',
      o_eye_pick:'① Wybierz obszar', o_eye_paint:'② Zacznij malować', o_eye_clear:'Wyczyść próbkę',
      h_eyedrop:'① Wybierz obszar: przeciągnij, rysując okrąg. ② Maluj: nałóż teksturę na mapę.',
      eyeOk:'✓ Tekstura pobrana', eyeFail:'Pobieranie nie powiodło się — spróbuj nad lądem/terenem.',
      eyePick:'Kliknij i przeciągnij na mapie → ustaw rozmiar okręgu → puść.',
      eyePaint:'Kliknij i przeciągnij na mapie → tekstura zostaje nałożona.',
      eyeNeed:'Najpierw pobierz teksturę za pomocą ① Wybierz obszar.',
      o_selection:'Zaznaczenie', o_nosel:'Nic nie zaznaczono', o_dup:'Duplikuj', o_del:'Usuń',
      o_scalebar:'Podziałka', o_scvis:'Pokaż na mapie', o_sclen:'Długość',
      o_scsize:'Rozmiar tekstu', o_scsegs:'Segmenty',
      h_scale:'Przeciągnij podziałkę na mapie, aby ją przesunąć.',
      o_view:'Widok', o_fit:'Dopasuj do ekranu', o_100:'100%',
      h_pan:'Prawy przycisk + przeciągnij, środkowy przycisk, Spacja + przeciągnij lub strzałki, aby przesuwać.',
      tab_layers:'Warstwy', tab_library:'Biblioteka', tab_history:'Historia',
      ref_title:'Obraz referencyjny', ref_export:'Uwzględnij w eksporcie', ref_clear:'Usuń obraz referencyjny', ref_trace:'Tryb kalkowania (pokaż na wierzchu + przyciąganie do linii brzegowej)', ref_scan:'⌖ Skanuj geografię', h_ref_scan:'Wydobywa linię brzegową, jeziora i rzeki z obrazu referencyjnego. Symbole mapy, takie jak miasta i góry, nie trafiają do geografii — teren pod nimi biegnie bez przerwy. Zastępuje istniejący ląd.', scan_title:'Skanowanie mapy', scan_cancel:'Anuluj', scan_prepare:'Przygotowywanie obrazu', scan_markers:'Wyodrębnianie symboli mapy', scan_clean:'Uzupełnianie terenu pod symbolami', scan_coast:'Wydobywanie linii brzegowej', scan_water:'Rozdzielanie rzek i jezior', scan_commit:'Zapisywanie do warstw', scan_noimage:'Najpierw wczytaj obraz referencyjny.', scan_flat:'Nie znaleziono dwóch odrębnych obszarów koloru — nie można odróżnić lądu od morza.', scan_noland:'Nie znaleziono lądu na obrazie.', scan_failed:'Nie udało się ukończyć skanowania.', scan_done:'Skanowanie gotowe — {r} rzek, {l} jezior; {m} symboli mapy pominięto.', layer_drag_hint:'Przeciągnij stąd, aby zmienić kolejność warstwy', blend_sourceover:'Normalny', blend_multiply:'Mnożenie', blend_overlay:'Nakładka', blend_softlight:'Łagodne światło', blend_screen:'Ekran', nav_home:'Strona główna', nav_canvas:'Płótno', nav_tutorial:'Poradnik', nav_community:'Społeczność', home_tagline:'Edytor map dla fantastycznych światów w przeglądarce', home_desc:'Rysuj granice lądu i morza, maluj lasy i góry, umieszczaj zamki i wioski, prowadź rzeki i drogi — wszystko na jednym płótnie, w przeglądarce, bez instalacji.', home_cta:'Zacznij swoją mapę', home_video_caption:'Wkrótce film wprowadzający', canvas_new_title:'Utwórz nowe płótno', canvas_custom:'Niestandardowy rozmiar…', canvas_name_ph:'Nazwa mapy', canvas_create:'Utwórz', canvas_import:'Importuj z pliku .json', canvas_saved_title:'Zapisane płótna', canvas_empty:'W tej przeglądarce nie zapisano jeszcze żadnych płócien. Pojawiają się tu automatycznie po kliknięciu "Zapisz" w edytorze.', canvas_open:'Otwórz', canvas_delete:'Usuń', canvas_delete_confirm:'Usunąć to płótno? Tej operacji nie można cofnąć.', canvas_unnamed:'Mapa bez nazwy', tutorial_title:'Poradnik', tutorial_intro:'Każde narzędzie na lewym pasku otwiera własne ustawienia w prawym panelu. Poniżej krótkie podsumowanie działania każdego narzędzia.', community_title:'Społeczność', community_desc:'Wayborne Map Editor to projekt open source, wciąż rozwijany.', community_github_desc:'Kod źródłowy, zgłoszenia błędów i wkład', community_soon:'Wkrótce', lib_full:'Pamięć przeglądarki jest pełna — usuń stare płótno lub wyeksportuj je jako .json.', tut_h_select:'Zaznaczaj, przesuwaj i obracaj obiekty; Shift+klik dla zaznaczenia wielokrotnego.', tut_h_erase:'Usuwa pomalowany ląd i teksturę terenu nad nim w jednym kroku.', tut_h_fill:'Wypełnia wnętrze zamkniętego zarysu wybrzeża jednym kliknięciem.', tut_h_river:'Kliknij, aby dodać punkty i narysować rzekę; Enter, aby zakończyć.', tut_h_road:'Kliknij, aby dodać punkty i narysować drogę; Enter, aby zakończyć.',
      sym_upload:'+ Wgraj symbol PNG', sym_upload_done:'wczytano symboli', sym_del:'Usuń', sym_search:'Szukaj symboli...', sym_recent:'Ostatnio używane',
      st_pos:'Pozycja', st_zoom:'Powiększenie', st_size:'Płótno', st_tool:'Narzędzie',
      cancel:'Anuluj', ok:'OK',
      locked:'Warstwa jest zablokowana lub ukryta.', needtext:'Najpierw wpisz tekst etykiety.', nopathnear:'Nie znaleziono w pobliżu rzeki/drogi.', fill_toolarge:'Obszar zbyt duży — spróbuj wewnątrz zamkniętej granicy.',
      exported:'Wyeksportowano:', saved:'Projekt zapisany.', loaded:'Projekt wczytany.',
      badfile:'Nieprawidłowy plik projektu.', newmap:'Utworzono nową mapę.',
      confirmNew:'Bieżąca mapa zostanie odrzucona. Wybierz rozmiar płótna:',
      confirmSize:'Zmiana rozmiaru płótna przeskaluje istniejące warstwy. Kontynuować?',
      histStart:'Początek', selNone:'Nic nie zaznaczono', symbols:'symboli',
      selScale:'Zaznaczono podziałkę', o_front:'Przenieś na wierzch', o_back:'Przenieś na spód',
      o_fwd:'Przenieś wyżej', o_bwd:'Przenieś niżej',
      o_group:'Grupuj', o_ungroup:'Rozgrupuj',
      selMulti:'zaznaczonych obiektów',
      t_lake:'Jezioro', o_lake:'Jezioro', h_lake:'Kliknij, aby dodać punkty; od 3 punktów naciśnij Enter, aby zamknąć.', t_territory:'Terytorium', o_territory:'Terytorium', o_territorycolor:'Kolor wypełnienia', o_territorybcolor:'Kolor obramowania', h_territory:'Kliknij, aby dodać punkty; od 3 punktów naciśnij Enter, aby zamknąć.', t_regionlink:'Łącze regionu', h_regionlink:'Kliknij mapę i nadaj nazwę: zostanie utworzona nowa, pusta mapa regionu. Kliknij dwukrotnie na pinezkę narzędziem Zaznacz, aby wejść; użyj "Wstecz" w lewym górnym rogu, aby wrócić do mapy świata.', rl_newtitle:'Nowa mapa regionu', rl_placeholder:'Nazwa regionu', rl_default:'Region bez nazwy', rl_open:'Wejdź do regionu →', bc_back:'Wstecz', bc_world:'Mapa świata', t_resource:'Zasób', o_resourcetype:'Typ', rs_mine:'Kopalnia', rs_farm:'Ziemia uprawna', rs_hunting:'Teren łowiecki', rs_fishing:'Łowisko', rs_trade:'Placówka handlowa', rs_quarry:'Kamieniołom', h_resource:'Kliknij mapę, aby umieścić znacznik zasobu wybranego typu.',
      o_lakecolor:'Kolor jeziora',
      o_symbbrush:'Tryb pędzla', o_symbdensity:'Gęstość', o_clipland:'Ogranicz do lądu (pędzel)',
      o_windrose:'Róża wiatrów', o_wrvis:'Pokaż na mapie', o_wrsize:'Rozmiar',
      o_wrstyle_classic:'Klasyczny', o_wrstyle_minimal:'Minimalistyczny', o_wrstyle:'Styl', o_wrcolor:'Kolor', h_windrose:'Przeciągnij na mapie, aby przesunąć.',
      o_snap:'Przyciągaj do siatki', o_snapsize:'Rozmiar siatki', o_frame:'Ramka mapy', o_frame_none:'Brak', o_frame_simple:'Prosta linia', o_frame_rope:'Lina', o_frame_ornate:'Zdobiona', o_frame_color:'Kolor',
      biomegen_empty:'Najpierw narysuj ląd.', o_zonetype:'Typ strefy', o_zone_none:'— brak (region polityczny) —', o_zone_war:'Strefa wojny', o_zone_anomaly:'Anomalia', o_zone_forbidden:'Strefa zakazana', o_zone_hunting:'Teren łowiecki', o_zone_quarantine:'Kwarantanna', o_zone_sacred:'Święte miejsce', o_zone_trade:'Strefa handlowa', h_zonetype:'Region z typem nie należy do żadnego z widoków państwo/kultura/religia; w każdym widoku rysowany jest własnym deseniem.', o_note:'Notatka', o_note_ph:'Twoja notatka o tym obiekcie…', o_note_show:'Pokaż znaczniki notatek na mapie', o_nb_edit:'Dodaj własną kulturę', o_nb_name:'Nazwa kultury', o_nb_bas:'Sylaby początkowe: Ash, Bram, Dun', o_nb_orta:'Głoski środkowe: a, e, i', o_nb_son:'Sylaby końcowe: ford, dale, ton', o_nb_birlesik:'Złożone (Ashford) — wyłączone: płynne (Valeria)', o_nb_add:'Dodaj', o_nb_del:'Usuń wybraną kulturę', h_nb:'Dodana kultura należy do tego projektu, zapisuje się razem z plikiem projektu i może być używana przez generator kultur/religii.', nb_needname:'Najpierw wpisz nazwę kultury.', nb_needsyl:'Sylaby początkowe i końcowe nie mogą być puste.', nb_builtin:'Wbudowanych kultur nie można usunąć.', m_nbadded:'Kultura dodana', m_nbdeleted:'Kultura usunięta', o_lgsave:'Zapisz jako szablon', o_lgdel:'Usuń szablon', o_lgsave_ask:'Nazwij ten szablon:', o_lgsave_def:'Mój szablon', m_lgsaved:'Szablon zapisany', h_lgpreset:'Zapisany szablon przechowuje pod nazwą bieżącą szorstkość oraz wybory rzeka/jezioro/teren i dodaje go do powyższej listy; wędruje razem z plikiem projektu.', o_climate:'Klimat', o_climate_on:'Użyj modelu klimatu', o_climate_eq:'Położenie równika', o_climate_str:'Siła cienia opadowego', o_climate_wind:'Pokaż strzałki wiatru', h_climate:'Przesuń równik ze środka płótna, aby tworzyć mapy jednej półkuli lub mapy polarne. Wiatr osusza komórki za górami (cień opadowy) i nawilża te przed nimi — kolejne „Przypisz biomy” bierze to pod uwagę.', copied:'Skopiowano', copy:'Kopiuj', exp_share_embedcode:'Kod osadzania (iframe)', exp_share_gen:'🔗 Generuj link', exp_share_help:'Brak serwera — obraz mapy jest osadzany bezpośrednio w linku (w części # adresu URL). Link nigdzie nie jest wysyłany, chyba że sam go udostępnisz; duże mapy dają dłuższe linki.', exp_share_link:'Link', exp_share_sizehint:'Długość linku ≈ {kb} KB', exp_share_t:'Link do udostępniania', h_biomegen:'Automatycznie wypełnia warstwę terenu na podstawie wysokości i szerokości geograficznej; zastępuje bieżącą warstwę terenu.', h_rivergen:'Dodaje rzeki płynące do morza na podstawie siatki wysokości. Wymaga gór/wzgórz namalowanych pędzlem "Wysokość".', h_roadgen:'Rysuje drogi między symbolami osad (miasto/miasteczko/wieś/zamek/port), omijając strome zbocza. Łączy kilka losowych punktów lądu, jeśli nie ma osad.', h_settlegen:'Rozmieszcza symbole miasta/miasteczka/wsi na płaskim terenie blisko wybrzeża — najlepsze miejsce dostaje zamek/port, reszta miasteczka/wsie. "Generuj drogi" znajduje te symbole i je łączy. Każda osada otrzymuje nazwę z zasobu sylab regionu kulturowego, w którym leży.', o_settle_labels:'Zapisz nazwy także jako etykiety', lakegen_none:'Nie znaleziono odpowiedniego miejsca na jezioro.', o_biomegen:'Automatycznie przypisz biomy', o_biomegen_go:'🌍 Przypisz biomy', o_landgen_lakes:'Dodaj jeziora', o_landgen_rivers:'Dodaj rzeki', o_landgen_terrain:'Dodaj teren', o_rivergen:'Automatycznie generuj rzeki', o_rivergen_go:'💧 Generuj rzeki', o_roadgen:'Automatycznie generuj drogi', o_roadgen_go:'🛤️ Generuj drogi', o_seacolor:'Kolor morza', o_settlegen:'Automatycznie rozmieść osady', o_settlegen_go:'🏰 Rozmieść osady', o_symlegend:'Legenda', panel_toggle_left:'Przełącz lewy panel', panel_toggle_right:'Przełącz prawy panel', regions_maptree:'Drzewo map', regions_political:'Regiony polityczne', regions_political_empty:'Brak jeszcze nazwanych regionów. Narysuj narzędziem "Terytorium", a potem nadaj nazwę.', rivergen_noelev:'Najpierw namaluj góry/wzgórza pędzlem "Wysokość".', rivergen_none:'Nie znaleziono odpowiedniego źródła rzeki.', roadgen_noland:'Nie znaleziono wystarczającej ilości lądu/punktów na drogi.', roadgen_none:'Nie udało się wygenerować dróg — masy lądowe mogą być rozłączone.', sc_cancel:'Anuluj / odznacz', sc_delete:'Usuń zaznaczenie', sc_finish:'Zakończ ścieżkę', sc_fit:'Dopasuj do ekranu', sc_general:'Ogólne', sc_help:'Otwórz ten ekran', sc_pan:'Przesuń', sc_panfast:'Szybsze przesuwanie', sc_redo:'Ponów', sc_rotsym:'Obróć symbol', sc_save:'Zapisz', sc_title:'Skróty klawiszowe', sc_undo:'Cofnij', sc_zoom:'Powiększ / pomniejsz', settlegen_noland:'Nie znaleziono odpowiedniego lądu na osady.', settlegen_none:'Nie udało się rozmieścić żadnych osad.', share_editbtn:'Otwórz w Wayborne', tab_regions:'Regiony', tab_todo:'Zadania', todo_add:'Dodaj', todo_empty:'Brak jeszcze zadań.', todo_placeholder:'Nowe zadanie...'
    },
    ar: { tut_extras:'ما وراء الأدوات — مولّدات تلقائية', tut_extras_d:'هذه ليست في شريط الأدوات؛ تظهر في اللوحة اليمنى عند اختيار الأداة المرتبطة بها.', o_measurearea:'إغلاق كمساحة', tpa_undo:'تراجع عن آخر نقطة', tpa_finish:'إنهاء', tpa_cancel:'إلغاء',
      new:'جديد', open:'فتح', save:'حفظ', parchment:'رَق', grid:'شبكة', shore:'ساحل', 
       o_gridsec:'الشبكة', o_gridtype:'النوع', o_grid_square:'مربّعة',
      o_grid_hex:'سداسية', o_grid_dot:'نقطية', o_gridcell:'حجم الخلية', o_gridcolor:'اللون', o_gridop:'الوضوح',
      h_grid:'فعِّل الشبكة من مربّع «شبكة» في الشريط العلوي. الشبكة السداسية هي المعيار في ألعاب الأدوار الورقية.',
      o_polsec:'الخريطة السياسية', o_polmode:'العرض السياسي', o_polmute:'إخفات نسيج التضاريس', o_pollegend:'إظهار المفتاح',
      o_polfill:'شدّة التعبئة', o_polcolors:'إسناد ألوان الدول تلقائيًا', o_polname:'اسم المنطقة المحدَّدة',
      o_polname_ph:'اسم الدولة', h_political:'العرض السياسي ليس طبقة منفصلة؛ إنما يعرض المناطق التي رسمتها بوصفها دولًا.',
      o_stategensec:'توليد الدول والثقافات', o_polmodesel:'العرض', o_polmode_state:'الدول', o_polmode_culture:'الثقافات', o_stcount:'عدد الدول', o_stvariety:'تنوّع الحجم', o_stategen_go:'👑 توليد الدول', h_stategen:'يولّد حدود دول تنمو في آنٍ واحد من كل عاصمة وتتلاءم تمامًا مع بعضها. يحافظ على مناطقك المرسومة يدويًا ويضيف إليها.', o_cucount:'عدد الثقافات', o_culturegen_go:'🎭 توليد الثقافات', h_culturegen:'يولّد مناطق ثقافية تنمو على شبكتها الخاصة، بمعزل عن حدود الدول — بدّل بين عرض الدول/الثقافات عبر محدد «العرض» أعلاه.', o_stedit:'المنطقة المحدَّدة', h_stedit_none:'حدّد منطقة على الخريطة أو من تبويب «المناطق» على اليمين لتحريرها.', o_stgov:'شكل الحكم', o_stcapital:'العاصمة', o_stcapital_pick:'اختر العاصمة على الخريطة', o_stcapital_cancel:'إلغاء اختيار العاصمة', o_stmake:'تحويل إلى دولة', o_stunmake:'إزالة صفة الدولة', o_stemblem:'شعار النبالة', o_stemblem_gen:'توليد شعار', o_stemblem_reroll:'توليد من جديد', o_stemblem_png:'تنزيل PNG', o_stemblem_clear:'إزالة الشعار', h_stemblem:'يُرسم الشعار بالشيفرة؛ تُحفظ بذرته مع الدولة، فالبذرة نفسها تعطي الشعار نفسه دائمًا. يظهر بجوار العاصمة في العرض السياسي.', o_polemblem:'إظهار الشعارات', m_emblem:'تم توليد الشعار', h_stedit:'عند تحويل منطقة مرسومة يدويًا إلى دولة تحصل على اسم وشكل حكم وعاصمة، ثم تُدرَج وتُلوَّن تمامًا مثل أي دولة مولَّدة.', m_stmade:'حُوّلت المنطقة إلى دولة', m_stunmade:'لم تعد المنطقة دولة', m_capitalpick:'انقر موضع العاصمة على الخريطة (Esc للإلغاء)', st_capital_sea:'يجب أن تكون العاصمة على اليابسة.', st_capital_set:'نُقلت العاصمة', o_provcount:'مقاطعات لكل دولة', o_provgen_go:'توليد المقاطعات', h_provgen:'يقسّم حدود كل دولة إلى مناطق فرعية؛ ولا يتجاوز حدُّ المقاطعة حدودَ دولتها أبدًا.', m_provgen:'مقاطعة تم توليدها', prov_nostate:'ولّد الدول أولًا — المقاطعات تقسيمات داخل الدول.', prov_none:'تعذّر توليد المقاطعات (الدول أصغر من اللازم).', o_diplosec:'الدبلوماسية', h_diplo_none:'يلزم وجود دولتين على الأقل لتحديد العلاقات.', o_diplo_a:'الدولة أ', o_diplo_b:'الدولة ب', o_diplo_rel:'العلاقة', rel_peace:'سلام', rel_alliance:'تحالف', rel_war:'حرب', rel_vassal:'تبعية', diplo_same:'لا يمكن أن تكون للدولة علاقة مع نفسها.', o_polmode_religion:'الأديان', o_recount:'عدد الأديان', o_religiongen_go:'توليد الأديان', m_religiongen:'منطقة دينية تم توليدها', o_citysec:'توليد المدينة', h_city_nosel:'حدّد منطقة أولًا — تُولَّد المدينة داخل حدودها.', o_citydistrict:'نوع الحيّ', o_citybuildings:'عدد المباني', o_citystreet:'عرض الشوارع', o_citywall:'أضِف الأسوار والبوابات', o_citygen_go:'توليد مدينة', h_citygen:'يقسّم المنطقة المحدَّدة إلى مربّعات سكنية بجادّات وأزقّة، ثم المربّعات إلى قطع، ويضع في كل قطعة مبنى يناسب نوع الحيّ وواجهته نحو أقرب شارع. يُتراجَع عنه بخطوة واحدة.', m_citygen:'مبنى تم وضعه', city_noarea:'حدّد أولًا منطقة تتّسع للمدينة.', city_small:'المنطقة المحدَّدة أصغر من أن تتّسع لمدينة.', dist_craftsmen:'الحرفيون', dist_market:'السوق', dist_noble:'النبلاء', dist_slum:'الحي الفقير', dist_temple:'المعبد', dist_harbour:'المرفأ', accent_t:'لون تمييز الواجهة (نقر يمين: إعادة الضبط)', o_speak:'اقرأ الاسم بصوت مسموع', url_generated:'أُنشئت الخريطة من البذرة الموجودة في الرابط', url_badtemplate:'القالب المذكور في الرابط غير صالح.', exp_gis_t:'تصدير البيانات المتجهة بصيغة GeoJSON (QGIS وغيره)', gis_done:'عنصرًا تم تصديره بصيغة GeoJSON', gis_empty:'لا توجد عناصر متجهة للتصدير.', m_stategen:'دولة تم توليدها', m_culturegen:'منطقة ثقافية تم توليدها', stategen_noland:'لا توجد يابسة كافية لتوليد الدول.', stategen_none:'تعذّر توليد الدول/الثقافات.', gov_kingdom:'مملكة', gov_empire:'إمبراطورية', gov_theocracy:'دولة دينية', gov_republic:'جمهورية', gov_confederation:'كونفدرالية', gov_citystate:'مدينة دولة', m_polon:'العرض السياسي مُفعَّل', m_poloff:'العرض الطبيعي', m_polcolored:'منطقة مُلوَّنة', m_polempty:'ارسم منطقة أولًا',
      o_nameculture:'الثقافة', o_namefeature:'النوع', o_namegen:'🎲 اقترح اسمًا', o_nf_settlement:'مستوطنة', o_nf_city:'مدينة',
      o_nf_river:'نهر', o_nf_mountain:'جبل', o_nf_forest:'غابة', o_nf_region:'إقليم', o_nf_lake:'بحيرة', o_nf_sea:'بحر',
      tpl_title:'ابدأ من قالب', tpl_desc:'ابدأ بخطّ ساحلي جاهز، ثم ابنِ عالمك فوقه.', tpl_ready:'اللوحة جاهزة',
      tpl_continent:'قارّة', tpl_continent_d:'كتلة يابسة واسعة بسواحل متعرّجة', tpl_island:'جزيرة',
      tpl_island_d:'جزيرة كبيرة واحدة في عرض البحر', tpl_archipelago:'أرخبيل', tpl_archipelago_d:'جزر متناثرة ومضائق ضحلة',
      tpl_kingdom:'مملكة', tpl_kingdom_d:'سواحل هادئة وداخل صالح للزراعة', tpl_battle:'خريطة معركة',
      tpl_battle_d:'أرض صغيرة بشبكة سداسية', tpl_blank:'لوحة فارغة', tpl_blank_d:'ابدأ من الصفر',
      o_outlinecolor:'لون الحدّ الخارجي', exp_html_t:'HTML بملف واحد', exp_print_t:'طباعة / PDF', exp_png2_t:'دقّة 2×',
      exp_png4_t:'دقّة 4×', exp_maxdim:'الضلع الأطول', exp_format:'الصيغة', exp_fmt_png:'‏PNG · حادّ، ملف كبير',
      exp_fmt_jpeg:'‏JPEG · ملف صغير', exp_title:'العنوان',
      exp_html_help:'يُنزَّل ملف ‎.html واحد يتضمّن الخريطة وعارضًا صغيرًا مدمجًا بداخله. لا حاجة إلى خادم — أرسل الملف وانقر عليه نقرًا مزدوجًا.',
      exp_page:'حجم الصفحة', exp_orient:'الاتجاه', exp_portrait:'طولي', exp_landscape:'عرضي', exp_margin:'الهامش',
      exp_dpi:'الدقّة', exp_dpi_screen:'شاشة', exp_dpi_normal:'طباعة عادية', exp_dpi_high:'جودة عالية',
      exp_print_help:'يفتح نافذة الطباعة في متصفّحك. ومنها يمكنك الإرسال إلى الطابعة أو اختيار «حفظ بصيغة PDF».',
      printing:'جارٍ تجهيز الطباعة', print_failed:'تعذّر فتح نافذة الطباعة', viewer_hint:'اسحب · بالعجلة · نقر مزدوج',
      viewer_in:'تكبير', viewer_out:'تصغير', viewer_fit:'ملاءمة', t_sketch:'رسم حرّ', o_sketch:'رسم حرّ',
      h_sketch:'فرشاة حرّة ترسم على الطبقات التي تضيفها أنت فقط. أضِف طبقة بزرّ «+ أضف طبقة» في لوحة الطبقات، ثم اخترها من القائمة، ثم ارسم على الخريطة.',
      o_hardness:'الصلابة', o_sketch_eraser:'وضع المِمحاة', sketch_target:'الطبقة الهدف',
      sketch_need_layer:'أضِف طبقتك أولًا ثم اخترها من القائمة', layer_add:'+ أضف طبقة',
      h_add_layer:'الطبقات التي تضيفها أنت مخصّصة للرسم الحرّ؛ ارسم عليها بأداة «رسم حرّ».',
      layer_added:'أُضيفت طبقة', layer_untitled:'طبقة', layer_max:'يمكن إضافة 12 طبقة مستخدم كحدّ أقصى', layer_rename:'اسم الطبقة',
      layer_rename_hint:'انقر نقرًا مزدوجًا لإعادة التسمية', layer_delete:'حذف الطبقة',
      layer_delete_confirm:'أتريد حذف هذه الطبقة وكلّ ما رُسم عليها؟',
      tut_h_sketch:'يرسم بحرّية على الطبقات التي تضيفها أنت؛ اللون والحجم والصلابة والشفافية ووضع المِمحاة قابلة للضبط.',
      o_typography:'الطباعة والخطوط', o_font:'عائلة الخط', o_banner:'لافتة', o_banner_none:'بلا', o_banner_ribbon:'شريط',
      o_banner_plate:'لوحة', o_banner_scroll:'مخطوطة', o_banner_stone:'حجر', o_caps:'حروف كبيرة', o_outline:'حدّ خارجي',
      o_shadow:'ظلّ',
      h_font_missing:'هذه العائلة الخطّية غير مثبَّتة على هذا الجهاز؛ يُستخدَم أقرب بديل لها. العناصر المعلَّمة بـ · مثبَّتة.',
      grp_navigate:'التنقّل', grp_terrain:'التضاريس', grp_water:'المياه والطرق', grp_markers:'العلامات',
      grp_regions:'المناطق والقياس', t_select:'تحديد', t_landmass:'يابسة', t_erase:'بحر', t_fill:'تعبئة', t_terrain:'تضاريس',
      t_symbol:'رمز', t_river:'نهر', t_road:'طريق', t_label:'تسمية', t_pan:'تحريك', t_eyedrop:'أخذ عيّنة', t_measure:'قياس',
      h_measure:'انقر لإضافة نقاط وقياس مسافة متعددة الأجزاء. Enter أو النقر المزدوج للإنهاء، Esc للإلغاء. يمكن تحديد خطوط القياس ونقلها وحذفها؛ وهي مستثناة من تصدير PNG/SVG.',
      t_lasso:'أُنشوطة',
      h_lasso:'اسحب لرسم منطقة مغلقة: تُرفَع اليابسة والتضاريس والارتفاع داخلها معًا وتصبح قابلة للنقل. اسحب للنقل، واستخدم المقبض العلوي للتدوير. Enter للتثبيت، Escape للإلغاء، Delete لحذف المنطقة كليًا.',
      o_landmass:'اليابسة / الساحل', o_brushsize:'حجم الفرشاة', o_rough:'خشونة الساحل', o_landcolor:'لون اليابسة',
      o_shorew:'عرض الساحل', o_shorestyle:'نمط الساحل', o_shore_sandy:'رملي', o_shore_rocky:'صخري', o_shore_reef:'شعاب',
      o_smooth:'تنعيم خطّ الساحل', o_clearland:'مسح اليابسة',
      h_landmass:'اسحب لرسم اليابسة. أداة «بحر» تمحو اليابسة والتضاريس معًا.', o_landgen:'توليد يابسة عشوائية',
      o_landgentpl:'القالب', o_landgen_continent:'قارّة', o_landgen_island:'جزيرة', o_landgen_archipelago:'أرخبيل',
      o_landgenrough:'التفاصيل / الخشونة', o_landgen_go:'توليد',
      h_landgen:'يستبدل طبقة اليابسة الحالية. انقر مرّة أخرى بالإعدادات نفسها للحصول على نتيجة عشوائية جديدة.',
      o_terrain:'رسم التضاريس', o_opacity:'الشفافية', o_clip:'ارسم على اليابسة فقط', o_clearterrain:'مسح طبقة التضاريس',
      h_terrain:'تتوزّع العلامات عشوائيًا في كلّ ضربة فرشاة — بلا نمط متكرّر.', t_elevation:'الارتفاع', o_elevation:'الارتفاع',
      o_elevstrength:'الشدّة', o_elevlower:'وضع الخفض', o_clearelevation:'مسح الارتفاع', o_elevdisplay:'العرض',
      o_elevhillshade:'تظليل التلال', o_elevcontours:'خطوط الكنتور', o_contourinterval:'فاصل الكنتور',
      h_elevation:'اسحب لرفع الأرض؛ فعِّل «وضع الخفض» لحفرها. يتحدّث تظليل التلال تلقائيًا.', o_symbol:'رمز', o_size:'الحجم',
      o_rot:'الدوران', o_hue:'إزاحة اللون', o_wear:'البلى', o_jitter:'عشوائية الموضع',
      h_symbol:'اختر رمزًا ثم انقر على الخريطة. استخدم «تحديد» للنقل، وDelete للحذف.', o_river:'نهر', o_width:'العرض',
      o_meander:'التعرّج', o_taper:'تضييق عند المنبع', o_color:'اللون',
      h_path:'انقر لإضافة نقاط. Enter أو نقر مزدوج للإنهاء، Esc للإلغاء.', o_road:'طريق / درب قوافل', o_label:'تسمية',
      o_preset:'نمط جاهز', o_curve:'الانحناء', o_track:'تباعد الحروف', o_snappath:'محاذاة إلى مسار (نهر/طريق)',
      h_label:'اختر نمطًا، اكتب النصّ، ثم انقر على الخريطة. تُطبَّق الإعدادات فورًا على التسمية المحدَّدة.',
      o_eyedrop:'آخذ عيّنات النسيج', o_eye_nosample:'لا عيّنة بعد', o_eye_radius:'نصف قطر العيّنة', o_eye_brush:'حجم الفرشاة',
      o_eye_pick:'① اختر منطقة', o_eye_paint:'② ابدأ الرسم', o_eye_clear:'مسح العيّنة',
      h_eyedrop:'① اختر منطقة: اسحب دائرة. ② ارسم: طبِّق النسيج المأخوذ.', eyeOk:'✓ أُخذت عيّنة النسيج',
      eyeFail:'فشل أخذ العيّنة — جرِّب فوق يابسة أو تضاريس.', eyePick:'انقر واسحب على الخريطة ← اضبط حجم الدائرة ← أفلِت.',
      eyePaint:'انقر واسحب على الخريطة ← يُطبَّق النسيج.', eyeNeed:'خُذ عيّنة نسيج أولًا عبر ① اختر منطقة.', o_selection:'التحديد',
      o_nosel:'لا شيء محدَّد', o_dup:'تكرار', o_del:'حذف', o_scalebar:'شريط المقياس', o_scvis:'إظهار على الخريطة', o_sclen:'الطول',
      o_scsize:'حجم النصّ', o_scsegs:'الأقسام', h_scale:'اسحب شريط المقياس على الخريطة لتغيير موضعه.', o_view:'العرض',
      o_fit:'ملاءمة الشاشة', o_100:'100%',
      h_pan:'اسحب بالزرّ الأيمن، أو الزرّ الأوسط، أو Space مع السحب، أو استخدم مفاتيح الأسهم للتحريك.', tab_layers:'الطبقات',
      tab_library:'المكتبة', tab_history:'السجلّ', ref_title:'صورة مرجعية', ref_export:'تضمينها في التصدير',
      ref_clear:'إزالة المرجع', ref_trace:'وضع التتبّع (إظهارها فوق الكلّ + محاذاة خطّ الساحل)', ref_scan:'⌖ مسح الجغرافيا', h_ref_scan:'يستخرج خطّ الساحل والبحيرات والأنهار من الصورة المرجعية. رموز الخريطة كالمدن والجبال لا تُخلط بالجغرافيا — تستمرّ الأرض تحتها دون انقطاع. يستبدل اليابسة الحالية.', scan_title:'جارٍ مسح الخريطة', scan_cancel:'إلغاء', scan_prepare:'تحضير الصورة', scan_markers:'فرز رموز الخريطة', scan_clean:'إكمال الأرض تحت الرموز', scan_coast:'استخراج خطّ الساحل', scan_water:'فصل الأنهار والبحيرات', scan_commit:'الكتابة إلى الطبقات', scan_noimage:'حمّل صورة مرجعية أوّلاً.', scan_flat:'لم يُعثر على منطقتَي لون متمايزتين في الصورة — يتعذّر تمييز اليابسة عن البحر.', scan_noland:'لم يُعثر على يابسة في الصورة.', scan_failed:'تعذّر إكمال المسح.', scan_done:'اكتمل المسح — {r} أنهار، {l} بحيرات؛ وتُخطّي {m} من رموز الخريطة.',
      layer_drag_hint:'امسك من هنا لسحب الطبقة وإعادة ترتيبها', blend_sourceover:'عادي', blend_multiply:'ضرب',
      blend_overlay:'تراكب', blend_softlight:'ضوء ناعم', blend_screen:'شاشة', nav_home:'الرئيسية', nav_canvas:'اللوحة',
      nav_tutorial:'الدليل', nav_community:'المجتمع', home_tagline:'محرِّر خرائط يعمل في المتصفّح لعوالم الخيال',
      home_desc:'ارسم حدود اليابسة والبحر، ولوِّن الغابات والجبال، وضَع القلاع والقرى، ومدَّ الأنهار والطرق — كلّ ذلك على لوحة واحدة، داخل متصفّحك، دون أيّ تثبيت.',
      home_cta:'ابدأ خريطتك', home_video_caption:'فيديو تعريفي قريبًا', canvas_new_title:'إنشاء لوحة جديدة',
      canvas_custom:'مقاس مخصّص…', canvas_name_ph:'اسم الخريطة', canvas_create:'إنشاء', canvas_import:'استيراد من ملف ‎.json',
      canvas_saved_title:'اللوحات المحفوظة',
      canvas_empty:'لا توجد لوحات محفوظة في هذا المتصفّح بعد. تظهر هنا تلقائيًا عند الضغط على «حفظ» داخل المحرِّر.',
      canvas_open:'فتح', canvas_delete:'حذف', canvas_delete_confirm:'أتريد حذف هذه اللوحة؟ لا يمكن التراجع عن ذلك.',
      canvas_unnamed:'خريطة بلا عنوان', tutorial_title:'الدليل',
      tutorial_intro:'كلّ أداة في شريط الأدوات الجانبي تفتح إعداداتها الخاصّة في اللوحة المقابلة. في ما يلي ملخّص سريع لعمل كلّ أداة.',
      community_title:'المجتمع', community_desc:'Wayborne Map Editor مشروع مفتوح المصدر ويتطوّر باستمرار.',
      community_github_desc:'الشيفرة المصدرية وبلاغات الأخطاء والمساهمات', community_soon:'قريبًا',
      lib_full:'مساحة تخزين المتصفّح ممتلئة — احذف لوحة قديمة أو صدِّرها بصيغة ‎.json.',
      tut_h_select:'حدِّد الكائنات وانقلها ودوِّرها؛ Shift مع النقر للتحديد المتعدّد.',
      tut_h_erase:'يمحو اليابسة المرسومة ونسيج التضاريس فوقها في خطوة واحدة.', tut_h_fill:'يملأ داخل خطّ ساحلي مغلق بنقرة واحدة.',
      tut_h_river:'انقر لإضافة نقاط ورسم نهر؛ Enter للإنهاء.', tut_h_road:'انقر لإضافة نقاط ورسم طريق؛ Enter للإنهاء.',
      sym_upload:'+ ارفع رمز PNG', sym_upload_done:'رمز/رموز حُمِّلت', sym_del:'حذف', sym_search:'ابحث في الرموز…', sym_recent:'المستخدمة مؤخرًا',
      st_pos:'الموضع', st_zoom:'التقريب', st_size:'اللوحة', st_tool:'الأداة', cancel:'إلغاء', ok:'موافق',
      locked:'الطبقة مقفلة أو مخفية.', needtext:'اكتب نصّ التسمية أولًا.', nopathnear:'لا يوجد نهر أو طريق قريب.',
      fill_toolarge:'المنطقة كبيرة جدًا — جرِّب داخل حدّ مغلق.', exported:'صُدِّر:', saved:'حُفظ المشروع.',
      loaded:'حُمِّل المشروع.', badfile:'ملف مشروع غير صالح.', newmap:'أُنشئت خريطة جديدة.',
      confirmNew:'ستُلغى الخريطة الحالية. اختر حجم اللوحة:',
      confirmSize:'تغيير حجم اللوحة يعيد تحجيم الطبقات الموجودة. أتريد المتابعة؟', histStart:'البداية', selNone:'لا شيء محدَّد',
      symbols:'رمز', selScale:'شريط المقياس محدَّد', o_front:'إلى الأمام تمامًا',
      o_back:'إلى الخلف تمامًا', o_fwd:'خطوة إلى الأمام', o_bwd:'خطوة إلى الخلف', o_group:'تجميع', o_ungroup:'فكّ التجميع',
      selMulti:'كائن محدَّد', t_lake:'بحيرة', o_lake:'بحيرة', h_lake:'انقر لإضافة نقاط، ومع 3 نقاط أو أكثر اضغط Enter للإغلاق.',
      t_territory:'منطقة', o_territory:'منطقة', o_territorycolor:'لون التعبئة', o_territorybcolor:'لون الحدّ',
      h_territory:'انقر لإضافة نقاط، ومع 3 نقاط أو أكثر اضغط Enter للإغلاق.', t_regionlink:'رابط منطقة',
      h_regionlink:'انقر على الخريطة وسمِّها: تُنشَأ خريطة منطقة جديدة فارغة. انقر نقرًا مزدوجًا على الدبّوس بأداة «تحديد» للدخول إليها، واستخدم «رجوع» في الأعلى للعودة إلى خريطة العالم.',
      rl_newtitle:'خريطة منطقة جديدة', rl_placeholder:'اسم المنطقة', rl_default:'منطقة بلا اسم', rl_open:'ادخل المنطقة ←',
      bc_back:'رجوع', bc_world:'خريطة العالم', t_resource:'مورد', o_resourcetype:'النوع', rs_mine:'منجم', rs_farm:'أرض زراعية',
      rs_hunting:'أرض صيد', rs_fishing:'موضع صيد سمك', rs_trade:'مركز تجاري', rs_quarry:'محجر',
      h_resource:'انقر على الخريطة لوضع علامة مورد من النوع المحدَّد.', o_lakecolor:'لون البحيرة', o_symbbrush:'وضع الفرشاة',
      o_symbdensity:'الكثافة', o_clipland:'القصّ على اليابسة (فرشاة)', o_windrose:'وردة الرياح', o_wrvis:'إظهار على الخريطة',
      o_wrsize:'الحجم', o_wrstyle_classic:'كلاسيكي', o_wrstyle_minimal:'مبسَّط', o_wrstyle:'النمط', o_wrcolor:'اللون',
      h_windrose:'اسحب على الخريطة لتغيير الموضع.', o_snap:'محاذاة إلى الشبكة', o_snapsize:'حجم الشبكة', o_frame:'إطار الخريطة',
      o_frame_none:'بلا', o_frame_simple:'خطّ بسيط', o_frame_rope:'حبل', o_frame_ornate:'مزخرف', o_frame_color:'اللون',
      biomegen_empty:'ارسم اليابسة أولاً.', o_zonetype:'نوع المنطقة', o_zone_none:'— بلا نوع (منطقة سياسية) —', o_zone_war:'منطقة حرب', o_zone_anomaly:'شذوذ', o_zone_forbidden:'منطقة محظورة', o_zone_hunting:'أرض صيد', o_zone_quarantine:'حَجْر صحي', o_zone_sacred:'أرض مقدسة', o_zone_trade:'منطقة تجارية', h_zonetype:'المنطقة التي لها نوع لا تنتمي إلى أي من عروض الدولة/الثقافة/الدين؛ تُرسم بتظليلها الخاص في كل العروض.', o_note:'ملاحظة', o_note_ph:'ملاحظتك عن هذا العنصر…', o_note_show:'إظهار علامات الملاحظات على الخريطة', o_nb_edit:'أضف ثقافتك الخاصة', o_nb_name:'اسم الثقافة', o_nb_bas:'مقاطع البداية: Ash, Bram, Dun', o_nb_orta:'الأصوات الوسطى: a, e, i', o_nb_son:'مقاطع النهاية: ford, dale, ton', o_nb_birlesik:'مركّب (Ashford) — إن أُوقف فمتدفّق (Valeria)', o_nb_add:'إضافة', o_nb_del:'حذف الثقافة المحددة', h_nb:'الثقافة التي تضيفها خاصة بهذا المشروع، وتُحفظ مع ملف المشروع، ويمكن لمولّد الثقافات/الأديان استخدامها أيضًا.', nb_needname:'اكتب اسم الثقافة أولًا.', nb_needsyl:'لا يمكن ترك مقاطع البداية والنهاية فارغة.', nb_builtin:'لا يمكن حذف الثقافات المدمجة.', m_nbadded:'أُضيفت الثقافة', m_nbdeleted:'حُذفت الثقافة', o_lgsave:'حفظ كقالب', o_lgdel:'حذف القالب', o_lgsave_ask:'سمِّ هذا القالب:', o_lgsave_def:'قالبي', m_lgsaved:'حُفظ القالب', h_lgpreset:'القالب المحفوظ يخزّن باسمٍ درجةَ الخشونة الحالية وخيارات النهر/البحيرة/التضاريس ويضيفه إلى القائمة أعلاه، وينتقل مع ملف المشروع.', o_climate:'المناخ', o_climate_on:'استخدام نموذج المناخ', o_climate_eq:'موضع خط الاستواء', o_climate_str:'قوة ظل المطر', o_climate_wind:'إظهار أسهم الرياح', h_climate:'حرّك خط الاستواء بعيدًا عن منتصف اللوحة لصنع خرائط نصف كرة واحد أو خرائط قطبية. تجفّف الرياح الخلايا الواقعة خلف الجبال (ظل المطر) وترطّب التي أمامها — وسيأخذ تشغيل «إسناد الأحياء الحيوية» التالي ذلك في الحسبان.', copied:'تم النسخ', copy:'نسخ', exp_share_embedcode:'كود التضمين (iframe)', exp_share_gen:'🔗 إنشاء رابط', exp_share_help:'بلا خادم — تُضمَّن صورة الخريطة مباشرة داخل الرابط (في جزء # من العنوان). لا يُرفَع الرابط إلى أي مكان إلا إذا أرسلته بنفسك؛ الخرائط الكبيرة تُنتج روابط أطول.', exp_share_link:'الرابط', exp_share_sizehint:'طول الرابط ≈ {kb} كيلوبايت', exp_share_t:'رابط المشاركة', h_biomegen:'يملأ طبقة التضاريس تلقائيًا حسب الارتفاع وخط العرض؛ يستبدل طبقة التضاريس الحالية.', h_rivergen:'يضيف أنهارًا تصبّ في البحر بالاعتماد على شبكة الارتفاع. يتطلّب جبالًا/تلالًا مرسومة بفرشاة «الارتفاع».', h_roadgen:'يرسم طرقًا بين رموز المستوطنات (مدينة/بلدة/قرية/قلعة/ميناء) متجنّبًا المنحدرات الشديدة. يصل بضع نقاط يابسة عشوائية إن لم توجد مستوطنات.', h_settlegen:'يوزّع رموز المدن/البلدات/القرى على أرض مستوية قرب الساحل — يحصل أفضل موضع على قلعة/ميناء، والباقي على بلدات/قرى. يجد «توليد الطرق» هذه الرموز ويصلها ببعضها. يحصل كل مستوطنة على اسم من مخزون مقاطع المنطقة الثقافية التي تقع فيها.', o_settle_labels:'اكتب الأسماء كتسميات أيضًا', lakegen_none:'لم يُعثر على موضع مناسب لبحيرة.', o_biomegen:'تعيين النطاقات الحيوية تلقائيًا', o_biomegen_go:'🌍 تعيين النطاقات', o_landgen_lakes:'إضافة بحيرات', o_landgen_rivers:'إضافة أنهار', o_landgen_terrain:'إضافة تضاريس', o_rivergen:'توليد الأنهار تلقائيًا', o_rivergen_go:'💧 توليد الأنهار', o_roadgen:'توليد الطرق تلقائيًا', o_roadgen_go:'🛤️ توليد الطرق', o_seacolor:'لون البحر', o_settlegen:'وضع المستوطنات تلقائيًا', o_settlegen_go:'🏰 وضع المستوطنات', o_symlegend:'وسيلة الإيضاح', panel_toggle_left:'إظهار/إخفاء اللوحة اليسرى', panel_toggle_right:'إظهار/إخفاء اللوحة اليمنى', regions_maptree:'شجرة الخرائط', regions_political:'المناطق السياسية', regions_political_empty:'لا توجد مناطق مسمّاة بعد. ارسم بأداة «منطقة» ثم أعطِها اسمًا.', rivergen_noelev:'ارسم الجبال/التلال أولاً بفرشاة «الارتفاع».', rivergen_none:'لم يُعثر على منبع نهر مناسب.', roadgen_noland:'لم يُعثر على يابسة/نقاط كافية للطرق.', roadgen_none:'تعذّر توليد أي طرق — قد تكون الكتل اليابسة غير متصلة.', sc_cancel:'إلغاء / إلغاء التحديد', sc_delete:'حذف التحديد', sc_finish:'إنهاء المسار', sc_fit:'ملاءمة الشاشة', sc_general:'عام', sc_help:'فتح هذه الشاشة', sc_pan:'تحريك', sc_panfast:'تحريك أسرع', sc_redo:'إعادة', sc_rotsym:'تدوير الرمز', sc_save:'حفظ', sc_title:'اختصارات لوحة المفاتيح', sc_undo:'تراجع', sc_zoom:'تكبير / تصغير', settlegen_noland:'لم توجد يابسة مناسبة للمستوطنات.', settlegen_none:'تعذّر وضع أي مستوطنة.', share_editbtn:'فتح في Wayborne', tab_regions:'المناطق', tab_todo:'المهام', todo_add:'إضافة', todo_empty:'لا مهام بعد.', todo_placeholder:'مهمة جديدة…'
    },
    ru: { tut_extras:'Помимо инструментов — автоматические генераторы', tut_extras_d:'Их нет на панели инструментов — они появляются в правой панели при выборе соответствующего инструмента.', o_measurearea:'Замкнуть как площадь', tpa_undo:'Отменить последнюю точку', tpa_finish:'Завершить', tpa_cancel:'Отмена',
      new:'Новый', open:'Открыть', save:'Сохранить', parchment:'Пергамент', grid:'Сетка', shore:'Берег',
      o_gridsec:'Сетка', o_gridtype:'Тип', o_grid_square:'Квадрат', o_grid_hex:'Гексагон', o_grid_dot:'Точка', o_gridcell:'Размер ячейки', o_gridcolor:'Цвет', o_gridop:'Насыщенность', h_grid:'Включите сетку флажком «Сетка» вверху. Гексы — стандарт настольных ролевых игр.',
      o_polsec:'Политическая карта', o_polmode:'Политический вид', o_polmute:'Приглушить текстуру рельефа', o_pollegend:'Показать легенду', o_polfill:'Плотность заливки', o_polcolors:'Назначить цвета государств', o_polname:'Название выбранного региона', o_polname_ph:'Название государства', h_political:'Политический вид — не отдельный слой; он показывает нарисованные регионы как государства.', o_stategensec:'Генерация государств и культур', o_polmodesel:'Вид', o_polmode_state:'Государства', o_polmode_culture:'Культуры', o_stcount:'Количество государств', o_stvariety:'Разнообразие размеров', o_stategen_go:'👑 Создать государства', h_stategen:'Создаёт границы государств, которые одновременно растут от каждой столицы и точно стыкуются друг с другом. Сохраняет нарисованные вручную регионы, добавляет к ним.', o_cucount:'Количество культур', o_culturegen_go:'🎭 Создать культуры', h_culturegen:'Создаёт культурные регионы, растущие на собственной сетке, независимо от границ государств — переключайтесь между представлением государств/культур селектором «Вид» выше.', o_stedit:'Выбранный регион', h_stedit_none:'Чтобы отредактировать, выберите регион на карте или во вкладке «Регионы» справа.', o_stgov:'Форма правления', o_stcapital:'Столица', o_stcapital_pick:'Указать столицу на карте', o_stcapital_cancel:'Отменить выбор столицы', o_stmake:'Преобразовать в государство', o_stunmake:'Снять статус государства', o_stemblem:'Герб', o_stemblem_gen:'Создать герб', o_stemblem_reroll:'Создать заново', o_stemblem_png:'Скачать PNG', o_stemblem_clear:'Убрать герб', h_stemblem:'Герб рисуется кодом; его зерно сохраняется вместе с государством, поэтому одно и то же зерно всегда даёт один и тот же герб. Показывается рядом со столицей в политическом виде.', o_polemblem:'Показывать гербы', m_emblem:'Герб создан', h_stedit:'При преобразовании нарисованного вручную региона в государство он получает название, форму правления и столицу; после этого он отображается и раскрашивается так же, как созданное государство.', m_stmade:'Регион преобразован в государство', m_stunmade:'Регион больше не является государством', m_capitalpick:'Щёлкните место столицы на карте (Esc — отмена)', st_capital_sea:'Столица должна находиться на суше.', st_capital_set:'Столица перенесена', o_provcount:'Провинций на государство', o_provgen_go:'Создать провинции', h_provgen:'Делит границы каждого государства на подрегионы; граница провинции никогда не выходит за пределы своего государства.', m_provgen:'провинций создано', prov_nostate:'Сначала создайте государства — провинции являются их частями.', prov_none:'Не удалось создать провинции (государства слишком малы).', o_diplosec:'Дипломатия', h_diplo_none:'Для определения отношений нужно минимум два государства.', o_diplo_a:'Государство A', o_diplo_b:'Государство B', o_diplo_rel:'Отношение', rel_peace:'Мир', rel_alliance:'Союз', rel_war:'Война', rel_vassal:'Вассалитет', diplo_same:'Государство не может иметь отношения с самим собой.', o_polmode_religion:'Религии', o_recount:'Количество религий', o_religiongen_go:'Создать религии', m_religiongen:'религиозных областей создано', o_citysec:'Генерация города', h_city_nosel:'Сначала выберите регион — город создаётся в его границах.', o_citydistrict:'Тип квартала', o_citybuildings:'Количество зданий', o_citystreet:'Ширина улиц', o_citywall:'Добавить стены и ворота', o_citygen_go:'Создать город', h_citygen:'Делит выбранный регион проспектами и переулками на кварталы, кварталы — на участки, и ставит на каждом участке здание, подходящее типу квартала, фасадом к ближайшей улице. Отменяется одним шагом.', m_citygen:'зданий размещено', city_noarea:'Сначала выберите регион, в который поместится город.', city_small:'Выбранный регион слишком мал для города.', dist_craftsmen:'Ремесленный', dist_market:'Рыночный', dist_noble:'Знатный', dist_slum:'Трущобы', dist_temple:'Храмовый', dist_harbour:'Портовый', accent_t:'Акцентный цвет интерфейса (правый клик — сброс)', o_speak:'Произнести название', url_generated:'Карта создана по зерну из ссылки', url_badtemplate:'Шаблон в ссылке недействителен.', exp_gis_t:'Экспортировать векторные данные в GeoJSON (QGIS и др.)', gis_done:'объектов экспортировано в GeoJSON', gis_empty:'Нет векторных объектов для экспорта.', m_stategen:'государств создано', m_culturegen:'культурных регионов создано', stategen_noland:'Недостаточно суши для создания государств.', stategen_none:'Не удалось создать государства/культуры.', gov_kingdom:'Королевство', gov_empire:'Империя', gov_theocracy:'Теократия', gov_republic:'Республика', gov_confederation:'Конфедерация', gov_citystate:'Город-государство', m_polon:'Политический вид включён', m_poloff:'Физический вид', m_polcolored:'регионов раскрашено', m_polempty:'Сначала нарисуйте регион',
      o_nameculture:'Культура', o_namefeature:'Тип', o_namegen:'🎲 Предложить имя', o_nf_settlement:'Поселение', o_nf_city:'Город', o_nf_river:'Река', o_nf_mountain:'Гора', o_nf_forest:'Лес', o_nf_region:'Регион', o_nf_lake:'Озеро', o_nf_sea:'Море',
      tpl_title:'Начать с шаблона', tpl_desc:'Начните с готовой береговой линии, а затем стройте на ней свой мир.', tpl_ready:'холст готов',
      tpl_continent:'Континент', tpl_continent_d:'Обширная суша с изрезанными берегами', tpl_island:'Остров', tpl_island_d:'Один большой остров в открытом море', tpl_archipelago:'Архипелаг', tpl_archipelago_d:'Разбросанные острова и мелкие проливы', tpl_kingdom:'Королевство', tpl_kingdom_d:'Мягкие берега, плодородные земли', tpl_battle:'Карта сражения', tpl_battle_d:'Небольшая местность с гексагональной сеткой', tpl_blank:'Пустой холст', tpl_blank_d:'Начать с нуля',
      o_outlinecolor:'Цвет обводки',
      exp_html_t:'HTML одним файлом', exp_print_t:'Печать / PDF', exp_png2_t:'Разрешение 2×', exp_png4_t:'Разрешение 4×', exp_maxdim:'Длинная сторона', exp_format:'Формат', exp_fmt_png:'PNG · чётко, большой файл', exp_fmt_jpeg:'JPEG · маленький файл', exp_title:'Заголовок', exp_html_help:'Скачивается один файл .html с картой и небольшим просмотрщиком внутри. Сервер не нужен — отправьте файл и откройте двойным щелчком.', exp_page:'Размер страницы', exp_orient:'Ориентация', exp_portrait:'Книжная', exp_landscape:'Альбомная', exp_margin:'Поля', exp_dpi:'Разрешение', exp_dpi_screen:'экран', exp_dpi_normal:'обычная печать', exp_dpi_high:'высокое качество', exp_print_help:'Откроется окно печати браузера. Оттуда можно напечатать или выбрать «Сохранить как PDF».', printing:'Подготовка к печати', print_failed:'Не удалось открыть окно печати', viewer_hint:'тяните · колесо · двойной щелчок', viewer_in:'Приблизить', viewer_out:'Отдалить', viewer_fit:'Вписать',
      t_sketch:'Набросок', o_sketch:'Набросок', h_sketch:'Кисть свободного рисования работает только на слоях, которые вы добавили сами. Добавьте слой кнопкой «+ Добавить слой» в панели слоёв, выберите его в списке и рисуйте по карте.', o_hardness:'Жёсткость', o_sketch_eraser:'Режим ластика', sketch_target:'Целевой слой', sketch_need_layer:'Сначала добавьте свой слой и выберите его в списке', layer_add:'+ Добавить слой', h_add_layer:'Слои, добавленные вами, предназначены для свободного рисования; рисуйте по ним инструментом «Набросок».', layer_added:'Слой добавлен', layer_untitled:'Слой', layer_max:'Можно добавить не более 12 своих слоёв', layer_rename:'Название слоя', layer_rename_hint:'Дважды щёлкните, чтобы переименовать', layer_delete:'Удалить слой', layer_delete_confirm:'Удалить этот слой и всё нарисованное на нём?', tut_h_sketch:'Рисует от руки на слоях, добавленных вами; цвет, размер, жёсткость, непрозрачность и режим ластика настраиваются.',
      o_typography:'Типографика', o_font:'Гарнитура', o_banner:'Лента', o_banner_none:'Нет', o_banner_ribbon:'Лента', o_banner_plate:'Табличка', o_banner_scroll:'Свиток', o_banner_stone:'Камень', o_caps:'Прописные', o_outline:'Обводка', o_shadow:'Тень', h_font_missing:'Эта гарнитура не установлена на устройстве; используется ближайшая замена. Пункты с · установлены.',
      grp_navigate:'Навигация', grp_terrain:'Рельеф', grp_water:'Вода и пути', grp_markers:'Метки', grp_regions:'Регионы и мера',
      t_select:'Выделение', t_landmass:'Суша', t_erase:'Море', t_fill:'Заливка', t_terrain:'Местность', t_symbol:'Символ',
      t_river:'Река', t_road:'Дорога', t_label:'Надпись', t_pan:'Перемещение', t_eyedrop:'Пипетка', t_measure:'Измерить', h_measure:'Щёлкайте, чтобы добавлять точки и измерять расстояние из нескольких отрезков. Enter / двойной щелчок — завершить, Escape — отменить. Линии измерения можно выделять, перемещать или удалять; они не входят в экспорт PNG/SVG.', t_lasso:'Лассо', h_lasso:'Перетаскивайте, чтобы нарисовать замкнутую область: Суша + Местность + Рельеф поднимаются в ней вместе и становятся перемещаемыми. Перетаскивайте для перемещения, используйте верхний маркер для поворота. Enter — подтвердить, Escape — отменить, Delete — полностью удалить область.',
      o_landmass:'Суша / Берег', o_brushsize:'Размер кисти', o_rough:'Неровность берега',
      o_landcolor:'Цвет суши', o_shorew:'Ширина берега', o_shorestyle:'Стиль берега', o_shore_sandy:'Песчаный', o_shore_rocky:'Скалистый', o_shore_reef:'Риф',
      o_smooth:'Сгладить берег', o_clearland:'Очистить сушу',
      h_landmass:'Перетаскивайте, чтобы рисовать сушу. Инструмент «Море» стирает и сушу, и местность.', o_landgen:'Сгенерировать случайную сушу', o_landgentpl:'Шаблон', o_landgen_continent:'Континент', o_landgen_island:'Остров', o_landgen_archipelago:'Архипелаг', o_landgenrough:'Детализация / шероховатость', o_landgen_go:'Сгенерировать', h_landgen:'Заменяет текущий слой суши. Нажмите снова с теми же настройками для нового случайного результата.',
      o_terrain:'Рисование местности', o_opacity:'Непрозрачность', o_clip:'Рисовать только по суше',
      o_clearterrain:'Очистить слой местности',
      h_terrain:'Узоры при каждом мазке разбрасываются случайно — повторяющегося рисунка не будет.', t_elevation:'Высоты', o_elevation:'Рельеф', o_elevstrength:'Сила', o_elevlower:'Режим понижения', o_clearelevation:'Очистить рельеф', o_elevdisplay:'Отображение', o_elevhillshade:'Отмывка рельефа (hillshade)', o_elevcontours:'Горизонтали', o_contourinterval:'Шаг горизонталей', h_elevation:'Перетаскивайте, чтобы поднять рельеф; включите «Режим понижения», чтобы понизить его. Отмывка обновляется автоматически.',
      o_symbol:'Символ', o_size:'Размер', o_rot:'Поворот', o_hue:'Оттенок',
      o_wear:'Изношенность', o_jitter:'Случайное размещение',
      h_symbol:'Выберите символ из библиотеки, щёлкните по карте. «Выделение» — для перемещения; Delete — для удаления.',
      o_river:'Река', o_width:'Толщина', o_meander:'Извилистость',
      o_taper:'Сужать у истока', o_color:'Цвет',
      h_path:'Щёлкайте, чтобы добавить точки. Enter / двойной щелчок — завершить, Esc — отменить.',
      o_road:'Дорога / Караванный путь',
      o_label:'Надпись', o_preset:'Стиль оформления', o_curve:'Изгиб', o_track:'Межбуквенный интервал', o_snappath:'Привязать к пути (река/дорога)',
      h_label:'Выберите стиль, введите текст, щёлкните по карте. Изменения сразу применяются к выделенной надписи.',
      o_eyedrop:'Пипетка текстуры', o_eye_nosample:'Образец ещё не взят',
      o_eye_radius:'Радиус выборки', o_eye_brush:'Размер кисти',
      o_eye_pick:'① Выбрать область', o_eye_paint:'② Начать рисование', o_eye_clear:'Очистить образец',
      h_eyedrop:'① Выбрать область: растяните круг. ② Рисование: наносит взятую текстуру на карту.',
      eyeOk:'✓ Текстура взята', eyeFail:'Не удалось взять образец — попробуйте на суше/местности.',
      eyePick:'Щёлкните и потяните по карте → задайте размер круга → отпустите.',
      eyePaint:'Щёлкните и потяните по карте → текстура наносится.',
      eyeNeed:'Сначала возьмите образец через ① Выбрать область.',
      o_selection:'Выделение', o_nosel:'Ничего не выделено', o_dup:'Дублировать', o_del:'Удалить',
      o_scalebar:'Масштабная линейка', o_scvis:'Показывать на карте', o_sclen:'Длина',
      o_scsize:'Размер текста', o_scsegs:'Сегменты',
      h_scale:'Перетащите масштабную линейку по карте, чтобы переместить её.',
      o_view:'Вид', o_fit:'По размеру экрана', o_100:'100%',
      h_pan:'ПКМ + перетаскивание, СКМ, Пробел + перетаскивание или стрелки для перемещения.',
      tab_layers:'Слои', tab_library:'Библиотека', tab_history:'История',
      ref_title:'Референс-изображение', ref_export:'Включить в экспорт', ref_clear:'Убрать референс', ref_trace:'Режим трассировки (показать сверху + привязка к береговой линии)', ref_scan:'⌖ Сканировать географию', h_ref_scan:'Извлекает береговую линию, озёра и реки из референсного изображения. Условные знаки карты — города, горы — не попадают в географию: местность под ними продолжается без разрывов. Заменяет существующую сушу.', scan_title:'Сканирование карты', scan_cancel:'Отмена', scan_prepare:'Подготовка изображения', scan_markers:'Отбор условных знаков', scan_clean:'Достраивание местности под знаками', scan_coast:'Извлечение береговой линии', scan_water:'Разделение рек и озёр', scan_commit:'Запись в слои', scan_noimage:'Сначала загрузите референсное изображение.', scan_flat:'На изображении не найдено двух различимых цветовых областей — сушу и море не отделить.', scan_noland:'На изображении не найдено суши.', scan_failed:'Не удалось завершить сканирование.', scan_done:'Сканирование готово — рек: {r}, озёр: {l}; пропущено знаков: {m}.', layer_drag_hint:'Перетащите отсюда, чтобы изменить порядок слоя', blend_sourceover:'Обычный', blend_multiply:'Умножение', blend_overlay:'Перекрытие', blend_softlight:'Мягкий свет', blend_screen:'Экран', nav_home:'Главная', nav_canvas:'Холст', nav_tutorial:'Обучение', nav_community:'Сообщество', home_tagline:'Редактор карт фэнтезийных миров прямо в браузере', home_desc:'Рисуйте границы суши и моря, закрашивайте леса и горы, размещайте замки и деревни, прокладывайте реки и дороги — всё на одном холсте, в браузере, без установки.', home_cta:'Начать карту', home_video_caption:'Видео скоро появится', canvas_new_title:'Создать новый холст', canvas_custom:'Свой размер…', canvas_name_ph:'Название карты', canvas_create:'Создать', canvas_import:'Импорт из файла .json', canvas_saved_title:'Сохранённые холсты', canvas_empty:'В этом браузере пока нет сохранённых холстов. Они появятся здесь автоматически после нажатия «Сохранить» в редакторе.', canvas_open:'Открыть', canvas_delete:'Удалить', canvas_delete_confirm:'Удалить этот холст? Это действие необратимо.', canvas_unnamed:'Карта без названия', tutorial_title:'Обучение', tutorial_intro:'Каждый инструмент на левой панели открывает свои настройки в правой панели. Ниже — краткое описание каждого инструмента.', community_title:'Сообщество', community_desc:'Wayborne Map Editor — проект с открытым исходным кодом, который постоянно развивается.', community_github_desc:'Исходный код, отчёты об ошибках и вклад в проект', community_soon:'Скоро', lib_full:'Хранилище браузера заполнено — удалите старый холст или экспортируйте его как .json.', tut_h_select:'Выделяйте, перемещайте и вращайте объекты; Shift+клик для множественного выбора.', tut_h_erase:'Стирает закрашенную сушу и текстуру местности на ней за один шаг.', tut_h_fill:'Заливает внутреннюю часть замкнутого контура побережья одним щелчком.', tut_h_river:'Щёлкайте, чтобы добавить точки и нарисовать реку; Enter — завершить.', tut_h_road:'Щёлкайте, чтобы добавить точки и нарисовать дорогу; Enter — завершить.',
      sym_upload:'+ Загрузить PNG-символ', sym_upload_done:'символ(ов) загружено', sym_del:'Удалить', sym_search:'Поиск символов...', sym_recent:'Недавно использованные',
      st_pos:'Позиция', st_zoom:'Масштаб', st_size:'Холст', st_tool:'Инструмент',
      cancel:'Отмена', ok:'ОК',
      locked:'Слой заблокирован или скрыт.', needtext:'Сначала введите текст надписи.', nopathnear:'Река/дорога поблизости не найдена.', fill_toolarge:'Область слишком велика — попробуйте внутри замкнутой границы.',
      exported:'Экспортировано:', saved:'Проект сохранён.', loaded:'Проект загружен.',
      badfile:'Некорректный файл проекта.', newmap:'Создана новая карта.',
      confirmNew:'Текущая карта будет удалена. Выберите размер холста:',
      confirmSize:'Изменение размера холста масштабирует существующие слои. Продолжить?',
      histStart:'Начало', selNone:'Ничего не выделено', symbols:'символов',
      selScale:'Выделена масштабная линейка', o_front:'На передний план', o_back:'На задний план',
      o_fwd:'Переместить выше', o_bwd:'Переместить ниже',
      o_group:'Сгруппировать', o_ungroup:'Разгруппировать',
      selMulti:'объектов выделено',
      t_lake:'Озеро', o_lake:'Озеро', h_lake:'Щёлкайте, чтобы добавить точки; от 3 точек — Enter, чтобы замкнуть.', t_territory:'Территория', o_territory:'Территория', o_territorycolor:'Цвет заливки', o_territorybcolor:'Цвет границы', h_territory:'Щёлкайте, чтобы добавить точки; от 3 точек — Enter, чтобы замкнуть.', t_regionlink:'Ссылка на регион', h_regionlink:'Щёлкните по карте и задайте имя: будет создана новая, пустая карта региона. Дважды щёлкните по метке инструментом «Выбор», чтобы войти; используйте «Назад» в левом верхнем углу, чтобы вернуться на карту мира.', rl_newtitle:'Новая карта региона', rl_placeholder:'Название региона', rl_default:'Регион без названия', rl_open:'Войти в регион →', bc_back:'Назад', bc_world:'Карта мира', t_resource:'Ресурс', o_resourcetype:'Тип', rs_mine:'Рудник', rs_farm:'Пахотная земля', rs_hunting:'Охотничьи угодья', rs_fishing:'Место рыбной ловли', rs_trade:'Торговый пост', rs_quarry:'Каменоломня', h_resource:'Щёлкните по карте, чтобы разместить метку ресурса выбранного типа.',
      o_lakecolor:'Цвет озера',
      o_symbbrush:'Режим кисти', o_symbdensity:'Плотность', o_clipland:'Привязать к суше (кисть)',
      o_windrose:'Роза ветров', o_wrvis:'Показывать на карте', o_wrsize:'Размер',
      o_wrstyle_classic:'Классический', o_wrstyle_minimal:'Минималистичный', o_wrstyle:'Стиль', o_wrcolor:'Цвет', h_windrose:'Перетащите по карте, чтобы переместить.',
      o_snap:'Привязка к сетке', o_snapsize:'Размер сетки', o_frame:'Рамка карты', o_frame_none:'Нет', o_frame_simple:'Простая линия', o_frame_rope:'Канат', o_frame_ornate:'Узорная', o_frame_color:'Цвет',
      biomegen_empty:'Сначала нарисуйте сушу.', o_zonetype:'Тип зоны', o_zone_none:'— нет (политический регион) —', o_zone_war:'Зона боевых действий', o_zone_anomaly:'Аномалия', o_zone_forbidden:'Запретная зона', o_zone_hunting:'Охотничьи угодья', o_zone_quarantine:'Карантин', o_zone_sacred:'Священное место', o_zone_trade:'Торговая зона', h_zonetype:'Регион с типом не относится ни к одному из видов «государства/культуры/религии»; он рисуется собственной штриховкой во всех видах.', o_note:'Заметка', o_note_ph:'Ваша заметка об этом объекте…', o_note_show:'Показывать метки заметок на карте', o_nb_edit:'Добавить свою культуру', o_nb_name:'Название культуры', o_nb_bas:'Начальные слоги: Ash, Bram, Dun', o_nb_orta:'Срединные звуки: a, e, i', o_nb_son:'Конечные слоги: ford, dale, ton', o_nb_birlesik:'Составное (Ashford) — выключено: плавное (Valeria)', o_nb_add:'Добавить', o_nb_del:'Удалить выбранную культуру', h_nb:'Добавленная культура принадлежит этому проекту, сохраняется вместе с файлом проекта и может использоваться генератором культур и религий.', nb_needname:'Сначала введите название культуры.', nb_needsyl:'Начальные и конечные слоги не могут быть пустыми.', nb_builtin:'Встроенные культуры удалить нельзя.', m_nbadded:'Культура добавлена', m_nbdeleted:'Культура удалена', o_lgsave:'Сохранить как шаблон', o_lgdel:'Удалить шаблон', o_lgsave_ask:'Назовите этот шаблон:', o_lgsave_def:'Мой шаблон', m_lgsaved:'Шаблон сохранён', h_lgpreset:'Сохранённый шаблон хранит под именем текущую шероховатость и выбор «реки/озёра/ландшафт» и добавляет его в список выше; он переносится вместе с файлом проекта.', o_climate:'Климат', o_climate_on:'Использовать модель климата', o_climate_eq:'Положение экватора', o_climate_str:'Сила дождевой тени', o_climate_wind:'Показывать стрелки ветра', h_climate:'Сдвиньте экватор от середины холста, чтобы создавать карты одного полушария или полярные карты. Ветер осушает клетки за горами (дождевая тень) и увлажняет те, что перед ними, — следующий запуск «Назначить биомы» это учитывает.', copied:'Скопировано', copy:'Копировать', exp_share_embedcode:'Код для встраивания (iframe)', exp_share_gen:'🔗 Создать ссылку', exp_share_help:'Без сервера — изображение карты встраивается прямо в ссылку (в часть URL после #). Ссылка никуда не отправляется, пока вы сами её не пришлёте; для больших карт ссылки получаются длиннее.', exp_share_link:'Ссылка', exp_share_sizehint:'Длина ссылки ≈ {kb} КБ', exp_share_t:'Ссылка для доступа', h_biomegen:'Автоматически заполняет слой рельефа по высоте и широте; заменяет текущий слой рельефа.', h_rivergen:'Добавляет реки, стекающие в море по сетке высот. Требует гор/холмов, нарисованных кистью «Высоты».', h_roadgen:'Прокладывает дороги между символами поселений (город/посёлок/деревня/замок/порт), избегая крутых склонов. Соединяет несколько случайных точек суши, если поселений нет.', h_settlegen:'Расставляет символы городов/посёлков/деревень на ровной суше у берега — лучшее место получает замок/порт, остальные — посёлки/деревни. «Создать дороги» находит эти символы и соединяет их. Каждое поселение получает имя из слогового набора культурного региона, в котором оно находится.', o_settle_labels:'Также подписать названия на карте', lakegen_none:'Не найдено подходящее место для озера.', o_biomegen:'Автоматически назначить биомы', o_biomegen_go:'🌍 Назначить биомы', o_landgen_lakes:'Добавить озёра', o_landgen_rivers:'Добавить реки', o_landgen_terrain:'Добавить рельеф', o_rivergen:'Автоматически создать реки', o_rivergen_go:'💧 Создать реки', o_roadgen:'Автоматически создать дороги', o_roadgen_go:'🛤️ Создать дороги', o_seacolor:'Цвет моря', o_settlegen:'Автоматически разместить поселения', o_settlegen_go:'🏰 Разместить поселения', o_symlegend:'Легенда', panel_toggle_left:'Показать/скрыть левую панель', panel_toggle_right:'Показать/скрыть правую панель', regions_maptree:'Дерево карт', regions_political:'Политические регионы', regions_political_empty:'Именованных регионов пока нет. Нарисуйте инструментом «Территория», затем дайте название.', rivergen_noelev:'Сначала нарисуйте горы/холмы кистью «Высоты».', rivergen_none:'Не найден подходящий исток реки.', roadgen_noland:'Недостаточно суши/точек для дорог.', roadgen_none:'Не удалось создать дороги — участки суши могут быть не связаны между собой.', sc_cancel:'Отмена / снять выделение', sc_delete:'Удалить выделенное', sc_finish:'Завершить путь', sc_fit:'По размеру экрана', sc_general:'Общее', sc_help:'Открыть этот экран', sc_pan:'Перемещение', sc_panfast:'Быстрое перемещение', sc_redo:'Повторить', sc_rotsym:'Повернуть символ', sc_save:'Сохранить', sc_title:'Горячие клавиши', sc_undo:'Отменить', sc_zoom:'Увеличить / уменьшить', settlegen_noland:'Не найдена подходящая суша для поселений.', settlegen_none:'Не удалось разместить ни одного поселения.', share_editbtn:'Открыть в Wayborne', tab_regions:'Регионы', tab_todo:'Задачи', todo_add:'Добавить', todo_empty:'Пока нет задач.', todo_placeholder:'Новая задача...'
    }
  };

  var LANGS = [
    { code:'tr', flag:'🇹🇷', name:'Türkçe' },
    { code:'en', flag:'🇬🇧', name:'English' },
    { code:'de', flag:'🇩🇪', name:'Deutsch' },
    { code:'fr', flag:'🇫🇷', name:'Français' },
    { code:'es', flag:'🇪🇸', name:'Español' },
    { code:'it', flag:'🇮🇹', name:'Italiano' },
    { code:'pt', flag:'🇵🇹', name:'Português' },
    { code:'nl', flag:'🇳🇱', name:'Nederlands' },
    { code:'pl', flag:'🇵🇱', name:'Polski' },
    { code:'ru', flag:'🇷🇺', name:'Русский' },
    { code:'ar', flag:'🇸🇦', name:'العربية' }
  ];

  /* Rehber (Tutorial) sayfası — index.html'deki tool-rail ile AYNI gruplama
     ve aynı sırayı kullanır, böylece rehber kullanıcının solda gördüğü
     düzeni birebir öğretir. Ad/açıklama mevcut t_ ve h_ önekli i18n
     anahtarlarından okunur; grup başlıkları grp_ anahtarlarını paylaşır. */
  var TUTORIAL_GROUPS = [
    { label:'grp_navigate', tools:[
      { id:'select',     key:'V',     ico:'➤', hint:'tut_h_select' },
      { id:'lasso',      key:'X',     ico:'⌁', hint:'h_lasso' },
      { id:'pan',        key:'Space', ico:'✥', hint:'h_pan' }
    ]},
    { label:'grp_terrain', tools:[
      { id:'landmass',   key:'B',     ico:'◕', hint:'h_landmass' },
      { id:'erase',      key:'E',     ico:'◌', hint:'tut_h_erase' },
      { id:'fill',       key:'F',     ico:'◆', hint:'tut_h_fill' },
      { id:'terrain',    key:'T',     ico:'▨', hint:'h_terrain' },
      { id:'elevation',  key:'U',     ico:'▲', hint:'h_elevation' },
      { id:'eyedrop',    key:'I',     ico:'⊙', hint:'h_eyedrop' }
    ]},
    { label:'grp_water', tools:[
      { id:'river',      key:'R',     ico:'≈', hint:'tut_h_river' },
      { id:'lake',       key:'K',     ico:'◎', hint:'h_lake' },
      { id:'road',       key:'D',     ico:'⋯', hint:'tut_h_road' }
    ]},
    { label:'grp_markers', tools:[
      { id:'symbol',     key:'S',     ico:'⛰︎', hint:'h_symbol' },
      { id:'resource',   key:'Y',     ico:'⛏︎', hint:'h_resource' },
      { id:'label',      key:'L',     ico:'A', hint:'h_label' },
      { id:'sketch',     key:'N',     ico:'✎︎', hint:'tut_h_sketch' }
    ]},
    { label:'grp_regions', tools:[
      { id:'territory',  key:'G',     ico:'▧', hint:'h_territory' },
      { id:'regionlink', key:'M',     ico:'◈', hint:'h_regionlink' },
      { id:'measure',    key:'Q',     ico:'↔︎', hint:'h_measure' }
    ]}
  ];

  /* Rehber'in "araçların ötesinde" bölümü: araç rayında yer almayan, yalnız
     sağ panelde beliren otomatik üreticiler. Ad/açıklama anahtarları PANELİN
     KENDİSİYLE ORTAK — panel metni değişince rehber kendiliğinden güncel
     kalır ve iki metin asla birbirinden sapamaz (ayrıca hepsi zaten 11 dilde
     çevrili olduğu için yeni çeviri borcu doğurmaz). */
  var TUTORIAL_EXTRAS = [
    { ico:'◕',  name:'o_landgen',   hint:'h_landgen'   },
    { ico:'▨',  name:'o_biomegen',  hint:'h_biomegen'  },
    { ico:'⋯',  name:'o_roadgen',   hint:'h_roadgen'   },
    { ico:'⛰︎', name:'o_settlegen', hint:'h_settlegen' },
    { ico:'⌖',  name:'ref_scan',    hint:'h_ref_scan'  },
    { ico:'♔',  name:'o_stategen_go', hint:'h_stategen' },
    { ico:'✦',  name:'o_stmake',      hint:'h_stedit'   },
    { ico:'⌂',  name:'o_citygen_go',  hint:'h_citygen'  },
    { ico:'⊞',  name:'o_provgen_go',  hint:'h_provgen'  },
    { ico:'⛨',  name:'o_stemblem_gen', hint:'h_stemblem' },
    { ico:'≋',  name:'o_climate',       hint:'h_climate'  },
    { ico:'▤',  name:'o_zonetype',      hint:'h_zonetype' },
    { ico:'✎',  name:'o_nb_edit',       hint:'h_nb'       },
    { ico:'⌸',  name:'o_lgsave',        hint:'h_lgpreset' }
  ];

  /* Klavye kısayolları ekranının "Genel" bölümü — araç kısayolları zaten
     TUTORIAL_GROUPS'tan geliyor, burada yalnızca komut/gezinme tuşları. */
  var SHORTCUT_GENERAL = [
    { key:'Ctrl+Z',            label:'sc_undo' },
    { key:'Ctrl+Shift+Z / Y',  label:'sc_redo' },
    { key:'Ctrl+S',            label:'sc_save' },
    { key:'↑ ↓ ← →',           label:'sc_pan' },
    { key:'Shift+↑ ↓ ← →',     label:'sc_panfast' },
    { key:'+ / -',             label:'sc_zoom' },
    { key:'0',                 label:'sc_fit' },
    { key:'Enter / çift tık',  label:'sc_finish' },
    { key:'Esc',               label:'sc_cancel' },
    { key:'Delete / Backspace',label:'sc_delete' },
    { key:'[ / ]',             label:'sc_rotsym' },
    { key:'?',                 label:'sc_help' }
  ];

  function $(id){ return document.getElementById(id); }
  function on(id, ev, fn){ var el = $(id); if (el) el.addEventListener(ev, fn); }

  var UI = {
    lang:'tr',
    editSnapshot:null,
    scaleSnapshot:null,
    msgTimer:0,

    /* Sağdan sola yazılan arayüz dilleri. */
    RTL_LANGS: { ar:1, fa:1, he:1, ur:1 },
    isRTL: function (lang) { return !!this.RTL_LANGS[lang || this.lang]; },

    /* Çeviri yoksa: RTL/yeni diller İngilizce'ye düşer (Türkçe'ye değil),
       çünkü İngilizce bu diller için ortak ikinci dil. */
    t: function (k) {
      var d = DICT[this.lang];
      if (d && d[k] !== undefined) return d[k];
      if (this.lang !== 'tr' && DICT.en[k] !== undefined) return DICT.en[k];
      return DICT.tr[k] || k;
    },

    init: function () {
      this.buildTerrainSwatches();
      this.buildLabelPresets();
      this.buildFontList();
      this.buildSymbolLibrary();
      this.bindTopbar();
      this.bindTools();
      this.bindOptions();
      this.bindPanels();
      this.bindKeys();
      this.initShell();
      this.applyLang();
      this.refreshAll();
      this.setTool('landmass');
    },

    /* ================= dil ================= */
    applyLang: function () {
      var self = this;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = self.t(el.getAttribute('data-i18n'));
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        el.placeholder = self.t(el.getAttribute('data-i18n-placeholder'));
      });
      /* Yalnız ikon taşıyan düğmelerde başlık aynı zamanda erişilebilir ad
         olsun — ekran okuyucu için başka metin yok. */
      document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
        var v = self.t(el.getAttribute('data-i18n-title'));
        el.title = v;
        if (!el.textContent.trim()) el.setAttribute('aria-label', v);
      });
      document.documentElement.lang = this.lang;
      /* Sağdan sola diller: yön <html>'e yazılır, düzen mantıksal
         özelliklerle (padding-inline-start vb.) kendiliğinden aynalanır.
         Editörün tuvali ve minimap'i her zaman soldan sağ kalır — harita
         içeriği bir metin akışı değil. */
      document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
      this.buildTerrainSwatches();
      this.buildLabelPresets();
      this.buildFontList();
      this.buildSymbolLibrary();
      this.buildCultureList();
      this.refreshLandgenTemplates();
      this.buildTemplateGrid();
      this.buildLangMenu('lang-menu');
      this.buildLangMenu('lang-menu-shell');
      this.renderTutorial();
      this.refreshCanvasList();
      this.refreshLayers();
      this.refreshSelection();
      this.refreshHistory();
      this.status();
    },

    /* ================= üst toolbar ================= */
    bindTopbar: function () {
      var self = this;

      on('btn-new', 'click', function () {
        self.modal(self.t('new'),
          '<p>' + self.t('confirmNew') + '</p>' +
          '<select id="modal-size" class="sel"><option value="2048">2048 × 2048</option>' +
          '<option value="4096">4096 × 4096</option><option value="8192">8192 × 8192</option></select>',
          function () {
            var s = parseInt($('modal-size').value, 10) || 2048;
            $('sel-canvas-size').value = String(s);
            Exporter.newProject(s);
          });
      });

      on('btn-open', 'click', function () { $('file-open').click(); });
      on('file-open', 'change', function (e) {
        if (e.target.files && e.target.files[0]) Exporter.loadProject(e.target.files[0]);
        e.target.value = '';
      });
      on('btn-save', 'click', function () { Exporter.saveProject(); });
      on('btn-undo', 'click', function () { History.undo(); });
      on('btn-redo', 'click', function () { History.redo(); });
      on('btn-map-back', 'click', function () { App.exitMap(); });

      /* --- kaynak işareti --- */
      on('rs-type', 'change', function (e) { App.resource.type = e.target.value; });
      self.range('rs-size', 'v-rs-size', function (v) { App.resource.size = v; });
      on('btn-export-png', 'click', function () { Exporter.png(1); });
      on('btn-export-svg', 'click', function () { Exporter.svg(); });

      on('chk-shore', 'change', function (e) { Cv.shore = e.target.checked; Cv.requestRender(); });
      on('chk-parchment', 'change', function (e) { Cv.parchment = e.target.checked; Cv.requestRender(); });
      on('chk-grid', 'change', function (e) { Cv.grid = e.target.checked; Cv.requestRender(); });
      on('chk-legend', 'change', function (e) { Cv.symbolLegend = e.target.checked; Cv.requestRender(); });

      on('sel-canvas-size', 'change', function (e) {
        var s = parseInt(e.target.value, 10);
        if (confirm(self.t('confirmSize'))) {
          var ratio = s / Cv.W;
          Cv.setSize(s, s, true);
          /* Ölçek çubuğunu yeni canvas boyutuna oranla */
          App.scale.x   = Math.round(App.scale.x   * ratio);
          App.scale.y   = Math.round(App.scale.y   * ratio);
          App.scale.len = Math.round(App.scale.len  * ratio);
          App.scale.size= Math.round(App.scale.size * ratio);
          /* Windrose'u da oranla */
          App.windrose.x    = Math.round(App.windrose.x    * ratio);
          App.windrose.y    = Math.round(App.windrose.y    * ratio);
          App.windrose.size = Math.round(App.windrose.size * ratio);
          History.clear();
          self.refreshAll();
        } else e.target.value = String(Cv.W);
      });

      this.buildLangMenu('lang-menu');
      on('btn-lang', 'click', function (e) { e.stopPropagation(); self.toggleLangMenu('lang-menu'); });
      on('accent-color', 'input', function (e) { self.setAccent(e.target.value); });
      /* Varsayılana dönüş için ayrı bir düğme yerine sağ tık — üst çubuk
         zaten dolu ve bu nadir bir işlem. */
      on('accent-wrap', 'contextmenu', function (e) { e.preventDefault(); self.resetAccent(); });
      this.buildLangMenu('lang-menu-shell');
      on('btn-lang-shell', 'click', function (e) { e.stopPropagation(); self.toggleLangMenu('lang-menu-shell'); });
      document.addEventListener('click', function () { self.closeLangMenu('lang-menu'); self.closeLangMenu('lang-menu-shell'); });
    },

    /* ================= uygulama kabuğu (Ana Sayfa / Tuval / Rehber / Topluluk) =================
       Backend yok — sayfa her zaman index.html; sekmeler arası geçiş salt
       JS ile görünürlük değiştirerek yapılır, sayfa yenilenmez. Editörün
       kendisi #view-editor içinde önceden tam olarak başlatılmış durumda
       bekler (App.init() zaten çalıştı), sadece gizli. */
    initShell: function () {
      var self = this;
      document.querySelectorAll('[data-view-link]').forEach(function (el) {
        el.addEventListener('click', function () { self.showView(el.getAttribute('data-view-link')); });
      });
      on('btn-shell-back', 'click', function () { self.showView('canvas'); });

      /* editördeyken her 10 dakikada bir sessiz oto-kayıt */
      setInterval(function () {
        if (self._currentView === 'editor') Exporter.autoSave();
      }, 600000);

      on('cv-size-preset', 'change', function (e) {
        $('cv-custom-wh').classList.toggle('hidden', e.target.value !== 'custom');
      });
      on('btn-cv-create', 'click', function () {
        var preset = $('cv-size-preset').value;
        var w, h;
        if (preset === 'custom') {
          w = Math.max(256, Math.min(16384, parseInt($('cv-w').value, 10) || 2048));
          h = Math.max(256, Math.min(16384, parseInt($('cv-h').value, 10) || 2048));
        } else { w = h = parseInt(preset, 10); }
        var name = $('cv-name').value.trim() || self.t('canvas_unnamed');
        Exporter.newProject(w, h, name);
        self.showView('editor');
      });
      on('file-open-canvas', 'change', function (e) {
        if (e.target.files && e.target.files[0]) {
          Exporter.loadProject(e.target.files[0]);
          self.showView('editor');
        }
        e.target.value = '';
      });

      this.renderTutorial();
      this.buildTemplateGrid();
      this.refreshCanvasList();
      this.applyAccent(this.loadAccent());
      if (this.tryShowSharedMap()) return;
      if (this.applyUrlParams()) return;
      this.showView('home');
    },

    /* ================= ARAYÜZ VURGU RENGİ =================
       Tema, CSS özel değişkenleri üzerinden çalışır: yalnızca --brass ve
       ondan türeyen --brass-dim değiştirilir, geri kalan palet olduğu gibi
       kalır. Seçim tarayıcıda saklanır (projeye değil kullanıcıya ait bir
       tercih), bu yüzden .json kaydına girmez. */
    /* ================= SESLİ OKUMA (TTS) =================
       Tarayıcının yerleşik SpeechSynthesis API'si — ek bağımlılık ya da
       ağ isteği yok. Üretilen fantastik adların nasıl okunduğunu duymak
       için; desteklenmeyen tarayıcıda düğme hiç gösterilmez. */
    ttsAvailable: function () {
      return typeof window.speechSynthesis !== 'undefined' &&
             typeof window.SpeechSynthesisUtterance !== 'undefined';
    },

    speak: function (text) {
      if (!this.ttsAvailable() || !text) return false;
      try {
        window.speechSynthesis.cancel();   /* üst üste binmesin */
        var u = new SpeechSynthesisUtterance(String(text));
        u.lang = this.lang === 'en' ? 'en-US' : this.lang;
        window.speechSynthesis.speak(u);
        return true;
      } catch (e) { return false; }
    },

    ACCENT_KEY: 'wayborne_accent',
    ACCENT_DEFAULT: '#c08a3e',

    loadAccent: function () {
      try { return localStorage.getItem(this.ACCENT_KEY) || this.ACCENT_DEFAULT; }
      catch (e) { return this.ACCENT_DEFAULT; }
    },

    applyAccent: function (hex) {
      if (!/^#[0-9a-f]{6}$/i.test(hex || '')) hex = this.ACCENT_DEFAULT;
      var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      function dim(v) { return Math.round(v * 0.78); }
      function hx(v) { var t = Math.max(0, Math.min(255, v)).toString(16); return t.length < 2 ? '0'+t : t; }
      var root = document.documentElement;
      root.style.setProperty('--brass', hex);
      root.style.setProperty('--brass-dim', '#' + hx(dim(r)) + hx(dim(g)) + hx(dim(b)));
      var inp = $('accent-color');
      if (inp && inp.value.toLowerCase() !== hex.toLowerCase()) inp.value = hex;
    },

    setAccent: function (hex) {
      this.applyAccent(hex);
      try { localStorage.setItem(this.ACCENT_KEY, hex); } catch (e) {}
    },

    resetAccent: function () {
      try { localStorage.removeItem(this.ACCENT_KEY); } catch (e) {}
      this.applyAccent(this.ACCENT_DEFAULT);
    },

    /* ================= URL PARAMETRELERİ =================
       ?template=continent&seed=1234&w=2048[&h=][&rivers=1&lakes=1&terrain=1]
       ile sayfa açılışında doğrudan tohumlu bir harita üretir. Paylaşım
       linkinden (görüntüyü hash'e gömen #d=...) farklı ve çok daha küçük
       bir bağlantı türü: görüntüyü değil TARİFİ taşır, karşı taraf aynı
       tohumdan aynı haritayı yeniden üretir.
       Bir üretim tetiklendiyse true döner (kabuk ana sayfayı açmasın). */
    applyUrlParams: function () {
      var q;
      try { q = new URLSearchParams(location.search); } catch (e) { return false; }
      var tpl = q.get('template');
      if (!tpl) return false;
      var VALID = ['continent','island','archipelago'];
      if (VALID.indexOf(tpl) < 0) { this.msg(this.t('url_badtemplate')); return false; }

      var w = Math.max(256, Math.min(8192, parseInt(q.get('w'), 10) || 2048));
      var h = Math.max(256, Math.min(8192, parseInt(q.get('h'), 10) || w));
      var seedRaw = q.get('seed');
      var seed = (seedRaw === null || seedRaw === '') ? Math.floor(Math.random()*4294967296)
                                                     : (parseInt(seedRaw, 10) >>> 0);
      var rough = q.get('roughness');
      var roughness = (rough === null) ? 0.5 : Math.max(0, Math.min(1, parseFloat(rough)));
      var wantRivers = q.get('rivers') === '1';
      var wantLakes  = q.get('lakes')  === '1';
      var wantTerr   = q.get('terrain') === '1';

      var self = this;
      Exporter.newProject(w, h, q.get('name') || this.t('canvas_unnamed'));
      this.showView('editor');
      /* Editör görünümü tuvali 0×0 raporlarken üretmek anlamsız —
         showView'ın resize/fit'i bir sonraki karede çalışıyor. */
      requestAnimationFrame(function () {
        Tools.generateLandmass(tpl, roughness, seed, { withElevation: wantRivers || wantTerr });
        var chain = Promise.resolve();
        if (wantRivers) chain = chain.then(function () { return Tools.generateRivers(null, seed); });
        if (wantLakes)  chain = chain.then(function () { Tools.autoLakes(seed); });
        if (wantTerr)   chain = chain.then(function () { return Tools.autoBiome(seed); });
        chain.then(function () {
          Cv.fit(); Cv.requestRender();
          self.msg(self.t('url_generated') + ' · ' + seed);
        });
      });
      return true;
    },

    /* URL hash'inde bir paylaşım linki bulunursa (bkz. Exporter.parseShareHash)
       kabuğun geri kalanı yerine salt-okunur görüntüleyiciyi gösterir.
       embed=1 ise kabuk gezinmesi de gizlenir — bir iframe'in içinden
       başka hiçbir şey görünmesin diye. */
    tryShowSharedMap: function () {
      var data = Exporter.parseShareHash();
      if (!data) return false;
      $('share-title').textContent = data.title;
      document.title = data.title + ' · Wayborne';
      var img = $('share-img');
      img.alt = data.title;
      img.src = data.dataURI;
      var view = $('view-share');
      this._shareEmbed = !!data.embed;
      if (data.embed) view.classList.add('embed');
      this.bindShareViewer(data.w, data.h);
      this.showView('share');
      return true;
    },

    bindShareViewer: function (W, H) {
      var stage = $('share-stage'), img = $('share-img');
      var self = this;
      var z = 1, ox = 0, oy = 0;

      function apply() { img.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + z + ')'; }
      function fit() {
        var p = 24;
        var fz = Math.min((stage.clientWidth - p*2) / W, (stage.clientHeight - p*2) / H);
        z = isFinite(fz) && fz > 0 ? fz : 1;
        ox = (stage.clientWidth - W*z) / 2; oy = (stage.clientHeight - H*z) / 2;
        apply();
      }
      function zoomAt(cx, cy, f) {
        var nz = Math.max(0.02, Math.min(12, z*f));
        ox = cx - (cx-ox)*(nz/z); oy = cy - (cy-oy)*(nz/z); z = nz; apply();
      }
      this._shareFit = fit;

      if (this._shareViewerBound) { if (img.complete) fit(); else img.onload = fit; return; }
      this._shareViewerBound = true;

      stage.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = stage.getBoundingClientRect();
        zoomAt(e.clientX-r.left, e.clientY-r.top, e.deltaY < 0 ? 1.12 : 1/1.12);
      }, { passive:false });
      var down = false, px = 0, py = 0;
      stage.addEventListener('pointerdown', function (e) {
        down = true; px = e.clientX; py = e.clientY;
        stage.classList.add('drag'); stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', function (e) {
        if (!down) return;
        ox += e.clientX-px; oy += e.clientY-py; px = e.clientX; py = e.clientY; apply();
      });
      stage.addEventListener('pointerup', function () { down = false; stage.classList.remove('drag'); });
      stage.addEventListener('dblclick', function () { if (self._shareFit) self._shareFit(); });
      $('share-zi').addEventListener('click', function () { zoomAt(stage.clientWidth/2, stage.clientHeight/2, 1.3); });
      $('share-zo').addEventListener('click', function () { zoomAt(stage.clientWidth/2, stage.clientHeight/2, 1/1.3); });
      $('share-zf').addEventListener('click', function () { if (self._shareFit) self._shareFit(); });
      window.addEventListener('resize', function () { if (self._currentView === 'share' && self._shareFit) self._shareFit(); });

      if (img.complete) fit(); else img.onload = fit;
    },

    /* navigator.clipboard güvenli bağlamda (https/localhost) çalışır;
       yoksa gizli bir textarea + execCommand'a düşer. */
    copyToClipboard: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
        return;
      }
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    },

    shareLinkDialog: function () {
      var self = this;
      var name = App.currentCanvasName || this.t('canvas_unnamed');
      var body =
        '<label class="row"><span>' + esc(this.t('exp_maxdim')) + '</span></label>' +
        '<select id="sl-dim" class="sel">' +
          '<option value="1024">1024 px</option>' +
          '<option value="1600" selected>1600 px</option>' +
          '<option value="2048">2048 px</option>' +
        '</select>' +
        '<button class="btn wide" id="sl-generate" style="margin-top:10px">' + esc(this.t('exp_share_gen')) + '</button>' +
        '<div id="sl-result" style="display:none;margin-top:12px">' +
          '<label class="row"><span>' + esc(this.t('exp_share_link')) + '</span></label>' +
          '<div class="row2"><input type="text" id="sl-url" class="sel" readonly>' +
            '<button class="btn" id="sl-copy-url">' + esc(this.t('copy')) + '</button></div>' +
          '<p class="hint" id="sl-size-hint"></p>' +
          '<label class="row" style="margin-top:10px"><span>' + esc(this.t('exp_share_embedcode')) + '</span></label>' +
          '<div class="row2"><textarea id="sl-embed-code" class="sel" readonly rows="2" style="resize:none"></textarea>' +
            '<button class="btn" id="sl-copy-embed">' + esc(this.t('copy')) + '</button></div>' +
        '</div>' +
        '<p class="hint">' + esc(this.t('exp_share_help')) + '</p>';

      this.modal(this.t('exp_share_t'), body);

      on('sl-generate', 'click', function () {
        var url = Exporter.buildShareURL({
          maxDim: parseInt($('sl-dim').value, 10) || 1600,
          title: name
        });
        var kb = Math.round(url.length/1024);
        $('sl-url').value = url;
        $('sl-embed-code').value = Exporter.embedCode(url, 800, 600);
        $('sl-size-hint').textContent = self.t('exp_share_sizehint').replace('{kb}', kb);
        $('sl-result').style.display = '';
        self.copyToClipboard(url);
        self.msg(self.t('copied'));
      });
      on('sl-copy-url', 'click', function (e) {
        e.preventDefault();
        self.copyToClipboard($('sl-url').value);
        self.msg(self.t('copied'));
      });
      on('sl-copy-embed', 'click', function (e) {
        e.preventDefault();
        self.copyToClipboard($('sl-embed-code').value);
        self.msg(self.t('copied'));
      });
    },

    /* Dar ekranlarda editör artık kapatılmıyor — #workspace ~860px altında
       tek sütuna, sol/sağ paneller kayan çekmecelere dönüşür (bkz.
       css/main.css'teki mobil kırılım noktası). MOBILE_BREAKPOINT bu eşiği
       JS tarafında da bilir (ör. editöre ilk girişte panelleri varsayılan
       kapalı başlatmak için). */
    MOBILE_BREAKPOINT: 860,

    isMobileViewport: function () {
      return window.matchMedia && window.matchMedia('(max-width:' + this.MOBILE_BREAKPOINT + 'px)').matches;
    },

    /* Editöre ilk giriş dar bir viewport'taysa paneller varsayılan kapalı
       başlar (tuval hemen görünür olsun diye) — yalnızca bir kez uygulanır,
       kullanıcı elle açtıktan sonra tekrar dayatılmaz. */
    _mobileDefaultApplied: false,
    applyMobileDefaults: function () {
      if (this._mobileDefaultApplied) return;
      this._mobileDefaultApplied = true;
      if (!this.isMobileViewport()) return;
      var ws = $('workspace');
      if (!ws) return;
      ['left', 'right'].forEach(function (side) {
        ws.classList.add('collapsed-' + side);
        var btn = $(side === 'left' ? 'btn-toggle-left' : 'btn-toggle-right');
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.textContent = side === 'left' ? '›' : '‹';
        }
      });
    },

    showView: function (name) {
      /* editörden ayrılırken (ör. ana sayfaya dönüş) sessizce oto-kaydet —
         böylece "Tuval" sekmesindeki kayıtlı tuvaller listesinde görünür */
      if (this._currentView === 'editor' && name !== 'editor') Exporter.autoSave();

      this._wantedView = name;
      this._currentView = name;
      document.querySelectorAll('.shell-view').forEach(function (v) { v.classList.add('hidden'); });
      var target = $('view-' + name);
      if (target) target.classList.remove('hidden');
      document.querySelectorAll('.shell-tab').forEach(function (t) {
        var on = t.getAttribute('data-view-link') === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if ($('shell-nav')) $('shell-nav').classList.toggle('hidden', name === 'editor' || (name === 'share' && this._shareEmbed));
      if (name === 'canvas') this.refreshCanvasList();
      if (name === 'editor') {
        this.applyMobileDefaults();
        /* editör gizliyken canvas 0×0 rapor ediyordu — görünür olduktan
           sonra viewport ölçülerini yeniden hesapla ve sığdır */
        requestAnimationFrame(function () { Cv.resize(); Cv.fit(); Cv.requestRender(); });
      }
    },

    refreshCanvasList: function () {
      var grid = $('cv-list'), hint = $('cv-empty-hint');
      if (!grid) return;
      var self = this;
      var list = Exporter.libList().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
      grid.innerHTML = '';
      if (hint) hint.style.display = list.length ? 'none' : '';
      list.forEach(function (entry) {
        var card = document.createElement('div');
        card.className = 'cv-card';
        var nameEl = document.createElement('div'); nameEl.className = 'cv-card-name';
        var metaEl = document.createElement('div'); metaEl.className = 'cv-card-meta';
        var thumb = document.createElement('div'); thumb.className = 'cv-card-thumb';
        if (entry.thumb) {
          var img = document.createElement('img'); img.src = entry.thumb; img.alt = entry.name; img.loading = 'lazy';
          thumb.appendChild(img);
        } else {
          thumb.textContent = '⚔';
        }
        var actions = document.createElement('div'); actions.className = 'cv-card-actions';
        var openBtn = document.createElement('button'); openBtn.textContent = self.t('canvas_open');
        var delBtn = document.createElement('button'); delBtn.textContent = self.t('canvas_delete');
        nameEl.textContent = entry.name;
        var d = new Date(entry.updatedAt);
        metaEl.textContent = entry.W + '×' + entry.H + ' · ' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
        actions.appendChild(openBtn); actions.appendChild(delBtn);
        card.appendChild(thumb); card.appendChild(nameEl); card.appendChild(metaEl); card.appendChild(actions);

        function openIt() {
          Exporter.libOpen(entry.id).then(function () {
            App.currentLibId = entry.id;
            App.currentCanvasName = entry.name;
            self.showView('editor');
          });
        }
        openBtn.addEventListener('click', function (e) { e.stopPropagation(); openIt(); });
        delBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (confirm(self.t('canvas_delete_confirm'))) { Exporter.libDelete(entry.id); self.refreshCanvasList(); }
        });
        card.addEventListener('click', openIt);
        grid.appendChild(card);
      });
    },

    renderTutorial: function () {
      var box = $('tutorial-list');
      if (!box) return;
      var self = this;
      box.innerHTML = '';
      TUTORIAL_GROUPS.forEach(function (grp) {
        var head = document.createElement('div');
        head.className = 'tutorial-group-label';
        head.textContent = self.t(grp.label);
        box.appendChild(head);

        grp.tools.forEach(function (tl) {
          var row = document.createElement('div'); row.className = 'tutorial-row';
          var ico = document.createElement('div'); ico.className = 'tutorial-ico'; ico.textContent = tl.ico;
          var body = document.createElement('div'); body.className = 'tutorial-body';
          var nameRow = document.createElement('div'); nameRow.className = 'tutorial-name';
          nameRow.textContent = self.t('t_' + tl.id);
          var keyEl = document.createElement('span'); keyEl.className = 'tutorial-key'; keyEl.textContent = tl.key;
          nameRow.appendChild(keyEl);
          var desc = document.createElement('div'); desc.className = 'tutorial-desc';
          desc.textContent = self.t(tl.hint);
          body.appendChild(nameRow); body.appendChild(desc);
          row.appendChild(ico); row.appendChild(body);
          box.appendChild(row);
        });
      });

      /* Araç rayında OLMAYAN, yalnız sağ panelde beliren otomatik
         üreticiler. Rehber bunları göstermezse kullanıcının keşfetmesi
         için panelleri tek tek gezmesi gerekiyordu. */
      var xh = document.createElement('div');
      xh.className = 'tutorial-group-label';
      xh.textContent = self.t('tut_extras');
      box.appendChild(xh);
      var xn = document.createElement('div');
      xn.className = 'tutorial-desc tutorial-extras-note';
      xn.textContent = self.t('tut_extras_d');
      box.appendChild(xn);
      TUTORIAL_EXTRAS.forEach(function (x) {
        var row = document.createElement('div'); row.className = 'tutorial-row';
        var ico = document.createElement('div'); ico.className = 'tutorial-ico'; ico.textContent = x.ico;
        var body = document.createElement('div'); body.className = 'tutorial-body';
        var nameRow = document.createElement('div'); nameRow.className = 'tutorial-name';
        /* Bazı düğme etiketleri kendi glifini taşıyor ("⌖ Coğrafyayı tara").
           Rehber satırının zaten ayrı bir ikon sütunu var, yoksa glif iki kez
           görünürdü — baştaki harf-olmayan süsü kırp. Etiketin kendisi tek
           kaynak olarak panelde olduğu gibi kalıyor. */
        nameRow.textContent = self.t(x.name).replace(/^[^\p{L}\p{N}]+/u, '');
        var desc = document.createElement('div'); desc.className = 'tutorial-desc';
        desc.textContent = self.t(x.hint);
        body.appendChild(nameRow); body.appendChild(desc);
        row.appendChild(ico); row.appendChild(body);
        box.appendChild(row);
      });
    },

    /* ================= başlangıç şablonları =================
       Boş tuval yaratıcı araçlarda en büyük terk sebebidir. Şablonlar
       mevcut prosedürel kara üretecini (Tools.generateLandmass) hazır
       ayarlarla çağırır — yeni bir mekanik değil, var olanın önü. */
    TEMPLATES: [
      { key:'continent',   tpl:'continent',   rough:0.50, terrain:'grassland', grid:null },
      { key:'island',      tpl:'island',      rough:0.55, terrain:'forest',    grid:null },
      { key:'archipelago', tpl:'archipelago', rough:0.62, terrain:'coast',     grid:null },
      { key:'kingdom',     tpl:'continent',   rough:0.38, terrain:'farmland',  grid:null },
      { key:'battle',      tpl:'island',      rough:0.30, terrain:'grassland', grid:'hex' },
      { key:'blank',       tpl:null,          rough:0,    terrain:null,        grid:null }
    ],

    buildTemplateGrid: function () {
      var grid = $('tpl-grid');
      if (!grid) return;
      var self = this;
      grid.innerHTML = '';
      this.TEMPLATES.forEach(function (t) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'tpl-card';
        var cv = document.createElement('canvas');
        cv.width = 150; cv.height = 96;
        self.drawTemplateThumb(cv, t);
        var nm = document.createElement('span'); nm.className = 'tpl-name';
        nm.textContent = self.t('tpl_' + t.key);
        var sb = document.createElement('span'); sb.className = 'tpl-sub';
        sb.textContent = self.t('tpl_' + t.key + '_d');
        card.appendChild(cv); card.appendChild(nm); card.appendChild(sb);
        card.addEventListener('click', function () { self.applyTemplate(t); });
        grid.appendChild(card);
      });
    },

    /* Küçük, tohumlanmış bir önizleme — gerçek üreteci çağırmadan
       şablonun karakterini gösterir (kart başına tam üretim pahalı olurdu). */
    drawTemplateThumb: function (cv, t) {
      var c = cv.getContext('2d'), W = cv.width, H = cv.height;
      c.fillStyle = '#3f6b74'; c.fillRect(0,0,W,H);
      if (!t.tpl) {
        c.fillStyle = 'rgba(255,255,255,0.10)';
        c.fillRect(0,0,W,H);
        return;
      }
      var seed = t.key.length * 7919;
      function rnd() { seed = (seed*1664525 + 1013904223) >>> 0; return seed/4294967296; }
      c.fillStyle = '#e6d09a';
      var blobs = t.tpl === 'archipelago' ? 6 : (t.tpl === 'island' ? 2 : 3);
      for (var i = 0; i < blobs; i++) {
        var cx = W*(0.28 + rnd()*0.44), cy = H*(0.28 + rnd()*0.44);
        var rx = W*(t.tpl === 'archipelago' ? 0.07+rnd()*0.06 : 0.20+rnd()*0.12);
        var ry = rx*(0.7+rnd()*0.5);
        c.beginPath(); c.ellipse(cx, cy, rx, ry, rnd()*Math.PI, 0, Math.PI*2); c.fill();
      }
      if (t.grid === 'hex') {
        c.strokeStyle = 'rgba(30,40,30,0.35)'; c.lineWidth = 1;
        for (var y = 8; y < H; y += 16) {
          for (var x = (y/16 % 2 ? 10 : 2); x < W; x += 18) {
            c.beginPath();
            for (var k = 0; k < 6; k++) {
              var a = Math.PI/180 * (60*k - 30);
              var px = x + 8*Math.cos(a), py = y + 8*Math.sin(a);
              k ? c.lineTo(px,py) : c.moveTo(px,py);
            }
            c.closePath(); c.stroke();
          }
        }
      }
    },

    applyTemplate: function (t) {
      var preset = $('cv-size-preset'), w, h;
      if (preset && preset.value === 'custom') {
        w = Math.max(256, Math.min(16384, parseInt($('cv-w').value,10) || 2048));
        h = Math.max(256, Math.min(16384, parseInt($('cv-h').value,10) || 2048));
      } else { w = h = parseInt((preset && preset.value) || '2048', 10); }
      var name = ($('cv-name').value || '').trim() || this.t('tpl_' + t.key);

      Exporter.newProject(w, h, name);

      if (t.tpl) {
        Tools.generateLandmass(t.tpl, t.rough, Math.floor(Math.random()*4294967296));
        if (t.terrain) App.terrain.type = t.terrain;
      }
      if (t.grid) { Cv.grid = true; Cv.gridType = t.grid; }
      var cg = $('chk-grid'); if (cg) cg.checked = Cv.grid;
      var gt = $('grid-type'); if (gt) gt.value = Cv.gridType;

      Cv.shoreDirty = true;
      Cv.requestRender();
      this.showView('editor');
      this.msg(this.t('tpl_' + t.key) + ' — ' + this.t('tpl_ready'));
    },

    /* ---- yükselti/kara şablonu ön ayarları ----
       Yerleşik üç şablon HTML'de sabit duruyor; kullanıcının kaydettiği
       ön ayarlar listeye "preset:<i>" değeriyle ekleniyor, seçilince
       kayıtlı parametreler geri yükleniyor. Böylece üretim yolu tek
       kalıyor — ön ayar yeni bir algoritma değil, adlandırılmış bir
       parametre kümesi. */
    LG_BUILTIN: ['continent', 'island', 'archipelago'],

    refreshLandgenTemplates: function () {
      var sel = $('lg-template');
      if (!sel) return;
      var cur = sel.value;
      /* yerleşik seçenekleri koru, ön ayarları baştan kur */
      Array.prototype.slice.call(sel.options).forEach(function (o) {
        if (o.value.indexOf('preset:') === 0) sel.removeChild(o);
      });
      (App.landgenPresets || []).forEach(function (p, i) {
        var o = document.createElement('option');
        o.value = 'preset:' + i; o.textContent = p.name;
        sel.appendChild(o);
      });
      if (cur && sel.querySelector('option[value="' + cur.replace(/"/g, '') + '"]')) sel.value = cur;
      var del = $('btn-lg-del');
      if (del) del.disabled = sel.value.indexOf('preset:') !== 0;
    },

    applyLandgenTemplate: function (val) {
      if (val.indexOf('preset:') === 0) {
        var p = (App.landgenPresets || [])[+val.slice(7)];
        if (!p) return;
        App.landgen.template = p.template;
        App.landgen.roughness = p.roughness;
        App.landgen.rivers = !!p.rivers;
        App.landgen.lakes = !!p.lakes;
        App.landgen.terrain = !!p.terrain;
        if ($('lg-rough')) $('lg-rough').value = Math.round(p.roughness*100);
        if ($('v-lg-rough')) $('v-lg-rough').textContent = p.roughness.toFixed(2);
        if ($('lg-rivers'))  $('lg-rivers').checked  = !!p.rivers;
        if ($('lg-lakes'))   $('lg-lakes').checked   = !!p.lakes;
        if ($('lg-terrain')) $('lg-terrain').checked = !!p.terrain;
      } else {
        App.landgen.template = val;
      }
      var del = $('btn-lg-del');
      if (del) del.disabled = val.indexOf('preset:') !== 0;
    },

    /* ---- notlar ----
       Not kutusu yalnızca tekil bir vektör nesnesi seçiliyken anlamlı;
       çoklu seçimde hangi nesneye yazılacağı belirsiz olurdu. */
    refreshNoteBox: function () {
      var box = $('note-box');
      if (!box) return;
      var ok = !!(App.selection && !App.selection.multi && App.selection.layerId !== 'scale');
      var L = ok ? Layers.get(App.selection.layerId) : null;
      ok = ok && !!L && L.type === 'vector' && !!Tools.selected();
      box.hidden = !ok;
      if (ok) $('sel-note').value = Tools.selected().note || '';
    },

    /* ================= fantastik ad üreteci ================= */
    buildCultureList: function () {
      var sel = $('nm-culture');
      if (!sel || !global.Names) return;
      var cur = sel.value;
      sel.innerHTML = '';
      Names.cultureList(this.lang).forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.key; o.textContent = c.name;
        sel.appendChild(o);
      });
      if (cur) sel.value = cur;
    },

    suggestNames: function () {
      var box = $('nm-suggest');
      if (!box || !global.Names) return;
      var culture = ($('nm-culture') || {}).value || 'western';
      var feature = ($('nm-feature') || {}).value || 'settlement';
      var list = Names.generateMany(culture, feature, this.lang, 6);
      box.innerHTML = '';
      list.forEach(function (nm) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = nm;
        b.addEventListener('click', function () {
          var ta = $('lb-text');
          if (ta) { ta.value = nm; ta.dispatchEvent(new Event('input', { bubbles:true })); }
        });
        box.appendChild(b);
      });
    },

    /* ================= dil menüsü ================= (id: 'lang-menu' veya 'lang-menu-shell') */
    buildLangMenu: function (id) {
      var menu = $(id);
      if (!menu) return;
      menu.innerHTML = '';
      var self = this;
      LANGS.forEach(function (l) {
        var li = document.createElement('li');
        li.className = 'lang-item' + (self.lang === l.code ? ' active' : '');
        var flag = document.createElement('span');
        flag.className = 'lang-flag';
        flag.textContent = l.flag;
        var name = document.createElement('span');
        name.className = 'lang-name';
        name.textContent = l.name;
        li.appendChild(flag); li.appendChild(name);
        li.addEventListener('click', function (e) {
          e.stopPropagation();
          if (self.lang === l.code) { self.closeLangMenu(id); return; }
          self.lang = l.code;
          self.applyLang();
          self.closeLangMenu(id);
        });
        menu.appendChild(li);
      });
    },

    toggleLangMenu: function (id) {
      var menu = $(id);
      if (menu) menu.classList.toggle('hidden');
    },

    closeLangMenu: function (id) {
      var menu = $(id);
      if (menu) menu.classList.add('hidden');
    },

    /* ================= araç seçimi ================= */
    bindTools: function () {
      var self = this;
      document.querySelectorAll('.tool').forEach(function (b) {
        b.addEventListener('click', function () { self.setTool(b.getAttribute('data-tool')); });
      });
    },

    setTool: function (name) {
      var self = this;
      if (name !== 'lasso' && Tools.floating) Tools.commitFloating();
      App.tool = name;
      Tools.cancelPath();
      document.querySelectorAll('.tool').forEach(function (b) {
        var on = b.getAttribute('data-tool') === name;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.querySelectorAll('.opt-group').forEach(function (g) {
        g.classList.toggle('show', g.getAttribute('data-for').split(' ').indexOf(name) >= 0);
      });
      /* aktif panelin i18n'ini güncelle */
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = self.t(el.getAttribute('data-i18n'));
      });
      Cv.view.className = (name === 'pan') ? 'pan' : (name === 'select' ? 'pick' : '');
      if (name === 'symbol') this.showTab('library');
      if (name === 'sketch') { this.showTab('layers'); this.syncSketchTarget(); }
      this.status();
      Cv.requestRender();
    },

    /* ================= kaydırıcı yardımcısı ================= */
    range: function (id, valId, fn, fmt) {
      var self = this, el = $(id);
      if (!el) return;
      el.addEventListener('pointerdown', function () { self.editStart(); });
      el.addEventListener('input', function () {
        var v = parseFloat(el.value);
        if (valId) $(valId).textContent = fmt ? fmt(v) : v;
        fn(v);
        Cv.requestRender();
      });
      el.addEventListener('change', function () { self.editCommit(); });
    },

    editStart: function () {
      if (this.editSnapshot || !App.selection) return;
      if (App.selection.layerId === 'scale') {
        this.scaleSnapshot = JSON.parse(JSON.stringify(App.scale));
        return;
      }
      var L = Layers.get(App.selection.layerId);
      if (!L) return;
      this.editSnapshot = { layerId:App.selection.layerId, arr:JSON.parse(JSON.stringify(L.objects)) };
    },

    editCommit: function () {
      if (this.scaleSnapshot) {
        History.pushScale(this.scaleSnapshot, JSON.parse(JSON.stringify(App.scale)), 'scale');
        this.scaleSnapshot = null;
        this.refreshHistory();
      }
      if (!this.editSnapshot) return;
      var s = this.editSnapshot;
      this.editSnapshot = null;
      if (!App.selection || App.selection.layerId !== s.layerId) return;
      Tools.commitSelectionEdit(s.arr, 'edit');
    },

    selIs: function (layerId) {
      return App.selection && App.selection.layerId === layerId;
    },

    /* "Rastgele kara üret" uyarı modalının yalnızca ilk seferinde
       gösterildiğini hatırlamak için localStorage bayrağı. */
    LANDGEN_WARNED_KEY: 'wayborne_landgen_warned',

    /* ================= araç seçenekleri ================= */
    bindOptions: function () {
      var self = this;

      /* --- kara / deniz --- */
      this.range('lm-size', 'v-lm-size', function (v) { App.brush.size = v; });
      this.range('lm-rough', 'v-lm-rough', function (v) { App.brush.roughness = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('lm-color', 'input', function (e) { App.brush.color = e.target.value; });
      on('sea-color', 'input', function (e) { App.sea.color = e.target.value; Cv.setSeaColor(e.target.value); });
      this.range('shore-w', 'v-shore-w', function (v) {
        Cv.shoreWidth = v; Cv.shoreDirty = true;
      });
      on('shore-style', 'change', function (e) {
        Cv.shoreStyle = e.target.value; Cv.shoreDirty = true; Cv.requestRender();
      });
      on('btn-smooth', 'click', function () { Tools.smoothCoast(6); });
      on('btn-clear-land', 'click', function () { Tools.clearRasterLayer('landmass'); });

      on('lg-template', 'change', function (e) { self.applyLandgenTemplate(e.target.value); });
      self.range('lg-rough', 'v-lg-rough', function (v) { App.landgen.roughness = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('lg-rivers', 'change', function (e) { App.landgen.rivers = e.target.checked; });
      on('lg-lakes', 'change', function (e) { App.landgen.lakes = e.target.checked; });
      on('lg-terrain', 'change', function (e) { App.landgen.terrain = e.target.checked; });

      /* Kara + (istenirse) yükselti/nehir/göl/arazi'yi tek tıkla, tek bir
         tohumdan üretir. Uyarı modalı yalnızca İLK seferde gösterilir —
         localStorage bayrağı kalıcı, her "Üret" tıklamasında tekrar
         sormaya gerek yok.

         Adımlar arasına birer "nefes alma" karesi (yieldFrame) konur ve
         en ağır adım (Tools.autoBiome) kendi içinde parçalara bölünmüş
         durumda — bu sayede tüm dizi tek bir donmuş JS turu yerine bir
         seri kısa parçaya yayılır, tarayıcı aradaki karelerde tekrar
         boyayıp girdi işleyebilir. "Üret" düğmesi işlem sürerken kilitlenip
         bir kum saati gösterir, böylece kullanıcı sekmenin çökmediğini
         anlar ve ikinci bir tıklamayla üst üste bir üretim başlatamaz. */
      function yieldFrame() { return new Promise(function (r) { setTimeout(r, 0); }); }

      function runLandgen() {
        var seed = Math.floor(Math.random()*4294967296);
        var withRivers = App.landgen.rivers, withTerrain = App.landgen.terrain, withLakes = App.landgen.lakes;
        /* Metni değiştirmek yerine sınıf takıyoruz: buton artık inline SVG
           bir zar taşıyor, textContent'e yazmak onu silerdi. Zarın dönmesi
           zaten "çalışıyor" göstergesinin kendisi. */
        var btn = $('btn-landgen');
        if (btn) { btn.disabled = true; btn.classList.add('rolling-dice'); }

        Tools.generateLandmass(App.landgen.template, App.landgen.roughness, seed,
          { withElevation: withRivers || withTerrain });

        var chain = yieldFrame();
        if (withTerrain) chain = chain.then(function () { return Tools.autoBiome(seed); });
        if (withRivers) chain = chain.then(yieldFrame).then(function () { Tools.generateRivers(null, seed); });
        if (withLakes) chain = chain.then(yieldFrame).then(function () { Tools.autoLakes(seed); });
        chain.then(function () {
          if (btn) { btn.disabled = false; btn.classList.remove('rolling-dice'); }
        });
      }
      on('btn-lg-save', 'click', function () {
        var nm = prompt(self.t('o_lgsave_ask'), self.t('o_lgsave_def'));
        if (nm === null) return;
        nm = String(nm).trim();
        if (!nm) return;
        App.landgenPresets = App.landgenPresets || [];
        App.landgenPresets.push({
          name: nm,
          template: App.landgen.template,
          roughness: App.landgen.roughness,
          rivers: App.landgen.rivers,
          lakes: App.landgen.lakes,
          terrain: App.landgen.terrain
        });
        self.refreshLandgenTemplates();
        $('lg-template').value = 'preset:' + (App.landgenPresets.length - 1);
        self.applyLandgenTemplate($('lg-template').value);
        self.msg(self.t('m_lgsaved'));
      });
      on('btn-lg-del', 'click', function () {
        var v = $('lg-template').value;
        if (v.indexOf('preset:') !== 0) return;
        App.landgenPresets.splice(+v.slice(7), 1);
        self.refreshLandgenTemplates();
        $('lg-template').value = 'continent';
        self.applyLandgenTemplate('continent');
      });

      on('btn-landgen', 'click', function () {
        var warned = false;
        try { warned = !!localStorage.getItem(self.LANDGEN_WARNED_KEY); } catch (e) {}
        if (warned) { runLandgen(); return; }
        self.modal(self.t('o_landgen'), '<p>' + self.t('h_landgen') + '</p>', function () {
          try { localStorage.setItem(self.LANDGEN_WARNED_KEY, '1'); } catch (e) {}
          runLandgen();
        });
      });

      /* --- isim tabanı (kullanıcı kültürleri) --- */
      function splitSyl(id) {
        return (($(id) || {}).value || '').split(',')
          .map(function (t) { return t.trim(); }).filter(Boolean);
      }
      on('btn-nb-add', 'click', function () {
        var nm = (($('nb-name') || {}).value || '').trim();
        if (!nm) { self.msg(self.t('nb_needname')); return; }
        /* Anahtar kullanıcıya sorulmaz: addCustomCulture aynı anahtarla
           tekrar çağrılırsa üzerine yazar, bu da "aynı adı tekrar ekle"
           davranışını doğal biçimde güncellemeye çevirir. */
        var key = 'usr_' + nm.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        var ok = Names.addCustomCulture(key, {
          name: nm,
          bas: splitSyl('nb-bas'),
          orta: splitSyl('nb-orta'),
          son: splitSyl('nb-son'),
          birlesik: !!($('nb-birlesik') || {}).checked
        });
        if (!ok) { self.msg(self.t('nb_needsyl')); return; }
        self.buildCultureList();
        if ($('nm-culture')) $('nm-culture').value = key;
        self.msg(self.t('m_nbadded'));
      });
      on('btn-nb-del', 'click', function () {
        var key = (($('nm-culture') || {}).value || '');
        if (!Names.removeCustomCulture(key)) { self.msg(self.t('nb_builtin')); return; }
        self.buildCultureList();
        self.msg(self.t('m_nbdeleted'));
      });

      /* --- arazi --- */
      this.range('tr-size', 'v-tr-size', function (v) { App.terrain.size = v; });
      this.range('tr-op', 'v-tr-op', function (v) { App.terrain.opacity = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('tr-clip', 'change', function (e) { App.terrain.clip = e.target.checked; });
      on('btn-clear-terrain', 'click', function () { Tools.clearRasterLayer('terrain'); });
      on('btn-biomegen', 'click', function () {
        self.modal(self.t('o_biomegen'), '<p>' + self.t('h_biomegen') + '</p>', function () {
          var btn = $('btn-biomegen'), origLabel = btn ? btn.textContent : '';
          if (btn) { btn.disabled = true; btn.textContent = '⏳ …'; }
          Tools.autoBiome(Math.floor(Math.random()*4294967296)).then(function () {
            if (btn) { btn.disabled = false; btn.textContent = origLabel; }
          });
        });
      });

      /* --- iklim ---
         Parametreler yalnızca bir SONRAKİ "Biyom ata" çağrısını etkiler
         (mevcut arazi katmanı olduğu gibi kalır); rüzgâr okları ise
         anında güncellenir, çünkü önbelleği burada geçersizleştiriyoruz. */
      function cliChanged() {
        Cv.windDirty = true;
        Cv.requestRender();
      }
      on('cli-on', 'change', function (e) {
        App.climate.on = e.target.checked;
        $('cli-body').hidden = !e.target.checked;
        cliChanged();
      });
      this.range('cli-eq', 'v-cli-eq', function (v) { App.climate.equator = v/100; cliChanged(); },
                 function (v) { return Math.round(v) + '%'; });
      this.range('cli-str', 'v-cli-str', function (v) { App.climate.strength = v/100; },
                 function (v) { return Math.round(v) + '%'; });
      on('cli-wind', 'change', function (e) { Cv.windArrows = e.target.checked; cliChanged(); });

      /* --- yükselti --- */
      this.range('el-size', 'v-el-size', function (v) { App.elevation.brushSize = v; });
      this.range('el-strength', 'v-el-strength', function (v) { App.elevation.strength = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('el-lower', 'change', function (e) { App.elevation.lower = e.target.checked; });
      on('btn-clear-elevation', 'click', function () { Tools.clearRasterLayer('elevation'); });
      on('elev-hillshade', 'change', function (e) {
        App.elevation.showHillshade = e.target.checked;
        Cv.elevationDirty = true; Cv.requestRender();
      });
      on('elev-contours', 'change', function (e) {
        App.elevation.showContours = e.target.checked;
        Cv.elevationDirty = true; Cv.requestRender();
      });
      this.range('elev-interval', 'v-elev-interval', function (v) {
        App.elevation.contourInterval = v;
        Cv.elevationDirty = true;
      });

      /* --- sembol --- */
      this.range('sy-size', 'v-sy-size', function (v) {
        App.symbol.size = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ size:v });
      });
      this.range('sy-rot', 'v-sy-rot', function (v) {
        App.symbol.rot = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ rot:v });
      }, function (v) { return v + '°'; });
      this.range('sy-hue', 'v-sy-hue', function (v) {
        App.symbol.hue = v;
        if (self.selIs('symbols')) Tools.applyToSelection({ hue:v });
      }, function (v) { return v + '°'; });
      this.range('sy-op', 'v-sy-op', function (v) {
        App.symbol.opacity = v/100;
        if (self.selIs('symbols')) Tools.applyToSelection({ opacity:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      this.range('sy-wear', 'v-sy-wear', function (v) {
        App.symbol.wear = v/100;
        if (self.selIs('symbols')) Tools.applyToSelection({ wear:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('sy-jitter', 'change', function (e) { App.symbol.jitter = e.target.checked; });
      on('sg-labels', 'change', function (e) { App.settlegen.labels = e.target.checked; });
      on('btn-settlegen', 'click', function () {
        Tools.autoSettle(null, Math.floor(Math.random()*4294967296));
      });

      /* --- nehir --- */
      this.range('rv-w', 'v-rv-w', function (v) {
        App.river.width = v;
        if (self.selIs('rivers')) Tools.applyToSelection({ width:v });
      });
      this.range('rv-m', 'v-rv-m', function (v) {
        App.river.meander = v/100;
        if (self.selIs('rivers')) Tools.applyToSelection({ meander:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('rv-taper', 'change', function (e) {
        App.river.taper = e.target.checked;
        self.editStart();
        if (self.selIs('rivers')) Tools.applyToSelection({ taper:e.target.checked });
        self.editCommit();
      });
      on('rv-color', 'input', function (e) {
        App.river.color = e.target.value;
        if (self.selIs('rivers')) Tools.applyToSelection({ color:e.target.value });
      });
      on('btn-rivergen', 'click', function () {
        Tools.generateRivers(null, Math.floor(Math.random()*4294967296));
      });

      /* --- yol --- */
      on('rd-style', 'change', function (e) {
        App.road.style = e.target.value;
        self.editStart();
        if (self.selIs('roads')) Tools.applyToSelection({ style:e.target.value });
        self.editCommit();
      });
      this.range('rd-w', 'v-rd-w', function (v) {
        App.road.width = v;
        if (self.selIs('roads')) Tools.applyToSelection({ width:v });
      });
      on('rd-color', 'input', function (e) {
        App.road.color = e.target.value;
        if (self.selIs('roads')) Tools.applyToSelection({ color:e.target.value });
      });
      on('btn-roadgen', 'click', function () {
        Tools.generateRoads(Math.floor(Math.random()*4294967296));
      });

      /* --- ölçüm --- */
      on('ms-area', 'change', function (e) { App.measure.area = e.target.checked; });

      /* --- etiket --- */
      function labelEdit(props) { if (self.selIs('labels')) Tools.applyToSelection(props); }

      on('lb-text', 'input', function (e) {
        labelEdit({ text:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });

      on('lb-preset', 'change', function (e) {
        self.applyPreset(e.target.value);
        self.editStart();
        if (self.selIs('labels')) {
          var p = LABEL_PRESETS[e.target.value];
          Tools.applyToSelection({
            preset:e.target.value, font:p.font, color:p.color, outline:p.outline,
            outlineColor:p.outlineColor, shadow:p.shadow, track:p.track,
            caps:p.caps, banner:p.banner, size:p.size
          });
        }
        self.editCommit();
        self.drawLabelPreview();
        Cv.requestRender();
      });

      this.range('lb-size', 'v-lb-size', function (v) { App.label.size = v; labelEdit({ size:v }); self.drawLabelPreview(); });
      this.range('lb-curve', 'v-lb-curve', function (v) { App.label.curve = v; labelEdit({ curve:v }); });
      this.range('lb-track', 'v-lb-track', function (v) { App.label.track = v; labelEdit({ track:v }); self.drawLabelPreview(); });
      this.range('lb-rot', 'v-lb-rot', function (v) { App.label.rot = v; labelEdit({ rot:v }); },
                 function (v) { return v + '°'; });
      on('lb-color', 'input', function (e) {
        App.label.color = e.target.value;
        labelEdit({ color:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });
      on('lb-font', 'change', function (e) {
        App.label.font = e.target.value;
        labelEdit({ font:e.target.value });
        self.syncFontNote();
        self.drawLabelPreview();
        Cv.requestRender();
      });
      on('lb-banner', 'change', function (e) {
        var v = e.target.value || null;
        App.label.banner = v;
        labelEdit({ banner:v });
        self.drawLabelPreview();
        Cv.requestRender();
      });
      ['caps', 'outline', 'shadow'].forEach(function (k) {
        on('lb-' + k, 'change', function (e) {
          var props = {}; props[k] = e.target.checked;
          App.label[k] = e.target.checked;
          if (k === 'outline' && $('lb-outline-color')) $('lb-outline-color').disabled = !e.target.checked;
          labelEdit(props);
          self.drawLabelPreview();
          Cv.requestRender();
        });
      });
      on('lb-outline-color', 'input', function (e) {
        App.label.outlineColor = e.target.value;
        labelEdit({ outlineColor:e.target.value });
        self.drawLabelPreview();
        Cv.requestRender();
      });
      on('lb-snap-path', 'change', function (e) { App.label.snapPath = e.target.checked; });

      /* --- çizim (kullanıcı katmanı fırçası) --- */
      on('btn-add-layer', 'click', function () { self.addLayer(); });
      on('sk-color', 'input', function (e) { App.sketch.color = e.target.value; });
      this.range('sk-size', 'v-sk-size', function (v) { App.sketch.size = v; });
      this.range('sk-hard', 'v-sk-hard', function (v) { App.sketch.hardness = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      this.range('sk-op', 'v-sk-op', function (v) { App.sketch.opacity = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('sk-eraser', 'change', function (e) { App.sketch.eraser = e.target.checked; });

      /* --- örnekleyici --- */
      on('eye-r', 'input', function (e) {
        App.eyedrop.radius = parseFloat(e.target.value);
        $('v-eye-r').textContent = e.target.value;
      });
      on('eye-br', 'input', function (e) {
        App.eyedrop.brushRadius = parseFloat(e.target.value);
        $('v-eye-br').textContent = e.target.value;
        Cv.requestRender();
      });
      on('eye-layer', 'change', function (e) { App.eyedrop.targetLayer = e.target.value; });
      on('btn-eye-pick', 'click', function () {
        Eyedropper.active = false; Eyedropper.sample = null; Eyedropper.picking = false;
        App.eyedrop.hasSample = false; App.eyedrop.painting = false;
        self.setTool('eyedrop');
        self.refreshEyedropPanel();
        self.msg(self.t('eyePick'));
      });
      on('btn-eye-paint', 'click', function () {
        if (!Eyedropper.sample) { self.msg(self.t('eyeNeed')); return; }
        App.eyedrop.painting = true;
        App.eyedrop.hasSample = true;
        self.setTool('eyedrop');
        self.refreshEyedropPanel();
        self.msg(self.t('eyePaint'));
      });
      on('btn-eye-clear', 'click', function () {
        Eyedropper.sample = null; Eyedropper.active = false;
        App.eyedrop.hasSample = false; App.eyedrop.painting = false;
        self.refreshEyedropPanel();
        Cv.requestRender();
      });

      /* --- seçim --- */
      on('btn-del', 'click', function () { Tools.deleteSelection(); });

      /* --- yol/kement dokunma eylemleri --- */
      on('tpa-finish', 'click', function () { self.finishOrCommit(); });
      on('tpa-cancel', 'click', function () { self.cancelOrDeselect(); });
      on('tpa-undo',   'click', function () { self.undoPointOrDelete(); });
      on('btn-dup', 'click', function () { Tools.duplicateSelection(); });
      on('btn-group',   'click', function () { Tools.groupSelection(); });
      on('btn-ungroup', 'click', function () { Tools.ungroupSelection(); });
      on('btn-fwd',   'click', function () { Tools.bringForward(); });
      on('btn-bwd',   'click', function () { Tools.sendBackward(); });
      on('btn-front', 'click', function () { Tools.bringToFront(); });
      on('btn-back',  'click', function () { Tools.sendToBack(); });

      /* --- ölçek çubuğu --- */
      on('sc-visible', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.scale));
        App.scale.visible = e.target.checked;
        History.pushScale(b, JSON.parse(JSON.stringify(App.scale)), 'scale:visible');
        self.refreshHistory();
        Cv.requestRender();
      });
      on('sc-label', 'input', function (e) { App.scale.label = e.target.value; Cv.requestRender(); });
      on('sc-label', 'change', function () {
        History.pushScale(App.scale, JSON.parse(JSON.stringify(App.scale)), 'scale:label');
        self.refreshHistory();
      });
      this.range('sc-len', 'v-sc-len', function (v) { App.scale.len = v; });
      this.range('sc-size', 'v-sc-size', function (v) { App.scale.size = v; });
      this.range('sc-segs', 'v-sc-segs', function (v) { App.scale.segs = Math.round(v); });

      /* --- sembol fırçası --- */
      on('sy-brush-mode', 'change', function (e) { App.symbol.brushMode = e.target.checked; });
      self.range('sy-brush-density', 'v-sy-br-den', function (v) { App.symbol.brushDensity = v/100; },
                 function (v) { return (v/100).toFixed(2); });
      on('sy-clip-land', 'change', function (e) { App.symbol.clipToLand = e.target.checked; });

      /* --- göl --- */
      on('lk-color', 'input', function (e) {
        App.lake.color = e.target.value;
        if (self.selIs('rivers') && Tools.selected() && Tools.selected().kind === 'lake') {
          Tools.applyToSelection({ color:e.target.value });
        }
      });

      /* --- bölge/toprak --- */
      function terrEdit(props) { if (self.selIs('territories')) Tools.applyToSelection(props); }
      on('tt-color', 'input', function (e) {
        App.territory.color = e.target.value;
        terrEdit({ color:e.target.value });
      });

      /* --- siyasi harita görünümü --- */
      on('pol-on', 'change', function (e) {
        Cv.political = e.target.checked;
        Cv.requestRender();
        UI.msg(e.target.checked ? UI.t('m_polon') : UI.t('m_poloff'));
      });
      on('pol-mute', 'change', function (e) { Cv.politicalMuteTerrain = e.target.checked; Cv.requestRender(); });
      on('pol-legend', 'change', function (e) { Cv.politicalLegend = e.target.checked; Cv.requestRender(); });
      on('pol-emblem', 'change', function (e) { Cv.emblems = e.target.checked; Cv.requestRender(); });
      self.range('pol-fill', 'v-pol-fill', function (v) { Cv.politicalFill = v/100; Cv.requestRender(); },
                 function (v) { return (v/100).toFixed(2); });
      on('btn-pol-colors', 'click', function () {
        var L = Layers.get('territories');
        var before = JSON.parse(JSON.stringify(L.objects));
        var n = Cv.assignPoliticalColors();
        if (!n) { UI.msg(UI.t('m_polempty')); return; }
        History.pushVector('territories', before, JSON.parse(JSON.stringify(L.objects)), 'political-colors');
        UI.refreshHistory();
        Cv.requestRender();
        self.refreshTerritoryList();
        UI.msg(n + ' ' + UI.t('m_polcolored'));
      });
      on('tt-name', 'input', function (e) { terrEdit({ name: e.target.value }); self.refreshTerritoryList(); });

      /* --- bölge tipi (zone) --- */
      on('tt-zone', 'change', function (e) { Tools.setZoneType(e.target.value); });

      /* --- notlar ---
         'change' (blur/Enter) kullanıyoruz, 'input' değil: her tuş
         vuruşu ayrı bir History adımı üretirdi ve Ctrl+Z harf harf geri
         alırdı. */
      on('sel-note', 'change', function (e) { Tools.setObjectNote(e.target.value); });
      on('note-show', 'change', function (e) { Cv.notes = e.target.checked; Cv.requestRender(); });

      /* --- devlet editörü (seçili bölge) --- */
      on('tt-gov', 'change', function (e) { Tools.setStateGovernment(e.target.value); });
      on('btn-tt-makestate', 'click', function () {
        if (Tools.makeState()) self.msg(self.t('m_stmade'));
      });
      on('btn-tt-unstate', 'click', function () {
        if (Tools.unmakeState()) self.msg(self.t('m_stunmade'));
      });

      /* --- arma --- */
      on('btn-tt-emblem', 'click', function () {
        if (Tools.rollEmblem()) self.msg(self.t('m_emblem'));
      });
      on('btn-tt-emblem-clear', 'click', function () { Tools.clearEmblem(); });
      on('btn-tt-emblem-png', 'click', function () {
        var o = Tools.selected();
        if (!o || !o.emblem) return;
        var c = Emblem.toCanvas(o.emblem, 512);
        downloadFile(c.toDataURL('image/png'),
                     ((o.name || 'arma').replace(/[^\w\-]+/g, '_')) + '.png');
      });
      /* --- eyaletler --- */
      self.range('prov-count', 'v-prov-count', function (v) { App.stategen.provinceCount = Math.round(v); },
                 function (v) { return String(Math.round(v)); });
      on('btn-provgen', 'click', function () {
        var n = Tools.generateProvinces(App.stategen.provinceCount, Math.floor(Math.random()*4294967296));
        if (n) { Cv.politicalMode = 'state'; $('pol-mode').value = 'state'; self.msg(n + ' ' + self.t('m_provgen')); }
      });

      /* --- diplomasi --- */
      on('diplo-a', 'change', function () { self.refreshDiplomacy(); });
      on('diplo-b', 'change', function () { self.refreshDiplomacy(); });
      on('diplo-rel', 'change', function (e) {
        var a = $('diplo-a').value, b = $('diplo-b').value;
        if (!a || !b || a === b) { self.msg(self.t('diplo_same')); self.refreshDiplomacy(); return; }
        if (Tools.setRelation(a, b, e.target.value)) self.refreshDiplomacy();
      });

      /* --- şehir üretimi (seçili bölgenin sınırları içine) --- */
      self.range('city-buildings', 'v-city-buildings', function (v) { App.citygen.buildings = Math.round(v); },
                 function (v) { return String(Math.round(v)); });
      self.range('city-street', 'v-city-street', function (v) { App.citygen.streetWidth = Math.round(v); },
                 function (v) { return String(Math.round(v)); });
      on('city-district', 'change', function (e) { App.citygen.district = e.target.value; });
      on('city-wall', 'change', function (e) { App.citygen.wall = e.target.checked; });
      on('btn-citygen', 'click', function () {
        var o = Tools.selected();
        if (!o || !self.selIs('territories') || !o.pts) { self.msg(self.t('city_noarea')); return; }
        var btn = $('btn-citygen');
        btn.disabled = true;
        var prev = btn.textContent;
        btn.textContent = '⏳ …';
        /* Üretim senkron ama yüzlerce parça hesaplıyor — düğmenin
           "çalışıyor" hâli bir sonraki karede boyansın diye bir kare
           bekleyip öyle başlatıyoruz (autoBiome'daki desen). */
        requestAnimationFrame(function () {
          var n = Tools.generateCity(o.pts, {
            district: App.citygen.district,
            buildings: App.citygen.buildings,
            streetWidth: App.citygen.streetWidth,
            wall: App.citygen.wall,
            seed: Math.floor(Math.random()*4294967296)
          });
          btn.disabled = false; btn.textContent = prev;
          if (n) self.msg(n + ' ' + self.t('m_citygen'));
        });
      });

      on('btn-tt-speak', 'click', function () {
        var o = Tools.selected();
        if (o && o.name) self.speak(o.name);
      });
      on('btn-tt-capital', 'click', function () {
        /* açık/kapalı geçişi: düğmeye ikinci kez basmak modu iptal eder */
        Tools.setCapitalPick(!Tools.capitalPick);
        if (Tools.capitalPick) self.msg(self.t('m_capitalpick'));
      });

      /* --- devlet & kültür otomatik üretimi --- */
      on('pol-mode', 'change', function (e) {
        Cv.politicalMode = e.target.value;
        Cv.requestRender();
        self.refreshTerritoryList();
      });
      self.range('st-count', 'v-st-count', function (v) { App.stategen.count = Math.round(v); },
                 function (v) { return String(Math.round(v)); });
      self.range('st-variety', 'v-st-variety', function (v) { App.stategen.variety = v/100; },
                 function (v) { return Math.round(v) + '%'; });
      self.range('cu-count', 'v-cu-count', function (v) { App.stategen.cultureCount = Math.round(v); },
                 function (v) { return String(Math.round(v)); });
      on('btn-stategen', 'click', function () {
        var n = Tools.generateStates(App.stategen.count, App.stategen.variety,
                                     Math.floor(Math.random()*4294967296));
        if (n) { Cv.politicalMode = 'state'; $('pol-mode').value = 'state'; self.msg(n + ' ' + self.t('m_stategen')); }
      });
      self.range('re-count', 'v-re-count', function (v) { App.stategen.religionCount = Math.round(v); },
                 function (v) { return String(Math.round(v)); });
      on('btn-religiongen', 'click', function () {
        var n = Tools.generateReligions(App.stategen.religionCount, Math.floor(Math.random()*4294967296));
        if (n) { Cv.politicalMode = 'religion'; $('pol-mode').value = 'religion'; self.msg(n + ' ' + self.t('m_religiongen')); }
      });
      on('btn-culturegen', 'click', function () {
        var n = Tools.generateCultures(App.stategen.cultureCount, Math.floor(Math.random()*4294967296));
        if (n) { Cv.politicalMode = 'culture'; $('pol-mode').value = 'culture'; self.msg(n + ' ' + self.t('m_culturegen')); }
      });

      /* --- fantastik ad üreteci --- */
      self.buildCultureList();
      on('btn-nm-gen', 'click', function () { self.suggestNames(); });
      this.range('tt-op', 'v-tt-op', function (v) {
        App.territory.opacity = v/100;
        terrEdit({ opacity:v/100 });
      }, function (v) { return (v/100).toFixed(2); });
      on('tt-bcolor', 'input', function (e) {
        App.territory.borderColor = e.target.value;
        terrEdit({ borderColor:e.target.value });
      });
      this.range('tt-bw', 'v-tt-bw', function (v) {
        App.territory.borderWidth = v;
        terrEdit({ borderWidth:v });
      });

      /* --- windrose --- */
      on('wr-visible', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.windrose));
        App.windrose.visible = e.target.checked;
        History.pushWindrose(b, JSON.parse(JSON.stringify(App.windrose)), 'windrose:visible');
        self.refreshHistory(); Cv.requestRender();
      });
      self.range('wr-size', 'v-wr-size', function (v) { App.windrose.size = v; });
      on('wr-style', 'change', function (e) {
        var b = JSON.parse(JSON.stringify(App.windrose));
        App.windrose.style = e.target.value;
        History.pushWindrose(b, JSON.parse(JSON.stringify(App.windrose)), 'windrose:style');
        self.refreshHistory(); Cv.requestRender();
      });
      on('wr-color', 'input', function (e) { App.windrose.color = e.target.value; Cv.requestRender(); });

      /* --- snap --- */
      /* --- ızgara (kare / altıgen / nokta) --- */
      on('grid-type', 'change', function (e) { Cv.gridType = e.target.value; Cv.requestViewRender(); });
      on('grid-color', 'input', function (e) { Cv.gridColor = e.target.value; Cv.requestViewRender(); });
      self.range('grid-size', 'v-grid-size', function (v) { Cv.gridSize = Math.round(v); Cv.requestViewRender(); });
      self.range('grid-op', 'v-grid-op', function (v) { Cv.gridOpacity = v/100; Cv.requestViewRender(); },
                 function (v) { return (v/100).toFixed(2); });

      on('snap-enabled', 'change', function (e) { App.snap.enabled = e.target.checked; });
      self.range('snap-size', 'v-snap-size', function (v) { App.snap.size = Math.round(v); });

      /* --- harita çerçevesi --- */
      on('frame-style', 'change', function (e) { Cv.frame.style = e.target.value; Cv.requestRender(); });
      on('frame-color', 'input', function (e) { Cv.frame.color = e.target.value; Cv.requestRender(); });
      self.range('frame-w', 'v-frame-w', function (v) { Cv.frame.width = v; });

      /* --- PNG export ölçeği --- */
      on('btn-export-png2', 'click', function () { Exporter.png(2); });
      on('btn-export-png4', 'click', function () { Exporter.png(4); });
      on('btn-export-html', 'click', function () { self.htmlExportDialog(); });
      on('btn-export-gis', 'click', function () { Exporter.geojson(); });
      on('btn-share-link', 'click', function () { self.shareLinkDialog(); });
      on('btn-print', 'click', function () { self.printDialog(); });

      /* --- görünüm --- */
      on('btn-fit', 'click', function () { Cv.fit(); });
      on('btn-100', 'click', function () { Cv.setZoom(1); });

      /* --- referans --- */
      on('ref-file', 'change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var im = new Image();
          im.onload = function () {
            var L = Layers.get('reference');
            L.image = im; L.imageData = r.result; L.visible = true;
            self.refreshLayers();
            Cv.requestRender();
          };
          im.src = r.result;
        };
        r.readAsDataURL(f);
        e.target.value = '';
      });
      on('ref-export', 'change', function (e) { App.exportReference = e.target.checked; });
      on('ref-trace', 'change', function (e) {
        App.reference.traceMode = e.target.checked;
        Cv.requestRender();
      });
      on('btn-ref-clear', 'click', function () {
        var L = Layers.get('reference');
        L.image = null; L.imageData = null;
        Tools._refTraceCache = null;
        Cv.requestRender();
      });

      /* --- referans görselden coğrafya taraması --- */
      on('scan-progress-cancel', 'click', function () {
        /* Bayrağı kaldırmak yeterli: tarama her chunk sınırında yokluyor
           ve hiçbir katmana dokunmadan geri sarılıyor. */
        if (self._scanToken) self._scanToken.cancelled = true;
      });
      on('btn-ref-scan', 'click', function () {
        var L = Layers.get('reference');
        if (!L || !L.image) { self.msg(self.t('scan_noimage')); return; }
        /* Mevcut karayı değiştiren yıkıcı bir içe aktarma — her seferinde
           onay iste (landgen'in tek seferlik uyarısından farklı olarak bu
           işlem nadir ve daha geniş kapsamlı). */
        self.modal(self.t('ref_scan'), '<p>' + self.t('h_ref_scan') + '</p>', function () {
          var token = { cancelled:false };
          self.showScanProgress(token);
          Tools.scanReferenceImage({
            token: token,
            onProgress: function (si, sc, sk, f) { self.updateScanProgress(si, sc, sk, f); }
          }).then(function (res) {
            self.hideScanProgress();
            if (res && typeof res === 'object') {
              self.msg(self.t('scan_done')
                .replace('{r}', res.rivers).replace('{l}', res.lakes).replace('{m}', res.markers));
            }
          })['catch'](function (err) {
            self.hideScanProgress();
            var m = String((err && err.message) || '');
            if (m.indexOf('cancelled') >= 0) return;   /* kullanıcı iptali: sessiz */
            self.msg(self.t(m.indexOf('flat') >= 0   ? 'scan_flat'
                          : m.indexOf('noland') >= 0 ? 'scan_noland'
                          : 'scan_failed'));
          });
        });
      });

      /* --- custom PNG sembol --- */
      on('btn-sym-upload', 'click', function () { $('sym-file').click(); });
      on('sym-file', 'change', function (e) {
        var files = e.target.files;
        if (!files || !files.length) return;
        var loaded = 0, total = files.length;
        Array.prototype.forEach.call(files, function (f) {
          var r = new FileReader();
          r.onload = function () {
            var im = new Image();
            im.onload = function () {
              var id = 'cus_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
              Sym.addCustom(id, f.name.replace(/\.[^.]+$/, ''), r.result, im.naturalWidth, im.naturalHeight);
              loaded++;
              if (loaded === total) {
                self.renderCustomSymGrid();
                self.msg(total + ' ' + self.t('sym_upload_done'));
              }
            };
            im.src = r.result;
          };
          r.readAsDataURL(f);
        });
        e.target.value = '';
      });
    },

    /* Yazı ailesi listesi. Sistemde kurulu olmayan aileler işaretlenir —
       proje harici font yüklemediği için kullanıcı ne göreceğini bilmeli. */
    buildFontList: function () {
      var sel = $('lb-font');
      if (!sel) return;
      var self = this, cur = App.label.font;
      sel.innerHTML = '';
      FONT_LIST.forEach(function (f) {
        var o = document.createElement('option');
        o.value = f.key;
        var nm = i18nName('font_' + f.key, f.tr, f.en, self.lang);
        o.textContent = nm + (fontAvailable(f.key) ? ' ·' : '');
        sel.appendChild(o);
      });
      sel.value = FONTS[cur] ? cur : 'serif';
      this.syncLabelType(App.label);
    },

    /* Seçili aile bu cihazda yoksa küçük bir not göster. */
    syncFontNote: function () {
      var note = $('lb-font-note');
      if (!note) return;
      var ok = fontAvailable(App.label.font);
      note.classList.toggle('hidden', ok);
    },

    /* ================= etiket şablonları ================= */
    buildLabelPresets: function () {
      var sel = $('lb-preset');
      if (!sel) return;
      var cur = sel.value || App.label.preset;
      sel.innerHTML = '';
      var self = this;
      Object.keys(LABEL_PRESETS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = i18nName(k, LABEL_PRESETS[k].tr, LABEL_PRESETS[k].en, self.lang);
        sel.appendChild(o);
      });
      sel.value = LABEL_PRESETS[cur] ? cur : 'region';
      this.drawLabelPreview();
    },

    applyPreset: function (key) {
      var p = LABEL_PRESETS[key];
      if (!p) return;
      App.label.preset = key;
      App.label.font = p.font;
      App.label.size = p.size;
      App.label.color = p.color;
      App.label.outline = p.outline;
      App.label.outlineColor = p.outlineColor;
      App.label.shadow = p.shadow;
      App.label.track = p.track;
      App.label.caps = p.caps;
      App.label.banner = p.banner;
      $('lb-size').value = p.size;   $('v-lb-size').textContent = p.size;
      $('lb-track').value = p.track; $('v-lb-track').textContent = p.track;
      $('lb-color').value = p.color;
      this.syncLabelType(p);
    },

    /* Tipografi kutucuklarını bir etiket/preset nesnesinden tazele */
    syncLabelType: function (o) {
      var f = $('lb-font');           if (f) f.value = FONTS[o.font] ? o.font : 'serif';
      var b = $('lb-banner');         if (b) b.value = o.banner || '';
      var c = $('lb-caps');           if (c) c.checked = !!o.caps;
      var ol = $('lb-outline');       if (ol) ol.checked = !!o.outline;
      var oc = $('lb-outline-color');
      if (oc) { oc.value = o.outlineColor || '#f5ecd8'; oc.disabled = !o.outline; }
      var sh = $('lb-shadow');        if (sh) sh.checked = !!o.shadow;
      this.syncFontNote();
    },

    drawLabelPreview: function () {
      var c = $('lb-preview');
      if (!c) return;
      var x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = '#cdbf9c';
      x.fillRect(0, 0, c.width, c.height);

      var txt = ($('lb-text') && $('lb-text').value.trim()) || 'Sideria';
      var o = {
        text:txt, x:c.width/2, y:c.height/2, font:App.label.font,
        size:20, color:App.label.color, outline:App.label.outline,
        outlineColor:App.label.outlineColor, shadow:App.label.shadow,
        curve:0, track:Math.min(6, App.label.track), rot:0,
        caps:App.label.caps, banner:App.label.banner, opacity:1
      };
      /* önizleme genişliğe sığsın */
      var save = Cv.ctx;
      Cv.ctx = x;
      var w = Cv.measureLabel(x, o);
      var maxW = c.width - (o.banner ? 46 : 16);
      if (w > maxW) o.size = Math.max(8, 20 * maxW / w);
      Cv.drawLabel(x, o);
      Cv.ctx = save;
    },

    /* ================= sağ panel ================= */
    bindPanels: function () {
      var self = this;
      document.querySelectorAll('.tab').forEach(function (t) {
        t.addEventListener('click', function () { self.showTab(t.getAttribute('data-tab')); });
      });
      on('sym-cat', 'change', function () { $('sym-search').value = ''; self.renderSymbolGrid(); });
      on('sym-search', 'input', function () { self.renderSymbolGrid(); });

      on('btn-todo-add', 'click', function () { self.addTodo(); });
      on('todo-input', 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); self.addTodo(); } });

      on('btn-toggle-left', 'click', function () { self.togglePanel('left'); });
      on('btn-toggle-right', 'click', function () { self.togglePanel('right'); });
    },

    /* Sol/sağ paneli kapatıp açar (bkz. main.css #workspace.collapsed-*).
       Tuval alanını büyütmek ya da dar ekranlarda yer açmak için kullanılır;
       kolçak düğmesi panelin dışında olduğu için kapalıyken de erişilebilir. */
    togglePanel: function (side) {
      var ws = $('workspace'), cls = 'collapsed-' + side;
      var btn = $(side === 'left' ? 'btn-toggle-left' : 'btn-toggle-right');
      var collapsed = ws.classList.toggle(cls);
      if (btn) {
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        var openGlyph = side === 'left' ? '‹' : '›';
        var closedGlyph = side === 'left' ? '›' : '‹';
        btn.textContent = collapsed ? closedGlyph : openGlyph;
      }
      requestAnimationFrame(function () { Cv.resize(); Cv.requestRender(); });
    },

    showTab: function (name) {
      document.querySelectorAll('.tab').forEach(function (t) {
        var on = t.getAttribute('data-tab') === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('.tab-body').forEach(function (b) {
        b.classList.toggle('hidden', b.getAttribute('data-tab') !== name);
      });
    },

    /* ================= arazi paleti ================= */
    buildTerrainSwatches: function () {
      var g = $('terrain-grid');
      if (!g) return;
      g.innerHTML = '';
      var self = this;
      Object.keys(Terrain.TERRAIN).forEach(function (key) {
        var t = Terrain.TERRAIN[key];
        var b = document.createElement('button');
        b.className = 'terrain-sw' + (App.terrain.type === key ? ' active' : '');
        var c = document.createElement('canvas');
        c.width = 90; c.height = 34;
        c.getContext('2d').drawImage(Terrain.swatch(key, 90, 34), 0, 0);
        b.appendChild(c);
        var s = document.createElement('span');
        s.textContent = i18nName(key, t.tr, t.en, self.lang);
        b.appendChild(s);
        b.addEventListener('click', function () {
          App.terrain.type = key;
          g.querySelectorAll('.terrain-sw').forEach(function (e) { e.classList.remove('active'); });
          b.classList.add('active');
          self.setTool('terrain');
        });
        g.appendChild(b);
      });
    },

    /* ================= sembol kütüphanesi ================= */
    RECENT_SYM_KEY: 'wayborne_recent_symbols',
    RECENT_SYM_MAX: 12,

    loadRecentSymbols: function () {
      try {
        var raw = localStorage.getItem(this.RECENT_SYM_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    },

    /* Bir sembol kütüphaneden seçildiğinde (fırça için aktif olsun ya da
       doğrudan yerleştirilsin) en başa taşınır — böylece "son kullanılan"
       tepsisi her zaman gerçekten kullanılanları, en yeniden en eskiye
       gösterir. localStorage'a yazılır (oturumlar arası kalıcı). */
    pushRecentSymbol: function (id) {
      if (!id || Sym.isCustom(id)) return; /* özel semboller kendi ızgarasında zaten görünür */
      var list = this.loadRecentSymbols().filter(function (x) { return x !== id; });
      list.unshift(id);
      if (list.length > this.RECENT_SYM_MAX) list.length = this.RECENT_SYM_MAX;
      try { localStorage.setItem(this.RECENT_SYM_KEY, JSON.stringify(list)); } catch (e) {}
      this.renderRecentSymGrid();
    },

    renderRecentSymGrid: function () {
      var bar = $('sym-recent-bar'), grid = $('sym-recent-grid');
      if (!bar || !grid) return;
      var list = this.loadRecentSymbols().map(function (id) { return Sym.get(id); }).filter(Boolean);
      if (!list.length) { bar.style.display = 'none'; return; }
      bar.style.display = '';
      grid.innerHTML = '';
      var self = this;
      list.forEach(function (def) { grid.appendChild(self.makeSymCell(grid, def)); });
    },

    buildSymbolLibrary: function () {
      var sel = $('sym-cat');
      if (!sel) return;
      var cur = sel.value;
      sel.innerHTML = '';
      var self = this;
      Object.keys(Sym.SYMBOLS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k;
        o.textContent = i18nName(k, Sym.SYMBOLS[k].tr, Sym.SYMBOLS[k].en, self.lang) +
                        ' (' + Sym.SYMBOLS[k].items.length + ')';
        sel.appendChild(o);
      });
      sel.value = cur && Sym.SYMBOLS[cur] ? cur : 'castles';
      this.renderSymbolGrid();
      this.renderRecentSymGrid();
    },

    makeSymCell: function (grid, def) {
      var self = this;
      var cell = document.createElement('div');
      cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
      var c = document.createElement('canvas');
      c.width = 96; c.height = 96;
      Sym.draw(c.getContext('2d'), def.id, { x:48, y:48, size:86, rot:0, hue:0, opacity:1 });
      cell.appendChild(c);
      var s = document.createElement('small');
      s.textContent = i18nName(def.id, def.tr, def.en, self.lang);
      cell.appendChild(s);
      cell.addEventListener('click', function () {
        App.symbol.id = def.id;
        document.querySelectorAll('.sym-grid .sym-cell').forEach(function (e) { e.classList.remove('active'); });
        cell.classList.add('active');
        self.setTool('symbol');
        self.pushRecentSymbol(def.id);
      });
      return cell;
    },

    renderSymbolGrid: function () {
      var grid = $('sym-grid');
      if (!grid) return;
      var self = this;
      var q = ($('sym-search') && $('sym-search').value || '').trim().toLocaleLowerCase(this.lang);
      grid.innerHTML = '';

      if (q) {
        /* arama modu: tüm kategorilerde adı eşleşen sembolleri düz liste olarak göster */
        Object.keys(Sym.SYMBOLS).forEach(function (cat) {
          Sym.SYMBOLS[cat].items.forEach(function (def) {
            var name = i18nName(def.id, def.tr, def.en, self.lang);
            if (name.toLocaleLowerCase(self.lang).indexOf(q) >= 0) {
              grid.appendChild(self.makeSymCell(grid, def));
            }
          });
        });
        return;
      }

      var cat = $('sym-cat') && $('sym-cat').value;
      if (!Sym.SYMBOLS[cat]) return;
      Sym.SYMBOLS[cat].items.forEach(function (def) {
        grid.appendChild(self.makeSymCell(grid, def));
      });
    },

    renderCustomSymGrid: function () {
      var g = $('custom-sym-grid');
      if (!g) return;
      g.innerHTML = '';
      var self = this;
      var customs = Sym.getCustomAll();
      if (!customs.length) { g.style.display = 'none'; return; }
      g.style.display = 'grid';
      customs.forEach(function (def) {
        var cell = document.createElement('div');
        cell.className = 'sym-cell' + (App.symbol.id === def.id ? ' active' : '');
        cell.style.position = 'relative';
        var cv = document.createElement('canvas');
        cv.width = 96; cv.height = 96;
        Sym.loadImg(def.dataURL, function (im) {
          if (!im) return;
          var x = cv.getContext('2d');
          x.clearRect(0, 0, 96, 96);
          x.drawImage(im, 0, 0, 96, 96);
        });
        cell.appendChild(cv);
        var s = document.createElement('small');
        s.textContent = def.tr;
        cell.appendChild(s);
        var del = document.createElement('button');
        del.className = 'sym-del';
        del.textContent = '✕';
        del.title = self.t('sym_del');
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          Sym.removeCustom(def.id);
          if (App.symbol.id === def.id) App.symbol.id = 'ik_knight';
          self.renderCustomSymGrid();
        });
        cell.appendChild(del);
        cell.addEventListener('click', function () {
          App.symbol.id = def.id;
          document.querySelectorAll('.sym-cell').forEach(function (e) { e.classList.remove('active'); });
          cell.classList.add('active');
          self.setTool('symbol');
        });
        g.appendChild(cell);
      });
    },

    /* ================= katman listesi ================= */
    refreshBreadcrumb: function () {
      var bar = $('map-breadcrumb'), pathEl = $('map-breadcrumb-path');
      if (!bar || !pathEl) return;
      if (!App.mapStack.length) { bar.classList.add('hidden'); return; }
      bar.classList.remove('hidden');
      var self = this;
      var names = App.mapStack.map(function (m) { return m.label || self.t('bc_world'); });
      names.push(App.currentMapLabel || '');
      pathEl.textContent = names.join(' ▸ ');
    },

    refreshLayers: function () {
      var ul = $('layer-list');
      if (!ul) return;
      ul.innerHTML = '';
      var self = this;
      var order = Layers.list.slice().reverse();

      order.forEach(function (l) {
        var li = document.createElement('li');
        li.className = 'layer-item' + (Layers.active === l.id ? ' active' : '');
        li.setAttribute('data-id', l.id);

        var top = document.createElement('div');
        top.className = 'layer-top';

        /* Sürükleme tutamacı: eskiden tüm satır draggable idi, bu yüzden
           opaklık kaydırıcısını veya karışım seçicisini sürüklemeye
           çalışırken satır sıralaması yanlışlıkla tetikleniyor, satırlar
           üst üste biniyordu. Artık sadece bu tutamaç draggable. */
        var grip = document.createElement('span');
        grip.className = 'li-grip'; grip.textContent = '⠿';
        grip.title = self.t('layer_drag_hint') || '';
        grip.draggable = true;
        grip.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('text/plain', l.id);
          e.dataTransfer.effectAllowed = 'move';
        });
        top.appendChild(grip);

        var vis = document.createElement('button');
        vis.className = 'li-btn' + (l.visible ? '' : ' off');
        vis.textContent = l.visible ? '◉' : '○';
        vis.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.visible = !l.visible;
          if (l.id === 'landmass') Cv.shoreDirty = true;
          History.pushMeta(before, Layers.meta(), 'visibility');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        var lock = document.createElement('button');
        lock.className = 'li-btn' + (l.locked ? '' : ' off');
        lock.textContent = l.locked ? '🔒' : '🔓';
        lock.addEventListener('click', function (e) {
          e.stopPropagation();
          var before = Layers.meta();
          l.locked = !l.locked;
          History.pushMeta(before, Layers.meta(), 'lock');
          self.refreshLayers(); self.refreshHistory();
        });

        var name = document.createElement('span');
        name.className = 'layer-name';
        name.textContent = Layers.name(l, self.lang);

        top.appendChild(vis); top.appendChild(lock); top.appendChild(name);

        /* Kullanıcı katmanı: adı çift tıkla değiştir, × ile sil. Yerleşik
           katmanlarda bu düğmeler yok — adları çeviriden gelir ve
           silinemezler. */
        if (l.custom) {
          name.title = self.t('layer_rename_hint');
          name.classList.add('renamable');
          name.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            var v = prompt(self.t('layer_rename'), Layers.name(l, self.lang));
            if (v === null) return;
            Layers.rename(l.id, v.trim() || self.t('layer_untitled'));
            self.refreshLayers(); self.syncSketchTarget();
          });
          var del = document.createElement('button');
          del.className = 'li-btn li-del';
          del.textContent = '×';
          del.title = self.t('layer_delete');
          del.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!confirm(self.t('layer_delete_confirm'))) return;
            var snap = Layers.snapshotLayer(l);
            Layers.removeCustom(l.id);
            History.pushLayerRemove(snap, 'layer:remove');
            self.refreshLayers(); self.refreshHistory(); self.syncSketchTarget(); Cv.requestRender();
          });
          top.appendChild(del);
        }

        li.appendChild(top);

        var op = document.createElement('input');
        op.type = 'range'; op.className = 'layer-op';
        op.min = 0; op.max = 100; op.value = Math.round(l.opacity * 100);
        var metaBefore = null;
        op.addEventListener('pointerdown', function () { metaBefore = Layers.meta(); });
        op.addEventListener('input', function () { l.opacity = op.value/100; Cv.requestRender(); });
        op.addEventListener('change', function () {
          if (metaBefore) History.pushMeta(metaBefore, Layers.meta(), 'opacity');
          metaBefore = null;
          self.refreshHistory();
        });
        li.appendChild(op);

        if (l.type === 'raster') {
          var blendSel = document.createElement('select');
          blendSel.className = 'layer-blend';
          ['source-over','multiply','overlay','soft-light','screen'].forEach(function (bm) {
            var opt = document.createElement('option');
            opt.value = bm; opt.textContent = self.t('blend_'+bm.replace('-',''));
            if (l.blend === bm) opt.selected = true;
            blendSel.appendChild(opt);
          });
          blendSel.addEventListener('click', function (e) { e.stopPropagation(); });
          blendSel.addEventListener('change', function (e) {
            var before = Layers.meta();
            l.blend = e.target.value;
            History.pushMeta(before, Layers.meta(), 'blend');
            self.refreshHistory(); Cv.requestRender();
          });
          li.appendChild(blendSel);
        }

        li.addEventListener('click', function () { Layers.active = l.id; self.refreshLayers(); self.syncSketchTarget(); });

        li.addEventListener('dragover', function (e) { e.preventDefault(); li.classList.add('drag-over'); });
        li.addEventListener('dragleave', function () { li.classList.remove('drag-over'); });
        li.addEventListener('drop', function (e) {
          e.preventDefault();
          li.classList.remove('drag-over');
          var src = e.dataTransfer.getData('text/plain');
          if (!src || src === l.id) return;
          var before = Layers.meta();
          Layers.move(Layers.indexOf(src), Layers.indexOf(l.id));
          History.pushMeta(before, Layers.meta(), 'reorder');
          self.refreshLayers(); self.refreshHistory(); Cv.requestRender();
        });

        ul.appendChild(li);
      });
    },

    /* ================= geçmiş ================= */
    /* ================= bölgeler paneli (siyasi bölgeler + harita ağacı) ================= */
    refreshRegionsPanel: function () {
      this.refreshTerritoryList();
      this.refreshMapTree();
    },

    /* Diplomasi paneli: devlet listelerini tazeler, seçili çiftin
       ilişkisini gösterir ve varsayılan olmayan (barış dışı) tüm
       ilişkileri listeler. Devlet silinmişse ona ait kayıtlar da
       burada temizlenir — tablo ölü id'lerle şişmesin. */
    refreshDiplomacy: function () {
      var body = $('diplo-body');
      if (!body) return;
      var self = this;
      Tools.pruneRelations();
      var Tv = Layers.get('territories');
      var states = (Tv ? Tv.objects : []).filter(function (o) { return o.kind === 'state' && o.name; });

      $('diplo-empty').hidden = states.length >= 2;
      body.hidden = states.length < 2;
      if (states.length < 2) return;

      ['diplo-a','diplo-b'].forEach(function (id, idx) {
        var sel = $(id), prev = sel.value;
        sel.innerHTML = '';
        states.forEach(function (st) {
          var op = document.createElement('option');
          op.value = st.id; op.textContent = st.name;
          sel.appendChild(op);
        });
        /* önceki seçim hâlâ geçerliyse koru, değilse A=ilk, B=ikinci */
        if (states.some(function (st) { return st.id === prev; })) sel.value = prev;
        else sel.value = states[Math.min(idx, states.length-1)].id;
      });

      var a = $('diplo-a').value, b = $('diplo-b').value;
      $('diplo-rel').value = (a && b && a !== b) ? Tools.getRelation(a, b) : 'peace';
      $('diplo-rel').disabled = (a === b);

      var byId = {};
      states.forEach(function (st) { byId[st.id] = st.name; });
      var ul = $('diplo-list');
      ul.innerHTML = '';
      Object.keys(App.diplomacy || {}).forEach(function (key) {
        var parts = key.split('|');
        if (!byId[parts[0]] || !byId[parts[1]]) return;
        var li = document.createElement('li');
        li.className = 'territory-item';
        var name = document.createElement('span');
        name.className = 'territory-name';
        name.textContent = byId[parts[0]] + ' ↔ ' + byId[parts[1]];
        var rel = document.createElement('span');
        rel.className = 'territory-gov';
        rel.textContent = self.t('rel_' + App.diplomacy[key]);
        li.appendChild(name); li.appendChild(rel);
        li.addEventListener('click', function () {
          $('diplo-a').value = parts[0]; $('diplo-b').value = parts[1];
          self.refreshDiplomacy();
        });
        ul.appendChild(li);
      });
    },

    refreshTerritoryList: function () {
      /* devlet listesi değiştiyse diplomasi seçicileri de değişmeli */
      if (this._inDiploRefresh !== true) { this._inDiploRefresh = true; this.refreshDiplomacy(); this._inDiploRefresh = false; }
      var ul = $('territory-list'), hint = $('territory-empty-hint');
      if (!ul) return;
      var self = this;
      var L = Layers.get('territories');
      var items = (L ? L.objects : []).filter(function (o) { return o.name && Cv.territoryVisibleInMode(o); });
      ul.innerHTML = '';
      if (hint) hint.style.display = items.length ? 'none' : '';
      items.forEach(function (o) {
        var li = document.createElement('li');
        li.className = 'territory-item';
        var sw = document.createElement('span');
        sw.className = 'territory-swatch';
        sw.style.background = o.color || '#8a5a3a';
        var name = document.createElement('span');
        name.className = 'territory-name';
        name.textContent = o.name;
        li.appendChild(sw); li.appendChild(name);
        if (o.kind === 'state' && o.government) {
          var gv = document.createElement('span');
          gv.className = 'territory-gov';
          gv.textContent = self.t('gov_' + o.government);
          li.appendChild(gv);
        }
        li.addEventListener('click', function () {
          self.setTool('territory');
          App.selection = { layerId:'territories', id:o.id };
          self.refreshSelection();
          if (o.pts && o.pts.length) {
            var cx = 0, cy = 0;
            o.pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
            Cv.centerOn(cx/o.pts.length, cy/o.pts.length);
          }
          Cv.requestRender();
        });
        ul.appendChild(li);
      });
    },

    /* Harita ağacını (App.buildMapTree) girintili, tıklanabilir bir listeye
       çizer. Aktif haritayı vurgular; tıklanan düğüme App.jumpToMap ile
       doğrudan atlar (ara adımlardan geçmeye gerek yok). */
    refreshMapTree: function () {
      var ul = $('maptree-list');
      if (!ul) return;
      var self = this;
      var tree = App.buildMapTree();
      ul.innerHTML = '';

      function render(node, depth) {
        var li = document.createElement('li');
        li.className = 'maptree-item' + (node.id === App.currentMapId ? ' cur' : '');
        li.style.paddingInlineStart = (7 + depth*16) + 'px';
        var ico = document.createElement('span');
        ico.className = 'maptree-ico';
        ico.textContent = depth === 0 ? '⌂' : '◈';
        var name = document.createElement('span');
        name.className = 'maptree-name';
        name.textContent = depth === 0 ? App.currentCanvasName : (node.label || self.t('rl_default'));
        li.appendChild(ico); li.appendChild(name);
        if (node.children.length) {
          var count = document.createElement('span');
          count.className = 'maptree-count';
          count.textContent = node.children.length;
          li.appendChild(count);
        }
        li.addEventListener('click', function () { App.jumpToMap(node.id); });
        ul.appendChild(li);
        node.children.forEach(function (c) { render(c, depth+1); });
      }
      render(tree, 0);
    },

    /* ================= yapılacaklar listesi ================= */
    /* Tarayıcı localStorage'ında tek bir JSON dizi olarak tutulur — kütüphane
       (Exporter.libList) ile aynı upsert/tam-yeniden-yaz deseni. Proje/harita
       başına değil, tüm oturum için tek liste (kasıtlı olarak global). */
    TODO_KEY: 'wayborne_todos',

    _loadTodos: function () {
      try { return JSON.parse(localStorage.getItem(this.TODO_KEY) || '[]'); }
      catch (e) { return []; }
    },
    _saveTodos: function (arr) {
      try { localStorage.setItem(this.TODO_KEY, JSON.stringify(arr)); } catch (e) {}
    },

    addTodo: function () {
      var input = $('todo-input');
      if (!input) return;
      var text = input.value.trim();
      if (!text) return;
      var todos = this._loadTodos();
      var id = 't' + Date.now().toString(36) + Math.floor(Math.random()*1e6).toString(36);
      todos.push({ id: id, text: text, done: false, createdAt: Date.now() });
      this._saveTodos(todos);
      input.value = '';
      this.refreshTodoList();
    },
    toggleTodo: function (id) {
      var todos = this._loadTodos();
      var t = todos.filter(function (o) { return o.id === id; })[0];
      if (!t) return;
      t.done = !t.done;
      this._saveTodos(todos);
      this.refreshTodoList();
    },
    deleteTodo: function (id) {
      var todos = this._loadTodos().filter(function (o) { return o.id !== id; });
      this._saveTodos(todos);
      this.refreshTodoList();
    },

    refreshTodoList: function () {
      var ul = $('todo-list'), hint = $('todo-empty-hint');
      if (!ul) return;
      var self = this;
      var todos = this._loadTodos();
      ul.innerHTML = '';
      if (hint) hint.style.display = todos.length ? 'none' : '';
      todos.forEach(function (o) {
        var li = document.createElement('li');
        li.className = 'todo-item' + (o.done ? ' done' : '');
        var chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'todo-check';
        chk.checked = !!o.done;
        chk.addEventListener('change', function () { self.toggleTodo(o.id); });
        var txt = document.createElement('span');
        txt.className = 'todo-text';
        txt.textContent = o.text;
        var del = document.createElement('button');
        del.className = 'todo-del';
        del.type = 'button';
        del.textContent = '×';
        del.addEventListener('click', function () { self.deleteTodo(o.id); });
        li.appendChild(chk); li.appendChild(txt); li.appendChild(del);
        ul.appendChild(li);
      });
    },

    refreshHistory: function () {
      var ul = $('history-list');
      if (!ul) return;
      ul.innerHTML = '';

      var li0 = document.createElement('li');
      li0.textContent = '· ' + this.t('histStart');
      li0.className = History.index === -1 ? 'cur' : '';
      li0.addEventListener('click', function () { History.goto(-1); });
      ul.appendChild(li0);

      History.stack.forEach(function (e, i) {
        var li = document.createElement('li');
        li.textContent = (i+1) + '. ' + e.label;
        li.className = i === History.index ? 'cur' : (i > History.index ? 'future' : '');
        li.addEventListener('click', function () { History.goto(i); });
        ul.appendChild(li);
      });

      if ($('btn-undo')) $('btn-undo').disabled = !History.canUndo();
      if ($('btn-redo')) $('btn-redo').disabled = !History.canRedo();
    },

    /* ================= yol/kement bitirme-iptal-geri al (klavye + dokunma) =================
       Enter/Escape/Delete tuşları ve #touch-path-actions'taki dokunma
       düğmeleri aynı bu üç fonksiyonu çağırır — davranış hiçbir zaman
       birbirinden sapmaz. */
    finishOrCommit: function () {
      if (Tools.floating) Tools.commitFloating(); else Tools.finishPath();
    },
    cancelOrDeselect: function () {
      /* başkent seçme modu açıkken Escape önce onu iptal eder — seçimi
         kaybetmeden, kullanıcı vazgeçtiğinde bölge seçili kalsın */
      if (Tools.capitalPick) { Tools.setCapitalPick(false); return; }
      if (Tools.floating) { Tools.cancelFloating(); return; }
      Tools.cancelPath(); App.selection = null; this.refreshSelection();
    },
    undoPointOrDelete: function () {
      if (Tools.floating) { Tools.deleteFloating(); return; }
      if (!Tools.undoPathPoint()) Tools.deleteSelection();
    },

    /* Yol çizimi (nehir/yol/bölge/göl/ölçüm) sürerken ya da bir kement
       kaldırması (Tools.floating) aktifken dokunmatik/klavyesiz kullanıcılar
       için yüzen bitir/iptal/geri-al düğmelerini göster. Tools.js'teki her
       ilgili durum değişikliğinden (nokta ekleme, yolu bitirme/iptal, kement
       kaldırma/onaylama/iptal/silme) çağrılır. */
    refreshTouchActions: function () {
      var bar = $('touch-path-actions');
      if (!bar) return;
      var show = !!Tools.floating || (Tools.pathPts && Tools.pathPts.length > 0);
      bar.classList.toggle('hidden', !show);
    },

    /* ================= seçim paneli ================= */
    /* Devlet editörünü seçili bölgeye göre senkronlar. refreshSelection'ın
       EN BAŞINDA çağrılır, çünkü o fonksiyonun ölçek/çoklu-seçim/boş-seçim
       için erken çıkışları var — editörün her durumda (özellikle "seçim
       yok" durumunda) doğru duruma gelmesi gerekiyor. */
    refreshTerritoryEditor: function () {
      var body = $('tt-edit-body');
      if (!body) return;
      var o = (App.selection && !App.selection.multi && App.selection.layerId === 'territories')
              ? Tools.selected() : null;

      $('tt-edit-empty').hidden = !!o;
      body.hidden = !o;
      /* Şehir üretimi de seçili bir bölgenin sınırlarına ihtiyaç duyar —
         aynı seçim durumuna bağlı. */
      if ($('city-body')) {
        $('city-body').hidden = !o;
        $('city-need-sel').hidden = !!o;
      }
      if (!o) { if (Tools.capitalPick) Tools.setCapitalPick(false); return; }

      /* Ad kutusu: seçilen bölgenin kendi adını göstermeli. (Bu daha önce
         hiç senkronlanmıyordu; B bölgesi seçilince kutuda A'nın adı
         kalıyor, oraya yazmak B'yi yeniden adlandırıyordu.) */
      $('tt-name').value = o.name || '';

      /* Sesli okuma yalnızca tarayıcı destekliyorsa ve okunacak bir ad
         varsa görünür — çalışmayacak bir düğme göstermenin anlamı yok. */
      var speakBtn = $('btn-tt-speak');
      if (speakBtn) speakBtn.hidden = !this.ttsAvailable() || !o.name;

      if ($('tt-zone')) $('tt-zone').value = o.zoneType || '';

      var isState = o.kind === 'state';
      var isCulture = o.kind === 'culture';
      $('tt-state-fields').hidden = !isState;
      /* Dönüştürme yalnızca elle çizilmiş (kind'siz) bölgeler için —
         bir kültür bölgesini devlete çevirmek onu kültür görünümünden
         sessizce silerdi, bu yüzden düğme orada gösterilmiyor. */
      $('btn-tt-makestate').hidden = isState || isCulture;
      $('tt-edit-hint').hidden = isCulture;

      if (isState) {
        $('tt-gov').value = o.government || 'kingdom';
        var cap = o.capital;
        $('v-tt-capital').textContent = cap
          ? Math.round(cap.x) + ', ' + Math.round(cap.y)
          : '—';
        $('btn-tt-capital').classList.toggle('active', !!Tools.capitalPick);
        $('btn-tt-capital').textContent = Tools.capitalPick
          ? this.t('o_stcapital_cancel') : this.t('o_stcapital_pick');
        this.refreshEmblemPreview(o);
      }
    },

    /* Panel önizlemesi haritayla aynı Emblem.draw yolunu kullanır —
       önizlemenin haritadan farklı görünmesi mümkün olmasın. */
    refreshEmblemPreview: function (o) {
      var c = $('tt-emblem-prev');
      if (!c) return;
      var cx = c.getContext('2d');
      cx.clearRect(0, 0, c.width, c.height);
      var has = !!(o && o.emblem) && typeof Emblem !== 'undefined';
      if (has) Emblem.draw(cx, o.emblem, c.width/2, c.height/2, c.width * 0.9);
      $('btn-tt-emblem-png').disabled = !has;
      $('btn-tt-emblem-clear').disabled = !has;
      $('btn-tt-emblem').textContent = this.t(has ? 'o_stemblem_reroll' : 'o_stemblem_gen');
    },

    refreshSelection: function () {
      this.refreshTerritoryEditor();
      this.refreshNoteBox();
      var box = $('sel-info');
      if (!box) return;

      /* z-order butonlarını güster/gizle */
      var isMulti = App.selection && App.selection.multi;
      var isSingle = App.selection && !App.selection.multi && App.selection.layerId !== 'scale';
      var isGroup = isSingle && Tools.selected() && Tools.selected().kind === 'group';
      if ($('btn-front')) $('btn-front').style.display = isSingle ? '' : 'none';
      if ($('btn-back'))  $('btn-back').style.display  = isSingle ? '' : 'none';
      if ($('btn-fwd'))   $('btn-fwd').style.display   = isSingle ? '' : 'none';
      if ($('btn-bwd'))   $('btn-bwd').style.display   = isSingle ? '' : 'none';
      if ($('btn-group'))   $('btn-group').style.display   = isMulti ? '' : 'none';
      if ($('btn-ungroup')) $('btn-ungroup').style.display = isGroup ? '' : 'none';

      if (App.selection && App.selection.layerId === 'scale') {
        box.textContent = this.t('selScale');
        if ($('btn-rl-open')) $('btn-rl-open').style.display = 'none';
        Cv.requestRender();
        return;
      }

      /* multi seçim */
      if (App.selection && App.selection.multi) {
        box.textContent = App.selection.ids.length + ' ' + this.t('selMulti');
        if ($('btn-rl-open')) $('btn-rl-open').style.display = 'none';
        Cv.requestRender();
        return;
      }

      var o = Tools.selected();
      if (!o) {
        box.textContent = this.t('selNone');
        if ($('btn-rl-open')) $('btn-rl-open').style.display = 'none';
        Cv.requestRender(); return;
      }

      var kind = App.selection.layerId, desc = kind;
      if (kind === 'symbols' && o.kind === 'group') desc += ' · ' + o.members.length + ' ' + this.t('symbols');
      else if (kind === 'symbols') desc += ' · ' + o.sym + ' · ' + Math.round(o.size) + 'px';
      else if (kind === 'labels') desc += ' · "' + (o.text||'').slice(0,18) + '"';
      else if (kind === 'links') desc += ' · "' + (o.name||'').slice(0,18) + '"';
      else if (kind === 'resources') desc += ' · ' + this.t('rs_'+o.type);
      else if (kind === 'measures') { var mi = Cv.measureLength(o); desc += ' · ' + Cv.formatDistance(mi.real, mi.unit); }
      else desc += ' · ' + o.pts.length + ' pt';
      box.textContent = desc;

      var openBtn = $('btn-rl-open');
      if (openBtn) {
        openBtn.style.display = kind === 'links' ? '' : 'none';
        if (kind === 'links') openBtn.onclick = function () { App.enterMap(o.targetMapId, o.name); };
      }

      if (kind === 'symbols' && o.kind !== 'group') {
        $('sy-size').value = o.size;  $('v-sy-size').textContent = Math.round(o.size);
        $('sy-rot').value = o.rot;    $('v-sy-rot').textContent = Math.round(o.rot)+'°';
        $('sy-hue').value = o.hue;    $('v-sy-hue').textContent = Math.round(o.hue)+'°';
        $('sy-op').value = Math.round(o.opacity*100);
        $('v-sy-op').textContent = o.opacity.toFixed(2);
        $('sy-wear').value = Math.round((o.wear||0)*100);
        $('v-sy-wear').textContent = (o.wear||0).toFixed(2);
      } else if (kind === 'labels') {
        $('lb-text').value = o.text;
        if (o.preset && LABEL_PRESETS[o.preset]) $('lb-preset').value = o.preset;
        $('lb-size').value = o.size;    $('v-lb-size').textContent = o.size;
        $('lb-curve').value = o.curve;  $('v-lb-curve').textContent = o.curve;
        $('lb-track').value = o.track;  $('v-lb-track').textContent = o.track;
        $('lb-rot').value = o.rot;      $('v-lb-rot').textContent = o.rot+'°';
        $('lb-color').value = o.color;
        this.syncLabelType(o);
      } else if (kind === 'rivers' && o.kind === 'lake') {
        $('lk-color').value = o.color;
      } else if (kind === 'rivers') {
        $('rv-w').value = o.width;  $('v-rv-w').textContent = o.width;
        $('rv-m').value = Math.round(o.meander*100);
        $('v-rv-m').textContent = o.meander.toFixed(2);
      } else if (kind === 'roads') {
        $('rd-w').value = o.width;  $('v-rd-w').textContent = o.width;
        $('rd-style').value = o.style;
      } else if (kind === 'territories') {
        $('tt-color').value = o.color;
        $('tt-op').value = Math.round((o.opacity===undefined?0.30:o.opacity)*100);
        $('v-tt-op').textContent = (o.opacity===undefined?0.30:o.opacity).toFixed(2);
        $('tt-bcolor').value = o.borderColor;
        $('tt-bw').value = o.borderWidth; $('v-tt-bw').textContent = o.borderWidth;
      }
      Cv.requestRender();
    },

    refreshScalePanel: function () {
      if (!$('sc-len')) return;
      $('sc-visible').checked = App.scale.visible;
      $('sc-label').value = App.scale.label;
      $('sc-len').value = App.scale.len;   $('v-sc-len').textContent = Math.round(App.scale.len);
      $('sc-size').value = App.scale.size; $('v-sc-size').textContent = App.scale.size;
      $('sc-segs').value = App.scale.segs; $('v-sc-segs').textContent = App.scale.segs;
    },

    refreshEyedropPanel: function () {
      var el = $('eyedrop-status');
      if (!el) return;
      var s = Eyedropper.sample;
      if (!s) {
        el.textContent = this.t('o_eye_nosample');
        el.style.color = '';
        if ($('btn-eye-paint')) $('btn-eye-paint').disabled = true;
        return;
      }
      el.textContent = (App.eyedrop.painting ? '🖌 ' : '✓ ') +
                       'r=' + Math.round(s.radius) + ' · ' + s.edges.length + ' · ' + s.baseColor;
      el.style.color = App.eyedrop.painting ? '#6f8a52' : '#c08a3e';
      if ($('btn-eye-paint')) $('btn-eye-paint').disabled = false;
    },

    refreshAll: function () {
      this.refreshLayers();
      this.refreshHistory();
      this.refreshSelection();
      this.refreshScalePanel();
      this.refreshWindrosePanel();
      this.refreshEyedropPanel();
      this.renderCustomSymGrid();
      this.syncSketchTarget();
      this.refreshRegionsPanel();
      this.refreshTodoList();
      this.status();
    },

    refreshWindrosePanel: function () {
      if (!$('wr-size')) return;
      $('wr-visible').checked = App.windrose.visible;
      $('wr-size').value = App.windrose.size; $('v-wr-size').textContent = App.windrose.size;
      if ($('wr-style')) $('wr-style').value = App.windrose.style || 'classic';
      $('wr-color').value = App.windrose.color || '#3a2b18';
    },

    /* ================= durum çubuğu ================= */
    status: function () {
      var p = $('st-pos'), z = $('st-zoom'), s = $('st-size'), t = $('st-tool');
      if (p) p.textContent = Math.round(Cv.mouse.x) + ', ' + Math.round(Cv.mouse.y);
      if (z) z.textContent = Math.round(Cv.zoom*100) + '%';
      if (s) s.textContent = Cv.W + ' × ' + Cv.H;
      if (t) t.textContent = this.t('t_' + App.tool);
    },

    msg: function (text) {
      var el = $('st-msg');
      if (!el) return;
      el.textContent = text;
      clearTimeout(this.msgTimer);
      this.msgTimer = setTimeout(function () { el.textContent = ''; }, 3600);
    },

    /* ================= kullanıcı katmanları ================= */

    addLayer: function () {
      if (Layers.customCount() >= Layers.CUSTOM_MAX) {
        this.msg(this.t('layer_max'));
        return;
      }
      var n = Layers.customCount() + 1;
      var l = Layers.addCustom(this.t('layer_untitled') + ' ' + n, Cv.W, Cv.H);
      if (!l) return;
      Layers.active = l.id;
      History.pushLayerAdd(Layers.snapshotLayer(l), 'layer:add');
      this.refreshLayers();
      this.refreshHistory();
      this.syncSketchTarget();
      this.setTool('sketch');
      this.msg(this.t('layer_added') + ' · ' + l.name);
    },

    /* Çizim panelinde hangi katmana yazılacağını gösterir; kullanıcı
       katmanı seçili değilse aracın neden bir şey yapmadığı görünür olsun. */
    syncSketchTarget: function () {
      var box = $('sk-target');
      if (!box) return;
      var l = Layers.get(Layers.active);
      if (l && l.custom) {
        box.className = 'sk-target ok';
        box.textContent = this.t('sketch_target') + ': ' + Layers.name(l, this.lang);
      } else {
        box.className = 'sk-target warn';
        box.textContent = this.t('sketch_need_layer');
      }
    },

    /* ================= paylaş / baskı ================= */

    /* Tek dosya HTML: boyut ve biçim seçimi. Kayıpsız PNG keskin ama
       büyük; JPEG paylaşılabilir boyutta kalır. */
    htmlExportDialog: function () {
      var self = this;
      var name = App.currentCanvasName || this.t('canvas_unnamed');
      var body =
        '<label class="row"><span>' + esc(this.t('exp_maxdim')) + '</span></label>' +
        '<select id="hx-dim" class="sel">' +
          '<option value="1280">1280 px</option>' +
          '<option value="2048" selected>2048 px</option>' +
          '<option value="3072">3072 px</option>' +
          '<option value="4096">4096 px</option>' +
        '</select>' +
        '<label class="row"><span>' + esc(this.t('exp_format')) + '</span></label>' +
        '<select id="hx-fmt" class="sel">' +
          '<option value="png">' + esc(this.t('exp_fmt_png')) + '</option>' +
          '<option value="jpeg">' + esc(this.t('exp_fmt_jpeg')) + '</option>' +
        '</select>' +
        '<label class="row"><span>' + esc(this.t('exp_title')) + '</span></label>' +
        '<input type="text" id="hx-title" class="sel" value="' + esc(name) + '">' +
        '<p class="hint">' + esc(this.t('exp_html_help')) + '</p>';

      this.modal(this.t('exp_html_t'), body, function () {
        Exporter.html({
          maxDim: parseInt($('hx-dim').value, 10) || 2048,
          format: $('hx-fmt').value,
          title: $('hx-title').value
        });
      });
    },

    /* Baskı: sayfa boyu, yön, kenar boşluğu, DPI. Çıktıyı tarayıcının
       baskı iletişimine veriyoruz — "PDF olarak kaydet" gerçek PDF üretir. */
    printDialog: function () {
      var self = this;
      var pages = [['a4','A4'], ['a3','A3'], ['a5','A5'], ['letter','Letter'], ['tabloid','Tabloid']];
      var landscape = Cv.W >= Cv.H;
      var body =
        '<label class="row"><span>' + esc(this.t('exp_page')) + '</span></label>' +
        '<select id="pr-page" class="sel">' +
          pages.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') +
        '</select>' +
        '<label class="row"><span>' + esc(this.t('exp_orient')) + '</span></label>' +
        '<select id="pr-orient" class="sel">' +
          '<option value="portrait"' + (landscape ? '' : ' selected') + '>' + esc(this.t('exp_portrait')) + '</option>' +
          '<option value="landscape"' + (landscape ? ' selected' : '') + '>' + esc(this.t('exp_landscape')) + '</option>' +
        '</select>' +
        '<label class="row"><span>' + esc(this.t('exp_margin')) + '</span></label>' +
        '<select id="pr-margin" class="sel">' +
          '<option value="0">0 mm</option><option value="5">5 mm</option>' +
          '<option value="10" selected>10 mm</option><option value="20">20 mm</option>' +
        '</select>' +
        '<label class="row"><span>' + esc(this.t('exp_dpi')) + '</span></label>' +
        '<select id="pr-dpi" class="sel">' +
          '<option value="96">96 · ' + esc(this.t('exp_dpi_screen')) + '</option>' +
          '<option value="150" selected>150 · ' + esc(this.t('exp_dpi_normal')) + '</option>' +
          '<option value="300">300 · ' + esc(this.t('exp_dpi_high')) + '</option>' +
        '</select>' +
        '<p class="hint">' + esc(this.t('exp_print_help')) + '</p>';

      this.modal(this.t('exp_print_t'), body, function () {
        Exporter.print({
          page: $('pr-page').value,
          orient: $('pr-orient').value,
          margin: parseFloat($('pr-margin').value),
          dpi: parseInt($('pr-dpi').value, 10),
          title: App.currentCanvasName
        });
      });
    },

    /* ================= modal ================= */
    /* ================= referans taraması ilerleme bindirmesi =================
       modal() bu iş için uygun değil: statik gövde + tek OK/Cancel akışı.
       Burada canlı güncellenen, aşamasını yazan ve iptal edilebilen uzun
       soluklu bir işlem var — bu yüzden ayrı bir bindirme. */
    _scanToken: null,

    showScanProgress: function (token) {
      this._scanToken = token;
      var el = $('scan-progress');
      if (!el) return;
      $('scan-progress-fill').style.width = '0%';
      $('scan-progress-stage').textContent = '';
      el.classList.remove('hidden');
    },

    updateScanProgress: function (stageIndex, stageCount, stageKey, fraction) {
      var fill = $('scan-progress-fill'), stage = $('scan-progress-stage');
      if (!fill || !stage) return;
      var f = Math.max(0, Math.min(1, fraction || 0));
      var pct = Math.max(0, Math.min(100, Math.round(((stageIndex + f) / stageCount) * 100)));
      fill.style.width = pct + '%';
      /* textContent + iki ayrı span: aşama adı sola, yüzde sağa yaslanır
         (bkz. .scan-stage). innerHTML yerine düğüm kurmak, çeviri
         metinlerinin içindeki olası < > karakterlerini de güvene alır. */
      stage.textContent = '';
      var label = document.createElement('span');
      label.textContent = this.t(stageKey);
      var num = document.createElement('span');
      num.className = 'scan-pct';
      num.textContent = (this.lang === 'tr') ? ('%' + pct) : (pct + '%');
      stage.appendChild(label);
      stage.appendChild(num);
    },

    hideScanProgress: function () {
      this._scanToken = null;
      var el = $('scan-progress');
      if (el) el.classList.add('hidden');
    },

    modal: function (title, bodyHTML, onOk) {
      $('modal-title').textContent = title;
      var body = $('modal-body');
      body.innerHTML = bodyHTML;
      body.classList.remove('shortcuts-body');
      var box = document.querySelector('.modal-box');
      if (box) box.classList.remove('wide');
      var m = $('modal');
      m.classList.remove('hidden');
      function close() {
        m.classList.add('hidden');
        $('modal-ok').removeEventListener('click', ok);
        $('modal-cancel').removeEventListener('click', close);
      }
      function ok() { if (onOk) onOk(); close(); }
      $('modal-ok').addEventListener('click', ok);
      $('modal-cancel').addEventListener('click', close);
    },

    /* '?' ile açılan hızlı başvuru — Rehber sayfasının aksine kısa, aranmadan
       tüm kısayolları tek ekranda gösterir. Araç kısayolları TUTORIAL_GROUPS'tan
       (Rehber'le aynı kaynak, iki liste asla birbirinden sapmaz), komut
       kısayolları SHORTCUT_GENERAL'dan gelir. */
    showShortcuts: function () {
      var self = this;
      var html = '<div class="shortcuts-cols">';
      TUTORIAL_GROUPS.forEach(function (grp) {
        html += '<div class="shortcuts-group"><div class="shortcuts-group-label">' + self.t(grp.label) + '</div>';
        grp.tools.forEach(function (tl) {
          html += '<div class="shortcuts-row"><span class="shortcuts-name">' + self.t('t_' + tl.id) +
                  '</span><span class="shortcuts-key">' + tl.key + '</span></div>';
        });
        html += '</div>';
      });
      html += '<div class="shortcuts-group"><div class="shortcuts-group-label">' + self.t('sc_general') + '</div>';
      SHORTCUT_GENERAL.forEach(function (sc) {
        html += '<div class="shortcuts-row"><span class="shortcuts-name">' + self.t(sc.label) +
                '</span><span class="shortcuts-key">' + sc.key + '</span></div>';
      });
      html += '</div></div>';

      this.modal(this.t('sc_title'), html);
      $('modal-body').classList.add('shortcuts-body');
      var box = document.querySelector('.modal-box');
      if (box) box.classList.add('wide');
    },

    /* ================= klavye ================= */
    bindKeys: function () {
      var self = this;
      var map = { v:'select', b:'landmass', e:'erase', t:'terrain', s:'symbol',
                  r:'river', d:'road', l:'label', h:'pan', i:'eyedrop', k:'lake', g:'territory',
                  u:'elevation', m:'regionlink', y:'resource', f:'fill', q:'measure', x:'lasso',
                  n:'sketch' };

      window.addEventListener('keydown', function (ev) {
        var tag = (ev.target.tagName || '').toLowerCase();
        var typing = tag === 'input' || tag === 'textarea' || tag === 'select';

        if (ev.code === 'Space' && !typing) {
          Tools.spaceDown = true;
          Cv.view.classList.add('pan');
          ev.preventDefault();
          return;
        }

        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
          ev.preventDefault();
          if (ev.shiftKey) History.redo(); else History.undo();
          return;
        }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'y') { ev.preventDefault(); History.redo(); return; }
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); Exporter.saveProject(); return; }
        if (typing) return;

        /* yön tuşları ile kaydırma */
        var step = ev.shiftKey ? 220 : 70;
        if (ev.key === 'ArrowLeft')  { ev.preventDefault(); Cv.panBy( step, 0); return; }
        if (ev.key === 'ArrowRight') { ev.preventDefault(); Cv.panBy(-step, 0); return; }
        if (ev.key === 'ArrowUp')    { ev.preventDefault(); Cv.panBy(0,  step); return; }
        if (ev.key === 'ArrowDown')  { ev.preventDefault(); Cv.panBy(0, -step); return; }

        if (ev.key === 'Enter') { self.finishOrCommit(); return; }
        if (ev.key === 'Escape') { self.cancelOrDeselect(); return; }
        if (ev.key === 'Delete' || ev.key === 'Backspace') { self.undoPointOrDelete(); return; }
        if (ev.key === '+' || ev.key === '=') { Cv.setZoom(Cv.zoom*1.15); return; }
        if (ev.key === '-') { Cv.setZoom(Cv.zoom/1.15); return; }
        if (ev.key === '0') { Cv.fit(); return; }
        /* sembol döndürme */
        if (ev.key === '[') {
          App.symbol.rot = (App.symbol.rot - 15 + 360) % 360;
          if ($('sy-rot')) { $('sy-rot').value = App.symbol.rot; $('v-sy-rot').textContent = Math.round(App.symbol.rot) + '°'; }
          if (self.selIs('symbols')) Tools.applyToSelection({ rot: App.symbol.rot });
          Cv.requestRender(); return;
        }
        if (ev.key === ']') {
          App.symbol.rot = (App.symbol.rot + 15) % 360;
          if ($('sy-rot')) { $('sy-rot').value = App.symbol.rot; $('v-sy-rot').textContent = Math.round(App.symbol.rot) + '°'; }
          if (self.selIs('symbols')) Tools.applyToSelection({ rot: App.symbol.rot });
          Cv.requestRender(); return;
        }
        if (ev.key === '?') { self.showShortcuts(); return; }
        if (map[ev.key.toLowerCase()]) self.setTool(map[ev.key.toLowerCase()]);
      });

      window.addEventListener('keyup', function (ev) {
        if (ev.code === 'Space') {
          Tools.spaceDown = false;
          if (App.tool !== 'pan') Cv.view.classList.remove('pan');
        }
      });
    }
  };

  global.UI = UI;
})(window);
