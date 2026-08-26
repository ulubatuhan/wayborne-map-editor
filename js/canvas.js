/* ============================================================
   Cartographer — canvas.js  v3
   Görünüm (zoom/pan), render, minimap, kıyı efekti (shore glow),
   nehir/yol/etiket çizimi, etiket preset & parşömen kapıtları,
   interaktif ölçek çubuğu.
   ============================================================ */
(function (global) {
  'use strict';

  /* ================= geometri ================= */
  var Geo = {
    sample: function (pts, perSeg) {
      if (!pts || pts.length < 2) return (pts || []).slice();
      if (pts.length === 2) {
        var out = [], n = perSeg || 16;
        for (var k = 0; k <= n; k++) {
          var t = k / n;
          out.push([pts[0][0] + (pts[1][0]-pts[0][0])*t, pts[0][1] + (pts[1][1]-pts[0][1])*t]);
        }
        return out;
      }
      var res = [], n2 = perSeg || 16;
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i-1]||pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2]||pts[i+1];
        for (var j = 0; j < n2; j++) {
          var s = j/n2, s2 = s*s, s3 = s2*s;
          res.push([
            0.5*((2*p1[0]) + (-p0[0]+p2[0])*s + (2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*s2 + (-p0[0]+3*p1[0]-3*p2[0]+p3[0])*s3),
            0.5*((2*p1[1]) + (-p0[1]+p2[1])*s + (2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*s2 + (-p0[1]+3*p1[1]-3*p2[1]+p3[1])*s3)
          ]);
        }
      }
      res.push(pts[pts.length-1].slice());
      return res;
    },

    meander: function (pts, amount, wavelength) {
      if (!amount) return pts;
      var out = [], acc = 0;
      for (var i = 0; i < pts.length; i++) {
        var prev = pts[i-1]||pts[i], next = pts[i+1]||pts[i];
        var dx = next[0]-prev[0], dy = next[1]-prev[1];
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy/len, ny = dx/len;
        if (i > 0) acc += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
        var w = wavelength || 140;
        var o = Math.sin(acc/w*Math.PI*2)*amount + Math.sin(acc/(w*0.37)*Math.PI*2)*amount*0.35;
        out.push([pts[i][0]+nx*o, pts[i][1]+ny*o]);
      }
      return out;
    },

    ribbon: function (pts, wStart, wEnd) {
      var left = [], right = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var prev = pts[i-1]||pts[i], next = pts[i+1]||pts[i];
        var dx = next[0]-prev[0], dy = next[1]-prev[1];
        var len = Math.hypot(dx, dy) || 1;
        var nx = -dy/len, ny = dx/len;
        var t = n > 1 ? i/(n-1) : 1;
        var hw = (wStart + (wEnd-wStart)*t)/2;
        left.push([pts[i][0]+nx*hw, pts[i][1]+ny*hw]);
        right.push([pts[i][0]-nx*hw, pts[i][1]-ny*hw]);
      }
      return left.concat(right.reverse());
    },

    distToPolyline: function (px, py, pts) {
      var best = Infinity;
      for (var i = 1; i < pts.length; i++) {
        var x1=pts[i-1][0], y1=pts[i-1][1], x2=pts[i][0], y2=pts[i][1];
        var dx=x2-x1, dy=y2-y1, L2=dx*dx+dy*dy;
        var t = L2 ? Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy)/L2)) : 0;
        var d = Math.hypot(px-(x1+dx*t), py-(y1+dy*t));
        if (d < best) best = d;
      }
      return best;
    },

    /* Catmull-Rom <-> Bezier dönüşümü: elle tutamaç ayarlanmamış bir nokta
       için, mevcut Geo.sample ile TAM AYNI eğriyi üreten simetrik tutamaç.
       Böylece bir yolun bazı noktalarında özel tutamaç, bazılarında otomatik
       tutamaç karışık kullanılabilir — görsel süreklilik bozulmaz. */
    autoHandle: function (pts, i, closed) {
      var n = pts.length;
      var prev = closed ? pts[(i-1+n)%n] : (pts[i-1] || pts[i]);
      var next = closed ? pts[(i+1)%n] : (pts[i+1] || pts[i]);
      var tx = (next[0]-prev[0])/6, ty = (next[1]-prev[1])/6;
      return { ix:-tx, iy:-ty, ox:tx, oy:ty };
    },

    /* handles[i] = {ix,iy,ox,oy} (nokta i'nin giriş/çıkış tutamaç ofsetleri,
       nokta konumuna göre göreli) ya da null/undefined → otomatik tutamaç.
       closed=true ise son noktadan ilk noktaya kapanan bir eğri örneklenir
       (göl/bölge poligonları için). */
    sampleBezier: function (pts, handles, perSeg, closed) {
      var n = pts.length;
      if (n < 2) return (pts || []).slice();
      var self = this, res = [];
      var ps = Math.max(2, perSeg || 16);
      var segCount = closed ? n : n - 1;
      for (var i = 0; i < segCount; i++) {
        var i2 = closed ? (i+1) % n : i+1;
        var P0 = pts[i], P3 = pts[i2];
        var hOut = (handles && handles[i])  || self.autoHandle(pts, i, closed);
        var hIn  = (handles && handles[i2]) || self.autoHandle(pts, i2, closed);
        var C1 = [P0[0]+(hOut.ox||0), P0[1]+(hOut.oy||0)];
        var C2 = [P3[0]+(hIn.ix||0),  P3[1]+(hIn.iy||0)];
        for (var j = 0; j < ps; j++) {
          var t = j/ps, mt = 1-t;
          var a = mt*mt*mt, b = 3*mt*mt*t, c = 3*mt*t*t, d = t*t*t;
          res.push([
            a*P0[0]+b*C1[0]+c*C2[0]+d*P3[0],
            a*P0[1]+b*C1[1]+c*C2[1]+d*P3[1]
          ]);
        }
      }
      if (!closed) res.push(pts[n-1].slice());
      return res;
    },

    polyPath: function (pts) {
      var p = new Path2D();
      if (!pts.length) return p;
      p.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
      return p;
    },

    svgPolyD: function (pts, close) {
      if (!pts.length) return '';
      var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (var i = 1; i < pts.length; i++) d += ' L' + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
      return d + (close ? ' Z' : '');
    },

    /* ---------- çizgi (nehir/yol) üzerinde konumlandırma — kavisli etiketler için ----------
       pathPts: [[x,y],...] örneklenmiş polyline (Cv.riverGeometry/roadGeometry çıktısı) */
    polylineLength: function (pts) {
      var len = 0;
      for (var i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
      return len;
    },

    /* ---------- çokgen bölme yardımcıları (şehir üretimi) ---------- */

    polygonCentroid: function (pts) {
      var cx = 0, cy = 0;
      for (var i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
      return [cx/pts.length, cy/pts.length];
    },

    /* Bir çokgenin yaklaşık en küçük alanlı yönlü sınır kutusu (OBB).
       Kesin "rotating calipers" yerine sabit sayıda açı denenir: şehir
       bloğu bölmede amaç en uygun kutuyu bulmak değil, bloğun UZUN
       eksenini doğru yakalamak — 15 açı bunun için fazlasıyla yeterli
       ve kod, dışbükey-zarf gerektiren tam çözümden çok daha basit.
       Döner: {angle, w, h, cx, cy} — açı radyan, w>=h garanti değil,
       hangisinin uzun olduğu çağıranın işi. */
    polygonOBB: function (pts) {
      var best = null, STEPS = 15;
      for (var s = 0; s < STEPS; s++) {
        var a = (s / STEPS) * Math.PI/2;   /* 90° yeterli: kutu simetrik */
        var ca = Math.cos(-a), sa = Math.sin(-a);
        var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (var i = 0; i < pts.length; i++) {
          var x = pts[i][0]*ca - pts[i][1]*sa;
          var y = pts[i][0]*sa + pts[i][1]*ca;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
        var w = maxX-minX, h = maxY-minY, area = w*h;
        if (!best || area < best.area) best = { angle:a, w:w, h:h, area:area,
                                                minX:minX, maxX:maxX, minY:minY, maxY:maxY };
      }
      return best;
    },

    /* Sutherland–Hodgman: çokgeni bir doğrunun bir yarı-düzlemine kırpar.
       Doğru p0 noktasından geçer ve (nx,ny) normaline sahiptir; normalin
       POZİTİF tarafında kalan parça döner. Dışbükey olmayan girdide de
       çökmez (sonuç bozulabilir ama şehir bölmede üretilen parçalar
       pratikte dışbükeye yakındır). */
    clipHalfPlane: function (pts, px, py, nx, ny) {
      if (!pts || pts.length < 3) return [];
      var out = [], n = pts.length;
      function side(p) { return (p[0]-px)*nx + (p[1]-py)*ny; }
      for (var i = 0; i < n; i++) {
        var a = pts[i], b = pts[(i+1) % n];
        var da = side(a), db = side(b);
        if (da >= 0) out.push([a[0], a[1]]);
        if ((da > 0 && db < 0) || (da < 0 && db > 0)) {
          var t = da / (da - db);
          out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]);
        }
      }
      return out.length >= 3 ? out : [];
    },

    /* Bir doğrunun çokgenle kesiştiği ilk/son noktayı döner (sokak
       segmenti olarak çizilecek parça). Dışbükey olmayan çokgende ara
       boşlukları yok sayar — uç noktaları almak sokak çizimi için yeterli.
       Kesişim yoksa null. */
    lineThroughPolygon: function (pts, px, py, dx, dy) {
      var ts = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var a = pts[i], b = pts[(i+1) % n];
        var ex = b[0]-a[0], ey = b[1]-a[1];
        var den = dx*ey - dy*ex;
        if (Math.abs(den) < 1e-9) continue;
        var t = ((a[0]-px)*ey - (a[1]-py)*ex) / den;      /* doğru üzerinde */
        var u = ((a[0]-px)*dy - (a[1]-py)*dx) / den;      /* kenar üzerinde */
        if (u >= 0 && u <= 1) ts.push(t);
      }
      if (ts.length < 2) return null;
      ts.sort(function (p, q) { return p - q; });
      var t0 = ts[0], t1 = ts[ts.length-1];
      return [[px + dx*t0, py + dy*t0], [px + dx*t1, py + dy*t1]];
    },

    /* Çokgeni ağırlık merkezine doğru yaklaşık d piksel içeri çeker
       (sokak genişliği payı). Gerçek bir "straight skeleton" offset'i
       değil — köşeleri merkeze doğru oransal çekmek şehir bloğu
       ölçeğinde görsel olarak yeterli ve her zaman geçerli bir çokgen
       üretir. Çok küçük çokgende null döner. */
    insetPolygon: function (pts, d) {
      var c = this.polygonCentroid(pts), out = [];
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i][0]-c[0], dy = pts[i][1]-c[1];
        var len = Math.hypot(dx, dy);
        if (len <= d * 1.05) return null;      /* içeri çekince kapanırdı */
        var k = (len - d) / len;
        out.push([c[0] + dx*k, c[1] + dy*k]);
      }
      return out;
    },

    /* Nokta kapalı çokgenin içinde mi? (ışın atma / even-odd). pts
       kapanışı içermese de olur. Kültür sorgusu (Tools.cultureAt) ve
       başkent yerleştirme (Tools._defaultCapital) aynı testi paylaşır. */
    pointInPolygon: function (x, y, pts) {
      if (!pts || pts.length < 3) return false;
      var inside = false;
      for (var i = 0, j = pts.length-1; i < pts.length; j = i++) {
        var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        var hit = ((yi > y) !== (yj > y)) && (x < (xj-xi) * (y-yi) / (yj-yi) + xi);
        if (hit) inside = !inside;
      }
      return inside;
    },

    /* Kapalı bir çokgenin alanı (shoelace formülü, piksel²). pts kapanışı
       (son nokta = ilk nokta) içermese de olur — kapatan kenar zımnen
       eklenir. */
    polygonArea: function (pts) {
      if (!pts || pts.length < 3) return 0;
      var a = 0;
      for (var i = 0; i < pts.length; i++) {
        var p1 = pts[i], p2 = pts[(i+1) % pts.length];
        a += p1[0]*p2[1] - p2[0]*p1[1];
      }
      return Math.abs(a) / 2;
    },

    /* verilen kümülatif uzunlukta {x,y,ang} döner (ang: teğet açısı, radyan) */
    pointAtLength: function (pts, len) {
      if (!pts || pts.length < 2) return { x:0, y:0, ang:0 };
      if (len <= 0) return { x:pts[0][0], y:pts[0][1], ang:Math.atan2(pts[1][1]-pts[0][1], pts[1][0]-pts[0][0]) };
      var acc = 0;
      for (var i = 1; i < pts.length; i++) {
        var dx = pts[i][0]-pts[i-1][0], dy = pts[i][1]-pts[i-1][1];
        var segLen = Math.hypot(dx, dy);
        if (acc + segLen >= len || i === pts.length-1) {
          var t = segLen > 0 ? Math.min(1, Math.max(0, (len-acc)/segLen)) : 0;
          return { x: pts[i-1][0]+dx*t, y: pts[i-1][1]+dy*t, ang: Math.atan2(dy, dx) };
        }
        acc += segLen;
      }
      var last = pts.length-1;
      return { x:pts[last][0], y:pts[last][1], ang:Math.atan2(pts[last][1]-pts[last-1][1], pts[last][0]-pts[last-1][0]) };
    },

    /* polyline üzerindeki en yakın noktanın kümülatif uzunluğunu ve mesafesini döner */
    nearestOnPolyline: function (pts, px, py) {
      var best = { len:0, dist:Infinity };
      var acc = 0;
      for (var i = 1; i < pts.length; i++) {
        var x0=pts[i-1][0], y0=pts[i-1][1], x1=pts[i][0], y1=pts[i][1];
        var dx=x1-x0, dy=y1-y0;
        var segLen = Math.hypot(dx, dy);
        var t = segLen > 0 ? ((px-x0)*dx + (py-y0)*dy) / (segLen*segLen) : 0;
        t = Math.min(1, Math.max(0, t));
        var qx = x0+dx*t, qy = y0+dy*t;
        var d = Math.hypot(px-qx, py-qy);
        if (d < best.dist) best = { len: acc + segLen*t, dist: d };
        acc += segLen;
      }
      return best;
    },

    /* ---------- ızgara sınır izleme (devlet/kültür sınırları, GIS dışa aktarım) ----------
       İkili (0/1) bir mask (Uint8Array veya düz dizi, w×h, satır-öncelikli)
       üzerinde, dolu hücrelerin dış sınırlarını (ve varsa iç delik/enklav
       sınırlarını) "hücre-kenarı" yöntemiyle izler: her dolu hücrenin, dolu
       OLMAYAN bir komşuya bakan kenarını yönlü bir kenar parçası olarak
       toplar (yön kuralı "dolu alan kenarın sağında" — bu, halkaları
       tutarlı sarar: dış sınırlar bir yönde, delikler ters yönde imzalı
       alan verir). Sonra bu yönlü kenarları başlangıç noktasından kapanana
       kadar zincirleyip kapalı halkalar üretir. Köşegen-değme gibi nadir
       belirsiz köşelerde ilk kullanılmamış aday seçilir; bir halka kapanmaz
       ve adım sınırı (maxSteps) aşılırsa sessizce atlanır — bozuk girdide
       çökme yerine eksik sınır tercih edilir.
       Çıktı: [[x,y],...] biçiminde halka dizisi; her halkada `.hole`
       (delik mi dış sınır mı) ve `.area` (piksel², ızgara biriminde)
       özellikleri de bulunur. Koordinatlar ızgara birimindedir (0..w,
       0..h) — piksel uzayına ölçekleme çağıranın işidir (bkz.
       Tools.generateStates). */
    traceContour: function (mask, w, h) {
      function at(x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return 0;
        return mask[y*w+x] ? 1 : 0;
      }
      var edges = {};
      function addEdge(x1,y1,x2,y2) {
        var k = x1+','+y1;
        if (!edges[k]) edges[k] = [];
        edges[k].push([x2,y2]);
      }
      for (var gy = 0; gy < h; gy++) {
        for (var gx = 0; gx < w; gx++) {
          if (!at(gx,gy)) continue;
          if (!at(gx,gy-1)) addEdge(gx+1,gy, gx,gy);       /* üst */
          if (!at(gx,gy+1)) addEdge(gx,gy+1, gx+1,gy+1);   /* alt */
          if (!at(gx-1,gy)) addEdge(gx,gy, gx,gy+1);       /* sol */
          if (!at(gx+1,gy)) addEdge(gx+1,gy+1, gx+1,gy);   /* sağ */
        }
      }
      function edgeKey(x1,y1,x2,y2) { return x1+','+y1+'>'+x2+','+y2; }
      var used = {}, rings = [], maxSteps = (w+1)*(h+1)*4 + 8;
      for (var startKey in edges) {
        var list = edges[startKey];
        var parts = startKey.split(','), sx = +parts[0], sy = +parts[1];
        for (var li = 0; li < list.length; li++) {
          var ex = list[li][0], ey = list[li][1];
          var firstKey = edgeKey(sx,sy,ex,ey);
          if (used[firstKey]) continue;
          used[firstKey] = true;
          var ring = [[sx,sy]];
          var cx = ex, cy = ey, guard = 0;
          while ((cx !== sx || cy !== sy) && guard++ < maxSteps) {
            ring.push([cx,cy]);
            var cand = edges[cx+','+cy];
            if (!cand || !cand.length) { cx = NaN; break; }
            var next = null, nk = null;
            for (var ci = 0; ci < cand.length; ci++) {
              var tk = edgeKey(cx,cy,cand[ci][0],cand[ci][1]);
              if (!used[tk]) { next = cand[ci]; nk = tk; break; }
            }
            if (!next) { cx = NaN; break; }
            used[nk] = true;
            cx = next[0]; cy = next[1];
          }
          if (ring.length >= 3 && cx === sx && cy === sy) {
            var signed = 0;
            for (var pi = 0; pi < ring.length; pi++) {
              var p1 = ring[pi], p2 = ring[(pi+1) % ring.length];
              signed += p1[0]*p2[1] - p2[0]*p1[1];
            }
            var simplified = this._simplifyRing(ring);
            simplified.hole = signed > 0;
            simplified.area = Math.abs(signed) / 2;
            rings.push(simplified);
          }
        }
      }
      return rings;
    },

    /* Ardışık üç noktası neredeyse doğrusal olan köşeleri ayıklar — ızgara
       kenarlarından gelen "merdiven" biçimindeki gereksiz nokta yığınını
       inceltir. Render zaten Catmull-Rom ile yuvarlıyor (drawTerritory'nin
       lakeSmoothPts çağrısı), burada amaç yalnızca nokta sayısını makul
       tutmak. */
    _simplifyRing: function (ring) {
      if (ring.length <= 4) return ring;
      var out = [], n = ring.length;
      for (var i = 0; i < n; i++) {
        var a = ring[(i-1+n)%n], b = ring[i], c = ring[(i+1)%n];
        var cross = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
        if (Math.abs(cross) > 1e-9) out.push(b);
      }
      return out.length >= 3 ? out : ring;
    }
  };

  /* ================= yazı tipleri ================= */
  /* ================= ETİKET YAZI AİLELERİ =================
     Proje harici font yüklemez (ne CDN ne gömülü dosya), bu yüzden her
     aile bir *yığın*: önce o karakteri en iyi veren sistem fontu, sonra
     macOS / Windows / Linux karşılıkları, en sonda jenerik bir sınıf.
     Böylece hiçbir sistemde "yazı kayboldu" durumu olmaz; yalnızca
     karakter zayıflar. fontAvailable(key) ile arayüz hangi ailenin
     gerçekten kurulu olduğunu işaretler.

     Anahtarlar geriye dönük: fantasy/serif/sans/mono/black eski
     kayıtlarda ve presetlerde geçtiği için korunuyor. */
  var FONTS = {
    serif:      'Georgia,"Iowan Old Style","Palatino Linotype",Palatino,"URW Palladio L","Liberation Serif","Times New Roman",serif',
    black:      '"Cinzel","Trajan Pro","Optima","Copperplate","Copperplate Gothic Light","Bookman Old Style","URW Bookman L",Georgia,serif',
    fantasy:    '"Luminari","Papyrus","Trattatello","Herculanum","Copperplate",fantasy,serif',
    sans:       '"Optima","Gill Sans","Gill Sans MT","Segoe UI","DejaVu Sans",Helvetica,Arial,sans-serif',
    mono:       '"SFMono-Regular","Menlo",Consolas,"DejaVu Sans Mono","Liberation Mono",monospace',
    /* --- yeni tarihsel aileler --- */
    uncial:     '"Luminari","Herculanum","Papyrus","Bradley Hand","Segoe Print",fantasy,serif',
    blackletter:'"UnifrakturMaguntia","Old English Text MT","Blackadder ITC","Lucida Blackletter","Cloister Black",Georgia,serif',
    roman:      '"Trajan Pro","Cinzel","Copperplate","Copperplate Gothic Bold","Perpetua Titling MT","Nimbus Roman No9 L","Times New Roman",serif',
    chancery:   '"Zapfino","Edwardian Script ITC","Apple Chancery","URW Chancery L","Segoe Script","Brush Script MT",cursive,serif',
    slab:       '"Rockwell","Bookman Old Style","URW Bookman L","Roboto Slab","Courier New",Georgia,serif'
  };

  /* Tek bir font adının kurulu olup olmadığını ölçer: aday font ile
     jenerik bir taban aynı metni aynı genişlikte çiziyorsa font yoktur
     (tarayıcı tabana düşmüştür). Üç farklı tabana bakılır, çünkü aday
     tesadüfen tabanlardan biriyle aynı metriklere sahip olabilir. */
  var _fontProbe = null, _fontSeen = {};
  function faceInstalled(name) {
    if (name in _fontSeen) return _fontSeen[name];
    if (!_fontProbe) _fontProbe = document.createElement('canvas').getContext('2d');
    var probe = 'MWQ@ilg 0123 mmmwww';
    var base = ['monospace', 'serif', 'sans-serif'];
    var found = false;
    for (var i = 0; i < base.length && !found; i++) {
      _fontProbe.font = '72px ' + base[i];
      var ref = _fontProbe.measureText(probe).width;
      _fontProbe.font = '72px "' + name + '",' + base[i];
      if (Math.abs(_fontProbe.measureText(probe).width - ref) > 0.5) found = true;
    }
    return (_fontSeen[name] = found);
  }

  /* Bir ailenin *karakterini* veren fontlardan en az biri kurulu mu?
     Yığının sonundaki jenerik yedekler (Georgia, serif …) sayılmaz —
     gotik bir yığın Georgia'ya düştüğünde ailenin karakteri kaybolur,
     dolayısıyla o aile "yok" sayılmalıdır. faces === null olan aileler
     zaten jenerik tasarlandığı için her yerde var kabul edilir. */
  function fontAvailable(key) {
    var f = FONT_BY_KEY[key];
    if (!f) return true;
    if (!f.faces) return true;
    for (var i = 0; i < f.faces.length; i++) if (faceInstalled(f.faces[i])) return true;
    return false;
  }

  /* Arayüzde gösterilen sıra + ad. i18n-names.js 'font_<key>' ile
     diğer dilleri tamamlar. */
  var FONT_LIST = [
    { key:'serif',       tr:'Eski kitap',      en:'Old book',        faces:null },
    { key:'black',       tr:'Anıtsal',         en:'Monumental',      faces:['Cinzel','Trajan Pro','Optima','Copperplate','Copperplate Gothic Light'] },
    { key:'roman',       tr:'Roma kitabesi',   en:'Roman capitals',  faces:['Trajan Pro','Cinzel','Copperplate','Copperplate Gothic Bold','Perpetua Titling MT'] },
    { key:'uncial',      tr:'Ünsiyal',         en:'Uncial',          faces:['Luminari','Herculanum','Papyrus'] },
    { key:'blackletter', tr:'Gotik yazı',      en:'Blackletter',     faces:['UnifrakturMaguntia','Old English Text MT','Blackadder ITC','Lucida Blackletter','Cloister Black'] },
    { key:'chancery',    tr:'Divani el yazısı',en:'Chancery script', faces:['Zapfino','Edwardian Script ITC','Apple Chancery','URW Chancery L','Segoe Script','Brush Script MT'] },
    { key:'slab',        tr:'Kalın serif',     en:'Slab serif',      faces:['Rockwell','Bookman Old Style','URW Bookman L','Roboto Slab'] },
    { key:'fantasy',     tr:'Fantastik',       en:'Fantasy',         faces:['Luminari','Papyrus','Trattatello','Herculanum','Copperplate'] },
    { key:'sans',        tr:'Sade',            en:'Plain',           faces:null },
    { key:'mono',        tr:'Daktilo',         en:'Typewriter',      faces:null }
  ];
  var FONT_BY_KEY = {};
  FONT_LIST.forEach(function (f) { FONT_BY_KEY[f.key] = f; });

  /* ================= ETİKET PRESETLERİ =================
     banner: null | 'ribbon' | 'plate' | 'scroll' | 'stone'   */
  var LABEL_PRESETS = {
    continent: { tr:'Kıta',        en:'Continent',  font:'black',   size:78, color:'#4a3520', outline:true,  outlineColor:'#f3e7c8', shadow:true,  track:14, caps:true,  banner:null },
    region:    { tr:'Bölge',       en:'Region',     font:'serif',   size:46, color:'#5a4326', outline:true,  outlineColor:'#f5ecd8', shadow:true,  track:8,  caps:true,  banner:null },
    kingdom:   { tr:'Krallık',     en:'Kingdom',    font:'black',   size:52, color:'#6a2c20', outline:true,  outlineColor:'#f7eed6', shadow:true,  track:6,  caps:true,  banner:'ribbon' },
    city:      { tr:'Şehir',       en:'City',       font:'serif',   size:30, color:'#33260f', outline:true,  outlineColor:'#f8f0dc', shadow:false, track:1,  caps:false, banner:null },
    town:      { tr:'Kasaba',      en:'Town',       font:'serif',   size:23, color:'#3d2f18', outline:true,  outlineColor:'#f8f0dc', shadow:false, track:0,  caps:false, banner:null },
    scrollLbl: { tr:'Tomar',       en:'Scroll',     font:'serif',   size:34, color:'#4a3520', outline:false, outlineColor:'#fff',    shadow:true,  track:3,  caps:false, banner:'scroll' },
    plateLbl:  { tr:'Levha',       en:'Plate',      font:'serif',   size:30, color:'#3a2b18', outline:false, outlineColor:'#fff',    shadow:true,  track:2,  caps:false, banner:'plate' },
    stoneLbl:  { tr:'Taş kitabe',  en:'Stone slab', font:'black',   size:32, color:'#2f2a22', outline:false, outlineColor:'#fff',    shadow:true,  track:5,  caps:true,  banner:'stone' },
    water:     { tr:'Deniz',       en:'Sea',        font:'serif',   size:40, color:'#2d5570', outline:true,  outlineColor:'#dcecf4', shadow:false, track:12, caps:true,  banner:null },
    ruinLbl:   { tr:'Harabe',      en:'Ruin',       font:'serif',   size:24, color:'#5c4030', outline:true,  outlineColor:'#f2e6cf', shadow:false, track:2,  caps:false, banner:null }
  };

  /* ================= dokular ================= */
  var oceanTile = null, parchTile = null;
  var patCache = new WeakMap();

  function ctxPattern(ctx, tile, key) {
    var bag = patCache.get(ctx);
    if (!bag) { bag = {}; patCache.set(ctx, bag); }
    if (!bag[key]) bag[key] = ctx.createPattern(tile, 'repeat');
    return bag[key];
  }

  /* '#rrggbb' -> [r,g,b]; 3 haneli kısaltmayı da kabul eder. */
  function hexToRgbArr(hex) {
    hex = (hex || '#7ba8bd').replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
  }
  function shadeRgb(rgb, factor) {
    return [
      Math.max(0, Math.min(255, Math.round(rgb[0]*factor))),
      Math.max(0, Math.min(255, Math.round(rgb[1]*factor))),
      Math.max(0, Math.min(255, Math.round(rgb[2]*factor)))
    ];
  }

  /* Verilen deniz rengine göre bir okyanus dokusu (tuval) üretir/günceller.
     `into` verilirse (Cv.setSeaColor'daki gibi) AYNI tuvale yeniden çizer —
     mevcut ctx.createPattern() referansı canvas kaynağını izlediğinden,
     yeni bir tuval/desen nesnesi oluşturmaya gerek kalmadan renk değişir. */
  function makeOceanTile(color, into) {
    var rgb = hexToRgbArr(color);
    var S = 160, c = into || document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    x.clearRect(0, 0, S, S);
    x.fillStyle = 'rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
    x.fillRect(0, 0, S, S);
    /* ince gren */
    var img = x.getImageData(0, 0, S, S), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * 12;
      d[i] += n; d[i+1] += n; d[i+2] += n * 0.7;
    }
    x.putImageData(img, 0, 0);
    /* dalga çizgileri: seçili rengin biraz daha açık bir tonu */
    var wave = shadeRgb(rgb, 1.25);
    x.strokeStyle = 'rgba('+wave[0]+','+wave[1]+','+wave[2]+',0.30)';
    x.lineWidth = 1.1;
    for (var r = 0; r < 5; r++) {
      var y = 14 + r * 32 + (r % 2) * 6;
      x.beginPath();
      x.moveTo(-6, y);
      for (var k = 0; k <= S + 12; k += 18) x.quadraticCurveTo(k + 5, y - 5.5, k + 10, y);
      x.stroke();
    }
    return c;
  }

  function makeParchTile() {
    var S = 256, c = document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#d9c79a';
    x.fillRect(0, 0, S, S);
    var img = x.getImageData(0, 0, S, S), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var n = (Math.random() - 0.5) * 34;
      d[i] += n; d[i+1] += n * 0.9; d[i+2] += n * 0.7;
    }
    x.putImageData(img, 0, 0);
    x.globalAlpha = 0.16;
    x.strokeStyle = '#7a6338';
    for (var k = 0; k < 26; k++) {
      x.lineWidth = Math.random() * 2 + 0.4;
      x.beginPath();
      var sx = Math.random() * S, sy = Math.random() * S;
      x.moveTo(sx, sy);
      x.bezierCurveTo(sx+40, sy+20, sx+10, sy+60, sx+60, sy+80);
      x.stroke();
    }
    x.globalAlpha = 1;
    return c;
  }

  /* ================= Cv ================= */
  var Cv = {
    W:2048, H:2048,
    zoom:1, panX:0, panY:0, dpr:1,
    view:null, ctx:null, mini:null, mctx:null,
    grid:false, gridSize:128, parchment:false,
    shore:true, shoreWidth:26, shoreStyle:'sandy',
    frame:{ style:'none', color:'#3a2b18', width:24 },
    mouse:{x:0,y:0,over:false},
    _raf:0, _miniAt:0,
    shoreCanvas:null, shoreDirty:true,
    elevationCanvas:null, elevationDirty:true,
    seaColor:'#7ba8bd',

    init: function (w, h) {
      this.view = document.getElementById('view');
      this.ctx = this.view.getContext('2d');
      this.mini = document.getElementById('minimap');
      this.mctx = this.mini.getContext('2d');
      this.W = w; this.H = h;
      oceanTile = makeOceanTile(this.seaColor);
      parchTile = makeParchTile();
      this.resize();
      var self = this;
      window.addEventListener('resize', function () { self.resize(); });
    },

    resize: function () {
      var r = this.view.parentElement.getBoundingClientRect();
      this.dpr = window.devicePixelRatio || 1;
      this.view.width = Math.max(1, Math.round(r.width * this.dpr));
      this.view.height = Math.max(1, Math.round(r.height * this.dpr));
      this.vw = r.width; this.vh = r.height;
      this.requestViewRender();
    },

    setSize: function (w, h, keep) {
      this.W = w; this.H = h;
      Layers.resize(w, h, keep);
      this.shoreDirty = true;
      this.shoreCanvas = null;
      this.elevationDirty = true;
      this.elevationCanvas = null;
      this.fit();
    },

    fit: function () {
      var s = Math.min(this.vw/this.W, this.vh/this.H) * 0.92;
      this.zoom = s;
      this.panX = (this.vw - this.W*s)/2;
      this.panY = (this.vh - this.H*s)/2;
      this.requestViewRender();
    },

    /* Deniz rengini değiştirir: okyanus dokusunu AYNI tuvale yeniden çizer
       (yeni bir ctx.createPattern() gerekmez, desen kaynağı tuvali izler)
       ve bir sonraki renderMap()'in derinlik gradyanını da bu renkten
       türetmesi için Cv.seaColor'ı günceller. */
    setSeaColor: function (color) {
      this.seaColor = color || '#7ba8bd';
      if (oceanTile) makeOceanTile(this.seaColor, oceanTile);
      this.requestRender();
    },

    setZoom: function (z, cx, cy) {
      z = Math.max(0.1, Math.min(4, z));
      if (cx === undefined) { cx = this.vw/2; cy = this.vh/2; }
      var mx = (cx - this.panX)/this.zoom, my = (cy - this.panY)/this.zoom;
      this.zoom = z;
      this.panX = cx - mx*z;
      this.panY = cy - my*z;
      this.requestViewRender();
      if (global.UI) UI.status();
    },

    panBy: function (dx, dy) {
      this.panX += dx; this.panY += dy;
      this.requestViewRender();
    },

    screenToMap: function (sx, sy) { return { x:(sx-this.panX)/this.zoom, y:(sy-this.panY)/this.zoom }; },
    snapPoint: function (p) {
      if (!global.App || !App.snap || !App.snap.enabled) return p;
      var g = App.snap.size || 64;
      return { x: Math.round(p.x/g)*g, y: Math.round(p.y/g)*g };
    },
    mapToScreen: function (mx, my) { return { x:mx*this.zoom+this.panX, y:my*this.zoom+this.panY }; },

    /* nehir/yol kara-kırpma maskesi için yeniden kullanılabilir scratch
       canvas'lar. Önceden her render() karesinde (pan/zoom/çizim sırasında
       saniyede onlarca kez) tam boyutlu YENİ bir canvas oluşturulup atılıyordu
       — büyük tuvallerde (4096²+) bu, gözle görülür kasılmaya yol açan asıl
       kaynaktı. Artık boyut değişmediği sürece aynı canvas temizlenip
       yeniden kullanılıyor. */
    _scratch: {},
    _getScratchCanvas: function (key, w, h) {
      var c = this._scratch[key];
      if (!c) { c = document.createElement('canvas'); this._scratch[key] = c; }
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      return c;
    },

    /* ================= KOMPOZİT ÖNBELLEK =================
       renderMap() tüm katmanları tuval boyutunda besteler; pan/zoom bunu
       değiştirmez, yalnızca görüntü dönüşümünü değiştirir. Bu yüzden
       besteyi bir kez mapCanvas'a yazıp her karede sadece GÖRÜNEN
       dikdörtgeni blit ediyoruz. Kare maliyeti tuvalin değil ekranın
       alanıyla orantılı hâle geliyor.

       Güvenlik için varsayılan taraf "kirli": requestRender() içeriği
       geçersiz kılar, yani bir düzenleme yolunu işaretlemeyi unutmak
       bayat harita üretemez — yalnızca gereksiz yeniden beste yapar.
       Sıcak görüntü yolları (pan/zoom/imleç) requestViewRender() ile
       açıkça hızlı tarafı seçer. */
    mapCanvas: null,
    mapDirty: true,
    mapDirtyRect: null,

    /* ÖLÇEK KADEMESİ (LOD): sığdırma zumunda tüm harita görünür olduğu için
       kırpma işe yaramaz — 8192² bir besteyi her karede ~800px'e küçültmek
       kare başına 67 milyon kaynak pikseli örneklemek demek. Bunun yerine
       küçültülmüş bir kopya tutup düşük zumda ondan blit ediyoruz. */
    mapLod: null,
    LOD_MAX: 2048,

    /* PAHALI EFEKT KISITLAMASI: kıyı parlaması ve yükselti gölgelendirmesi
       tüm siluet üzerinden yeniden hesaplanır (2048²'de ~145 ms). Fırça
       sürüklenirken bunu her karede yapmak kareyi 5 fps'e düşürüyordu.
       Vuruş sürerken en fazla FX_THROTTLE_MS'de bir yeniden kuruyoruz;
       dirty bayrağı temizlenmediği için vuruş biter bitmez tam doğru
       hâline geliyor. */
    _fxAt: 0,
    _fxCost: 0,
    _fxStart: 0,
    FX_THROTTLE_MS: 130,

    /* Bekleme süresi ölçülen maliyete göre kendini ayarlar: efekt ne kadar
       pahalıysa o kadar seyrek kurulur. Böylece 1024²'de neredeyse anlık,
       8192²'de ise kareyi boğmayacak sıklıkta çalışır — sabit bir eşik
       ayarlamaya gerek kalmaz. */
    _fxThrottled: function () {
      if (!global.Tools || !Tools.painting) return false;
      var now = performance.now();
      var wait = Math.max(this.FX_THROTTLE_MS, this._fxCost * 5);
      if (now - this._fxAt < wait) return true;
      this._fxAt = now;
      this._fxStart = now;
      return false;
    },

    _fxDone: function () {
      if (this._fxStart) {
        this._fxCost = performance.now() - this._fxStart;
        this._fxStart = 0;
      }
    },

    /* içerik değişti — tüm besteyi (veya verilen dikdörtgeni) yenile */
    requestRender: function (rect) {
      if (rect) this._addDirtyRect(rect);
      else { this.mapDirty = true; this.mapDirtyRect = null; }
      this.requestViewRender();
    },

    /* yalnızca görüntü değişti (pan / zoom / imleç) — besteye dokunma */
    requestViewRender: function () {
      var self = this;
      if (this._raf) return;
      this._raf = requestAnimationFrame(function () { self._raf = 0; self.render(); });
    },

    _addDirtyRect: function (r) {
      if (this.mapDirty) return;            /* zaten tamamı yenilenecek */
      var d = this.mapDirtyRect;
      if (!d) { this.mapDirtyRect = { x0:r.x0, y0:r.y0, x1:r.x1, y1:r.y1 }; return; }
      if (r.x0 < d.x0) d.x0 = r.x0;
      if (r.y0 < d.y0) d.y0 = r.y0;
      if (r.x1 > d.x1) d.x1 = r.x1;
      if (r.y1 > d.y1) d.y1 = r.y1;
    },

    ensureComposite: function () {
      var c = this.mapCanvas;
      if (!c || c.width !== this.W || c.height !== this.H) {
        c = this.mapCanvas = document.createElement('canvas');
        c.width = this.W; c.height = this.H;
        this.mapDirty = true; this.mapDirtyRect = null;
      }
      if (!this.mapDirty && !this.mapDirtyRect) return c;

      var mctx = c.getContext('2d');
      mctx.setTransform(1,0,0,1,0,0);

      if (this.mapDirty) {
        this._syncMini(null);
        mctx.clearRect(0, 0, this.W, this.H);
        this.renderMap(mctx, { includeReference:true, trace:true });
      } else {
        /* kısmi yenileme: fırça vuruşu gibi yerel değişikliklerde yalnızca
           etkilenen dikdörtgen yeniden bestelenir */
        var d = this.mapDirtyRect;
        var x0 = Math.max(0, Math.floor(d.x0)), y0 = Math.max(0, Math.floor(d.y0));
        var x1 = Math.min(this.W, Math.ceil(d.x1)), y1 = Math.min(this.H, Math.ceil(d.y1));
        if (x1 > x0 && y1 > y0) {
          this._syncMini({ x0:x0, y0:y0, x1:x1, y1:y1 });
          mctx.save();
          mctx.beginPath();
          mctx.rect(x0, y0, x1-x0, y1-y0);
          mctx.clip();
          mctx.clearRect(x0, y0, x1-x0, y1-y0);
          /* renderMap içindeki yardımcı scratch tuvalleri (nehir/yol kara
             kırpması) ayrı yüzeylerde çalışır; ctx clip'i onları bağlamaz.
             Bu yüzden etkin dikdörtgeni ayrıca duyuruyoruz. */
          this._clipRect = { x:x0, y:y0, w:x1-x0, h:y1-y0 };
          this.renderMap(mctx, { includeReference:true, trace:true });
          this._clipRect = null;
          mctx.restore();
        }
      }
      this._lodSync(this.mapDirty ? null : this.mapDirtyRect);
      this.mapDirty = false;
      this.mapDirtyRect = null;
      return c;
    },

    /* KÜÇÜK AYNALAR: kıyı hesabı kara ve arazi katmanının küçültülmüş
       hâlini ister. Eskiden her çağrıda tam boyuttan küçültülüyordu —
       8192²'de tek bir kıyı yenilemesi 67 milyon kaynak piksel okumak
       demekti. Bunun yerine 1024²'lik aynaları fırçanın dokunduğu
       dikdörtgen kadar artımlı güncelliyoruz. */
    MINI_MAX: 1024,
    _miniScale: 1,

    /* Birikim: kirli dikdörtgeni sakla, işi kıyı gerçekten kurulana ertele.
       Arazi fırçası kıyıyı bayatlatmadığı için o vuruşlarda hiç bedel ödenmez. */
    _miniDirty: null,
    _miniAll: true,

    _syncMini: function (rect) {
      if (!rect) { this._miniAll = true; this._miniDirty = null; return; }
      if (this._miniAll) return;
      var d = this._miniDirty;
      if (!d) { this._miniDirty = { x0:rect.x0, y0:rect.y0, x1:rect.x1, y1:rect.y1 }; return; }
      if (rect.x0 < d.x0) d.x0 = rect.x0;
      if (rect.y0 < d.y0) d.y0 = rect.y0;
      if (rect.x1 > d.x1) d.x1 = rect.x1;
      if (rect.y1 > d.y1) d.y1 = rect.y1;
    },

    _miniFlush: function () {
      var rect = this._miniAll ? null : this._miniDirty;
      if (!this._miniAll && !rect) return;      /* değişiklik yok */
      this._miniAll = false; this._miniDirty = null;
      var sc = Math.min(1, this.MINI_MAX / Math.max(this.W, this.H));
      var sw = Math.max(1, Math.round(this.W*sc)), sh = Math.max(1, Math.round(this.H*sc));
      this._miniScale = sc;
      var self = this;
      ['landmass','terrain'].forEach(function (id) {
        var L = Layers.get(id);
        if (!L || !L.canvas) return;
        var key = '_mini_' + id;
        var m = self[key], fresh = false;
        if (!m || m.width !== sw || m.height !== sh) {
          m = self[key] = document.createElement('canvas');
          m.width = sw; m.height = sh; fresh = true;
        }
        var c = m.getContext('2d');
        c.setTransform(1,0,0,1,0,0);
        c.globalCompositeOperation = 'source-over';
        if (fresh || !rect) {
          c.clearRect(0,0,sw,sh);
          c.drawImage(L.canvas, 0, 0, sw, sh);
          return;
        }
        var x0 = Math.max(0, Math.floor(rect.x0)), y0 = Math.max(0, Math.floor(rect.y0));
        var x1 = Math.min(self.W, Math.ceil(rect.x1)), y1 = Math.min(self.H, Math.ceil(rect.y1));
        if (x1 <= x0 || y1 <= y0) return;
        var dx = Math.floor(x0*sc), dy = Math.floor(y0*sc);
        var dw = Math.ceil((x1-x0)*sc)+1, dh = Math.ceil((y1-y0)*sc)+1;
        c.clearRect(dx, dy, dw, dh);
        c.drawImage(L.canvas, x0, y0, x1-x0, y1-y0, dx, dy, dw, dh);
      });
    },

    /* LOD'u besteyle eşitle. rect verilirse yalnızca o bölge güncellenir —
       fırça vuruşu sırasında tüm haritayı yeniden küçültmemek için. */
    _lodSync: function (rect) {
      var scale = Math.min(1, this.LOD_MAX / Math.max(this.W, this.H));
      if (scale >= 1) { this.mapLod = null; return; }   /* küçük tuval: gerek yok */
      var lw = Math.max(1, Math.round(this.W * scale));
      var lh = Math.max(1, Math.round(this.H * scale));
      var l = this.mapLod;
      var fresh = false;
      if (!l || l.width !== lw || l.height !== lh) {
        l = this.mapLod = document.createElement('canvas');
        l.width = lw; l.height = lh;
        l._scale = scale;
        fresh = true;
      }
      var lctx = l.getContext('2d');
      lctx.setTransform(1,0,0,1,0,0);
      if (fresh || !rect) {
        lctx.clearRect(0, 0, lw, lh);
        lctx.drawImage(this.mapCanvas, 0, 0, lw, lh);
        return;
      }
      /* kısmi: dikdörtgeni ölçekleyip yalnızca o parçayı tazele */
      var x0 = Math.max(0, Math.floor(rect.x0)), y0 = Math.max(0, Math.floor(rect.y0));
      var x1 = Math.min(this.W, Math.ceil(rect.x1)), y1 = Math.min(this.H, Math.ceil(rect.y1));
      if (x1 <= x0 || y1 <= y0) return;
      var dx = Math.floor(x0*scale), dy = Math.floor(y0*scale);
      var dw = Math.ceil((x1-x0)*scale) + 1, dh = Math.ceil((y1-y0)*scale) + 1;
      lctx.clearRect(dx, dy, dw, dh);
      lctx.drawImage(this.mapCanvas, x0, y0, x1-x0, y1-y0, dx, dy, dw, dh);
    },

    /* ekranda görünen harita dikdörtgeni (harita koordinatlarında) */
    visibleMapRect: function () {
      var x0 = -this.panX / this.zoom;
      var y0 = -this.panY / this.zoom;
      var x1 = x0 + this.vw / this.zoom;
      var y1 = y0 + this.vh / this.zoom;
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
      x1 = Math.min(this.W, Math.ceil(x1)); y1 = Math.min(this.H, Math.ceil(y1));
      return { x0:x0, y0:y0, x1:x1, y1:y1, w:x1-x0, h:y1-y0 };
    },

    /* ---------- KIYI EFEKTİ ----------
       Kara silüetini bulanıklaştırıp açık kum/sığ su tonunda
       birkaç halka olarak karanın altına çizer.                */
    buildShore: function () {
      /* vuruş sürerken kısıtla — dirty bayrağı korunur, vuruş bitince kurulur */
      if (this._fxThrottled() && this.shoreCanvas) return this.shoreCanvas;
      var L = Layers.get('landmass');
      var T = Layers.get('terrain');
      if (!L || !L.canvas) return null;
      this._miniFlush();
      if (!this._mini_landmass) { this._miniAll = true; this._miniFlush(); }
      var miniL = this._mini_landmass || L.canvas;
      var miniT = this._mini_terrain || (T ? T.canvas : L.canvas);
      var result = Terrain.buildShoreCanvas(
        miniL, miniT,
        this.shoreWidth, this.W, this.H, this.shoreStyle,
        !!this._mini_landmass
      );
      this.shoreCanvas = result.canvas;
      this.shoreDirty  = false;
      /* kıyı çizgisi değişti — nehir kesim noktaları geçersiz olabilir */
      this._riverCrossingCache = {};

      /* kara/deniz nokta testi için düşük çözünürlüklü alfa önbelleği —
         sembol "karaya kenetle" (clip) kontrolü ve fırça yerleştirmesi bunu kullanır */
      var LS = 512;
      var scx = document.createElement('canvas'); scx.width = LS; scx.height = LS;
      var sctx = scx.getContext('2d', { willReadFrequently:true });
      sctx.drawImage(L.canvas, 0, 0, LS, LS);
      this.landSample = { data: sctx.getImageData(0,0,LS,LS).data, size: LS, scale: LS / this.W };

      this._fxDone();
      return result.canvas;
    },

    /* (x,y) tuval koordinatındaki nokta kara mı? Önbellek yoksa iyimser true döner. */
    isOnLand: function (x, y) {
      var ls = this.landSample;
      if (!ls) return true;
      var sx = Math.round(x * ls.scale), sy = Math.round(y * ls.scale);
      if (sx < 0 || sy < 0 || sx >= ls.size || sy >= ls.size) return false;
      return ls.data[(sy*ls.size + sx)*4 + 3] > 30;
    },

    /* ---------- YÜKSELTİ EFEKTİ (hillshade + kontur) ----------
       Yükselti katmanı ham gri tonlama olarak saklanır (fırça:
       tools.js#stamp). Burada bu veriden eğim tabanlı basit bir
       gölgeleme (hillshade) ve/veya kontur çizgisi türetilip tek bir
       önbelleğe alınmış katman olarak terrain'in üstüne, diğer
       nesnelerin altına bindirilir — kıyı efektiyle aynı mimari. */
    buildElevationEffect: function () {
      if (this._fxThrottled() && this.elevationCanvas) return this.elevationCanvas;
      var Lv = Layers.get('elevation');
      if (!Lv || !Lv.canvas) return null;
      /* Bu efekt dirty-flag ile tembel yeniden hesaplanıyor (her karede değil,
         sadece yükselti değiştiğinde) — bu yüzden sınırı düşük tutmaya gerek
         yok. Eski 1024 sınırı standart 2048² tuvalde 2x küçültüp geri
         büyütüyordu, bu da yakınlaştırınca bulanık/pikselli görünüyordu. */
      var MAX = 2048;
      var W = this.W, H = this.H;
      var sc = Math.min(1, MAX/Math.max(W,H));
      var sw = Math.max(1, Math.round(W*sc)), sh = Math.max(1, Math.round(H*sc));

      var tC = this._getScratchCanvas('elevfx', sw, sh);
      var tctx = tC.getContext('2d', { willReadFrequently:true });
      tctx.setTransform(1,0,0,1,0,0);
      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, sw, sh);
      tctx.drawImage(Lv.canvas, 0, 0, sw, sh);
      var data = tctx.getImageData(0, 0, sw, sh).data;

      function heightAt(x, y) {
        x = x < 0 ? 0 : x >= sw ? sw-1 : x;
        y = y < 0 ? 0 : y >= sh ? sh-1 : y;
        var i = (y*sw + x) * 4;
        var a = data[i+3] / 255;
        return a > 0.02 ? (data[i]*a + 128*(1-a)) : 128;
      }

      var showHS = App.elevation.showHillshade;
      var showCT = App.elevation.showContours;
      var interval = Math.max(4, App.elevation.contourInterval || 32);
      var lx = 0.6, ly = -0.5;

      var out = tctx.createImageData(sw, sh);
      var od = out.data;
      for (var y = 0; y < sh; y++) {
        for (var x = 0; x < sw; x++) {
          var i2 = (y*sw + x) * 4;
          var r = 0, g = 0, b = 0, al = 0;
          if (showHS) {
            var hx = heightAt(x+1, y) - heightAt(x-1, y);
            var hy = heightAt(x, y+1) - heightAt(x, y-1);
            var slope = hx*lx + hy*ly;
            if (slope > 0.5) { al = Math.min(1, slope/40) * 0.5; r = g = b = 255; }
            else if (slope < -0.5) { al = Math.min(1, -slope/40) * 0.5; r = g = b = 0; }
          }
          if (showCT) {
            var hC = heightAt(x, y), hR = heightAt(x+1, y), hD = heightAt(x, y+1);
            var bC = Math.floor(hC/interval), bR = Math.floor(hR/interval), bD = Math.floor(hD/interval);
            if (bC !== bR || bC !== bD) {
              r = 74; g = 58; b = 34;
              al = Math.max(al, 0.55);
            }
          }
          od[i2] = r; od[i2+1] = g; od[i2+2] = b; od[i2+3] = Math.round(al*255);
        }
      }
      tctx.putImageData(out, 0, 0);

      /* yükselti gölgelendirmesi/konturları da sadece kara üzerinde görünmeli —
         denizde asılı bir tepe gölgesi/kontur çizgisi olmasın */
      var LvLand = Layers.get('landmass');
      if (LvLand && LvLand.canvas) {
        tctx.globalCompositeOperation = 'destination-in';
        tctx.drawImage(LvLand.canvas, 0, 0, sw, sh);
        tctx.globalCompositeOperation = 'source-over';
      }

      this.elevationCanvas = tC;
      this.elevationDirty = false;
      this._fxDone();
      return tC;
    },

    /* ---------- ana render ---------- */
    render: function () {
      var ctx = this.ctx;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0, 0, this.view.width, this.view.height);
      ctx.setTransform(this.dpr,0,0,this.dpr,0,0);

      /* beste yalnızca içerik değiştiğinde yeniden kurulur */
      var comp = this.ensureComposite();

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 30/this.zoom;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.restore();

      /* GÖRÜNÜR ALAN KIRPMASI: haritanın yalnızca ekrana düşen parçası
         blit edilir; 8192² bir tuvalde bile maliyet ekran alanı kadardır.
         Düşük zumda kaynak olarak küçültülmüş LOD kullanılır — aynı ekran
         sonucunu üretir ama örneklenen kaynak piksel sayısı çok azdır. */
      var v = this.visibleMapRect();
      if (v.w > 0 && v.h > 0) {
        var src = comp, k = 1;
        var lod = this.mapLod;
        if (lod && this.zoom <= lod._scale) { src = lod; k = lod._scale; }
        ctx.drawImage(src,
          v.x0*k, v.y0*k, v.w*k, v.h*k,
          v.x0,   v.y0,   v.w,   v.h);
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1/this.zoom;
      ctx.strokeRect(0, 0, this.W, this.H);

      if (this.grid) this.drawGrid(ctx, v);
      if (global.Tools) Tools.drawOverlay(ctx);

      ctx.restore();

      this.drawCursor(ctx);

      var now = performance.now();
      if (now - this._miniAt > 200) { this._miniAt = now; this.renderMini(); }
      if (global.UI) UI.status();
    },

    /* ---------- tam harita ---------- */
    renderMap: function (ctx, opt) {
      opt = opt || {};
      var W = this.W, H = this.H;

      /* --- okyanus --- */
      ctx.save();
      var op = ctxPattern(ctx, oceanTile, 'ocean');
      ctx.fillStyle = op || this.seaColor;
      ctx.fillRect(0, 0, W, H);
      /* derinlik gradyanı — seçili deniz renginin koyulaştırılmış tonu */
      var dRgb = shadeRgb(hexToRgbArr(this.seaColor), 0.62);
      var og = ctx.createRadialGradient(W*0.5, H*0.5, Math.min(W,H)*0.15, W*0.5, H*0.5, Math.max(W,H)*0.78);
      og.addColorStop(0, 'rgba('+dRgb[0]+','+dRgb[1]+','+dRgb[2]+',0.00)');
      og.addColorStop(1, 'rgba('+dRgb[0]+','+dRgb[1]+','+dRgb[2]+',0.42)');
      ctx.fillStyle = og;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      /* --- kıyı efekti (kara katmanından hemen önce) --- */
      var landLayer = this.get_('landmass');
      if (this.shore && landLayer && landLayer.visible) {
        if (this.shoreDirty || !this.shoreCanvas) this.buildShore();
        if (this.shoreCanvas) {
          ctx.save();
          ctx.globalAlpha = 0.9 * landLayer.opacity;
          ctx.drawImage(this.shoreCanvas, 0, 0, W, H);
          ctx.restore();
        }
      }

      /* --- nehir ağzı deniz plume'u: TERRAIN'DEN ÖNCE çizilir.
         Böylece terrain rasteri bunun üstüne biner ve karaya taşan
         kısım otomatik örtülür — kıyı efektiyle aynı teknik. --- */
      var riversLayerEarly = Layers.get('rivers');
      if (riversLayerEarly && riversLayerEarly.visible) {
        var self0 = this;
        for (var pi = 0; pi < riversLayerEarly.objects.length; pi++) {
          var ro = riversLayerEarly.objects[pi];
          if (ro.kind === 'lake') continue;
          if (!ro.pts || ro.pts.length < 2) continue;
          var fp = self0.riverGeometry(ro);
          var wE = ro.width || 12;
          var crossings0 = self0._findAllSeaCrossingsCached(ro, fp);
          for (var ci = 0; ci < crossings0.length; ci++) {
            self0._drawRiverPlume(ctx, ro, crossings0[ci], fp, ro.color || '#5b8aa6', wE);
          }
        }
      }

      for (var i = 0; i < Layers.list.length; i++) {
        var l = Layers.list[i];
        if (!l.visible) continue;
        if (l.id === 'roads') continue; /* 'rivers' bloğunda nehirlerle birlikte çizildi */

        if (l.id === 'reference') {
          if (!opt.includeReference || !l.image) continue;
          ctx.save();
          ctx.globalAlpha = l.opacity;
          ctx.drawImage(l.image, 0, 0, W, H);
          ctx.restore();
          continue;
        }

        if (l.id === 'elevation') {
          if (this.political && this.politicalMuteTerrain) continue;
          if (App.elevation && (App.elevation.showHillshade || App.elevation.showContours)) {
            if (this.elevationDirty || !this.elevationCanvas) this.buildElevationEffect();
            if (this.elevationCanvas) {
              ctx.save();
              ctx.globalAlpha = l.opacity;
              ctx.drawImage(this.elevationCanvas, 0, 0, W, H);
              ctx.restore();
            }
          }
          continue;
        }

        if (l.type === 'raster') {
          ctx.save();
          ctx.globalAlpha = l.opacity;
          /* siyasi görünümde arazi dokusu susturulur: devlet renkleri
             okunabilsin diye zemin sakinleşir, ama tamamen kaybolmaz */
          if (this.political && this.politicalMuteTerrain && l.id === 'terrain') {
            ctx.globalAlpha = l.opacity * 0.22;
          }
          ctx.globalCompositeOperation = l.blend || 'source-over';
          ctx.drawImage(l.canvas, 0, 0, W, H);
          ctx.restore();
          continue;
        }

        if (l.type === 'vector') {
          ctx.save();
          ctx.globalAlpha = l.opacity;
          var self_ = this;
          if (l.id === 'rivers') {
            /* Yollar, kara/arazi/yükselti/bölgeler (bu noktada zaten çizilmiş)
               ÜSTÜNDE ama nehirlerin ALTINDA görünmeli (köprü olmadan geçiş
               doğal görünsün) — panel sırasını değiştirmeden, yalnızca
               render sırasında yolları burada, nehirlerden hemen önce çiziyoruz. */
            var roadsLayerNow = Layers.get('roads');
            if (roadsLayerNow && roadsLayerNow.visible) {
              /* Yollar da denizi geçmemeli — köprüsüz bir yol denizin
               ortasında asılı kalmasın; nehir/göl ile aynı kara-kırpma
               tekniği (bkz. aşağıdaki 'rivers' bloğu). */
              var Lm2 = Layers.get('landmass');
              /* nesne yoksa tam boyutlu scratch tahsis etme — 8192² bir
                 tuvalde bu tek başına 268 MB'lık boş bir yüzey demekti */
              var rc2 = (Lm2 && Lm2.canvas && roadsLayerNow.objects.length)
                        ? this._getScratchCanvas('roads', W, H) : null;
              var rdctx = ctx;
              var cr2 = this._clipRect;
              if (rc2) {
                rdctx = rc2.getContext('2d');
                rdctx.setTransform(1,0,0,1,0,0);
                if (cr2) {
                  rdctx.clearRect(cr2.x, cr2.y, cr2.w, cr2.h);
                  rdctx.save();
                  rdctx.beginPath(); rdctx.rect(cr2.x, cr2.y, cr2.w, cr2.h); rdctx.clip();
                } else {
                  rdctx.clearRect(0, 0, W, H);
                }
              }
              else { ctx.save(); ctx.globalAlpha = roadsLayerNow.opacity; }
              for (var ri = 0; ri < roadsLayerNow.objects.length; ri++) {
                this.drawRoad(rdctx, roadsLayerNow.objects[ri]);
              }
              if (rc2) {
                rdctx.globalCompositeOperation = 'destination-in';
                if (cr2) rdctx.drawImage(Lm2.canvas, cr2.x, cr2.y, cr2.w, cr2.h, cr2.x, cr2.y, cr2.w, cr2.h);
                else     rdctx.drawImage(Lm2.canvas, 0, 0);
                rdctx.globalCompositeOperation = 'source-over';
                if (cr2) rdctx.restore();
                ctx.save();
                ctx.globalAlpha = roadsLayerNow.opacity;
                if (cr2) ctx.drawImage(rc2, cr2.x, cr2.y, cr2.w, cr2.h, cr2.x, cr2.y, cr2.w, cr2.h);
                else     ctx.drawImage(rc2, 0, 0);
                ctx.restore();
              } else {
                ctx.restore();
              }
            }

            /* Nehirler ve göller sadece kara üzerinde var olmalı — denizde
               yüzen bir göl ya da denize taşan bir nehir ağzı olmamalı.
               Tüm katmanı önce ayrı bir scratch canvas'a çizip, sonra
               kara maskesiyle (destination-in) kırpıp asıl ctx'e composite
               ediyoruz; böylece mevcut 4 geçişli çizim mantığına dokunmadan
               tek noktadan kırpma uygulanmış oluyor. */
            var Lm_ = Layers.get('landmass');
            var rc = (Lm_ && Lm_.canvas && l.objects.length)
                     ? this._getScratchCanvas('rivers', W, H) : null;
            var rctx3 = rc ? rc.getContext('2d') : null;
            var cr = this._clipRect;
            if (rctx3) {
              rctx3.setTransform(1,0,0,1,0,0);
              if (cr) {
                rctx3.clearRect(cr.x, cr.y, cr.w, cr.h);
                rctx3.save();
                rctx3.beginPath(); rctx3.rect(cr.x, cr.y, cr.w, cr.h); rctx3.clip();
              } else {
                rctx3.clearRect(0, 0, W, H);
              }
            }
            var dctx = rctx3 || ctx;

            /* 1. pass: göl kıyı bantları — nehirlerin altında */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind === 'lake') self_.drawLakeShore(dctx, l.objects[j]);
            }
            /* 2. pass: nehirler — göl kıyısının üstünde */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind !== 'lake') self_.drawRiver(dctx, l.objects[j]);
            }
            /* 3. pass: göl dolguları — nehirlerin üstünde */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind === 'lake') self_.drawLakeFill(dctx, l.objects[j]);
            }
            /* 4. pass: nehir-göl birleşim yerinde delta/plume karışım efekti */
            for (var j = 0; j < l.objects.length; j++) {
              if (l.objects[j].kind !== 'lake') {
                for (var k2 = 0; k2 < l.objects.length; k2++) {
                  if (l.objects[k2].kind === 'lake') {
                    self_.drawRiverLakeConfluence(dctx, l.objects[j], l.objects[k2]);
                  }
                }
              }
            }

            if (rc) {
              rctx3.globalCompositeOperation = 'destination-in';
              if (cr) rctx3.drawImage(Lm_.canvas, cr.x, cr.y, cr.w, cr.h, cr.x, cr.y, cr.w, cr.h);
              else    rctx3.drawImage(Lm_.canvas, 0, 0);
              rctx3.globalCompositeOperation = 'source-over';
              if (cr) { rctx3.restore(); ctx.drawImage(rc, cr.x, cr.y, cr.w, cr.h, cr.x, cr.y, cr.w, cr.h); }
              else    ctx.drawImage(rc, 0, 0);
            }
          } else if (l.id === 'territories') {
            /* Bölgeler karaya kırpılır: siyasi haritada bir devlet denize
               taşmaz. Nehir/yol ile aynı destination-in tekniği. */
            var LmT = Layers.get('landmass');
            var tc = (LmT && LmT.canvas && l.objects.length)
                     ? this._getScratchCanvas('terr', W, H) : null;
            var crT = this._clipRect;
            var tctx2 = ctx;
            if (tc) {
              tctx2 = tc.getContext('2d');
              tctx2.setTransform(1,0,0,1,0,0);
              tctx2.globalCompositeOperation = 'source-over';
              tctx2.globalAlpha = 1;
              if (crT) {
                tctx2.clearRect(crT.x, crT.y, crT.w, crT.h);
                tctx2.save();
                tctx2.beginPath(); tctx2.rect(crT.x, crT.y, crT.w, crT.h); tctx2.clip();
              } else {
                tctx2.clearRect(0, 0, W, H);
              }
            }
            for (var jt = 0; jt < l.objects.length; jt++) {
              if (!this.territoryVisibleInMode(l.objects[jt])) continue;
              this.drawTerritory(tctx2, l.objects[jt]);
            }
            if (tc) {
              tctx2.globalCompositeOperation = 'destination-in';
              if (crT) tctx2.drawImage(LmT.canvas, crT.x, crT.y, crT.w, crT.h, crT.x, crT.y, crT.w, crT.h);
              else     tctx2.drawImage(LmT.canvas, 0, 0);
              tctx2.globalCompositeOperation = 'source-over';
              if (crT) { tctx2.restore(); ctx.drawImage(tc, crT.x, crT.y, crT.w, crT.h, crT.x, crT.y, crT.w, crT.h); }
              else     ctx.drawImage(tc, 0, 0);
            }
            /* devlet adları kırpmanın dışında — kıyıya taşan uzun bir ad
               yarıda kesilmemeli */
            if (this.political) {
              for (var jn = 0; jn < l.objects.length; jn++) {
                if (!this.territoryVisibleInMode(l.objects[jn])) continue;
                this.drawCapitalMark(ctx, l.objects[jn]);
                this.drawTerritoryName(ctx, l.objects[jn]);
              }
            }
          } else {
            for (var j = 0; j < l.objects.length; j++) {
              var o = l.objects[j];
              if (l.id === 'symbols') {
                if (o.clip && !this.isOnLand(o.x, o.y)) { /* kara sınırı dışına taştı — çizme */ }
                else if (o.kind === 'group') {
                  o.members.forEach(function(m){ Sym.draw(ctx, m.sym, m, function(){ Cv.requestRender(); }); });
                } else {
                  Sym.draw(ctx, o.sym, o, function(){ Cv.requestRender(); });
                }
              }
              else if (l.id === 'resources') this.drawResource(ctx, o);
              else if (l.id === 'measures') { if (opt.includeLinks !== false) this.drawMeasure(ctx, o); }
              else if (l.id === 'links') { if (opt.includeLinks !== false) this.drawLink(ctx, o); }
              else if (l.id === 'labels') this.drawLabel(ctx, o);
            }
          }
          ctx.restore();
          continue;
        }

        if (l.type === 'overlay' && this.parchment) {
          ctx.save();
          ctx.globalAlpha = 0.55 * l.opacity;
          ctx.globalCompositeOperation = 'multiply';
          var pp = ctxPattern(ctx, parchTile, 'parch');
          ctx.fillStyle = pp || 'rgba(217,199,154,0.5)';
          ctx.fillRect(0, 0, W, H);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.35 * l.opacity;
          var g = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.32, W/2, H/2, Math.max(W,H)*0.72);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, 'rgba(60,40,15,0.75)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }
      }

      /* --- iz sürme modu: referans görseli, boyanan katmanların üstünde
         yarı saydam olarak tekrar çiz — opak fırça darbeleri referansı
         gizlemesin diye. Yalnızca interaktif görünümde (export'ta değil). */
      if (opt.trace && App.reference && App.reference.traceMode) {
        var refL = Layers.get('reference');
        if (refL && refL.image) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.drawImage(refL.image, 0, 0, W, H);
          ctx.restore();
        }
      }

      /* --- siyasi harita lejantı --- */
      if (this.political && this.politicalLegend) this.drawPoliticalLegend(ctx);
      if (this.symbolLegend) this.drawSymbolLegend(ctx);

      /* --- ölçek çubuğu (en üstte) --- */
      if (global.App && App.scale && App.scale.visible) this.drawScaleBar(ctx, App.scale);
      /* --- windrose --- */
      if (global.App && App.windrose && App.windrose.visible) this.drawWindrose(ctx, App.windrose);
      /* --- dekoratif harita çerçevesi (en üstte, PNG/SVG çıktısına dahil) --- */
      if (this.frame && this.frame.style !== 'none') this.drawFrame(ctx);
    },

    /* ---------- dekoratif harita çerçevesi ---------- */
    drawFrame: function (ctx) {
      var f = this.frame, W = this.W, H = this.H, w = f.width || 24;
      ctx.save();
      if (f.style === 'simple') {
        ctx.strokeStyle = f.color; ctx.lineWidth = w*0.18;
        ctx.strokeRect(w*0.5, w*0.5, W-w, H-w);
        ctx.lineWidth = w*0.06;
        ctx.strokeRect(w*0.9, w*0.9, W-w*1.8, H-w*1.8);
      } else if (f.style === 'rope') {
        ctx.strokeStyle = f.color; ctx.lineWidth = w*0.7; ctx.lineCap = 'round';
        ctx.strokeRect(w*0.5, w*0.5, W-w, H-w);
        var seg = w*1.1, peri = 2*(W+H)-8*w, n = Math.round(peri/seg);
        ctx.fillStyle = f.color;
        for (var i = 0; i < n; i++) {
          var t = i/n, pt = this._perimeterPoint(t, W, H, w*0.5);
          ctx.beginPath(); ctx.arc(pt.x, pt.y, w*0.16, 0, Math.PI*2); ctx.fill();
        }
      } else if (f.style === 'ornate') {
        ctx.strokeStyle = f.color; ctx.lineWidth = w*0.14;
        ctx.strokeRect(w*0.5, w*0.5, W-w, H-w);
        ctx.strokeRect(w*1.15, w*1.15, W-w*2.3, H-w*2.3);
        ctx.fillStyle = f.color;
        var corners = [[w*0.8,w*0.8],[W-w*0.8,w*0.8],[w*0.8,H-w*0.8],[W-w*0.8,H-w*0.8]];
        corners.forEach(function (c) {
          ctx.save(); ctx.translate(c[0], c[1]);
          ctx.beginPath();
          for (var k = 0; k < 4; k++) {
            var ang = k*Math.PI/2;
            ctx.moveTo(0,0);
            ctx.arc(0, 0, w*1.15, ang-0.28, ang+0.28);
          }
          ctx.fill('evenodd');
          ctx.beginPath(); ctx.arc(0, 0, w*0.32, 0, Math.PI*2); ctx.fill();
          ctx.restore();
        });
        /* kenar ortası küçük yaprak motifleri */
        var mids = [[W/2,w*0.8],[W/2,H-w*0.8],[w*0.8,H/2],[W-w*0.8,H/2]];
        mids.forEach(function (m) {
          ctx.beginPath(); ctx.arc(m[0], m[1], w*0.4, 0, Math.PI*2); ctx.fill();
        });
      }
      ctx.restore();
    },

    _perimeterPoint: function (t, W, H, inset) {
      var peri = 2*((W-inset*2)+(H-inset*2));
      var d = t*peri;
      var w2 = W-inset*2, h2 = H-inset*2;
      if (d < w2) return { x:inset+d, y:inset };
      d -= w2;
      if (d < h2) return { x:W-inset, y:inset+d };
      d -= h2;
      if (d < w2) return { x:W-inset-d, y:H-inset };
      d -= w2;
      return { x:inset, y:H-inset-d };
    },

    get_: function (id) { return Layers.get(id); },

    /* ---------- nehir ---------- */
    riverGeometry: function (o) {
      var pts = o.handles ? Geo.sampleBezier(o.pts, o.handles, 18, false) : Geo.sample(o.pts, 18);
      return Geo.meander(pts, (o.meander||0)*(o.width||12)*1.6, (o.width||12)*9);
    },

    _pointInPoly: function (x, y, pts) {
      var inside = false;
      for (var i=0, j=pts.length-1; i<pts.length; j=i++) {
        var xi=pts[i][0], yi=pts[i][1], xj=pts[j][0], yj=pts[j][1];
        var intersect = ((yi>y) !== (yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi);
        if (intersect) inside = !inside;
      }
      return inside;
    },

    /* nehir ucu göle giriyorsa: göl içine dağılan organik tortu bulutu.
       Geometrik yelpaze yerine çok sayıda yumuşak leke kullanılır. */
    drawRiverLakeConfluence: function (ctx, river, lake) {
      if (!river.pts || river.pts.length < 2 || !lake.pts || lake.pts.length < 3) return;
      var rPts = this.riverGeometry(river);
      var lPts = this.lakeSmoothPts(lake, 30);
      var mouth = rPts[rPts.length-1];
      if (!this._pointInPoly(mouth[0], mouth[1], lPts)) return;

      ctx.save();
      /* göl sınırına clip — dağılım göl dışına taşmasın */
      ctx.beginPath();
      ctx.moveTo(lPts[0][0], lPts[0][1]);
      for (var i=1;i<lPts.length;i++) ctx.lineTo(lPts[i][0], lPts[i][1]);
      ctx.closePath();
      ctx.clip();

      /* nehir ağzı dağılımıyla aynı organik yöntemi kullan */
      var fakeCrossing = { point: mouth, index: rPts.length-1 };
      this._drawRiverPlume(ctx, river, fakeCrossing, rPts,
                           river.color || lake.color || '#5b8aa6',
                           river.width || 12);

      ctx.restore();
    },

    /* karadan denize geçiş noktalarını bulur (BİRDEN FAZLA olabilir — nehir
       kara/deniz sınırını birden çok kez kesebilir, her kesişim ayrı bir
       "ağız" sayılır). SONUÇ CACHE'LENİR — her karede yeniden hesaplanmaz,
       sadece nehir noktaları değişince. */
    _riverCrossingCache: {},

    /* pts dizisindeki TÜM kara/deniz geçişlerini bulur. Her geçiş için
       çapa noktası her zaman DENİZ tarafındaki noktadır (yön farketmeksizin,
       karadan denize çıkış ya da denizden karaya giriş) — böylece ağız
       lekesi her zaman deniz yönüne doğru yayılır. */
    _findAllSeaCrossings: function (pts) {
      var lmLayer = global.Layers && Layers.get('landmass');
      if (!lmLayer || !lmLayer.canvas || pts.length < 2) return [];
      var tc = document.createElement('canvas'); tc.width=1; tc.height=1;
      var tx = tc.getContext('2d');
      function isLand(x, y) {
        try {
          tx.clearRect(0,0,1,1);
          tx.drawImage(lmLayer.canvas, Math.round(x)-1, Math.round(y)-1, 3,3, 0,0,1,1);
          return tx.getImageData(0,0,1,1).data[3] >= 80;
        } catch(e) { return true; }
      }
      var crossings = [];
      var prevLand = isLand(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) {
        var land = isLand(pts[i][0], pts[i][1]);
        if (land !== prevLand) {
          var seaIdx = land ? i - 1 : i;
          var landIdx = land ? i : i - 1;
          crossings.push({ index: seaIdx, prevIndex: landIdx, point: pts[seaIdx] });
          prevLand = land;
        }
      }
      return crossings;
    },

    _findAllSeaCrossingsCached: function (o, fullPts) {
      var key = JSON.stringify(o.pts);
      var c = this._riverCrossingCache[o.id];
      if (c && c.key === key) return c.crossings;
      var crossings = this._findAllSeaCrossings(fullPts);
      this._riverCrossingCache[o.id] = { key: key, crossings: crossings };
      return crossings;
    },

    drawRiver: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var fullPts = this.riverGeometry(o);
      var wEnd = o.width || 12;
      var wStart = o.taper ? Math.max(1.2, wEnd*0.18) : wEnd;
      var col = o.color || '#5b8aa6';
      var baseAlpha = (o.opacity === undefined ? 1 : o.opacity);

      /* Nehrin tüm uzunluğu çizilir — kara/deniz kırpması burada değil,
         çağıran renderMap() tarafında tek noktadan (destination-in maskesi)
         uygulanıyor. Bu sayede nehir kara/deniz sınırını birden çok kez
         kesse bile (birden fazla "ağız") her kara parçası doğru çizilir;
         sondan-tek-kesişim varsayımı yapmaz. */
      var pts = fullPts;

      var poly = Geo.ribbon(pts, wStart, wEnd);

      ctx.save();
      ctx.globalAlpha = baseAlpha;
      var path = Geo.polyPath(poly); path.closePath();
      ctx.fillStyle = col; ctx.fill(path);
      ctx.strokeStyle = col; ctx.globalAlpha = baseAlpha*0.55;
      ctx.lineWidth = Math.max(0.7, wEnd*0.09); ctx.lineJoin='round'; ctx.stroke(path);
      ctx.restore();

      /* not: deniz plume efekti artık burada değil — render döngüsünün
         başında (terrain katmanından önce) çiziliyor, böylece terrain
         onun üstüne binip karaya taşan kısmı otomatik örtüyor. */
    },

    /* ---------- nehir ağzı tortu dağılımı ----------
       Tek geometrik poligon yerine, akış yönünde savrulmuş ÇOK SAYIDA
       yumuşak radyal leke üst üste bindirilir. Her leke farklı konum,
       boyut ve saydamlıkta; toplamı düzensiz, bulutsu bir dağılım verir.
       Deterministik seed → her render'da aynı görünüm.               */
    _drawRiverPlume: function (realCtx, o, crossing, fullPts, col, wEnd) {
      var mouth = crossing.point;
      var prevIdx = (crossing.prevIndex !== undefined) ? crossing.prevIndex : Math.max(0, crossing.index - 1);
      var prevPt = fullPts[prevIdx];
      var dx = mouth[0]-prevPt[0], dy = mouth[1]-prevPt[1];
      var dlen = Math.hypot(dx,dy) || 1; dx/=dlen; dy/=dlen;
      var nx = -dy, ny = dx;

      /* Onlarca yarı-saydam leke normal source-over ile üst üste
         bindiğinde, ağız çevresinde kümülatif alfa hızla 1.0'a
         yaklaşıyor — bulutsu bir sis yerine denizin dokusunu tamamen
         örten OPAK bir yama gibi görünüyor (kullanıcı geri bildirimi:
         "nehir haritadaki ana sudan ayrı duruyor"). Bunu önlemek için
         tüm lekeler önce ayrı bir scratch canvas'a çizilip, gerçek
         ctx'e TEK bir üst sınır alfasıyla (cap) composite ediliyor —
         böylece en yoğun noktada bile altındaki okyanus dokusu bir
         miktar görünür kalıyor, sert/opak bir yama oluşmuyor. */
      var boxR = Math.ceil(wEnd * 4.2 * 1.35 + wEnd * 9);
      var bx = Math.max(0, Math.floor(mouth[0] - boxR));
      var by = Math.max(0, Math.floor(mouth[1] - boxR));
      var bw = Math.min(this.W - bx, boxR * 2);
      var bh = Math.min(this.H - by, boxR * 2);
      if (bw <= 0 || bh <= 0) return;
      var scratch = this._getScratchCanvas('plume', bw, bh);
      var ctx = scratch.getContext('2d');
      ctx.clearRect(0, 0, bw, bh);
      ctx.save();
      ctx.translate(-bx, -by);

      /* deterministik pseudo-random (nehir id + index seed) */
      var seedBase = 0;
      var idStr = String(o.id || '');
      for (var q=0; q<idStr.length; q++) seedBase += idStr.charCodeAt(q)*(q+1);
      seedBase += Math.round(mouth[0]*0.7 + mouth[1]*1.3);
      function rnd(i) {
        var x = Math.sin(seedBase*0.017 + i*78.233) * 43758.5453;
        return x - Math.floor(x);
      }

      /* rgb ayrıştır — alfalı gradient için */
      var hex = (col||'#5b8aa6').replace('#','');
      if (hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      var R = parseInt(hex.substr(0,2),16),
          G = parseInt(hex.substr(2,2),16),
          B = parseInt(hex.substr(4,2),16);
      function rgba(a) { return 'rgba('+R+','+G+','+B+','+a+')'; }

      var reach = wEnd * 4.2;      /* toplam yayılma mesafesi — kısaltıldı */
      var blobs = 24;            /* leke sayısı */

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';

      for (var i=0; i<blobs; i++) {
        var r1 = rnd(i*3), r2 = rnd(i*3+1), r3 = rnd(i*3+2);

        /* akış yönünde ilerleme: öne doğru yoğunlaşan dağılım */
        var t = Math.pow(r1, 0.65);              /* 0..1, ağıza yakın daha sık */
        var along = reach * t;

        /* yanal savrulma: mesafeyle artan, rastgele işaretli */
        var lateralMax = wEnd * (0.65 + t * 4.4);
        var lateral = (r2 - 0.5) * 2 * lateralMax;

        /* hafif geri/ileri jitter — sıra sıra dizilmesin */
        var jitter = (r3 - 0.5) * wEnd * 1.2;

        var px = mouth[0] + dx*(along + jitter) + nx*lateral;
        var py = mouth[1] + dy*(along + jitter) + ny*lateral;

        /* leke boyutu: uzaklaştıkça büyür ama zayıflar */
        var rad = wEnd * (0.95 + t*2.5) * (0.6 + r3*0.9);
        /* saydamlık: ağıza yakın koyu, uzakta silik */
        var alpha = 0.30 * (1 - t*0.88) * (0.55 + r2*0.65);
        if (alpha < 0.012) continue;

        var g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0,    rgba(alpha));
        g.addColorStop(0.45, rgba(alpha*0.55));
        g.addColorStop(1,    rgba(0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, rad, 0, Math.PI*2);
        ctx.fill();
      }

      /* ağız çekirdeği — nehrin sudan çıktığı nokta belli olsun,
         ama sert kenar olmadan */
      var coreR = wEnd * 1.7;
      var cg = ctx.createRadialGradient(mouth[0],mouth[1],0, mouth[0],mouth[1], coreR);
      cg.addColorStop(0,   rgba(0.42));
      cg.addColorStop(0.5, rgba(0.22));
      cg.addColorStop(1,   rgba(0));
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(mouth[0], mouth[1], coreR, 0, Math.PI*2);
      ctx.fill();

      ctx.restore(); /* globalCompositeOperation save (line ~967) */
      ctx.restore(); /* translate save (line ~943) */

      /* scratch'i gerçek tuvale TEK seferde, üst sınırlı bir alfa
         ile composite et — altındaki okyanus dokusu her zaman bir
         miktar görünür kalsın diye. */
      realCtx.save();
      realCtx.globalAlpha = 0.82;
      realCtx.drawImage(scratch, 0, 0, bw, bh, bx, by, bw, bh);
      realCtx.restore();
    },

    /* ---------- göl yardımcısı: köşe yumuşatma (Chaikin) ----------
       Kullanıcının elle çizdiği ham göl noktaları keskin köşeler
       içerebilir. Kapalı bir poligonu birkaç iterasyonda yumuşatır. */
    _chaikinSmooth: function (pts, iterations) {
      var out = pts;
      for (var it = 0; it < iterations; it++) {
        var next = [];
        var n = out.length;
        for (var i = 0; i < n; i++) {
          var p0 = out[i], p1 = out[(i+1)%n];
          next.push([p0[0]*0.75 + p1[0]*0.25, p0[1]*0.75 + p1[1]*0.25]);
          next.push([p0[0]*0.25 + p1[0]*0.75, p0[1]*0.25 + p1[1]*0.75]);
        }
        out = next;
      }
      return out;
    },

    /* ham çizim noktalarını basitleştir: birbirine çok yakın ardışık
       noktaları birleştir. Kullanıcının elle çizdiği göller genelde
       yoğun/düzensiz nokta kümeleri içerir, bu kümeler Chaikin sonrası
       bile ufak köşeler bırakabilir — önce onları temizliyoruz. */
    _simplifyPts: function (pts, minDist) {
      if (pts.length < 4) return pts;
      var out = [pts[0]];
      for (var i = 1; i < pts.length; i++) {
        var last = out[out.length-1];
        var d = Math.hypot(pts[i][0]-last[0], pts[i][1]-last[1]);
        if (d >= minDist) out.push(pts[i]);
      }
      if (out.length < 3) return pts; /* aşırı basitleşmeyi önle */
      return out;
    },

    /* göl/bölge için yumuşatılmış nokta dizisi üretir — tüm göl/bölge
       fonksiyonları bunu ortak kullanır ki kıyı ve dolgu birbiriyle
       tutarlı kalsın. o: nesne ({pts,handles}) ya da geriye dönük
       uyumluluk için doğrudan nokta dizisi kabul eder. */
    lakeSmoothPts: function (o, sampleN) {
      var rawPts  = Array.isArray(o) ? o : o.pts;
      var handles = Array.isArray(o) ? null : o.handles;
      if (handles) {
        /* kullanıcı tutamaç düzenlemesi yaptıysa: basitleştirme/Chaikin
           uygulanmaz, doğrudan kapalı bezier eğrisi örneklenir */
        return Geo.sampleBezier(rawPts, handles, 12, true);
      }
      /* Az agresif basitleştirme — kullanıcının orijinal hatlarını koru */
      var cleaned = this._simplifyPts(rawPts, 6);
      /* Daha fazla örnekleme noktası — detayları kaybetmeden yumuşat */
      var sampled = Geo.sample(cleaned, Math.max(sampleN, 48));
      /* SADECE 1 hafif Chaikin iterasyonu: çizilen şekli generic bir
         oval/elmasa dönüştürmeden yalnızca sivri köşeleri hafifçe kırpar.
         Önceki 5 iterasyon şekli tanınmaz hale getiriyordu. */
      return this._chaikinSmooth(sampled, 1);
    },

    /* ---------- göl yardımcısı: terrain kıyı rengi ----------
       getImageData her frame'de senkron GPU okuması yapar; terrain
       değişmediği sürece (shoreDirty false) sonucu göl id'sine göre
       önbelleğe alırız — pan/zoom sırasında tekrar tekrar okumayız. */
    _lakeShoreColorCache: {},
    _lakeShoreColor: function (pts, lakeId) {
      var sampleX = Math.round(pts[0][0]), sampleY = Math.round(pts[0][1]);
      var cache = this._lakeShoreColorCache;
      var entry = lakeId != null ? cache[lakeId] : null;
      if (entry && !this.shoreDirty && entry.sx === sampleX && entry.sy === sampleY) {
        return entry.col;
      }

      var shoreCol = 'rgba(195,178,140,0.75)';
      var tLayer = global.Layers && Layers.get('terrain');
      if (tLayer && tLayer.canvas) {
        try {
          var tc = document.createElement('canvas'); tc.width=1; tc.height=1;
          var tx = tc.getContext('2d');
          tx.drawImage(tLayer.canvas, sampleX-1, sampleY-1, 3, 3, 0, 0, 1, 1);
          var px = tx.getImageData(0,0,1,1).data;
          if (px[3] > 20) {
            var lr = Math.min(255,px[0]+60), lg = Math.min(255,px[1]+50), lb = Math.min(255,px[2]+40);
            shoreCol = 'rgba('+lr+','+lg+','+lb+',0.82)';
          }
        } catch(e) {}
      }

      if (lakeId != null) cache[lakeId] = { sx:sampleX, sy:sampleY, col:shoreCol };
      return shoreCol;
    },

    /* ---------- göl kıyı maskesi: blur tabanlı (raster), asla sivri uç üretmez ----------
       Vektör offset yöntemi göllerin dar/çukur (concave) bölgelerinde
       matematiksel olarak kırılıp sivri uçlar üretiyordu. Bunun yerine
       ana kıyı efektinde (buildShoreCanvas) kullanılan kanıtlanmış
       blur yöntemi kullanılıyor: göl siluetini çiz, blur uygula.
       Sonuç PTS bazlı cache'lenir — sadece göl şekli değişince yeniden
       hesaplanır, her karede değil. */
    _lakeShoreCache: {},

    _buildLakeShoreMask: function (o) {
      var pts = this.lakeSmoothPts(o, 40);
      var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for (var i=0;i<pts.length;i++) {
        if (pts[i][0]<minX) minX=pts[i][0];
        if (pts[i][0]>maxX) maxX=pts[i][0];
        if (pts[i][1]<minY) minY=pts[i][1];
        if (pts[i][1]>maxY) maxY=pts[i][1];
      }
      var pad = 46;
      var bx = minX-pad, by = minY-pad;
      var bw = (maxX-minX)+pad*2, bh = (maxY-minY)+pad*2;
      var MAXD = 700;
      var scale = Math.min(1, MAXD/Math.max(bw,bh,1));
      var cw = Math.max(1, Math.round(bw*scale)), ch = Math.max(1, Math.round(bh*scale));

      var c1 = document.createElement('canvas'); c1.width=cw; c1.height=ch;
      var x1 = c1.getContext('2d');
      x1.save();
      x1.scale(scale, scale);
      x1.translate(-bx, -by);
      x1.fillStyle = '#fff';
      x1.beginPath();
      x1.moveTo(pts[0][0], pts[0][1]);
      for (var i=1;i<pts.length;i++) x1.lineTo(pts[i][0], pts[i][1]);
      x1.closePath();
      x1.fill();
      x1.restore();

      /* blur ile yumuşak, düzensiz-görünen kenar — vektör diken riski yok */
      var blurPx = Math.max(4, 24*scale);
      var c2 = document.createElement('canvas'); c2.width=cw; c2.height=ch;
      var x2 = c2.getContext('2d');
      x2.filter = 'blur(' + blurPx.toFixed(1) + 'px)';
      x2.drawImage(c1, 0, 0);
      x2.filter = 'none';

      return { canvas:c2, bx:bx, by:by, bw:bw, bh:bh };
    },

    drawLakeShore: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;

      var key = JSON.stringify(o.pts);
      var entry = this._lakeShoreCache[o.id];
      if (!entry || entry.key !== key) {
        var built = this._buildLakeShoreMask(o);
        entry = { key:key, mask:built.canvas, bx:built.bx, by:built.by, bw:built.bw, bh:built.bh };
        this._lakeShoreCache[o.id] = entry;
      }

      var pts = this.lakeSmoothPts(o, 8);
      var shoreCol = this._lakeShoreColor(pts, o.id);

      /* maskeyi renklendir: ayrı bir scratch canvas'ta — ana ctx'e
         asla destination-in gibi yıkıcı bir mod uygulanmaz */
      var scratch = document.createElement('canvas');
      scratch.width = entry.mask.width; scratch.height = entry.mask.height;
      var sx = scratch.getContext('2d');
      sx.fillStyle = shoreCol;
      sx.fillRect(0,0,scratch.width,scratch.height);
      sx.globalCompositeOperation = 'destination-in';
      sx.drawImage(entry.mask, 0, 0);
      sx.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(scratch, entry.bx, entry.by, entry.bw, entry.bh);
      ctx.restore();
    },

    /* ---------- göl 2. pass: dolgu + iç efektler (nehirlerin üstünde) ---------- */
    drawLakeFill: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;
      var pts = this.lakeSmoothPts(o, 24);
      var col = o.color || '#5b8aa6';
      var shoreCol = this._lakeShoreColor(pts, o.id);

      var cx = 0, cy = 0;
      for (var k=0; k<pts.length; k++) { cx+=pts[k][0]; cy+=pts[k][1]; }
      cx /= pts.length; cy /= pts.length;

      function makePath() {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var i=1; i<pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
      }

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      /* ana dolgu */
      ctx.globalAlpha = 0.96;
      ctx.fillStyle = col;
      makePath(); ctx.fill();

      /* derinlik gradient */
      ctx.save();
      makePath(); ctx.clip();
      var maxR = 0;
      for (var j=0; j<pts.length; j++) {
        var d = Math.hypot(pts[j][0]-cx, pts[j][1]-cy);
        if (d > maxR) maxR = d;
      }
      var dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      dg.addColorStop(0,   'rgba(0,0,0,0.20)');
      dg.addColorStop(0.6, 'rgba(0,0,0,0.05)');
      dg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = dg;
      ctx.fillRect(cx-maxR-10, cy-maxR-10, (maxR+10)*2, (maxR+10)*2);
      ctx.restore();

      /* dış kenar ince */
      ctx.globalAlpha = 0.30;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      makePath(); ctx.stroke();

      ctx.restore();
    },

    /* ---------- bölge/toprak (territory) dolgusu ---------- */
    drawTerritory: function (ctx, o) {
      if (!o.pts || o.pts.length < 3) return;
      var pts = this.lakeSmoothPts(o, 24);
      ctx.save();
      ctx.lineJoin = 'round';
      var path = Geo.polyPath(pts);
      path.closePath();

      if (this.political) {
        /* SİYASİ GÖRÜNÜM: devlet alanı opak, sınır düz ve belirgin.
           Fizikî haritada bölge yalnızca bir gölgelendirmedir; siyasi
           haritada ise asıl konudur. */
        ctx.globalAlpha *= (this.politicalFill === undefined ? 0.92 : this.politicalFill);
        ctx.fillStyle = o.color || '#8a5a3a';
        ctx.fill(path);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = o.borderColor || '#4a3020';
        ctx.lineWidth = Math.max(2, o.borderWidth || 2) * 1.6;
        ctx.setLineDash([]);
        ctx.stroke(path);
        ctx.restore();
        return;
      }

      ctx.globalAlpha *= (o.opacity === undefined ? 0.30 : o.opacity);
      ctx.fillStyle = o.color || '#8a5a3a';
      ctx.fill(path);
      if (o.borderWidth) {
        ctx.globalAlpha = Math.min(1, (o.opacity === undefined ? 0.30 : o.opacity) * 2.4);
        ctx.strokeStyle = o.borderColor || '#5a3a20';
        ctx.lineWidth = o.borderWidth;
        ctx.setLineDash([o.borderWidth*3, o.borderWidth*2]);
        ctx.stroke(path);
      }
      ctx.restore();
    },

    /* ---------- siyasi harita ----------
       Ayrı bir katman değil, mevcut "Bölgeler" katmanının bir GÖRÜNÜM
       modu: aynı poligonlar devlet alanı olarak okunur. Böylece kullanıcı
       çizdiği bölgeleri kaybetmeden fizikî ve siyasi sunum arasında
       geçiş yapabiliyor. */
    political: false,
    politicalFill: 0.92,
    politicalMuteTerrain: true,
    politicalLegend: true,

    /* 'state' (varsayılan): devlet + elle-çizilmiş bölgeler görünür,
       kültür bölgeleri gizli. 'culture': tam tersi. Ayrı bir katman
       DEĞİL — aynı `territories` nesne listesinin `kind` alanına göre
       filtrelenmiş bir görünüm anahtarı (performans planı Kural A:
       yeni bir raster overlay yok, mevcut vektör render yolu). */
    politicalMode: 'state',

    /* Bir bölge nesnesinin şu anki siyasi görünüm modunda görünür olup
       olmadığı — renderMap'in 'territories' dalı ve dışa aktarımlar
       (PNG/SVG/HTML) aynı süzgeci kullanır. */
    territoryVisibleInMode: function (o) {
      var isCulture = o.kind === 'culture';
      return this.politicalMode === 'culture' ? isCulture : !isCulture;
    },

    /* Sembol lejantı: siyasi görünümden bağımsız, haritadaki sembol
       katmanında fiilen kullanılan sembol türlerini listeler. */
    symbolLegend: false,

    /* Devletlere görsel olarak birbirinden ayrılan renkler atar. Altın
       açı ile hue dağıtımı, komşu bölgelerin benzer renk almasını
       istatistiksel olarak engeller. */
    assignPoliticalColors: function () {
      var L = Layers.get('territories');
      if (!L || !L.objects.length) return 0;
      var n = L.objects.length;
      for (var i = 0; i < n; i++) {
        var h = (i * 137.508) % 360;                 /* altın açı */
        var s = 42 + (i % 3) * 9;
        var l = 52 + (i % 2) * 8;
        L.objects[i].color = this._hsl(h, s, l);
        L.objects[i].borderColor = this._hsl(h, Math.min(70, s + 18), 24);
      }
      return n;
    },

    _hsl: function (h, s, l) {
      s /= 100; l /= 100;
      var c = (1 - Math.abs(2*l - 1)) * s;
      var x = c * (1 - Math.abs(((h/60) % 2) - 1));
      var m = l - c/2, r=0, g=0, b=0;
      if (h < 60)       { r=c; g=x; }
      else if (h < 120) { r=x; g=c; }
      else if (h < 180) { g=c; b=x; }
      else if (h < 240) { g=x; b=c; }
      else if (h < 300) { r=x; b=c; }
      else              { r=c; b=x; }
      var f = function (v) {
        var t = Math.round((v + m) * 255).toString(16);
        return t.length < 2 ? '0'+t : t;
      };
      return '#' + f(r) + f(g) + f(b);
    },

    /* Başkent işareti: siyasi görünümde devletin başkentine küçük bir
       yıldız. Sembol katmanındaki yerleşim sembollerinden bağımsızdır —
       burada çizilen, devletin `capital` alanının kendisidir, yoksa elle
       atanan bir başkent haritada hiç görünmezdi. */
    drawCapitalMark: function (ctx, o) {
      if (!o.capital) return;
      var r = Math.max(5, Math.min(this.W, this.H) * 0.006);
      var x = o.capital.x, y = o.capital.y;
      ctx.save();
      ctx.beginPath();
      for (var i = 0; i < 10; i++) {
        var ang = -Math.PI/2 + i*Math.PI/5;
        var rad = (i % 2 === 0) ? r : r*0.42;
        var px = x + Math.cos(ang)*rad, py = y + Math.sin(ang)*rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#fffaf0';
      ctx.strokeStyle = o.borderColor || '#3a2b18';
      ctx.lineWidth = Math.max(1, r*0.22);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },

    /* Devlet adlarını alan merkezine yazar. */
    drawTerritoryName: function (ctx, o) {
      if (!o.name) return;
      var pts = o.pts;
      var cx = 0, cy = 0;
      for (var i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
      cx /= pts.length; cy /= pts.length;
      var size = o.nameSize || Math.max(18, Math.min(this.W, this.H) * 0.022);
      ctx.save();
      ctx.font = '600 ' + size + 'px ' + FONTS.serif;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.22;
      ctx.strokeStyle = 'rgba(255,252,242,0.85)';
      ctx.strokeText(o.name, cx, cy);
      ctx.fillStyle = o.nameColor || '#2e2013';
      ctx.fillText(o.name, cx, cy);
      ctx.restore();
    },

    /* Sağ alt köşeye devletlerin renk anahtarını çizer. */
    drawPoliticalLegend: function (ctx) {
      var L = Layers.get('territories');
      if (!L || !L.visible) return;
      var self = this;
      var items = L.objects.filter(function (o) { return o.name && self.territoryVisibleInMode(o); });
      if (!items.length) return;

      var pad = Math.max(10, this.W * 0.006);
      var row = Math.max(16, this.W * 0.014);
      var fs  = row * 0.62;
      var boxW = Math.max(this.W * 0.14, 160);
      var boxH = pad*2 + row*items.length;
      var x = this.W - boxW - pad*2, y = this.H - boxH - pad*2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = '#f4ead2';
      ctx.strokeStyle = '#5a4326';
      ctx.lineWidth = Math.max(1.2, this.W*0.0012);
      ctx.beginPath();
      ctx.rect(x, y, boxW, boxH);
      ctx.fill(); ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.font = '600 ' + fs + 'px ' + FONTS.serif;
      ctx.textBaseline = 'middle';
      for (var i = 0; i < items.length; i++) {
        var iy = y + pad + row*i + row/2;
        ctx.fillStyle = items[i].color || '#8a5a3a';
        ctx.strokeStyle = items[i].borderColor || '#4a3020';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(x + pad, iy - row*0.28, row*0.7, row*0.56);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2e2013';
        ctx.textAlign = 'left';
        ctx.fillText(items[i].name, x + pad + row*0.95, iy);
      }
      ctx.restore();
    },

    /* Sembol lejantı: 'symbols' katmanında fiilen kullanılan her sembol
       türünden bir örnek — siyasi lejantın (devlet renkleri) muadili ama
       sembol katalogu için. Elle tutulan bir metadata gerekmez: L.objects
       üzerinden dedupe edip Sym.draw ile gerçek ikonu çiziyoruz, böylece
       lejant her zaman haritada ne varsa onu gösterir. */
    drawSymbolLegend: function (ctx) {
      var L = Layers.get('symbols');
      if (!L || !L.visible) return;
      var seen = {}, items = [];
      L.objects.forEach(function (o) {
        if (!o.sym || seen[o.sym]) return;
        var def = Sym.get(o.sym);
        if (!def) return;
        seen[o.sym] = 1;
        items.push({ id:o.sym, def:def });
      });
      if (!items.length) return;

      var lang = (UI && UI.lang) || 'tr';
      items.forEach(function (it) {
        it.name = Sym.isCustom(it.id) ? (it.def.tr || it.def.en || it.id)
                : (global.i18nName ? global.i18nName(it.id, it.def.tr, it.def.en, lang)
                                    : (lang === 'tr' ? it.def.tr : it.def.en));
      });
      items.sort(function (a, b) { return a.name.localeCompare(b.name); });
      var MAXROWS = 24;
      if (items.length > MAXROWS) items = items.slice(0, MAXROWS);

      var pad = Math.max(10, this.W * 0.006);
      var row = Math.max(18, this.W * 0.014);
      var fs  = row * 0.58;
      var boxW = Math.max(this.W * 0.17, 200);
      var boxH = pad*2 + row*items.length;
      var x = pad*2, y = this.H - boxH - pad*2;

      ctx.save();
      ctx.globalAlpha = 0.93;
      ctx.fillStyle = '#f4ead2';
      ctx.strokeStyle = '#5a4326';
      ctx.lineWidth = Math.max(1.2, this.W*0.0012);
      ctx.beginPath();
      ctx.rect(x, y, boxW, boxH);
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;

      for (var i = 0; i < items.length; i++) {
        var iy = y + pad + row*i + row/2;
        var ix = x + pad + row*0.5;
        Sym.draw(ctx, items[i].id, { x:ix, y:iy, size: row*0.85 });
        ctx.fillStyle = '#2e2013';
        ctx.font = '600 ' + fs + 'px ' + FONTS.serif;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(items[i].name, x + pad + row*1.1, iy);
      }
      ctx.restore();
    },

    /* ---------- windrose ---------- */
    windroseSize: function (wr) { return wr.size || 120; },

    windroseBounds: function (wr) {
      var r = this.windroseSize(wr) * 0.6;
      return { x: wr.x - r, y: wr.y - r, w: r*2, h: r*2 };
    },

    drawWindrose: function (ctx, wr) {
      var style = wr.style || 'classic';
      if (style === 'minimal') { this.drawWindroseMinimal(ctx, wr); return; }

      var x = wr.x, y = wr.y, R = this.windroseSize(wr);
      var col = wr.color || '#3a2b18';
      ctx.save();
      ctx.translate(x, y);

      /* dış daire */
      ctx.strokeStyle = col;
      ctx.lineWidth = R * 0.025;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.52, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;

      /* 8 yön oku */
      var dirs = [0, 45, 90, 135, 180, 225, 270, 315];
      dirs.forEach(function(deg) {
        var rad = deg * Math.PI / 180;
        var isCard = (deg % 90 === 0); /* kardinal yönler daha büyük */
        var tip = isCard ? R * 0.50 : R * 0.32;
        var base = isCard ? R * 0.13 : R * 0.08;
        var side = isCard ? R * 0.10 : R * 0.06;
        ctx.save();
        ctx.rotate(rad);
        ctx.beginPath();
        ctx.moveTo(0, -tip);
        ctx.lineTo(side, -base);
        ctx.lineTo(0, 0);
        ctx.lineTo(-side, -base);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.globalAlpha = isCard ? 1.0 : 0.65;
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = R * 0.018;
        ctx.stroke();
        ctx.restore();
      });

      /* merkez nokta */
      ctx.beginPath(); ctx.arc(0, 0, R * 0.06, 0, Math.PI*2);
      ctx.fillStyle = '#f5ecd8'; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = R * 0.025; ctx.stroke();

      /* N harfi */
      ctx.font = 'bold ' + Math.round(R*0.22) + 'px Georgia,serif';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, -(R * 0.70));

      ctx.restore();
    },

    /* sade stil: ince artı + dört ana yön ticki + N etiketi, süslemesiz */
    drawWindroseMinimal: function (ctx, wr) {
      var x = wr.x, y = wr.y, R = this.windroseSize(wr);
      var col = wr.color || '#3a2b18';
      ctx.save();
      ctx.translate(x, y);

      ctx.strokeStyle = col;
      ctx.lineCap = 'round';

      /* dış çember */
      ctx.lineWidth = R * 0.02;
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.46, 0, Math.PI*2); ctx.stroke();

      /* dört ana eksen çizgisi */
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = R * 0.022;
      ctx.beginPath();
      ctx.moveTo(0, -R*0.46); ctx.lineTo(0, R*0.46);
      ctx.moveTo(-R*0.46, 0); ctx.lineTo(R*0.46, 0);
      ctx.stroke();

      /* ara yön tikleri */
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = R * 0.014;
      [45,135,225,315].forEach(function (deg) {
        var rad = deg * Math.PI/180;
        var x1 = Math.sin(rad)*R*0.36, y1 = -Math.cos(rad)*R*0.36;
        var x2 = Math.sin(rad)*R*0.46, y2 = -Math.cos(rad)*R*0.46;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      /* merkez nokta */
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.035, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.fill();

      /* N ucu ok */
      ctx.beginPath();
      ctx.moveTo(0, -R*0.46);
      ctx.lineTo(R*0.045, -R*0.36);
      ctx.lineTo(-R*0.045, -R*0.36);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();

      /* N harfi */
      ctx.font = '600 ' + Math.round(R*0.16) + 'px Georgia,serif';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', 0, -(R * 0.60));

      ctx.restore();
    },

    /* ---------- yol ---------- */
    roadGeometry: function (o) {
      return o.handles ? Geo.sampleBezier(o.pts, o.handles, 14, false) : Geo.sample(o.pts, 14);
    },

    drawRoad: function (ctx, o) {
      if (!o.pts || o.pts.length < 2) return;
      var pts = this.roadGeometry(o);
      var path = Geo.polyPath(pts);
      var w = o.width || 5;
      var col = o.color || '#6b4f2a';
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      /* --- alt gölge: hafif koyu şerit, sadece varlığı belli etmek için --- */
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = w * 1.9;
      ctx.stroke(path);

      /* --- zemin tonu: çok hafif, yolu terrain'den ayırmak için --- */
      ctx.strokeStyle = 'rgba(205,185,145,0.30)';
      ctx.lineWidth = w * 1.4;
      ctx.stroke(path);

      /* --- asıl yol çizgisi --- */
      ctx.strokeStyle = col;
      if (o.style === 'dashed') {
        ctx.setLineDash([w*2.6, w*2.0]); ctx.lineWidth = w; ctx.stroke(path);
      } else if (o.style === 'dotted') {
        ctx.setLineDash([w*0.35, w*2.1]); ctx.lineWidth = w; ctx.stroke(path);
      } else if (o.style === 'double') {
        ctx.setLineDash([]); ctx.lineWidth = w*1.9; ctx.stroke(path);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = w*0.7; ctx.stroke(path);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.setLineDash([]); ctx.lineWidth = w; ctx.stroke(path);
      }
      ctx.setLineDash([]);
      ctx.restore();
    },

    /* ================= ETİKETLER ================= */
    labelFont: function (o) {
      return '600 ' + (o.size||32) + 'px ' + (FONTS[o.font] || FONTS.serif);
    },

    labelText: function (o) {
      var t = o.text || '';
      return o.caps ? t.toUpperCase() : t;
    },

    /* Harf harf çizim (harf aralığı, yay, yola oturma) yalnızca her
       harfin bağımsız çizildiği yazılarda doğrudur. Arapça/Farsça gibi
       bitişik yazılarda harfleri tek tek çizmek bağlanma biçimlerini
       yok eder ve iki yönlü (bidi) sırayı bozar; Hint yazılarında da
       birleşik harfler (ligatür) dağılır. Bu yazılarda etiket tek
       parça çizilir — tarayıcının kendi şekillendirmesi devreye girer. */
    RTL_RE: /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFF]/,
    COMPLEX_RE: /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u0900-\u0DFF\u0E80-\u0EFF\u0F00-\u0FFF\u1780-\u17FF\u08A0-\u08FF\uFB1D-\uFB4F\uFB50-\uFDFF\uFE70-\uFEFF]/,

    isComplexText: function (t) { return this.COMPLEX_RE.test(t || ''); },
    isRTLText:     function (t) { return this.RTL_RE.test(t || ''); },

    measureLabel: function (ctx, o) {
      ctx.save();
      ctx.font = this.labelFont(o);
      var t = this.labelText(o), w;
      if (this.isComplexText(t)) {
        /* şekillendirilmiş genişlik: harflerin tek tek toplamı bitişik
           yazıda gerçek genişlikten belirgin biçimde geniş çıkar */
        w = ctx.measureText(t).width;
        ctx.restore();
        return Math.max(1, w);
      }
      var tr = o.track || 0;
      w = 0;
      for (var i = 0; i < t.length; i++) w += ctx.measureText(t[i]).width + tr;
      ctx.restore();
      return Math.max(1, w - tr);
    },

    /* Kapıt (banner) geometrisi — canvas ve SVG ortak kullanır.
       Dönen: [{d, fill, stroke, lw}]  (etiket merkezinde, 0,0)   */
    bannerPaths: function (style, w, h) {
      var out = [];
      var hw = w/2, hh = h/2;
      var PARCH = '#e9d9ae', PARCH_D = '#cbb887', INK = '#5a4326';

      if (style === 'ribbon') {
        var tail = h*0.85, notch = h*0.42;
        /* kuyruklar */
        out.push({ d:'M'+(-hw)+' '+(-hh*0.72)+' L'+(-hw-tail)+' '+(-hh*1.05)+
                     ' L'+(-hw-tail*0.72)+' 0 L'+(-hw-tail)+' '+(hh*1.05)+
                     ' L'+(-hw)+' '+(hh*0.72)+' Z', fill:PARCH_D, stroke:INK, lw:h*0.055 });
        out.push({ d:'M'+(hw)+' '+(-hh*0.72)+' L'+(hw+tail)+' '+(-hh*1.05)+
                     ' L'+(hw+tail*0.72)+' 0 L'+(hw+tail)+' '+(hh*1.05)+
                     ' L'+(hw)+' '+(hh*0.72)+' Z', fill:PARCH_D, stroke:INK, lw:h*0.055 });
        /* gövde */
        out.push({ d:'M'+(-hw)+' '+(-hh)+' L'+(hw)+' '+(-hh)+
                     ' L'+(hw-notch)+' 0 L'+(hw)+' '+hh+
                     ' L'+(-hw)+' '+hh+' L'+(-hw+notch)+' 0 Z',
                   fill:PARCH, stroke:INK, lw:h*0.06 });
        return out;
      }

      if (style === 'plate') {
        var r = h*0.30;
        out.push({ d:roundRectD(-hw, -hh, w, h, r), fill:PARCH, stroke:INK, lw:h*0.07 });
        out.push({ d:roundRectD(-hw+h*0.13, -hh+h*0.13, w-h*0.26, h-h*0.26, r*0.7),
                   fill:null, stroke:INK, lw:h*0.032 });
        return out;
      }

      if (style === 'scroll') {
        var roll = h*0.46;
        out.push({ d:'M'+(-hw)+' '+(-hh)+' L'+hw+' '+(-hh)+' L'+hw+' '+hh+' L'+(-hw)+' '+hh+' Z',
                   fill:PARCH, stroke:INK, lw:h*0.055 });
        /* kıvrık uçlar */
        out.push({ d:'M'+(-hw)+' '+(-hh)+' C'+(-hw-roll)+' '+(-hh)+' '+(-hw-roll)+' '+hh+' '+(-hw)+' '+hh+
                     ' C'+(-hw-roll*0.45)+' '+(hh*0.4)+' '+(-hw-roll*0.45)+' '+(-hh*0.4)+' '+(-hw)+' '+(-hh)+' Z',
                   fill:PARCH_D, stroke:INK, lw:h*0.05 });
        out.push({ d:'M'+hw+' '+(-hh)+' C'+(hw+roll)+' '+(-hh)+' '+(hw+roll)+' '+hh+' '+hw+' '+hh+
                     ' C'+(hw+roll*0.45)+' '+(hh*0.4)+' '+(hw+roll*0.45)+' '+(-hh*0.4)+' '+hw+' '+(-hh)+' Z',
                   fill:PARCH_D, stroke:INK, lw:h*0.05 });
        return out;
      }

      if (style === 'stone') {
        var j = h*0.10;
        out.push({ d:'M'+(-hw)+' '+(-hh+j)+' L'+(-hw+j*1.4)+' '+(-hh)+
                     ' L'+(hw-j*1.1)+' '+(-hh)+' L'+hw+' '+(-hh+j*0.8)+
                     ' L'+hw+' '+(hh-j)+' L'+(hw-j*1.5)+' '+hh+
                     ' L'+(-hw+j)+' '+hh+' L'+(-hw)+' '+(hh-j*1.2)+' Z',
                   fill:'#c9c2b0', stroke:'#4a443a', lw:h*0.07 });
        out.push({ d:'M'+(-hw+j*1.6)+' '+(-hh+j*1.5)+' L'+(hw-j*1.6)+' '+(-hh+j*1.5),
                   fill:null, stroke:'#8d867a', lw:h*0.03 });
        return out;
      }
      return out;
    },

    /* ---------- mesafe/ölçüm cetveli ----------
       Ölçek çubuğunun px/birim oranını kullanarak gerçek mesafeyi hesaplar. */
    pxPerScaleUnit: function () {
      var s = App.scale;
      var m = /^([\d.,]+)\s*(.*)$/.exec((s.label||'').trim());
      var num = m ? parseFloat(m[1].replace(',', '.')) : NaN;
      var unit = m && m[2] ? m[2] : '';
      if (!num || !isFinite(num) || num <= 0) return { px:1, unit:'' };
      return { px: s.len/num, unit: unit };
    },

    /* Nehir/yol'un aksine ölçüm çizgisi kasıtlı olarak Catmull-Rom ile
       yumuşatılmıyor: eğri, keskin köşeli bir çokgende (ör. dört köşeli
       bir alan) köşelerden taşarak gerçek alanı ~%15-20 büyük gösterir.
       Bir cetvel doğru olmalı — düz kenar, tıklanan noktaların tam
       kendisini ölçer. */
    measureLength: function (o) {
      var pts = o.pts.slice();
      var len = Geo.polylineLength(pts);
      if (o.closed) len += Math.hypot(pts[0][0]-pts[pts.length-1][0], pts[0][1]-pts[pts.length-1][1]);
      var conv = this.pxPerScaleUnit();
      var real = len/conv.px;
      var area = null;
      if (o.closed) {
        var pxArea = Geo.polygonArea(pts);
        area = { px: pxArea, real: pxArea/(conv.px*conv.px), unit: conv.unit };
      }
      return { px:len, real:real, unit:conv.unit, pts:pts, area:area };
    },

    formatDistance: function (real, unit) {
      var r = real >= 100 ? Math.round(real) : Math.round(real*10)/10;
      return r + (unit ? ' ' + unit : '');
    },

    formatArea: function (real, unit) {
      var r = real >= 100 ? Math.round(real) : Math.round(real*10)/10;
      return r + (unit ? ' ' + unit + '²' : '');
    },

    drawMeasure: function (ctx, o) {
      var info = this.measureLength(o);
      var pts = info.pts;
      if (pts.length < 2) return;
      ctx.save();

      if (o.closed && pts.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var ci = 1; ci < pts.length; ci++) ctx.lineTo(pts[ci][0], pts[ci][1]);
        ctx.closePath();
        ctx.fillStyle = 'rgba(201,75,75,0.12)';
        ctx.fill();
      }

      ctx.strokeStyle = '#c94b4b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 6]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (o.closed) ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      /* köşe işaretleri — kapalıysa hepsi, açıksa yalnız uçlar */
      var markPts = o.closed ? pts : [pts[0], pts[pts.length-1]];
      markPts.forEach(function (pt) {
        ctx.beginPath(); ctx.arc(pt[0], pt[1], 5, 0, Math.PI*2);
        ctx.fillStyle = '#c94b4b'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      });

      /* etiket: kapalıysa merkezde alan+çevre, açıksa orta noktada mesafe */
      var lx, ly, lines;
      if (o.closed) {
        var cx = 0, cy = 0;
        for (var pj = 0; pj < pts.length; pj++) { cx += pts[pj][0]; cy += pts[pj][1]; }
        lx = cx/pts.length; ly = cy/pts.length;
        lines = [this.formatArea(info.area.real, info.area.unit), this.formatDistance(info.real, info.unit)];
      } else {
        var midIdx = Math.floor(pts.length/2);
        lx = pts[midIdx][0]; ly = pts[midIdx][1];
        lines = [this.formatDistance(info.real, info.unit)];
      }

      ctx.font = '600 20px Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var tw = Math.max.apply(null, lines.map(function (t) { return ctx.measureText(t).width; }));
      var lh = 24, boxH = lh*lines.length + 8;
      ctx.fillStyle = 'rgba(245,236,216,0.92)';
      ctx.strokeStyle = '#c94b4b'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      var bx = lx-tw/2-8, by = ly-boxH/2, bw = tw+16;
      ctx.roundRect ? ctx.roundRect(bx, by, bw, boxH, 6) : ctx.rect(bx, by, bw, boxH);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#3a2b18';
      for (var li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], lx, by + lh*li + lh/2 + 4);
      }
      ctx.restore();
    },

    /* ---------- kaynak/ikon işaretleri (maden, tarım, avlanma, balıkçılık, ticaret, taş ocağı) ---------- */
    RESOURCE_TYPES: {
      mine:     { color:'#8a7a5a', icon: function (ctx, r) {
        ctx.save(); ctx.rotate(-Math.PI/4);
        ctx.beginPath(); ctx.moveTo(0,-r*0.55); ctx.lineTo(0,r*0.15); ctx.lineWidth = r*0.16; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.55); ctx.lineTo(r*0.3,-r*0.55); ctx.lineTo(0,-r*0.15); ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.rotate(Math.PI/4);
        ctx.beginPath(); ctx.moveTo(0,-r*0.55); ctx.lineTo(0,r*0.15); ctx.lineWidth = r*0.16; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*0.3,-r*0.55); ctx.lineTo(r*0.3,-r*0.55); ctx.lineTo(0,-r*0.15); ctx.closePath(); ctx.fill();
        ctx.restore();
      }},
      farm:     { color:'#8a9a4a', icon: function (ctx, r) {
        for (var i=-1; i<=1; i++) {
          ctx.beginPath();
          ctx.moveTo(i*r*0.28, r*0.5);
          ctx.quadraticCurveTo(i*r*0.5, 0, i*r*0.14, -r*0.55);
          ctx.lineWidth = r*0.13; ctx.lineCap = 'round'; ctx.stroke();
        }
      }},
      hunting:  { color:'#7a4a30', icon: function (ctx, r) {
        ctx.save(); ctx.rotate(Math.PI/4);
        ctx.beginPath(); ctx.moveTo(0,-r*0.6); ctx.lineTo(0,r*0.6); ctx.lineWidth = r*0.13; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-r*0.6); ctx.lineTo(-r*0.24,-r*0.28); ctx.moveTo(0,-r*0.6); ctx.lineTo(r*0.24,-r*0.28);
        ctx.lineWidth = r*0.11; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*0.2,r*0.4); ctx.lineTo(0,r*0.6); ctx.lineTo(r*0.2,r*0.4);
        ctx.lineWidth = r*0.11; ctx.stroke();
        ctx.restore();
      }},
      fishing:  { color:'#4a7a95', icon: function (ctx, r) {
        ctx.beginPath();
        ctx.moveTo(-r*0.55, 0);
        ctx.quadraticCurveTo(-r*0.15,-r*0.4, r*0.45, 0);
        ctx.quadraticCurveTo(-r*0.15, r*0.4, -r*0.55, 0);
        ctx.fill();
        ctx.beginPath(); ctx.moveTo(r*0.45,0); ctx.lineTo(r*0.68,-r*0.22); ctx.lineTo(r*0.68,r*0.22); ctx.closePath(); ctx.fill();
      }},
      trade:    { color:'#c9a44b', icon: function (ctx, r) {
        ctx.beginPath(); ctx.arc(0, 0, r*0.48, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = r*0.07;
        ctx.beginPath(); ctx.arc(0, 0, r*0.48, 0, Math.PI*2); ctx.stroke();
      }},
      quarry:   { color:'#8a8a8a', icon: function (ctx, r) {
        ctx.beginPath();
        ctx.moveTo(-r*0.5,r*0.35); ctx.lineTo(-r*0.25,-r*0.4); ctx.lineTo(r*0.15,-r*0.5);
        ctx.lineTo(r*0.5,-r*0.05); ctx.lineTo(r*0.25,r*0.45); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = r*0.05;
        ctx.beginPath(); ctx.moveTo(-r*0.25,-r*0.4); ctx.lineTo(r*0.1,r*0.1); ctx.lineTo(r*0.25,r*0.45); ctx.stroke();
      }}
    },

    drawResource: function (ctx, o) {
      var def = this.RESOURCE_TYPES[o.type] || this.RESOURCE_TYPES.mine;
      var r = (o.size||36)*0.5;
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.shadowColor = 'rgba(20,15,5,0.45)'; ctx.shadowBlur = r*0.35; ctx.shadowOffsetY = r*0.08;
      ctx.fillStyle = '#f5ecd8'; ctx.strokeStyle = 'rgba(58,43,24,0.6)'; ctx.lineWidth = Math.max(1, r*0.1);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.fillStyle = def.color; ctx.strokeStyle = def.color;
      def.icon(ctx, r);
      ctx.restore();
    },

    /* ---------- bölge haritası bağlantı iğnesi ---------- */
    drawLink: function (ctx, o) {
      var r = (o.size||40)*0.5;
      ctx.save();
      ctx.translate(o.x, o.y);

      ctx.shadowColor = 'rgba(20,15,5,0.5)';
      ctx.shadowBlur = r*0.5;
      ctx.shadowOffsetY = r*0.12;
      ctx.fillStyle = '#c08a3e';
      ctx.strokeStyle = '#4a3218';
      ctx.lineWidth = Math.max(1.5, r*0.14);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();

      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.fillStyle = '#3a2b18';
      ctx.beginPath();
      ctx.moveTo(0, -r*0.55); ctx.lineTo(r*0.4, 0); ctx.lineTo(0, r*0.55); ctx.lineTo(-r*0.4, 0);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r*0.16, 0, Math.PI*2); ctx.fillStyle = '#c08a3e'; ctx.fill();

      if (o.name) {
        ctx.font = '600 ' + Math.round(r*0.62) + 'px Georgia, serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.lineWidth = Math.max(2, r*0.16);
        ctx.strokeStyle = '#f5ecd8';
        ctx.strokeText(o.name, 0, r + r*0.28);
        ctx.fillStyle = '#3a2b18';
        ctx.fillText(o.name, 0, r + r*0.28);
      }
      ctx.restore();
    },

    drawLabel: function (ctx, o) {
      var text = this.labelText(o);
      if (!text) return;
      ctx.save();
      ctx.globalAlpha *= (o.opacity === undefined ? 1 : o.opacity);
      ctx.font = this.labelFont(o);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;

      var total = this.measureLabel(ctx, o);
      var complex = this.isComplexText(text);
      if (complex) ctx.direction = this.isRTLText(text) ? 'rtl' : 'ltr';

      /* --- nehir/yol üzerine oturan etiket: gerçek çizilmiş eğriyi izler,
         daire yayı değil, sabit poligon (o.pathPts, oluşturulduğu anda alınmış) --- */
      if (o.pathPts && o.pathPts.length > 1) {
        if (o.shadow) {
          ctx.shadowColor = 'rgba(40,25,5,0.45)';
          ctx.shadowBlur = Math.max(2, (o.size||32)*0.12);
          ctx.shadowOffsetY = Math.max(1, (o.size||32)*0.05);
        }
        var pathLen = Geo.polylineLength(o.pathPts);
        var center = (o.pathCenter != null) ? o.pathCenter : pathLen/2;
        var startLen = center - total/2;
        var tr3 = o.track||0;
        /* bitişik yazı: yay boyunca harf harf dağıtmak yerine, yolun orta
           noktasındaki teğete oturan tek bir parça */
        if (complex) {
          var cp = Geo.pointAtLength(o.pathPts, center);
          ctx.save();
          ctx.translate(cp.x, cp.y);
          ctx.rotate(cp.ang);
          if (o.outline) {
            ctx.strokeStyle = o.outlineColor || '#f5ecd8';
            ctx.lineWidth = Math.max(1.5, (o.size||32)*0.16);
            ctx.strokeText(text, 0, 0);
          }
          ctx.fillStyle = o.color || '#3a2b18';
          ctx.fillText(text, 0, 0);
          ctx.restore();
          ctx.restore();
          return;
        }
        var cursor = startLen;
        for (var pi = 0; pi < text.length; pi++) {
          var cw3 = ctx.measureText(text[pi]).width;
          var mid3 = cursor + cw3/2;
          var pt = Geo.pointAtLength(o.pathPts, mid3);
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.ang);
          if (o.outline) {
            ctx.strokeStyle = o.outlineColor || '#f5ecd8';
            ctx.lineWidth = Math.max(1.5, (o.size||32)*0.16);
            ctx.strokeText(text[pi], 0, 0);
          }
          ctx.fillStyle = o.color || '#3a2b18';
          ctx.fillText(text[pi], 0, 0);
          ctx.restore();
          cursor += cw3 + tr3;
        }
        ctx.restore();
        return;
      }

      ctx.translate(o.x, o.y);
      if (o.rot) ctx.rotate(o.rot*Math.PI/180);

      /* --- kapıt --- */
      if (o.banner) {
        var bw = total + (o.size||32)*1.25;
        var bh = (o.size||32)*1.62;
        var paths = this.bannerPaths(o.banner, bw, bh);
        ctx.save();
        ctx.shadowColor = 'rgba(40,25,5,0.35)';
        ctx.shadowBlur = (o.size||32)*0.18;
        ctx.shadowOffsetY = (o.size||32)*0.07;
        for (var bi = 0; bi < paths.length; bi++) {
          var bp = paths[bi], p2 = new Path2D(bp.d);
          if (bp.fill) { ctx.fillStyle = bp.fill; ctx.fill(p2); }
          if (bi > 0) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
          if (bp.stroke) { ctx.strokeStyle = bp.stroke; ctx.lineWidth = bp.lw; ctx.stroke(p2); }
        }
        ctx.restore();
      }

      if (o.shadow && !o.banner) {
        ctx.shadowColor = 'rgba(40,25,5,0.45)';
        ctx.shadowBlur = Math.max(2, (o.size||32)*0.12);
        ctx.shadowOffsetY = Math.max(1, (o.size||32)*0.05);
      }

      var arc = (o.curve||0)*Math.PI/180;

      function paint(ch, cx) {
        if (o.outline) {
          ctx.strokeStyle = o.outlineColor || '#f5ecd8';
          ctx.lineWidth = Math.max(1.5, (o.size||32)*0.16);
          ctx.strokeText(ch, cx, 0);
        }
        ctx.fillStyle = o.color || '#3a2b18';
        ctx.fillText(ch, cx, 0);
      }

      /* bitişik yazıda harf aralığı ve yay devre dışı: ikisi de harfleri
         tek tek konumlandırmayı gerektirir. */
      if (complex) {
        paint(text, 0);
        ctx.restore();
        return;
      }

      if (!arc || Math.abs(arc) < 0.01) {
        var x = -total/2, tr = o.track||0;
        for (var i = 0; i < text.length; i++) {
          var cw = ctx.measureText(text[i]).width;
          paint(text[i], x + cw/2);
          x += cw + tr;
        }
      } else {
        var R = total/arc, sign = R < 0 ? -1 : 1;
        ctx.translate(0, R);
        var a = -arc/2, tr2 = o.track||0;
        for (var j = 0; j < text.length; j++) {
          var w2 = ctx.measureText(text[j]).width + tr2;
          var mid = a + (w2/2)/R;
          ctx.save();
          ctx.rotate(mid);
          ctx.translate(0, -R);
          ctx.rotate(sign > 0 ? 0 : Math.PI);
          paint(text[j], 0);
          ctx.restore();
          a += w2/R;
        }
      }
      ctx.restore();
    },

    labelBounds: function (o) {
      var w = this.measureLabel(this.ctx, o);
      var h = (o.size||32)*1.25;
      if (o.banner) {
        w += (o.size||32)*1.25;
        h = (o.size||32)*1.62;
        if (o.banner === 'ribbon' || o.banner === 'scroll') w += (o.size||32)*1.5;
      }
      var extra = Math.abs(o.curve||0)*(o.size||32)*0.01*8;
      return { x:o.x-w/2, y:o.y-h/2-extra/2, w:w, h:h+extra };
    },

    /* ================= ÖLÇEK ÇUBUĞU ================= */
    scaleBounds: function (s) {
      var h = s.size*2.1;
      return { x:s.x, y:s.y - s.size*1.25, w:s.len, h:h };
    },

    drawScaleBar: function (ctx, s) {
      var segs = Math.max(2, s.segs|0);
      var segW = s.len/segs;
      var barH = s.size*0.62;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.lineJoin = 'miter';

      /* gövde */
      ctx.fillStyle = '#f2e6c8';
      ctx.strokeStyle = '#3a2b18';
      ctx.lineWidth = Math.max(1, s.size*0.10);
      ctx.beginPath();
      ctx.rect(0, 0, s.len, barH);
      ctx.fill();
      ctx.stroke();

      /* dolu segmentler */
      ctx.fillStyle = '#3a2b18';
      for (var i = 0; i < segs; i += 2) {
        ctx.fillRect(i*segW, 0, segW, barH);
      }
      ctx.beginPath();
      ctx.rect(0, 0, s.len, barH);
      ctx.stroke();

      /* uç tırnaklar */
      ctx.beginPath();
      ctx.moveTo(0, -s.size*0.34); ctx.lineTo(0, 0);
      ctx.moveTo(s.len, -s.size*0.34); ctx.lineTo(s.len, 0);
      ctx.moveTo(s.len/2, -s.size*0.22); ctx.lineTo(s.len/2, 0);
      ctx.stroke();

      /* metin */
      ctx.font = '600 ' + s.size + 'px ' + FONTS.serif;
      ctx.fillStyle = '#3a2b18';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';   ctx.fillText('0', 0, barH + s.size*0.24);
      ctx.textAlign = 'right';  ctx.fillText(s.label || '', s.len, barH + s.size*0.24);
      ctx.restore();
    },

    /* ---------- ızgara ----------
       Üç tür: kare, altıgen (TTRPG standardı) ve nokta. Hepsi görünür
       dikdörtgene kırpılır — 8192² tuvalde küçük hücre boyunda bile
       yalnızca ekrandaki hücreler üretilir. */
    gridType: 'square',
    gridColor: '#1e281e',
    gridOpacity: 0.28,

    _gridStroke: function () {
      var h = (this.gridColor || '#1e281e').replace('#','');
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      var r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
      return 'rgba('+r+','+g+','+b+','+this.gridOpacity+')';
    },

    drawGrid: function (ctx, vis, forExport) {
      var g = this.gridSize;
      if (!(g > 0)) return;
      var v = vis || this.visibleMapRect();
      if (v.w <= 0 || v.h <= 0) return;

      /* çok uzaklaşıldığında ızgara okunmaz bir gri lekeye dönüşür —
         ekranda 4 pikselden ince hücrelerde çizmiyoruz (çıktıda geçerli değil) */
      if (!forExport && g * this.zoom < 4) return;

      ctx.save();
      ctx.strokeStyle = this._gridStroke();
      ctx.fillStyle = this._gridStroke();
      ctx.lineWidth = forExport ? Math.max(1, g*0.012) : 1/this.zoom;

      if (this.gridType === 'hex') {
        this._drawHexGrid(ctx, v, g);
      } else if (this.gridType === 'dot') {
        var dr = forExport ? Math.max(1.2, g*0.035)
                           : Math.max(0.8/this.zoom, Math.min(2.4/this.zoom, g*0.035));
        var dsx = Math.floor(v.x0/g)*g, dsy = Math.floor(v.y0/g)*g;
        ctx.beginPath();
        for (var dx0 = dsx; dx0 <= v.x1; dx0 += g) {
          for (var dy0 = dsy; dy0 <= v.y1; dy0 += g) {
            ctx.moveTo(dx0+dr, dy0);
            ctx.arc(dx0, dy0, dr, 0, Math.PI*2);
          }
        }
        ctx.fill();
      } else {
        ctx.beginPath();
        var sx = Math.floor(v.x0/g)*g, sy = Math.floor(v.y0/g)*g;
        for (var x = sx; x <= v.x1; x += g) { ctx.moveTo(x, v.y0); ctx.lineTo(x, v.y1); }
        for (var y = sy; y <= v.y1; y += g) { ctx.moveTo(v.x0, y); ctx.lineTo(v.x1, y); }
        ctx.stroke();
      }
      ctx.restore();
    },

    /* Sivri-tepeli (pointy-top) altıgen ızgara: g hücrenin genişliği.
       Yatay adım = g, dikey adım = 3/4 · yükseklik; tek satırlar yarım
       hücre kaydırılır. Yalnızca görünür aralık dolaşılır. */
    _drawHexGrid: function (ctx, v, g) {
      var w = g;                    /* hücre genişliği  */
      var hgt = w * 2 / Math.sqrt(3);   /* sivri tepeli yükseklik */
      var vstep = hgt * 0.75;
      var row0 = Math.floor(v.y0 / vstep) - 1;
      var row1 = Math.ceil(v.y1 / vstep) + 1;
      var q = hgt / 4;
      ctx.beginPath();
      for (var row = row0; row <= row1; row++) {
        var cy = row * vstep;
        var offset = (row & 1) ? w/2 : 0;
        var col0 = Math.floor((v.x0 - offset) / w) - 1;
        var col1 = Math.ceil((v.x1 - offset) / w) + 1;
        for (var col = col0; col <= col1; col++) {
          var cx = col * w + offset;
          /* altıgenin üst yarısı — alt yarı komşu satırdan gelir,
             böylece her kenar bir kez çizilir */
          ctx.moveTo(cx,        cy - hgt/2);
          ctx.lineTo(cx + w/2,  cy - q);
          ctx.lineTo(cx + w/2,  cy + q);
          ctx.lineTo(cx,        cy + hgt/2);
          ctx.lineTo(cx - w/2,  cy + q);
          ctx.lineTo(cx - w/2,  cy - q);
          ctx.closePath();
        }
      }
      ctx.stroke();
    },

    /* ---------- fırça imleci ---------- */
    drawCursor: function (ctx) {
      if (!this.mouse.over || !global.App) return;
      var t = App.tool, r = 0;
      if (t === 'landmass' || t === 'erase') r = App.brush.size/2;
      else if (t === 'terrain') r = App.terrain.size/2;
      else if (t === 'elevation') r = App.elevation.brushSize/2;
      else if (t === 'symbol') r = App.symbol.size/2;
      else if (t === 'eyedrop') r = App.eyedrop.painting ? App.eyedrop.brushRadius : 0;
      if (!r) return;
      var s = this.mapToScreen(this.mouse.x, this.mouse.y);
      ctx.save();
      ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(s.x, s.y, r*this.zoom, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.arc(s.x, s.y, r*this.zoom+1, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    },

    /* ---------- minimap ---------- */
    renderMini: function () {
      var m = this.mctx, S = this.mini.width;
      var s = S/Math.max(this.W, this.H);
      m.setTransform(1,0,0,1,0,0);
      m.clearRect(0, 0, S, S);
      /* Besteyi küçülterek çiz — eskiden burada renderMap() yeniden
         çalışıyordu; küçük tuvale çizse bile nehir/yol kırpması için
         tam boyutlu scratch işlemleri yapıyordu (200 ms'de bir). */
      if (this.mapCanvas) {
        m.drawImage(this.mapCanvas, 0, 0, this.W*s, this.H*s);
      }
      var tl = this.screenToMap(0, 0), br = this.screenToMap(this.vw, this.vh);
      m.strokeStyle = '#c08a3e';
      m.lineWidth = 1.5;
      m.strokeRect(tl.x*s, tl.y*s, (br.x-tl.x)*s, (br.y-tl.y)*s);
    },

    centerOn: function (mx, my) {
      this.panX = this.vw/2 - mx*this.zoom;
      this.panY = this.vh/2 - my*this.zoom;
      this.requestViewRender();
    }
  };

  function roundRectD(x, y, w, h, r) {
    return 'M'+(x+r)+' '+y+
           ' L'+(x+w-r)+' '+y+' Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+
           ' L'+(x+w)+' '+(y+h-r)+' Q'+(x+w)+' '+(y+h)+' '+(x+w-r)+' '+(y+h)+
           ' L'+(x+r)+' '+(y+h)+' Q'+x+' '+(y+h)+' '+x+' '+(y+h-r)+
           ' L'+x+' '+(y+r)+' Q'+x+' '+y+' '+(x+r)+' '+y+' Z';
  }

  global.Geo = Geo;
  global.FONTS = FONTS;
  global.FONT_LIST = FONT_LIST;
  global.fontAvailable = fontAvailable;
  global.LABEL_PRESETS = LABEL_PRESETS;
  global.Cv = Cv;
})(window);
