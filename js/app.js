/* ============================================================
   Wayborne Map Editor — app.js  v0.11
   ============================================================ */
(function (global) {
  'use strict';

  var App = {
    tool: 'landmass',
    selection: null,
    exportReference: false,

    brush:   { size:120, roughness:0.35, color:'#ded0ac' },
    landgen: { template:'continent', roughness:0.5, rivers:false, lakes:false, terrain:false },
    stategen: { count:5, variety:0.35, cultureCount:4 },
    sea:     { color:'#7ba8bd' },
    terrain: { type:'grassland', size:160, opacity:0.85, clip:true },
    symbol:  { id:'ik_knight', size:72, rot:0, hue:0, opacity:1, wear:0, jitter:false,
               brushMode:false, brushDensity:0.5, clipToLand:true },
    river:   { width:16, meander:0.30, taper:true, color:'#5b8aa6' },
    road:    { width:6, style:'dashed', color:'#6b4f2a' },
    lake:    { color:'#5b8aa6', opacity:0.88 },
    territory: { color:'#8a5a3a', opacity:0.30, borderColor:'#5a3a20', borderWidth:2 },
    elevation: { brushSize:220, strength:0.5, lower:false,
                 showHillshade:true, showContours:false, contourInterval:32 },
    label:   { preset:'region', font:'serif', size:46, color:'#5a4326', outline:true,
               outlineColor:'#f5ecd8', shadow:true, curve:0, track:8, rot:0,
               caps:true, banner:null, snapPath:false },
    sketch:  { color:'#3a2b18', size:26, opacity:0.9, hardness:0.7, eraser:false },
    eyedrop: { radius:60, brushRadius:80, targetLayer:'terrain', hasSample:false, painting:false },
    resource:{ type:'mine', size:36 },
    measure: { area:false },
    reference:{ traceMode:false },
    currentLibId: null, currentCanvasName: 'Adsız harita',
    scale:   { visible:true, x:120, y:1880, len:420, size:26, segs:4, label:'200 km' },
    windrose:{ visible:false, x:0, y:0, size:120, style:'classic', color:'#3a2b18' },
    snap:    { enabled:false, size:64 },

    /* ================= ÇOKLU HARİTA (dünya ↔ bölge bağlantısı) =================
       Tek bir Layers/Cv/History dokümanı her zaman "aktif" haritadır. Bir bağlantı
       iğnesine çift tıklandığında aktif doküman App.maps altında serileştirilip
       hedef haritanın (varsa) serileştirilmiş hâli yüklenir; yoksa boş bir harita
       (App._blankSnapshot) başlatılır. Geri dönüş için App.mapStack bir yığın
       (breadcrumb) tutar. Undo geçmişi haritaya özeldir, geçişte sıfırlanır. */
    maps: {}, mapStack: [], currentMapId: 'root', currentMapLabel: '',

    /* Harita geçişi Layers.deserialize() üzerinden ASENKRON ilerler. Geçiş
       tamamlanmadan ikinci bir geçiş başlarsa currentMapId hâlâ eski haritayı
       gösterdiği için _snapshotLayers() o kimliğin altına YANLIŞ dokümanı
       yazar ve üst haritanın içeriği kaybolur. Bu bayrak, uçuştaki geçiş
       bitene kadar yeni geçişleri yok sayar. */
    _switching: false,

    /* Layers.serialize() vektör katmanlarda .objects dizisini referans olarak
       döndürür (JSON.stringify'a hazırlık amaçlı) — bellekte doküman olarak
       saklanacaksa mutlaka derin kopyalanmalı, yoksa iki "harita" aynı diziyi
       paylaşıp birbirini kirletir. */
    _snapshotLayers: function () { return JSON.parse(JSON.stringify(Layers.serialize(true))); },

    /* _blankSnapshot bir kez oluşturulup tekrar tekrar kullanılan tek bir
       nesnedir. Layers.deserialize vektör katmanlarda .objects dizisini
       KOPYALAMADAN doğrudan referans olarak atar (bkz. layers.js) — bu yüzden
       her yeni (daha önce hiç ziyaret edilmemiş) alt haritada _blankSnapshot'ı
       olduğu gibi geçirmek, o haritaların hepsinin AYNI diziyi paylaşmasına
       yol açar: birine eklenen bağlantı/nesne sessizce diğerlerinde de belirir
       (hatta döngüsel bağlantı gibi görünebilir). Her kullanımda derin kopya
       almak bu takılmayı önler. */
    _cloneBlank: function () { return JSON.parse(JSON.stringify(this._blankSnapshot)); },

    enterMap: function (targetId, label) {
      if (this._switching) return;
      if (targetId === this.currentMapId) return;
      this.maps[this.currentMapId] = this._snapshotLayers();
      this.mapStack.push({ id: this.currentMapId, label: this.currentMapLabel });
      var self = this;
      var snap = this.maps[targetId] || this._cloneBlank();
      this._switching = true;
      Layers.deserialize(snap).then(function () {
        self.currentMapId = targetId;
        self.currentMapLabel = label || '';
        self._afterMapSwitch();
      })['catch'](function () {})
        .then(function () { self._switching = false; });
    },

    /* Tüm harita ağacını (kök + iç içe bölge bağlantıları) tek bir düğüm
       nesnesi olarak kurar: { id, label, children:[...] }. Aktif haritayı
       önce App.maps'e senkronlar (enterMap'in yaptığı gibi) ki ağaç en
       güncel bağlantı kümesini yansıtsın. Bir hedef hiç ziyaret edilmediyse
       (App.maps'te kaydı yoksa) içinde başka bağlantı olamaz — dal orada
       yaprak olarak biter. visited koruması, bir bağlantının kendi atasına
       işaret ettiği (bozuk/döngüsel) uç durumda sonsuz özyinelemeyi önler. */
    buildMapTree: function () {
      this.maps[this.currentMapId] = this._snapshotLayers();
      var self = this, visited = {};
      function node(id, label) {
        if (visited[id]) return { id:id, label:label, children:[], cycle:true };
        visited[id] = true;
        var snap = self.maps[id];
        var linksLayer = snap && snap.filter(function (l) { return l.id === 'links'; })[0];
        var children = [];
        if (linksLayer && linksLayer.objects) {
          linksLayer.objects.forEach(function (o) {
            children.push(node(o.targetMapId, o.name || ''));
          });
        }
        return { id:id, label:label, children:children };
      }
      return node('root', '');
    },

    /* Harita ağacında herhangi bir düğüme doğrudan atlar (enterMap sadece
       bir adım ileri gidebiliyor). Kökten hedefe giden yolu bulup mapStack'i
       o yola göre yeniden kurar — enterMap'in adım adım yaptığı şeyin
       tek seferde eşdeğeri. */
    jumpToMap: function (targetId) {
      if (this._switching) return;
      if (targetId === this.currentMapId) return;
      var tree = this.buildMapTree();
      var path = null;
      (function walk(n, trail) {
        if (path) return;
        var t = trail.concat([n]);
        if (n.id === targetId) { path = t; return; }
        for (var i = 0; i < n.children.length && !path; i++) walk(n.children[i], t);
      })(tree, []);
      if (!path) return;

      var self = this;
      this.mapStack = path.slice(0, path.length - 1).map(function (n) { return { id:n.id, label:n.label }; });
      var target = path[path.length - 1];
      var snap = this.maps[targetId] || this._cloneBlank();
      this._switching = true;
      Layers.deserialize(snap).then(function () {
        self.currentMapId = targetId;
        self.currentMapLabel = target.label;
        self._afterMapSwitch();
      })['catch'](function () {})
        .then(function () { self._switching = false; });
    },

    /* Bir bölge bağlantısı silindiğinde yalnızca doğrudan hedefi değil,
       onun içindeki (ve onların içindeki...) tüm alt haritaları da siler —
       aksi hâlde bu veri hiçbir yerden erişilemez hâlde bellekte kalır. */
    deleteMapRecursive: function (id, visited) {
      visited = visited || {};
      if (visited[id]) return;
      visited[id] = true;
      var snap = this.maps[id];
      if (!snap) return;
      var self = this;
      var linksLayer = snap.filter(function (l) { return l.id === 'links'; })[0];
      if (linksLayer && linksLayer.objects) {
        linksLayer.objects.forEach(function (o) { self.deleteMapRecursive(o.targetMapId, visited); });
      }
      delete this.maps[id];
    },

    exitMap: function () {
      if (this._switching) return;
      if (!this.mapStack.length) return;
      this.maps[this.currentMapId] = this._snapshotLayers();
      var parent = this.mapStack.pop();
      var self = this;
      this._switching = true;
      Layers.deserialize(this.maps[parent.id] || this._cloneBlank()).then(function () {
        self.currentMapId = parent.id;
        self.currentMapLabel = parent.label;
        self._afterMapSwitch();
      })['catch'](function () {})
        .then(function () { self._switching = false; });
    },

    _afterMapSwitch: function () {
      App.selection = null;
      History.clear();
      Cv.shoreDirty = true; Cv.elevationDirty = true;
      if (global.UI) { UI.refreshAll(); UI.refreshBreadcrumb(); }
      Cv.fit();
    },

    init: function () {
      var size = 2048;
      Layers.init(size, size);
      this._blankSnapshot = this._snapshotLayers();
      Cv.init(size, size);
      Tools.bind();

      this.scale.x = Math.round(size * 0.06);
      this.scale.y = Math.round(size * 0.92);
      this.windrose.x = Math.round(size * 0.88);
      this.windrose.y = Math.round(size * 0.12);

      History.limit = 50;
      History.onChange = function () { if (global.UI) UI.refreshHistory(); };

      UI.init();
      Cv.fit();

      UI.msg('Wayborne Map Editor · ' + Sym.count() + ' ' + UI.t('symbols'));
      console.log('[WME] hazır — ' + Sym.count() + ' sembol, tuval ' + size + '×' + size);
    }
  };

  global.App = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }
})(window);
