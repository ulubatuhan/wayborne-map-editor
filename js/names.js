/* ============================================================
   Wayborne — names.js
   Fantastik yer adı üreteci. Hece tabanlı, sözlük yok: her kültür
   kendi ses dağarcığından (onset / nucleus / coda) ad kurar, sonra
   coğrafi türe göre ek/önek alır. Harici veri veya bağımlılık yok.

   Kültür kimlikleri catalog2.js'teki CIVIC_CULTURE ile aynı ruhu
   taşır (batı / akdeniz / kuzey / doğu / taş) ve ırk mimarisiyle
   uyumlu üç fantastik kültür eklenir.
   ============================================================ */
(function (global) {
  'use strict';

  /* Her kültür: bas (başlangıç sesleri), orta (çekirdek), son (bitiş),
     bag (heceler arası bağlayıcı, opsiyonel). */
  var CULTURES = {
    western: {
      tr:'Batı', en:'Western',
      bas:['Ash','Black','Bram','Cald','Dun','East','Fal','Gar','Green','Hal','Kend','Mar','North','Oak','Red','Stone','Thorn','Weald','Wold','Wyn'],
      orta:['a','e','i','o','u','ae','ea'],
      son:['bury','cross','dale','fell','ford','gate','hold','mere','moor','ridge','shire','stead','thorpe','ton','vale','wick','worth'],
      birlesik: true
    },
    med: {
      tr:'Akdeniz', en:'Mediterranean',
      bas:['Al','Bar','Cast','Cor','Fen','Lor','Mal','Mer','Nov','Ol','Port','Rav','Sal','Sier','Tal','Val','Ver'],
      orta:['a','e','i','o','ia','io','ei'],
      son:['ana','ara','ella','enna','ino','ola','oro','osa','ura','vera','anza','etto'],
      birlesik: false
    },
    north: {
      tr:'Kuzey', en:'Northern',
      bas:['Ang','Bjor','Drang','Eld','Fross','Grim','Hald','Ís','Jarn','Kald','Mor','Nord','Rag','Skar','Thor','Ulf','Var'],
      orta:['a','o','u','au','ei','y'],
      son:['berg','fjell','gard','heim','holm','marr','nes','rok','stad','strand','vik','ström','dal'],
      birlesik: true
    },
    east: {
      tr:'Doğu', en:'Eastern',
      bas:['Ak','Bey','Çağ','Der','Er','Gök','Han','Kar','Kız','Lal','Mer','Oğ','Sar','Şeh','Tan','Yıl','Zer'],
      orta:['a','e','ı','i','u','ü','ay','ey'],
      son:['abad','bahçe','han','kent','köy','pınar','saray','tepe','yurt','ova','kale','dere'],
      birlesik: true
    },
    stone: {
      tr:'Taş', en:'Stonefolk',
      bas:['Bar','Dor','Dur','Grun','Kaz','Khar','Mor','Nul','Thar','Thrum','Uld','Vor','Zar'],
      orta:['a','o','u','ai','uu'],
      son:['dun','dûm','gost','grim','hal','kar','mar','nak','rim','thek','vald','zad'],
      birlesik: false
    },
    sylvan: {
      tr:'Orman halkı', en:'Sylvan',
      bas:['Ael','Cel','El','Fae','Gal','Il','Lae','Lor','Mith','Nae','Ryl','Sil','Thal','Vael','Yl'],
      orta:['a','e','i','ae','ia','ie','ye'],
      son:['dor','lian','loth','mar','nor','rien','riel','thil','wen','wyn','ael','ith'],
      birlesik: false
    },
    savage: {
      tr:'Yaban', en:'Savage',
      bas:['Brak','Drok','Gash','Gor','Grum','Kra','Mog','Nar','Rak','Skul','Thok','Ug','Vrag','Zug'],
      orta:['a','o','u','aa','uu'],
      son:['dar','gash','grot','kar','mash','nak','rok','shak','thar','ug','zul','drak'],
      birlesik: false
    }
  };

  /* Coğrafi türe göre süsleme. {on:[], ard:[]} — biri seçilir ya da
     hiçbiri (sade ad). tr/en ayrı, çünkü bunlar gerçek kelimeler. */
  var FEATURES = {
    settlement: { tr:{on:[], ard:[]}, en:{on:[], ard:[]} },
    city:       { tr:{on:[], ard:[' Şehri',' Kenti']},          en:{on:[], ard:[' City']} },
    river:      { tr:{on:[], ard:[' Irmağı',' Deresi',' Suyu']},en:{on:[], ard:[' River',' Brook']} },
    mountain:   { tr:{on:[], ard:[' Dağı',' Sırtı',' Zirvesi']},en:{on:[], ard:[' Peak',' Ridge',' Mount']} },
    forest:     { tr:{on:[], ard:[' Ormanı',' Korusu']},        en:{on:[], ard:[' Wood',' Forest']} },
    region:     { tr:{on:[], ard:[' Diyarı',' Toprakları',' Bölgesi']}, en:{on:[], ard:[' Lands',' Reach',' March']} },
    sea:        { tr:{on:[], ard:[' Denizi',' Körfezi',' Boğazı']},     en:{on:[], ard:[' Sea',' Gulf',' Strait']} },
    lake:       { tr:{on:[], ard:[' Gölü']},                    en:{on:[], ard:[' Lake',' Mere']} }
  };

  function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* Tohumlanabilir üreteç: aynı tohum aynı adı verir (test edilebilirlik) */
  function rngFrom(seed) {
    if (seed === undefined || seed === null) return Math.random;
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* Kullanıcı tanımlı kültürler. Yerleşik 7 kültür sabit kalır; buraya
     eklenenler proje-özeldir (Exporter proje kaydıyla gelir/gider), bu
     yüzden ayrı bir tabloda tutulup arama sırasında ÖNCE bakılır — bir
     kullanıcı kültürü yerleşik bir anahtarı gölgeleyebilir ama onu
     kalıcı olarak bozamaz. */
  var CUSTOM = {};

  function culture(key) {
    return CUSTOM[key] || CULTURES[key] || CULTURES.western;
  }

  /* Tek bir kök ad üretir (coğrafi ek olmadan) */
  function stem(cultureKey, rnd) {
    var c = culture(cultureKey);
    var a = pick(c.bas, rnd);
    var b = pick(c.son, rnd);
    if (c.birlesik) {
      /* birleşik adlar: "Ashford", "Nordvik" — çekirdek sesi araya girmez */
      return cap(a) + b;
    }
    /* akıcı adlar: araya bir çekirdek ses girer — "Valeria", "Mithriel" */
    var m = pick(c.orta, rnd);
    var joined = cap(a) + m + b;
    return joined.replace(/([aeiouıüö])\1+/gi, '$1');   /* üçlü sesli yığılmasını sadeleştir */
  }

  var Names = {
    CULTURES: CULTURES,
    CUSTOM: CUSTOM,
    culture: culture,

    /* Yerleşik + kullanıcı kültürlerinin anahtarları. Kültür/din
       üreteci bunu okur, böylece kullanıcının eklediği kültür de
       haritada bir bölge olarak çıkabilir. */
    allCultureKeys: function () {
      var keys = Object.keys(CULTURES).filter(function (k) { return !CUSTOM[k]; });
      return keys.concat(Object.keys(CUSTOM));
    },

    cultureList: function (lang) {
      var out = Object.keys(CULTURES).filter(function (k) { return !CUSTOM[k]; }).map(function (k) {
        var c = CULTURES[k];
        var n = global.i18nName ? global.i18nName('nameculture_' + k, c.tr, c.en, lang)
                                : (lang === 'tr' ? c.tr : c.en);
        return { key:k, name:n, custom:false };
      });
      /* Kullanıcı kültürlerinin çevirisi yok — kendi verdiği ad her
         dilde aynen görünür (kullanıcı katmanı adlarıyla aynı kural). */
      Object.keys(CUSTOM).forEach(function (k) {
        out.push({ key:k, name:CUSTOM[k].tr || k, custom:true });
      });
      return out;
    },

    /* ---- kullanıcı tanımlı kültürler ----
       Hece havuzları virgülle ayrılmış metinden gelir; boş bir havuz
       üreteci bozacağı için burada reddedilir (pick() boş diziden
       undefined döndürür ve ad "undefined" olurdu). */
    addCustomCulture: function (key, def) {
      key = String(key || '').trim();
      if (!key) return false;
      var bas = (def.bas || []).filter(Boolean);
      var son = (def.son || []).filter(Boolean);
      var orta = (def.orta || []).filter(Boolean);
      if (!bas.length || !son.length) return false;
      if (!def.birlesik && !orta.length) orta = ['a','e','i','o','u'];
      CUSTOM[key] = {
        tr: def.name || key, en: def.name || key,
        bas: bas, orta: orta, son: son, birlesik: !!def.birlesik
      };
      return true;
    },

    removeCustomCulture: function (key) {
      if (!CUSTOM[key]) return false;
      delete CUSTOM[key];
      return true;
    },

    /* Proje kaydı için: sade bir nesne kopyası / geri yükleme. */
    serializeCustom: function () { return JSON.parse(JSON.stringify(CUSTOM)); },
    applyCustom: function (obj) {
      Object.keys(CUSTOM).forEach(function (k) { delete CUSTOM[k]; });
      if (!obj) return;
      Object.keys(obj).forEach(function (k) { CUSTOM[k] = obj[k]; });
    },

    /* Bir ad üret. feature: settlement/city/river/mountain/forest/region/sea/lake */
    generate: function (cultureKey, feature, lang, seed) {
      var rnd = rngFrom(seed);
      var base = stem(cultureKey, rnd);
      var f = FEATURES[feature] || FEATURES.settlement;
      var loc = f[lang === 'tr' ? 'tr' : 'en'] || f.en;
      var suf = loc.ard.length ? pick(loc.ard, rnd) : '';
      var pre = loc.on.length  ? pick(loc.on,  rnd) : '';
      return pre + base + suf;
    },

    /* n farklı ad — aynı adın tekrarı elenerek */
    generateMany: function (cultureKey, feature, lang, n, seed) {
      var out = [], seen = {}, rnd = rngFrom(seed), guard = 0;
      while (out.length < n && guard++ < n * 40) {
        var s = this.generate(cultureKey, feature, lang, Math.floor(rnd() * 1e9));
        if (!seen[s]) { seen[s] = 1; out.push(s); }
      }
      return out;
    }
  };

  global.Names = Names;
})(window);
