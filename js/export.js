/* ============================================================
   Medieval Map Editor — export.js
   PNG / SVG dışa aktarma, .json proje kaydet-yükle
   ============================================================ */
(function (global) {
  'use strict';

  function download(blobOrUrl, filename) {
    var a = document.createElement('a');
    a.download = filename;
    a.href = (typeof blobOrUrl === 'string') ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(a.href);
    }, 400);
  }

  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var Exporter = {

    png: function (scale) {
      scale = scale || 1;
      /* ızgara açıksa çıktıya da girer — altıgen ızgaranın asıl değeri
         basılan/paylaşılan haritada olmasıdır (bkz. renderToCanvas) */
      var c = this.renderToCanvas(Cv.W*scale, Cv.H*scale);
      var w = c.width, h = c.height;
      c.toBlob(function (b) {
        download(b, 'harita-' + stamp() + (scale > 1 ? '-' + scale + 'x' : '') + '.png');
        UI.msg(UI.t('exported') + ' PNG ' + w + '×' + h);
      }, 'image/png');
    },

    /* Haritayı istenen ölçekte tek bir <canvas>'a çizer. PNG/HTML/baskı
       çıktılarının ortak adımı — hepsi aynı renderMap yolundan geçsin
       diye ayrı bir yardımcıya alındı. */
    renderToCanvas: function (targetW, targetH) {
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(targetW));
      c.height = Math.max(1, Math.round(targetH));
      var x = c.getContext('2d');
      x.save();
      x.scale(c.width / Cv.W, c.height / Cv.H);
      Cv.renderMap(x, { includeReference: App.exportReference, includeLinks: false });
      if (Cv.grid) Cv.drawGrid(x, { x0:0, y0:0, x1:Cv.W, y1:Cv.H, w:Cv.W, h:Cv.H }, true);
      x.restore();
      return c;
    },

    /* Uzun kenarı maxDim'i aşmayacak ölçek — en-boy oranı korunur, hiçbir
       zaman büyütülmez (küçük bir tuvali 4096'ya şişirmek dosyayı büyütür,
       görüntüyü iyileştirmez). */
    _fitScale: function (maxDim) {
      return Math.min(1, maxDim / Math.max(Cv.W, Cv.H));
    },

    /* ================= TEK DOSYA HTML =================
       Haritayı gömülü bir görüntü + minik bir görüntüleyiciyle tek bir
       .html dosyasına yazar. Sunucu, betik kütüphanesi, dış istek yok —
       dosyayı e-postayla yollayıp çift tıklamak yeterli. */
    html: function (opts) {
      opts = opts || {};
      var maxDim = opts.maxDim || 2048;
      var fmt = opts.format === 'jpeg' ? 'jpeg' : 'png';
      var title = (opts.title || App.currentCanvasName || 'Wayborne').trim() || 'Wayborne';

      var k = this._fitScale(maxDim);
      var c = this.renderToCanvas(Cv.W * k, Cv.H * k);
      var data = (fmt === 'jpeg')
        ? c.toDataURL('image/jpeg', 0.88)
        : c.toDataURL('image/png');

      var doc = this._viewerHTML(title, data, c.width, c.height);
      download(new Blob([doc], { type:'text/html;charset=utf-8' }),
               this._slug(title) + '-' + stamp() + '.html');
      UI.msg(UI.t('exported') + ' HTML · ' + c.width + '×' + c.height +
             ' · ' + this._humanSize(doc.length));
    },

    _slug: function (s) {
      return String(s).toLowerCase()
        .replace(/[ğ]/g,'g').replace(/[ü]/g,'u').replace(/[ş]/g,'s')
        .replace(/[ı]/g,'i').replace(/[ö]/g,'o').replace(/[ç]/g,'c')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0, 48) || 'harita';
    },

    /* ================= PAYLAŞIM LİNKİ =================
       Sunucu yok, bu yüzden "link" aslında haritanın küçültülmüş bir
       görüntüsünü doğrudan URL'nin hash kısmına gömüyor. Hash tarayıcıdan
       dışarı, ağa hiç gitmez (sunucu logunda bile görünmez) — bu yüzden
       statik barındırılan bu sayfanın kendisi hem düzenleyici hem de
       (hash varken) salt-okunur bir görüntüleyici olarak çalışabiliyor.
       base64 → base64url dönüşümü '+','/','=' karakterlerini kaçış
       gerektirmeyen '-','_' ile değiştirip URL'yi şişirmiyor. */
    _b64urlEncode: function (b64) {
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    _b64urlDecode: function (s) {
      s = s.replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return s;
    },

    buildShareURL: function (opts) {
      opts = opts || {};
      var maxDim = opts.maxDim || 1600;
      var title = (opts.title || App.currentCanvasName || 'Wayborne').trim() || 'Wayborne';

      var k = this._fitScale(maxDim);
      var c = this.renderToCanvas(Cv.W * k, Cv.H * k);
      var dataURI = c.toDataURL('image/jpeg', 0.82);
      var payload = this._b64urlEncode(dataURI.split(',')[1]);

      var hash = 'd=' + payload + '&t=' + encodeURIComponent(title) +
                 '&w=' + c.width + '&h=' + c.height + '&f=jpeg';
      return location.origin + location.pathname + '#' + hash;
    },

    /* Aynı linki iframe'e gömülebilir hâle getirir: e=1 bayrağı
       kabuk gezinmesini ve üst çubuğu gizler, sadece harita kalır. */
    embedCode: function (url, w, h) {
      var embedURL = url + '&e=1';
      return '<iframe src="' + embedURL + '" width="' + (w||800) + '" height="' + (h||600) +
             '" style="border:0" loading="lazy" allowfullscreen></iframe>';
    },

    /* location.hash'i ayrıştırır; paylaşım verisi yoksa null döner. */
    parseShareHash: function () {
      var h = location.hash;
      if (!h || h.indexOf('d=') < 0) return null;
      var raw = h.charAt(0) === '#' ? h.slice(1) : h;
      var params = new URLSearchParams(raw);
      var d = params.get('d');
      if (!d) return null;
      var fmt = params.get('f') || 'jpeg';
      return {
        title: params.get('t') || 'Wayborne',
        dataURI: 'data:image/' + fmt + ';base64,' + this._b64urlDecode(d),
        w: parseInt(params.get('w'), 10) || 0,
        h: parseInt(params.get('h'), 10) || 0,
        embed: params.get('e') === '1'
      };
    },

    _humanSize: function (n) {
      if (n < 1024) return n + ' B';
      if (n < 1024*1024) return (n/1024).toFixed(0) + ' KB';
      return (n/(1024*1024)).toFixed(1) + ' MB';
    },

    /* Gömülü görüntüleyici: sürükle-kaydır, tekerlekle yakınlaş, çift
       tıkla sığdır. Tek dosyada kalması için her şey satır içi. */
    _viewerHTML: function (title, dataURI, w, h) {
      var t = esc(title);
      var lang = (UI && UI.lang) || 'tr';
      var hint = esc(UI.t('viewer_hint'));
      var tIn = esc(UI.t('viewer_in')), tOut = esc(UI.t('viewer_out')), tFit = esc(UI.t('viewer_fit'));
      return '<!doctype html>\n<html lang="' + lang + '"><head><meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
'<title>' + t + '</title>\n<style>\n' +
'*{margin:0;padding:0;box-sizing:border-box}\n' +
'html,body{height:100%;background:#160f07;color:#e8dcc4;overflow:hidden;\n' +
'  font:14px/1.5 Georgia,"Times New Roman",serif}\n' +
'#stage{position:absolute;inset:0;cursor:grab;touch-action:none}\n' +
'#stage.drag{cursor:grabbing}\n' +
'#map{position:absolute;top:0;left:0;transform-origin:0 0;\n' +
'  image-rendering:auto;box-shadow:0 30px 90px -20px #000c;user-select:none;-webkit-user-drag:none}\n' +
'#bar{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:14px;\n' +
'  padding:10px 16px;background:linear-gradient(#160f07ee,#160f0700);pointer-events:none}\n' +
'#bar h1{font-size:16px;font-weight:600;letter-spacing:.04em;color:#e8dcc4;\n' +
'  text-shadow:0 2px 8px #000}\n' +
'#hint{margin-left:auto;font-size:11px;color:#c08a3e;opacity:.85}\n' +
'#zoom{position:absolute;right:14px;bottom:14px;display:flex;gap:6px}\n' +
'#zoom button{width:32px;height:32px;border:1px solid #4a3a24;background:#241708cc;\n' +
'  color:#c08a3e;border-radius:5px;cursor:pointer;font:15px/1 Georgia,serif}\n' +
'#zoom button:hover{border-color:#c08a3e}\n' +
'</style></head><body>\n' +
'<div id="stage"><img id="map" alt="' + t + '" src="' + dataURI + '"></div>\n' +
'<div id="bar"><h1>' + t + '</h1><span id="hint">' + hint + '</span></div>\n' +
'<div id="zoom"><button id="zo" title="' + tOut + '">&minus;</button>' +
'<button id="zf" title="' + tFit + '">&#9633;</button>' +
'<button id="zi" title="' + tIn + '">&plus;</button></div>\n' +
'<script>\n' +
'(function(){\n' +
'var W=' + w + ',H=' + h + ';\n' +
'var st=document.getElementById("stage"),im=document.getElementById("map");\n' +
'var z=1,ox=0,oy=0;\n' +
'function apply(){im.style.transform="translate("+ox+"px,"+oy+"px) scale("+z+")";}\n' +
'function fit(){var p=24;z=Math.min((st.clientWidth-p*2)/W,(st.clientHeight-p*2)/H);\n' +
'  ox=(st.clientWidth-W*z)/2;oy=(st.clientHeight-H*z)/2;apply();}\n' +
'function zoomAt(cx,cy,f){var nz=Math.max(0.02,Math.min(12,z*f));\n' +
'  ox=cx-(cx-ox)*(nz/z);oy=cy-(cy-oy)*(nz/z);z=nz;apply();}\n' +
'st.addEventListener("wheel",function(e){e.preventDefault();\n' +
'  var r=st.getBoundingClientRect();\n' +
'  zoomAt(e.clientX-r.left,e.clientY-r.top,e.deltaY<0?1.12:1/1.12);},{passive:false});\n' +
'var down=false,px=0,py=0;\n' +
'st.addEventListener("pointerdown",function(e){down=true;px=e.clientX;py=e.clientY;\n' +
'  st.classList.add("drag");st.setPointerCapture(e.pointerId);});\n' +
'st.addEventListener("pointermove",function(e){if(!down)return;\n' +
'  ox+=e.clientX-px;oy+=e.clientY-py;px=e.clientX;py=e.clientY;apply();});\n' +
'st.addEventListener("pointerup",function(){down=false;st.classList.remove("drag");});\n' +
'st.addEventListener("dblclick",fit);\n' +
'document.getElementById("zi").onclick=function(){zoomAt(st.clientWidth/2,st.clientHeight/2,1.3);};\n' +
'document.getElementById("zo").onclick=function(){zoomAt(st.clientWidth/2,st.clientHeight/2,1/1.3);};\n' +
'document.getElementById("zf").onclick=fit;\n' +
'addEventListener("resize",fit);\n' +
'if(im.complete)fit();else im.onload=fit;\n' +
'})();\n' +
'<\/script>\n</body></html>\n';
    },

    /* ================= BASKI / PDF =================
       Ayrı bir kütüphane yok: haritayı hedef sayfa ve DPI'ya göre
       ölçekleyip gizli bir iframe'e @page kuralıyla basıyoruz.
       Tarayıcının "PDF olarak kaydet" seçeneği gerçek PDF üretir. */
    PAGES: {
      a4:     { w:210, h:297 },
      a3:     { w:297, h:420 },
      a5:     { w:148, h:210 },
      letter: { w:215.9, h:279.4 },
      tabloid:{ w:279.4, h:431.8 }
    },

    print: function (opts) {
      opts = opts || {};
      var page = this.PAGES[opts.page] || this.PAGES.a4;
      var landscape = opts.orient === 'landscape';
      var pw = landscape ? page.h : page.w;
      var ph = landscape ? page.w : page.h;
      var margin = Math.max(0, Math.min(40, opts.margin === undefined ? 10 : opts.margin));
      var dpi = opts.dpi || 150;

      /* basılabilir alan (mm) -> hedef piksel */
      var availW = pw - margin*2, availH = ph - margin*2;
      var mm2px = dpi / 25.4;
      var fit = Math.min(availW / Cv.W, availH / Cv.H);   /* mm / harita pikseli */
      var outW = Math.round(Cv.W * fit * mm2px);
      var outH = Math.round(Cv.H * fit * mm2px);

      /* Aşırı büyük çıktıyı sınırla: 300 DPI A3 tam sayfa ~ 4900px, bunun
         üstü tarayıcıyı kilitler ve baskıda fark etmez. */
      var CAP = 6000;
      if (Math.max(outW, outH) > CAP) {
        var s = CAP / Math.max(outW, outH);
        outW = Math.round(outW*s); outH = Math.round(outH*s);
      }

      var c = this.renderToCanvas(outW, outH);
      var data = c.toDataURL('image/png');
      var title = esc((opts.title || App.currentCanvasName || 'Wayborne').trim());
      var pageCss = (landscape ? (page.h + 'mm ' + page.w + 'mm') : (page.w + 'mm ' + page.h + 'mm'));

      var doc = '<!doctype html><html><head><meta charset="utf-8"><title>' + title + '</title><style>' +
        '@page{size:' + pageCss + ';margin:' + margin + 'mm}' +
        'html,body{margin:0;padding:0;background:#fff}' +
        'img{display:block;width:' + (Cv.W*fit).toFixed(2) + 'mm;height:' + (Cv.H*fit).toFixed(2) + 'mm;margin:0 auto}' +
        '</style></head><body><img src="' + data + '"></body></html>';

      /* Yeni sekme yerine gizli iframe: açılır pencere engelleyicilerine
         takılmaz ve editörden çıkmaz. */
      var old = document.getElementById('wb-print-frame');
      if (old) old.parentNode.removeChild(old);
      var f = document.createElement('iframe');
      f.id = 'wb-print-frame';
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      document.body.appendChild(f);
      f.onload = function () {
        try {
          f.contentWindow.focus();
          f.contentWindow.print();
        } catch (e) { UI.msg(UI.t('print_failed')); }
      };
      f.srcdoc = doc;
      UI.msg(UI.t('printing') + ' · ' + outW + '×' + outH + ' · ' + dpi + ' DPI');
    },

    svg: function () {
      var W = Cv.W, H = Cv.H, s = [];
      s.push('<?xml version="1.0" encoding="UTF-8"?>');
      s.push('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
             'width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">');
      s.push('<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#7ba8bd"/>');

      /* nehir/göl kırpma maskesi: kara alfa kanalını referans alır — SVG'de de
         PNG'deki gibi nehir/göl yalnızca kara üzerinde görünsün diye */
      var landL = Layers.get('landmass');
      if (landL && landL.canvas) {
        s.push('<defs><mask id="landMask" maskUnits="userSpaceOnUse" x="0" y="0" width="'+W+'" height="'+H+
               '" style="mask-type:alpha"><image x="0" y="0" width="'+W+'" height="'+H+
               '" xlink:href="'+landL.canvas.toDataURL('image/png')+'"/></mask></defs>');
      }

      /* kıyı efekti */
      if (Cv.shore) {
        if (Cv.shoreDirty || !Cv.shoreCanvas) Cv.buildShore();
        if (Cv.shoreCanvas) {
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="0.9" xlink:href="' +
                 Cv.shoreCanvas.toDataURL('image/png') + '"/>');
        }
      }

      Layers.list.forEach(function (l) {
        if (!l.visible) return;
        if (l.id === 'links') return; /* editör içi gezinme iğneleri, çıktıya dahil edilmez */
        if (l.id === 'measures') return; /* ölçüm cetvelleri çalışma yardımcısıdır, çıktıya dahil edilmez */

        if (l.id === 'reference') {
          if (!App.exportReference || !l.imageData) return;
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="'+l.opacity+
                 '" xlink:href="'+l.imageData+'"/>');
          return;
        }

        if (l.id === 'resources') {
          /* özel ikon çizimleri Path2D verisi olarak tutulmuyor — katmanı
             tek seferde rasterize edip görüntü olarak göm */
          if (!l.objects.length) return;
          var rc = document.createElement('canvas'); rc.width = W; rc.height = H;
          var rctx2 = rc.getContext('2d');
          l.objects.forEach(function (o) { Cv.drawResource(rctx2, o); });
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="'+l.opacity+
                 '" xlink:href="'+rc.toDataURL('image/png')+'"/>');
          return;
        }

        if (l.id === 'elevation') {
          if (!App.elevation.showHillshade && !App.elevation.showContours) return;
          if (Cv.elevationDirty || !Cv.elevationCanvas) Cv.buildElevationEffect();
          if (Cv.elevationCanvas) {
            s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="'+l.opacity+
                   '" xlink:href="'+Cv.elevationCanvas.toDataURL('image/png')+'"/>');
          }
          return;
        }

        if (l.type === 'raster') {
          s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" opacity="'+l.opacity+
                 '" xlink:href="'+l.canvas.toDataURL('image/png')+'"/>');
          return;
        }

        if (l.type === 'vector') {
          var maskAttr = ((l.id === 'rivers' || l.id === 'roads') && landL && landL.canvas) ? ' mask="url(#landMask)"' : '';
          s.push('<g opacity="'+l.opacity+'"'+maskAttr+'>');
          l.objects.forEach(function (o) {
            if (l.id === 'rivers' && o.kind === 'lake') {
              /* göl SVG */
              var lpts = Cv.lakeSmoothPts(o, 16);
              s.push('<path d="' + Geo.svgPolyD(lpts, true) + '" fill="' + (o.color||'#5b8aa6') +
                     '" opacity="' + (o.opacity||0.88) + '" stroke="' + (o.color||'#5b8aa6') +
                     '" stroke-width="2" stroke-opacity="0.5" stroke-linejoin="round"/>');
            } else if (l.id === 'rivers') {
              var pts = Cv.riverGeometry(o);
              var wEnd = o.width || 12;
              var wStart = o.taper ? Math.max(1.2, wEnd*0.18) : wEnd;
              var poly = Geo.ribbon(pts, wStart, wEnd);
              s.push('<path d="'+Geo.svgPolyD(poly,true)+'" fill="'+(o.color||'#5b8aa6')+
                     '" stroke="'+(o.color||'#5b8aa6')+'" stroke-opacity="0.55" stroke-width="'+
                     Math.max(0.7, wEnd*0.09).toFixed(2)+'" stroke-linejoin="round"/>');
            } else if (l.id === 'roads') {
              var rp = Cv.roadGeometry(o), w = o.width || 5, dash = '';
              if (o.style === 'dashed') dash = ' stroke-dasharray="'+(w*2.6)+','+(w*2)+'"';
              if (o.style === 'dotted') dash = ' stroke-dasharray="'+(w*0.35)+','+(w*2.1)+'"';
              if (o.style === 'double') {
                s.push('<path d="'+Geo.svgPolyD(rp)+'" fill="none" stroke="'+(o.color||'#6b4f2a')+
                       '" stroke-width="'+(w*1.9)+'" stroke-linecap="round" stroke-linejoin="round"/>');
                s.push('<path d="'+Geo.svgPolyD(rp)+'" fill="none" stroke="#7ba8bd" stroke-width="'+
                       (w*0.7)+'" stroke-linecap="round" stroke-linejoin="round"/>');
              } else {
                s.push('<path d="'+Geo.svgPolyD(rp)+'" fill="none" stroke="'+(o.color||'#6b4f2a')+
                       '" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'+dash+'/>');
              }
            } else if (l.id === 'territories') {
              var tpts = Cv.lakeSmoothPts(o, 24);
              if (Cv.political) {
                /* siyasi görünüm: opak alan, düz ve belirgin sınır */
                s.push('<path d="' + Geo.svgPolyD(tpts, true) + '" fill="' + (o.color||'#8a5a3a') +
                       '" opacity="' + Cv.politicalFill + '" stroke="' + (o.borderColor||'#4a3020') +
                       '" stroke-width="' + (Math.max(2, o.borderWidth||2)*1.6) + '" stroke-linejoin="round"/>');
              } else {
                var tdash = o.borderWidth ? ' stroke-dasharray="'+(o.borderWidth*3)+','+(o.borderWidth*2)+'"' : '';
                s.push('<path d="' + Geo.svgPolyD(tpts, true) + '" fill="' + (o.color||'#8a5a3a') +
                       '" opacity="' + (o.opacity===undefined?0.30:o.opacity) + '" stroke="' + (o.borderColor||'#5a3a20') +
                       '" stroke-width="' + (o.borderWidth||2) + '"' + tdash + ' stroke-linejoin="round"/>');
              }
            } else if (l.id === 'symbols') {
              s.push(Sym.toSVG(o.sym, o));
            } else if (l.id === 'labels') {
              s.push(Exporter.labelSVG(o));
            }
          });
          s.push('</g>');
        }
      });

      if (Cv.parchment) {
        s.push('<rect x="0" y="0" width="'+W+'" height="'+H+
               '" fill="#d9c79a" opacity="0.28" style="mix-blend-mode:multiply"/>');
      }

      if (Cv.grid) s.push(Exporter.gridSVG(W, H));

      if (App.scale && App.scale.visible) s.push(Exporter.scaleSVG(App.scale));
      if (App.windrose && App.windrose.visible) s.push(Exporter.windroseSVG(App.windrose));

      if (Cv.frame && Cv.frame.style !== 'none') {
        var fc = document.createElement('canvas'); fc.width = W; fc.height = H;
        Cv.drawFrame(fc.getContext('2d'));
        s.push('<image x="0" y="0" width="'+W+'" height="'+H+'" xlink:href="'+fc.toDataURL('image/png')+'"/>');
      }

      s.push('</svg>');
      download(new Blob([s.join('\n')], { type:'image/svg+xml' }), 'harita-' + stamp() + '.svg');
      UI.msg(UI.t('exported') + ' SVG');
    },

    /* ================= GIS (GeoJSON) DIŞA AKTARIMI =================
       Vektör katmanlar zaten pts/x,y tabanlı nesneler olduğu için burada
       yeni bir veri modeli yok: her nesne bir GeoJSON Feature'a çevriliyor.
       Koordinatlar PROJE PİKSEL UZAYINDA kalır — gerçek bir enlem/boylam
       dönüşümü yapılmaz, çünkü harita hayalî bir dünyaya ait ve bir CRS'e
       bağlı değil (AFMG de kendi harita birimini kullanır). Y ekseni de
       ekranla aynı yönde (aşağı pozitif) bırakılır ki QGIS'e alındığında
       harita ters görünmesin diye kullanıcı ayrıca çevirmek zorunda
       kalmasın — dosyanın crs alanı bunu açıkça belirtir. */
    geojsonData: function () {
      var feats = [];
      function ring(pts) {
        var r = pts.map(function (p) { return [round2(p[0]), round2(p[1])]; });
        /* GeoJSON Polygon halkaları kapalı olmalı: ilk nokta = son nokta */
        if (r.length && (r[0][0] !== r[r.length-1][0] || r[0][1] !== r[r.length-1][1])) r.push([r[0][0], r[0][1]]);
        return r;
      }
      function round2(v) { return Math.round(v * 100) / 100; }
      /* Not alanı her nesne türünde aynı anlama geldiği için tek bir
         yerde ekleniyor — her addVector çağrısında tekrar etmesin. */
      function feature(geom, props, o) {
        if (o && o.note) props.note = o.note;
        feats.push({ type:'Feature', geometry:geom, properties:props });
      }

      function addVector(layerId, fn) {
        var L = Layers.get(layerId);
        if (!L || !L.objects) return;
        L.objects.forEach(fn);
      }

      addVector('rivers', function (o) {
        if (o.kind === 'lake') {
          feature({ type:'Polygon', coordinates:[ring(o.pts)] },
                  { layer:'rivers', kind:'lake', name:o.name || null }, o);
        } else {
          feature({ type:'LineString', coordinates:o.pts.map(function (p) { return [round2(p[0]), round2(p[1])]; }) },
                  { layer:'rivers', kind:'river', name:o.name || null, width:o.width || null }, o);
        }
      });

      addVector('roads', function (o) {
        feature({ type:'LineString', coordinates:o.pts.map(function (p) { return [round2(p[0]), round2(p[1])]; }) },
                { layer:'roads', kind:'road', style:o.style || null, width:o.width || null }, o);
      });

      addVector('territories', function (o) {
        feature({ type:'Polygon', coordinates:[ring(o.pts)] }, {
          layer:'territories', kind:o.kind || 'region', name:o.name || null,
          government:o.government || null, culture:o.cultureKey || null,
          capital_x: o.capital ? round2(o.capital.x) : null,
          capital_y: o.capital ? round2(o.capital.y) : null,
          zone: o.zoneType || null
        }, o);
      });

      addVector('symbols', function (o) {
        if (o.kind === 'group') return;   /* grup bir konum değil, kapsayıcı */
        feature({ type:'Point', coordinates:[round2(o.x), round2(o.y)] }, {
          layer:'symbols', symbol:o.sym || null, name:o.name || null,
          population: (typeof o.population === 'number') ? o.population : null,
          culture:o.cultureKey || null
        }, o);
      });

      addVector('resources', function (o) {
        feature({ type:'Point', coordinates:[round2(o.x), round2(o.y)] },
                { layer:'resources', kind:'resource', type:o.type || null }, o);
      });

      addVector('labels', function (o) {
        feature({ type:'Point', coordinates:[round2(o.x), round2(o.y)] },
                { layer:'labels', kind:'label', text:o.text || '', preset:o.preset || null }, o);
      });

      addVector('links', function (o) {
        feature({ type:'Point', coordinates:[round2(o.x), round2(o.y)] },
                { layer:'links', kind:'maplink', name:o.name || null, target:o.targetMapId || null }, o);
      });

      return {
        type:'FeatureCollection',
        name: App.currentCanvasName || 'wayborne-map',
        crs: { type:'name', properties:{ name:'wayborne:canvas-pixels' } },
        canvas: { width:Cv.W, height:Cv.H, yAxis:'down' },
        features: feats
      };
    },

    geojson: function () {
      var data = this.geojsonData();
      if (!data.features.length) { UI.msg(UI.t('gis_empty')); return 0; }
      var blob = new Blob([JSON.stringify(data, null, 1)], { type:'application/geo+json' });
      download(blob, (App.currentCanvasName || 'harita') + '.geojson');
      UI.msg(data.features.length + ' ' + UI.t('gis_done'));
      return data.features.length;
    },

    /* Izgarayı GERÇEK VEKTÖR olarak yazar. Kare ve nokta bir <pattern>
       ile tek seferde tanımlanır (kaç hücre olursa olsun birkaç satır);
       altıgen için de aynı yöntem kullanılır — desen karosu, sivri tepeli
       ızgaranın (w × 2·vstep) tekrar biriminden üretilir. */
    gridSVG: function (W, H) {
      var g = Cv.gridSize;
      if (!(g > 0)) return '';
      var col = Cv.gridColor || '#1e281e';
      var op  = Cv.gridOpacity;
      var lw  = Math.max(1, g*0.012).toFixed(2);
      var id  = 'wbGrid';
      var body, tw, th;

      if (Cv.gridType === 'dot') {
        var r = Math.max(1.2, g*0.035).toFixed(2);
        tw = th = g;
        body = '<circle cx="0" cy="0" r="'+r+'" fill="'+col+'"/>' +
               '<circle cx="'+g+'" cy="0" r="'+r+'" fill="'+col+'"/>' +
               '<circle cx="0" cy="'+g+'" r="'+r+'" fill="'+col+'"/>' +
               '<circle cx="'+g+'" cy="'+g+'" r="'+r+'" fill="'+col+'"/>';
      } else if (Cv.gridType === 'hex') {
        var hgt = g * 2 / Math.sqrt(3);
        var vstep = hgt * 0.75, q = hgt / 4;
        tw = g; th = vstep * 2;
        /* karo içinde iki satır: biri hizalı, biri yarım hücre kaydırılmış */
        function hex(cx, cy) {
          return 'M'+cx+' '+(cy-hgt/2)+
                 'L'+(cx+g/2)+' '+(cy-q)+'L'+(cx+g/2)+' '+(cy+q)+
                 'L'+cx+' '+(cy+hgt/2)+
                 'L'+(cx-g/2)+' '+(cy+q)+'L'+(cx-g/2)+' '+(cy-q)+'Z';
        }
        var d = [hex(0,0), hex(g,0), hex(g/2, vstep), hex(-g/2, vstep),
                 hex(0, vstep*2), hex(g, vstep*2)].join('');
        body = '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+lw+'" stroke-linejoin="round"/>';
      } else {
        tw = th = g;
        body = '<path d="M0 0 H'+g+' M0 0 V'+g+'" fill="none" stroke="'+col+
               '" stroke-width="'+lw+'"/>';
      }

      return '<defs><pattern id="'+id+'" patternUnits="userSpaceOnUse" ' +
             'width="'+tw+'" height="'+th+'">'+body+'</pattern></defs>' +
             '<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="url(#'+id+')" opacity="'+op+'"/>';
    },

    windroseSVG: function (wr) {
      if (!wr || !wr.visible) return '';
      if ((wr.style || 'classic') === 'minimal') return Exporter.windroseMinimalSVG(wr);
      var x = wr.x, y = wr.y, R = wr.size || 120;
      var col = esc(wr.color || '#3a2b18');
      var o = ['<g transform="translate('+x+','+y+')" font-family="Georgia,serif">'];
      /* dış daire */
      o.push('<circle r="'+(R*0.52).toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="'+(R*0.025).toFixed(1)+'" opacity="0.55"/>');
      /* 8 ok */
      var dirs = [0,45,90,135,180,225,270,315];
      dirs.forEach(function(deg) {
        var isCard = deg % 90 === 0;
        var tip = isCard ? R*0.50 : R*0.32;
        var base = isCard ? R*0.13 : R*0.08;
        var side = isCard ? R*0.10 : R*0.06;
        var op = isCard ? '1' : '0.65';
        o.push('<g transform="rotate('+deg+')" opacity="'+op+'">');
        o.push('<path d="M0 '+(-tip).toFixed(1)+' L'+side.toFixed(1)+' '+(-base).toFixed(1)+
               ' L0 0 L'+(-side).toFixed(1)+' '+(-base).toFixed(1)+' Z" fill="'+col+
               '" stroke="'+col+'" stroke-width="'+(R*0.018).toFixed(1)+'"/>');
        o.push('</g>');
      });
      /* merkez */
      o.push('<circle r="'+(R*0.06).toFixed(1)+'" fill="#f5ecd8" stroke="'+col+'" stroke-width="'+(R*0.025).toFixed(1)+'"/>');
      /* N */
      o.push('<text x="0" y="'+(-R*0.70).toFixed(1)+'" font-size="'+(R*0.22).toFixed(1)+
             '" font-weight="bold" fill="'+col+'" text-anchor="middle" dominant-baseline="middle">N</text>');
      o.push('</g>');
      return o.join('');
    },

    windroseMinimalSVG: function (wr) {
      var x = wr.x, y = wr.y, R = wr.size || 120;
      var col = esc(wr.color || '#3a2b18');
      var o = ['<g transform="translate('+x+','+y+')" font-family="Georgia,serif" stroke-linecap="round">'];
      o.push('<circle r="'+(R*0.46).toFixed(1)+'" fill="none" stroke="'+col+'" stroke-width="'+(R*0.02).toFixed(1)+'" opacity="0.5"/>');
      o.push('<path d="M0 '+(-R*0.46).toFixed(1)+' L0 '+(R*0.46).toFixed(1)+
             ' M'+(-R*0.46).toFixed(1)+' 0 L'+(R*0.46).toFixed(1)+' 0" stroke="'+col+
             '" stroke-width="'+(R*0.022).toFixed(1)+'" opacity="0.85"/>');
      [45,135,225,315].forEach(function (deg) {
        var rad = deg*Math.PI/180;
        var x1 = Math.sin(rad)*R*0.36, y1 = -Math.cos(rad)*R*0.36;
        var x2 = Math.sin(rad)*R*0.46, y2 = -Math.cos(rad)*R*0.46;
        o.push('<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+
               '" stroke="'+col+'" stroke-width="'+(R*0.014).toFixed(1)+'" opacity="0.5"/>');
      });
      o.push('<circle r="'+(R*0.035).toFixed(1)+'" fill="'+col+'"/>');
      o.push('<path d="M0 '+(-R*0.46).toFixed(1)+' L'+(R*0.045).toFixed(1)+' '+(-R*0.36).toFixed(1)+
             ' L'+(-R*0.045).toFixed(1)+' '+(-R*0.36).toFixed(1)+' Z" fill="'+col+'"/>');
      o.push('<text x="0" y="'+(-R*0.60).toFixed(1)+'" font-size="'+(R*0.16).toFixed(1)+
             '" font-weight="600" fill="'+col+'" text-anchor="middle" dominant-baseline="middle">N</text>');
      o.push('</g>');
      return o.join('');
    },

    scaleSVG: function (sc) {
      var segs = Math.max(2, sc.segs|0), segW = sc.len/segs, barH = sc.size*0.62;
      var o = ['<g transform="translate('+sc.x+','+sc.y+')">'];
      o.push('<rect x="0" y="0" width="'+sc.len+'" height="'+barH+'" fill="#f2e6c8" stroke="#3a2b18" stroke-width="'+
             Math.max(1, sc.size*0.10)+'"/>');
      for (var i = 0; i < segs; i += 2) {
        o.push('<rect x="'+(i*segW)+'" y="0" width="'+segW+'" height="'+barH+'" fill="#3a2b18"/>');
      }
      o.push('<rect x="0" y="0" width="'+sc.len+'" height="'+barH+'" fill="none" stroke="#3a2b18" stroke-width="'+
             Math.max(1, sc.size*0.10)+'"/>');
      o.push('<path d="M0 '+(-sc.size*0.34)+' L0 0 M'+sc.len+' '+(-sc.size*0.34)+' L'+sc.len+
             ' 0 M'+(sc.len/2)+' '+(-sc.size*0.22)+' L'+(sc.len/2)+' 0" stroke="#3a2b18" stroke-width="'+
             Math.max(1, sc.size*0.10)+'" fill="none"/>');
      var fam = FONTS.serif.replace(/"/g, "'");
      o.push('<text x="0" y="'+(barH+sc.size*0.24)+'" font-family="'+esc(fam)+'" font-size="'+sc.size+
             '" font-weight="600" fill="#3a2b18" dominant-baseline="hanging">0</text>');
      o.push('<text x="'+sc.len+'" y="'+(barH+sc.size*0.24)+'" font-family="'+esc(fam)+'" font-size="'+sc.size+
             '" font-weight="600" fill="#3a2b18" text-anchor="end" dominant-baseline="hanging">'+
             esc(sc.label||'')+'</text>');
      o.push('</g>');
      return o.join('');
    },

    labelSVG: function (o) {
      var text = o.caps ? (o.text||'').toUpperCase() : (o.text||'');
      var fam = (FONTS[o.font] || FONTS.serif).replace(/"/g, "'");
      var total = Cv.measureLabel(Cv.ctx, o);
      var out = [];
      var rot = o.rot ? ' transform="rotate('+o.rot+' '+o.x+' '+o.y+')"' : '';

      /* kapıt */
      if (o.banner) {
        var bw = total + (o.size||32)*1.25;
        var bh = (o.size||32)*1.62;
        var paths = Cv.bannerPaths(o.banner, bw, bh);
        out.push('<g transform="translate('+o.x+','+o.y+')'+(o.rot?' rotate('+o.rot+')':'')+'">');
        paths.forEach(function (bp) {
          out.push('<path d="'+bp.d+'" fill="'+(bp.fill||'none')+'"'+
                   (bp.stroke ? ' stroke="'+bp.stroke+'" stroke-width="'+bp.lw+'"' : '')+
                   ' stroke-linejoin="round"/>');
        });
        out.push('</g>');
      }

      /* Bitişik yazılarda (Arapça, Farsça, İbranice, Hint yazıları) harf
         aralığı bağlanma biçimlerini bozar; ayrıca sağdan sola yazıda
         yönün açıkça belirtilmesi gerekir — canvas tarafındaki tek parça
         çizimin SVG karşılığı. */
      var complex = Cv.isComplexText(text);
      var track = complex ? 0 : (o.track||0);
      var dirAttr = complex && Cv.isRTLText(text) ? ' direction="rtl"' : '';
      var common = 'font-family="'+esc(fam)+'" font-size="'+(o.size||32)+
                   '" font-weight="600" letter-spacing="'+track+
                   '" fill="'+(o.color||'#3a2b18')+'"' + dirAttr +
                   (o.outline ? ' stroke="'+(o.outlineColor||'#f5ecd8')+'" stroke-width="'+
                     Math.max(1.5,(o.size||32)*0.16)+'" paint-order="stroke"' : '');

      if (o.pathPts && o.pathPts.length > 1) {
        var pathLen = Geo.polylineLength(o.pathPts);
        var center = (o.pathCenter != null) ? o.pathCenter : pathLen/2;
        var startOffPx = center - total/2;
        var startPct = (startOffPx / pathLen) * 100;
        var pid2 = 'lp' + o.id;
        out.push('<defs><path id="'+pid2+'" d="'+Geo.svgPolyD(o.pathPts, false)+'" fill="none"/></defs>');
        out.push('<text '+common+'><textPath xlink:href="#'+pid2+
                 '" startOffset="'+startPct.toFixed(2)+'%">'+esc(text)+'</textPath></text>');
        return out.join('');
      }

      if (!o.curve || complex) {
        out.push('<text x="'+o.x+'" y="'+o.y+'" text-anchor="middle" dominant-baseline="middle" '+
                 common+rot+'>'+esc(text)+'</text>');
        return out.join('');
      }

      var arc = o.curve*Math.PI/180;
      var R = Math.abs(total/arc);
      var sweep = o.curve > 0 ? 1 : 0;
      var half = Math.abs(arc)/2;
      var cx = o.x, cy = o.y + (o.curve > 0 ? R : -R);
      var x1 = cx - Math.sin(half)*R, x2 = cx + Math.sin(half)*R;
      var y1 = cy - Math.cos(half)*R*(o.curve > 0 ? 1 : -1), y2 = y1;
      var pid = 'lp' + o.id;
      out.push('<defs><path id="'+pid+'" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+
               ' A'+R.toFixed(1)+' '+R.toFixed(1)+' 0 0 '+sweep+' '+x2.toFixed(1)+' '+y2.toFixed(1)+
               '" fill="none"/></defs>');
      out.push('<text '+common+rot+'><textPath xlink:href="#'+pid+
               '" startOffset="50%" text-anchor="middle">'+esc(text)+'</textPath></text>');
      return out.join('');
    },

    /* proje verisini bellekte bir nesne olarak üretir — dosyaya indirmeden
       (localStorage tuval kütüphanesi de bunu kullanır) */
    buildProjectData: function () {
      /* aktif haritayı da App.maps'e senkronize et ki dünya + tüm bölge
         haritaları tek bir .json içinde tam olarak saklansın */
      App.maps[App.currentMapId] = Layers.serialize(true);
      return {
        app:'cartographer', version:3,
        W:Cv.W, H:Cv.H,
        parchment:Cv.parchment, grid:Cv.grid,
        political:Cv.political, politicalFill:Cv.politicalFill,
        politicalMuteTerrain:Cv.politicalMuteTerrain, politicalLegend:Cv.politicalLegend,
        emblems:Cv.emblems,
        climate:JSON.parse(JSON.stringify(App.climate)), windArrows:Cv.windArrows,
        notes:Cv.notes,
        landgenPresets:JSON.parse(JSON.stringify(App.landgenPresets || [])),
        customCultures:(global.Names ? Names.serializeCustom() : {}),
        symbolLegend:Cv.symbolLegend,
        gridType:Cv.gridType, gridSize:Cv.gridSize,
        gridColor:Cv.gridColor, gridOpacity:Cv.gridOpacity,
        shore:Cv.shore, shoreWidth:Cv.shoreWidth, shoreStyle:Cv.shoreStyle, frame:Cv.frame,
        seaColor:Cv.seaColor,
        elevShowHillshade:App.elevation.showHillshade,
        elevShowContours:App.elevation.showContours,
        elevContourInterval:App.elevation.contourInterval,
        exportReference:App.exportReference,
        scale:App.scale,
        windrose:App.windrose,
        diplomacy:App.diplomacy,
        customSymbols: Sym.serializeCustom(),
        maps: App.maps,
        layers: App.maps.root || Layers.serialize(true)
      };
    },

    saveProject: function () {
      var data = this.buildProjectData();
      download(new Blob([JSON.stringify(data)], { type:'application/json' }), 'harita-'+stamp()+'.json');
      /* .json indirmeye ek olarak tarayıcı kütüphanesine de sessizce kaydet —
         "Canvas" sekmesinde otomatik listelensin diye */
      var id = this.libSave(App.currentCanvasName, App.currentLibId);
      if (id) App.currentLibId = id;
      UI.msg(UI.t('saved'));
    },

    /* sessiz oto-kayıt: .json indirmez, mesaj göstermez — sadece tarayıcı
       kütüphanesini günceller. Ana sayfaya dönüşte ve her 10 dakikada bir
       (bkz. UI.initShell) çağrılır. Hiç çizim yapılmamış boş tuvali
       gereksiz yere kütüphaneye eklememek için History boşsa atlanır. */
    autoSave: function () {
      if (!global.History || !History.canUndo()) return;
      var id = this.libSave(App.currentCanvasName, App.currentLibId);
      if (id) App.currentLibId = id;
    },

    /* bir proje veri nesnesini (dosyadan ya da localStorage'dan) uygulanmış
       hâle getirir — döndürdüğü Promise, raster katmanların (görsel)
       yüklenmesi tamamlandığında çözülür */
    applyProjectData: function (d) {
      Cv.setSize(d.W||2048, d.H||2048, false);
      Cv.parchment = !!d.parchment;
      Cv.grid = !!d.grid;
      Cv.political = !!d.political;
      if (d.politicalFill !== undefined) Cv.politicalFill = d.politicalFill;
      if (d.politicalMuteTerrain !== undefined) Cv.politicalMuteTerrain = d.politicalMuteTerrain;
      if (d.politicalLegend !== undefined) Cv.politicalLegend = d.politicalLegend;
      if (d.emblems !== undefined) Cv.emblems = d.emblems;
      if (d.climate) { App.climate = d.climate; }
      if (d.windArrows !== undefined) Cv.windArrows = d.windArrows;
      if (d.notes !== undefined) Cv.notes = d.notes;
      App.landgenPresets = d.landgenPresets || [];
      if (global.Names) Names.applyCustom(d.customCultures || {});
      Cv.windDirty = true;
      if (d.symbolLegend !== undefined) Cv.symbolLegend = d.symbolLegend;
      if (d.gridType)  Cv.gridType  = d.gridType;
      if (d.gridSize)  Cv.gridSize  = d.gridSize;
      if (d.gridColor) Cv.gridColor = d.gridColor;
      if (d.gridOpacity !== undefined) Cv.gridOpacity = d.gridOpacity;
      Cv.shore = d.shore !== false;
      Cv.shoreWidth = d.shoreWidth || 26;
      Cv.shoreStyle = d.shoreStyle || 'sandy';
      Cv.frame = d.frame || { style:'none', color:'#3a2b18', width:24 };
      Cv.setSeaColor(d.seaColor || '#7ba8bd');
      App.sea.color = Cv.seaColor;
      App.elevation.showHillshade = d.elevShowHillshade !== false;
      App.elevation.showContours = !!d.elevShowContours;
      App.elevation.contourInterval = d.elevContourInterval || 32;
      App.exportReference = !!d.exportReference;
      if (d.scale) App.scale = d.scale;
      if (d.windrose) App.windrose = d.windrose;
      App.diplomacy = d.diplomacy || {};

      document.getElementById('chk-parchment').checked = Cv.parchment;
      document.getElementById('chk-grid').checked = Cv.grid;
      var _po=document.getElementById('pol-on');     if (_po) _po.checked = Cv.political;
      var _pm=document.getElementById('pol-mute');   if (_pm) _pm.checked = Cv.politicalMuteTerrain;
      var _pl=document.getElementById('pol-legend'); if (_pl) _pl.checked = Cv.politicalLegend;
      var _pe=document.getElementById('pol-emblem'); if (_pe) _pe.checked = Cv.emblems;
      var _ci=document.getElementById('cli-on');   if (_ci) { _ci.checked = !!App.climate.on;
        var _cb=document.getElementById('cli-body'); if (_cb) _cb.hidden = !App.climate.on; }
      var _ce=document.getElementById('cli-eq');   if (_ce) { _ce.value = Math.round(App.climate.equator*100);
        var _cel=document.getElementById('v-cli-eq'); if (_cel) _cel.textContent = Math.round(App.climate.equator*100) + '%'; }
      var _cs=document.getElementById('cli-str');  if (_cs) { _cs.value = Math.round(App.climate.strength*100);
        var _csl=document.getElementById('v-cli-str'); if (_csl) _csl.textContent = Math.round(App.climate.strength*100) + '%'; }
      var _cw=document.getElementById('cli-wind'); if (_cw) _cw.checked = !!Cv.windArrows;
      var _nt=document.getElementById('note-show'); if (_nt) _nt.checked = !!Cv.notes;
      if (global.UI) { UI.refreshLandgenTemplates(); UI.buildCultureList(); }
      var _sl=document.getElementById('chk-legend'); if (_sl) _sl.checked = Cv.symbolLegend;
      var _pf=document.getElementById('pol-fill');   if (_pf) _pf.value = Math.round(Cv.politicalFill*100);
      var _gt=document.getElementById('grid-type');  if (_gt) _gt.value = Cv.gridType;
      var _gs=document.getElementById('grid-size');  if (_gs) _gs.value = Cv.gridSize;
      var _gc=document.getElementById('grid-color'); if (_gc) _gc.value = Cv.gridColor;
      var _go=document.getElementById('grid-op');    if (_go) _go.value = Math.round(Cv.gridOpacity*100);
      document.getElementById('chk-shore').checked = Cv.shore;
      document.getElementById('ref-export').checked = App.exportReference;
      document.getElementById('sel-canvas-size').value = String(d.W||2048);
      var _sc=document.getElementById('sea-color'); if (_sc) _sc.value = Cv.seaColor;
      document.getElementById('shore-w').value = Cv.shoreWidth;
      document.getElementById('v-shore-w').textContent = Cv.shoreWidth;
      document.getElementById('shore-style').value = Cv.shoreStyle;
      document.getElementById('elev-hillshade').checked = App.elevation.showHillshade;
      document.getElementById('elev-contours').checked = App.elevation.showContours;
      document.getElementById('elev-interval').value = App.elevation.contourInterval;
      document.getElementById('v-elev-interval').textContent = App.elevation.contourInterval;
      document.getElementById('frame-style').value = Cv.frame.style;
      document.getElementById('frame-color').value = Cv.frame.color;
      document.getElementById('frame-w').value = Cv.frame.width;
      document.getElementById('v-frame-w').textContent = Cv.frame.width;

      if (d.customSymbols) Sym.deserializeCustom(d.customSymbols);

      App.maps = d.maps || {};
      App.mapStack = [];
      App.currentMapId = 'root';
      App.currentMapLabel = '';

      return Layers.deserialize(App.maps.root || d.layers || []).then(function () {
        History.clear();
        App.selection = null;
        Cv.shoreDirty = true;
        Cv.elevationDirty = true;
        UI.refreshAll();
        UI.refreshBreadcrumb();
        Cv.fit();
      });
    },

    loadProject: function (file) {
      var self = this;
      var r = new FileReader();
      r.onload = function () {
        var d;
        try { d = JSON.parse(r.result); }
        catch (e) { UI.msg(UI.t('badfile')); return; }
        if (!d || d.app !== 'cartographer') { UI.msg(UI.t('badfile')); return; }
        self.applyProjectData(d).then(function () { UI.msg(UI.t('loaded')); });
      };
      r.readAsText(file);
    },

    newProject: function (w, h, name) {
      h = h || w;
      Layers.init(w, h);
      App._blankSnapshot = App._snapshotLayers();
      App.maps = {}; App.mapStack = []; App.currentMapId = 'root'; App.currentMapLabel = '';
      App.currentLibId = null; App.currentCanvasName = name || 'Adsız harita';
      Cv.frame = { style:'none', color:'#3a2b18', width:24 };
      Cv.setSize(w, h, false);
      App.scale.x = Math.round(w*0.06);
      App.scale.y = Math.round(h*0.92);
      History.clear();
      App.selection = null;
      Tools.cancelPath();
      Cv.shoreDirty = true;
      Cv.shoreCanvas = null;
      UI.refreshAll();
      UI.refreshBreadcrumb();
      Cv.fit();
      UI.msg(UI.t('newmap'));
    },

    /* ================= TARAYICI TUVAL KÜTÜPHANESİ (localStorage) =================
       Backend yok — 'kayıtlı tuvaller' tarayıcının localStorage'ında saklanır.
       .json dışa/içe aktarma (saveProject/loadProject) gerçek yedekleme/taşıma
       yoludur; bu kütüphane sadece "son kaldığın yerden devam et" kolaylığı. */
    LIB_KEY: 'wayborne_canvases',

    libList: function () {
      try {
        var raw = localStorage.getItem(this.LIB_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) { return []; }
    },

    /* Kayıt geçmişi kartlarında gösterilecek küçük önizleme — tam çözünürlüklü
       PNG yerine düşük kaliteli JPEG (haritanın rengi/dokusu zaten fotoğraf
       gibi, PNG'nin kayıpsız avantajı burada gereksiz yer kaplar; localStorage
       kotası kolayca dolar). Uzun kenar sabit, en-boy oranı korunur. */
    libThumb: function (maxDim) {
      maxDim = maxDim || 240;
      var k = Math.min(1, maxDim / Math.max(Cv.W, Cv.H));
      var c = this.renderToCanvas(Cv.W*k, Cv.H*k);
      return c.toDataURL('image/jpeg', 0.6);
    },

    libSave: function (name, existingId) {
      var list = this.libList();
      var data = this.buildProjectData();
      var id = existingId || ('cv' + Date.now().toString(36) + Math.floor(Math.random()*1e6).toString(36));
      var entry = { id:id, name:name || 'Adsız harita', updatedAt:Date.now(), W:Cv.W, H:Cv.H, data:data, thumb:this.libThumb() };
      var idx = list.findIndex(function (e) { return e.id === id; });
      if (idx >= 0) list[idx] = entry; else list.unshift(entry);
      try {
        localStorage.setItem(this.LIB_KEY, JSON.stringify(list));
        return id;
      } catch (e) {
        /* kota muhtemelen küçük resimler yüzünden doldu — bu kaydın
           önizlemesini atıp tekrar dene; önizlemesiz bir kayıt hiç kayıt
           olmamasından iyidir */
        entry.thumb = null;
        try {
          localStorage.setItem(this.LIB_KEY, JSON.stringify(list));
          return id;
        } catch (e2) {
          UI.msg(UI.t('lib_full'));
          return null;
        }
      }
    },

    libOpen: function (id) {
      var list = this.libList();
      var entry = list.filter(function (e) { return e.id === id; })[0];
      if (!entry) return Promise.reject('not found');
      return this.applyProjectData(entry.data);
    },

    libDelete: function (id) {
      var list = this.libList().filter(function (e) { return e.id !== id; });
      try { localStorage.setItem(this.LIB_KEY, JSON.stringify(list)); } catch (e) {}
    }
  };

  global.Exporter = Exporter;
  global.downloadFile = download;
})(window);
