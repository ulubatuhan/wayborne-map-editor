/* ============================================================
   Wayborne — emblem.js
   Prosedürel heraldik arma üreteci. Projenin geri kalanıyla aynı
   ilkeyi izler: hiçbir görsel dosya yüklenmez, her şey kodda çizilir.

   Bir arma üç seçimden ibarettir:
     kalkan şekli  (shield)  — dış hat
     bölünme       (division) — kalkanın renk düzeni (düz, dikey, yatay,
                                çapraz, çeyrek, şeritli...)
     motif         (charge)   — ortadaki figür (aslan, kartal, kule...)
   artı iki renk: bir "tinctür" (zemin) ve bir "metal" (motif).

   Gerçek heraldikteki "tinctür kuralı" (metal üstüne metal, renk üstüne
   renk konmaz) burada da uygulanıyor: zemin daima renk havuzundan,
   motif daima metal havuzundan seçilir. Sonuç, rastgele iki renk
   seçmeye göre gözle görülür biçimde daha "arma gibi" duruyor.

   Tüm yollar 0-100 kutusunda tanımlıdır — Sym ile aynı uzay, böylece
   ölçekleme/konumlama mantığı ortak.
   ============================================================ */
(function (global) {
  'use strict';

  /* Tinctürler (zemin renkleri) ve metaller (motif renkleri) */
  var TINCTURE = [
    { key:'gules',   hex:'#9c2b22' },   /* kırmızı */
    { key:'azure',   hex:'#2d4d86' },   /* mavi    */
    { key:'vert',    hex:'#3f6b39' },   /* yeşil   */
    { key:'sable',   hex:'#2a2622' },   /* siyah   */
    { key:'purpure', hex:'#5e3168' }    /* mor     */
  ];
  var METAL = [
    { key:'or',     hex:'#d9ac3c' },    /* altın   */
    { key:'argent', hex:'#e6e0d2' }     /* gümüş   */
  ];

  /* ---------- kalkan dış hatları ---------- */
  var SHIELDS = {
    heater:  'M12,10 L88,10 L88,52 Q88,80 50,94 Q12,80 12,52 Z',
    round:   'M50,8 Q90,8 90,48 Q90,92 50,92 Q10,92 10,48 Q10,8 50,8 Z',
    oval:    'M50,6 Q86,6 86,50 Q86,94 50,94 Q14,94 14,50 Q14,6 50,6 Z',
    square:  'M14,10 L86,10 L86,78 Q86,90 74,90 L26,90 Q14,90 14,78 Z',
    pointed: 'M12,10 L88,10 L88,46 L50,94 L12,46 Z',
    kite:    'M50,6 L88,30 L82,66 L50,94 L18,66 L12,30 Z'
  };
  var SHIELD_KEYS = Object.keys(SHIELDS);

  /* ---------- bölünmeler ----------
     Her biri, kalkanın İKİNCİ renkle boyanacak bölgesini döner (null =
     düz zemin). Kalkan yolu zaten clip olarak uygulandığı için bu
     parçaların kalkan dışına taşması sorun değil. */
  var DIVISIONS = {
    plain:    null,
    perPale:  'M50,0 L100,0 L100,100 L50,100 Z',
    perFess:  'M0,50 L100,50 L100,100 L0,100 Z',
    perBend:  'M0,0 L100,100 L0,100 Z',
    quarter:  'M0,0 L50,0 L50,50 L100,50 L100,100 L50,100 L50,50 L0,50 Z',
    chevron:  'M50,32 L100,84 L100,100 L0,100 L0,84 Z',
    fess:     'M0,40 L100,40 L100,60 L0,60 Z',
    pale:     'M40,0 L60,0 L60,100 L40,100 Z',
    cross:    'M42,0 L58,0 L58,42 L100,42 L100,58 L58,58 L58,100 L42,100 L42,58 L0,58 L0,42 L42,42 Z'
  };
  var DIVISION_KEYS = Object.keys(DIVISIONS);

  /* ---------- motifler (charge) ----------
     Sadeleştirilmiş siluetler: armada motif küçük basılır, ayrıntı
     değil okunaklı dış hat gerekir. */
  var CHARGES = {
    lion:   'M16,50 L24,40 L32,35 L34,20 L42,32 L54,19 L60,33 L72,42 L78,64 L66,78 L46,80 L34,74 L28,64 L42,60 L24,56 Z',
    eagle:  'M50,10 Q57,10 57,18 Q57,23 54,26 L54,32 L70,26 L88,20 L78,34 L92,32 L78,44 L86,46 L66,52 L64,62 L70,80 L56,72 L56,86 L44,86 L44,72 L30,80 L36,62 L34,52 L14,46 L22,44 L8,32 L22,34 L12,20 L30,26 L46,32 L46,26 Q43,23 43,18 Q43,10 50,10 Z',
    tower:  'M34,72 L34,44 L30,44 L30,36 L36,36 L36,42 L42,42 L42,36 L48,36 L48,42 L54,42 L54,36 L60,36 L60,44 L56,44 L56,72 Z M44,72 L44,58 L52,58 L52,72 Z',
    star:   'M50,22 L57,42 L78,42 L61,54 L67,74 L50,62 L33,74 L39,54 L22,42 L43,42 Z',
    crown:  'M28,66 L28,42 L38,52 L44,34 L50,50 L56,34 L62,52 L72,42 L72,66 Z M28,70 L72,70 L72,76 L28,76 Z',
    sword:  'M48,20 L52,20 L52,60 L58,60 L58,66 L52,66 L52,80 L48,80 L48,66 L42,66 L42,60 L48,60 Z',
    tree:   'M46,82 L54,82 L54,62 L46,62 Z M50,16 Q70,26 64,42 Q78,48 66,60 Q56,66 50,62 Q44,66 34,60 Q22,48 36,42 Q30,26 50,16 Z',
    fish:   'M22,50 Q38,32 58,44 L74,32 L70,50 L74,68 L58,56 Q38,68 22,50 Z',
    boar:   'M12,54 L20,46 L24,34 L30,44 L44,36 L62,34 L76,40 L84,52 L82,72 L74,72 L72,58 L52,60 L50,72 L42,72 L40,58 L26,58 L18,60 Z',
    hammer: 'M26,24 L58,24 L78,32 L78,36 L58,44 L54,44 L54,84 L44,84 L44,44 L26,44 Z',
    moon:   'M62,22 Q40,32 40,50 Q40,68 62,78 Q34,76 30,50 Q34,24 62,22 Z',
    sun:    'M50,32 a18,18 0 1,0 0.1,0 Z M50,10 L54,24 L46,24 Z M50,90 L46,76 L54,76 Z M10,50 L24,46 L24,54 Z M90,50 L76,54 L76,46 Z',
    key:    'M40,30 a12,12 0 1,0 0.1,0 M50,42 L50,78 L60,78 L60,72 L54,72 L54,66 L62,66 L62,60 L54,60 L54,42 Z',
    anchor: 'M46,22 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0 M48,30 L52,30 L52,74 L48,74 Z M32,40 L68,40 L68,46 L32,46 Z M26,58 Q30,80 50,82 Q70,80 74,58 L68,58 Q64,74 50,76 Q36,74 32,58 Z'
  };
  var CHARGE_KEYS = Object.keys(CHARGES);

  /* Tohumlu, deterministik PRNG — Names/Tools ile aynı desen. */
  function rngFrom(seed) {
    var s = (seed >>> 0) || 1;
    return function () { s = (s*1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }

  var Emblem = {
    SHIELDS: SHIELDS, DIVISIONS: DIVISIONS, CHARGES: CHARGES,
    TINCTURE: TINCTURE, METAL: METAL,

    /* Tohumdan bir arma tanımı üretir. Aynı tohum → aynı arma. */
    generate: function (seed) {
      var rnd = rngFrom(seed);
      var tinc = pick(TINCTURE, rnd);
      /* ikinci zemin rengi ilkinden farklı olsun — bölünme görünür olmalı */
      var tinc2 = TINCTURE[(TINCTURE.indexOf(tinc) + 1 + Math.floor(rnd()*(TINCTURE.length-1))) % TINCTURE.length];
      return {
        shield:   pick(SHIELD_KEYS, rnd),
        division: pick(DIVISION_KEYS, rnd),
        charge:   pick(CHARGE_KEYS, rnd),
        field:    tinc.hex,
        field2:   tinc2.hex,
        metal:    pick(METAL, rnd).hex,
        seed:     seed >>> 0
      };
    },

    /* Armayı (x,y) merkezli, size piksel yüksekliğinde çizer. */
    draw: function (ctx, spec, x, y, size) {
      if (!spec || !SHIELDS[spec.shield]) return;
      var s = size / 100;
      ctx.save();
      ctx.translate(x - size/2, y - size/2);
      ctx.scale(s, s);

      var shield = new Path2D(SHIELDS[spec.shield]);
      ctx.save();
      ctx.clip(shield);

      /* zemin */
      ctx.fillStyle = spec.field;
      ctx.fillRect(0, 0, 100, 100);

      /* bölünme (varsa) ikinci renkle */
      var divPath = DIVISIONS[spec.division];
      if (divPath) {
        ctx.fillStyle = spec.field2;
        ctx.fill(new Path2D(divPath));
      }

      /* motif — metal renginde, ince koyu konturla okunaklılık */
      var charge = new Path2D(CHARGES[spec.charge]);
      ctx.fillStyle = spec.metal;
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.fill(charge);
      ctx.stroke(charge);
      ctx.restore();

      /* kalkan kenarı */
      ctx.strokeStyle = '#241a0c';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke(shield);
      ctx.restore();
    },

    /* Armayı tek başına bir canvas'a çizip döner (panel önizlemesi ve
       PNG indirme aynı yolu kullansın diye). */
    toCanvas: function (spec, size) {
      size = size || 128;
      var c = document.createElement('canvas');
      c.width = size; c.height = size;
      this.draw(c.getContext('2d'), spec, size/2, size/2, size * 0.92);
      return c;
    }
  };

  global.Emblem = Emblem;
})(window);
