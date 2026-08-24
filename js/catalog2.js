/* ============================================================
   Medieval Map Editor — catalog2.js
   Ek izometrik yapılar + sistematik varyant üretimi.
   catalog.js'ten sonra yüklenir, aynı ITEMS tablosuna yazar.
   ============================================================ */
(function (global) {
  'use strict';

  var ITEMS = global.IsoCatalog.ITEMS;
  function S() { return new Iso.Scene(); }
  function reg(cat, id, tr, en, make) {
    (ITEMS[cat] = ITEMS[cat] || []).push({ id:id, tr:tr, en:en, make:make });
  }

  /* ---- ortak yardımcılar ---- */
  function hut(s, x, y, w, dp, h, mat, roof, o) {
    o = o || {};
    s.box(x, y, o.z || 0, w, dp, h, mat, { door:o.door !== false, win:o.win || 0 });
    var ov = Math.min(w, dp) * 0.13;
    s.gable(x - ov, y - ov, (o.z || 0) + h, w + ov * 2, dp + ov * 2, o.rh || h * 0.82, roof);
    return s;
  }
  function towerSq(s, x, y, z, w, h, mat, o) {
    o = o || {};
    s.box(x, y, z, w, w, h, mat, { slit:o.slit === undefined ? 2 : o.slit });
    if (o.crenel !== false) s.crenel(x - w * 0.06, y - w * 0.06, z + h, w * 1.12, w * 1.12, w * 0.19, w * 0.26, mat);
    if (o.roof) s.cone(x + w / 2, y + w / 2, z + h + (o.crenel === false ? 0 : w * 0.26), w * 0.72, h * 0.48, o.roof);
    if (o.flag) s.flag(x + w / 2, y + w / 2, z + h + w * 0.3, h * 0.42, o.flag);
    return s;
  }
  function towerRd(s, x, y, z, r, h, mat, o) {
    o = o || {};
    s.cyl(x, y, z, r, h, mat, { slit:o.slit === undefined ? 2 : o.slit });
    if (o.crenel) s.crenel(x - r, y - r, z + h, r * 2, r * 2, r * 0.34, r * 0.42, mat);
    if (o.roof !== false) s.cone(x, y, z + h + (o.crenel ? r * 0.42 : 0), r * 1.16, h * 0.55, o.roof || 'tileR');
    if (o.flag) s.flag(x, y, z + h + h * 0.55, h * 0.4, o.flag);
    return s;
  }
  function wall(s, x, y, z, w, dp, h, mat, o) {
    o = o || {};
    s.box(x, y, z, w, dp, h, mat, { slit:o.slit || 0 });
    s.crenel(x, y, z + h, w, dp, Math.max(1.6, h * 0.24), h * 0.30, mat);
    return s;
  }
  function tent(s, x, y, r, h, mat) { s.cone(x, y, 0, r, h, mat, { pole:true, flap:true }); return s; }

  /* ============================================================
     1) KULE VARYANTLARI  (malzeme × biçim × çatı)
     ============================================================ */
  var TOWER_MAT = [
    ['stone',  'Taş',     'Stone'],
    ['stoneW', 'Ak taş',  'White stone'],
    ['granite','Granit',  'Granite'],
    ['basalt', 'Bazalt',  'Basalt'],
    ['wood',   'Ahşap',   'Timber'],
    ['stoneD', 'Kara taş','Dark stone'],
    ['ruin',   'Yıkık',   'Ruined'],
    ['snow',   'Karlı',   'Snowy'],
    ['mossy',    'Yosunlu',  'Mossy'],
    ['scorched', 'Yanık',    'Scorched'],
    ['clayR',    'Kilden',   'Terracotta'],
    ['adobeW',   'Kerpiç',   'Adobe']
  ];
  var TOWER_ROOF = [
    [null,    'mazgallı', 'crenelled'],
    ['tileR', 'kızıl çatı','red roof'],
    ['tileB', 'mavi çatı', 'blue roof'],
    ['tileG', 'yeşil çatı','green roof'],
    ['thatch','saz çatı',  'thatch roof']
  ];
  TOWER_MAT.forEach(function (m, mi) {
    TOWER_ROOF.forEach(function (r, ri) {
      reg('castles', 'itw_sq_' + mi + '_' + ri,
        'Kare kule · ' + m[1] + ' ' + r[1],
        'Square tower · ' + m[2] + ' ' + r[2],
        function () {
          var s = S(); s.pad(13, 12, 22, 'dirt');
          towerSq(s, 4, 4, 0, 17, 30, m[0], { roof:r[0], slit:2 });
          return s;
        });
      reg('castles', 'itw_rd_' + mi + '_' + ri,
        'Yuvarlak kule · ' + m[1] + ' ' + r[1],
        'Round tower · ' + m[2] + ' ' + r[2],
        function () {
          var s = S(); s.pad(13, 12, 22, 'dirt');
          towerRd(s, 12, 11, 0, 9, 30, m[0], { roof:r[0] || false, crenel:!r[0], slit:2 });
          return s;
        });
    });
  });

  /* ============================================================
     1b) PAGODA KULE VARYANTLARI (kültürel çeşitlilik — Doğu Asya
     mimarisi; çok katlı, kavisli saçaklı çatı ailesi)
     ============================================================ */
  var PAGODA_WALL = [
    ['wood',    'Ahşap',      'Timber'],
    ['woodD',   'Kara ahşap', 'Dark timber'],
    ['bambooW', 'Bambu',      'Bamboo'],
    ['stoneW',  'Ak taş',     'White stone']
  ];
  var PAGODA_ROOF = [
    ['tileB',    'Mavi',      'Blue'],
    ['tileR',    'Kızıl',     'Crimson'],
    ['lacquerR', 'Laka kızıl','Lacquer red'],
    ['tileD',    'Arduvaz',   'Slate'],
    ['gold',     'Altın',     'Gilded']
  ];
  PAGODA_WALL.forEach(function (w, wi) {
    PAGODA_ROOF.forEach(function (r, ri) {
      reg('temples', 'ipg_' + wi + '_' + ri,
        'Pagoda kulesi · ' + w[1] + ' ' + r[1],
        'Pagoda tower · ' + w[2] + ' ' + r[2],
        function () {
          var s = S(), z = 0, wsz = 22;
          for (var i = 0; i < 3; i++) {
            s.box(15 - wsz/2, 15 - wsz/2, z, wsz, wsz, 9, w[0], { win: i === 0 ? 2 : 1, door: i === 0 });
            s.pagoda(15 - (wsz+6)/2, 15 - (wsz+6)/2, z + 9, wsz + 6, wsz + 6, 7, r[0], 1);
            z += 16; wsz -= 4;
          }
          s.cyl(15, 15, z, 1.2, 7, 'gold');
          return s;
        });
    });
  });

  /* ============================================================
     2) EV VARYANTLARI  (duvar × çatı → zenginlik katmanı × kültürel
     bölge olarak ETİKETLENİR). 54 kombinasyon zaten mevcuttu — yeni
     geometri EKLENMEDİ, sadece "1.Yoksul / Batı Avrupa" gibi okunabilir
     bir isimlendirme katmanı bindirildi (bkz. sembol envanteri notu:
     sorun eksik sembol değil, gruplama/etiketleme boşluğuydu).
     ============================================================ */
  var TIER_NAMES = [
    null,
    ['Yoksul', 'Poor'],
    ['Sıradan', 'Common'],
    ['Müreffeh', 'Comfortable'],
    ['Zengin', 'Wealthy'],
    ['Soylu', 'Noble']
  ];
  var HOUSE_WALL = [
    /* [mat, tr, en, temel katman(1-5), kültürel bölge tr, kültürel bölge en] */
    ['wood',      'Ahşap',      'Timber',        2, 'Batı Avrupa',        'Western'],
    ['stone',     'Taş',        'Stone',         3, 'Batı Avrupa',        'Western'],
    ['stoneW',    'Ak taş',     'Whitewashed',   4, 'Batı Avrupa',        'Western'],
    ['dirt',      'Kerpiç',     'Adobe',         1, 'Akdeniz / D.Doğu',   'Mediterranean'],
    ['woodD',     'Kara ahşap', 'Dark timber',   2, 'Kuzey',              'Northern'],
    ['mossy',     'Yosunlu',    'Mossy',         1, 'Kuzey',              'Northern'],
    ['weathered', 'Yıpranmış',  'Weathered',     1, 'Batı Avrupa',        'Western'],
    ['bambooW',   'Bambu',      'Bamboo',        3, 'Doğu Asya',          'East Asian'],
    ['adobeW',    'Ak kerpiç',  'White adobe',   4, 'Akdeniz / D.Doğu',   'Mediterranean']
  ];
  var HOUSE_ROOF = [
    /* [mat, tr, en, katman düzeltmesi] */
    ['thatch','saz',    'thatch', -1],
    ['tileR', 'kiremit', 'tiled',   0],
    ['tileB', 'mavi',    'blue',   +1],
    ['tileG', 'yeşil',   'green',  +1],
    ['snow',  'karlı',   'snowy',   0],
    ['tileD', 'arduvaz', 'slate',  +1]
  ];
  HOUSE_WALL.forEach(function (w, wi) {
    HOUSE_ROOF.forEach(function (r, ri) {
      var tier = Math.max(1, Math.min(5, w[3] + r[3]));
      var tn = TIER_NAMES[tier];
      reg('villages', 'ivh_' + wi + '_' + ri,
        'Ev · ' + tier + '.' + tn[0] + ' · ' + w[4] + ' (' + w[1] + ' / ' + r[1] + ')',
        'House · ' + tier + '.' + tn[1] + ' · ' + w[5] + ' (' + w[2] + ' / ' + r[2] + ')',
        function () {
          var s = S(); s.pad(16, 14, 26, 'grass');
          hut(s, 4, 4, 24, 18, 14, w[0], r[0], { win:2 });
          return s;
        });
    });
  });

  /* ============================================================
     3) SUR / ÇİT PARÇALARI
     WALL_MATS burada tanımlanıp §9c'deki T-kavşağı/kuleli-köşe
     bloğuyla da PAYLAŞILIYOR — aynı indeks aynı malzemeye karşılık
     gelsin diye (ör. iwl_straight_5 ile iwl_tjunc_5 aynı malzeme).
     Kalın ahşap tomruk sur (kültürel: Kuzey/frontier) ve kerpiç sur
     (kültürel: Akdeniz/Orta Doğu) eklendi — önceki 5 taş türüne ek.
     ============================================================ */
  var WALL_MATS = [
    ['stone','Taş','Stone'],['stoneW','Ak taş','White'],['granite','Granit','Granite'],
    ['basalt','Bazalt','Basalt'],['stoneD','Kara taş','Dark'],
    ['woodD','Tomruk','Log'],['adobeW','Kerpiç','Adobe']
  ];
  WALL_MATS.forEach(function (m, i) {
    reg('castles', 'iwl_straight_' + i, 'Sur · ' + m[1], 'Wall · ' + m[2], function () {
      var s = S(); s.pad(24, 12, 42, 'dirt');
      wall(s, 0, 6, 0, 48, 12, 16, m[0], { slit:3 });
      return s;
    });
    reg('castles', 'iwl_corner_' + i, 'Sur köşesi · ' + m[1], 'Wall corner · ' + m[2], function () {
      var s = S(); s.pad(20, 18, 34, 'dirt');
      wall(s, 0, 26, 0, 40, 12, 16, m[0]);
      wall(s, 28, 0, 0, 12, 28, 16, m[0]);
      return s;
    });
    reg('castles', 'iwl_gate_' + i, 'Sur kapısı · ' + m[1], 'Wall gate · ' + m[2], function () {
      var s = S(); s.pad(24, 14, 42, 'dirt');
      wall(s, 0, 6, 0, 16, 12, 16, m[0]);
      wall(s, 32, 6, 0, 16, 12, 16, m[0]);
      s.box(14, 3, 0, 20, 18, 22, m[0], { door:true, doorH:0.66, slit:2 });
      s.crenel(12, 1, 22, 24, 22, 5, 7, m[0]);
      return s;
    });
  });

  var PALISADE_MATS = [
    ['woodD',   'Koyu',    'Dark'],
    ['wood',    'Açık',    'Light'],
    ['bambooW', 'Bambu',   'Bamboo'],
    ['mossy',   'Yosunlu', 'Mossy']
  ];
  PALISADE_MATS.forEach(function (mm, i) {
    var m = mm[0];
    reg('castles', 'ipl_straight_' + i, 'Kazık çit · ' + mm[1], 'Palisade · ' + mm[2], function () {
      var s = S(); s.pad(24, 10, 42, 'dirt');
      s.palisade(0, 6, 0, 48, 6, 16, m, { corner:false });
      return s;
    });
    reg('castles', 'ipl_gate_' + i, 'Kazık kapı · ' + mm[1], 'Palisade gate · ' + mm[2], function () {
      var s = S(); s.pad(24, 12, 42, 'dirt');
      s.palisade(0, 6, 0, 16, 6, 16, m, { corner:false });
      s.palisade(32, 6, 0, 16, 6, 16, m, { corner:false });
      s.box(14, 4, 0, 6, 6, 22, m === 'wood' ? 'woodD' : m);
      s.box(28, 4, 0, 6, 6, 22, m === 'wood' ? 'woodD' : m);
      s.box(14, 4, 22, 20, 6, 4, m === 'wood' ? 'woodD' : m, { plain:true });
      return s;
    });
  });

  /* ============================================================
     4) ÇADIR / GÖÇEBE VARYANTLARI
     ============================================================ */
  [['canvasT','Bez','Canvas'],['hide','Deri','Hide'],['tileR','Kızıl','Crimson'],
   ['tileB','Mavi','Blue'],['snow','Ak','White']].forEach(function (m, i) {
    reg('nomads', 'int_' + i, 'Çadır · ' + m[1], 'Tent · ' + m[2], function () {
      var s = S(); s.pad(12, 11, 20, 'dirt'); tent(s, 11, 10, 11, 16, m[0]); return s;
    });
    reg('nomads', 'iny_' + i, 'Yurt · ' + m[1], 'Yurt · ' + m[2], function () {
      var s = S(); s.pad(13, 12, 22, 'grass');
      s.cyl(12, 11, 0, 11, 10, m[0]);
      s.dome(12, 11, 10, 11.2, 7, m[0]);
      return s;
    });
  });

  reg('nomads', 'in_warcamp', 'Savaş kampı', 'War camp', function () {
    var s = S(); s.pad(28, 26, 50, 'dirt');
    s.palisade(0, 0, 0, 54, 48, 12, 'woodD');
    tent(s, 14, 14, 8, 12, 'tileR');
    tent(s, 36, 16, 7, 11, 'canvasT');
    tent(s, 22, 34, 8, 12, 'canvasT');
    s.flag(4, 44, 0, 26, 'tileR');
    s.flag(48, 6, 0, 22, 'tileB');
    return s;
  });
  reg('nomads', 'in_horsepen', 'At ağılı', 'Horse pen', function () {
    var s = S(); s.pad(24, 22, 42, 'grass');
    s.fence(0, 0, 0, 48, 3, 9, 'wood');
    s.fence(0, 40, 0, 48, 3, 9, 'wood');
    s.fence(0, 3, 0, 3, 38, 9, 'wood');
    s.fence(45, 3, 0, 3, 38, 9, 'wood');
    s.box(30, 12, 0, 14, 12, 8, 'wood', { plain:true });
    s.gable(28, 10, 8, 18, 16, 7, 'thatch');
    return s;
  });
  reg('nomads', 'in_ancestorpole', 'Ata direği', 'Ancestor pole', function () {
    var s = S(); s.pad(14, 13, 24, 'grass');
    s.box(10, 10, 0, 5, 5, 30, 'woodD');
    s.box(6, 11, 22, 13, 3, 3, 'woodD', { plain:true });
    s.box(6, 11, 14, 13, 3, 3, 'woodD', { plain:true });
    s.rock(4, 4, 0, 4, 3, 'granite');
    s.rock(22, 20, 0, 4, 3, 'granite');
    return s;
  });
  reg('nomads', 'in_hunterscamp', 'Av kampı', 'Hunter camp', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    tent(s, 12, 12, 9, 13, 'hide');
    s.box(28, 8, 0, 1.6, 1.6, 16, 'woodD', { plain:true });
    s.box(36, 8, 0, 1.6, 1.6, 16, 'woodD', { plain:true });
    s.box(28, 8, 14, 9.6, 1.6, 1.6, 'woodD', { plain:true });
    s.rock(20, 30, 0, 4, 2, 'basalt');
    return s;
  });

  /* ============================================================
     5) DİNİ EK YAPILAR
     ============================================================ */
  reg('temples', 'ip_wayshrine', 'Yol mabedi', 'Wayshrine', function () {
    var s = S(); s.pad(12, 11, 20, 'dirt');
    s.box(6, 6, 0, 12, 10, 12, 'stoneW', { door:true, doorH:0.7 });
    s.gable(4, 4, 12, 16, 14, 8, 'tileR');
    return s;
  });
  reg('temples', 'ip_sunaltar', 'Güneş sunağı', 'Sun altar', function () {
    var s = S(); s.pad(18, 17, 30, 'stoneW');
    s.cyl(17, 16, 0, 16, 4, 'stoneW');
    s.cyl(17, 16, 4, 10, 4, 'stoneW');
    s.box(13, 12, 8, 8, 8, 6, 'gold');
    s.cone(17, 16, 14, 6, 10, 'gold');
    return s;
  });
  reg('temples', 'ip_moontemple', 'Ay tapınağı', 'Moon temple', function () {
    var s = S(); s.pad(20, 19, 34, 'stoneW');
    s.cyl(19, 18, 0, 18, 14, 'stoneW', { slit:4 });
    s.dome(19, 18, 14, 17, 15, 'ice');
    return s;
  });
  reg('temples', 'ip_bloodaltar', 'Kan sunağı', 'Blood altar', function () {
    var s = S(); s.pad(16, 15, 28, 'basalt');
    s.cyl(15, 14, 0, 14, 5, 'basalt');
    s.box(10, 9, 5, 10, 10, 7, 'dark');
    s.box(8, 7, 12, 14, 14, 2.4, 'tileR', { plain:true });
    var i;
    for (i = 0; i < 4; i++) {
      var a = i / 4 * Math.PI * 2 + 0.7;
      s.box(15 + Math.cos(a) * 11 - 1.4, 14 + Math.sin(a) * 11 - 1.2, 5, 3, 2.6, 10, 'bone');
    }
    return s;
  });
  reg('temples', 'ip_shamantower', 'Şaman kulesi', 'Shaman tower', function () {
    var s = S(); s.pad(14, 13, 24, 'dirt');
    s.cyl(13, 12, 0, 8, 20, 'woodD');
    s.cone(13, 12, 20, 10, 12, 'hide');
    s.box(2, 2, 0, 1.8, 1.8, 24, 'woodD', { plain:true });
    s.box(23, 3, 0, 1.8, 1.8, 21, 'woodD', { plain:true });
    return s;
  });
  reg('temples', 'ip_holywell', 'Kutsal kuyu', 'Holy well', function () {
    var s = S(); s.pad(12, 11, 20, 'grass');
    s.cyl(11, 10, 0, 8, 6, 'stoneW');
    s.cyl(11, 10, 6, 7, 1.4, 'ice');
    s.box(4, 9, 6, 1.8, 1.8, 12, 'wood', { plain:true });
    s.box(17, 9, 6, 1.8, 1.8, 12, 'wood', { plain:true });
    s.gable(2, 5, 18, 18, 11, 7, 'tileR');
    return s;
  });
  reg('temples', 'ip_catacomb', 'Katakomb', 'Catacomb', function () {
    var s = S(); s.pad(18, 16, 30, 'stoneD');
    s.rock(20, 22, 0, 18, 12, 'granite');
    s.box(6, 2, 0, 16, 12, 12, 'stoneD', { door:true, doorH:0.86 });
    s.box(4, 0, 12, 20, 16, 4, 'stoneD', { plain:true });
    return s;
  });
  reg('temples', 'ip_bellTower', 'Çan kulesi', 'Bell tower', function () {
    var s = S(); s.pad(14, 13, 24, 'grass');
    s.box(6, 6, 0, 14, 14, 30, 'stoneW', { slit:3 });
    s.box(4, 4, 30, 18, 18, 10, 'stoneW', { win:2 });
    s.cone(13, 13, 40, 11, 14, 'tileG');
    return s;
  });

  /* ============================================================
     6) EK ŞEHİR / KASABA
     ============================================================ */
  reg('cities', 'ic_twincity', 'İkiz kule şehri', 'Twin-tower city', function () {
    var s = S(); s.pad(34, 32, 60, 'dirt');
    wall(s, 0, 0, 0, 68, 62, 15, 'stoneW');
    towerSq(s, 8, 8, 0, 16, 36, 'stoneW', { roof:'tileB', flag:'tileR' });
    towerSq(s, 44, 8, 0, 16, 36, 'stoneW', { roof:'tileB', flag:'tileR' });
    hut(s, 18, 34, 20, 15, 15, 'stoneW', 'tileR', { win:2 });
    hut(s, 44, 40, 17, 13, 14, 'stoneW', 'tileR');
    return s;
  });
  reg('cities', 'ic_islandcity', 'Ada şehri', 'Island city', function () {
    var s = S(); s.pad(32, 30, 58, 'granite');
    s.cyl(30, 28, 0, 30, 6, 'granite');
    wall(s, 8, 6, 5, 46, 44, 13, 'stoneW');
    hut(s, 18, 18, 18, 14, 14, 'stoneW', 'tileR', { z:5, win:2 });
    towerRd(s, 40, 34, 5, 7, 26, 'stoneW', { roof:'tileB' });
    return s;
  });
  reg('cities', 'ic_cavecity', 'Mağara şehri', 'Cave city', function () {
    var s = S(); s.pad(30, 28, 54, 'granite');
    s.rock(30, 30, 0, 30, 26, 'granite');
    s.box(8, 2, 0, 22, 16, 20, 'granite', { door:true, doorH:0.68 });
    s.box(6, 0, 20, 26, 20, 6, 'granite', { plain:true });
    s.box(38, 6, 0, 12, 10, 14, 'granite', { win:2 });
    s.box(44, 26, 0, 10, 10, 11, 'granite', { win:1 });
    return s;
  });
  reg('towns', 'it_hilltown', 'Tepe kasabası', 'Hill town', function () {
    var s = S(); s.pad(28, 26, 50, 'grass');
    s.rock(26, 24, 0, 26, 10, 'dirt');
    hut(s, 10, 12, 18, 14, 12, 'stone', 'tileR', { z:7, win:1 });
    hut(s, 32, 20, 16, 13, 11, 'wood', 'tileR', { z:7 });
    towerSq(s, 20, 34, 7, 12, 24, 'stone', { roof:'tileR' });
    return s;
  });
  reg('towns', 'it_swamptown', 'Bataklık kasabası', 'Swamp town', function () {
    var s = S(); s.pad(28, 26, 50, 'dirt');
    var st = [[4,6],[26,4],[8,28],[32,26]];
    st.forEach(function (p) {
      s.box(p[0], p[1], 0, 2.4, 2.4, 9, 'woodD', { plain:true });
      s.box(p[0] + 18, p[1], 0, 2.4, 2.4, 9, 'woodD', { plain:true });
      s.box(p[0], p[1] + 14, 0, 2.4, 2.4, 9, 'woodD', { plain:true });
      s.box(p[0] + 18, p[1] + 14, 0, 2.4, 2.4, 9, 'woodD', { plain:true });
      hut(s, p[0] - 2, p[1] - 2, 22, 18, 10, 'wood', 'thatch', { z:9 });
    });
    return s;
  });
  reg('towns', 'it_snowtown', 'Kar kasabası', 'Snow town', function () {
    var s = S(); s.pad(28, 26, 50, 'snow');
    hut(s, 0, 8, 20, 15, 13, 'wood', 'snow', { win:2 });
    hut(s, 28, 4, 18, 14, 12, 'stone', 'snow', { win:1 });
    hut(s, 14, 34, 18, 14, 12, 'wood', 'snow');
    s.tree(48, 30, 0, 24, 'pine', 'tileG');
    return s;
  });

  /* ============================================================
     7) ASKERİ EK
     ============================================================ */
  reg('military', 'im_watchpost', 'Gözcü kulesi', 'Watch post', function () {
    var s = S(); s.pad(13, 12, 22, 'dirt');
    s.box(6, 6, 0, 4, 4, 18, 'woodD', { plain:true });
    s.box(18, 6, 0, 4, 4, 18, 'woodD', { plain:true });
    s.box(6, 18, 0, 4, 4, 18, 'woodD', { plain:true });
    s.box(18, 18, 0, 4, 4, 18, 'woodD', { plain:true });
    s.box(4, 4, 18, 20, 20, 8, 'wood', { win:2 });
    s.hip(2, 2, 26, 24, 24, 8, 'thatch');
    return s;
  });
  reg('military', 'im_beacon', 'İşaret ateşi', 'Beacon', function () {
    var s = S(); s.pad(12, 11, 20, 'granite');
    s.rock(11, 10, 0, 12, 6, 'granite');
    s.box(6, 5, 4, 4, 4, 16, 'woodD', { plain:true });
    s.box(14, 5, 4, 4, 4, 16, 'woodD', { plain:true });
    s.box(6, 13, 4, 4, 4, 16, 'woodD', { plain:true });
    s.box(14, 13, 4, 4, 4, 16, 'woodD', { plain:true });
    s.cyl(11, 10, 20, 7, 5, 'basalt');
    s.cone(11, 10, 25, 6, 10, 'tileR');
    return s;
  });
  reg('military', 'im_stockade', 'Hendekli istihkâm', 'Ditched stockade', function () {
    var s = S(); s.pad(26, 24, 46, 'dirt');
    s.box(0, 0, 0, 50, 44, 3, 'dirt', { plain:true });
    s.palisade(4, 4, 3, 42, 36, 14, 'woodD');
    s.box(18, 16, 3, 14, 12, 10, 'wood', { win:1 });
    s.gable(16, 14, 13, 18, 16, 7, 'thatch');
    return s;
  });
  reg('military', 'im_catapult', 'Mancınık mevzisi', 'Catapult post', function () {
    var s = S(); s.pad(20, 16, 34, 'dirt');
    s.box(4, 8, 0, 26, 14, 5, 'woodD', { plain:true });
    s.cyl(6, 8, 0, 3, 2.6, 'woodD'); s.cyl(28, 8, 0, 3, 2.6, 'woodD');
    s.cyl(6, 21, 0, 3, 2.6, 'woodD'); s.cyl(28, 21, 0, 3, 2.6, 'woodD');
    s.box(12, 12, 5, 3, 3, 18, 'woodD', { plain:true });
    s.box(12, 12, 20, 20, 3, 3, 'woodD', { plain:true });
    return s;
  });
  reg('military', 'im_armory', 'Cephanelik', 'Armory', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(2, 4, 0, 30, 20, 14, 'stoneD', { door:true, slit:3 });
    s.hip(0, 2, 14, 34, 24, 9, 'tileD');
    return s;
  });
  reg('military', 'im_trainingground', 'Talim alanı', 'Training ground', function () {
    var s = S(); s.pad(24, 22, 42, 'dirt');
    s.fence(0, 0, 0, 46, 3, 8, 'wood');
    s.fence(0, 38, 0, 46, 3, 8, 'wood');
    var i;
    for (i = 0; i < 4; i++) s.box(10 + i * 9, 18, 0, 3, 3, 13, 'woodD', { plain:true });
    return s;
  });

  /* ============================================================
     8) EKONOMİ EK
     ============================================================ */
  reg('mines', 'ie_saltmine', 'Tuz madeni', 'Salt mine', function () {
    var s = S(); s.pad(20, 18, 34, 'snow');
    s.rock(24, 22, 0, 18, 12, 'snow');
    s.box(4, 6, 0, 14, 12, 10, 'dark', { door:true, doorH:0.86 });
    s.gable(2, 4, 10, 18, 16, 7, 'woodD');
    s.box(24, 6, 0, 8, 6, 4, 'snow', { plain:true });
    return s;
  });
  reg('mines', 'ie_goldmine', 'Altın madeni', 'Gold mine', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.rock(24, 22, 0, 18, 14, 'granite');
    s.box(4, 6, 0, 14, 12, 10, 'dark', { door:true, doorH:0.86 });
    s.gable(2, 4, 10, 18, 16, 7, 'gold');
    return s;
  });
  reg('mines', 'ie_gemmine', 'Değerli taş madeni', 'Gem mine', function () {
    var s = S(); s.pad(20, 18, 34, 'basalt');
    s.rock(24, 22, 0, 18, 14, 'basalt');
    s.box(4, 6, 0, 14, 12, 10, 'dark', { door:true, doorH:0.86 });
    s.cone(30, 12, 10, 4, 10, 'crystal');
    s.cone(22, 32, 8, 3.4, 8, 'crystal');
    return s;
  });
  reg('mines', 'ie_tannery', 'Tabakhane', 'Tannery', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(2, 4, 0, 22, 16, 12, 'wood', { door:true, win:1 });
    s.gable(0, 2, 12, 26, 20, 9, 'thatch');
    s.cyl(30, 10, 0, 5, 5, 'woodD');
    s.cyl(30, 24, 0, 5, 5, 'woodD');
    return s;
  });
  reg('mines', 'ie_brewery', 'Bira evi', 'Brewery', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(2, 4, 0, 24, 18, 14, 'stone', { door:true, win:2 });
    s.gable(0, 2, 14, 28, 22, 10, 'tileR');
    s.cyl(32, 12, 0, 6, 9, 'woodD');
    return s;
  });
  reg('mines', 'ie_fishery', 'Balıkhane', 'Fishery', function () {
    var s = S(); s.pad(22, 18, 38, 'dirt');
    s.box(2, 4, 0, 22, 16, 11, 'wood', { door:true, win:1 });
    s.gable(0, 2, 11, 26, 20, 8, 'thatch');
    s.box(0, 26, 0, 44, 8, 3, 'wood', { plain:true });
    s.box(30, 22, 3, 1.8, 1.8, 12, 'woodD', { plain:true });
    return s;
  });
  reg('mines', 'ie_apiary', 'Arı kovanları', 'Apiary', function () {
    var s = S(); s.pad(18, 16, 30, 'grass');
    var i;
    for (i = 0; i < 5; i++) {
      var bx = 4 + (i % 3) * 11, by = 4 + Math.floor(i / 3) * 14;
      s.cyl(bx + 4, by + 4, 0, 4, 7, 'thatch');
      s.cone(bx + 4, by + 4, 7, 4.6, 4, 'thatch');
    }
    return s;
  });

  /* ============================================================
     9) LİMAN EK
     ============================================================ */
  reg('ports', 'iw_pier', 'Uzun iskele', 'Long pier', function () {
    var s = S(); s.pad(28, 12, 48, 'wood');
    s.box(0, 8, 0, 56, 8, 3, 'wood', { plain:true });
    var i;
    for (i = 0; i < 6; i++) s.box(4 + i * 9, 6, 0, 2.4, 2.4, 4, 'woodD', { plain:true });
    s.box(48, 2, 3, 10, 8, 8, 'wood', { win:1 });
    s.gable(46, 0, 11, 14, 12, 6, 'thatch');
    return s;
  });
  reg('ports', 'iw_boathouse', 'Kayıkhane', 'Boathouse', function () {
    var s = S(); s.pad(20, 16, 34, 'wood');
    s.box(0, 22, 0, 40, 8, 3, 'wood', { plain:true });
    s.box(6, 4, 0, 24, 16, 11, 'wood', { door:true, doorH:0.8 });
    s.gable(4, 2, 11, 28, 20, 9, 'thatch');
    return s;
  });
  reg('ports', 'iw_seawall', 'Dalgakıran', 'Sea wall', function () {
    var s = S(); s.pad(26, 12, 46, 'granite');
    s.box(0, 6, 0, 52, 12, 8, 'granite');
    var i;
    for (i = 0; i < 5; i++) s.rock(6 + i * 11, 3, 0, 5, 4, 'granite');
    return s;
  });
  reg('ports', 'iw_crane', 'Liman vinci', 'Harbour crane', function () {
    var s = S(); s.pad(18, 14, 32, 'wood');
    s.box(0, 12, 0, 36, 10, 3, 'wood', { plain:true });
    s.cyl(12, 16, 3, 6, 16, 'woodD');
    s.box(10, 15, 19, 2.4, 2.4, 10, 'woodD', { plain:true });
    s.box(10, 15, 27, 16, 2.4, 2.4, 'woodD', { plain:true });
    return s;
  });
  reg('ports', 'iw_fishinghut', 'Balıkçı kulübesi', 'Fishing hut', function () {
    var s = S(); s.pad(15, 13, 26, 'dirt');
    s.box(2, 2, 3, 18, 14, 10, 'wood', { door:true, win:1 });
    s.gable(0, 0, 13, 22, 18, 8, 'thatch');
    s.box(3, 3, 0, 2, 2, 3, 'woodD', { plain:true });
    s.box(18, 3, 0, 2, 2, 3, 'woodD', { plain:true });
    s.box(0, 20, 0, 24, 6, 2.4, 'wood', { plain:true });
    return s;
  });

  /* ============================================================
     10) MAĞARA / ZİNDAN EK
     ============================================================ */
  reg('magic', 'ig_cavemouth', 'Mağara ağzı', 'Cave mouth', function () {
    var s = S(); s.pad(20, 16, 34, 'granite');
    s.rock(20, 24, 0, 22, 16, 'granite');
    s.box(8, 2, 0, 20, 14, 15, 'dark', { door:true, doorH:0.94 });
    s.rock(2, 6, 0, 5, 4, 'granite');
    s.rock(34, 8, 0, 5, 4, 'granite');
    return s;
  });
  reg('magic', 'ig_sealedgate', 'Mühürlü kapı', 'Sealed gate', function () {
    var s = S(); s.pad(18, 15, 32, 'granite');
    s.rock(18, 22, 0, 20, 14, 'granite');
    s.box(6, 2, 0, 22, 12, 20, 'stoneD', { door:true, doorH:0.7 });
    s.box(4, 0, 20, 26, 16, 5, 'stoneD', { plain:true });
    s.cone(17, 8, 10, 3.4, 6, 'crystal');
    return s;
  });
  reg('magic', 'ig_prisontower', 'Zindan kulesi', 'Prison tower', function () {
    var s = S(); s.pad(15, 14, 26, 'stoneD');
    s.cyl(14, 13, 0, 10, 34, 'stoneD', { slit:4 });
    s.crenel(4, 3, 34, 20, 20, 3.6, 5, 'stoneD');
    s.box(24, 12, 24, 6, 2, 2, 'woodD', { plain:true });
    return s;
  });
  reg('magic', 'ig_lichcastle', 'Lich kalesi', 'Lich castle', function () {
    var s = S(); s.pad(28, 26, 50, 'basalt');
    wall(s, 0, 0, 0, 52, 46, 14, 'basalt');
    towerRd(s, 4, 4, 0, 8, 32, 'basalt', { crenel:true, roof:false });
    towerRd(s, 48, 4, 0, 8, 32, 'basalt', { crenel:true, roof:false });
    s.box(18, 16, 0, 18, 16, 26, 'basalt', { slit:3 });
    s.cone(27, 24, 26, 12, 20, 'dark');
    return s;
  });
  reg('magic', 'ig_cursedvillage', 'Lanetli köy', 'Cursed village', function () {
    var s = S(); s.pad(22, 20, 38, 'basalt');
    s.box(2, 6, 0, 14, 11, 9, 'ruin');
    s.gable(0, 4, 9, 18, 15, 6, 'dark');
    s.box(24, 4, 0, 12, 10, 7, 'ruin');
    s.cyl(16, 30, 0, 1.6, 14, 'woodD');
    s.cyl(34, 28, 0, 1.4, 11, 'woodD');
    return s;
  });
  reg('magic', 'ig_fairyring', 'Peri halkası', 'Fairy ring', function () {
    var s = S(); s.pad(18, 17, 30, 'grass');
    var i;
    for (i = 0; i < 9; i++) {
      var a = i / 9 * Math.PI * 2;
      var mx = 17 + Math.cos(a) * 13, my = 16 + Math.sin(a) * 13;
      s.cyl(mx, my, 0, 1.6, 3, 'stoneW');
      s.dome(mx, my, 3, 3.4, 2.4, 'tileR');
    }
    return s;
  });
  reg('magic', 'ig_alchemist', 'Simyacı kulesi', 'Alchemist tower', function () {
    var s = S(); s.pad(15, 14, 26, 'dirt');
    s.box(4, 4, 0, 20, 18, 14, 'stone', { door:true, win:1 });
    s.cyl(14, 13, 14, 7, 20, 'stoneW', { slit:2 });
    s.cone(14, 13, 34, 8, 12, 'tileG');
    s.box(22, 6, 14, 4, 4, 12, 'stoneD');
    return s;
  });
  reg('magic', 'ig_giantskull', 'Dev kafatası', 'Giant skull', function () {
    var s = S(); s.pad(18, 17, 30, 'dirt');
    s.dome(17, 16, 0, 16, 14, 'bone');
    s.box(9, 2, 2, 6, 6, 6, 'dark');
    s.box(20, 2, 2, 6, 6, 6, 'dark');
    s.box(12, 0, 0, 11, 5, 4, 'bone');
    return s;
  });

  /* ============================================================
     11) HARABE EK
     ============================================================ */
  reg('ruins', 'iu_ruinkeep', 'Yıkık iç kale', 'Ruined keep', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    s.box(4, 4, 0, 24, 22, 20, 'ruin', { win:1 });
    s.box(4, 4, 20, 9, 22, 7, 'ruin');
    s.box(22, 4, 20, 6, 9, 4, 'ruin');
    s.rock(34, 30, 0, 7, 4, 'ruin');
    return s;
  });
  reg('ruins', 'iu_ruintemple', 'Yıkık tapınak', 'Ruined temple', function () {
    var s = S(); s.pad(24, 22, 42, 'stoneW');
    s.box(0, 0, 0, 44, 38, 4, 'ruin', { plain:true });
    s.cyl(8, 8, 4, 3.4, 20, 'ruin');
    s.cyl(22, 8, 4, 3.4, 14, 'ruin');
    s.cyl(36, 8, 4, 3.4, 18, 'ruin');
    s.cyl(8, 30, 4, 3.4, 10, 'ruin');
    s.rock(30, 28, 4, 6, 3, 'ruin');
    return s;
  });
  reg('ruins', 'iu_ruinbridge', 'Yıkık köprü', 'Broken bridge', function () {
    var s = S(); s.pad(26, 16, 46, 'stone');
    s.box(0, 8, 6, 18, 12, 5, 'ruin', { plain:true });
    s.box(4, 8, 0, 8, 12, 6, 'ruin');
    s.box(36, 8, 6, 16, 12, 5, 'ruin', { plain:true });
    s.box(40, 8, 0, 8, 12, 6, 'ruin');
    s.rock(24, 14, 0, 5, 3, 'ruin');
    return s;
  });
  reg('ruins', 'iu_sunkentower', 'Batık kule', 'Sunken tower', function () {
    var s = S(); s.pad(16, 15, 28, 'ice');
    s.cyl(14, 13, 0, 15, 1.4, 'ice');
    s.cyl(14, 13, 0, 8, 18, 'ruin', { slit:2 });
    s.box(6, 5, 18, 7, 7, 5, 'ruin');
    return s;
  });
  reg('ruins', 'iu_ruinstatue', 'Yıkık heykel', 'Fallen statue', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(4, 6, 0, 14, 12, 6, 'ruin', { plain:true });
    s.box(7, 8, 6, 8, 8, 14, 'ruin');
    s.cyl(28, 20, 0, 4, 16, 'ruin');
    s.rock(22, 30, 0, 6, 4, 'ruin');
    return s;
  });

  /* ============================================================
     12) KÜLTÜREL EK
     ============================================================ */
  reg('cultures', 'ix_pagodagate', 'Torii kapısı', 'Torii gate', function () {
    var s = S(); s.pad(18, 12, 32, 'dirt');
    s.box(4, 8, 0, 4, 4, 24, 'tileR');
    s.box(28, 8, 0, 4, 4, 24, 'tileR');
    s.box(0, 7, 24, 36, 6, 3.4, 'tileR', { plain:true });
    s.box(2, 8, 19, 32, 4, 2.6, 'tileR', { plain:true });
    return s;
  });
  reg('cultures', 'ix_chineseGate', 'Doğu kapısı', 'Eastern gate', function () {
    var s = S(); s.pad(22, 16, 38, 'stoneW');
    s.box(0, 8, 0, 12, 12, 20, 'stoneW');
    s.box(32, 8, 0, 12, 12, 20, 'stoneW');
    s.box(12, 8, 12, 20, 12, 8, 'wood', { win:2 });
    s.pagoda(8, 4, 20, 28, 20, 9, 'tileB', 2);
    return s;
  });
  reg('cultures', 'ix_greekagora', 'Agora', 'Agora', function () {
    var s = S(); s.pad(26, 24, 46, 'stoneW');
    s.box(0, 0, 0, 48, 44, 4, 'stoneW', { plain:true });
    var i;
    for (i = 0; i < 6; i++) s.cyl(5 + i * 8, 5, 4, 2.4, 18, 'stoneW');
    s.box(2, 2, 22, 44, 8, 4, 'stoneW', { plain:true });
    s.box(20, 20, 4, 12, 10, 12, 'stoneW', { door:true });
    s.gable(18, 18, 16, 16, 14, 7, 'tileR');
    return s;
  });
  reg('cultures', 'ix_aztec', 'Basamaklı tapınak', 'Step temple', function () {
    var s = S(); s.pad(26, 25, 46, 'stoneD');
    var i, w = 46, z = 0;
    for (i = 0; i < 5; i++) { s.box(23 - w / 2, 23 - w / 2, z, w, w, 6, 'stoneD'); z += 6; w -= 8; }
    s.box(17, 17, z, 12, 12, 10, 'stoneD', { door:true });
    s.gable(15, 15, z + 10, 16, 16, 7, 'tileR');
    return s;
  });
  reg('cultures', 'ix_yurtcity', 'Göçebe başkenti', 'Nomad capital', function () {
    var s = S(); s.pad(28, 26, 50, 'grass');
    s.cyl(26, 24, 0, 15, 14, 'hide');
    s.dome(26, 24, 14, 15.2, 10, 'hide');
    var i;
    for (i = 0; i < 5; i++) {
      var a = i / 5 * Math.PI * 2 + 0.4;
      var mx = 26 + Math.cos(a) * 25, my = 24 + Math.sin(a) * 25;
      s.cyl(mx, my, 0, 6, 6, 'canvasT');
      s.dome(mx, my, 6, 6.2, 4.4, 'canvasT');
    }
    s.flag(26, 24, 24, 20, 'tileR');
    return s;
  });
  reg('cultures', 'ix_druidcircle', 'Druid çemberi', 'Druid circle', function () {
    var s = S(); s.pad(24, 23, 42, 'grass');
    var i;
    for (i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2;
      s.box(22 + Math.cos(a) * 19 - 2.4, 21 + Math.sin(a) * 19 - 2, 0, 5, 4, 16 + (i % 3) * 4, 'granite');
    }
    s.tree(22, 21, 0, 30, 'round', 'tileG');
    return s;
  });
  reg('cultures', 'ix_mountaintribe', 'Dağ kabilesi', 'Mountain tribe', function () {
    var s = S(); s.pad(24, 22, 42, 'granite');
    s.rock(24, 24, 0, 24, 12, 'granite');
    s.box(6, 6, 6, 14, 12, 9, 'granite', { door:true });
    s.gable(4, 4, 15, 18, 16, 7, 'hide');
    s.box(28, 10, 6, 12, 10, 8, 'granite', { win:1 });
    s.gable(26, 8, 14, 16, 14, 6, 'hide');
    s.box(20, 32, 0, 2, 2, 16, 'woodD', { plain:true });
    return s;
  });
  reg('cultures', 'ix_swamptribe', 'Bataklık kabilesi', 'Swamp tribe', function () {
    var s = S(); s.pad(24, 22, 42, 'dirt');
    var st = [[6, 8], [28, 14], [14, 30]];
    st.forEach(function (p, i) {
      s.box(p[0], p[1], 0, 2, 2, 8, 'woodD', { plain:true });
      s.box(p[0] + 12, p[1], 0, 2, 2, 8, 'woodD', { plain:true });
      s.box(p[0], p[1] + 10, 0, 2, 2, 8, 'woodD', { plain:true });
      s.box(p[0] + 12, p[1] + 10, 0, 2, 2, 8, 'woodD', { plain:true });
      s.cone(p[0] + 7, p[1] + 6, 8, 9, 10, 'thatch', { pole:true });
    });
    return s;
  });
  reg('cultures', 'ix_banditcamp', 'Haydut kampı', 'Bandit camp', function () {
    var s = S(); s.pad(22, 20, 38, 'dirt');
    s.rock(6, 30, 0, 12, 10, 'granite');
    tent(s, 14, 12, 8, 11, 'hide');
    tent(s, 32, 18, 7, 10, 'canvasT');
    s.box(28, 32, 0, 1.6, 1.6, 14, 'woodD', { plain:true });
    s.rock(24, 22, 0, 4, 2, 'basalt');
    return s;
  });

  /* ============================================================
     13) GEÇİT EK
     ============================================================ */
  reg('passes', 'iq_aqueduct', 'Su kemeri', 'Aqueduct', function () {
    var s = S(); s.pad(28, 14, 48, 'stoneW');
    var i;
    for (i = 0; i < 4; i++) s.box(2 + i * 14, 8, 0, 8, 10, 22, 'stoneW');
    s.box(0, 7, 22, 56, 12, 6, 'stoneW');
    s.box(0, 8, 28, 56, 2, 3, 'stoneW', { plain:true });
    s.box(0, 16, 28, 56, 2, 3, 'stoneW', { plain:true });
    return s;
  });
  reg('passes', 'iq_tunnel', 'Tünel girişi', 'Tunnel mouth', function () {
    var s = S(); s.pad(20, 16, 34, 'granite');
    s.rock(20, 24, 0, 22, 16, 'granite');
    s.box(8, 2, 0, 20, 14, 16, 'dark', { door:true, doorH:0.9 });
    s.box(6, 0, 16, 24, 18, 5, 'granite', { plain:true });
    return s;
  });
  reg('passes', 'iq_ropebridge', 'Halat köprü', 'Rope bridge', function () {
    var s = S(); s.pad(26, 14, 46, 'woodD');
    s.box(0, 8, 0, 8, 8, 18, 'granite');
    s.box(44, 8, 0, 8, 8, 18, 'granite');
    s.box(6, 10, 14, 40, 5, 1.6, 'wood', { plain:true });
    var i;
    for (i = 0; i < 8; i++) s.box(8 + i * 5, 10, 15.6, 3, 5, 0.9, 'woodD', { plain:true });
    return s;
  });
  reg('passes', 'iq_gatepass', 'Dağ geçidi kalesi', 'Pass fort', function () {
    var s = S(); s.pad(26, 22, 46, 'granite');
    s.rock(6, 30, 0, 14, 20, 'granite');
    s.rock(44, 30, 0, 14, 20, 'granite');
    s.box(14, 12, 0, 22, 12, 18, 'granite', { door:true, doorH:0.62 });
    s.crenel(12, 10, 18, 26, 16, 5, 7, 'granite');
    return s;
  });

  /* ============================================================
     14) DAĞ / DOĞA EK
     ============================================================ */
  reg('mountains', 'ir_twinpeak', 'Çift zirve', 'Twin peaks', function () {
    var s = S(); s.pad(26, 24, 46, 'granite');
    s.rock(14, 16, 0, 16, 24, 'granite');
    s.cone(14, 16, 18, 9, 12, 'snow');
    s.rock(34, 26, 0, 15, 20, 'granite');
    s.cone(34, 26, 15, 8, 10, 'snow');
    return s;
  });
  reg('mountains', 'ir_crater', 'Krater', 'Crater', function () {
    var s = S(); s.pad(24, 23, 42, 'basalt');
    var i;
    for (i = 0; i < 10; i++) {
      var a = i / 10 * Math.PI * 2;
      s.rock(22 + Math.cos(a) * 18, 21 + Math.sin(a) * 18, 0, 7, 9 + (i % 3) * 3, 'basalt');
    }
    return s;
  });
  reg('mountains', 'ir_mesa', 'Mesa', 'Mesa', function () {
    var s = S(); s.pad(24, 22, 42, 'dirt');
    s.box(4, 4, 0, 36, 32, 22, 'dirt');
    s.box(2, 2, 22, 40, 36, 4, 'dirt');
    return s;
  });
  reg('mountains', 'ir_spire', 'Kaya iğnesi', 'Rock spire', function () {
    var s = S(); s.pad(16, 15, 28, 'granite');
    s.rock(15, 14, 0, 15, 8, 'granite');
    s.cone(15, 14, 6, 8, 32, 'granite');
    return s;
  });
  reg('mountains', 'ir_waterfall', 'Şelale', 'Waterfall', function () {
    var s = S(); s.pad(22, 20, 38, 'granite');
    s.box(0, 0, 0, 22, 34, 26, 'granite');
    s.box(22, 10, 0, 8, 14, 26, 'ice');
    s.cyl(30, 30, 0, 10, 1.6, 'ice');
    return s;
  });
  reg('mountains', 'ir_hotspring', 'Kaplıca', 'Hot spring', function () {
    var s = S(); s.pad(20, 19, 34, 'granite');
    var i;
    for (i = 0; i < 8; i++) {
      var a = i / 8 * Math.PI * 2;
      s.rock(18 + Math.cos(a) * 15, 17 + Math.sin(a) * 15, 0, 5, 5, 'granite');
    }
    s.cyl(18, 17, 1, 11, 1.6, 'ice');
    return s;
  });
  reg('mountains', 'ir_boulder', 'Kaya bloğu', 'Boulder', function () {
    var s = S(); s.pad(14, 13, 24, 'granite');
    s.rock(13, 12, 0, 14, 14, 'granite');
    s.rock(24, 20, 0, 6, 5, 'granite');
    return s;
  });
  reg('hills', 'ih_hill', 'Tepe', 'Hill', function () {
    var s = S(); s.pad(20, 19, 34, 'grass');
    s.dome(18, 17, 0, 18, 12, 'grass');
    return s;
  });
  reg('hills', 'ih_twinhill', 'Çift tepe', 'Twin hills', function () {
    var s = S(); s.pad(24, 22, 42, 'grass');
    s.dome(14, 14, 0, 13, 9, 'grass');
    s.dome(32, 26, 0, 15, 11, 'grass');
    return s;
  });
  reg('hills', 'ih_treehill', 'Ağaçlı tepe', 'Wooded hill', function () {
    var s = S(); s.pad(22, 21, 38, 'grass');
    s.dome(20, 19, 0, 19, 12, 'grass');
    s.tree(14, 14, 10, 18, 'round', 'tileG');
    s.tree(28, 22, 9, 16, 'round', 'tileG');
    return s;
  });
  reg('hills', 'ih_rockhill', 'Kayalık tepe', 'Rocky hill', function () {
    var s = S(); s.pad(22, 21, 38, 'granite');
    s.dome(20, 19, 0, 19, 10, 'dirt');
    s.rock(14, 14, 8, 7, 7, 'granite');
    s.rock(28, 24, 7, 6, 6, 'granite');
    return s;
  });

  reg('forests', 'if_mixedwood', 'Karışık orman', 'Mixed wood', function () {
    var s = S(); s.pad(22, 21, 38, 'grass');
    s.tree(9, 10, 0, 28, 'pine', 'tileG');
    s.tree(28, 14, 0, 26, 'round', 'grass');
    s.tree(16, 30, 0, 24, 'pine', 'tileG');
    s.tree(34, 32, 0, 22, 'round', 'grass');
    return s;
  });
  reg('forests', 'if_snowforest', 'Karlı orman', 'Snowy forest', function () {
    var s = S(); s.pad(20, 19, 34, 'snow');
    s.tree(9, 10, 0, 28, 'pine', 'snow');
    s.tree(26, 15, 0, 25, 'pine', 'snow');
    s.tree(15, 28, 0, 23, 'pine', 'snow');
    return s;
  });
  reg('forests', 'if_darkwood', 'Karanlık orman', 'Dark wood', function () {
    var s = S(); s.pad(20, 19, 34, 'basalt');
    s.tree(9, 10, 0, 30, 'pine', 'tileD');
    s.tree(26, 15, 0, 27, 'pine', 'tileD');
    s.tree(15, 28, 0, 25, 'pine', 'tileD');
    return s;
  });
  reg('forests', 'if_swampwood', 'Bataklık ormanı', 'Swamp wood', function () {
    var s = S(); s.pad(20, 19, 34, 'dirt');
    s.cyl(18, 17, 0, 16, 1.2, 'ice');
    s.tree(10, 11, 0, 24, 'round', 'tileG');
    s.tree(26, 20, 0, 21, 'round', 'tileG');
    s.cyl(16, 30, 0, 1.4, 12, 'woodD');
    return s;
  });
  reg('forests', 'if_orchard', 'Meyve bahçesi', 'Orchard', function () {
    var s = S(); s.pad(22, 21, 38, 'grass');
    var i;
    for (i = 0; i < 6; i++) s.tree(6 + (i % 3) * 14, 6 + Math.floor(i / 3) * 16, 0, 18, 'round', 'grass');
    return s;
  });
  reg('forests', 'if_bigtree', 'Dev ağaç', 'Great tree', function () {
    var s = S(); s.pad(18, 17, 30, 'grass');
    s.cyl(16, 15, 0, 5, 16, 'woodD');
    s.tree(16, 15, 14, 40, 'round', 'tileG');
    return s;
  });
  reg('forests', 'if_treehouse', 'Ağaç ev', 'Tree house', function () {
    var s = S(); s.pad(16, 15, 28, 'grass');
    s.cyl(14, 13, 0, 4, 16, 'woodD');
    s.box(6, 5, 16, 17, 16, 9, 'wood', { door:true, win:1 });
    s.gable(4, 3, 25, 21, 20, 7, 'thatch');
    s.tree(14, 13, 30, 22, 'round', 'tileG');
    return s;
  });

  /* ============================================================
     15) DEKORATİF EK
     ============================================================ */
  reg('misc', 'id_signpost', 'Yol tabelası', 'Signpost', function () {
    var s = S(); s.pad(10, 9, 16, 'dirt');
    s.box(9, 9, 0, 3, 3, 20, 'woodD');
    s.box(1, 9.5, 14, 9, 2, 4, 'wood', { plain:true });
    s.box(11, 9.5, 9, 9, 2, 4, 'wood', { plain:true });
    return s;
  });
  reg('misc', 'id_gallows', 'Darağacı', 'Gallows', function () {
    var s = S(); s.pad(14, 13, 24, 'dirt');
    s.box(4, 12, 0, 4, 4, 26, 'woodD');
    s.box(4, 12, 26, 20, 4, 4, 'woodD', { plain:true });
    s.box(20, 13, 14, 1.2, 1.2, 12, 'woodD', { plain:true });
    return s;
  });
  reg('misc', 'id_campfire', 'Kamp ateşi', 'Campfire', function () {
    var s = S(); s.pad(10, 9, 16, 'dirt');
    var i;
    for (i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2;
      s.rock(9 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, 0, 2.2, 1.8, 'basalt');
    }
    s.cone(9, 8, 0, 3.4, 6, 'tileR');
    return s;
  });
  reg('misc', 'id_cart', 'Araba', 'Cart', function () {
    var s = S(); s.pad(14, 11, 24, 'dirt');
    s.box(3, 5, 3, 18, 11, 7, 'wood');
    s.cyl(4, 4, 0, 3, 2.4, 'woodD');
    s.cyl(18, 4, 0, 3, 2.4, 'woodD');
    s.cyl(4, 16, 0, 3, 2.4, 'woodD');
    s.cyl(18, 16, 0, 3, 2.4, 'woodD');
    return s;
  });
  reg('misc', 'id_haystack', 'Saman yığını', 'Haystack', function () {
    var s = S(); s.pad(11, 10, 18, 'dirt');
    s.cyl(10, 9, 0, 8, 7, 'thatch');
    s.cone(10, 9, 7, 8.4, 8, 'thatch');
    return s;
  });
  reg('misc', 'id_woodpile', 'Odun yığını', 'Woodpile', function () {
    var s = S(); s.pad(14, 12, 24, 'dirt');
    var i;
    for (i = 0; i < 3; i++) s.box(2, 4, i * 4, 22, 12, 3.6, 'woodD');
    return s;
  });
  reg('misc', 'id_stonepile', 'Taş yığını', 'Cairn', function () {
    var s = S(); s.pad(11, 10, 18, 'granite');
    s.rock(10, 9, 0, 9, 5, 'granite');
    s.rock(10, 9, 4, 6.5, 4, 'granite');
    s.rock(10, 9, 7.5, 4.4, 3.4, 'granite');
    return s;
  });
  reg('misc', 'id_watchfire', 'Nöbet ateşi', 'Watchfire', function () {
    var s = S(); s.pad(12, 11, 20, 'dirt');
    s.box(6, 6, 0, 4, 4, 12, 'woodD', { plain:true });
    s.box(14, 6, 0, 4, 4, 12, 'woodD', { plain:true });
    s.box(6, 14, 0, 4, 4, 12, 'woodD', { plain:true });
    s.box(14, 14, 0, 4, 4, 12, 'woodD', { plain:true });
    s.cyl(12, 11, 12, 7, 4, 'basalt');
    s.cone(12, 11, 16, 6, 9, 'tileR');
    return s;
  });

  /* ---- meydan mobilyası: heykel/anıt, sokak feneri, oturma bankı — bir
     şehir bloğunu yalnızca bina + iç mekan eşyasıyla değil, sokak/meydan
     seviyesinde de tamamlamak için (bkz. CLAUDE.md § Şehir sembolleri) */
  reg('misc', 'id_statue', 'Meydan heykeli', 'Plaza statue', function () {
    var s = S(); s.pad(11, 10, 18, 'stoneW');
    s.box(3, 2, 0, 12, 10, 5, 'stoneW', { plain:true });
    s.cyl(9, 7, 5, 3.6, 3, 'stoneW');
    s.cyl(9, 7, 8, 2.4, 9, 'gold');
    s.box(6, 5.5, 13, 1.4, 5, 5.5, 'gold', { plain:true });
    return s;
  });
  reg('misc', 'id_lamppost', 'Sokak feneri', 'Street lamp', function () {
    var s = S(); s.pad(6, 6, 10, 'dirt');
    s.cyl(5, 5, 0, 1.2, 22, 'dark');
    s.box(3.2, 3.2, 22, 3.6, 3.6, 4, 'dark', { plain:true });
    s.dome(5, 5, 26, 2, 3, 'gold');
    return s;
  });
  reg('misc', 'id_bench', 'Oturma bankı', 'Bench', function () {
    var s = S(); s.pad(16, 8, 8, 'dirt');
    s.box(1, 1, 4, 14, 6, 1.4, 'wood', { plain:true });
    s.box(1, 1, 6, 14, 1.4, 4, 'wood', { plain:true });
    s.box(1.5, 1.5, 0, 1.6, 5, 4, 'woodD', { plain:true });
    s.box(12.9, 1.5, 0, 1.6, 5, 4, 'woodD', { plain:true });
    return s;
  });

  /* ============================================================
     7) SUR KAVŞAKLARI (T-kavşak + kule birleşimi)
     "sur parçaları" isteğinde eksik kalan iki bağlantı parçası —
     düz/köşe/kapı zaten mevcuttu, T-kavşak ve kuleyle birleşen sur
     köşesi burada tamamlanıyor.
     ============================================================ */
  WALL_MATS.forEach(function (m, i) {
    reg('castles', 'iwl_tjunc_' + i, 'Sur T-kavşağı · ' + m[1], 'Wall T-junction · ' + m[2], function () {
      var s = S(); s.pad(24, 24, 42, 'dirt');
      wall(s, 0, 26, 0, 52, 12, 16, m[0]);
      wall(s, 40, 0, 0, 12, 28, 16, m[0]);
      return s;
    });
    reg('castles', 'iwl_towercorner_' + i, 'Kuleli sur köşesi · ' + m[1], 'Wall corner with tower · ' + m[2], function () {
      var s = S(); s.pad(24, 22, 40, 'dirt');
      wall(s, 18, 30, 0, 34, 11, 15, m[0]);
      wall(s, 30, 0, 0, 11, 32, 15, m[0]);
      towerSq(s, 2, 2, 0, 17, 26, m[0], { roof:false, slit:2 });
      return s;
    });
  });

  /* yıkık sur parçaları — mevcut düz/köşe/kapı setinin harabe versiyonu */
  reg('ruins', 'iwl_ruin_straight', 'Yıkık sur parçası', 'Ruined wall segment', function () {
    var s = S(); s.pad(24, 12, 42, 'dirt');
    s.box(0, 6, 0, 48, 12, 10, 'ruin', { slit:2 });
    s.box(6, 7, 10, 10, 10, 4, 'ruin', { plain:true });
    s.box(30, 8, 10, 8, 8, 3, 'ruin', { plain:true });
    s.rock(38, 2, 0, 5, 3, 'stoneD');
    return s;
  });
  reg('ruins', 'iwl_ruin_gate', 'Yıkık sur kapısı', 'Ruined wall gate', function () {
    var s = S(); s.pad(24, 14, 42, 'dirt');
    s.box(0, 6, 0, 14, 12, 12, 'ruin');
    s.box(34, 6, 0, 14, 12, 9, 'ruin');
    s.rock(16, 4, 0, 6, 4, 'stoneD');
    s.rock(24, 10, 0, 5, 3, 'stoneD');
    return s;
  });
  reg('ruins', 'iwl_ruin_corner', 'Yıkık sur köşesi', 'Ruined wall corner', function () {
    var s = S(); s.pad(20, 18, 34, 'dirt');
    s.box(0, 26, 0, 32, 12, 9, 'ruin', { slit:1 });
    s.box(28, 0, 0, 12, 22, 8, 'ruin', { slit:1 });
    s.rock(8, 30, 0, 5, 3, 'stoneD');
    s.rock(32, 4, 0, 4, 3, 'stoneD');
    return s;
  });
  reg('ruins', 'iwl_ruin_tjunc', 'Yıkık sur T-kavşağı', 'Ruined wall T-junction', function () {
    var s = S(); s.pad(24, 24, 42, 'dirt');
    s.box(0, 26, 0, 40, 12, 9, 'ruin', { slit:2 });
    s.box(40, 0, 0, 12, 22, 8, 'ruin', { slit:1 });
    s.rock(18, 30, 0, 5, 3, 'stoneD');
    s.rock(42, 8, 0, 4, 3, 'stoneD');
    return s;
  });
  reg('ruins', 'iwl_ruin_towercorner', 'Yıkık kuleli sur köşesi', 'Ruined wall corner with tower', function () {
    var s = S(); s.pad(24, 22, 40, 'dirt');
    s.box(18, 30, 0, 26, 11, 8, 'ruin');
    s.box(30, 0, 0, 11, 24, 7, 'ruin');
    towerSq(s, 2, 2, 0, 17, 15, 'ruin', { roof:false, crenel:false, slit:1 });
    s.rock(6, 16, 15, 6, 3, 'stoneD');
    return s;
  });
  reg('ruins', 'iwl_ruin_freegate', 'Yıkık kapı kulesi', 'Ruined gate tower', function () {
    var s = S(); s.pad(24, 14, 42, 'dirt');
    s.box(0, 6, 0, 15, 12, 10, 'ruin');
    s.box(33, 6, 0, 15, 12, 14, 'ruin', { slit:1 });
    s.rock(14, 3, 0, 6, 4, 'stoneD');
    s.rock(30, 9, 0, 5, 3, 'stoneD');
    return s;
  });

  /* ============================================================
     8) DAĞLIK YERLEŞKE (terraced taş köy — kültürel/coğrafi varyant)
     Kayalık zeminde farklı yüksekliklerde teraslanmış taş evler;
     "dağ kabilesi" (cultures/ix_mountaintribe) daha ilkel/göçebe bir
     kampı temsil ederken bu, kalıcı mimari bir dağ yerleşimini verir.
     ============================================================ */
  function terraceHut(s, x, y, z, w, mat, roof) {
    s.rock(x - 2, y - 2, 0, w * 0.75, z, 'stoneD');
    hut(s, x, y, w, w * 0.82, 11, mat, roof, { z:z, win:1 });
  }
  [['small', 'Küçük', 'Small', 2], ['medium', 'Orta', 'Medium', 3], ['large', 'Büyük', 'Large', 4]]
    .forEach(function (sizeDef) {
      reg('mountains', 'ims_' + sizeDef[0], 'Dağlık yerleşke · ' + sizeDef[1], 'Mountain settlement · ' + sizeDef[2], function () {
        var n = sizeDef[3];
        var s = S(); s.pad(15 + n * 9, 15 + n * 7, 26 + n * 12, 'stoneD');
        var mats = ['stone', 'stoneW', 'stoneD'];
        /* 2 sütunlu ızgara — her satır bir üst terası temsil eder (z artar);
           sütun ve satır aralığı yeterince geniş tutuluyor ki izometrik
           izdüşümde evler ekranda üst üste binmesin */
        for (var i = 0; i < n; i++) {
          var col = i % 2, row = Math.floor(i / 2);
          var hx = 4 + col * 24;
          var hy = 4 + row * 24;
          var hz = row * 11 + col * 4;
          terraceHut(s, hx, hy, hz, 15, mats[i % mats.length], i % 2 ? 'tileD' : 'thatch');
        }
        s.box(2, 2 + n * 4, n * 5 - 3, n * 8, 4, 3, 'stoneD', { plain:true });
        return s;
      });
    });

  /* ============================================================
     9) KENTSEL YAPI KİTİ (han, taverna, kütüphane, çeşme/kuyu,
     pazar tezgâhı, demirci, fırın, köprü) — Inkarnate tarzı bir
     şehir haritasını TEK TEK yerleştirilebilir parçalarla kurmak
     için: her biri kendi başına bağımsız, tekrar tekrar
     kullanılabilen atomik bir bina/nesne (mevcut "Han"/"Kervansaray"
     gibi hazır bütün sahnelerden farklı olarak).
     ============================================================ */
  function signpost(s, x, y, z, h, col) {
    s.box(x, y, z, 1.6, 1.6, h, 'woodD', { plain:true });
    s.flag(x - 0.2, y - 0.2, z + h * 0.5, h * 0.42, col);
  }
  function chimney(s, x, y, z, h, mat) {
    s.box(x, y, z, 3, 3, h, mat || 'stoneD', { plain:true });
  }
  function barrel(s, x, y, z) { s.cyl(x, y, z, 2.1, 4, 'wood'); }
  function tableProp(s, x, y, z) {
    s.box(x, y, z + 2.4, 5, 3, 1, 'wood', { plain:true });
    s.box(x + 0.3, y + 0.3, z, 0.8, 0.8, 2.4, 'woodD', { plain:true });
    s.box(x + 3.9, y + 1.9, z, 0.8, 0.8, 2.4, 'woodD', { plain:true });
  }

  /* ---- Han (Inn) — 3 varyant ---- */
  reg('towns', 'ic_inn_tudor', 'Han · Ahşap çerçeveli', 'Inn · Timber-framed', function () {
    var s = S(); s.pad(20, 18, 32, 'dirt');
    hut(s, 2, 4, 26, 20, 16, 'wood', 'tileR', { win:3 });
    chimney(s, 4, 5, 16, 7, 'stone');
    signpost(s, 29, 8, 0, 13, 'tileR');
    return s;
  });
  reg('towns', 'ic_inn_stone', 'Han · Taş, iki katlı', 'Inn · Stone, two-storey', function () {
    var s = S(); s.pad(22, 20, 36, 'dirt');
    hut(s, 2, 4, 28, 21, 19, 'stone', 'tileB', { win:4 });
    chimney(s, 25, 6, 19, 8, 'stoneD');
    signpost(s, 31, 10, 0, 15, 'tileB');
    s.box(0, 24, 0, 8, 6, 8, 'wood', { plain:true });
    s.hip(-1, 23, 8, 10, 8, 5, 'thatch');
    return s;
  });
  reg('towns', 'ic_inn_desert', 'Han · Kerpiç kervan hanı', 'Inn · Adobe caravan inn', function () {
    var s = S(); s.pad(20, 18, 32, 'dirt');
    hut(s, 2, 4, 24, 18, 14, 'adobeW', 'tileD', { win:2 });
    signpost(s, 27, 8, 0, 12, 'gold');
    s.palisade(0, 22, 0, 22, 4, 8, 'wood', { corner:false });
    return s;
  });

  /* ---- Taverna (Tavern) — 3 varyant, dış mekân masa/fıçılarla ---- */
  reg('towns', 'ic_tavern_common', 'Taverna', 'Tavern', function () {
    var s = S(); s.pad(20, 18, 32, 'dirt');
    hut(s, 2, 6, 20, 16, 13, 'woodD', 'tileR', { win:2 });
    chimney(s, 4, 7, 13, 6, 'stone');
    barrel(s, 24, 8, 0); barrel(s, 27, 11, 0);
    tableProp(s, 24, 16, 0);
    signpost(s, 22, 4, 0, 11, 'tileD');
    return s;
  });
  reg('towns', 'ic_tavern_riverside', 'Taverna · Nehir kenarı', 'Tavern · Riverside', function () {
    var s = S(); s.pad(24, 20, 38, 'dirt');
    hut(s, 2, 6, 20, 16, 13, 'wood', 'tileB', { win:2 });
    s.box(22, 6, 0, 14, 10, 1, 'woodD', { plain:true });
    barrel(s, 24, 16, 1); barrel(s, 28, 18, 1);
    signpost(s, 20, 4, 0, 11, 'tileB');
    return s;
  });
  reg('towns', 'ic_tavern_mountain', 'Taverna · Dağ hanı', 'Tavern · Mountain lodge', function () {
    var s = S(); s.pad(20, 18, 32, 'dirt');
    hut(s, 2, 6, 20, 16, 12, 'stoneD', 'thatch', { win:2 });
    chimney(s, 3, 7, 12, 7, 'basalt');
    barrel(s, 23, 8, 0);
    tableProp(s, 22, 14, 0);
    return s;
  });

  /* ---- Kütüphane (Library) — 3 varyant ---- */
  reg('towns', 'ic_library_stone', 'Kütüphane · Taş', 'Library · Stone', function () {
    var s = S(); s.pad(20, 18, 32, 'dirt');
    s.box(2, 3, 0, 22, 18, 22, 'stoneW', { win:4, door:true, doorH:0.65 });
    s.hip(0, 1, 22, 26, 22, 10, 'tileD');
    s.dome(13, 12, 32, 4.5, 5, 'tileD');
    return s;
  });
  reg('towns', 'ic_library_wood', 'Kütüphane · Ahşap, tırmanan merdiven', 'Library · Timber, external stair', function () {
    var s = S(); s.pad(19, 17, 30, 'dirt');
    hut(s, 2, 3, 22, 17, 17, 'wood', 'tileG', { win:3 });
    s.box(24, 4, 0, 5, 3, 1, 'woodD', { plain:true });
    s.box(24, 4, 8, 5, 3, 1, 'woodD', { plain:true });
    s.box(28, 5, 0, 1, 1, 17, 'woodD', { plain:true });
    return s;
  });
  reg('towns', 'ic_library_grand', 'Kütüphane · Büyük, kubbeli', 'Library · Grand, domed', function () {
    var s = S(); s.pad(26, 24, 44, 'dirt');
    s.box(2, 3, 0, 30, 22, 20, 'stoneW', { win:5, door:true, doorH:0.6 });
    s.dome(17, 14, 20, 12, 13, 'gold');
    s.box(-2, 8, 0, 4, 10, 16, 'stoneW', { plain:true });
    s.box(30, 8, 0, 4, 10, 16, 'stoneW', { plain:true });
    return s;
  });

  /* ---- Çeşme / Kuyu (Fountain / Well) ---- */
  reg('misc', 'ic_well_covered', 'Kuyu · Çatılı', 'Well · Covered', function () {
    var s = S(); s.pad(12, 11, 20, 'grass');
    s.cyl(10, 9, 0, 5, 5, 'stone');
    s.box(4, 3, 5, 1.4, 1.4, 9, 'wood', { plain:true });
    s.box(15, 3, 5, 1.4, 1.4, 9, 'wood', { plain:true });
    s.box(4, 14, 5, 1.4, 1.4, 9, 'wood', { plain:true });
    s.box(15, 14, 5, 1.4, 1.4, 9, 'wood', { plain:true });
    s.hip(2, 1, 14, 17, 15, 6, 'tileR');
    return s;
  });
  reg('misc', 'ic_well_plain', 'Kuyu · Sade', 'Well · Plain', function () {
    var s = S(); s.pad(10, 9, 16, 'grass');
    s.cyl(8, 7, 0, 4.5, 4, 'stoneD');
    s.box(2, 2, 4, 1, 1, 6, 'woodD', { plain:true });
    s.box(13, 2, 4, 1, 1, 6, 'woodD', { plain:true });
    s.box(2, 2, 10, 12, 1, 1, 'woodD', { plain:true });
    return s;
  });
  reg('misc', 'ic_fountain_plaza', 'Çeşme · Meydan', 'Fountain · Plaza', function () {
    var s = S(); s.pad(16, 15, 26, 'stoneW');
    s.cyl(14, 13, 0, 13, 2.4, 'stoneW');
    s.cyl(14, 13, 2.4, 8, 3, 'stoneW');
    s.cyl(14, 13, 5.4, 4.5, 4, 'ice');
    s.cyl(14, 13, 9.4, 1.4, 4, 'stoneW');
    return s;
  });
  reg('misc', 'ic_fountain_grand', 'Çeşme · Süslü, heykelli', 'Fountain · Ornate, statued', function () {
    var s = S(); s.pad(20, 19, 34, 'stoneW');
    s.cyl(18, 17, 0, 17, 2.6, 'stoneW');
    s.cyl(18, 17, 2.6, 10, 3.4, 'stoneW');
    s.cyl(18, 17, 6, 6, 4.4, 'ice');
    s.cyl(18, 17, 10.4, 2.4, 6, 'stoneW');
    s.box(15.5, 14.5, 16.4, 5, 5, 5, 'gold');
    return s;
  });

  /* ---- Pazar tezgâhı (Market stall) — 4 tente rengi ---- */
  [['tileR', 'Kızıl', 'Crimson'], ['tileB', 'Mavi', 'Blue'],
   ['tileG', 'Yeşil', 'Green'], ['canvasT', 'Bej', 'Canvas']].forEach(function (m, i) {
    reg('misc', 'ic_stall_' + i, 'Pazar tezgâhı · ' + m[1], 'Market stall · ' + m[2], function () {
      var s = S(); s.pad(13, 9, 18, 'dirt');
      s.box(1, 1, 0, 11, 6, 3.4, 'wood', { plain:true });
      s.box(1, 1, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
      s.box(11, 1, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
      s.box(1, 6, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
      s.box(11, 6, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
      s.gable(-1, -1, 10, 15, 9, 4.5, m[0]);
      return s;
    });
  });

  /* ---- Demirci (Blacksmith) — 2 varyant ---- */
  reg('towns', 'ic_smithy', 'Demirci', 'Blacksmith', function () {
    var s = S(); s.pad(18, 16, 30, 'dirt');
    hut(s, 2, 4, 18, 14, 12, 'stoneD', 'tileD', { win:1 });
    chimney(s, 3, 5, 12, 9, 'basalt');
    s.box(21, 5, 0, 6, 5, 1, 'basalt', { plain:true });
    s.box(21, 5, 1, 2, 2, 1, 'tileR', { plain:true });
    return s;
  });
  reg('towns', 'ic_smithy_open', 'Demirci · Açık ocaklı', 'Blacksmith · Open forge', function () {
    var s = S(); s.pad(18, 16, 28, 'dirt');
    s.box(2, 4, 0, 16, 12, 8, 'woodD', { plain:true });
    s.hip(0, 2, 8, 20, 16, 6, 'tileD');
    chimney(s, 4, 5, 8, 8, 'stoneD');
    s.box(6, 8, 0, 4, 4, 1.4, 'tileR', { plain:true });
    return s;
  });

  /* ---- Fırın (Bakery) — 2 varyant ---- */
  reg('towns', 'ic_bakery', 'Fırın', 'Bakery', function () {
    var s = S(); s.pad(18, 16, 28, 'dirt');
    hut(s, 2, 4, 18, 14, 12, 'stoneW', 'tileR', { win:2 });
    chimney(s, 4, 5, 12, 8, 'stone');
    s.cyl(20, 10, 0, 4, 5, 'stoneD');
    s.dome(20, 10, 5, 4.2, 3, 'stoneD');
    return s;
  });
  reg('towns', 'ic_bakery_stall', 'Fırın · Tezgâhlı', 'Bakery · With stall', function () {
    var s = S(); s.pad(20, 17, 32, 'dirt');
    hut(s, 2, 4, 16, 13, 11, 'adobeW', 'tileD', { win:1 });
    chimney(s, 3, 5, 11, 7, 'stoneD');
    s.box(18, 5, 0, 8, 4, 2.6, 'wood', { plain:true });
    s.gable(17, 3, 2.6, 10, 8, 3.6, 'canvasT');
    return s;
  });

  /* ---- Şehir köprüsü (Town bridge) — nehir/kanal üzerine tek parça ---- */
  reg('passes', 'iq_stonebridge', 'Taş köprü', 'Stone bridge', function () {
    var s = S(); s.pad(30, 12, 40, 'dirt');
    s.box(0, 4, 6, 56, 8, 2, 'stoneW', { plain:true });
    s.box(0, 3, 8, 56, 1, 2.4, 'stoneW', { plain:true });
    s.box(0, 9, 8, 56, 1, 2.4, 'stoneW', { plain:true });
    s.box(6, 5.5, 0, 6, 5, 6, 'stoneD', { plain:true });
    s.box(24, 5.5, 0, 6, 5, 6, 'stoneD', { plain:true });
    s.box(42, 5.5, 0, 6, 5, 6, 'stoneD', { plain:true });
    return s;
  });
  reg('passes', 'iq_plankbridge', 'Tahta köprü', 'Plank bridge', function () {
    var s = S(); s.pad(26, 10, 34, 'dirt');
    s.box(0, 4, 3, 48, 6, 1, 'wood', { plain:true });
    s.box(0, 3.5, 4, 48, 0.8, 2, 'woodD', { plain:true });
    s.box(0, 9.7, 4, 48, 0.8, 2, 'woodD', { plain:true });
    s.box(4, 5.5, 0, 2, 2, 3, 'woodD', { plain:true });
    s.box(42, 5.5, 0, 2, 2, 3, 'woodD', { plain:true });
    return s;
  });

  /* ============================================================
     10b) HAN / TAVERNA / KÜTÜPHANE — 5 zenginlik × 5 kültür matrisi
     Envanterde işaret edilen asıl boşluk: bu üç bina tipinin sadece
     2-3 el yapımı varyantı vardı. Ortak bir CULTURE(5)×TIER(5) ızgara
     ile 25'e tamamlanıyor — Ev'deki aynı iki eksen (bkz. §2) burada
     GEOMETRİYE de yansıtılıyor (sadece etiket değil): kültür duvar+
     çatı imzasını, katman ölçek+aksan malzemesini belirliyor.
     ============================================================ */
  var CIVIC_CULTURE = [
    { key:'western', tr:'Batı Avrupa',      en:'Western',       wall:'wood',    roof:'tileR' },
    { key:'med',      tr:'Akdeniz / D.Doğu', en:'Mediterranean', wall:'adobeW',  roof:'tileD' },
    { key:'north',    tr:'Kuzey',            en:'Northern',      wall:'woodD',   roof:'snow'  },
    { key:'east',     tr:'Doğu Asya',        en:'East Asian',    wall:'bambooW', roof:'lacquerR' },
    { key:'stone',    tr:'Taş Kültürü',      en:'Stonecraft',    wall:'stone',   roof:'tileB' }
  ];
  var CIVIC_TIER = [
    { n:1, tr:'Yoksul',   en:'Poor',        scale:0.82, accent:null },
    { n:2, tr:'Sıradan',  en:'Common',      scale:1.0,  accent:null },
    { n:3, tr:'Müreffeh', en:'Comfortable', scale:1.12, accent:'tileB' },
    { n:4, tr:'Zengin',   en:'Wealthy',     scale:1.28, accent:'stoneW' },
    { n:5, tr:'Soylu',    en:'Noble',       scale:1.45, accent:'gold' }
  ];
  function civicLabel(base, baseEn, cul, tier) {
    return {
      tr: base + ' · ' + tier.n + '.' + tier.tr + ' · ' + cul.tr,
      en: baseEn + ' · ' + tier.n + '.' + tier.en + ' · ' + cul.en
    };
  }

  function innScene(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(22 * sc), dp = Math.round(17 * sc), h = Math.round(13 * sc);
    var wallMat = tier.n >= 4 ? 'stoneW' : cul.wall;
    s.pad(w, dp, w + dp);
    hut(s, 2, 4, w, dp, h, wallMat, cul.roof, { win: tier.n >= 3 ? 4 : 2 });
    chimney(s, 4, 5, h, 6 + sc * 2, tier.accent || 'stoneD');
    signpost(s, w + 3, 8, 0, 9 + sc * 3, tier.accent || cul.roof);
    if (tier.n >= 4) {
      s.box(w + 2, 6, 0, Math.round(7 * sc), Math.round(dp * 0.55), Math.round(h * 0.72), wallMat, { win:1 });
      s.hip(w, 5, Math.round(h * 0.72), Math.round(11 * sc), Math.round(dp * 0.55) + 4, Math.round(h * 0.4), cul.roof);
    }
    return s;
  }
  function tavernScene(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(19 * sc), dp = Math.round(15 * sc), h = Math.round(12 * sc);
    var wallMat = tier.n >= 4 ? 'stoneW' : cul.wall;
    s.pad(w, dp, w + dp);
    hut(s, 2, 6, w, dp, h, wallMat, cul.roof, { win:2 });
    chimney(s, 4, 7, h, 6, tier.accent || 'stone');
    barrel(s, w + 2, 8, 0);
    barrel(s, w + 5, 11, 0);
    tableProp(s, w + 2, 16, 0);
    signpost(s, w, 4, 0, 10, tier.accent || cul.roof);
    if (tier.n <= 2) { s.box(w + 1, 15, 0, 5, 4, 3, 'woodD', { plain:true }); } /* yoksul: fıçı istifi */
    return s;
  }
  function libraryScene(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(19 * sc), dp = Math.round(15 * sc), h = Math.round(17 * sc);
    var wallMat = tier.n >= 3 ? 'stoneW' : cul.wall;
    s.pad(w, dp, w + dp + h);
    s.box(2, 3, 0, w, dp, h, wallMat, { win:4, door:true, doorH:0.6 });
    s.hip(0, 1, h, w + 4, dp + 4, Math.round(h * 0.42), cul.roof);
    s.dome(w / 2 + 1, dp / 2, h + Math.round(h * 0.42), Math.max(3, w * 0.17), Math.max(3, w * 0.17), tier.accent || 'gold');
    if (tier.n >= 4) {
      s.box(-2, 5, 0, 4, Math.round(dp * 0.6), Math.round(h * 0.85), wallMat, { plain:true });
      s.box(w + 2, 5, 0, 4, Math.round(dp * 0.6), Math.round(h * 0.85), wallMat, { plain:true });
    }
    return s;
  }

  CIVIC_CULTURE.forEach(function (cul) {
    CIVIC_TIER.forEach(function (tier) {
      var idSuf = cul.key + '_' + tier.n;
      var lIn = civicLabel('Han', 'Inn', cul, tier);
      reg('towns', 'ic_inn_' + idSuf, lIn.tr, lIn.en, function () { return innScene(cul, tier); });
      var lTv = civicLabel('Taverna', 'Tavern', cul, tier);
      reg('towns', 'ic_tavern_' + idSuf, lTv.tr, lTv.en, function () { return tavernScene(cul, tier); });
      var lLb = civicLabel('Kütüphane', 'Library', cul, tier);
      reg('towns', 'ic_library_' + idSuf, lLb.tr, lLb.en, function () { return libraryScene(cul, tier); });
    });
  });

  /* ============================================================
     10a) KÜÇÜK TAPINAK / KUYU / PAZAR TEZGÂHI — aynı matris, daha
     küçük ölçekli sivil yapılar için 3-katmanlı (yoksul/sıradan/soylu)
     alt küme kullanılıyor (küçük bir objenin 5 tam katmana ihtiyacı yok).
     ============================================================ */
  var CIVIC_TIER3 = [CIVIC_TIER[0], CIVIC_TIER[2], CIVIC_TIER[4]]; /* 1, 3, 5 */

  function shrineScene(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(13 * sc), dp = Math.round(11 * sc), h = Math.round(10 * sc);
    var wallMat = tier.n >= 4 ? 'stoneW' : cul.wall;
    s.pad(w, dp, w + dp + h);
    s.box(2, 2, 0, w, dp, h, wallMat, { door:true, doorH:0.72, win:1 });
    s.gable(0, 0, h, w + 4, dp + 4, Math.round(h * 0.75), cul.roof);
    s.box(w / 2, dp / 2, h + Math.round(h * 0.75), 1.3, 1.3, Math.round(4 * sc), tier.accent || 'gold');
    return s;
  }
  CIVIC_CULTURE.forEach(function (cul) {
    CIVIC_TIER.forEach(function (tier) {
      var l = civicLabel('Küçük tapınak', 'Small shrine', cul, tier);
      reg('temples', 'ip_shrine_' + cul.key + '_' + tier.n, l.tr, l.en, function () { return shrineScene(cul, tier); });
    });
  });

  function wellScene(cul, tier) {
    var s = S(), sc = tier.scale;
    var r = Math.round(4.5 * sc * 10) / 10;
    var wallMat = tier.n >= 4 ? 'stoneW' : 'stoneD';
    s.pad(r * 2.5, r * 2.2, r * 4);
    s.cyl(r + 2, r + 1, 0, r, 4, wallMat);
    if (tier.n >= 2) {
      s.box(2, 2, 4, 1.2, 1.2, 7, cul.wall, { plain:true });
      s.box(2 + r * 2 - 2, 2, 4, 1.2, 1.2, 7, cul.wall, { plain:true });
      s.hip(0, 0, 11, r * 2 + 4, r * 2 + 2, 4, cul.roof);
    }
    return s;
  }
  CIVIC_CULTURE.forEach(function (cul) {
    CIVIC_TIER3.forEach(function (tier) {
      var l = civicLabel('Kuyu', 'Well', cul, tier);
      reg('misc', 'ic_well_' + cul.key + '_' + tier.n, l.tr, l.en, function () { return wellScene(cul, tier); });
    });
  });

  function stallScene2(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(11 * sc), dp = Math.round(6 * sc);
    s.pad(w + 2, dp + 3, w + dp);
    s.box(1, 1, 0, w, dp, 3.4, cul.wall, { plain:true });
    s.box(1, 1, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
    s.box(w, 1, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
    s.box(1, dp, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
    s.box(w, dp, 3.4, 1, 1, 6.6, 'woodD', { plain:true });
    s.gable(-1, -1, 10, w + 4, dp + 4, 4.5, cul.roof);
    if (tier.n >= 4) s.flag(w + 2, 1, 10, 5, tier.accent || cul.roof);
    return s;
  }
  CIVIC_CULTURE.forEach(function (cul) {
    CIVIC_TIER3.forEach(function (tier) {
      var l = civicLabel('Pazar tezgâhı', 'Market stall', cul, tier);
      reg('misc', 'ic_stall2_' + cul.key + '_' + tier.n, l.tr, l.en, function () { return stallScene2(cul, tier); });
    });
  });

  /* ============================================================
     10a-2) DEMİRCİ / FIRIN / DEĞİRMEN / AMBAR — zanaat/ekonomi
     binaları, 3-katmanlı alt küme.
     ============================================================ */
  function smithyScene2(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(15 * sc), dp = Math.round(12 * sc), h = Math.round(9 * sc);
    var wallMat = tier.n >= 4 ? 'stoneW' : cul.wall;
    s.pad(w, dp, w + dp);
    hut(s, 2, 4, w, dp, h, wallMat, cul.roof, { win:1 });
    chimney(s, 4, 5, h, 7 + sc * 2, 'basalt');
    s.box(w + 3, 5, 0, 5, 4, 1, 'basalt', { plain:true });
    s.box(w + 3, 5, 1, 1.6, 1.6, 1, tier.accent || 'tileR', { plain:true });
    return s;
  }
  function bakeryScene2(cul, tier) {
    var s = S(), sc = tier.scale;
    var w = Math.round(15 * sc), dp = Math.round(12 * sc), h = Math.round(9 * sc);
    var wallMat = tier.n >= 4 ? 'stoneW' : cul.wall;
    s.pad(w, dp, w + dp);
    hut(s, 2, 4, w, dp, h, wallMat, cul.roof, { win:2 });
    chimney(s, 4, 5, h, 7, 'stone');
    s.cyl(w + 2, 6, 0, 3.5, 4, 'stoneD');
    s.dome(w + 2, 6, 4, 3.7, 2.6, 'stoneD');
    return s;
  }
  CIVIC_CULTURE.forEach(function (cul) {
    CIVIC_TIER3.forEach(function (tier) {
      var lS = civicLabel('Demirci', 'Blacksmith', cul, tier);
      reg('towns', 'ic_smithy2_' + cul.key + '_' + tier.n, lS.tr, lS.en, function () { return smithyScene2(cul, tier); });
      var lB = civicLabel('Fırın', 'Bakery', cul, tier);
      reg('towns', 'ic_bakery2_' + cul.key + '_' + tier.n, lB.tr, lB.en, function () { return bakeryScene2(cul, tier); });
    });
  });

  function millScene(cul, kind) {
    var s = S();
    if (kind === 'wind') {
      s.pad(16, 16, 32);
      s.cyl(11, 10, 0, 6.5, 17, cul.wall);
      s.cone(11, 10, 17, 7, 6, cul.roof);
      s.box(10.2, -3, 21, 1.6, 26, 0.9, 'woodD', { plain:true });
      s.box(-2, 9.2, 21, 26, 1.6, 0.9, 'woodD', { plain:true });
    } else {
      s.pad(20, 15, 32);
      hut(s, 2, 4, 16, 12, 11, cul.wall, cul.roof, { win:1 });
      s.cyl(19, 6, 4, 4.4, 1.2, 'woodD');
      s.box(22.4, 5, 0, 1, 3, 9, 'woodD', { plain:true });
    }
    return s;
  }
  CIVIC_CULTURE.forEach(function (cul) {
    ['wind', 'water'].forEach(function (kind) {
      var base = kind === 'wind' ? ['Yel değirmeni', 'Windmill'] : ['Su değirmeni', 'Watermill'];
      reg('mines', 'ic_mill_' + cul.key + '_' + kind,
        base[0] + ' · ' + cul.tr, base[1] + ' · ' + cul.en,
        function () { return millScene(cul, kind); });
    });
  });

  function granaryScene(cul, big) {
    var s = S();
    var w = big ? 22 : 15, dp = big ? 17 : 12, h = big ? 12 : 9;
    s.pad(w, dp, w + dp);
    s.box(2, 3, 0, w, dp, h, cul.wall, { win:0 });
    s.hip(0, 1, h, w + 4, dp + 4, Math.round(h * 0.55), cul.roof);
    s.box(4, 4, 0, 1, 1, h, 'woodD', { plain:true });
    s.box(w - 1, dp + 1, 0, 1, 1, h, 'woodD', { plain:true });
    return s;
  }
  CIVIC_CULTURE.forEach(function (cul) {
    [['small', false, 'Küçük', 'Small'], ['large', true, 'Büyük', 'Large']].forEach(function (sz) {
      reg('mines', 'ic_granary_' + cul.key + '_' + sz[0],
        'Ambar · ' + sz[2] + ' · ' + cul.tr, 'Granary · ' + sz[3] + ' · ' + cul.en,
        function () { return granaryScene(cul, sz[1]); });
    });
  });

  /* ============================================================
     10a-3) BAĞIMSIZ KAPI KULESİ + KÜLTÜREL KÖPRÜ VARYANTLARI
     ============================================================ */
  WALL_MATS.forEach(function (m, i) {
    reg('castles', 'ik_freegate_' + i, 'Kapı kulesi · ' + m[1], 'Gate tower · ' + m[2], function () {
      var s = S(); s.pad(24, 14, 42, 'dirt');
      wall(s, 0, 6, 0, 16, 12, 15, m[0]);
      wall(s, 32, 6, 0, 16, 12, 15, m[0]);
      s.box(14, 3, 0, 20, 18, 21, m[0], { door:true, doorH:0.66, slit:2 });
      s.crenel(12, 1, 21, 24, 22, 5, 7, m[0]);
      return s;
    });
    reg('castles', 'ik_freegate_grand_' + i, 'Kapı kulesi · Kuleli, ' + m[1], 'Gate tower · Twin-towered, ' + m[2], function () {
      var s = S(); s.pad(30, 18, 50, 'dirt');
      wall(s, 0, 8, 0, 14, 12, 16, m[0]);
      wall(s, 36, 8, 0, 14, 12, 16, m[0]);
      s.box(13, 4, 0, 24, 20, 22, m[0], { door:true, doorH:0.6, slit:2 });
      s.crenel(11, 2, 22, 28, 24, 5, 7, m[0]);
      towerSq(s, 8, -2, 0, 10, 32, m[0], { roof:false, slit:2 });
      towerSq(s, 32, -2, 0, 10, 32, m[0], { roof:false, slit:2 });
      return s;
    });
  });

  CIVIC_CULTURE.forEach(function (cul) {
    reg('passes', 'iq_culturebridge_' + cul.key, 'Köprü · ' + cul.tr, 'Bridge · ' + cul.en, function () {
      var s = S(); s.pad(28, 11, 38, 'dirt');
      s.box(0, 4, 5, 52, 7, 1.6, cul.wall, { plain:true });
      s.box(0, 3.4, 6.6, 52, 0.9, 2, cul.wall === 'stone' ? 'stoneD' : 'woodD', { plain:true });
      s.box(0, 9.7, 6.6, 52, 0.9, 2, cul.wall === 'stone' ? 'stoneD' : 'woodD', { plain:true });
      s.box(5, 5.5, 0, 5, 4, 5, cul.roof, { plain:true });
      s.box(40, 5.5, 0, 5, 4, 5, cul.roof, { plain:true });
      return s;
    });
  });

  /* ============================================================
     10) FANTEZİ IRK KÜLTÜRLERİ (cüce, elf, ork/goblin, küçük halk,
     cin ustası) — jenerik fantazya arketipleri (Tolkien'den beri
     ortak kültürel malzeme, tek bir esere ait değil); herhangi bir
     oyun/kitap serisinin özel isim/yer/canavar referansı YOK, sadece
     benzer DOKU: mimari biçim + malzeme + ölçek. Her ırk kendi
     içinde birkaç ekonomik/işlevsel varyantla geliyor (mevcut
     "cultures" kategorisindeki ix_orcfort/ix_mountaintribe ile aynı
     jenerik yaklaşım).
     ============================================================ */

  /* ---- Cüce: dağa oyulmuş taş ev — 3 varyant ---- */
  reg('cultures', 'ix_dwarfhouse_stone', 'Cüce evi · Kayaya oyulmuş', 'Dwarf house · Rock-hewn', function () {
    var s = S(); s.pad(20, 18, 30, 'stoneD');
    s.rock(0, 2, 0, 16, 15, 'stoneD');
    s.box(2, 4, 0, 18, 14, 10, 'granite', { door:true, doorH:0.5, win:1 });
    s.hip(0, 2, 10, 22, 18, 5, 'stoneD');
    return s;
  });
  reg('cultures', 'ix_dwarfhouse_forge', 'Cüce evi · Demirci ocaklı', 'Dwarf house · Forge-hall', function () {
    var s = S(); s.pad(22, 19, 34, 'stoneD');
    s.rock(0, 2, 0, 17, 16, 'basalt');
    s.box(2, 4, 0, 19, 14, 11, 'basalt', { door:true, doorH:0.5, win:1 });
    s.hip(0, 2, 11, 23, 18, 5, 'stoneD');
    chimney(s, 4, 5, 11, 8, 'basalt');
    s.box(4, 6, 11, 2, 2, 1.4, 'tileR', { plain:true });
    return s;
  });
  reg('cultures', 'ix_dwarfhouse_hall', 'Cüce evi · Büyük salon', 'Dwarf house · Great hall', function () {
    var s = S(); s.pad(28, 24, 42, 'stoneD');
    s.rock(0, 2, 0, 22, 20, 'granite');
    s.box(2, 4, 0, 26, 18, 14, 'stoneW', { door:true, doorH:0.55, win:2 });
    s.hip(0, 2, 14, 30, 22, 7, 'stoneD');
    s.flag(28, 6, 14, 10, 'tileB');
    s.flag(4, 6, 14, 10, 'tileB');
    return s;
  });

  /* ---- Elf: ağaçla bütünleşik yüksek konut — 3 varyant ---- */
  reg('cultures', 'ix_elfhouse_canopy', 'Elf evi · Yeşil tepeli', 'Elf dwelling · Green canopy', function () {
    var s = S(); s.pad(20, 18, 32, 'grass');
    s.tree(3, 3, 0, 32, 'round', 'tileG');
    s.box(7, 6, 15, 7, 7, 5, 'bambooW', { win:1 });
    s.dome(10, 9, 20, 9, 8, 'tileG');
    return s;
  });
  reg('cultures', 'ix_elfhouse_autumn', 'Elf evi · Sonbahar tepeli', 'Elf dwelling · Autumn canopy', function () {
    var s = S(); s.pad(20, 18, 32, 'grass');
    s.tree(3, 3, 0, 30, 'round', 'tileR');
    s.box(7, 6, 14, 7, 7, 5, 'wood', { win:1 });
    s.dome(10, 9, 19, 8.5, 7.5, 'tileR');
    return s;
  });
  reg('cultures', 'ix_elfhouse_moonlit', 'Elf evi · Ay ışığı, gümüşi', 'Elf dwelling · Moonlit silver', function () {
    var s = S(); s.pad(22, 20, 36, 'grass');
    s.tree(3, 3, 0, 34, 'round', 'ice');
    s.box(7, 6, 16, 8, 8, 6, 'stoneW', { win:2 });
    s.dome(11, 10, 22, 10, 9, 'ice');
    s.flag(4, 4, 20, 8, 'ice');
    return s;
  });

  /* ---- Ork/Goblin: derme çatma kulübe — 3 varyant ---- */
  reg('cultures', 'ix_orcshanty_common', 'Ork kulübesi', 'Orc shanty', function () {
    var s = S(); s.pad(18, 16, 28, 'dirt');
    s.box(2, 3, 0, 16, 12, 9, 'woodD', { door:true, win:1 });
    s.box(1, 2, 9, 18, 14, 1, 'hide', { plain:true });
    return s;
  });
  reg('cultures', 'ix_orcshanty_warband', 'Ork kulübesi · Savaş kampı', 'Orc shanty · Warband camp', function () {
    var s = S(); s.pad(22, 18, 32, 'dirt');
    s.box(2, 3, 0, 16, 12, 9, 'woodD', { door:true, win:1 });
    s.box(1, 2, 9, 18, 14, 1, 'dark', { plain:true });
    s.box(20, 4, 0, 2, 2, 13, 'bone', { plain:true });
    s.flag(20.3, 4.3, 11.5, 6, 'dark');
    return s;
  });
  reg('cultures', 'ix_orcshanty_scrap', 'Ork kulübesi · Hurda yığını', 'Orc shanty · Scrap heap', function () {
    var s = S(); s.pad(20, 17, 30, 'dirt');
    s.box(2, 3, 0, 15, 11, 8, 'woodD', { door:true });
    s.box(1, 2, 8, 17, 13, 1, 'hide', { plain:true });
    s.rock(17, 8, 0, 6, 5, 'stoneD');
    s.box(19, 9, 5, 1.4, 1.4, 4, 'woodD', { plain:true });
    return s;
  });

  /* ---- Küçük halk: toprağa gömülü, yuvarlak kapılı ev — 3 varyant ---- */
  reg('cultures', 'ix_burrow_meadow', 'Küçük halk evi · Çayır', 'Little-folk burrow · Meadow', function () {
    var s = S(); s.pad(18, 16, 26, 'grass');
    s.dome(9, 8, 0, 11, 7, 'grass');
    s.cyl(6, 6, 0, 2.6, 0.6, 'wood');
    s.box(8.4, 6, 0, 0.8, 0.8, 4, 'woodD', { plain:true });
    return s;
  });
  reg('cultures', 'ix_burrow_orchard', 'Küçük halk evi · Meyve bahçeli', 'Little-folk burrow · Orchard', function () {
    var s = S(); s.pad(22, 19, 32, 'grass');
    s.dome(9, 8, 0, 11, 7, 'grass');
    s.cyl(6, 6, 0, 2.6, 0.6, 'woodD');
    s.tree(19, 12, 0, 14, 'round', 'tileG');
    return s;
  });
  reg('cultures', 'ix_burrow_grand', 'Küçük halk evi · Konak', 'Little-folk burrow · Manor', function () {
    var s = S(); s.pad(26, 22, 38, 'grass');
    s.dome(12, 10, 0, 14, 9, 'grass');
    s.cyl(8, 7.5, 0, 3.4, 0.7, 'gold');
    s.box(7.2, 7.5, 0, 1, 1, 5, 'stoneW', { plain:true });
    s.box(15.8, 7.5, 0, 1, 1, 5, 'stoneW', { plain:true });
    return s;
  });

  /* ---- Cin ustası: küçük atölye kulübesi — 2 varyant ---- */
  reg('cultures', 'ix_gnomehouse_common', 'Cin ustası kulübesi', 'Gnome workshop cottage', function () {
    var s = S(); s.pad(16, 14, 24, 'grass');
    hut(s, 2, 3, 14, 11, 9, 'wood', 'tileB', { win:1 });
    s.cyl(16, 4, 0, 2, 6, 'basalt');
    s.cone(16, 4, 6, 2.3, 3, 'tileD');
    return s;
  });
  reg('cultures', 'ix_gnomehouse_workshop', 'Cin ustası kulübesi · Atölye', 'Gnome workshop cottage · Tinker hall', function () {
    var s = S(); s.pad(20, 17, 30, 'grass');
    hut(s, 2, 3, 17, 13, 10, 'stoneW', 'tileB', { win:2 });
    s.cyl(19, 5, 0, 2.4, 8, 'basalt');
    s.cone(19, 5, 8, 2.7, 3.6, 'gold');
    s.box(-2, 5, 0, 2, 2, 5, 'wood', { plain:true });
    return s;
  });

  /* ============================================================
     11) IRK × BİNA TİPİ KESİŞİMLERİ — her ırk için en anlamlı 3-4 bina
     tipi (önce sembol envanteri planı §2'de tartışılan yaklaşım: her
     ırkı her bina tipine zorlamak yerine, hikâye açısından güçlü
     kesişimler). Aynı jenerik/isimsiz yaklaşım (§10) devam ediyor.
     ============================================================ */

  /* ---- Cüce: demirci, kule, han, köprü ---- */
  reg('cultures', 'ix_dwarf_smithy', 'Cüce demircisi', 'Dwarf smithy', function () {
    var s = S(); s.pad(20, 17, 32, 'stoneD');
    s.rock(0, 2, 0, 15, 14, 'basalt');
    s.box(2, 4, 0, 17, 13, 10, 'basalt', { door:true, doorH:0.5 });
    s.hip(0, 2, 10, 21, 17, 5, 'stoneD');
    chimney(s, 4, 5, 10, 9, 'basalt');
    s.box(19, 6, 0, 5, 4, 1, 'basalt', { plain:true });
    s.box(19, 6, 1, 1.6, 1.6, 1, 'tileR', { plain:true });
    return s;
  });
  reg('cultures', 'ix_dwarf_tower', 'Cüce dağ kulesi', 'Dwarf mountain tower', function () {
    var s = S(); s.pad(18, 16, 34, 'stoneD');
    s.rock(0, 2, 0, 15, 30, 'granite');
    towerSq(s, 3, 3, 0, 15, 26, 'basalt', { roof:false, slit:2, crenel:true });
    return s;
  });
  reg('cultures', 'ix_dwarf_hall', 'Cüce bira locali', 'Dwarf mead hall', function () {
    var s = S(); s.pad(22, 19, 34, 'stoneD');
    hut(s, 2, 6, 20, 15, 12, 'granite', 'stoneD', { win:1 });
    chimney(s, 4, 7, 12, 8, 'basalt');
    barrel(s, 23, 8, 0); barrel(s, 26, 11, 0);
    return s;
  });
  reg('cultures', 'ix_dwarf_bridge', 'Cüce taş köprüsü', 'Dwarf stone bridge', function () {
    var s = S(); s.pad(26, 11, 36, 'dirt');
    s.box(0, 4, 5, 48, 7, 2, 'granite', { plain:true });
    s.box(0, 3.4, 7, 48, 0.9, 2.2, 'stoneD', { plain:true });
    s.box(0, 9.7, 7, 48, 0.9, 2.2, 'stoneD', { plain:true });
    s.box(5, 5.5, 0, 6, 4, 5, 'basalt', { plain:true });
    s.box(37, 5.5, 0, 6, 4, 5, 'basalt', { plain:true });
    return s;
  });

  /* ---- Elf: kütüphane, mabet, han, köprü ---- */
  reg('cultures', 'ix_elf_library', 'Elf arşiv ağacı', 'Elf archive tree', function () {
    var s = S(); s.pad(20, 18, 36, 'grass');
    s.tree(3, 3, 0, 30, 'round', 'tileG');
    s.dome(11, 10, 16, 10, 9, 'tileG');
    s.box(6, 6, 15, 10, 10, 6, 'bambooW', { win:2 });
    s.box(20, 6, 15, 1, 1, 8, 'woodD', { plain:true });
    return s;
  });
  reg('cultures', 'ix_elf_shrine', 'Elf doğa mabedi', 'Elf nature shrine', function () {
    var s = S(); s.pad(16, 14, 28, 'grass');
    s.tree(11, 10, 0, 22, 'round', 'tileG');
    s.rock(2, 2, 0, 6, 3, 'stoneW');
    s.cyl(3, 3, 3, 3, 1, 'ice');
    return s;
  });
  reg('cultures', 'ix_elf_inn', 'Elf yolcu hanı', 'Elf wayfarer inn', function () {
    var s = S(); s.pad(20, 18, 34, 'grass');
    s.tree(3, 3, 0, 26, 'round', 'tileR');
    s.box(7, 6, 13, 8, 8, 6, 'wood', { win:2 });
    s.dome(11, 10, 19, 9, 7, 'tileR');
    signpost(s, 21, 8, 0, 12, 'tileG');
    return s;
  });
  reg('cultures', 'ix_elf_bridge', 'Elf örgü köprüsü', 'Elf woven bridge', function () {
    var s = S(); s.pad(24, 9, 32, 'dirt');
    s.box(0, 4, 4, 44, 4, 0.8, 'bambooW', { plain:true });
    s.box(0, 3.7, 4.8, 44, 0.6, 2.2, 'woodD', { plain:true });
    s.box(0, 7.7, 4.8, 44, 0.6, 2.2, 'woodD', { plain:true });
    s.tree(2, -2, 0, 16, 'round', 'tileG');
    s.tree(38, 6, 0, 16, 'round', 'tileG');
    return s;
  });

  /* ---- Ork/Goblin: sur, demirci, pazar ---- */
  reg('cultures', 'ix_orc_palisade', 'Ork çiti · Kamp', 'Orc palisade · Camp fence', function () {
    var s = S(); s.pad(24, 10, 40, 'dirt');
    s.palisade(0, 4, 0, 44, 5, 13, 'woodD', { corner:false });
    s.box(46, 5, 0, 2, 2, 15, 'bone', { plain:true });
    s.flag(46.3, 5.3, 12, 6, 'dark');
    return s;
  });
  reg('cultures', 'ix_orc_smithy', 'Ork demircisi · Kaba ocak', 'Orc smithy · Crude forge', function () {
    var s = S(); s.pad(18, 16, 28, 'dirt');
    s.box(2, 4, 0, 15, 12, 8, 'woodD', { door:true });
    s.box(1, 3, 8, 17, 14, 1, 'dark', { plain:true });
    chimney(s, 3, 5, 8, 7, 'stoneD');
    s.box(18, 6, 0, 4, 4, 1, 'basalt', { plain:true });
    s.box(18, 6, 1, 1.4, 1.4, 1, 'tileR', { plain:true });
    return s;
  });
  reg('cultures', 'ix_orc_stall', 'Ork tezgâhı · Çalıntı mal', 'Orc stall · Plundered goods', function () {
    var s = S(); s.pad(14, 9, 20, 'dirt');
    s.box(1, 1, 0, 10, 6, 3, 'woodD', { plain:true });
    s.box(1, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(10, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(1, 6, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(10, 6, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(0, 0, 9, 12, 8, 1, 'hide', { plain:true });
    s.rock(12, 5, 0, 3, 3, 'stoneD');
    return s;
  });

  /* ---- Küçük halk: han, fırın, pazar ---- */
  reg('cultures', 'ix_halfling_inn', 'Küçük halk hanı', 'Little-folk inn', function () {
    var s = S(); s.pad(20, 17, 30, 'grass');
    s.dome(10, 9, 0, 12, 8, 'grass');
    s.cyl(6, 6, 0, 3, 0.7, 'wood');
    signpost(s, 20, 8, 0, 10, 'tileR');
    barrel(s, 19, 12, 0);
    return s;
  });
  reg('cultures', 'ix_halfling_bakery', 'Küçük halk fırını', 'Little-folk bakery', function () {
    var s = S(); s.pad(18, 15, 26, 'grass');
    s.dome(9, 8, 0, 11, 7, 'grass');
    s.cyl(5.5, 5.5, 0, 2.8, 0.6, 'woodD');
    chimney(s, 15, 4, 4, 6, 'stoneD');
    s.cyl(17, 8, 0, 3, 3, 'stoneD');
    s.dome(17, 8, 3, 3.2, 2.2, 'stoneD');
    return s;
  });
  reg('cultures', 'ix_halfling_stall', 'Küçük halk pazar tezgâhı', 'Little-folk market stall', function () {
    var s = S(); s.pad(12, 8, 16, 'grass');
    s.box(1, 1, 0, 9, 5, 3, 'wood', { plain:true });
    s.box(1, 1, 3, 1, 1, 5, 'woodD', { plain:true });
    s.box(9, 1, 3, 1, 1, 5, 'woodD', { plain:true });
    s.box(1, 5, 3, 1, 1, 5, 'woodD', { plain:true });
    s.box(9, 5, 3, 1, 1, 5, 'woodD', { plain:true });
    s.gable(-1, -1, 8, 13, 7, 3.5, 'tileG');
    return s;
  });

  /* ---- Cin ustası: değirmen, atölye-kütüphane, pazar ---- */
  reg('cultures', 'ix_gnome_mill', 'Cin dişli değirmeni', 'Gnome gear mill', function () {
    var s = S(); s.pad(14, 14, 28, 'grass');
    s.cyl(9, 8, 0, 6, 14, 'stoneW');
    s.cone(9, 8, 14, 6.4, 5, 'tileD');
    s.cyl(9, 8, 16, 1, 3, 'gold');
    s.box(8.2, -2, 20, 1.6, 22, 1, 'basalt', { plain:true });
    s.box(-2, 7.2, 20, 22, 1.6, 1, 'basalt', { plain:true });
    return s;
  });
  reg('cultures', 'ix_gnome_library', 'Cin atölye-kütüphanesi', 'Gnome workshop-library', function () {
    var s = S(); s.pad(18, 15, 28, 'grass');
    s.box(2, 3, 0, 16, 12, 11, 'stoneW', { win:3, door:true, doorH:0.6 });
    s.hip(0, 1, 11, 20, 16, 6, 'tileB');
    s.cyl(18, 5, 0, 2, 8, 'basalt');
    s.cone(18, 5, 8, 2.3, 3, 'gold');
    return s;
  });
  reg('cultures', 'ix_gnome_stall', 'Cin gadget tezgâhı', 'Gnome gadget stall', function () {
    var s = S(); s.pad(13, 9, 18, 'grass');
    s.box(1, 1, 0, 10, 6, 3, 'wood', { plain:true });
    s.box(1, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(10, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.gable(-1, -1, 9, 14, 8, 4, 'tileB');
    s.cyl(11, 6, 0, 1.4, 4, 'basalt');
    s.cone(11, 6, 4, 1.6, 2, 'gold');
    return s;
  });

  /* ============================================================
     12) IRK × BİNA — "ZENGİN" EŞLENİKLER
     Envanter raporunda işaret edilen tutarsızlık: medeni binalar
     (han/taverna/kütüphane) 25 varyant derinliğindeyken §11'deki 17
     ırk kesişimi tek örnekti. Her birine büyük/gösterişli bir eşlenik
     eklendi — tam 25'lik ızgara değil (çoğu ırk kesişimi tekil bir
     "yer imi" niteliğinde, ev gibi tekrar tekrar dizilmiyor) ama en
     azından sıradan/zengin ayrımı her tipte var artık.
     ============================================================ */
  reg('cultures', 'ix_dwarf_smithy_grand', 'Cüce demircisi · Büyük ocaklı', 'Dwarf smithy · Grand forge', function () {
    var s = S(); s.pad(26, 21, 40, 'stoneD');
    s.rock(0, 2, 0, 19, 17, 'basalt');
    s.box(2, 4, 0, 22, 16, 12, 'basalt', { door:true, doorH:0.5, win:1 });
    s.hip(0, 2, 12, 26, 20, 6, 'stoneD');
    chimney(s, 5, 6, 12, 11, 'basalt');
    chimney(s, 20, 6, 12, 9, 'basalt');
    s.box(24, 7, 0, 6, 5, 1, 'basalt', { plain:true });
    s.box(24, 7, 1, 2, 2, 1, 'tileR', { plain:true });
    s.flag(2, 18, 12, 10, 'tileR');
    return s;
  });
  reg('cultures', 'ix_dwarf_tower_grand', 'Cüce dağ kulesi · Kalın burçlu', 'Dwarf mountain tower · Fortified', function () {
    var s = S(); s.pad(26, 22, 46, 'stoneD');
    s.rock(0, 2, 0, 20, 40, 'granite');
    towerSq(s, 4, 4, 0, 19, 34, 'basalt', { roof:false, slit:2, crenel:true });
    towerSq(s, 26, 10, 0, 10, 22, 'stoneD', { roof:false, slit:1, crenel:true });
    return s;
  });
  reg('cultures', 'ix_dwarf_hall_grand', 'Cüce bira locali · Büyük salon', 'Dwarf mead hall · Great hall', function () {
    var s = S(); s.pad(28, 24, 42, 'stoneD');
    hut(s, 2, 6, 26, 19, 15, 'granite', 'stoneD', { win:2 });
    chimney(s, 4, 7, 15, 10, 'basalt');
    barrel(s, 29, 8, 0); barrel(s, 32, 11, 0); barrel(s, 29, 15, 0);
    s.flag(4, 22, 15, 10, 'tileB');
    return s;
  });
  reg('cultures', 'ix_dwarf_bridge_grand', 'Cüce taş köprüsü · Kuleli', 'Dwarf stone bridge · Towered', function () {
    var s = S(); s.pad(30, 14, 42, 'dirt');
    s.box(0, 5, 6, 56, 8, 2.4, 'granite', { plain:true });
    s.box(0, 4.2, 8.4, 56, 1, 2.4, 'stoneD', { plain:true });
    s.box(0, 11.2, 8.4, 56, 1, 2.4, 'stoneD', { plain:true });
    towerSq(s, 4, 3, 0, 10, 20, 'basalt', { roof:false, slit:1 });
    towerSq(s, 42, 3, 0, 10, 20, 'basalt', { roof:false, slit:1 });
    return s;
  });

  reg('cultures', 'ix_elf_library_grand', 'Elf arşiv ağacı · Büyük', 'Elf archive tree · Grand', function () {
    var s = S(); s.pad(26, 22, 44, 'grass');
    s.tree(4, 4, 0, 38, 'round', 'tileG');
    s.dome(14, 12, 20, 13, 11, 'tileG');
    s.box(7, 7, 18, 13, 12, 7, 'bambooW', { win:3 });
    s.box(24, 7, 15, 1, 1, 10, 'woodD', { plain:true });
    s.box(24, 20, 15, 1, 1, 10, 'woodD', { plain:true });
    return s;
  });
  reg('cultures', 'ix_elf_shrine_grand', 'Elf doğa mabedi · Kutsal koru', 'Elf nature shrine · Sacred grove', function () {
    var s = S(); s.pad(24, 20, 36, 'grass');
    s.tree(14, 12, 0, 28, 'round', 'tileG');
    s.tree(2, 4, 0, 18, 'round', 'tileG');
    s.tree(24, 6, 0, 18, 'round', 'tileG');
    s.rock(4, 16, 0, 5, 3, 'stoneW');
    s.rock(20, 18, 0, 5, 3, 'stoneW');
    s.cyl(14, 12, 4, 3.5, 1, 'ice');
    return s;
  });
  reg('cultures', 'ix_elf_inn_grand', 'Elf yolcu hanı · Büyük', 'Elf wayfarer inn · Grand', function () {
    var s = S(); s.pad(26, 22, 40, 'grass');
    s.tree(4, 4, 0, 32, 'round', 'tileR');
    s.tree(20, 8, 0, 20, 'round', 'tileG');
    s.box(9, 7, 16, 11, 11, 7, 'wood', { win:3 });
    s.dome(14, 12, 23, 11, 8, 'tileR');
    signpost(s, 27, 10, 0, 14, 'tileG');
    barrel(s, 25, 15, 0);
    return s;
  });
  reg('cultures', 'ix_elf_bridge_grand', 'Elf örgü köprüsü · Fenerli', 'Elf woven bridge · Lantern-lit', function () {
    var s = S(); s.pad(28, 11, 36, 'dirt');
    s.box(0, 4, 4, 50, 4, 0.8, 'bambooW', { plain:true });
    s.box(0, 3.7, 4.8, 50, 0.6, 2.2, 'woodD', { plain:true });
    s.box(0, 7.7, 4.8, 50, 0.6, 2.2, 'woodD', { plain:true });
    s.tree(2, -2, 0, 18, 'round', 'tileG');
    s.tree(42, 6, 0, 18, 'round', 'tileG');
    s.cyl(14, 4, 5, 0.6, 3, 'wood'); s.cone(14, 4, 8, 1.4, 1.6, 'gold');
    s.cyl(34, 4, 5, 0.6, 3, 'wood'); s.cone(34, 4, 8, 1.4, 1.6, 'gold');
    return s;
  });

  reg('cultures', 'ix_orc_palisade_grand', 'Ork çiti · Gözcü kuleli', 'Orc palisade · Watchtower', function () {
    var s = S(); s.pad(28, 14, 46, 'dirt');
    s.palisade(0, 4, 0, 44, 5, 13, 'woodD', { corner:false });
    towerSq(s, 46, 2, 0, 12, 20, 'woodD', { roof:false, crenel:false, slit:1 });
    s.flag(50, 4, 20, 8, 'dark');
    return s;
  });
  reg('cultures', 'ix_orc_smithy_grand', 'Ork demircisi · Savaş ocağı', 'Orc smithy · War forge', function () {
    var s = S(); s.pad(24, 20, 34, 'dirt');
    s.box(2, 4, 0, 20, 15, 10, 'woodD', { door:true });
    s.box(1, 3, 10, 22, 17, 1, 'dark', { plain:true });
    chimney(s, 3, 5, 10, 9, 'stoneD');
    chimney(s, 17, 5, 10, 8, 'stoneD');
    s.box(23, 7, 0, 5, 5, 1, 'basalt', { plain:true });
    s.box(23, 7, 1, 1.6, 1.6, 1, 'tileR', { plain:true });
    s.box(1, 20, 0, 2, 2, 14, 'bone', { plain:true });
    return s;
  });
  reg('cultures', 'ix_orc_stall_grand', 'Ork tezgâhı · Ganimet yığını', 'Orc stall · Spoils cache', function () {
    var s = S(); s.pad(18, 12, 26, 'dirt');
    s.box(1, 1, 0, 13, 7, 3, 'woodD', { plain:true });
    s.box(1, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(13, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(1, 7, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(13, 7, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(0, 0, 9, 15, 9, 1, 'hide', { plain:true });
    s.rock(15, 6, 0, 4, 4, 'stoneD');
    s.rock(15, 2, 0, 3, 3, 'gold');
    return s;
  });

  reg('cultures', 'ix_halfling_inn_grand', 'Küçük halk hanı · Büyük', 'Little-folk inn · Grand', function () {
    var s = S(); s.pad(26, 22, 38, 'grass');
    s.dome(13, 11, 0, 15, 10, 'grass');
    s.cyl(7, 7, 0, 3.4, 0.7, 'wood');
    signpost(s, 26, 10, 0, 12, 'tileR');
    barrel(s, 24, 15, 0); barrel(s, 27, 12, 0);
    chimney(s, 18, 3, 8, 6, 'stoneD');
    return s;
  });
  reg('cultures', 'ix_halfling_bakery_grand', 'Küçük halk fırını · Çift ocaklı', 'Little-folk bakery · Twin ovens', function () {
    var s = S(); s.pad(22, 18, 30, 'grass');
    s.dome(11, 9, 0, 13, 8, 'grass');
    s.cyl(6.5, 6.5, 0, 3.2, 0.6, 'woodD');
    chimney(s, 18, 4, 5, 7, 'stoneD');
    s.cyl(20, 9, 0, 3.4, 3.4, 'stoneD'); s.dome(20, 9, 3.4, 3.6, 2.4, 'stoneD');
    s.cyl(20, 15, 0, 2.6, 2.6, 'stoneD'); s.dome(20, 15, 2.6, 2.8, 1.8, 'stoneD');
    return s;
  });
  reg('cultures', 'ix_halfling_stall_grand', 'Küçük halk pazar tezgâhı · Büyük', 'Little-folk market stall · Grand', function () {
    var s = S(); s.pad(16, 11, 20, 'grass');
    s.box(1, 1, 0, 13, 7, 3, 'wood', { plain:true });
    s.box(1, 1, 3, 1, 1, 5, 'woodD', { plain:true });
    s.box(13, 1, 3, 1, 1, 5, 'woodD', { plain:true });
    s.box(1, 7, 3, 1, 1, 5, 'woodD', { plain:true });
    s.box(13, 7, 3, 1, 1, 5, 'woodD', { plain:true });
    s.gable(-1, -1, 8, 17, 9, 4, 'tileG');
    s.flag(15, 8, 8, 6, 'gold');
    return s;
  });

  reg('cultures', 'ix_gnome_mill_grand', 'Cin dişli değirmeni · Çift kanatlı', 'Gnome gear mill · Twin-vane', function () {
    var s = S(); s.pad(18, 18, 36, 'grass');
    s.cyl(11, 10, 0, 7.5, 18, 'stoneW');
    s.cone(11, 10, 18, 8, 6, 'tileD');
    s.cyl(11, 10, 20, 1.2, 4, 'gold');
    s.box(10, -3, 25, 2, 28, 1.2, 'basalt', { plain:true });
    s.box(-3, 9, 25, 28, 2, 1.2, 'basalt', { plain:true });
    s.box(3, 3, 8, 3, 3, 6, 'wood', { plain:true });
    return s;
  });
  reg('cultures', 'ix_gnome_library_grand', 'Cin atölye-kütüphanesi · Gözlemevi', 'Gnome workshop-library · Observatory', function () {
    var s = S(); s.pad(22, 19, 34, 'grass');
    s.box(2, 3, 0, 20, 15, 13, 'stoneW', { win:4, door:true, doorH:0.6 });
    s.hip(0, 1, 13, 24, 19, 7, 'tileB');
    s.dome(22, 5, 13, 4.5, 5, 'gold');
    s.cyl(22, 5, 0, 2.4, 13, 'basalt');
    return s;
  });
  reg('cultures', 'ix_gnome_stall_grand', 'Cin gadget tezgâhı · Çift kuleli', 'Gnome gadget stall · Twin-tower', function () {
    var s = S(); s.pad(17, 12, 22, 'grass');
    s.box(1, 1, 0, 13, 7, 3, 'wood', { plain:true });
    s.box(1, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.box(13, 1, 3, 1, 1, 6, 'woodD', { plain:true });
    s.gable(-1, -1, 9, 17, 9, 4, 'tileB');
    s.cyl(14, 7, 0, 1.4, 4, 'basalt'); s.cone(14, 7, 4, 1.6, 2, 'gold');
    s.cyl(3, 8, 0, 1.2, 3, 'basalt'); s.cone(3, 8, 3, 1.4, 1.6, 'gold');
    return s;
  });

  /* ---- kalan 3 ırkın köprüsü (cüce/elf zaten vardı) — köprü ailesini
     tamamlıyor ve ırk kapsamını 5/5'e çıkarıyor ---- */
  reg('cultures', 'ix_orc_bridge', 'Ork köprüsü · Halat ve kütük', 'Orc bridge · Rope and log', function () {
    var s = S(); s.pad(24, 10, 34, 'dirt');
    s.box(0, 4, 3, 44, 6, 1, 'woodD', { plain:true });
    s.box(2, 4, 0, 1.4, 1.4, 4, 'woodD', { plain:true });
    s.box(40, 4, 0, 1.4, 1.4, 4, 'woodD', { plain:true });
    s.box(2, 2, 5, 1.4, 1.4, 12, 'hide', { plain:true });
    s.box(40, 2, 5, 1.4, 1.4, 12, 'hide', { plain:true });
    return s;
  });
  reg('cultures', 'ix_halfling_bridge', 'Küçük halk köprüsü', 'Little-folk footbridge', function () {
    var s = S(); s.pad(18, 8, 24, 'dirt');
    s.box(0, 3, 3, 30, 5, 0.8, 'wood', { plain:true });
    s.box(0, 2.6, 3.8, 30, 0.6, 1.6, 'woodD', { plain:true });
    s.box(0, 7.4, 3.8, 30, 0.6, 1.6, 'woodD', { plain:true });
    return s;
  });
  reg('cultures', 'ix_gnome_bridge', 'Cin köprüsü · Dişli mekanizmalı', 'Gnome bridge · Clockwork', function () {
    var s = S(); s.pad(22, 10, 32, 'dirt');
    s.box(0, 4, 4, 40, 6, 1, 'stoneW', { plain:true });
    s.box(0, 3.4, 5.4, 40, 0.8, 2, 'basalt', { plain:true });
    s.box(0, 9.4, 5.4, 40, 0.8, 2, 'basalt', { plain:true });
    s.cyl(10, 2, 4, 1.6, 4, 'basalt');
    s.cyl(30, 2, 4, 1.6, 4, 'basalt');
    return s;
  });

})(window);
