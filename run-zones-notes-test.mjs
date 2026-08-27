/**
 * Bölge/veri editör araçları (docs/afmg-parity-plan.md § #6):
 * bölge tipleri (zones), nesne notları, kullanıcı tanımlı isim tabanı
 * kültürleri ve adlandırılmış kara-üretim şablonları — hepsi tek adımlık
 * undo, proje kaydına round-trip ve GeoJSON'a taşınma dahil. Diğer test
 * runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8790, CDP_PORT = 9290;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';

function startServer() {
  const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css'};
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
        console.error('[browser ERROR]', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description || '');
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

async function evaluate(cdp, expression, awaitPromise=false) {
  return cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
}

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  try {
    const cdp = await connectCDP();
    await cdp.send('Runtime.enable');
    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Tools!=="undefined"&&typeof Layers!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      var results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

      Layers.init(1024, 1024); Cv.setSize(1024, 1024); History.clear();
      Tools.generateLandmass('continent', 0.5, 42);

      var Tv = Layers.get('territories');
      var poly = [[200,200],[700,220],[720,700],[240,680]];
      Tv.objects.push({ id:'zone_test', pts:poly, color:'#8a5a3a', borderWidth:2 });
      App.selection = { layerId:'territories', id:'zone_test' };

      /* ---- 1. Bölge tipleri (zones) ---- */
      check('ZONE_TYPES ile ZONE_STYLES aynı kümeyi tanımlıyor',
        Cv.ZONE_TYPES.every(function (t) { return !!Cv.ZONE_STYLES[t]; }) &&
        Object.keys(Cv.ZONE_STYLES).length === Cv.ZONE_TYPES.length);
      check('geçersiz tip reddediliyor', Tools.setZoneType('kediler') === false);
      check('setZoneType başarılı', Tools.setZoneType('war') === true);
      var z = Tv.objects.filter(function (o) { return o.id === 'zone_test'; })[0];
      check('zoneType nesneye yazıldı', z.zoneType === 'war');
      /* Tipli bölge üç siyasi görünümün hiçbirine ait değil ama hepsinde görünür */
      var modesOK = ['state','culture','religion'].every(function (m) {
        Cv.politicalMode = m; return Cv.territoryVisibleInMode(z);
      });
      Cv.politicalMode = 'state';
      check('tipli bölge her siyasi görünümde görünür', modesOK);
      check('zone deseni üretiliyor', !!Cv.zonePattern('war', '#a33227'));
      check('desen önbelleğe alınıyor (aynı nesne)',
        Cv.zonePattern('war', '#a33227') === Cv.zonePattern('war', '#a33227'));
      await History.undo();
      check('zone atama geri alınabiliyor',
        !Layers.get('territories').objects.filter(function (o) { return o.id === 'zone_test'; })[0].zoneType);
      await History.redo();
      App.selection = { layerId:'territories', id:'zone_test' };
      check('boş tip alanı kaldırıyor', Tools.setZoneType('') === true &&
        !Layers.get('territories').objects.filter(function (o) { return o.id === 'zone_test'; })[0].zoneType);
      App.selection = { layerId:'territories', id:'zone_test' };
      Tools.setZoneType('hunting');

      /* ---- 2. Notlar ---- */
      var Sy = Layers.get('symbols');
      Sy.objects.push({ id:'note_sym', sym:'set_city', x:400, y:400, size:60 });
      App.selection = { layerId:'symbols', id:'note_sym' };
      check('setObjectNote sembole not yazıyor', Tools.setObjectNote('Kuşatma altında') === true);
      var ns = Sy.objects.filter(function (o) { return o.id === 'note_sym'; })[0];
      check('not nesnede saklanıyor', ns.note === 'Kuşatma altında');
      await History.undo();
      check('not tek adımda geri alınabiliyor',
        !Layers.get('symbols').objects.filter(function (o) { return o.id === 'note_sym'; })[0].note);
      await History.redo();
      App.selection = { layerId:'symbols', id:'note_sym' };
      check('boş not alanı tamamen siliyor',
        Tools.setObjectNote('   ') === true &&
        !('note' in Layers.get('symbols').objects.filter(function (o) { return o.id === 'note_sym'; })[0]));
      App.selection = { layerId:'symbols', id:'note_sym' };
      Tools.setObjectNote('Kuşatma altında');
      /* not, katman türünden bağımsız: bölgeye de yazılabilmeli */
      App.selection = { layerId:'territories', id:'zone_test' };
      check('not bölgeye de yazılabiliyor', Tools.setObjectNote('Av yasağı') === true);
      check('nokta nesnesinin tutamağı x,y',
        Cv.objAnchor({ x:12, y:34 }).x === 12 && Cv.objAnchor({ x:12, y:34 }).y === 34);
      var ca = Cv.objAnchor({ pts:[[0,0],[10,0],[10,10],[0,10]] });
      check('poligonun tutamağı nokta ortalaması', ca.x === 5 && ca.y === 5);
      check('noktasız nesnede tutamak yok', Cv.objAnchor({}) === null);
      var okNoteRender = true;
      try { Cv.notes = true; Cv.render(); Cv.notes = false; Cv.render(); Cv.notes = true; }
      catch (e) { okNoteRender = false; }
      check('not işaretleriyle render hatasız (açık ve kapalı)', okNoteRender);

      /* ---- 3. İsim tabanı (kullanıcı kültürleri) ---- */
      var builtinCount = Names.allCultureKeys().length;
      check('boş hece havuzu reddediliyor',
        Names.addCustomCulture('usr_bos', { name:'Boş', bas:[], son:[] }) === false);
      check('kültür eklendi', Names.addCustomCulture('usr_test', {
        name:'Test Kültürü', bas:['Zor','Vel','Kra'], orta:['a','e'], son:['dun','mar'], birlesik:true
      }) === true);
      check('yeni kültür anahtar listesinde', Names.allCultureKeys().length === builtinCount + 1);
      check('kültür listesinde kullanıcı işareti var',
        Names.cultureList('tr').filter(function (c) { return c.key === 'usr_test'; })[0].custom === true);
      var nm1 = Names.generate('usr_test', 'settlement', 'tr', 123);
      var nm2 = Names.generate('usr_test', 'settlement', 'tr', 123);
      check('kullanıcı kültürüyle ad üretiliyor', !!nm1 && nm1.length > 2 && nm1.indexOf('undefined') < 0);
      check('kullanıcı kültürü de deterministik', nm1 === nm2);
      check('ad gerçekten bu kültürün hecelerinden',
        ['Zor','Vel','Kra'].some(function (b) { return nm1.indexOf(b) >= 0; }));
      /* birlesik:false yolunda orta ses zorunlu — verilmezse varsayılan atanmalı */
      Names.addCustomCulture('usr_akici', { name:'Akıcı', bas:['Mith'], son:['riel'], birlesik:false });
      check('akıcı kültürde ara ses varsayılanı devrede',
        Names.generate('usr_akici', 'region', 'en', 7).indexOf('undefined') < 0);
      check('yerleşik kültür silinemiyor', Names.removeCustomCulture('western') === false);
      check('kullanıcı kültürü silinebiliyor', Names.removeCustomCulture('usr_akici') === true);
      /* proje round-trip */
      var savedCultures = Names.serializeCustom();
      Names.applyCustom({});
      check('applyCustom({}) kullanıcı kültürlerini temizliyor', Names.allCultureKeys().length === builtinCount);
      Names.applyCustom(savedCultures);
      check('applyCustom geri yüklüyor', Names.allCultureKeys().indexOf('usr_test') >= 0);

      /* ---- 4. Kara üretim şablonları ---- */
      App.landgenPresets = [];
      App.landgen.template = 'island';
      App.landgen.roughness = 0.8;
      App.landgen.rivers = true; App.landgen.lakes = false; App.landgen.terrain = true;
      App.landgenPresets.push({ name:'Sivri adalar', template:'island', roughness:0.8,
                                rivers:true, lakes:false, terrain:true });
      UI.refreshLandgenTemplates();
      var opts = Array.prototype.map.call(document.getElementById('lg-template').options,
                                          function (o) { return o.value; });
      check('yerleşik üç şablon duruyor',
        UI.LG_BUILTIN.every(function (t) { return opts.indexOf(t) >= 0; }));
      check('ön ayar listeye eklendi', opts.indexOf('preset:0') >= 0);
      /* başka bir şablona geçip ön ayara dönünce parametreler geri gelmeli */
      App.landgen.roughness = 0.1; App.landgen.rivers = false; App.landgen.terrain = false;
      UI.applyLandgenTemplate('preset:0');
      check('ön ayar pürüzlülüğü geri yüklüyor', Math.abs(App.landgen.roughness - 0.8) < 1e-9);
      check('ön ayar taban şablonu geri yüklüyor', App.landgen.template === 'island');
      check('ön ayar nehir/arazi seçimlerini geri yüklüyor',
        App.landgen.rivers === true && App.landgen.terrain === true && App.landgen.lakes === false);
      UI.applyLandgenTemplate('continent');
      check('yerleşik şablona dönülebiliyor', App.landgen.template === 'continent');
      /* ön ayar listeden çıkınca seçenek de gitmeli */
      App.landgenPresets = [];
      UI.refreshLandgenTemplates();
      check('silinen ön ayar listeden kalkıyor',
        Array.prototype.map.call(document.getElementById('lg-template').options,
          function (o) { return o.value; }).indexOf('preset:0') < 0);
      App.landgenPresets = [{ name:'Sivri adalar', template:'island', roughness:0.8,
                             rivers:true, lakes:false, terrain:true }];

      /* ---- 5. Proje kaydı round-trip ---- */
      var data = Exporter.buildProjectData();
      check('ön ayarlar proje kaydında', data.landgenPresets.length === 1);
      check('kullanıcı kültürleri proje kaydında', !!data.customCultures.usr_test);
      check('not proje kaydındaki nesnede', JSON.stringify(data).indexOf('Kuşatma altında') >= 0);
      App.landgenPresets = []; Names.applyCustom({});
      await Exporter.applyProjectData(data);
      check('proje geri yüklenince ön ayarlar dönüyor', App.landgenPresets.length === 1);
      check('proje geri yüklenince kültürler dönüyor', Names.allCultureKeys().indexOf('usr_test') >= 0);
      var zBack = Layers.get('territories').objects.filter(function (o) { return o.id === 'zone_test'; })[0];
      check('zoneType proje kaydını atlattı', !!zBack && zBack.zoneType === 'hunting');
      check('not proje kaydını atlattı', !!zBack && zBack.note === 'Av yasağı');

      /* ---- 6. GeoJSON ---- */
      /* Notsuz bir nesne: 'note' alanının koşullu eklendiğini
         gösterebilmek için karşılaştırma noktası gerekiyor. */
      Layers.get('labels').objects.push({ id:'plain_label', x:100, y:100, text:'Notsuz' });
      var gj = Exporter.geojsonData();
      var zf = gj.features.filter(function (f) { return f.properties.zone === 'hunting'; })[0];
      check('GeoJSON zone alanını taşıyor', !!zf);
      check('GeoJSON not alanını taşıyor', !!zf && zf.properties.note === 'Av yasağı');
      var plain = gj.features.filter(function (f) { return f.properties.text === 'Notsuz'; })[0];
      check('notu olmayan nesneye note alanı eklenmiyor', !!plain && !('note' in plain.properties));

      return results.join('\\n');
    })()`;

    const result = await evaluate(cdp, testCode, true);
    if (result.exceptionDetails) console.error('EVAL HATASI:', JSON.stringify(result.exceptionDetails).slice(0, 1200));
    const lines = (result.result?.value || '').split('\n').filter(Boolean);
    let allPass = true;
    for (const line of lines) {
      const ok = line.includes(': PASS');
      if (!ok) allPass = false;
      console.log((ok ? '  ✓ ' : '  ✗ ') + line);
    }
    console.log('\n' + (allPass && lines.length ? '✅ TÜM TESTLER GEÇTİ' : '❌ BAZI TESTLER BAŞARISIZ'));
    process.exit(allPass && lines.length ? 0 : 1);
  } catch (err) {
    console.error('KRİTİK HATA:', err.message || err);
    process.exit(1);
  }
}

run();
