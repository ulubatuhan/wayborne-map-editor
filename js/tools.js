/* ============================================================
   Cartographer — tools.js  v3
   Araç mantığı: kara/deniz fırçası (silgi arazi katmanını da
   siler), prosedürel arazi serpme, sembol, nehir, yol, etiket,
   doku örnekleyici, seçim, ölçek çubuğu, sağ tık pan.
   ============================================================ */
(function (global) {
  'use strict';

  function uid(){return 'o'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36);}
  function $(id){return document.getElementById(id);}
  function snap(c){ var t=document.createElement('canvas'); t.width=c.width; t.height=c.height;
                    t.getContext('2d').drawImage(c,0,0); return t; }
  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex||'#000000');
    return m ? { r:parseInt(m[1],16), g:parseInt(m[2],16), b:parseInt(m[3],16) } : { r:0, g:0, b:0 };
  }

  /* Yumuşak fırça kenarı için: aynı rengin saydam hâli. Doğrudan
     'transparent' kullanmak bazı tarayıcılarda gradyanı siyaha kaydırır. */
  function rgbaOf(hex, a) {
    var c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }

  /* Fırça vuruşu sırasında (stampTerrain/eyedropStamp) tekrar tekrar canvas
     oluşturmamak için tek seferlik, sadece büyüyen bir scratch canvas havuzu. */
  var _scratchPool = {};
  function scratchCanvas(key, w, h) {
    var s = _scratchPool[key];
    if (!s) { s = document.createElement('canvas'); _scratchPool[key] = s; }
    if (s.width < w) s.width = w;
    if (s.height < h) s.height = h;
    var ctx = s.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, s.width, s.height);
    return s;
  }

  /* ====================================================================
     DOKU ÖRNEKLEYİCİ
     ==================================================================== */
  var Eyedropper = {
    active:false, sample:null, picking:false, pickPos:null, pickR:60,

    analyze: function (cx, cy, radius) {
      var W = Cv.W, H = Cv.H;
      var tmp = document.createElement('canvas');
      tmp.width = W; tmp.height = H;
      var tx = tmp.getContext('2d', { willReadFrequently:true });
      try { Cv.renderMap(tx, { includeReference:false }); }
      catch (e) {
        Layers.list.forEach(function (l) {
          if (l.type === 'raster' && l.visible && l.canvas) tx.drawImage(l.canvas, 0, 0);
        });
      }

      var r = Math.max(4, Math.round(radius));
      var x0 = Math.max(0, Math.round(cx-r)), y0 = Math.max(0, Math.round(cy-r));
      var x1 = Math.min(W, Math.round(cx+r)), y1 = Math.min(H, Math.round(cy+r));
      var w = x1-x0, h = y1-y0;
      if (w < 2 || h < 2) return null;

      var id, d;
      try { id = tx.getImageData(x0, y0, w, h); d = id.data; }
      catch (e) { console.warn('getImageData:', e); return null; }

      var rSum=0,gSum=0,bSum=0,cnt=0;
      for (var py=0; py<h; py++) for (var px=0; px<w; px++) {
        var dx=px-w/2, dy=py-h/2;
        if (dx*dx+dy*dy > r*r) continue;
        var i4=(py*w+px)*4;
        rSum+=d[i4]; gSum+=d[i4+1]; bSum+=d[i4+2]; cnt++;
      }
      if (!cnt) return null;
      var ar=Math.round(rSum/cnt), ag=Math.round(gSum/cnt), ab=Math.round(bSum/cnt);
      var baseColor='#'+[ar,ag,ab].map(function(v){return('0'+v.toString(16)).slice(-2);}).join('');

      var gray = new Float32Array(w*h);
      for (var g=0; g<w*h; g++) {
        var g4=g*4;
        gray[g]=(d[g4]*0.299+d[g4+1]*0.587+d[g4+2]*0.114)/255;
      }
      var edges=[], step=Math.max(1, Math.round(r/9));
      for (var qy=1; qy<h-1; qy+=step) for (var qx=1; qx<w-1; qx+=step) {
        var ex=qx-w/2, ey=qy-h/2;
        if (ex*ex+ey*ey > r*r) continue;
        var gx=(-gray[(qy-1)*w+(qx-1)]+gray[(qy-1)*w+(qx+1)]
                -2*gray[qy*w+(qx-1)]+2*gray[qy*w+(qx+1)]
                -gray[(qy+1)*w+(qx-1)]+gray[(qy+1)*w+(qx+1)]);
        var gy=(-gray[(qy-1)*w+(qx-1)]-2*gray[(qy-1)*w+qx]-gray[(qy-1)*w+(qx+1)]
                +gray[(qy+1)*w+(qx-1)]+2*gray[(qy+1)*w+qx]+gray[(qy+1)*w+(qx+1)]);
        var mag=Math.hypot(gx,gy);
        if (mag > 0.06) edges.push({ angle:Math.atan2(gy,gx), strength:Math.min(1,mag*2) });
      }
      edges.sort(function(a,b){return b.strength-a.strength;});
      edges = edges.slice(0, 26);

      var vr=0, vc=0;
      for (var vy=0; vy<h; vy+=step) for (var vx=0; vx<w; vx+=step) {
        var wx=vx-w/2, wy=vy-h/2;
        if (wx*wx+wy*wy > r*r) continue;
        var v4=(vy*w+vx)*4;
        vr += Math.abs(d[v4]-ar)+Math.abs(d[v4+1]-ag)+Math.abs(d[v4+2]-ab);
        vc++;
      }
      var variance = vc ? Math.min(60, vr/vc/3) : 10;

      return { r:ar, g:ag, b:ab, baseColor:baseColor, edges:edges,
               variance:variance, cx:cx, cy:cy, radius:radius };
    },

    paint: function (ctx, mx, my, brushRadius) {
      var s = this.sample;
      if (!s) return;
      ctx.save();
      var grad = ctx.createRadialGradient(mx, my, brushRadius*0.35, mx, my, brushRadius);
      grad.addColorStop(0, 'rgba('+s.r+','+s.g+','+s.b+',0.88)');
      grad.addColorStop(0.7, 'rgba('+s.r+','+s.g+','+s.b+',0.72)');
      grad.addColorStop(1, 'rgba('+s.r+','+s.g+','+s.b+',0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(mx, my, brushRadius, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      if (!s.edges.length) return;
      var n = Math.max(3, Math.round(brushRadius*0.20));
      n = Math.min(52, n);
      ctx.save();
      ctx.lineCap = 'round';
      for (var i=0; i<n; i++) {
        var e = s.edges[Math.floor(Math.random()*s.edges.length)];
        var a = Math.random()*Math.PI*2;
        var rr = Math.sqrt(Math.random())*brushRadius*0.92;
        var px = mx+Math.cos(a)*rr, py = my+Math.sin(a)*rr;
        var edgeFade = 1-Math.pow(rr/brushRadius, 2.2);
        var ang = e.angle + (Math.random()-0.5)*0.9;
        var len = brushRadius*(0.05+Math.random()*0.16)*e.strength;
        var jr = clamp255(s.r+(Math.random()-0.5)*s.variance);
        var jg = clamp255(s.g+(Math.random()-0.5)*s.variance);
        var jb = clamp255(s.b+(Math.random()-0.5)*s.variance);
        ctx.strokeStyle = 'rgb('+jr+','+jg+','+jb+')';
        ctx.lineWidth = Math.max(0.6, brushRadius*0.022*e.strength*(0.5+Math.random()*0.9));
        ctx.globalAlpha = (0.25+Math.random()*0.5)*e.strength*edgeFade;
        ctx.beginPath();
        ctx.moveTo(px-Math.cos(ang)*len, py-Math.sin(ang)*len);
        ctx.lineTo(px+Math.cos(ang)*len, py+Math.sin(ang)*len);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  function clamp255(v){ return Math.max(0, Math.min(255, Math.round(v))); }

  /* ====================================================================
     TOOLS
     ==================================================================== */
  var Tools = {
    painting:false, panning:false, spaceDown:false,
    panStart:null, last:null, box:null,
    beforeMain:null, beforeAux:null,
    pathPts:[], pathHover:null,
    dragging:null, activeLayerId:null,
    eyeStartPos:null,
    scaleDrag:null,
    rubberBand:null,
    windroseDrag:null,
    handleDrag:null,
    resizeDrag:null,
    symBrushLast:null,
    symBrushBefore:null,
    lasso:null, floating:null, floatDrag:null, floatRotateDrag:null,
    /* iki parmaklı yakınlaştırma/kaydırma (mobil çekirdek jestler) —
       pointerId'ye göre aktif dokunuşları izler; ayrıntı için onDown/onMove/
       onUp içindeki dokunmatik erken-çıkış bloklarına bak. */
    _touches:{}, _pinch:null,
    LASSO_LAYERS: ['landmass','terrain','elevation'],
    /* nokta-tabanlı vektör katmanlar — kement alanının içine düşen semboller,
       kaynaklar, etiketler ve harita bağlantıları da rasterle BİRLİKTE taşınır. */
    LASSO_VECTOR_LAYERS: ['symbols', 'resources', 'labels', 'links'],

    bind: function () {
      var v = Cv.view, self = this;
      v.addEventListener('pointerdown', function (e) { self.onDown(e); });
      v.addEventListener('pointermove', function (e) { self.onMove(e); });
      window.addEventListener('pointerup', function (e) { self.onUp(e); });
      v.addEventListener('pointerleave', function () { Cv.mouse.over = false; Cv.requestRender(); });
      v.addEventListener('pointerenter', function () { Cv.mouse.over = true; });
      v.addEventListener('dblclick', function (e) {
        e.preventDefault();
        if (App.tool === 'select') {
          var hit = self.hitTest(self.pos(e));
          if (hit && hit.layerId === 'links') { App.enterMap(hit.obj.targetMapId, hit.obj.name); return; }
        }
        self.finishPath();
      });

      /* sağ tık: pan (bekleyen yol varsa yolu bitir) */
      v.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      v.addEventListener('wheel', function (e) {
        e.preventDefault();
        var r = v.getBoundingClientRect();
        var f = e.deltaY < 0 ? 1.12 : 1/1.12;
        Cv.setZoom(Cv.zoom*f, e.clientX-r.left, e.clientY-r.top);
      }, { passive:false });

      Cv.mini.addEventListener('pointerdown', function (e) {
        var r = Cv.mini.getBoundingClientRect();
        var s = Cv.mini.width/Math.max(Cv.W, Cv.H);
        Cv.centerOn((e.clientX-r.left)/s, (e.clientY-r.top)/s);
      });
    },

    pos: function (e) {
      var r = Cv.view.getBoundingClientRect();
      return Cv.screenToMap(e.clientX-r.left, e.clientY-r.top);
    },

    /* ================= POINTER DOWN ================= */
    onDown: function (e) {
      /* iki parmakla dokunma → çizim/kaydırma yerine yakınlaştırma jesti.
         İkinci parmak indiğinde önce birinci parmağın başlattığı tekli
         işlem varsa (fırça darbesi, kaydırma...) onUp() ile düzgünce
         bitirilir/işlenir, sonra bu ve sonraki dokunuşlar çizim
         yollamasına girmeden pinch durumuna yönlendirilir. */
      if (e.pointerType === 'touch') {
        this._touches[e.pointerId] = { x:e.clientX, y:e.clientY };
        var tids = Object.keys(this._touches);
        if (tids.length >= 2) {
          if (!this._pinch) this.onUp();
          var ta = this._touches[tids[0]], tb = this._touches[tids[1]];
          this._pinch = { dist: Math.hypot(ta.x-tb.x, ta.y-tb.y) };
          return;
        }
      }

      var p = this.pos(e);
      Cv.mouse.x = p.x; Cv.mouse.y = p.y; Cv.mouse.over = true;

      /* sağ tık / orta tık / space / pan aracı → kaydır */
      if (e.button === 1 || e.button === 2 || this.spaceDown || App.tool === 'pan') {
        this.panning = true;
        this.panStart = { x:e.clientX, y:e.clientY, px:Cv.panX, py:Cv.panY };
        Cv.view.classList.add('panning');
        return;
      }
      if (e.button !== 0) return;
      /* Bazı ortamlarda (sentetik olaylar, ya da parmak zaten kalkmışsa)
         setPointerCapture NotFoundError fırlatabilir — bu, izleyen çizim
         mantığını sessizce iptal etmemeli. */
      try { Cv.view.setPointerCapture(e.pointerId); } catch (ptrErr) {}

      /* windrose tutamağı */
      if (App.windrose && App.windrose.visible && this.hitWindrose(p)) {
        var wb = JSON.parse(JSON.stringify(App.windrose));
        this.windroseDrag = { sx:p.x, sy:p.y, ox:App.windrose.x, oy:App.windrose.y, before:wb };
        return;
      }

      /* ölçek çubuğu tutamağı (her araçta) */
      if (App.scale && App.scale.visible && this.hitScale(p)) {
        var b = JSON.parse(JSON.stringify(App.scale));
        this.scaleDrag = { sx:p.x, sy:p.y, ox:App.scale.x, oy:App.scale.y, before:b };
        App.selection = { layerId:'scale', id:'scale' };
        UI.refreshSelection();
        return;
      }

      if (App.tool === 'eyedrop') {
        if (App.eyedrop.painting && Eyedropper.sample) this.startEyedropPaint(p);
        else {
          Eyedropper.picking = true;
          this.eyeStartPos = { x:p.x, y:p.y };
          App.eyedrop.radius = 10;
        }
        return;
      }

      /* bezier tutamacı sürüklemeye başla (seçili nehir/yol/göl/bölge) */
      if (App.tool === 'select') {
        var hh = this.hitTestHandle(p);
        if (hh) {
          var Lh = Layers.get(App.selection.layerId);
          this.handleDrag = { obj:hh.obj, index:hh.index, dir:hh.dir, closed:hh.closed,
                               before: JSON.parse(JSON.stringify(Lh.objects)) };
          return;
        }
        /* köşe büyütme tutamacı (seçili sembol) */
        var rh = this.hitTestResizeHandle(p);
        if (rh) {
          var Lr = Layers.get('symbols');
          this.resizeDrag = { obj:rh.obj, before: JSON.parse(JSON.stringify(Lr.objects)) };
          return;
        }
      }

      switch (App.tool) {
        case 'landmass': this.startRaster('landmass', p, 'paint'); break;
        case 'erase':    this.startRaster('landmass', p, 'erase'); break;
        case 'fill':     this.floodFill(p.x, p.y); break;
        case 'terrain':  this.startRaster('terrain',  p, 'terrain'); break;
        case 'elevation': this.startRaster('elevation', p, 'elevation'); break;
        case 'sketch': {
          /* Çizim her zaman *aktif* katmana yazar ve yalnız kullanıcı
             katmanına izin verilir — yerleşik katmanlara serbest boya
             sızdırmak, o katmanların anlamını (kara maskesi, yükselti
             gri tonu) bozardı. */
          var sl = Layers.get(Layers.active);
          if (!sl || !sl.custom) { UI.msg(UI.t('sketch_need_layer')); break; }
          this.startRaster(sl.id, p, 'sketch');
          break;
        }
        case 'symbol':
          if (App.symbol.brushMode) this.startSymbolBrush(p);
          else this.placeSymbol(p);
          break;
        case 'lake':
        case 'river':
        case 'road':
        case 'territory':
        case 'measure':  this.addPathPoint(p); break;
        case 'label':    this.placeLabel(p); break;
        case 'resource': this.placeResource(p); break;
        case 'regionlink': this.placeRegionLink(p); break;
        case 'lasso':    this.onLassoDown(p); break;
        case 'select':   this.startSelect(p, e.shiftKey); break;
      }
      Cv.requestRender();
    },

    /* ================= POINTER MOVE ================= */
    onMove: function (e) {
      if (e.pointerType === 'touch' && this._touches[e.pointerId]) {
        this._touches[e.pointerId] = { x:e.clientX, y:e.clientY };
        var mids = Object.keys(this._touches);
        if (this._pinch && mids.length >= 2) {
          var ma = this._touches[mids[0]], mb = this._touches[mids[1]];
          var md = Math.hypot(ma.x-mb.x, ma.y-mb.y);
          var mr = Cv.view.getBoundingClientRect();
          var mx = (ma.x+mb.x)/2 - mr.left, my = (ma.y+mb.y)/2 - mr.top;
          if (this._pinch.dist > 0 && md > 0) Cv.setZoom(Cv.zoom * (md/this._pinch.dist), mx, my);
          this._pinch.dist = md;
          return;
        }
      }

      var p = this.pos(e);
      Cv.mouse.x = p.x; Cv.mouse.y = p.y; Cv.mouse.over = true;

      if (this.panning && this.panStart) {
        Cv.panX = this.panStart.px + (e.clientX-this.panStart.x);
        Cv.panY = this.panStart.py + (e.clientY-this.panStart.y);
        Cv.requestViewRender();
        return;
      }

      if (this.lasso && this.lasso.dragging) {
        var lpts = this.lasso.pts, lastP = lpts[lpts.length-1];
        if (Math.hypot(p.x-lastP[0], p.y-lastP[1]) >= 4) lpts.push([p.x, p.y]);
        Cv.requestViewRender();
        return;
      }

      if (this.floatRotateDrag) {
        var frd = this.floatRotateDrag, f0 = this.floating;
        var cx0 = f0.center.x+f0.ox, cy0 = f0.center.y+f0.oy;
        f0.rot = frd.baseRot + (Math.atan2(p.y-cy0, p.x-cx0) - frd.baseAngle);
        Cv.requestViewRender();
        return;
      }

      if (this.floatDrag) {
        var fd = this.floatDrag;
        this.floating.ox = fd.ox + (p.x-fd.sx);
        this.floating.oy = fd.oy + (p.y-fd.sy);
        Cv.requestRender();
        return;
      }

      if (this.windroseDrag) {
        App.windrose.x = this.windroseDrag.ox + (p.x-this.windroseDrag.sx);
        App.windrose.y = this.windroseDrag.oy + (p.y-this.windroseDrag.sy);
        Cv.requestRender();
        return;
      }

      if (this.scaleDrag) {
        App.scale.x = this.scaleDrag.ox + (p.x-this.scaleDrag.sx);
        App.scale.y = this.scaleDrag.oy + (p.y-this.scaleDrag.sy);
        Cv.requestRender();
        return;
      }

      if (this.handleDrag) {
        var hd = this.handleDrag, ho = hd.obj;
        if (!ho.handles) ho.handles = {};
        var hp = ho.pts[hd.index];
        var hdx = p.x - hp[0], hdy = p.y - hp[1];
        var hcur = ho.handles[hd.index] || Geo.autoHandle(ho.pts, hd.index, hd.closed);
        var hnext = { ix:hcur.ix, iy:hcur.iy, ox:hcur.ox, oy:hcur.oy };
        if (hd.dir === 'out') {
          hnext.ox = hdx; hnext.oy = hdy;
          if (!e.altKey) { hnext.ix = -hdx; hnext.iy = -hdy; }
        } else {
          hnext.ix = hdx; hnext.iy = hdy;
          if (!e.altKey) { hnext.ox = -hdx; hnext.oy = -hdy; }
        }
        ho.handles[hd.index] = hnext;
        Cv.requestRender();
        return;
      }

      if (this.resizeDrag) {
        var ro2 = this.resizeDrag.obj;
        var rot2 = (ro2.rot||0) * Math.PI/180;
        var dx2 = p.x-ro2.x, dy2 = p.y-ro2.y;
        /* imleci sembolün YEREL (döndürülmemiş) eksenine çevir, böylece
           döndürülmüş bir sembolde de köşe sürüklemesi doğru davranır */
        var lx = dx2*Math.cos(-rot2) - dy2*Math.sin(-rot2);
        var ly = dx2*Math.sin(-rot2) + dy2*Math.cos(-rot2);
        ro2.size = Math.max(8, Math.min(2000, Math.max(Math.abs(lx), Math.abs(ly))*2));
        Cv.requestRender();
        return;
      }

      if (App.tool === 'eyedrop' && Eyedropper.picking && this.eyeStartPos) {
        var ed = Math.hypot(p.x-this.eyeStartPos.x, p.y-this.eyeStartPos.y);
        App.eyedrop.radius = Math.max(8, ed);
        var el = $('eye-r'); if (el) el.value = Math.min(400, Math.round(ed));
        var vl = $('v-eye-r'); if (vl) vl.textContent = Math.min(400, Math.round(ed));
        Cv.requestViewRender();
        return;
      }

      if (this.painting) {
        var _prev = this.last;
        if (this.mode === 'eyedrop') this.eyedropStrokeTo(p);
        else this.strokeTo(p);
        /* yalnızca vuruşun dokunduğu dikdörtgeni yeniden beste — tüm
           haritayı yeniden kurmak yerine (bkz. Cv.ensureComposite) */
        Cv.requestRender(this._strokeRect(_prev, p));
        return;
      }

      if (this.mode === 'symbolBrush' && this.symBrushLast) {
        this.symbolBrushTo(p);
        Cv.requestRender();
        return;
      }

      if (this.rubberBand) {
        this.rubberBand.x1 = p.x; this.rubberBand.y1 = p.y;
        Cv.requestRender(); return;
      }

      if (this.dragging) {
        var dx = p.x-this.dragging.sx, dy = p.y-this.dragging.sy;
        /* multi drag */
        if (this.dragging.multi) {
          this.dragging.objs.forEach(function(item){ item.o.x=item.ox+dx; item.o.y=item.oy+dy; });
          Cv.requestRender(); return;
        }
        var o = this.dragging.obj;
        if (o.pts) {
          for (var i=0; i<o.pts.length; i++) {
            o.pts[i][0] = this.dragging.orig[i][0]+dx;
            o.pts[i][1] = this.dragging.orig[i][1]+dy;
          }
        } else if (o.kind === 'group' && this.dragging.groupOrig) {
          var go = this.dragging.groupOrig;
          for (var gi=0; gi<o.members.length; gi++) {
            o.members[gi].x = go[gi].x+dx;
            o.members[gi].y = go[gi].y+dy;
          }
        } else { o.x = this.dragging.ox+dx; o.y = this.dragging.oy+dy; }
        Cv.requestRender();
        return;
      }

      if (this.pathPts.length) { this.pathHover = p; Cv.requestRender(); return; }
      Cv.requestRender();
    },

    /* ================= POINTER UP ================= */
    onUp: function (e) {
      if (e && e.pointerType === 'touch') {
        delete this._touches[e.pointerId];
        if (this._pinch && Object.keys(this._touches).length < 2) this._pinch = null;
      }

      if (this.panning) { this.panning = false; Cv.view.classList.remove('panning'); return; }

      if (this.lasso && this.lasso.dragging) {
        this.lasso.dragging = false;
        var pts = this.lasso.pts;
        this.lasso = null;
        if (pts.length >= 3) this.liftSelection(pts);
        Cv.requestRender();
        return;
      }

      if (this.floatRotateDrag) { this.floatRotateDrag = null; return; }
      if (this.floatDrag) { this.floatDrag = null; return; }

      if (this.windroseDrag) {
        History.pushWindrose(this.windroseDrag.before, JSON.parse(JSON.stringify(App.windrose)), 'windrose:move');
        this.windroseDrag = null;
        UI.refreshHistory();
        return;
      }

      if (this.scaleDrag) {
        History.pushScale(this.scaleDrag.before, JSON.parse(JSON.stringify(App.scale)), 'scale:move');
        this.scaleDrag = null;
        UI.refreshHistory();
        return;
      }

      if (this.handleDrag) {
        var hd2 = this.handleDrag; this.handleDrag = null;
        var Lh2 = Layers.get(App.selection.layerId);
        History.pushVector(App.selection.layerId, hd2.before, JSON.parse(JSON.stringify(Lh2.objects)), 'handle');
        UI.refreshHistory();
        return;
      }

      if (this.resizeDrag) {
        var rd2 = this.resizeDrag; this.resizeDrag = null;
        var Lr2 = Layers.get('symbols');
        History.pushVector('symbols', rd2.before, JSON.parse(JSON.stringify(Lr2.objects)), 'resize');
        UI.refreshHistory();
        return;
      }

      if (App.tool === 'eyedrop' && Eyedropper.picking) {
        Eyedropper.picking = false;
        var ep = this.eyeStartPos;
        if (ep && App.eyedrop.radius > 8) {
          var s = Eyedropper.analyze(ep.x, ep.y, App.eyedrop.radius);
          if (s) {
            Eyedropper.sample = s;
            Eyedropper.active = true;
            App.eyedrop.hasSample = true;
            App.eyedrop.painting = false;
            UI.msg(UI.t('eyeOk') + ' r=' + Math.round(App.eyedrop.radius));
            UI.refreshEyedropPanel();
          } else UI.msg(UI.t('eyeFail'));
        }
        this.eyeStartPos = null;
        Cv.requestRender();
        return;
      }

      if (this.mode === 'symbolBrush') {
        this.endSymbolBrush();
        return;
      }

      if (this.painting) this.endRaster();

      if (this.rubberBand) {
        var rb = this.rubberBand; this.rubberBand = null;
        var rx0=Math.min(rb.x0,rb.x1), rx1=Math.max(rb.x0,rb.x1);
        var ry0=Math.min(rb.y0,rb.y1), ry1=Math.max(rb.y0,rb.y1);
        if (rx1-rx0 > 4 || ry1-ry0 > 4) {
          /* içindeki sembolleri ve etiketleri seç */
          var hits = []; var lobjs = [];
          ['symbols','labels'].forEach(function(lid){
            var LL = Layers.get(lid); if (!LL||!LL.visible) return;
            LL.objects.forEach(function(obj){
              var b = lid==='symbols' ? Sym.bounds(obj) : Cv.labelBounds(obj);
              var cx2 = b.x+b.w/2, cy2 = b.y+b.h/2;
              if (cx2>=rx0&&cx2<=rx1&&cy2>=ry0&&cy2<=ry1) {
                hits.push(obj.id); lobjs.push(obj);
              }
            });
          });
          if (hits.length === 1) {
            App.selection = { layerId:'symbols', id:hits[0] };
          } else if (hits.length > 1) {
            App.selection = { multi:true, layerId:'symbols', ids:hits, objs:lobjs };
          } else {
            App.selection = null;
          }
          UI.refreshSelection(); Cv.requestRender();
        }
        return;
      }

      if (this.dragging && this.dragging.multi) {
        var dm = this.dragging; this.dragging = null;
        var Lsym = Layers.get('symbols');
        History.pushVector('symbols', dm.before, JSON.parse(JSON.stringify(Lsym.objects)), 'multi:move');
        UI.refreshHistory(); return;
      }

      if (this.dragging) {
        var d = this.dragging;
        this.dragging = null;
        var layer = Layers.get(d.layerId);
        History.pushVector(d.layerId, d.before, JSON.parse(JSON.stringify(layer.objects)), 'move');
        UI.refreshHistory();
      }
    },

    /* ================= RASTER FIRÇALAR ================= */
    startRaster: function (layerId, p, mode) {
      var layer = Layers.get(layerId);
      if (!layer || layer.locked || !layer.visible) { UI.msg(UI.t('locked')); return; }

      this.painting = true;
      this.mode = mode;
      this.activeLayerId = layerId;
      this.last = p;
      this.box = { x0:p.x, y0:p.y, x1:p.x, y1:p.y };
      this._terrainDensityScale = 1; /* tek tıkla damga: tam yoğunluk */

      this.beforeMain = snap(layer.canvas);
      this.beforeAux = null;

      /* silgi arazi katmanını da siler → ikinci anlık görüntü */
      if (mode === 'erase') {
        var T = Layers.get('terrain');
        if (T && !T.locked) this.beforeAux = snap(T.canvas);
      }

      this.stamp(p.x, p.y);
    },

    strokeTo: function (p) {
      if (!this.last) { this.last = p; return; }
      var r = (this.mode === 'terrain' ? App.terrain.size :
                this.mode === 'elevation' ? App.elevation.brushSize :
                this.mode === 'sketch' ? App.sketch.size : App.brush.size)/2;
      var step = Math.max(1.5, r * 0.26);
      var dx = p.x-this.last.x, dy = p.y-this.last.y;
      var n = Math.max(1, Math.ceil(Math.hypot(dx,dy)/step));
      /* arazi fırçasında damgalar arası %74 çakışma var — her damganın
         mark kotasını bu çakışmaya göre küçült (bkz. Terrain.scatter). */
      if (this.mode === 'terrain') this._terrainDensityScale = Math.min(1, step / Math.max(1, r));
      for (var i=1; i<=n; i++) this.stamp(this.last.x+dx*i/n, this.last.y+dy*i/n);
      this.last = p;
    },

    stampTerrain: function (x, y) {
      var layer = Layers.get('terrain');
      if (!layer) return;
      var ctx = layer.ctx;
      var r = App.terrain.size/2;
      var Lm = Layers.get('landmass');
      if (Lm && Lm.canvas) {
        var pad2 = Math.ceil(r * 1.12) + 6;
        var bx2 = Math.max(0, Math.floor(x - pad2));
        var by2 = Math.max(0, Math.floor(y - pad2));
        var bw2 = Math.min(layer.canvas.width  - bx2, Math.ceil(pad2*2));
        var bh2 = Math.min(layer.canvas.height - by2, Math.ceil(pad2*2));
        var tmp2 = scratchCanvas('terrain', bw2, bh2);
        var tmpCtx2 = tmp2.getContext('2d');
        tmpCtx2.translate(-bx2, -by2);
        Terrain.scatter(tmpCtx2, App.terrain.type, x, y, r, App.terrain.opacity, this._terrainDensityScale);
        tmpCtx2.setTransform(1,0,0,1,0,0);
        tmpCtx2.globalCompositeOperation = 'destination-in';
        tmpCtx2.drawImage(Lm.canvas, bx2, by2, bw2, bh2, 0, 0, bw2, bh2);
        tmpCtx2.globalCompositeOperation = 'source-over';
        ctx.drawImage(tmp2, 0, 0, bw2, bh2, bx2, by2, bw2, bh2);
      } else {
        Terrain.scatter(ctx, App.terrain.type, x, y, r, App.terrain.opacity, this._terrainDensityScale);
      }
      this.expandBox(x, y, r + pad2);
    },

    /* Bir fırça hareketinin görsel olarak etkilediği dikdörtgen.
       Kara fırçası kıyı efektini, yükselti fırçası gölgelendirmeyi de
       değiştirir; bu efektler fırçanın biraz dışına taştığı için pay
       eklenir. Arazi fırçası hiçbir global önbelleği etkilemez. */
    _strokeRect: function (a, b) {
      if (!a) a = b;
      var r = (this.mode === 'terrain'   ? App.terrain.size :
               this.mode === 'elevation' ? App.elevation.brushSize :
               this.mode === 'eyedrop'   ? App.eyedrop.radius * 2 :
               this.mode === 'sketch'    ? App.sketch.size :
                                           App.brush.size) / 2;
      var pad = r + 8;
      if (this.mode === 'paint' || this.mode === 'erase') pad += (Cv.shoreWidth || 26) + 24;
      else if (this.mode === 'elevation') pad += 32;
      return {
        x0: Math.min(a.x, b.x) - pad, y0: Math.min(a.y, b.y) - pad,
        x1: Math.max(a.x, b.x) + pad, y1: Math.max(a.y, b.y) + pad
      };
    },

    expandBox: function (x, y, r) {
      var b = this.box; if (!b) return;
      b.x0 = Math.min(b.x0, x-r); b.y0 = Math.min(b.y0, y-r);
      b.x1 = Math.max(b.x1, x+r); b.y1 = Math.max(b.y1, y+r);
    },

    stamp: function (x, y) {
      var layer = Layers.get(this.activeLayerId);
      var ctx = layer.ctx;

      /* ---- İZ SÜRME MODU: referans görseldeki en yakın güçlü kenara (kıyı
         çizgisi) fırça noktasını kenetle — sadece kara/deniz fırçasında ---- */
      if ((this.mode === 'paint' || this.mode === 'erase') && App.reference && App.reference.traceMode) {
        var snapped = this.snapToRefEdge(x, y);
        x = snapped.x; y = snapped.y;
      }

      /* ---- ARAZİ: prosedürel serpme (tile yok) ---- */
      if (this.mode === 'terrain') {
        this.stampTerrain(x, y);
        return;
      }

      /* ---- YÜKSELTİ: yükselt/alçalt fırçası ----
         'lighten'/'darken' composite ile her darbe sadece o yöndeki
         piksel değerini iter — üst üste geçiş doğal bir yığılma
         (dağ/tepe) hissi verir, aşırı doygunluğa gitmez. */
      if (this.mode === 'elevation') {
        var er = App.elevation.brushSize/2;
        var lower = App.elevation.lower;
        var lvl = Math.round(128 + (lower ? -1 : 1) * App.elevation.strength * 127);
        ctx.save();
        ctx.globalCompositeOperation = lower ? 'darken' : 'lighten';
        var eg = ctx.createRadialGradient(x, y, 0, x, y, er);
        var col = 'rgb('+lvl+','+lvl+','+lvl+')';
        eg.addColorStop(0, col);
        eg.addColorStop(0.7, col);
        eg.addColorStop(1, 'rgba('+lvl+','+lvl+','+lvl+',0)');
        ctx.fillStyle = eg;
        ctx.beginPath(); ctx.arc(x, y, er, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        Cv.elevationDirty = true;
        this.expandBox(x, y, er + 4);
        return;
      }

      /* ---- ÇİZİM: kullanıcı katmanına serbest fırça ----
         Yumuşak kenarlı yuvarlak damga; sertlik damganın ne kadarının
         tam opak kaldığını belirler. Silgi modunda aynı damga
         'destination-out' ile uygulanır, böylece aynı fırça hem çizer
         hem siler. Hiçbir global önbelleği (kıyı/gölgelendirme)
         etkilemez — kullanıcı katmanı yalnız kendi başına çizilir. */
      if (this.mode === 'sketch') {
        var sr = App.sketch.size/2;
        var hard = Math.max(0, Math.min(1, App.sketch.hardness));
        ctx.save();
        ctx.globalAlpha = App.sketch.opacity;
        if (App.sketch.eraser) ctx.globalCompositeOperation = 'destination-out';
        if (hard > 0.985) {
          ctx.fillStyle = App.sketch.color;
        } else {
          var sg = ctx.createRadialGradient(x, y, sr*hard, x, y, sr);
          sg.addColorStop(0, App.sketch.color);
          sg.addColorStop(1, rgbaOf(App.sketch.color, 0));
          ctx.fillStyle = sg;
        }
        ctx.beginPath(); ctx.arc(x, y, sr, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        this.expandBox(x, y, sr + 2);
        return;
      }

      var rr = App.brush.size/2, rough = App.brush.roughness;

      /* ---- DENİZ (silgi): kara + arazi birlikte ---- */
      if (this.mode === 'erase') {
        var T = Layers.get('terrain');
        var targets = [ctx];
        if (T && !T.locked && this.beforeAux) targets.push(T.ctx);
        for (var t=0; t<targets.length; t++) {
          var c = targets[t];
          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.fillStyle = '#000';
          c.beginPath(); c.arc(x, y, rr*(1-rough*0.20), 0, Math.PI*2); c.fill();
          if (rough > 0.02) {
            var eb = 3+Math.round(rough*7);
            for (var k=0; k<eb; k++) {
              var ea = Math.random()*Math.PI*2;
              var ed = rr*(0.55+Math.random()*0.5)*(0.4+rough*0.9);
              var er = rr*(0.22+Math.random()*0.45)*(0.5+rough);
              c.beginPath();
              c.arc(x+Math.cos(ea)*ed, y+Math.sin(ea)*ed, er, 0, Math.PI*2);
              c.fill();
            }
          }
          c.restore();
        }
        Cv.shoreDirty = true;
        this.expandBox(x, y, rr*1.9+4);
        return;
      }

      /* ---- KARA ---- */
      ctx.save();
      ctx.fillStyle = App.brush.color;
      ctx.beginPath(); ctx.arc(x, y, rr*(1-rough*0.22), 0, Math.PI*2); ctx.fill();
      if (rough > 0.02) {
        var blobs = 3+Math.round(rough*7);
        for (var b2=0; b2<blobs; b2++) {
          var a = Math.random()*Math.PI*2;
          var d = rr*(0.55+Math.random()*0.5)*(0.4+rough*0.9);
          var br = rr*(0.22+Math.random()*0.45)*(0.5+rough);
          ctx.beginPath();
          ctx.arc(x+Math.cos(a)*d, y+Math.sin(a)*d, br, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.restore();
      Cv.shoreDirty = true;
      this.expandBox(x, y, rr*1.9+4);
    },

    endRaster: function () {
      this.painting = false;
      var b = this.box;
      if (!b) { this.last = null; return; }

      var pad = 6;
      var box = {
        x: Math.max(0, b.x0-pad), y: Math.max(0, b.y0-pad),
        w: Math.min(Cv.W, b.x1+pad) - Math.max(0, b.x0-pad),
        h: Math.min(Cv.H, b.y1+pad) - Math.max(0, b.y0-pad)
      };

      var layer = Layers.get(this.activeLayerId);

      if (this.mode === 'terrain') this.maskToLand(box);

      if (this.mode === 'erase' && this.beforeAux) {
        var T = Layers.get('terrain');
        History.pushRasterMulti([
          { layerId:'landmass', beforeCanvas:this.beforeMain, afterCanvas:layer.canvas },
          { layerId:'terrain',  beforeCanvas:this.beforeAux,  afterCanvas:T.canvas }
        ], box, 'erase');
      } else {
        History.pushRaster(this.activeLayerId, this.beforeMain, layer.canvas, box,
          this.mode === 'terrain' ? 'terrain:'+App.terrain.type
          : this.mode === 'eyedrop' ? 'sample-paint' : this.mode);
      }

      this.box = null; this.last = null;
      this.beforeMain = null; this.beforeAux = null;
      /* Kıyıyı yalnızca kara sınırını gerçekten değiştiren darbeler
         geçersizleştirir; arazi/yükselti/çizim darbeleri kıyıyı
         etkilemez ve boşuna yeniden inşa ettirmemeli. */
      if (this.mode !== 'terrain' && this.mode !== 'elevation' && this.mode !== 'sketch') {
        Cv.shoreDirty = true;
      }
      UI.refreshHistory();
      Cv.requestRender();
    },

    maskToLand: function (box) {
      var T = Layers.get('terrain'), L = Layers.get('landmass');
      var w = Math.max(1, Math.ceil(box.w)), h = Math.max(1, Math.ceil(box.h));
      var x = Math.floor(box.x), y = Math.floor(box.y);
      var t = document.createElement('canvas'); t.width = w; t.height = h;
      var tx = t.getContext('2d');
      tx.drawImage(T.canvas, x, y, w, h, 0, 0, w, h);
      tx.globalCompositeOperation = 'destination-in';
      tx.drawImage(L.canvas, x, y, w, h, 0, 0, w, h);
      T.ctx.clearRect(x, y, w, h);
      T.ctx.drawImage(t, x, y);
    },

    /* ---- örnekleyici boyama ---- */
    startEyedropPaint: function (p) {
      var lid = App.eyedrop.targetLayer || 'terrain';
      var layer = Layers.get(lid);
      if (!layer || layer.locked || !layer.visible) { UI.msg(UI.t('locked')); return; }
      this.painting = true;
      this.mode = 'eyedrop';
      this.activeLayerId = lid;
      this.last = p;
      this.box = { x0:p.x, y0:p.y, x1:p.x, y1:p.y };
      this.beforeMain = snap(layer.canvas);
      this.beforeAux = null;
      this.eyedropStamp(p.x, p.y);
    },

    eyedropStamp: function (x, y) {
      var layer = Layers.get(this.activeLayerId);
      if (!layer) return;
      var r = App.eyedrop.brushRadius || 80;

      /* Landmass maskesine clip et: önce geçici canvas'a çiz, sonra
         destination-in ile landmass alpha'sını uygula, ardından hedef
         katmana aktar. Böylece kara dışına taşmaz.               */
      var L = Layers.get('landmass');
      if (L && L.canvas && this.activeLayerId !== 'landmass') {
        /* Sadece fırça bbox'ı kadar geçici canvas — kara dışına taşmayı engelle */
        var epad = Math.ceil(r) + 4;
        var ebx = Math.max(0, Math.floor(x - epad));
        var eby = Math.max(0, Math.floor(y - epad));
        var ebw = Math.min(layer.canvas.width  - ebx, Math.ceil(epad*2));
        var ebh = Math.min(layer.canvas.height - eby, Math.ceil(epad*2));
        var tmp = scratchCanvas('eyedrop', ebw, ebh);
        var tmpCtx = tmp.getContext('2d');
        tmpCtx.translate(-ebx, -eby);
        Eyedropper.paint(tmpCtx, x, y, r);
        tmpCtx.setTransform(1,0,0,1,0,0);
        tmpCtx.globalCompositeOperation = 'destination-in';
        tmpCtx.drawImage(L.canvas, ebx, eby, ebw, ebh, 0, 0, ebw, ebh);
        tmpCtx.globalCompositeOperation = 'source-over';
        layer.ctx.drawImage(tmp, 0, 0, ebw, ebh, ebx, eby, ebw, ebh);
      } else {
        Eyedropper.paint(layer.ctx, x, y, r);
      }

      if (this.activeLayerId === 'landmass') Cv.shoreDirty = true;
      this.expandBox(x, y, r+3);
    },

    eyedropStrokeTo: function (p) {
      if (!this.last) { this.last = p; return; }
      var r = App.eyedrop.brushRadius || 80;
      var step = Math.max(2, r*0.30);
      var dx = p.x-this.last.x, dy = p.y-this.last.y;
      var n = Math.max(1, Math.ceil(Math.hypot(dx,dy)/step));
      for (var i=1; i<=n; i++) this.eyedropStamp(this.last.x+dx*i/n, this.last.y+dy*i/n);
      this.last = p;
    },

    /* ---- iz sürme modu: referans görselin gri tonlama önbelleği + kenar arama ---- */
    _refTraceCache: null,
    _buildRefTrace: function () {
      var L = Layers.get('reference');
      if (!L || !L.image) { this._refTraceCache = null; return null; }
      var w = Cv.W, h = Cv.H;
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var cx = c.getContext('2d', { willReadFrequently:true });
      cx.drawImage(L.image, 0, 0, w, h);
      var d = cx.getImageData(0, 0, w, h).data;
      var lum = new Float32Array(w*h);
      for (var i = 0, p = 0; i < d.length; i += 4, p++) lum[p] = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
      this._refTraceCache = { lum:lum, w:w, h:h, image:L.image };
      return this._refTraceCache;
    },

    snapToRefEdge: function (x, y) {
      var cache = this._refTraceCache;
      if (!cache || cache.image !== (Layers.get('reference')||{}).image) cache = this._buildRefTrace();
      if (!cache) return { x:x, y:y };
      var w = cache.w, h = cache.h, lum = cache.lum;
      var radius = 18, step = 2, best = null, bestScore = 14; /* eşik altı kenar sayılmaz */
      var cx0 = Math.round(x), cy0 = Math.round(y);
      for (var dy = -radius; dy <= radius; dy += step) {
        var yy = cy0 + dy;
        if (yy < 1 || yy >= h-1) continue;
        for (var dx = -radius; dx <= radius; dx += step) {
          var xx = cx0 + dx;
          if (xx < 1 || xx >= w-1) continue;
          var idx = yy*w + xx;
          var gx = lum[idx+1] - lum[idx-1];
          var gy = lum[idx+w] - lum[idx-w];
          var score = Math.abs(gx) + Math.abs(gy) - Math.hypot(dx, dy)*0.6; /* uzaklık cezası */
          if (score > bestScore) { bestScore = score; best = { x:xx, y:yy }; }
        }
      }
      return best || { x:x, y:y };
    },

    /* ================= RASTER LASSO SEÇİMİ (kaldır / taşı / döndür) =================
       Kara + Arazi + Yükselti katmanlarını aynı coğrafi bölge için birlikte ele alır:
       serbest-el lasso ile kapalı bir alan çizilir → o alandaki pikseller üç katmandan
       da "kaldırılıp" (floating selection) kaynakta boşluk bırakılır → sürükleyerek
       taşınır / tutamaçla döndürülür (henüz gerçek katmana yazılmaz, yalnızca önizleme)
       → Enter/başka araca geçiş ile TEK bir History.pushRasterMulti adımında gerçek
       katmanlara "yapıştırılır", ya da Escape ile iptal edilip eski hâline dönülür. */
    onLassoDown: function (p) {
      if (this.floating) {
        var f = this.floating, cx = f.center.x+f.ox, cy = f.center.y+f.oy;
        var handleDist = f.bbox.h/2 + 30;
        var hx = cx + Math.sin(f.rot)*handleDist, hy = cy - Math.cos(f.rot)*handleDist;
        if (Math.hypot(p.x-hx, p.y-hy) <= 10) {
          this.floatRotateDrag = { baseRot:f.rot, baseAngle:Math.atan2(p.y-cy, p.x-cx) };
          return;
        }
        var dx = p.x-cx, dy = p.y-cy;
        var localX = dx*Math.cos(f.rot) + dy*Math.sin(f.rot);
        var localY = -dx*Math.sin(f.rot) + dy*Math.cos(f.rot);
        if (Math.abs(localX) <= f.bbox.w/2 && Math.abs(localY) <= f.bbox.h/2) {
          this.floatDrag = { sx:p.x, sy:p.y, ox:f.ox, oy:f.oy };
          return;
        }
        this.commitFloating();
        return;
      }
      this.lasso = { pts:[[p.x,p.y]], dragging:true };
    },

    liftSelection: function (pts) {
      var xs = pts.map(function(pt){return pt[0];}), ys = pts.map(function(pt){return pt[1];});
      var pad = 4;
      var bx = Math.max(0, Math.floor(Math.min.apply(null,xs)-pad));
      var by = Math.max(0, Math.floor(Math.min.apply(null,ys)-pad));
      var bx1 = Math.min(Cv.W, Math.ceil(Math.max.apply(null,xs)+pad));
      var by1 = Math.min(Cv.H, Math.ceil(Math.max.apply(null,ys)+pad));
      var bw = bx1-bx, bh = by1-by;
      if (bw <= 2 || bh <= 2) return;

      var maskC = document.createElement('canvas'); maskC.width = bw; maskC.height = bh;
      var mctx = maskC.getContext('2d');
      mctx.translate(-bx, -by);
      mctx.fillStyle = '#fff';
      mctx.beginPath();
      mctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) mctx.lineTo(pts[i][0], pts[i][1]);
      mctx.closePath();
      mctx.fill();

      var before = {}, floatingLayers = {};
      this.LASSO_LAYERS.forEach(function (lid) {
        var L = Layers.get(lid);
        if (!L || L.locked || !L.visible) return;
        before[lid] = snap(L.canvas);

        var patch = document.createElement('canvas'); patch.width = bw; patch.height = bh;
        var pctx = patch.getContext('2d');
        pctx.drawImage(L.canvas, bx, by, bw, bh, 0, 0, bw, bh);
        pctx.globalCompositeOperation = 'destination-in';
        pctx.drawImage(maskC, 0, 0);
        floatingLayers[lid] = patch;

        L.ctx.save();
        L.ctx.globalCompositeOperation = 'destination-out';
        L.ctx.drawImage(maskC, bx, by);
        L.ctx.restore();
      });

      /* kement alanına düşen nokta-tabanlı vektör nesneleri (semboller,
         kaynaklar, etiketler, bağlantılar) de rasterle birlikte kaldırılır —
         böylece üstlerinde duran nesneler yerinde kalmaz, hep beraber taşınır. */
      var vectorBefore = {}, vectorItems = {};
      this.LASSO_VECTOR_LAYERS.forEach(function (lid) {
        var L = Layers.get(lid);
        if (!L || L.locked || !L.visible || !L.objects) return;
        var kept = [], lifted = [];
        L.objects.forEach(function (o) {
          if (lid === 'labels' && o.pathPts) { kept.push(o); return; } /* yol üstü etiket taşınmaz */
          var cx, cy;
          if (lid === 'symbols' && o.kind === 'group') {
            var gb = Sym.bounds(o); cx = gb.x + gb.w/2; cy = gb.y + gb.h/2;
          } else { cx = o.x; cy = o.y; }
          if (cx === undefined || cy === undefined) { kept.push(o); return; }
          if (Cv._pointInPoly(cx, cy, pts)) lifted.push(o); else kept.push(o);
        });
        if (lifted.length) {
          vectorBefore[lid] = JSON.parse(JSON.stringify(L.objects));
          L.objects = kept;
          vectorItems[lid] = lifted;
        }
      });

      if (!Object.keys(floatingLayers).length && !Object.keys(vectorItems).length) return;

      this.floating = {
        bbox: { x:bx, y:by, w:bw, h:bh },
        before: before, layers: floatingLayers,
        vectorBefore: vectorBefore, vectorItems: vectorItems,
        ox: 0, oy: 0, rot: 0,
        center: { x: bx+bw/2, y: by+bh/2 }
      };
      Cv.shoreDirty = true; Cv.elevationDirty = true;
      Cv.requestRender();
    },

    commitFloating: function () {
      var f = this.floating;
      if (!f) return;
      var cx = f.center.x+f.ox, cy = f.center.y+f.oy;
      var hw = f.bbox.w/2, hh = f.bbox.h/2;
      var corners = [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(function (c) {
        var rx = c[0]*Math.cos(f.rot) - c[1]*Math.sin(f.rot);
        var ry = c[0]*Math.sin(f.rot) + c[1]*Math.cos(f.rot);
        return [cx+rx, cy+ry];
      });
      var nx0 = Math.min.apply(null, corners.map(function(c){return c[0];}));
      var nx1 = Math.max.apply(null, corners.map(function(c){return c[0];}));
      var ny0 = Math.min.apply(null, corners.map(function(c){return c[1];}));
      var ny1 = Math.max.apply(null, corners.map(function(c){return c[1];}));
      var unionX0 = Math.min(f.bbox.x, nx0), unionY0 = Math.min(f.bbox.y, ny0);
      var unionX1 = Math.max(f.bbox.x+f.bbox.w, nx1), unionY1 = Math.max(f.bbox.y+f.bbox.h, ny1);

      var patches = [];
      Object.keys(f.layers).forEach(function (lid) {
        var L = Layers.get(lid);
        L.ctx.save();
        L.ctx.translate(cx, cy);
        L.ctx.rotate(f.rot);
        L.ctx.drawImage(f.layers[lid], -hw, -hh);
        L.ctx.restore();
        patches.push({ layerId:lid, beforeCanvas:f.before[lid], afterCanvas:snap(L.canvas) });
      });

      /* kaldırılmış vektör nesnelerini (semboller/kaynaklar/etiketler/
         bağlantılar) yeni konum + dönüşle katmanlarına geri yaz */
      var cosR = Math.cos(f.rot), sinR = Math.sin(f.rot);
      var vectorParts = [];
      Object.keys(f.vectorItems || {}).forEach(function (lid) {
        var L = Layers.get(lid);
        function xform(pt) {
          var dx0 = pt.x - f.center.x, dy0 = pt.y - f.center.y;
          pt.x = cx + dx0*cosR - dy0*sinR;
          pt.y = cy + dx0*sinR + dy0*cosR;
          if (typeof pt.rot === 'number') pt.rot += f.rot * 180 / Math.PI;
        }
        f.vectorItems[lid].forEach(function (o) {
          if (o.kind === 'group' && o.members) o.members.forEach(xform);
          else xform(o);
          L.objects.push(o);
        });
        vectorParts.push({ layerId: lid, before: f.vectorBefore[lid], after: JSON.parse(JSON.stringify(L.objects)) });
      });

      var box = { x:Math.max(0,Math.floor(unionX0)), y:Math.max(0,Math.floor(unionY0)),
                  w:Math.ceil(unionX1-unionX0), h:Math.ceil(unionY1-unionY0) };
      if (vectorParts.length) History.pushCombo(patches, box, vectorParts, 'lasso:move');
      else History.pushRasterMulti(patches, box, 'lasso:move');
      this.floating = null; this.floatDrag = null; this.floatRotateDrag = null;
      Cv.shoreDirty = true; Cv.elevationDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    cancelFloating: function () {
      var f = this.floating;
      if (!f) return;
      Object.keys(f.before).forEach(function (lid) {
        var L = Layers.get(lid);
        L.ctx.clearRect(0, 0, L.canvas.width, L.canvas.height);
        L.ctx.drawImage(f.before[lid], 0, 0);
      });
      Object.keys(f.vectorBefore || {}).forEach(function (lid) {
        var L = Layers.get(lid);
        if (L) L.objects = JSON.parse(JSON.stringify(f.vectorBefore[lid]));
      });
      this.floating = null; this.floatDrag = null; this.floatRotateDrag = null;
      Cv.shoreDirty = true; Cv.elevationDirty = true;
      Cv.requestRender();
    },

    /* Escape gibi geri yükleme yapmaz — seçili alanı katmandan kalıcı olarak siler */
    deleteFloating: function () {
      var f = this.floating;
      if (!f) return;
      var patches = [];
      Object.keys(f.before).forEach(function (lid) {
        var L = Layers.get(lid);
        patches.push({ layerId:lid, beforeCanvas:f.before[lid], afterCanvas:snap(L.canvas) });
      });
      var vectorParts = [];
      Object.keys(f.vectorBefore || {}).forEach(function (lid) {
        var L = Layers.get(lid);
        vectorParts.push({ layerId:lid, before:f.vectorBefore[lid], after: JSON.parse(JSON.stringify(L.objects)) });
      });
      if (vectorParts.length) History.pushCombo(patches, f.bbox, vectorParts, 'lasso:delete');
      else History.pushRasterMulti(patches, f.bbox, 'lasso:delete');
      this.floating = null; this.floatDrag = null; this.floatRotateDrag = null;
      Cv.shoreDirty = true; Cv.elevationDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ---- kova doldurma: kapalı bir kara/deniz sınırının içini tek tıkla doldurur ----
       Fırça ile çizilmiş kapalı bir çevrimin (ring) içi hâlâ deniz (şeffaf) kalır;
       bu araç o boşluğu kara rengiyle doldurur (ya da tersi: kara bölgeyi silmek
       için deniz üstüne tıklanır — tıklanan pikselin kara/deniz durumuyla aynı
       bitişik alanı doldurur). Span tabanlı scanline flood fill, tam çözünürlükte. */
    floodFill: function (x, y) {
      var L = Layers.get('landmass');
      if (L.locked) { UI.msg(UI.t('locked')); return; }
      var w = L.canvas.width, h = L.canvas.height;
      var sx = Math.round(x), sy = Math.round(y);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;

      var ctx = L.ctx;
      var id = ctx.getImageData(0, 0, w, h), d = id.data;
      var startIdx = (sy*w+sx)*4;
      var startIsLand = d[startIdx+3] > 128;
      var col = hexToRgb(App.brush.color);
      var visited = new Uint8Array(w*h);
      var maxPixels = Math.round(w*h*0.7); /* kazayla tüm denizi doldurmayı engelle */

      function isTarget(px, py) {
        var i4 = (py*w+px)*4;
        return (d[i4+3] > 128) === startIsLand;
      }

      var stack = [sy], stackX = [sx];
      var minX=sx, maxX=sx, minY=sy, maxY=sy, filled = 0, aborted = false;
      while (stackX.length) {
        var px = stackX.pop(), py = stack.pop();
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        var vidx = py*w+px;
        if (visited[vidx] || !isTarget(px, py)) continue;

        var xl = px;
        while (xl > 0 && !visited[py*w+(xl-1)] && isTarget(xl-1, py)) xl--;
        var xr = px;
        while (xr < w-1 && !visited[py*w+(xr+1)] && isTarget(xr+1, py)) xr++;

        for (var xx = xl; xx <= xr; xx++) {
          var vi = py*w+xx;
          if (visited[vi]) continue;
          visited[vi] = 1;
          var i4 = vi*4;
          d[i4]=col.r; d[i4+1]=col.g; d[i4+2]=col.b; d[i4+3]=255;
          filled++;
        }
        if (filled > maxPixels) { aborted = true; break; }
        minX=Math.min(minX,xl); maxX=Math.max(maxX,xr); minY=Math.min(minY,py); maxY=Math.max(maxY,py);

        for (var xx2 = xl; xx2 <= xr; xx2++) {
          if (py>0)   { stack.push(py-1); stackX.push(xx2); }
          if (py<h-1) { stack.push(py+1); stackX.push(xx2); }
        }
      }

      if (aborted) { UI.msg(UI.t('fill_toolarge')); return; }
      if (!filled) return;

      var before = snap(L.canvas);
      ctx.putImageData(id, 0, 0);
      History.pushRaster('landmass', before, L.canvas,
        { x:minX, y:minY, w:maxX-minX+1, h:maxY-minY+1 }, 'fill');
      Cv.shoreDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ---- kıyı yumuşatma ---- */
    smoothCoast: function (strength) {
      var L = Layers.get('landmass');
      if (L.locked) { UI.msg(UI.t('locked')); return; }
      var w = L.canvas.width, h = L.canvas.height;
      var before = snap(L.canvas);

      var t = document.createElement('canvas'); t.width = w; t.height = h;
      var tx = t.getContext('2d', { willReadFrequently:true });
      tx.filter = 'blur('+(strength||6)+'px)';
      tx.drawImage(L.canvas, 0, 0);
      tx.filter = 'none';

      /* Blur sonrası sadece alpha threshold uygula — RGB renklere dokunma.
         Böylece farklı renklerdeki kara bölgeleri kendi renklerini korur. */
      var id = tx.getImageData(0, 0, w, h), d = id.data;
      for (var i=0; i<d.length; i+=4) {
        d[i+3] = d[i+3] > 128 ? 255 : 0;
      }
      tx.putImageData(id, 0, 0);

      /* Orijinal renkleri koru: blur şeklini maske olarak kullan,
         üstüne orijinal kara canvas'ını çiz (source-in). */
      tx.globalCompositeOperation = 'source-in';
      tx.drawImage(before, 0, 0);
      tx.globalCompositeOperation = 'source-over';

      L.ctx.clearRect(0, 0, w, h);
      L.ctx.drawImage(t, 0, 0);

      History.pushRaster('landmass', before, L.canvas, {x:0,y:0,w:w,h:h}, 'smooth');
      Cv.shoreDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ---- prosedürel kara üreteci: tohumlu değer-gürültüsü (value noise) tabanlı fBm,
       harici kütüphane yok. Küçük bir gridde hesaplanıp büyük tuvale ölçeklenir —
       bilinear yukarı-örnekleme zaten organik, dalgalı bir kıyı çizgisi verir. ---- */
    _noiseGrid: function (seed) {
      var perm = new Array(256);
      for (var i = 0; i < 256; i++) perm[i] = i;
      var rnd = seed >>> 0;
      function next() { rnd = (rnd*1664525 + 1013904223) >>> 0; return rnd / 4294967296; }
      for (var j = 255; j > 0; j--) {
        var k = Math.floor(next()*(j+1));
        var tmp = perm[j]; perm[j] = perm[k]; perm[k] = tmp;
      }
      var grad = [];
      for (var g = 0; g < 256; g++) { var a = next()*Math.PI*2; grad.push([Math.cos(a), Math.sin(a)]); }
      function fade(t) { return t*t*t*(t*(t*6-15)+10); }
      function lerp(a,b,t) { return a+(b-a)*t; }
      function gradAt(ix, iy) { return grad[perm[(ix & 255) ^ perm[iy & 255]] & 255]; }
      function dot(g, x, y) { return g[0]*x + g[1]*y; }
      function perlin(x, y) {
        var x0 = Math.floor(x), y0 = Math.floor(y), x1 = x0+1, y1 = y0+1;
        var sx = fade(x-x0), sy = fade(y-y0);
        var n00 = dot(gradAt(x0,y0), x-x0, y-y0);
        var n10 = dot(gradAt(x1,y0), x-x1, y-y0);
        var n01 = dot(gradAt(x0,y1), x-x0, y-y1);
        var n11 = dot(gradAt(x1,y1), x-x1, y-y1);
        return lerp(lerp(n00,n10,sx), lerp(n01,n11,sx), sy);
      }
      return {
        fbm: function (x, y, octaves, persistence) {
          var total = 0, amp = 1, freq = 1, maxAmp = 0;
          for (var o = 0; o < octaves; o++) {
            total += perlin(x*freq, y*freq) * amp;
            maxAmp += amp;
            amp *= persistence; freq *= 2;
          }
          return total / maxAmp;
        },
        next: next
      };
    },

    generateLandmass: function (template, roughness, seed, opts) {
      opts = opts || {};
      var L = Layers.get('landmass');
      if (L.locked) { UI.msg(UI.t('locked')); return; }
      var w = L.canvas.width, h = L.canvas.height;
      var before = snap(L.canvas);

      var N = 220; /* düşük çözünürlüklü gürültü gridi */
      var noise = this._noiseGrid(seed >>> 0);
      var octaves = 3 + Math.round(roughness*3);      /* 3..6 */
      var freq = 2.2 + roughness*4;                    /* pürüzlülük arttıkça daha sık desen */

      /* ---- kaynak noktaları (tohum) — şablona göre değişen sayıda ----
         Bunlar analitik bir daireye "falloff" ile değil, aşağıdaki
         blobFill() ile ızgara üzerinde rastgele bir su baskını (flood-fill)
         gibi yayılıyor; bu, Azgaar's Fantasy Map Generator'ın "en basit ve
         en iyi sonuç veren" yükselti algoritmasıyla aynı fikir: komşu
         hücrelere geçişte küçük rastgele bir çürüme (decay) uygulamak,
         analitik dairelerin asla üretemeyeceği koy/yarımada/parmak gibi
         gerçekçi, düzensiz kıyı biçimleri doğurur.

         "boost" parametresi, aşağıdaki kapsama-garantisi döngüsünün
         (coverage retry) her denemede tohum yarıçaplarını/sayısını
         büyütmesini sağlar — sonuç istenen minimum kara oranına ulaşana
         kadar. Takımada'da boost SADECE ada başına yarıçapı ve küme
         sayısını büyütür, aralarındaki minimum boşluğu KORUR — böylece
         büyüdükçe adalar birbirine kaynaşıp tek kıtaya dönüşmez. */
      function buildSeeds(boost) {
        var seeds = [];
        if (template === 'island') {
          /* Tek, büyükçe bir ada: baskın bir gövde + gövdeye örtüşen birkaç
             lob (düzensiz kıyı için) + bazen ayrı küçük bir uydu adacık. */
          var cx = 0.5 + (noise.next() - 0.5) * 0.16;
          var cy = 0.5 + (noise.next() - 0.5) * 0.16;
          /* Taban yarıçap kasıtlı olarak mütevazı tutulur — kapsama garantisi
             döngüsü zaten gerektiğinde boost ile büyütecek; büyük bir taban +
             cömert loblar birleşince (özellikle yüksek pürüzlülükte) ada
             kolayca tuvalin tamamına yakınını kaplayıp "kıta" gibi
             görünüyordu. */
          var mainR = (0.15 + noise.next() * 0.06) * Math.min(2.1, boost);
          seeds.push({ x:cx, y:cy, r:mainR, h:1.0 });
          var lobes = 2 + Math.floor(noise.next() * 2); /* 2..3 */
          for (var li = 0; li < lobes; li++) {
            var lAng = noise.next() * Math.PI * 2;
            var lDist = mainR * (0.30 + noise.next() * 0.30);
            seeds.push({
              x: cx + Math.cos(lAng) * lDist, y: cy + Math.sin(lAng) * lDist,
              r: mainR * (0.30 + noise.next() * 0.30),
              h: 0.65 + noise.next() * 0.3
            });
          }
          if (noise.next() < 0.5) {
            var sAng = noise.next() * Math.PI * 2;
            var sDist = mainR * (1.5 + noise.next() * 0.8);
            seeds.push({
              x: cx + Math.cos(sAng) * sDist, y: cy + Math.sin(sAng) * sDist,
              r: mainR * (0.15 + noise.next() * 0.15),
              h: 0.5 + noise.next() * 0.25
            });
          }
        } else if (template === 'archipelago') {
          /* Ayrı ayrı ada kümeleri: her küme kendi merkezinde, önceki
             kümelerin en az (yarıçaplar toplamı × ayırma-katsayısı) kadar
             uzağına reddet-örnekle (rejection sampling) yerleştirilir —
             adalar tek bir büyük kara parçasında birleşmez. Yarıçap
             büyümesi kasıtlı olarak DAR bir aralıkta sınırlı (en fazla
             ~1.7×) — aksi hâlde tek bir ada continent kadar büyüyüp
             "takımada" yerine "küçük kıta + birkaç adacık" gibi
             görünüyordu. Kapsam artışı bunun yerine daha çok ada sayısından
             (clusterCount) gelir. */
          var clusterCount = 5 + Math.floor(noise.next() * 4);
          var placed = [];
          /* SEP*(yarıçaplar toplamı) her aday merkezinin çevresindeki
             "yasak disk"i belirler — SEP çok büyükse (ör. 2+) altı-sekiz
             adayı 0.8×0.8'lik kutuya sığdırmak matematiksel olarak
             imkânsız hâle gelir (yasak diskler kutudan büyür) ve neredeyse
             hiçbir aday yerleşemez. 1.6 gerçekçi bir alt sınır: adalar
             belirgin biçimde ayrı kalır ama paketleme genelde başarılı olur.
             Yine de kötü şanslı bir tohumda tüm denemeler tükenirse, adayı
             tamamen atmak yerine son denenen konuma YERLEŞTİRİRİZ — yumuşak
             bir kısıt, adaların "yakın ama yine de ayrı" kalmasını sağlar. */
          var SEP = 1.6;
          for (var ci = 0; ci < clusterCount; ci++) {
            var ccx, ccy, cr, tries = 0, ok = false;
            do {
              ccx = 0.10 + noise.next() * 0.80;
              ccy = 0.10 + noise.next() * 0.80;
              cr = (0.095 + noise.next() * 0.075) * Math.min(1.7, boost);
              ok = placed.every(function (p) {
                return Math.hypot(ccx - p.x, ccy - p.y) >= (cr + p.r) * SEP;
              });
              tries++;
            } while (!ok && tries < 40);
            placed.push({ x:ccx, y:ccy, r:cr });
            seeds.push({ x:ccx, y:ccy, r:cr, h: 0.8 + noise.next() * 0.2 });
            if (noise.next() < 0.7) {
              var isAng = noise.next() * Math.PI * 2;
              var isDist = cr * (1.7 + noise.next() * 1.1);
              seeds.push({
                x: ccx + Math.cos(isAng) * isDist, y: ccy + Math.sin(isAng) * isDist,
                r: cr * (0.25 + noise.next() * 0.25),
                h: 0.55 + noise.next() * 0.3
              });
            }
          }
        } else { /* continent */
          var cbCount = 4 + Math.floor(noise.next() * 4);  /* 4..7 */
          var cCX = 0.5 + (noise.next() - 0.5) * 0.18, cCY = 0.5 + (noise.next() - 0.5) * 0.12;
          for (var cbi = 0; cbi < cbCount; cbi++) {
            seeds.push({
              x: cCX + (noise.next() - 0.5) * 0.42,
              y: cCY + (noise.next() - 0.5) * 0.32,
              r: (0.16 + noise.next() * 0.20) * Math.min(1.7, boost),
              h: cbi === 0 ? 1.0 : 0.6 + noise.next() * 0.3
            });
          }
        }
        return seeds;
      }

      /* Çok kaynaklı, rastgele-çürümeli taşkın doldurma: her tohumdan
         8-komşulukla yayılır, her adımda hedef yarıçapına göre hesaplanan
         çürüme oranına küçük bir jitter eklenir. Bir hücrenin yüksekliği
         yalnızca daha önce ulaşılandan yüksekse güncellenir (gevşetme),
         böylece örtüşen tohumlar doğal biçimde birleşir. */
      function blobFill(N, seedList, roughness, rng) {
        var hgt = new Float32Array(N * N);
        var dec = new Float32Array(N * N);
        var queue = [];
        var jitter = 0.05 + roughness * 0.09;
        seedList.forEach(function (s) {
          var gx = Math.max(0, Math.min(N-1, Math.round(s.x * N)));
          var gy = Math.max(0, Math.min(N-1, Math.round(s.y * N)));
          var rCells = Math.max(2, s.r * N);
          var seedDecay = Math.pow(0.02 / s.h, 1 / rCells); /* h * decay^rCells ≈ 0.02 */
          var idx = gy * N + gx;
          if (s.h > hgt[idx]) { hgt[idx] = s.h; dec[idx] = seedDecay; queue.push(idx); }
        });
        var qi = 0;
        while (qi < queue.length) {
          var cur = queue[qi++];
          var cx = cur % N, cy = (cur / N) | 0;
          var curH = hgt[cur], curD = dec[cur];
          if (curH <= 0.02) continue;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              var nx2 = cx + dx, ny2 = cy + dy;
              if (nx2 < 0 || nx2 >= N || ny2 < 0 || ny2 >= N) continue;
              var nidx = ny2 * N + nx2;
              var effDecay = Math.max(0.5, Math.min(0.995, curD * (1 + (rng.next()-0.5) * jitter)));
              var nh = curH * effDecay;
              if (nh > hgt[nidx] + 0.001) {
                hgt[nidx] = nh; dec[nidx] = curD;
                queue.push(nidx);
              }
            }
          }
        }
        return hgt;
      }

      /* ---- kapsama garantisi ----
         Kullanıcı beklentisi: Kıta tuvalin en az %40'ını, Ada/Takımada en
         az %20'sini kaplamalı. Ucuz N×N ızgara üzerinde tahmini kapsamı
         ölçüp yetersizse tohumları büyüterek yeniden dener (aynı `noise`
         nesnesi kullanıldığından hâlâ tohuma göre tam deterministik). */
      var TARGET_COVERAGE = { continent:0.40, island:0.20, archipelago:0.20 };
      var target = TARGET_COVERAGE[template] || 0;
      var heightGrid, small, sctx, img;
      var bestCoverage = -1, bestHeightGrid = null, bestImg = null;
      var boost = 1;

      /* Bu "temel" fBm dokusu tohuma/frekansa bağlıdır ama boost'a (yani
         hangi deneme olduğuna) bağlı DEĞİLDİR — retry döngüsü öncesinde
         BİR KEZ hesaplayıp önbelleğe alıyoruz. Öncesinde her deneme aynı
         220×220 gridi (5 oktavlı Perlin toplamı ~48 bin hücre) yeniden
         hesaplıyordu; kapsama hedefine ulaşmak 4-6 deneme sürdüğünde bu,
         mobilde saniyeler süren gereksiz bir tekrar maliyetiydi. */
      var baseNoise = new Float32Array(N * N);
      for (var bgy = 0; bgy < N; bgy++) {
        for (var bgx = 0; bgx < N; bgx++) {
          baseNoise[bgy*N+bgx] = noise.fbm(bgx/N*freq, bgy/N*freq, octaves, 0.5);
        }
      }

      for (var attempt = 0; attempt < 6; attempt++) {
        var seeds = buildSeeds(boost);
        heightGrid = blobFill(N, seeds, roughness, noise);

        small = document.createElement('canvas'); small.width = N; small.height = N;
        sctx = small.getContext('2d');
        img = sctx.createImageData(N, N);
        var landCells = 0;
        for (var gy = 0; gy < N; gy++) {
          for (var gx = 0; gx < N; gx++) {
            var base = baseNoise[gy*N+gx];
            var falloff = heightGrid[gy*N+gx];
            var value = (falloff - 0.5) + base*(0.22 + roughness*0.5);
            var a = Math.max(0, Math.min(1, value/0.12 + 0.5));
            var idx = (gy*N+gx)*4;
            img.data[idx] = 20; img.data[idx+1] = 20; img.data[idx+2] = 20;
            var av = Math.round(a*255);
            img.data[idx+3] = av;
            if (av > 127) landCells++;
          }
        }
        var coverage = landCells/(N*N);
        /* Rastgele yerleşim (özellikle takımada'nın reddet-örnekle adacık
           paketlemesi) her denemede monoton büyümeyebilir — boost arttıkça
           daha fazla ada istenip alan yetersiz kalınca bazı adaların hiç
           yerleşememesiyle kapsam gerileyebilir. Bu yüzden hedefe ulaşan
           İLK sonucu değil, GÖRÜLEN EN İYİ sonucu saklarız. */
        if (coverage > bestCoverage) { bestCoverage = coverage; bestHeightGrid = heightGrid; bestImg = img; }
        if (coverage >= target) break;
        boost *= 1.35;
      }
      heightGrid = bestHeightGrid;
      img = bestImg;
      sctx.putImageData(img, 0, 0);

      /* CSS blur filtresi + getImageData, piksel sayısıyla orantılı maliyetli —
         8192² tuvalde (67M piksel) bu adım tek başına onlarca saniye sürüyordu.
         Bulanıklaştırma+eşikleme adımını sabit bir üst sınırda (GEN_MAX) çalıştırıp
         sonucu gerçek tuval boyutuna bilinear ölçekle büyütüyoruz — kıyı çizgisinin
         asıl yumuşatması zaten render anında shore efektiyle (Cv.buildShoreCanvas)
         geliyor, burada tek amaç ham blob şeklinin pürüzsüz bir sınırı olması.
         Kaynak veri zaten 220×220'lik düşük çözünürlüklü bir gürültü
         gridinden geliyor (bkz. N), yani 2048'e kadar büyütmek bile ~9× bir
         yukarı-ölçekleme; GEN_MAX'ı 1024'e indirmek final görünümü
         gözle fark edilir şekilde değiştirmeden (kıyının "çözünürlüğü" zaten
         220-hücrelik gridle sınırlı) bu adımın piksel sayısını (ve mobilde
         asıl darboğaz olan CSS blur/getImageData maliyetini) 4× azaltır —
         profilde 4x CPU kısıtlamasında bu adım tek başına 1.2-4.5 sn
         sürüyordu. */
      var GEN_MAX = 1024;
      var gk = Math.min(1, GEN_MAX / Math.max(w, h));
      var gw = Math.max(1, Math.round(w*gk)), gh = Math.max(1, Math.round(h*gk));

      var raw = document.createElement('canvas'); raw.width = gw; raw.height = gh;
      var rctx = raw.getContext('2d');
      rctx.imageSmoothingEnabled = true;
      rctx.drawImage(small, 0, 0, gw, gh);

      var mid = document.createElement('canvas'); mid.width = gw; mid.height = gh;
      var mctx = mid.getContext('2d', { willReadFrequently:true });
      mctx.filter = 'blur(' + Math.max(2, Math.round(gw*0.0015)) + 'px)';
      mctx.drawImage(raw, 0, 0);
      mctx.filter = 'none';
      var bid = mctx.getImageData(0, 0, gw, gh), bd = bid.data;
      for (var p = 0; p < bd.length; p += 4) bd[p+3] = bd[p+3] > 128 ? 255 : 0;
      mctx.putImageData(bid, 0, 0);
      mctx.globalCompositeOperation = 'source-in';
      mctx.fillStyle = App.brush.color;
      mctx.fillRect(0, 0, gw, gh);
      mctx.globalCompositeOperation = 'source-over';

      /* mid'i doğrudan katmana çiz — ayrı bir 'big' ara tuvaline kopyalayıp
         oradan tekrar katmana çizmek 8192² gibi boyutlarda tek başına
         saniyeler süren gereksiz bir ikinci tam-tuval kopyasıydı. */
      L.ctx.clearRect(0, 0, w, h);
      L.ctx.imageSmoothingEnabled = true;
      L.ctx.drawImage(mid, 0, 0, w, h);

      History.pushRaster('landmass', before, L.canvas, {x:0,y:0,w:w,h:h}, 'landgen:'+template);
      Cv.shoreDirty = true;
      UI.refreshHistory();

      /* opsiyonel: aynı düşük-çözünürlüklü yükseklik gridinden bir yükselti
         katmanı da türet — "nehir"/"arazi" seçenekleri bunu kullanır, ayrı
         bir geri-alma adımı olarak eklenir. */
      if (opts.withElevation) this._paintGeneratedElevation(heightGrid, N, seed);

      Cv.requestRender();
    },

    /* generateLandmass ile aynı N×N yükseklik gridinden (heightGrid, 0..~1
       "çekirdeklik" değeri) grayscale bir yükselti katmanı boyar — autoBiome
       ve generateRivers'ın beklediği kodlamayla aynı: R=G=B gri seviye,
       alfa o pikseldeki verinin "gücü" (bkz. autoBiome'daki ea/height
       formülü). Kıyıya yakın hücreler zayıf alfa ile deniz seviyesine
       (128) yakın kalır, iç kesimler daha güçlü ve daha yüksek çıkar. */
    _paintGeneratedElevation: function (heightGrid, N, seed) {
      var Ev = Layers.get('elevation');
      if (!Ev || Ev.locked) return;
      var w = Ev.canvas.width, h = Ev.canvas.height;
      var before = snap(Ev.canvas);
      var rnd = this._noiseGrid(((seed >>> 0) + 0x9e3779b9) >>> 0);

      var small = document.createElement('canvas'); small.width = N; small.height = N;
      var sctx = small.getContext('2d');
      var img = sctx.createImageData(N, N);
      for (var gy = 0; gy < N; gy++) {
        for (var gx = 0; gx < N; gx++) {
          var idx = (gy*N+gx)*4;
          var f = heightGrid[gy*N+gx];
          if (f <= 0.02) continue; /* deniz: boyanmamış bırak (alfa 0) */
          var rough = rnd.fbm(gx/N*3.4, gy/N*3.4, 4, 0.55);
          var peak = Math.pow(f, 1.5) * (0.55 + rough*0.45);
          var gray = Math.round(128 + Math.min(1, peak) * 110);
          img.data[idx] = gray; img.data[idx+1] = gray; img.data[idx+2] = gray;
          img.data[idx+3] = Math.round(Math.min(1, 0.35 + f*0.9) * 255);
        }
      }
      sctx.putImageData(img, 0, 0);

      Ev.ctx.clearRect(0, 0, w, h);
      Ev.ctx.imageSmoothingEnabled = true;
      Ev.ctx.drawImage(small, 0, 0, w, h);

      History.pushRaster('elevation', before, Ev.canvas, {x:0,y:0,w:w,h:h}, 'landgen:elevation');
      Cv.elevationDirty = true;
      UI.refreshHistory();
    },

    /* ================= GÖL OTOMATİK ÜRETİMİ =================
       Kıyıdan yeterince uzak, çevresi tamamen kara olan iç noktaları
       (autoBiome'daki gibi ucuz bir N×N ızgara üzerinde) bulup birkaçına
       düzensiz kapalı bir çokgen (göl) yerleştirir — 'rivers' katmanında
       kind:'lake' olarak, elle "Göl" aracıyla çizilenle aynı biçimde. */
    autoLakes: function (seed) {
      var Lm = Layers.get('landmass'), Rv = Layers.get('rivers');
      if (!Lm || !Rv) return;
      if (Rv.locked) { UI.msg(UI.t('locked')); return; }
      var w = Lm.canvas.width, h = Lm.canvas.height;
      var rnd = this._noiseGrid((seed >>> 0) || Math.floor(Math.random()*4294967296));

      var N = Math.max(40, Math.min(120, Math.round(Math.min(w,h)/40)));
      var sw = N, sh = Math.max(1, Math.round(N * h/w));
      var lc = document.createElement('canvas'); lc.width = sw; lc.height = sh;
      var lctx = lc.getContext('2d', { willReadFrequently:true });
      lctx.drawImage(Lm.canvas, 0, 0, sw, sh);
      var land = lctx.getImageData(0, 0, sw, sh).data;

      function isLand(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= sw || gy >= sh) return false;
        return land[(gy*sw+gx)*4+3]/255 > 0.5;
      }

      var margin = Math.max(2, Math.round(Math.min(sw,sh)*0.035));
      var candidates = [];
      for (var gy = 0; gy < sh; gy++) {
        for (var gx = 0; gx < sw; gx++) {
          if (!isLand(gx, gy)) continue;
          var ok = true;
          for (var oy = -margin; oy <= margin && ok; oy += margin) {
            for (var ox = -margin; ox <= margin && ok; ox += margin) {
              if (!isLand(gx+ox, gy+oy)) ok = false;
            }
          }
          if (ok) candidates.push({ gx:gx, gy:gy });
        }
      }
      if (!candidates.length) { UI.msg(UI.t('lakegen_none')); return; }

      var before = JSON.parse(JSON.stringify(Rv.objects));
      var wanted = 1 + Math.floor(rnd.next()*3); /* 1..3 göl */
      var placed = [];
      var minSepCells = margin*3;
      var made = 0, tries = 0;
      while (made < wanted && tries < candidates.length*2) {
        tries++;
        var c = candidates[Math.floor(rnd.next()*candidates.length)];
        var tooClose = placed.some(function (p) { return Math.hypot(p.gx-c.gx, p.gy-c.gy) < minSepCells; });
        if (tooClose) continue;
        placed.push(c);

        var cx = (c.gx+0.5)/sw*w, cy = (c.gy+0.5)/sh*h;
        var baseR = Math.min(w,h) * (0.012 + rnd.next()*0.018);
        var segs = 10 + Math.floor(rnd.next()*6);
        var pts = [];
        for (var s = 0; s < segs; s++) {
          var ang = (s/segs) * Math.PI*2;
          var rr = baseR * (0.65 + rnd.next()*0.6);
          pts.push([cx + Math.cos(ang)*rr, cy + Math.sin(ang)*rr]);
        }
        Rv.objects.push({ id:uid(), kind:'lake', pts:pts, color:App.lake.color, opacity:App.lake.opacity });
        made++;
      }
      if (!made) { UI.msg(UI.t('lakegen_none')); return; }

      History.pushVector('rivers', before, JSON.parse(JSON.stringify(Rv.objects)), 'lakegen');
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= BİYOM OTOMATİK ATAMA =================
       Arazi katmanını, kara/deniz maskesi + yükselti verisine göre
       otomatik dolduruyor. Bant mantığı gerçek coğrafyadan ödünç:
       enlem (tuval y ekseni, kenarlar kutup / orta satır ekvator) sıcaklık
       bandını, yükselti (elevation katmanı, 128=deniz seviyesi) dağ/yayla
       bandını belirliyor; her bandın içinde bir gürültü değeri (moist)
       birkaç yakın biyom arasında çeşitlilik sağlıyor. Elle boyanmış
       herhangi bir terrain gibi Terrain.scatter ile damgalanıyor, sonra
       tek seferde landmass'a clip'leniyor. */
    autoBiome: function (seed) {
      var Lm = Layers.get('landmass'), Ev = Layers.get('elevation'), T = Layers.get('terrain');
      if (!Lm || !Ev || !T) return Promise.resolve(false);
      if (T.locked) { UI.msg(UI.t('locked')); return Promise.resolve(false); }
      var w = T.canvas.width, h = T.canvas.height;
      var before = snap(T.canvas);
      var rnd = this._noiseGrid((seed >>> 0) || Math.floor(Math.random()*4294967296));

      var N = Math.max(24, Math.min(90, Math.round(Math.min(w,h)/48)));
      var sw = N, sh = Math.max(1, Math.round(N * h/w));

      var lc = document.createElement('canvas'); lc.width = sw; lc.height = sh;
      var lctx = lc.getContext('2d', { willReadFrequently:true });
      lctx.drawImage(Lm.canvas, 0, 0, sw, sh);
      var land = lctx.getImageData(0, 0, sw, sh).data;

      var ec = document.createElement('canvas'); ec.width = sw; ec.height = sh;
      var ectx = ec.getContext('2d', { willReadFrequently:true });
      ectx.drawImage(Ev.canvas, 0, 0, sw, sh);
      var elev = ectx.getImageData(0, 0, sw, sh).data;

      function pickBiome(e, lat, moist) {
        if (e > 0.62) {
          if (lat > 0.72) return 'glacier';
          if (moist < 0.12) return 'volcanic';
          return 'mountain';
        }
        if (e > 0.36) return lat > 0.6 ? 'taiga' : 'highland';
        if (lat > 0.84) return moist < 0.5 ? 'tundra' : 'snow';
        if (lat > 0.62) return moist < 0.55 ? 'taiga' : 'darkforest';
        if (lat > 0.40) return moist < 0.30 ? 'shrubland' : (moist < 0.65 ? 'forest' : 'meadow');
        if (lat > 0.18) return moist < 0.35 ? 'savanna' : (moist < 0.70 ? 'grassland' : 'swamp');
        return moist < 0.45 ? 'desert' : (moist < 0.80 ? 'savanna' : 'marsh');
      }

      T.ctx.clearRect(0, 0, w, h);
      var cellW = w/sw, cellH = h/sh;
      var r = Math.max(cellW, cellH) * 0.95;
      var placed = 0;

      var self = this;
      return new Promise(function (resolve) {
        var gy = 0;
        /* Satır satır ilerleyip aradan setTimeout(0) ile ana iş parçacığına
           "nefes alma" fırsatı veriyoruz — bu döngü, tek parça hâlinde
           çalıştırıldığında (özellikle mobilde) sekmeyi saniyelerce donmuş
           gösteren en ağır adımdı. Sabit bir satır sayısı yerine bir ZAMAN
           bütçesi (~60ms) kullanıyoruz: hızlı bir cihazda tek parçada çok
           satır işlenip yield sayısı (dolayısıyla setTimeout ek yükü) düşük
           kalır, yavaş bir cihazda az satır işlenip daha sık ama kısa
           duraklamalar olur — her ikisinde de tek bir dondurma asla ~60ms'yi
           aşmaz. Toplam süreyi değiştirmez, yalnızca tarayıcının arada
           tekrar boyama/girdi işlemesine izin vererek "kasma" hissini
           ortadan kaldırır. */
        function chunk() {
          var chunkStart = performance.now();
          while (gy < sh && performance.now() - chunkStart < 60) {
            for (var gx = 0; gx < sw; gx++) {
              var i = (gy*sw + gx) * 4;
              var a = land[i+3] / 255;
              if (a < 0.4) continue;
              var ea = elev[i+3] / 255;
              var height = ea > 0.02 ? (elev[i]*ea + 128*(1-ea)) : 128;
              var e = Math.max(0, (height - 128) / 127);
              /* Enlem satır numarasından (gy) türetildiği için hiçbir
                 bozulma olmadan tam yatay, cetvelle çizilmiş gibi düz
                 şeritler verirdi — gerçek haritalarda iklim kuşakları
                 asla bu kadar düzenli olmaz. Düşük frekanslı ikinci bir
                 gürültü alanı, "enlem"i sağa/sola dalgalandırarak kuşak
                 sınırlarını kıvrımlı, elle çizilmiş hissi veren bir hâle
                 getiriyor (nem gürültüsünden farklı frekans/tohum, aksi
                 hâlde ikisi birbiriyle örtüşüp yine düzenli görünürdü). */
              var rowNorm = (gy+0.5)/sh - 0.5;
              var latWarp = rnd.fbm(gx/sw*0.9 + 50, gy/sh*0.9 + 50, 3, 0.5) * 0.38;
              var lat = Math.max(0, Math.min(1, Math.abs(rowNorm + latWarp) * 2));
              /* Nem artık her hücrede bağımsız bir zar atışı (rnd.next())
                 değil, düşük frekanslı bir gürültü alanından örnekleniyor —
                 komşu hücreler benzer nem paylaşır. Önceki hâliyle bitişik
                 hücreler elevation/enlem aynı kalsa bile nem her seferinde
                 rastgele zıplayıp biyomu değiştirebiliyordu; bu da harita
                 yerine "tuz-biber"/dama tahtası gibi görünen, birbirinden
                 kopuk kare bir mozaiğe yol açıyordu. */
              var moist = rnd.fbm(gx/sw*2.4, gy/sh*2.4, 3, 0.55) * 0.5 + 0.5;
              var biome = pickBiome(e, lat, moist);
              /* Hücre merkezine küçük bir rastgele kayma: damgaların
                 kusursuz bir ızgaraya hizalanmasını bozar, sonuçta sert
                 kare kenarlar yerine elle çizilmiş gibi düzensiz bir
                 sınır oluşur. */
              var cx = (gx+0.5+(rnd.next()-0.5)*0.5)*cellW;
              var cy = (gy+0.5+(rnd.next()-0.5)*0.5)*cellH;
              Terrain.scatter(T.ctx, biome, cx, cy, r, 1, 1);
              placed++;
            }
            gy++;
          }
          if (gy < sh) { setTimeout(chunk, 0); return; }

          if (!placed) { UI.msg(UI.t('biomegen_empty')); resolve(false); return; }

          T.ctx.globalCompositeOperation = 'destination-in';
          T.ctx.drawImage(Lm.canvas, 0, 0);
          T.ctx.globalCompositeOperation = 'source-over';

          History.pushRaster('terrain', before, T.canvas, {x:0,y:0,w:w,h:h}, 'biomegen');
          UI.refreshHistory();
          Cv.requestRender();
          resolve(true);
        }
        chunk();
      });
    },

    /* ================= NEHİR OTOMATİK ÜRETİMİ =================
       Yükselti gridinde yüksek noktalardan başlayıp her adımda en alçak
       komşuya inen (steepest-descent) bir akış izliyor; kara bitip denize
       (veya tuval kenarına) ulaşınca nehir ağzı tamamlanmış olur. Izgara
       noktaları seyrekleştirilip vektör 'rivers' nesnesi olarak ekleniyor
       — eğrilik zaten render anında Geo.sample'ın Catmull-Rom'undan gelir,
       burada ekstra yumuşatmaya gerek yok. */
    generateRivers: function (count, seed) {
      var Lm = Layers.get('landmass'), Ev = Layers.get('elevation'), Rv = Layers.get('rivers');
      if (!Lm || !Ev || !Rv) return;
      if (Rv.locked) { UI.msg(UI.t('locked')); return; }
      var w = Lm.canvas.width, h = Lm.canvas.height;
      var rnd = this._noiseGrid((seed >>> 0) || Math.floor(Math.random()*4294967296));

      var N = Math.max(60, Math.min(160, Math.round(Math.min(w,h)/24)));
      var sw = N, sh = Math.max(1, Math.round(N * h/w));

      var lc = document.createElement('canvas'); lc.width = sw; lc.height = sh;
      var lctx = lc.getContext('2d', { willReadFrequently:true });
      lctx.drawImage(Lm.canvas, 0, 0, sw, sh);
      var land = lctx.getImageData(0, 0, sw, sh).data;

      var ec = document.createElement('canvas'); ec.width = sw; ec.height = sh;
      var ectx = ec.getContext('2d', { willReadFrequently:true });
      ectx.drawImage(Ev.canvas, 0, 0, sw, sh);
      var elev = ectx.getImageData(0, 0, sw, sh).data;

      function isLand(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= sw || gy >= sh) return false;
        return land[(gy*sw+gx)*4+3]/255 > 0.4;
      }
      function heightAt(gx, gy) {
        var i = (gy*sw+gx)*4;
        var a = elev[i+3]/255;
        return a > 0.02 ? (elev[i]*a + 128*(1-a)) : 128;
      }

      var candidates = [];
      for (var gy = 0; gy < sh; gy++) {
        for (var gx = 0; gx < sw; gx++) {
          if (!isLand(gx, gy)) continue;
          var hgt = heightAt(gx, gy);
          if (hgt > 148) candidates.push({ gx:gx, gy:gy, h:hgt });
        }
      }
      if (!candidates.length) { UI.msg(UI.t('rivergen_noelev')); return; }
      candidates.sort(function (a, b) { return b.h - a.h; });

      var wanted = count || Math.max(2, Math.min(8, Math.round(candidates.length/40)));
      var before = JSON.parse(JSON.stringify(Rv.objects));
      var used = new Uint8Array(sw*sh);
      var minSepCells = Math.max(3, Math.round(sw*0.06));
      var made = 0, tries = 0;

      while (made < wanted && tries < candidates.length*2) {
        tries++;
        var idx = Math.min(candidates.length-1, Math.floor(rnd.next() * Math.min(candidates.length, wanted*15)));
        var src = candidates[idx];
        if (used[src.gy*sw+src.gx]) continue;

        var path = [[src.gx, src.gy]];
        var cx = src.gx, cy = src.gy;
        var visited = {};
        var steps = 0, maxSteps = sw + sh;
        while (steps++ < maxSteps) {
          visited[cy*sw+cx] = 1;
          if (!isLand(cx, cy)) break;
          var bestH = heightAt(cx, cy), bestX = -1, bestY = -1;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              var nx = cx+dx, ny = cy+dy;
              if (nx < 0 || ny < 0 || nx >= sw || ny >= sh) { bestX = nx; bestY = ny; bestH = -1e9; continue; }
              if (visited[ny*sw+nx]) continue;
              if (!isLand(nx, ny)) { bestX = nx; bestY = ny; bestH = -1e9; continue; }
              var nh = heightAt(nx, ny);
              if (nh < bestH) { bestH = nh; bestX = nx; bestY = ny; }
            }
          }
          if (bestX === -1) break;
          cx = bestX; cy = bestY;
          path.push([cx, cy]);
          if (!isLand(cx, cy)) break;
        }

        if (path.length < 4) continue;

        path.forEach(function (pt) {
          for (var oy = -minSepCells; oy <= minSepCells; oy++) {
            for (var ox = -minSepCells; ox <= minSepCells; ox++) {
              var ux = pt[0]+ox, uy = pt[1]+oy;
              if (ux >= 0 && uy >= 0 && ux < sw && uy < sh) used[uy*sw+ux] = 1;
            }
          }
        });

        var step = Math.max(1, Math.floor(path.length/28));
        var pts = [];
        for (var pi = 0; pi < path.length; pi += step) {
          var px = Math.max(0, Math.min(w, path[pi][0]/sw*w));
          var py = Math.max(0, Math.min(h, path[pi][1]/sh*h));
          if (pts.length) {
            var lp = pts[pts.length-1];
            if (Math.hypot(px-lp[0], py-lp[1]) < Math.min(w,h)*0.01) continue;
          }
          pts.push([px, py]);
        }
        var lastPt = path[path.length-1];
        var lpx = Math.max(0, Math.min(w, lastPt[0]/sw*w)), lpy = Math.max(0, Math.min(h, lastPt[1]/sh*h));
        if (!pts.length || Math.hypot(lpx-pts[pts.length-1][0], lpy-pts[pts.length-1][1]) > 1) pts.push([lpx, lpy]);
        if (pts.length < 2) continue;

        Rv.objects.push({
          id: uid(), pts: pts, width: App.river.width * (0.6 + rnd.next()*0.5),
          meander: App.river.meander, taper: true,
          color: App.river.color, opacity: 1
        });
        made++;
      }

      if (!made) { UI.msg(UI.t('rivergen_none')); return; }
      History.pushVector('rivers', before, JSON.parse(JSON.stringify(Rv.objects)), 'rivergen');
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= YOL OTOMATİK ÜRETİMİ =================
       Yerleşim sembolleri (şehir/kasaba/köy/kale/liman) varsa onları,
       yoksa iyi ayrılmış birkaç rastgele kara noktasını bir asgari yayılan
       ağaç (MST, düz-çizgi mesafesiyle) ile eşleştirir; her kenar için
       yükselti-maliyetli A* ile en az dik yamaçtan geçen, denize hiç
       girmeyen bir yol bulur. Nehir akışının aksine (tek yönlü, en dik
       iniş) burada gerçek graf araması gerekiyor çünkü yol iki sabit uç
       arasında olmalı. */
    ROAD_SETTLE_CATS: { cities:1, towns:1, villages:1, castles:1, ports:1 },

    generateRoads: function (seed) {
      var Lm = Layers.get('landmass'), Ev = Layers.get('elevation'), Rd = Layers.get('roads'), Sy = Layers.get('symbols');
      if (!Lm || !Rd) return;
      if (Rd.locked) { UI.msg(UI.t('locked')); return; }
      var w = Lm.canvas.width, h = Lm.canvas.height;
      var rnd = this._noiseGrid((seed >>> 0) || Math.floor(Math.random()*4294967296));

      var N = Math.max(50, Math.min(120, Math.round(Math.min(w,h)/32)));
      var sw = N, sh = Math.max(1, Math.round(N * h/w));

      var lc = document.createElement('canvas'); lc.width = sw; lc.height = sh;
      var lctx = lc.getContext('2d', { willReadFrequently:true });
      lctx.drawImage(Lm.canvas, 0, 0, sw, sh);
      var land = lctx.getImageData(0, 0, sw, sh).data;

      var ec = document.createElement('canvas'); ec.width = sw; ec.height = sh;
      var ectx = ec.getContext('2d', { willReadFrequently:true });
      ectx.drawImage(Ev.canvas, 0, 0, sw, sh);
      var elev = ectx.getImageData(0, 0, sw, sh).data;

      function isLand(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= sw || gy >= sh) return false;
        return land[(gy*sw+gx)*4+3]/255 > 0.4;
      }
      function heightAt(gx, gy) {
        var i = (gy*sw+gx)*4;
        var a = elev[i+3]/255;
        return a > 0.02 ? (elev[i]*a + 128*(1-a)) : 128;
      }

      var self = this;
      var pts = [];
      if (Sy) {
        Sy.objects.forEach(function (o) {
          if (!o.sym) return;
          var cat = Sym.catOf(o.sym);
          if (!self.ROAD_SETTLE_CATS[cat]) return;
          var gx = Math.round(o.x/w*sw), gy = Math.round(o.y/h*sh);
          if (isLand(gx, gy)) pts.push({ x:o.x, y:o.y, gx:gx, gy:gy });
        });
      }
      if (pts.length < 2) {
        var landCells = [];
        for (var gy0 = 0; gy0 < sh; gy0++) {
          for (var gx0 = 0; gx0 < sw; gx0++) if (isLand(gx0, gy0)) landCells.push([gx0, gy0]);
        }
        if (landCells.length < 2) { UI.msg(UI.t('roadgen_noland')); return; }
        var wanted = Math.max(3, Math.min(6, Math.round(landCells.length/900)));
        var picked = [], tries = 0;
        while (picked.length < wanted && tries < 500) {
          tries++;
          var cand = landCells[Math.floor(rnd.next()*landCells.length)];
          var ok = true;
          for (var pi0 = 0; pi0 < picked.length; pi0++) {
            var dx0 = picked[pi0][0]-cand[0], dy0 = picked[pi0][1]-cand[1];
            if (Math.hypot(dx0, dy0) < sw*0.18) { ok = false; break; }
          }
          if (ok) picked.push(cand);
        }
        pts = picked.map(function (c) { return { x:(c[0]+0.5)/sw*w, y:(c[1]+0.5)/sh*h, gx:c[0], gy:c[1] }; });
        if (pts.length < 2) { UI.msg(UI.t('roadgen_noland')); return; }
      }

      /* düz-çizgi mesafesiyle asgari yayılan ağaç (Prim) — hangi noktaların
         yolla bağlanacağını belirler, gerçek yol şeklini değil */
      var n = pts.length;
      var inMST = [], distMST = [], parent = [];
      for (var i = 0; i < n; i++) { inMST.push(false); distMST.push(Infinity); parent.push(-1); }
      distMST[0] = 0;
      var edges = [];
      for (var it = 0; it < n; it++) {
        var u = -1, best = Infinity;
        for (var j = 0; j < n; j++) if (!inMST[j] && distMST[j] < best) { best = distMST[j]; u = j; }
        if (u === -1) break;
        inMST[u] = true;
        if (parent[u] !== -1) edges.push([parent[u], u]);
        for (var k = 0; k < n; k++) {
          if (inMST[k]) continue;
          var dd = Math.hypot(pts[u].x-pts[k].x, pts[u].y-pts[k].y);
          if (dd < distMST[k]) { distMST[k] = dd; parent[k] = u; }
        }
      }

      /* A* — 8 komşuluk, adım maliyeti yükselti farkına göre artar (yol
         dik yamaçtan kaçınır), deniz hücreleri tamamen kapalı */
      function astar(sx, sy, tx, ty) {
        var heap = [];
        function pushHeap(item) {
          heap.push(item);
          var idx = heap.length-1;
          while (idx > 0) {
            var p = (idx-1) >> 1;
            if (heap[p][0] <= heap[idx][0]) break;
            var t = heap[p]; heap[p] = heap[idx]; heap[idx] = t;
            idx = p;
          }
        }
        function popHeap() {
          var top = heap[0], last = heap.pop();
          if (heap.length) {
            heap[0] = last;
            var idx = 0;
            while (true) {
              var l = idx*2+1, r = idx*2+2, s = idx;
              if (l < heap.length && heap[l][0] < heap[s][0]) s = l;
              if (r < heap.length && heap[r][0] < heap[s][0]) s = r;
              if (s === idx) break;
              var t = heap[idx]; heap[idx] = heap[s]; heap[s] = t;
              idx = s;
            }
          }
          return top;
        }

        var startIdx = sy*sw+sx, targetIdx = ty*sw+tx;
        var total = sw*sh;
        var gScore = new Array(total), cameFrom = new Array(total);
        var visited = new Uint8Array(total);
        for (var gi = 0; gi < total; gi++) { gScore[gi] = Infinity; cameFrom[gi] = -1; }
        gScore[startIdx] = 0;
        pushHeap([Math.hypot(tx-sx, ty-sy), startIdx]);

        while (heap.length) {
          var cur = popHeap(), ci = cur[1];
          if (visited[ci]) continue;
          visited[ci] = 1;
          if (ci === targetIdx) break;
          var cx = ci % sw, cy = (ci/sw)|0;
          for (var dy = -1; dy <= 1; dy++) {
            for (var dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              var nx = cx+dx, ny = cy+dy;
              if (!isLand(nx, ny)) continue;
              var ni = ny*sw+nx;
              if (visited[ni]) continue;
              var slope = Math.abs(heightAt(nx, ny) - heightAt(cx, cy));
              var cost = Math.hypot(dx, dy) * (1 + slope*0.05);
              var ng = gScore[ci] + cost;
              if (ng < gScore[ni]) {
                gScore[ni] = ng;
                cameFrom[ni] = ci;
                pushHeap([ng + Math.hypot(tx-nx, ty-ny), ni]);
              }
            }
          }
        }

        if (cameFrom[targetIdx] === -1 && targetIdx !== startIdx) return null;
        var path = [], cur2 = targetIdx, guard = 0;
        while (cur2 !== -1 && guard++ < total) {
          path.push([cur2 % sw, (cur2/sw)|0]);
          if (cur2 === startIdx) break;
          cur2 = cameFrom[cur2];
        }
        path.reverse();
        return path;
      }

      var before = JSON.parse(JSON.stringify(Rd.objects));
      var made = 0;
      edges.forEach(function (e) {
        var a = pts[e[0]], b = pts[e[1]];
        var path = astar(a.gx, a.gy, b.gx, b.gy);
        if (!path || path.length < 2) return;

        var step = Math.max(1, Math.floor(path.length/40));
        var rpts = [];
        for (var pi = 0; pi < path.length; pi += step) {
          var px = (path[pi][0]+0.5)/sw*w, py = (path[pi][1]+0.5)/sh*h;
          if (rpts.length) {
            var lp = rpts[rpts.length-1];
            if (Math.hypot(px-lp[0], py-lp[1]) < Math.min(w,h)*0.008) continue;
          }
          rpts.push([px, py]);
        }
        var lastc = path[path.length-1];
        var lpx = (lastc[0]+0.5)/sw*w, lpy = (lastc[1]+0.5)/sh*h;
        if (!rpts.length || Math.hypot(lpx-rpts[rpts.length-1][0], lpy-rpts[rpts.length-1][1]) > 1) rpts.push([lpx, lpy]);
        if (rpts.length < 2) return;

        Rd.objects.push({ id:uid(), pts:rpts, width:App.road.width, style:App.road.style, color:App.road.color, opacity:1 });
        made++;
      });

      if (!made) { UI.msg(UI.t('roadgen_none')); return; }
      History.pushVector('roads', before, JSON.parse(JSON.stringify(Rd.objects)), 'roadgen');
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= YERLEŞİM OTOMATİK YERLEŞTİRME =================
       Düz (düşük yükselti) ve kıyıya yakın kara hücrelerini puanlayıp en
       iyilerini seçer — en yüksek puanlı kale/liman, sonraki birkaçı
       kasaba, geri kalanı köy sembolü olur. generateRoads ile aynı
       ROAD_SETTLE_CATS kategori kümesini kullanır, böylece "Yol üret"
       burada yerleştirilen sembolleri otomatik bulup birbirine bağlar. */
    autoSettle: function (count, seed) {
      var Lm = Layers.get('landmass'), Ev = Layers.get('elevation'), Sy = Layers.get('symbols');
      if (!Lm || !Sy) return;
      if (Sy.locked || !Sy.visible) { UI.msg(UI.t('locked')); return; }
      var w = Lm.canvas.width, h = Lm.canvas.height;
      var rnd = this._noiseGrid((seed >>> 0) || Math.floor(Math.random()*4294967296));

      var N = Math.max(50, Math.min(120, Math.round(Math.min(w,h)/32)));
      var sw = N, sh = Math.max(1, Math.round(N * h/w));

      var lc = document.createElement('canvas'); lc.width = sw; lc.height = sh;
      var lctx = lc.getContext('2d', { willReadFrequently:true });
      lctx.drawImage(Lm.canvas, 0, 0, sw, sh);
      var land = lctx.getImageData(0, 0, sw, sh).data;

      var ec = document.createElement('canvas'); ec.width = sw; ec.height = sh;
      var ectx = ec.getContext('2d', { willReadFrequently:true });
      ectx.drawImage(Ev.canvas, 0, 0, sw, sh);
      var elev = ectx.getImageData(0, 0, sw, sh).data;

      function isLand(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= sw || gy >= sh) return false;
        return land[(gy*sw+gx)*4+3]/255 > 0.4;
      }
      function heightAt(gx, gy) {
        var i = (gy*sw+gx)*4;
        var a = elev[i+3]/255;
        return a > 0.02 ? (elev[i]*a + 128*(1-a)) : 128;
      }
      function isCoastal(gx, gy) {
        for (var dy = -2; dy <= 2; dy++) {
          for (var dx = -2; dx <= 2; dx++) {
            if (!dx && !dy) continue;
            if (!isLand(gx+dx, gy+dy)) return true;
          }
        }
        return false;
      }

      var cells = [];
      for (var gy = 0; gy < sh; gy++) {
        for (var gx = 0; gx < sw; gx++) {
          if (!isLand(gx, gy)) continue;
          var e = Math.max(0, (heightAt(gx, gy)-128)/127);
          if (e > 0.55) continue; /* çok dik/dağlık arazi — yerleşim uygun değil */
          var coastal = isCoastal(gx, gy);
          var score = (1-e) + (coastal ? 0.6 : 0) + rnd.next()*0.25;
          cells.push({ gx:gx, gy:gy, score:score, coastal:coastal });
        }
      }
      if (!cells.length) { UI.msg(UI.t('settlegen_noland')); return; }
      cells.sort(function (a, b) { return b.score - a.score; });

      var wanted = count || Math.max(3, Math.min(9, Math.round(cells.length/700)));
      var minSepCells = Math.max(3, Math.round(sw*0.10));

      var existing = [];
      Sy.objects.forEach(function (o) { existing.push([o.x/w*sw, o.y/h*sh]); });

      var picked = [];
      for (var ci = 0; ci < cells.length && picked.length < wanted; ci++) {
        var c = cells[ci];
        var ok = true;
        for (var pi = 0; pi < picked.length; pi++) {
          if (Math.hypot(picked[pi].gx-c.gx, picked[pi].gy-c.gy) < minSepCells) { ok = false; break; }
        }
        if (ok) {
          for (var ei = 0; ei < existing.length; ei++) {
            if (Math.hypot(existing[ei][0]-c.gx, existing[ei][1]-c.gy) < minSepCells*0.6) { ok = false; break; }
          }
        }
        if (ok) picked.push(c);
      }
      if (!picked.length) { UI.msg(UI.t('settlegen_none')); return; }

      var before = JSON.parse(JSON.stringify(Sy.objects));
      picked.forEach(function (c, idx) {
        var cat, sizeBase;
        if (idx === 0)    { cat = (c.coastal && Sym.SYMBOLS.ports) ? 'ports' : 'castles'; sizeBase = 84; }
        else if (idx < 3) { cat = 'towns'; sizeBase = 68; }
        else              { cat = 'villages'; sizeBase = 52; }
        var catDef = Sym.SYMBOLS[cat] || Sym.SYMBOLS.villages;
        var items = catDef.items;
        var def = items[Math.floor(rnd.next()*items.length)];
        var x = (c.gx+0.5)/sw*w, y = (c.gy+0.5)/sh*h;
        Sy.objects.push({
          id:uid(), sym:def.id, x:x, y:y,
          size: sizeBase * (0.9 + rnd.next()*0.2), rot:0,
          hue:0, opacity:1, wear:0
        });
      });

      History.pushVector('symbols', before, JSON.parse(JSON.stringify(Sy.objects)), 'settlegen');
      UI.refreshHistory();
      Cv.requestRender();
    },

    clearRasterLayer: function (id) {
      var L = Layers.get(id);
      if (L.locked) { UI.msg(UI.t('locked')); return; }
      var w = L.canvas.width, h = L.canvas.height;
      var before = snap(L.canvas);
      L.ctx.clearRect(0, 0, w, h);
      History.pushRaster(id, before, L.canvas, {x:0,y:0,w:w,h:h}, 'clear:'+id);
      if (id === 'landmass') Cv.shoreDirty = true;
      if (id === 'elevation') Cv.elevationDirty = true;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= SEMBOL FIRÇASI ================= */
    startSymbolBrush: function (p) {
      var L = Layers.get('symbols');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      this.mode = 'symbolBrush';
      this.symBrushLast = p;
      this.symBrushBefore = JSON.parse(JSON.stringify(L.objects));
      /* aynı vuruş içinde birbirine çok yakın sembol yığılmasını önlemek için
         bu vuruşta yerleştirilen noktaların minimum mesafe kontrolü */
      this.symBrushPlaced = [];
      this.symbolBrushStamp(p);
    },

    symbolBrushStamp: function (p) {
      var L = Layers.get('symbols');
      var s = App.symbol;
      var density = App.symbol.brushDensity || 0.5;
      var spread = s.size * (1.2 + density * 1.5);
      var count = Math.max(1, Math.round(density * 3));
      var minGap = s.size * (0.55 - density * 0.25); /* yoğunluk arttıkça izin verilen minimum aralık daralır */
      var placed = this.symBrushPlaced || (this.symBrushPlaced = []);
      var clip = s.clipToLand;
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var dist  = Math.random() * spread * 0.5;
        var snp = Cv.snapPoint ? { x: p.x, y: p.y } : p;
        var x = snp.x + Math.cos(angle) * dist * (s.jitter ? 1 : 0);
        var y = snp.y + Math.sin(angle) * dist * (s.jitter ? 1 : 0);

        if (clip && global.Cv && !Cv.isOnLand(x, y)) continue;

        var tooClose = false;
        for (var k = 0; k < placed.length; k++) {
          var dx = placed[k][0]-x, dy = placed[k][1]-y;
          if (dx*dx + dy*dy < minGap*minGap) { tooClose = true; break; }
        }
        if (tooClose) continue;
        placed.push([x, y]);

        var o = {
          id: uid(), sym: s.id,
          x: x, y: y, clip: clip,
          size: s.size * (0.78 + Math.random() * 0.44 * (s.jitter ? 1 : 0.2)),
          rot:  s.rot + (Math.random() - 0.5) * 60 * (s.jitter ? 1 : 0.1),
          hue: s.hue, opacity: s.opacity, wear: s.wear || 0
        };
        L.objects.push(o);
      }
    },

    symbolBrushTo: function (p) {
      if (!this.symBrushLast) return;
      var r = App.symbol.size * (0.8 + (App.symbol.brushDensity||0.5));
      var step = Math.max(r * 0.6, 20);
      var dx = p.x - this.symBrushLast.x, dy = p.y - this.symBrushLast.y;
      var dist = Math.hypot(dx, dy);
      if (dist < step) return;
      var n = Math.ceil(dist / step);
      for (var i = 1; i <= n; i++) {
        this.symbolBrushStamp({ x: this.symBrushLast.x + dx*i/n, y: this.symBrushLast.y + dy*i/n });
      }
      this.symBrushLast = p;
    },

    endSymbolBrush: function () {
      if (!this.symBrushBefore) return;
      var L = Layers.get('symbols');
      History.pushVector('symbols', this.symBrushBefore, JSON.parse(JSON.stringify(L.objects)), 'symbol:brush');
      this.symBrushLast = null;
      this.symBrushBefore = null;
      this.symBrushPlaced = null;
      this.mode = null;
      App.selection = null;
      UI.refreshHistory();
      Cv.requestRender();
    },

    /* ================= SEMBOL ================= */
    placeSymbol: function (p) {
      var L = Layers.get('symbols');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      var before = JSON.parse(JSON.stringify(L.objects));
      var s = App.symbol, j = s.jitter ? 1 : 0;
      var o = {
        id:uid(), sym:s.id,
        x:p.x+(Math.random()-0.5)*s.size*0.25*j,
        y:p.y+(Math.random()-0.5)*s.size*0.25*j,
        size:s.size*(1+(Math.random()-0.5)*0.28*j),
        rot:s.rot+(Math.random()-0.5)*10*j,
        hue:s.hue, opacity:s.opacity, wear:s.wear || 0
      };
      L.objects.push(o);
      App.selection = { layerId:'symbols', id:o.id };
      History.pushVector('symbols', before, JSON.parse(JSON.stringify(L.objects)), 'symbol');
      UI.refreshHistory(); UI.refreshSelection();
    },

    /* ================= ETİKET ================= */
    placeLabel: function (p) {
      var L = Layers.get('labels');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      var txt = $('lb-text').value.trim();
      if (!txt) { UI.msg(UI.t('needtext')); return; }
      var before = JSON.parse(JSON.stringify(L.objects));
      var s = App.label;
      var o = {
        id:uid(), text:txt, x:p.x, y:p.y,
        preset:s.preset, font:s.font, size:s.size, color:s.color,
        outline:s.outline, outlineColor:s.outlineColor, shadow:s.shadow,
        curve:s.curve, track:s.track, rot:s.rot, caps:s.caps,
        banner:s.banner, opacity:1
      };

      if (s.snapPath) {
        var hit = this.findNearestPath(p, 70);
        if (hit) {
          o.pathPts = hit.pts;
          o.pathCenter = hit.len;
          var ctr = Geo.pointAtLength(hit.pts, hit.len);
          o.x = ctr.x; o.y = ctr.y;
        } else {
          UI.msg(UI.t('nopathnear'));
        }
      }

      L.objects.push(o);
      App.selection = { layerId:'labels', id:o.id };
      History.pushVector('labels', before, JSON.parse(JSON.stringify(L.objects)), 'label');
      UI.refreshHistory(); UI.refreshSelection();
    },

    /* ================= KAYNAK İŞARETİ ================= */
    placeResource: function (p) {
      var L = Layers.get('resources');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      var before = JSON.parse(JSON.stringify(L.objects));
      var o = { id: uid(), x: p.x, y: p.y, size: App.resource.size, type: App.resource.type };
      L.objects.push(o);
      App.selection = { layerId:'resources', id:o.id };
      History.pushVector('resources', before, JSON.parse(JSON.stringify(L.objects)), 'resource');
      UI.refreshHistory(); UI.refreshSelection();
      Cv.requestRender();
    },

    /* ================= BÖLGE HARİTASI BAĞLANTISI ================= */
    placeRegionLink: function (p) {
      var L = Layers.get('links');
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      UI.modal(UI.t('rl_newtitle'),
        '<input type="text" id="rl-name-input" placeholder="' + UI.t('rl_placeholder') + '" style="width:100%">',
        function () {
          var name = ($('rl-name-input').value || '').trim() || UI.t('rl_default');
          var before = JSON.parse(JSON.stringify(L.objects));
          var o = { id: uid(), x: p.x, y: p.y, size: 40, name: name, targetMapId: uid() };
          L.objects.push(o);
          App.selection = { layerId:'links', id:o.id };
          History.pushVector('links', before, JSON.parse(JSON.stringify(L.objects)), 'regionlink');
          UI.refreshHistory(); UI.refreshSelection();
          Cv.requestRender();
        });
    },

    /* tıklanan noktaya en yakın nehir/yol'u bulur (etiketi yola oturtmak için) */
    findNearestPath: function (p, maxDist) {
      var best = null;
      ['rivers', 'roads'].forEach(function (lid) {
        var L = Layers.get(lid);
        if (!L || !L.visible) return;
        L.objects.forEach(function (o) {
          if (o.kind === 'lake') return;
          var pts = lid === 'rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
          if (!pts || pts.length < 2) return;
          var n = Geo.nearestOnPolyline(pts, p.x, p.y);
          if (n.dist <= maxDist && (!best || n.dist < best.dist)) {
            best = { pts:pts, len:n.len, dist:n.dist };
          }
        });
      });
      return best;
    },

    /* ================= NEHİR / YOL / BÖLGE ================= */
    pathLayerId: function (tool) {
      if (tool === 'river' || tool === 'lake') return 'rivers';
      if (tool === 'territory') return 'territories';
      if (tool === 'measure') return 'measures';
      return 'roads';
    },

    addPathPoint: function (p) {
      var snp = Cv.snapPoint(p);
      var lid = this.pathLayerId(App.tool);
      var L = Layers.get(lid);
      if (L.locked || !L.visible) { UI.msg(UI.t('locked')); return; }
      this.pathPts.push([snp.x, snp.y]);
      this.pathHover = snp;
    },

    finishPath: function () {
      var isLake      = App.tool === 'lake';
      var isTerritory = App.tool === 'territory';
      var isRiver     = App.tool === 'river';
      var isMeasure   = App.tool === 'measure';
      var minPts = (isLake || isTerritory) ? 3 : 2;
      if (this.pathPts.length < minPts) { this.pathPts = []; Cv.requestRender(); return; }
      var lid = this.pathLayerId(App.tool);
      var L = Layers.get(lid);
      var before = JSON.parse(JSON.stringify(L.objects));
      var o;
      if (isLake) {
        o = { id:uid(), kind:'lake', pts:this.pathPts.slice(),
              color:App.lake.color, opacity:App.lake.opacity };
      } else if (isTerritory) {
        o = { id:uid(), pts:this.pathPts.slice(), color:App.territory.color,
              opacity:App.territory.opacity, borderColor:App.territory.borderColor,
              borderWidth:App.territory.borderWidth };
      } else if (isRiver) {
        o = { id:uid(), pts:this.pathPts.slice(), width:App.river.width, meander:App.river.meander,
              taper:App.river.taper, color:App.river.color, opacity:1 };
      } else if (isMeasure) {
        o = { id:uid(), pts:this.pathPts.slice(), closed: App.measure.area && this.pathPts.length >= 3 };
      } else {
        o = { id:uid(), pts:this.pathPts.slice(), width:App.road.width, style:App.road.style,
              color:App.road.color, opacity:1 };
      }
      L.objects.push(o);
      this.pathPts = []; this.pathHover = null;
      App.selection = { layerId:lid, id:o.id };
      History.pushVector(lid, before, JSON.parse(JSON.stringify(L.objects)), lid);
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    cancelPath: function () { this.pathPts = []; this.pathHover = null; Cv.requestRender(); },

    undoPathPoint: function () {
      if (this.pathPts.length) { this.pathPts.pop(); Cv.requestRender(); return true; }
      return false;
    },

    /* ================= SEÇİM ================= */
    hitWindrose: function (p) {
      if (!App.windrose || !App.windrose.visible) return false;
      var b = Cv.windroseBounds(App.windrose);
      var m = App.windrose.size * 0.15;
      return p.x >= b.x-m && p.x <= b.x+b.w+m && p.y >= b.y-m && p.y <= b.y+b.h+m;
    },

    hitScale: function (p) {
      if (!App.scale || !App.scale.visible) return false;
      var b = Cv.scaleBounds(App.scale);
      var m = App.scale.size*0.6;
      return p.x >= b.x-m && p.x <= b.x+b.w+m && p.y >= b.y-m && p.y <= b.y+b.h+m;
    },

    hitTest: function (p) {
      var order = ['links','resources','labels','symbols','measures','roads','rivers','territories'];
      for (var i=0; i<order.length; i++) {
        var L = Layers.get(order[i]);
        if (!L.visible || L.locked) continue;
        for (var j=L.objects.length-1; j>=0; j--) {
          var o = L.objects[j];
          if (order[i] === 'links' || order[i] === 'resources') {
            var dxl = p.x-o.x, dyl = p.y-o.y;
            if (dxl*dxl + dyl*dyl <= (o.size||40)*(o.size||40)*0.36)
              return { layerId:order[i], id:o.id, obj:o };
          } else if (order[i] === 'symbols') {
            var b = Sym.bounds(o);
            if (p.x>=b.x && p.x<=b.x+b.w && p.y>=b.y && p.y<=b.y+b.h)
              return { layerId:'symbols', id:o.id, obj:o };
          } else if (order[i] === 'labels') {
            var lb = Cv.labelBounds(o);
            if (p.x>=lb.x-6 && p.x<=lb.x+lb.w+6 && p.y>=lb.y-6 && p.y<=lb.y+lb.h+6)
              return { layerId:'labels', id:o.id, obj:o };
          } else if (order[i] === 'territories') {
            if (o.pts && o.pts.length >= 3 && Cv._pointInPoly(p.x, p.y, Cv.lakeSmoothPts(o, 24)))
              return { layerId:'territories', id:o.id, obj:o };
          } else {
            var pts = order[i]==='rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
            if (Geo.distToPolyline(p.x, p.y, pts) < Math.max(8, (o.width||6)*0.9))
              return { layerId:order[i], id:o.id, obj:o };
          }
        }
      }
      return null;
    },

    startSelect: function (p, shiftKey) {
      var hit = this.hitTest(p);

      if (!hit) {
        /* rubber band başlat */
        if (!shiftKey) App.selection = null;
        this.rubberBand = { x0:p.x, y0:p.y, x1:p.x, y1:p.y };
        UI.refreshSelection();
        Cv.requestRender();
        return;
      }

      /* Shift+tık: çoklu seçime ekle/çıkar */
      if (shiftKey) {
        var sel = App.selection;
        /* mevcut multi seçim varsa */
        if (sel && sel.multi) {
          var idx = sel.ids.indexOf(hit.id);
          var nids = sel.ids.slice();
          var nobjs = sel.objs.slice();
          if (idx >= 0) { nids.splice(idx,1); nobjs.splice(idx,1); }
          else { nids.push(hit.id); nobjs.push(hit.obj); }
          App.selection = nids.length === 1
            ? { layerId:'symbols', id:nids[0] }
            : { multi:true, layerId:'symbols', ids:nids, objs:nobjs };
        } else if (sel && sel.layerId === 'symbols' && hit.layerId === 'symbols') {
          /* tekli → multi */
          App.selection = { multi:true, layerId:'symbols',
            ids:[sel.id, hit.id], objs:[this.findObj('symbols', sel.id), hit.obj] };
        } else {
          App.selection = { layerId:hit.layerId, id:hit.id };
        }
        UI.refreshSelection(); Cv.requestRender(); return;
      }

      /* normal tek seçim */
      /* eğer multi seçimde bir nesneye tıklandıysa — grubu taşı */
      if (App.selection && App.selection.multi && App.selection.ids.indexOf(hit.id) >= 0) {
        var L0 = Layers.get('symbols');
        this.dragging = {
          multi:true, sx:p.x, sy:p.y,
          objs: App.selection.objs.map(function(o){ return {o:o, ox:o.x, oy:o.y}; }),
          before: JSON.parse(JSON.stringify(L0.objects))
        };
        return;
      }

      App.selection = { layerId:hit.layerId, id:hit.id };
      var L = Layers.get(hit.layerId);
      this.dragging = {
        layerId:hit.layerId, obj:hit.obj, sx:p.x, sy:p.y,
        ox:hit.obj.x, oy:hit.obj.y,
        orig:hit.obj.pts ? JSON.parse(JSON.stringify(hit.obj.pts)) : null,
        groupOrig: hit.obj.kind === 'group' ? hit.obj.members.map(function(m){ return {x:m.x, y:m.y}; }) : null,
        before:JSON.parse(JSON.stringify(L.objects))
      };
      UI.refreshSelection();
    },

    findObj: function(layerId, id) {
      var L = Layers.get(layerId); if (!L) return null;
      for (var i=0; i<L.objects.length; i++) if (L.objects[i].id === id) return L.objects[i];
      return null;
    },

    selected: function () {
      if (!App.selection) return null;
      if (App.selection.layerId === 'scale') return App.scale;
      var L = Layers.get(App.selection.layerId);
      if (!L) return null;
      for (var i=0; i<L.objects.length; i++) if (L.objects[i].id === App.selection.id) return L.objects[i];
      return null;
    },

    deleteSelection: function () {
      var s = App.selection;
      if (!s || s.layerId === 'scale') return;
      if (s.multi) {
        var ids = s.ids.slice();
        /* semboller ve etiketler karışık olabilir — symbols layer'ından sil */
        var Ls = Layers.get('symbols');
        var bef = JSON.parse(JSON.stringify(Ls.objects));
        Ls.objects = Ls.objects.filter(function(o){ return ids.indexOf(o.id) < 0; });
        History.pushVector('symbols', bef, JSON.parse(JSON.stringify(Ls.objects)), 'multi:delete');
        App.selection = null;
        UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender(); return;
      }
      var L = Layers.get(s.layerId);
      var before = JSON.parse(JSON.stringify(L.objects));
      /* bölge bağlantısı silinince o bağlantının işaret ettiği alt harita
         verisi de temizlenir — yoksa proje dosyasında sonsuza dek öksüz kalır */
      if (s.layerId === 'links') {
        var delObj = L.objects.filter(function (o) { return o.id === s.id; })[0];
        if (delObj) App.deleteMapRecursive(delObj.targetMapId);
      }
      L.objects = L.objects.filter(function (o) { return o.id !== s.id; });
      App.selection = null;
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'delete');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    duplicateSelection: function () {
      if (!App.selection || App.selection.layerId === 'scale') return;
      var o = this.selected(); if (!o) return;
      var L = Layers.get(App.selection.layerId);
      var before = JSON.parse(JSON.stringify(L.objects));
      var c = JSON.parse(JSON.stringify(o));
      c.id = uid();
      /* bölge bağlantısı çoğaltılınca aynı alt haritayı paylaşmasın —
         her iğne kendi (boş) haritasına açılsın */
      if (App.selection.layerId === 'links') c.targetMapId = uid();
      var off = 40;
      if (c.pts) c.pts = c.pts.map(function (p) { return [p[0]+off, p[1]+off]; });
      else { c.x += off; c.y += off; }
      L.objects.push(c);
      App.selection = { layerId:App.selection.layerId, id:c.id };
      History.pushVector(App.selection.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'duplicate');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    bringForward: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx < L.objects.length-1) {
        var tmp = L.objects[idx]; L.objects[idx] = L.objects[idx+1]; L.objects[idx+1] = tmp;
      }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    sendBackward: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx > 0) {
        var tmp = L.objects[idx]; L.objects[idx] = L.objects[idx-1]; L.objects[idx-1] = tmp;
      }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    bringToFront: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx >= 0) { var o = L.objects.splice(idx,1)[0]; L.objects.push(o); }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    sendToBack: function () {
      var s = App.selection; if (!s || s.multi || s.layerId === 'scale') return;
      var L = Layers.get(s.layerId); if (!L) return;
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(o){ return o.id === s.id; });
      if (idx > 0) { var o = L.objects.splice(idx,1)[0]; L.objects.unshift(o); }
      History.pushVector(s.layerId, before, JSON.parse(JSON.stringify(L.objects)), 'zorder');
      UI.refreshHistory(); Cv.requestRender();
    },

    groupSelection: function () {
      var s = App.selection; if (!s || !s.multi) return;
      var L = Layers.get('symbols');
      var before = JSON.parse(JSON.stringify(L.objects));
      var members = s.ids.map(function(id){
        return JSON.parse(JSON.stringify(Tools.findObj('symbols', id)));
      }).filter(Boolean);
      if (!members.length) return;
      /* üyeleri sil */
      L.objects = L.objects.filter(function(o){ return s.ids.indexOf(o.id) < 0; });
      /* grup objesi ekle */
      var grp = { id:uid(), kind:'group', members:members };
      L.objects.push(grp);
      App.selection = { layerId:'symbols', id:grp.id };
      History.pushVector('symbols', before, JSON.parse(JSON.stringify(L.objects)), 'group');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    ungroupSelection: function () {
      var s = App.selection; if (!s || s.multi) return;
      var o = this.selected(); if (!o || o.kind !== 'group') return;
      var L = Layers.get('symbols');
      var before = JSON.parse(JSON.stringify(L.objects));
      var idx = L.objects.findIndex(function(ob){ return ob.id === o.id; });
      if (idx < 0) return;   /* grup listede yoksa splice(-1) yanlış nesneyi silerdi */
      var members = o.members || [];
      /* ES5: spread yerine apply — kod tabanının geri kalanıyla aynı seviyede kal */
      Array.prototype.splice.apply(L.objects, [idx, 1].concat(members));
      App.selection = members.length > 0
        ? { multi:true, layerId:'symbols', ids:members.map(function(m){return m.id;}), objs:members }
        : null;
      History.pushVector('symbols', before, JSON.parse(JSON.stringify(L.objects)), 'ungroup');
      UI.refreshHistory(); UI.refreshSelection(); Cv.requestRender();
    },

    applyToSelection: function (props) {
      var o = this.selected(); if (!o) return false;
      Object.keys(props).forEach(function (k) { o[k] = props[k]; });
      Cv.requestRender();
      return true;
    },

    commitSelectionEdit: function (beforeArr, label) {
      if (!App.selection || App.selection.layerId === 'scale') return;
      var L = Layers.get(App.selection.layerId);
      History.pushVector(App.selection.layerId, beforeArr, JSON.parse(JSON.stringify(L.objects)), label||'edit');
      UI.refreshHistory();
    },

    /* ================= ÜST KATMAN ================= */
    drawOverlay: function (ctx) {
      var z = Cv.zoom;

      if (this.lasso && this.lasso.pts.length) {
        var lp = this.lasso.pts;
        ctx.save();
        ctx.strokeStyle = '#78bfff'; ctx.lineWidth = 2/z; ctx.setLineDash([6/z, 4/z]);
        ctx.beginPath(); ctx.moveTo(lp[0][0], lp[0][1]);
        for (var li = 1; li < lp.length; li++) ctx.lineTo(lp[li][0], lp[li][1]);
        ctx.stroke();
        ctx.restore();
      }

      if (this.floating) {
        var f = this.floating, cx2 = f.center.x+f.ox, cy2 = f.center.y+f.oy;
        ctx.save();
        ctx.translate(cx2, cy2); ctx.rotate(f.rot);
        this.LASSO_LAYERS.forEach(function (lid) {
          if (f.layers[lid]) ctx.drawImage(f.layers[lid], -f.bbox.w/2, -f.bbox.h/2);
        });
        /* taşınan semboller/kaynaklar/etiketler/bağlantılar — bbox merkezine
           göre bağıl konumlarında, aynı çeviri+döndürme uzayı içinde önizlenir */
        Object.keys(f.vectorItems || {}).forEach(function (lid) {
          f.vectorItems[lid].forEach(function (o) {
            var rel = (lid === 'symbols' && o.kind === 'group')
              ? { kind:'group', members: o.members.map(function (m) {
                  return Object.assign({}, m, { x:m.x-f.center.x, y:m.y-f.center.y });
                }) }
              : Object.assign({}, o, { x:o.x-f.center.x, y:o.y-f.center.y });
            if (lid === 'symbols') {
              if (rel.kind === 'group') {
                rel.members.forEach(function (m) { Sym.draw(ctx, m.sym, m); });
              } else Sym.draw(ctx, o.sym, rel);
            } else if (lid === 'resources') Cv.drawResource(ctx, rel);
            else if (lid === 'labels') Cv.drawLabel(ctx, rel);
            else if (lid === 'links') Cv.drawLink(ctx, rel);
          });
        });
        ctx.strokeStyle = '#78bfff'; ctx.lineWidth = 2/z; ctx.setLineDash([8/z, 5/z]);
        ctx.strokeRect(-f.bbox.w/2, -f.bbox.h/2, f.bbox.w, f.bbox.h);
        ctx.setLineDash([]);
        var handleDist = f.bbox.h/2 + 30/z;
        ctx.beginPath(); ctx.moveTo(0, -f.bbox.h/2); ctx.lineTo(0, -handleDist); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -handleDist, 7/z, 0, Math.PI*2);
        ctx.fillStyle = '#78bfff'; ctx.fill();
        ctx.restore();
      }

      if (App.tool === 'eyedrop' && Eyedropper.picking && this.eyeStartPos) {
        var ep = this.eyeStartPos;
        ctx.save();
        ctx.strokeStyle = 'rgba(201,154,75,0.95)';
        ctx.lineWidth = 2/z;
        ctx.setLineDash([7/z, 5/z]);
        ctx.beginPath(); ctx.arc(ep.x, ep.y, App.eyedrop.radius, 0, Math.PI*2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (App.tool === 'eyedrop' && Eyedropper.sample && !Eyedropper.picking && !App.eyedrop.painting) {
        var s = Eyedropper.sample;
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = s.baseColor;
        ctx.lineWidth = 5/z;
        ctx.beginPath(); ctx.arc(s.cx, s.cy, s.radius, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
      }

      if (this.pathPts.length && App.tool === 'measure') {
        var mpts = this.pathPts.slice();
        if (this.pathHover) mpts.push([this.pathHover.x, this.pathHover.y]);
        if (mpts.length >= 2) {
          Cv.drawMeasure(ctx, { pts:mpts, closed: App.measure.area && mpts.length >= 3 });
        }
      } else if (this.pathPts.length) {
        var pts = this.pathPts.slice();
        if (this.pathHover) pts.push([this.pathHover.x, this.pathHover.y]);
        var sm = Geo.sample(pts, 14);
        ctx.save();
        if (App.tool === 'lake' || App.tool === 'territory') {
          var isTerr2 = App.tool === 'territory';
          ctx.strokeStyle = isTerr2 ? App.territory.borderColor : App.lake.color;
          ctx.fillStyle = isTerr2 ? App.territory.color : App.lake.color;
          ctx.globalAlpha = isTerr2 ? App.territory.opacity : 0.35;
          ctx.lineWidth = isTerr2 ? App.territory.borderWidth : 2/z;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          if (pts.length >= 3) {
            var lpath = Geo.polyPath(sm);
            lpath.closePath();
            ctx.fill(lpath);
          }
          ctx.globalAlpha = isTerr2 ? 1 : 0.75;
          ctx.stroke(Geo.polyPath(sm));
        } else {
          ctx.strokeStyle = App.tool === 'river' ? App.river.color : App.road.color;
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = Math.max(1/z, (App.tool==='river'?App.river.width:App.road.width));
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.stroke(Geo.polyPath(sm));
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#c08a3e';
        for (var i=0; i<this.pathPts.length; i++) {
          ctx.beginPath(); ctx.arc(this.pathPts[i][0], this.pathPts[i][1], 4/z, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
      }

      /* rubber band dikdörtgeni */
      if (this.rubberBand) {
        var rb = this.rubberBand;
        ctx.save();
        ctx.strokeStyle = '#c08a3e';
        ctx.fillStyle = 'rgba(201,154,75,0.08)';
        ctx.lineWidth = 1.5/z;
        ctx.setLineDash([5/z, 4/z]);
        var rbx=Math.min(rb.x0,rb.x1), rby=Math.min(rb.y0,rb.y1);
        var rbw=Math.abs(rb.x1-rb.x0), rbh=Math.abs(rb.y1-rb.y0);
        ctx.fillRect(rbx,rby,rbw,rbh);
        ctx.strokeRect(rbx,rby,rbw,rbh);
        ctx.restore();
      }

      /* multi seçim */
      if (App.selection && App.selection.multi) {
        ctx.save();
        ctx.strokeStyle = '#c08a3e';
        ctx.lineWidth = 1.5/z;
        ctx.setLineDash([6/z, 4/z]);
        App.selection.objs.forEach(function(obj) {
          var b = Sym.bounds(obj);
          ctx.strokeRect(b.x-4/z, b.y-4/z, b.w+8/z, b.h+8/z);
        });
        ctx.restore();
        return;
      }

      var o = this.selected();
      if (!o) return;
      ctx.save();
      ctx.strokeStyle = '#c08a3e';
      ctx.lineWidth = 1.5/z;
      ctx.setLineDash([6/z, 4/z]);
      if (App.selection.layerId === 'scale') {
        var sb = Cv.scaleBounds(o);
        ctx.strokeRect(sb.x-4/z, sb.y-4/z, sb.w+8/z, sb.h+8/z);
      } else if (o.pts) {
        var isClosed = App.selection.layerId === 'territories' || o.kind === 'lake';
        var g = isClosed ? Cv.lakeSmoothPts(o, 24) :
                App.selection.layerId === 'rivers' ? Cv.riverGeometry(o) : Cv.roadGeometry(o);
        var gp = Geo.polyPath(g);
        if (isClosed) gp.closePath();
        ctx.stroke(gp);
        ctx.setLineDash([]);
        this.drawPathHandles(ctx, o, isClosed, z);
        ctx.fillStyle = '#c08a3e';
        for (var k=0; k<o.pts.length; k++) {
          ctx.beginPath(); ctx.arc(o.pts[k][0], o.pts[k][1], 4/z, 0, Math.PI*2); ctx.fill();
        }
      } else if (o.kind === 'group') {
        var gb = Sym.bounds(o);
        ctx.strokeRect(gb.x-6/z, gb.y-6/z, gb.w+12/z, gb.h+12/z);
      } else if (App.selection.layerId === 'links' || App.selection.layerId === 'resources') {
        var r5 = (o.size||40)*0.6;
        ctx.beginPath(); ctx.arc(o.x, o.y, r5+4/z, 0, Math.PI*2); ctx.stroke();
      } else {
        var b = App.selection.layerId==='labels' ? Cv.labelBounds(o) : Sym.bounds(o);
        ctx.strokeRect(b.x-4/z, b.y-4/z, b.w+8/z, b.h+8/z);
        if (App.selection.layerId === 'symbols') this.drawResizeHandles(ctx, o, z);
      }
      ctx.restore();
    },

    /* seçili sembolün (döndürülmüş) köşe konumlarını dünya koordinatında verir */
    resizeHandlePositions: function (o) {
      var b = Sym.bounds(o);
      var hw = b.w/2, hh = b.h/2;
      var rot = (o.rot||0) * Math.PI/180;
      var cosR = Math.cos(rot), sinR = Math.sin(rot);
      return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(function (c) {
        return { x: o.x + c[0]*cosR - c[1]*sinR, y: o.y + c[0]*sinR + c[1]*cosR };
      });
    },

    /* seçili tek sembolün köşesine tıklandı mı? (grup ve çoklu seçimde yok) */
    hitTestResizeHandle: function (p) {
      if (!App.selection || App.selection.multi || App.selection.layerId !== 'symbols') return null;
      var o = this.selected();
      if (!o || o.kind === 'group') return null;
      var pts = this.resizeHandlePositions(o);
      var r = 8/Cv.zoom;
      for (var i = 0; i < pts.length; i++) {
        if (Math.hypot(p.x-pts[i].x, p.y-pts[i].y) <= r) return { obj:o, corner:i };
      }
      return null;
    },

    /* seçili sembolün köşelerine büyütme tutamacı çizer (diğer programlardaki gibi) */
    drawResizeHandles: function (ctx, o, z) {
      var pts = this.resizeHandlePositions(o);
      ctx.save();
      ctx.setLineDash([]);
      ctx.fillStyle = '#78bfff'; ctx.strokeStyle = '#4a3221'; ctx.lineWidth = 1/z;
      pts.forEach(function (pt) {
        ctx.fillRect(pt.x-5/z, pt.y-5/z, 10/z, 10/z);
        ctx.strokeRect(pt.x-5/z, pt.y-5/z, 10/z, 10/z);
      });
      ctx.restore();
    },

    /* seçili nehir/yol/göl/bölge için bezier tutamaçlarını çiz (sap + küçük kare) */
    drawPathHandles: function (ctx, o, closed, z) {
      var pts = o.pts;
      ctx.save();
      ctx.strokeStyle = 'rgba(120,190,255,0.9)';
      ctx.fillStyle = '#78bfff';
      ctx.lineWidth = 1/z;
      for (var i = 0; i < pts.length; i++) {
        var h = (o.handles && o.handles[i]) || Geo.autoHandle(pts, i, closed);
        var px = pts[i][0], py = pts[i][1];
        var hasNext = closed || i < pts.length - 1;
        var hasPrev = closed || i > 0;
        if (hasNext) {
          var ox = px + h.ox, oy = py + h.oy;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ox, oy); ctx.stroke();
          ctx.beginPath(); ctx.rect(ox-3/z, oy-3/z, 6/z, 6/z); ctx.fill();
        }
        if (hasPrev) {
          var ix = px + h.ix, iy = py + h.iy;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ix, iy); ctx.stroke();
          ctx.beginPath(); ctx.rect(ix-3/z, iy-3/z, 6/z, 6/z); ctx.fill();
        }
      }
      ctx.restore();
    },

    /* verilen ekran/harita noktasına en yakın tutamaç ucunu bul (seçili yol için) */
    hitTestHandle: function (p) {
      var s = App.selection;
      if (!s || s.multi || s.layerId === 'scale') return null;
      var o = this.selected();
      if (!o || !o.pts) return null;
      var closed = s.layerId === 'territories' || o.kind === 'lake';
      var thresh = 9 / Cv.zoom;
      for (var i = 0; i < o.pts.length; i++) {
        var h = (o.handles && o.handles[i]) || Geo.autoHandle(o.pts, i, closed);
        var px = o.pts[i][0], py = o.pts[i][1];
        var hasNext = closed || i < o.pts.length - 1;
        var hasPrev = closed || i > 0;
        if (hasNext) {
          var ox = px + h.ox, oy = py + h.oy;
          if (Math.hypot(p.x-ox, p.y-oy) < thresh) return { index:i, dir:'out', obj:o, closed:closed };
        }
        if (hasPrev) {
          var ix = px + h.ix, iy = py + h.iy;
          if (Math.hypot(p.x-ix, p.y-iy) < thresh) return { index:i, dir:'in', obj:o, closed:closed };
        }
      }
      return null;
    }
  };

  global.Tools = Tools;
  global.Eyedropper = Eyedropper;
  global.uid = uid;
})(window);
