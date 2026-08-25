/**
 * Kapsamlı entegrasyon testi — tüm modüller ve kritik akışlar.
 * CDP ile headless Chromium; hiçbir şey mock'lanmaz, gerçek uygulama koşar.
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8768, CDP_PORT = 9225;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';

function startServer() {
  const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'};
  const srv = createServer((req, res) => {
    let p = join(BASE_DIR, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    try { res.writeHead(200,{'Content-Type':MIME[extname(p)]||'text/plain'}); res.end(readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

async function connectCDP() {
  const resp = JSON.parse(execSync(`curl -s http://localhost:${CDP_PORT}/json/list`));
  const wsUrl = resp[0].webSocketDebuggerUrl;
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = {};
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        const ex = m.params.exceptionDetails;
        console.error('  [SAYFA HATASI]', ex.text, (ex.exception?.description||'').split('\n')[0]);
      }
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      })
    }));
    ws.addEventListener('error', e => rej(e));
  });
}

const evaluate = (cdp, expression, awaitPromise=false) =>
  cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });

const TEST_CODE = `(async function () {
  const R = [];
  const ok = (grp, name, cond, detail) => R.push({grp, name, pass: !!cond, detail: detail||''});
  const wait = ms => new Promise(r => setTimeout(r, ms));

  try {
    /* ---------- 1. MODÜL YÜKLEME ---------- */
    ['Iso','IsoCatalog','Sym','NameI18N','Names','History','Layers','Cv','Geo','Tools','Exporter','UI','App']
      .forEach(m => ok('Modüller', m + ' global', typeof window[m] !== 'undefined'));

    /* ---------- 2. SEMBOL KATALOĞU ---------- */
    const cats = Object.keys(Sym.SYMBOLS);
    ok('Semboller', 'kategori sayısı > 0', cats.length > 0, cats.length + ' kategori');
    let total = 0, badId = [], dupId = [], seen = new Set();
    cats.forEach(c => (Sym.SYMBOLS[c].items||[]).forEach(it => {
      total++;
      if (!it.id) badId.push(c);
      else if (seen.has(it.id)) dupId.push(it.id);
      else seen.add(it.id);
    }));
    ok('Semboller', 'toplam sembol = Sym.count()', total === Sym.count(), total + ' vs ' + Sym.count());
    ok('Semboller', 'tüm sembollerin id\\'si var', badId.length === 0, badId.length ? badId.join(',') : '');
    ok('Semboller', 'id çakışması yok', dupId.length === 0, dupId.length ? dupId.slice(0,5).join(',') : '');
    /* her sembol gerçekten çizilebiliyor mu */
    const tc = document.createElement('canvas'); tc.width = tc.height = 64;
    const tctx = tc.getContext('2d');
    let drawFail = [];
    seen.forEach(id => {
      try { Sym.draw(tctx, id, {x:32,y:32,size:50,rot:0,hue:0,opacity:1}); }
      catch(e) { drawFail.push(id); }
    });
    ok('Semboller', 'hepsi hatasız çiziliyor', drawFail.length === 0,
       drawFail.length ? drawFail.length + ' hata: ' + drawFail.slice(0,3).join(',') : total + ' sembol');

    /* ---------- 3. ARAZİ ---------- */
    const tk = Object.keys(Terrain.TERRAIN || {});
    ok('Arazi', 'arazi tipi tanımlı', tk.length > 0, tk.length + ' tip');
    const badTerrain = tk.filter(k => { const d = Terrain.TERRAIN[k]; return !d.base || !d.tr || !d.en; });
    ok('Arazi', 'hepsinde base/tr/en var', badTerrain.length === 0, badTerrain.join(','));
    ok('Arazi', 'swatch üretiliyor', (() => {
      try { return !!Terrain.swatch(tk[0]); } catch(e) { return false; }
    })());

    /* ---------- 4. İSİM ÜRETECİ (tohumlu determinizm) ---------- */
    const cults = Names.cultureList('tr').map(c => c.key);
    ok('İsimler', 'kültür sayısı', cults.length > 0, cults.length + ' kültür');
    const n1 = Names.generate(cults[0], 'city', 'tr', 12345);
    const n2 = Names.generate(cults[0], 'city', 'tr', 12345);
    ok('İsimler', 'aynı tohum → aynı ad', n1 === n2, n1 + ' / ' + n2);
    const n3 = Names.generate(cults[0], 'city', 'tr', 99999);
    ok('İsimler', 'farklı tohum → farklı ad', n1 !== n3, n1 + ' vs ' + n3);
    let emptyName = 0;
    cults.forEach(c => ['settlement','city','river','mountain','forest','region','lake','sea'].forEach(f => {
      if (!Names.generate(c, f, 'tr', 7)) emptyName++;
    }));
    ok('İsimler', 'tüm kültür×tür kombinasyonu ad üretiyor', emptyName === 0, emptyName + ' boş');

    /* ---------- 5. KATMANLAR ---------- */
    ok('Katmanlar', 'yerleşik katman sayısı', Layers.list.length >= 13, Layers.list.length + ' katman');
    const noCanvas = Layers.list.filter(l => l.type === 'raster' && !l.canvas);
    ok('Katmanlar', 'raster katmanların canvas\\'ı var', noCanvas.length === 0);
    const noObjects = Layers.list.filter(l => l.type === 'vector' && !Array.isArray(l.objects));
    ok('Katmanlar', 'vektör katmanların objects dizisi var', noObjects.length === 0);

    /* ---------- 6. HARİTA ÜRETİMİ (3 şablon) ---------- */
    Exporter.newProject(1024, 1024, 'test');
    await wait(400);
    for (const tpl of ['island','continent','archipelago']) {
      const L = Layers.get('landmass');
      L.ctx.clearRect(0,0,1024,1024);
      const t0 = performance.now();
      Tools.generateLandmass(tpl, 0.55, 42);
      const dt = performance.now() - t0;
      const d = L.ctx.getImageData(0,0,1024,1024).data;
      let landPx = 0;
      for (let i = 3; i < d.length; i += 4*37) if (d[i] > 128) landPx++;
      const totalSampled = Math.floor(d.length / (4*37));
      const ratio = landPx / totalSampled;
      ok('Harita üretimi', tpl + ' kara üretti', ratio > 0.01 && ratio < 0.95,
         '%' + (ratio*100).toFixed(1) + ' kara, ' + dt.toFixed(0) + 'ms');
      ok('Harita üretimi', tpl + ' makul sürede (<3sn)', dt < 3000, dt.toFixed(0) + 'ms');
    }
    /* aynı tohum → aynı harita */
    const LL = Layers.get('landmass');
    Tools.generateLandmass('continent', 0.5, 777);
    const sig1 = LL.canvas.toDataURL().length;
    Tools.generateLandmass('continent', 0.5, 777);
    const sig2 = LL.canvas.toDataURL().length;
    ok('Harita üretimi', 'aynı tohum → aynı harita', sig1 === sig2, sig1 + ' / ' + sig2);

    /* ---------- 7. GEÇMİŞ (undo/redo tüm tipler) ---------- */
    History.clear();
    ok('Geçmiş', 'temizlenince undo yok', !History.canUndo());
    /* vektör */
    const SL = Layers.get('symbols');
    const vBefore = JSON.parse(JSON.stringify(SL.objects));
    SL.objects.push({id:'test_sym', x:100, y:100, size:40, rotation:0});
    History.pushVector('symbols', vBefore, JSON.parse(JSON.stringify(SL.objects)), 'test');
    const cnt = SL.objects.length;
    await History.undo();
    ok('Geçmiş', 'vektör undo', SL.objects.length === cnt - 1);
    await History.redo();
    ok('Geçmiş', 'vektör redo', SL.objects.length === cnt);
    /* windrose (serialize düzeltmesi) */
    const wBefore = JSON.parse(JSON.stringify(App.windrose));
    App.windrose.size = 199;
    History.pushWindrose(wBefore, JSON.parse(JSON.stringify(App.windrose)), 'test');
    await History.undo();
    ok('Geçmiş', 'pusula gülü undo', App.windrose.size === wBefore.size, App.windrose.size + '');
    await History.redo();
    ok('Geçmiş', 'pusula gülü redo', App.windrose.size === 199, App.windrose.size + '');

    /* ---------- 7b. GRUPLA / GRUBU ÇÖZ (ES5 splice düzeltmesi) ---------- */
    const GL = Layers.get('symbols');
    GL.objects.length = 0;
    const symId = [...seen][0];
    ['g1','g2','g3'].forEach((id, i) => GL.objects.push(
      { id, kind:'symbol', symId, x:100+i*50, y:100, size:40, rotation:0 }));
    App.selection = { multi:true, layerId:'symbols', ids:['g1','g2','g3'],
                      objs: GL.objects.slice() };
    if (typeof Tools.groupSelection === 'function') {
      Tools.groupSelection();
      ok('Gruplama', 'grup oluştu', GL.objects.length === 1 && GL.objects[0].kind === 'group',
         GL.objects.length + ' nesne');
      const grp = GL.objects[0];
      App.selection = { layerId:'symbols', id: grp.id };
      Tools.ungroupSelection();
      ok('Gruplama', 'grup çözüldü, 3 üye geri geldi', GL.objects.length === 3,
         GL.objects.length + ' nesne');
      ok('Gruplama', 'üye id\\'leri korundu',
         ['g1','g2','g3'].every(id => GL.objects.some(o => o.id === id)),
         GL.objects.map(o => o.id).join(','));
      /* idx<0 koruması: listede olmayan bir grubu çözmeye çalış */
      const lenBefore = GL.objects.length;
      App.selection = { layerId:'symbols', id:'YOK_BOYLE_BIR_ID' };
      try { Tools.ungroupSelection(); } catch(e) {}
      ok('Gruplama', 'olmayan grup listeyi bozmuyor', GL.objects.length === lenBefore,
         lenBefore + ' → ' + GL.objects.length);
    }
    GL.objects.length = 0;
    App.selection = null;

    /* ---------- 8. PROJE KAYDET/YÜKLE (round-trip) ---------- */
    App.windrose.visible = true; App.windrose.size = 155; App.windrose.x = 321; App.windrose.style = 'minimal';
    App.scale.label = 'ROUNDTRIP-TEST';
    Cv.gridType = 'hex'; Cv.grid = true; Cv.gridSize = 96;
    /* buildProjectData canlı referans döndürür (saveProject/libSave onu anında
       stringify ettiği için gerçek kullanımda sorun değil) — testte state'i
       bozmadan önce anlık kopya alıyoruz, tıpkı kayıt yolunun yaptığı gibi. */
    const data = JSON.parse(JSON.stringify(Exporter.buildProjectData()));
    ok('Kaydet/Yükle', 'windrose serialize ediliyor', !!data.windrose, JSON.stringify(data.windrose||null));
    ok('Kaydet/Yükle', 'scale serialize ediliyor', !!data.scale);
    ok('Kaydet/Yükle', 'JSON\\'a çevrilebiliyor', (() => { try { JSON.parse(JSON.stringify(data)); return true; } catch(e){ return false; } })());
    /* state'i boz, sonra geri yükle */
    App.windrose = {visible:false, x:0, y:0, size:120, style:'classic', color:'#000'};
    App.scale.label = 'BOZULDU'; Cv.gridType = 'square'; Cv.gridSize = 128;
    await Exporter.applyProjectData(JSON.parse(JSON.stringify(data)));
    await wait(300);
    ok('Kaydet/Yükle', 'windrose geri yüklendi', App.windrose.size === 155 && App.windrose.x === 321 && App.windrose.style === 'minimal',
       JSON.stringify(App.windrose));
    ok('Kaydet/Yükle', 'scale geri yüklendi', App.scale.label === 'ROUNDTRIP-TEST', App.scale.label);
    ok('Kaydet/Yükle', 'grid ayarları geri yüklendi', Cv.gridType === 'hex' && Cv.gridSize === 96, Cv.gridType+'/'+Cv.gridSize);

    /* ---------- 9. KULLANICI KATMANI round-trip ---------- */
    const before = Layers.customCount();
    const ul = Layers.addCustom('Test Katmanı', Cv.W, Cv.H);
    ok('Kullanıcı katmanı', 'eklendi', !!ul && Layers.customCount() === before + 1);
    if (ul) {
      ul.ctx.fillStyle = '#00ff00'; ul.ctx.fillRect(5,5,40,40);
      const d2 = Exporter.buildProjectData();
      const hasCustom = (d2.maps.root || d2.layers || []).some(l => l.custom && l.name === 'Test Katmanı');
      ok('Kullanıcı katmanı', 'serialize ediliyor', hasCustom);
      await Exporter.applyProjectData(JSON.parse(JSON.stringify(d2)));
      await wait(300);
      const restored = Layers.list.find(l => l.custom && l.name === 'Test Katmanı');
      ok('Kullanıcı katmanı', 'geri yüklendi', !!restored);
      if (restored) {
        const px = restored.ctx.getImageData(20,20,1,1).data;
        ok('Kullanıcı katmanı', 'piksel verisi korundu', px[1] > 200 && px[3] > 200, [...px].join(','));
      }
    }

    /* ---------- 10. ÇOKLU HARİTA (bölge bağlantısı) ---------- */
    const rootId = App.currentMapId;
    const subId = 'test_submap_' + Date.now();
    await App.enterMap(subId, 'Test Bölgesi');
    await wait(400);
    ok('Çoklu harita', 'alt haritaya girildi', App.currentMapId === subId, App.currentMapId);
    ok('Çoklu harita', 'breadcrumb yığını doldu', App.mapStack.length > 0, App.mapStack.length + '');
    /* alt haritada çizim yap */
    const subL = Layers.get('landmass');
    subL.ctx.fillStyle = '#fff'; subL.ctx.fillRect(0,0,200,200);
    await App.exitMap();
    await wait(400);
    ok('Çoklu harita', 'ana haritaya dönüldü', App.currentMapId === rootId, App.currentMapId);
    ok('Çoklu harita', 'alt harita saklandı', !!App.maps[subId]);

    /* ---------- 11. DIŞA AKTARMA ---------- */
    const png = Exporter.renderToCanvas(256, 256);
    ok('Dışa aktarma', 'PNG canvas üretiliyor', png && png.width === 256 && png.height === 256);
    ok('Dışa aktarma', 'PNG boş değil', (() => {
      const d3 = png.getContext('2d').getImageData(0,0,256,256).data;
      for (let i = 3; i < d3.length; i += 4) if (d3[i] > 0) return true;
      return false;
    })());
    ok('Dışa aktarma', 'labelSVG fonksiyonu var', typeof Exporter.labelSVG === 'function');
    ok('Dışa aktarma', 'windroseSVG fonksiyonu var', typeof Exporter.windroseSVG === 'function');
    ok('Dışa aktarma', 'html/print fonksiyonları var',
       typeof Exporter.html === 'function' && typeof Exporter.print === 'function');

    /* ---------- 12. i18n ---------- */
    const langs = ['tr','en','de','fr','es','it','pt','nl','pl','ar','ru'];
    const origLang = UI.lang;
    let langFail = [], sameAsTr = [];
    const trNew = (UI.lang = 'tr', UI.t('new'));
    langs.forEach(lc => {
      try {
        UI.lang = lc;
        const v = UI.t('new'), v2 = UI.t('save'), v3 = UI.t('o_landmass');
        if (!v || !v2 || !v3) langFail.push(lc);
        /* tr dışındaki diller tr ile birebir aynıysa çeviri düşmüş demektir */
        else if (lc !== 'tr' && v === trNew && lc !== 'nl') sameAsTr.push(lc);
      } catch(e) { langFail.push(lc + '(hata)'); }
    });
    UI.lang = origLang;
    ok('i18n', 'tüm diller çeviri döndürüyor', langFail.length === 0, langs.length + ' dil, ' + (langFail.join(',')||'hepsi tam'));
    ok('i18n', 'çeviriler gerçekten farklı', sameAsTr.length === 0, sameAsTr.join(',') || 'tümü ayrışıyor');

    /* DICT tamlığı: 9 dil için "İngilizce'ye düş" yalnızca güvenlik ağı
       olmalı, normal durum olmamalı — bu anahtarlar (çoğu Faz A/B/C'de ve
       kara üretimi/Bölgeler/Görevler işinde eklendi) tüm 11 dilde gerçek
       çeviriye sahip olmalı. Değeri İngilizce'yle birebir aynıysa (ve
       gerçekten farklı olması beklenen bir anahtarsa) çeviri düşmüş demektir. */
    const fullKeys = ['copy','copied','o_seacolor','o_landgen_rivers','o_landgen_lakes','o_landgen_terrain',
      'lakegen_none','tab_regions','tab_todo','regions_political','regions_maptree','todo_add','todo_empty',
      'todo_placeholder','panel_toggle_left','panel_toggle_right','sc_title','sc_undo','sc_redo','sc_save',
      'sc_pan','sc_zoom','sc_fit','sc_finish','sc_cancel','sc_delete','sc_rotsym','sc_general','sc_help',
      'o_biomegen','o_rivergen','o_roadgen','o_settlegen','o_symlegend','share_editbtn','exp_share_t'];
    /* Bazı çeviriler İngilizce'yle tesadüfen aynı yazılır (ör. İspanyolca
       "General" == İngilizce "General") — bunlar sahte pozitif üretmesin
       diye eşitlik kontrolünden muaf tutulur, ama yine de boş olamazlar. */
    const cognateOk = new Set(['sc_general']);
    const otherLangs = langs.filter(l => l !== 'tr' && l !== 'en');
    const enSnapshot = (UI.lang = 'en', Object.fromEntries(fullKeys.map(k => [k, UI.t(k)])));
    let i18nGaps = [];
    otherLangs.forEach(lc => {
      UI.lang = lc;
      fullKeys.forEach(k => {
        const v = UI.t(k);
        if (!v || (v === enSnapshot[k] && !cognateOk.has(k))) i18nGaps.push(lc + '.' + k);
      });
    });
    UI.lang = origLang;
    ok('i18n', 'yeni anahtarlar 11 dilde de gerçek çeviriye sahip', i18nGaps.length === 0,
       i18nGaps.length ? i18nGaps.slice(0,8).join(', ') + (i18nGaps.length>8?' …':'') : (otherLangs.length+' dil × '+fullKeys.length+' anahtar, hepsi tam'));

    const rtl = Object.keys(UI.RTL_LANGS || {});
    ok('i18n', 'RTL dilleri tanımlı', rtl.length > 0, rtl.join(','));
    ok('i18n', 'isRTL doğru çalışıyor', UI.isRTL('ar') === true && UI.isRTL('en') === false);

    /* Her data-i18n referansının DICT'te gerçek bir karşılığı var mı?
       UI.t() bilinmeyen anahtarda ANAHTARIN KENDİSİNİ döndürdüğü için,
       eksik bir anahtar hata vermez — sessizce ekranda ham anahtar adı
       olarak görünür ("o_measurearea" gibi). Bu, tam olarak öyle bir
       hatanın canlıya çıkmasından sonra eklendi. */
    const danglingI18n = [];
    ['data-i18n', 'data-i18n-title', 'data-i18n-placeholder'].forEach(attr => {
      document.querySelectorAll('[' + attr + ']').forEach(el => {
        const k = el.getAttribute(attr);
        if (UI.t(k) === k) danglingI18n.push(attr + '=' + k);
      });
    });
    ok('i18n', 'her data-i18n referansının karşılığı var', danglingI18n.length === 0,
       danglingI18n.length ? [...new Set(danglingI18n)].join(', ')
                           : document.querySelectorAll('[data-i18n]').length + ' referans çözümlendi');
    ok('i18n', 'i18nName katalog adı çeviriyor', (() => {
      const s = Sym.SYMBOLS[cats[0]].items[0];
      return !!window.i18nName(s.id, s.tr, s.en, 'de');
    })());
    ok('i18n', '894 sembolün tamamı Arapça\\'ya çevrildi', (() => {
      const arabicRe = /[؀-ۿ]/;
      let total = 0, withAr = 0;
      const seen = new Set();
      Object.keys(Sym.SYMBOLS).forEach(cat => {
        Sym.SYMBOLS[cat].items.forEach(def => {
          if (seen.has(def.id)) return;
          seen.add(def.id);
          total++;
          const name = window.i18nName(def.id, def.tr, def.en, 'ar');
          if (arabicRe.test(name)) withAr++;
        });
      });
      return total === 894 && withAr === 894;
    })());

    /* ---------- 13. RENDER ---------- */
    const t1 = performance.now();
    Cv.render();
    const rt = performance.now() - t1;
    ok('Render', 'render hatasız çalışıyor', true, rt.toFixed(1) + 'ms');
    ok('Render', 'render bütçe içinde (<16.67ms)', rt < 16.67, rt.toFixed(1) + 'ms');
    ok('Render', 'karmaşık metin tespiti', typeof Cv.isComplexText === 'function' && Cv.isComplexText('مرحبا') === true);
    ok('Render', 'RTL metin tespiti', typeof Cv.isRTLText === 'function' && Cv.isRTLText('مرحبا') === true);
    ok('Render', 'latin metin karmaşık değil', Cv.isComplexText('Wayborne') === false);

    /* ---------- 14. SERVICE WORKER ---------- */
    ok('Service Worker', 'tarayıcı destekliyor', 'serviceWorker' in navigator);
    const swReg = await navigator.serviceWorker.getRegistration();
    ok('Service Worker', 'kayıtlı', !!swReg, swReg ? swReg.scope : 'kayıt yok');

    window.__R = R;
    window.__DONE = true;
  } catch (e) {
    window.__R = R;
    window.__ERR = e.message + '\\n' + e.stack;
    window.__DONE = true;
  }
})();`;

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1400,900', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3500);
  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 50; i++) {
      const r = await evaluate(cdp, 'typeof Cv!=="undefined"&&typeof UI!=="undefined"&&typeof Tools!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(400);
      if (i === 49) throw new Error('Sayfa yüklenmedi');
    }
    await evaluate(cdp, 'UI.showView("editor")');
    await sleep(600);

    await evaluate(cdp, TEST_CODE, true);
    for (let i = 0; i < 60; i++) {
      const d = await evaluate(cdp, 'window.__DONE===true');
      if (d.result?.value) break;
      await sleep(500);
    }

    const errR = await evaluate(cdp, 'window.__ERR||""');
    const resR = await evaluate(cdp, 'JSON.stringify(window.__R||[])');
    const results = JSON.parse(resR.result?.value || '[]');

    /* ---------- DICT tamlığı (Node tarafı: kaynağı doğrudan ayrıştırır) ----------
       Tarayıcı tarafından yapılamıyor çünkü DICT bir closure değişkeni, UI'da
       dışa açık değil. Buradaki tarayıcı DİZE-FARKINDA: bir çevirinin İÇİNDE
       geçen "... canvas size:'" gibi diziler anahtar sanılmasın diye (naif bir
       regex tam olarak orada yanılıyor). */
    (() => {
      const src = readFileSync(join(BASE_DIR, 'js/ui.js'), 'utf8');
      const keysOf = (lang) => {
        const open = new RegExp('\\n    ' + lang + ':\\s*\\{');
        const mm = open.exec(src);
        if (!mm) return null;
        let i = mm.index + mm[0].length, depth = 1, buf = '';
        const keys = new Set();
        while (i < src.length && depth > 0) {
          const c = src[i];
          if (c === "'" || c === '"') {                 /* dizeyi bütün olarak atla */
            const q = c; i++;
            while (i < src.length) {
              if (src[i] === '\\') i += 2;
              else if (src[i] === q) { i++; break; }
              else i++;
            }
            buf = ''; continue;
          }
          if (c === '{') { depth++; buf = ''; i++; continue; }
          if (c === '}') { depth--; buf = ''; i++; continue; }
          if (depth === 1) {
            if (/[A-Za-z0-9_]/.test(c)) buf += c;
            else if (c === ':') { if (buf) keys.add(buf); buf = ''; }
            else buf = '';
          }
          i++;
        }
        return keys;
      };
      const LANGS = ['tr','en','de','fr','es','it','pt','nl','pl','ar','ru'];
      const table = {};
      for (const l of LANGS) {
        const k = keysOf(l);
        if (!k) { results.push({ grp:'i18n', name:'DICT dil bloğu bulundu: '+l, pass:false, detail:'blok yok' }); return; }
        table[l] = k;
      }
      const gaps = [];
      for (const l of LANGS) {
        if (l === 'tr') continue;
        for (const k of table.tr) if (!table[l].has(k)) gaps.push(l + '.' + k);
      }
      results.push({
        grp: 'i18n',
        name: 'her DICT anahtarı 11 dilde de tanımlı',
        pass: gaps.length === 0,
        detail: gaps.length ? gaps.slice(0, 10).join(', ') + (gaps.length > 10 ? ' …' : '')
                            : LANGS.length + ' dil × ' + table.tr.size + ' anahtar'
      });
    })();

    const groups = [];
    results.forEach(r => {
      let g = groups.find(x => x.name === r.grp);
      if (!g) { g = { name: r.grp, items: [] }; groups.push(g); }
      g.items.push(r);
    });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║        WAYBORNE — KAPSAMLI ENTEGRASYON TESTİ            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    let pass = 0, fail = 0;
    groups.forEach(g => {
      const gp = g.items.filter(i => i.pass).length;
      console.log('\n▌ ' + g.name + '  (' + gp + '/' + g.items.length + ')');
      g.items.forEach(i => {
        if (i.pass) pass++; else fail++;
        console.log('   ' + (i.pass ? '✓' : '✗') + ' ' + i.name + (i.detail ? '  — ' + i.detail : ''));
      });
    });
    console.log('\n' + '─'.repeat(60));
    console.log('TOPLAM: ' + pass + ' geçti, ' + fail + ' başarısız  (' + results.length + ' test)');
    if (errR.result?.value) {
      console.log('\n⚠ TEST SIRASINDA HATA:\n' + errR.result.value);
    }
    console.log(fail === 0 && !errR.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAŞARISIZ TESTLER VAR');
    process.exit(fail === 0 && !errR.result?.value ? 0 : 1);

  } finally { cdp?.close(); chrome.kill(); srv.close(); }
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
