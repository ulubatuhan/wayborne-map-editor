/* ============================================================
   Cartographer — history.js  v3
   50 adım geri/ileri. Raster yamaları bbox PNG olarak,
   vektör ve ölçek çubuğu JSON anlık görüntüsü olarak saklanır.
   rasterMulti: tek adımda birden çok katman (ör. silgi:
   kara + arazi aynı anda) — undo atomik kalır.
   ============================================================ */
(function (global) {
  'use strict';

  var imgCache = {};

  function loadImage(url) {
    if (imgCache[url]) return Promise.resolve(imgCache[url]);
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { imgCache[url] = im; res(im); };
      im.onerror = rej;
      im.src = url;
    });
  }

  function cropDataURL(srcCanvas, x, y, w, h) {
    var cw = Math.max(1, Math.round(w)), ch = Math.max(1, Math.round(h));
    /* Kutu zaten kaynağın tamamını kapsıyorsa (ör. kara/biyom üretimi
       tüm katmanı yeniden boyar) ayrı bir kırpma tuvaline kopyalamak
       gereksiz — 8192² gibi büyük tuvallerde bu tek kopyalama başlı
       başına ~1.3sn'ye mal oluyordu, üstelik her raster yaması için
       (before+after) iki kez çalışıyordu. Kaynağı doğrudan kodla. */
    if (Math.round(x) === 0 && Math.round(y) === 0 && cw === srcCanvas.width && ch === srcCanvas.height) {
      return srcCanvas.toDataURL('image/png');
    }
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var cx = c.getContext('2d');
    cx.drawImage(srcCanvas, Math.round(x), Math.round(y), cw, ch, 0, 0, cw, ch);
    return c.toDataURL('image/png');
  }

  function clampBox(box, canvas) {
    var x = Math.max(0, Math.floor(box.x)), y = Math.max(0, Math.floor(box.y));
    var w = Math.min(canvas.width - x, Math.ceil(box.w));
    var h = Math.min(canvas.height - y, Math.ceil(box.h));
    return { x:x, y:y, w:w, h:h };
  }

  var History = {
    stack: [], index: -1, limit: 50, busy: false, onChange: null,

    clear: function () { this.stack = []; this.index = -1; imgCache = {}; this._changed(); },
    _changed: function () { if (this.onChange) this.onChange(); },

    push: function (entry) {
      if (this.busy) return;
      this.stack.length = this.index + 1;
      this.stack.push(entry);
      if (this.stack.length > this.limit) this.stack.shift();
      this.index = this.stack.length - 1;
      this._changed();
    },

    /* ---- tek katman raster yaması ---- */
    pushRaster: function (layerId, beforeCanvas, afterCanvas, box, label) {
      var b = clampBox(box, afterCanvas);
      if (b.w <= 0 || b.h <= 0) return;
      this.push({
        kind:'raster', layerId:layerId, label:label || 'raster',
        x:b.x, y:b.y, w:b.w, h:b.h,
        before: cropDataURL(beforeCanvas, b.x, b.y, b.w, b.h),
        after:  cropDataURL(afterCanvas,  b.x, b.y, b.w, b.h)
      });
    },

    /* ---- çok katmanlı raster yaması ----
       patches: [{layerId, beforeCanvas, afterCanvas}]  ortak box  */
    pushRasterMulti: function (patches, box, label) {
      var items = [];
      for (var i = 0; i < patches.length; i++) {
        var p = patches[i];
        var b = clampBox(box, p.afterCanvas);
        if (b.w <= 0 || b.h <= 0) continue;
        items.push({
          layerId: p.layerId, x:b.x, y:b.y, w:b.w, h:b.h,
          before: cropDataURL(p.beforeCanvas, b.x, b.y, b.w, b.h),
          after:  cropDataURL(p.afterCanvas,  b.x, b.y, b.w, b.h)
        });
      }
      if (!items.length) return;
      this.push({ kind:'rasterMulti', items:items, label:label || 'raster' });
    },

    /* ---- karma yama: raster katman(lar) + vektör katman(lar) TEK adımda ----
       (kement ile taşıma: kara/arazi/yükselti rasteri + üstündeki sembol/
       kaynak/etiket/bağlantı nesneleri birlikte, tek undo/redo adımıyla) */
    pushCombo: function (rasterPatches, box, vectorParts, label) {
      var items = [];
      for (var i = 0; i < rasterPatches.length; i++) {
        var p = rasterPatches[i];
        var b = clampBox(box, p.afterCanvas);
        if (b.w <= 0 || b.h <= 0) continue;
        items.push({
          layerId: p.layerId, x:b.x, y:b.y, w:b.w, h:b.h,
          before: cropDataURL(p.beforeCanvas, b.x, b.y, b.w, b.h),
          after:  cropDataURL(p.afterCanvas,  b.x, b.y, b.w, b.h)
        });
      }
      var vitems = (vectorParts || []).map(function (v) {
        return { layerId: v.layerId, before: JSON.stringify(v.before), after: JSON.stringify(v.after) };
      });
      if (!items.length && !vitems.length) return;
      this.push({ kind:'combo', items:items, vitems:vitems, label: label || 'combo' });
    },

    pushVector: function (layerId, beforeArr, afterArr, label) {
      this.push({
        kind:'vector', layerId:layerId, label:label || 'vector',
        before: JSON.stringify(beforeArr), after: JSON.stringify(afterArr)
      });
    },

    pushMeta: function (beforeMeta, afterMeta, label) {
      this.push({
        kind:'meta', label:label || 'meta',
        before: JSON.stringify(beforeMeta), after: JSON.stringify(afterMeta)
      });
    },

    pushScale: function (beforeObj, afterObj, label) {
      this.push({
        kind:'scale', label:label || 'scale',
        before: JSON.stringify(beforeObj), after: JSON.stringify(afterObj)
      });
    },

    pushWindrose: function (beforeObj, afterObj, label) {
      this.push({
        kind:'windrose', label:label || 'windrose',
        before: JSON.stringify(beforeObj), after: JSON.stringify(afterObj)
      });
    },

    /* ---- kullanıcı katmanı ekleme/silme ----
       snap: Layers.snapshotLayer() çıktısı — id, sıradaki konum, tam kanvas
       içeriği ve meta. add'in undo'su remove'un redo'suyla, remove'un
       undo'su add'in redo'suyla aynı işlemi yapar; tek entry ikisini kapsar. */
    pushLayerAdd: function (snap, label) {
      this.push({ kind:'layerAdd', label:label || 'layer:add', snap: JSON.stringify(snap) });
    },

    pushLayerRemove: function (snap, label) {
      this.push({ kind:'layerRemove', label:label || 'layer:remove', snap: JSON.stringify(snap) });
    },

    _applyPatch: function (layerId, dataURL, x, y, w, h) {
      var layer = Layers.get(layerId);
      if (!layer || !layer.canvas) return Promise.resolve();
      return loadImage(dataURL).then(function (im) {
        var cx = layer.ctx;
        cx.save();
        cx.setTransform(1, 0, 0, 1, 0, 0);
        cx.globalCompositeOperation = 'source-over';
        cx.globalAlpha = 1;
        cx.clearRect(x, y, w, h);
        cx.drawImage(im, x, y);
        cx.restore();
        if (layerId === 'landmass' && global.Cv) Cv.shoreDirty = true;
        if (layerId === 'elevation' && global.Cv) Cv.elevationDirty = true;
      });
    },

    _apply: function (entry, dir) {
      var self = this;
      var pick = dir === 'undo' ? 'before' : 'after';

      if (entry.kind === 'raster') {
        return this._applyPatch(entry.layerId, entry[pick], entry.x, entry.y, entry.w, entry.h);
      }

      if (entry.kind === 'rasterMulti') {
        return Promise.all(entry.items.map(function (it) {
          return self._applyPatch(it.layerId, it[pick], it.x, it.y, it.w, it.h);
        }));
      }

      if (entry.kind === 'vector') {
        var l = Layers.get(entry.layerId);
        if (l) l.objects = JSON.parse(entry[pick]);
        if (global.App) App.selection = null;
        return Promise.resolve();
      }

      if (entry.kind === 'combo') {
        var proms = entry.items.map(function (it) {
          return self._applyPatch(it.layerId, it[pick], it.x, it.y, it.w, it.h);
        });
        entry.vitems.forEach(function (v) {
          var lv = Layers.get(v.layerId);
          if (lv) lv.objects = JSON.parse(v[pick]);
        });
        if (entry.vitems.length && global.App) App.selection = null;
        return Promise.all(proms);
      }

      if (entry.kind === 'meta') {
        Layers.applyMeta(JSON.parse(entry[pick]));
        if (global.Cv) Cv.shoreDirty = true;
        return Promise.resolve();
      }

      if (entry.kind === 'scale') {
        if (global.App) App.scale = JSON.parse(entry[pick]);
        return Promise.resolve();
      }

      if (entry.kind === 'windrose') {
        if (global.App) App.windrose = JSON.parse(entry[pick]);
        return Promise.resolve();
      }

      if (entry.kind === 'layerAdd') {
        var snapA = JSON.parse(entry.snap);
        if (dir === 'undo') { Layers.removeById(snapA.id); return Promise.resolve(); }
        return Layers.restoreLayer(snapA);
      }

      if (entry.kind === 'layerRemove') {
        var snapR = JSON.parse(entry.snap);
        if (dir === 'undo') return Layers.restoreLayer(snapR);
        Layers.removeById(snapR.id);
        return Promise.resolve();
      }

      return Promise.resolve();
    },

    undo: function () {
      if (this.index < 0 || this.busy) return Promise.resolve(false);
      var e = this.stack[this.index], self = this;
      this.busy = true;
      return this._apply(e, 'undo').then(function () {
        self.index--;
        self.busy = false;
        self._changed();
        Cv.requestRender();
        if (global.UI) UI.refreshAll();
        return true;
      });
    },

    redo: function () {
      if (this.index >= this.stack.length - 1 || this.busy) return Promise.resolve(false);
      var e = this.stack[this.index + 1], self = this;
      this.busy = true;
      return this._apply(e, 'redo').then(function () {
        self.index++;
        self.busy = false;
        self._changed();
        Cv.requestRender();
        if (global.UI) UI.refreshAll();
        return true;
      });
    },

    goto: function (target) {
      var self = this;
      function step() {
        if (self.index === target) return Promise.resolve();
        if (self.index > target) return self.undo().then(step);
        return self.redo().then(step);
      }
      return step();
    },

    canUndo: function () { return this.index >= 0; },
    canRedo: function () { return this.index < this.stack.length - 1; }
  };

  global.History = History;
})(window);
