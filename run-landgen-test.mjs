/**
 * Kara üretimi iyileştirmeleri doğrulaması: kapsama garantisi (kıta ≥%40,
 * ada/takımada ≥%20), takımada'nın ayrık parçalar üretmesi, tektonik
 * şablonun kaldırılmış olması, "Üret" ile birlikte nehir/göl/arazi
 * seçenekleri, tek seferlik uyarı modalı ve ayarlanabilir deniz rengi.
 * Diğer test runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8785, CDP_PORT = 9242;
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
  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      try {
        const results = [];
        function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

        Cv.setSize(1024, 1024, false);
        const Lm = Layers.get('landmass');
        function landPct() {
          const d = Lm.ctx.getImageData(0,0,Lm.canvas.width,Lm.canvas.height).data;
          let n=0; for (let i=3;i<d.length;i+=4) if (d[i]>10) n++;
          return n / (d.length/4);
        }
        function landPieces() {
          /* basit bağlı bileşen sayımı (4-komşuluk flood fill), N=96 alt-örnekleme */
          const N = 96;
          const c = document.createElement('canvas'); c.width=N; c.height=N;
          const ctx = c.getContext('2d', { willReadFrequently:true });
          ctx.drawImage(Lm.canvas, 0, 0, N, N);
          const d = ctx.getImageData(0,0,N,N).data;
          const land = new Uint8Array(N*N);
          for (let i=0;i<N*N;i++) land[i] = d[i*4+3] > 80 ? 1 : 0;
          const seen = new Uint8Array(N*N);
          let pieces = 0;
          for (let s=0; s<N*N; s++) {
            if (!land[s] || seen[s]) continue;
            pieces++;
            const stack = [s];
            seen[s] = 1;
            while (stack.length) {
              const cur = stack.pop();
              const cx = cur % N, cy = (cur/N)|0;
              const nbrs = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]];
              for (const [nx,ny] of nbrs) {
                if (nx<0||ny<0||nx>=N||ny>=N) continue;
                const ni = ny*N+nx;
                if (land[ni] && !seen[ni]) { seen[ni]=1; stack.push(ni); }
              }
            }
          }
          return pieces;
        }

        /* ---- 1) kapsama garantisi ---- */
        Tools.generateLandmass('continent', 0.5, 4242);
        await new Promise(r => setTimeout(r, 60));
        check('kıta >= %40', landPct() >= 0.38);

        Tools.generateLandmass('island', 0.5, 4242);
        await new Promise(r => setTimeout(r, 60));
        check('ada >= %20', landPct() >= 0.18);

        Tools.generateLandmass('archipelago', 0.5, 4242);
        await new Promise(r => setTimeout(r, 60));
        check('takımada >= %20', landPct() >= 0.18);
        check('takımada birden çok ayrık parça', landPieces() >= 3);

        /* ---- 2) tektonik şablon kaldırıldı ---- */
        check('tektonik seçeneği DOM\\'dan kaldırıldı', !Array.from(document.getElementById('lg-template').options).some(o => o.value === 'tectonic'));

        /* ---- 3) nehir/göl/arazi seçenekleriyle üretim ---- */
        const Rv = Layers.get('rivers'), Ev = Layers.get('elevation'), T = Layers.get('terrain');
        Rv.objects.length = 0; T.ctx.clearRect(0,0,T.canvas.width,T.canvas.height);
        Ev.ctx.clearRect(0,0,Ev.canvas.width,Ev.canvas.height);
        History.clear();

        document.getElementById('lg-template').value = 'continent';
        document.getElementById('lg-template').dispatchEvent(new Event('change'));
        document.getElementById('lg-rivers').checked = true;
        document.getElementById('lg-rivers').dispatchEvent(new Event('change'));
        document.getElementById('lg-lakes').checked = true;
        document.getElementById('lg-lakes').dispatchEvent(new Event('change'));
        document.getElementById('lg-terrain').checked = true;
        document.getElementById('lg-terrain').dispatchEvent(new Event('change'));
        check('nehir bayrağı App.landgen\\'e yazıldı', App.landgen.rivers === true);
        check('göl bayrağı App.landgen\\'e yazıldı', App.landgen.lakes === true);
        check('arazi bayrağı App.landgen\\'e yazıldı', App.landgen.terrain === true);

        /* Üret düğmesi işlem sürerken kilitlenip tekrar kendi haline
           dönene kadar bekler — sabit bir gecikme tahmin etmek yerine
           (artık Tools.autoBiome parçalara bölünmüş asenkron çalışıyor,
           süresi canvas boyutuna göre değişir) düğmenin gerçekten
           bitirdiğini bekliyoruz. */
        function waitLandgenDone() {
          return new Promise(function (resolve) {
            (function poll() {
              var b = document.getElementById('btn-landgen');
              if (b && !b.disabled) resolve(); else setTimeout(poll, 20);
            })();
          });
        }

        /* ilk tıklama uyarı modalını göstermeli (bayrak henüz yok) */
        localStorage.removeItem(UI.LANDGEN_WARNED_KEY);
        document.getElementById('btn-landgen').click();
        await new Promise(r => setTimeout(r, 50));
        const modalOpenAfterFirst = !document.getElementById('modal')?.classList.contains('hidden');
        check('ilk tıklamada uyarı modalı açıldı', modalOpenAfterFirst);

        document.getElementById('modal-ok').click();
        await new Promise(r => setTimeout(r, 20));
        await waitLandgenDone();

        check('nehir üretildi', Rv.objects.some(o => o.kind !== 'lake'));
        check('göl üretildi', Rv.objects.some(o => o.kind === 'lake'));
        const td = T.ctx.getImageData(0,0,T.canvas.width,T.canvas.height).data;
        let tPixels = 0; for (let i=3;i<td.length;i+=4) if (td[i]>10) tPixels++;
        check('arazi (biyom) üretildi', tPixels > 100);
        const ed = Ev.ctx.getImageData(0,0,Ev.canvas.width,Ev.canvas.height).data;
        let ePixels = 0; for (let i=3;i<ed.length;i+=4) if (ed[i]>10) ePixels++;
        check('yükselti otomatik üretildi', ePixels > 100);
        check('uyarı bayrağı localStorage\\'a yazıldı', !!localStorage.getItem(UI.LANDGEN_WARNED_KEY));

        /* ---- 4) ikinci tıklama artık modal göstermemeli ---- */
        Rv.objects.length = 0;
        document.getElementById('btn-landgen').click();
        await new Promise(r => setTimeout(r, 20));
        await waitLandgenDone();
        const modalOpenAfterSecond = !document.getElementById('modal')?.classList.contains('hidden');
        check('ikinci tıklamada modal ATLANDI', !modalOpenAfterSecond);
        check('ikinci tıklama yine de üretim yaptı', Rv.objects.length > 0);

        /* ---- 4b) Tools.autoBiome artık parçalara bölünmüş asenkron çalışıyor
           (mobilde sekmeyi donduran en ağır adımdı) — gerçek bir Promise
           döndürdüğünü ve art arda iki çağrının da düzgün tamamlandığını
           doğrula. */
        const bp = Tools.autoBiome(1234);
        check('autoBiome bir Promise döndürüyor', bp instanceof Promise);
        const ok1 = await bp;
        check('autoBiome tamamlandı (ilk çağrı)', ok1 === true);
        const ok2 = await Tools.autoBiome(5678);
        check('autoBiome tamamlandı (ikinci ardışık çağrı)', ok2 === true);

        /* ---- 4c) aynı seed → aynı biyom ATAMASI (Faz 2 #43) ----
           Terrain.scatter'ın kendisi kasıtlı olarak seed'siz Math.random()
           kullanır (her fırça darbesi/damga birbirinden farklı görünsün
           diye — bkz. CLAUDE.md), o yüzden nihai piksel verisi asla bit-
           bit eşleşmez. Asıl garanti gereken şey hangi hücreye hangi
           biyomun atandığı — Terrain.scatter'ı geçici olarak sarmalayıp
           çağrı sırasını (biyom+konum) karşılaştırarak bunu doğruluyoruz. */
        const origScatter = Terrain.scatter;
        let scatterLog = [];
        Terrain.scatter = function (ctx, biome, cx, cy, r, a, b) {
          scatterLog.push(biome + '|' + cx.toFixed(3) + '|' + cy.toFixed(3));
          return origScatter.apply(Terrain, arguments);
        };
        Tools.generateLandmass('continent', 0.5, 777, { withElevation:true });
        scatterLog = [];
        await Tools.autoBiome(777);
        const detLog1 = scatterLog.slice();
        Tools.generateLandmass('continent', 0.5, 777, { withElevation:true });
        scatterLog = [];
        await Tools.autoBiome(777);
        const detLog2 = scatterLog.slice();
        Terrain.scatter = origScatter;
        const biomeDeterministic = detLog1.length > 0 && detLog1.length === detLog2.length &&
          detLog1.every((v, i) => v === detLog2[i]);
        check('aynı seed ile biyom atama sırası bit-bit tekrarlanabilir', biomeDeterministic);

        /* ---- 4d) daha önce otomatik biyomda hiç kullanılmayan steppe/
           badlands artık 'highland' kuşağının nem varyasyonuyla ortaya
           çıkabiliyor mu (geniş görsel taramada 'highland'ın dokusuz, tek
           düze bir leke olduğu bulundu — bkz. CLAUDE.md) */
        const usedBiomes = new Set(detLog2.map(s => s.split('|')[0]));
        check('otomatik biyom artık steppe veya badlands uretebiliyor',
          usedBiomes.has('steppe') || usedBiomes.has('badlands'));

        /* ---- 5) ayarlanabilir deniz rengi ---- */
        const beforeSea = Cv.seaColor;
        Cv.setSeaColor('#22aa66');
        check('Cv.seaColor güncellendi', Cv.seaColor === '#22aa66' && Cv.seaColor !== beforeSea);
        const cnv = document.createElement('canvas'); cnv.width=64; cnv.height=64;
        const cctx = cnv.getContext('2d');
        Cv.renderMap(cctx, { includeReference:false });
        const px = cctx.getImageData(2,2,1,1).data;
        check('yeni deniz rengi render\\'a yansıdı (yeşilimsi baskın)', px[1] > px[2] && px[1] > 100);

        document.getElementById('sea-color').value = '#3355ee';
        document.getElementById('sea-color').dispatchEvent(new Event('input'));
        check('renk girişi App.sea.color\\'ı güncelledi', App.sea.color === '#3355ee');
        check('renk girişi Cv.seaColor\\'ı da güncelledi', Cv.seaColor === '#3355ee');

        window.__testResults = results;
        window.__testPass = results.every(function (r) { return r.endsWith('PASS'); });
        window.__testDone = true;
      } catch (e) {
        window.__testError = e.message + ' ' + e.stack;
        window.__testDone = true;
      }
    })();`;

    await evaluate(cdp, testCode, true);

    for (let i = 0; i < 30; i++) {
      const done = await evaluate(cdp, 'window.__testDone===true');
      if (done.result?.value) break;
      await sleep(300);
    }

    const err = await evaluate(cdp, 'window.__testError||""');
    if (err.result?.value) { console.error('HATA:', err.result.value); process.exit(1); }

    const res = await evaluate(cdp, 'JSON.stringify(window.__testResults||[])');
    const pass = await evaluate(cdp, 'window.__testPass===true');
    const list = JSON.parse(res.result?.value || '[]');
    console.log('\n========== KARA ÜRETİMİ İYİLEŞTİRMELERİ TESTİ ==========');
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    console.log(pass.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(pass.result?.value ? 0 : 1);
  } catch (e) {
    console.error('Test çalıştırma hatası:', e);
    process.exit(1);
  }
}

run();
