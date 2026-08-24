/**
 * Faz 3 (#35/#44) — export çıktılarını üretip diske yazan yardımcı script.
 * Gerçek Exporter.png/svg/html() fonksiyonlarını (anchor-tıklama indirmesi
 * dahil) tetikler; Page.setDownloadBehavior ile tarayıcının kendi indirme
 * mekanizması dosyayı doğrudan diske yazar — CDP'nin Runtime.evaluate
 * returnByValue'su büyük (birkaç MB) base64 dizilerini JSON üzerinden geri
 * döndürmeye çalışınca pratik olarak asılı kaldığı için (gerçek bir ürün
 * performans sorunu DEĞİL, sadece bu araç kanalının büyük payload'a uygun
 * olmaması — bkz. diag-render-perf* ile izole edilen ölçümler: renderMap
 * ~48ms, toDataURL ~121ms, tam renderToCanvas ~50ms) bu script gerçek
 * tarayıcı indirmesini kullanır. Görsel inceleme ve format×dil
 * kıyaslaması içindir, kalıcı bir assertion testi değildir.
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8810, CDP_PORT = 9270;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';
const OUT_DIR = '/tmp/export-inspect';

try { mkdirSync(OUT_DIR, { recursive: true }); } catch {}

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
      if (!m.id && m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (args) console.log('[page]', args);
      }
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
function evalT(cdp, expression, awaitPromise, ms) {
  const p = cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
  const t = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT ' + ms)), ms));
  return Promise.race([p, t]);
}

function waitForNewFile(dir, before, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve) => {
    (function poll() {
      const now = new Set(existsSync(dir) ? readdirSync(dir) : []);
      const added = [...now].filter(f => !before.has(f) && !f.endsWith('.crdownload'));
      if (added.length) return resolve(added[0]);
      if (Date.now() > deadline) return resolve(null);
      setTimeout(poll, 300);
    })();
  });
}

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  const cdp = await connectCDP();
  await cdp.send('Runtime.enable');
  await cdp.send('Console.enable');
  await cdp.send('Page.enable');
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT_DIR });
  try { await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT_DIR }); } catch {}

  for (let i = 0; i < 40; i++) {
    const r = await evalT(cdp, 'typeof Tools!=="undefined"&&typeof Exporter!=="undefined"', false, 5000);
    if (r.result?.value === true) break;
    await sleep(500);
  }
  console.log('[step] sayfa hazır');
  await evalT(cdp, 'UI.showView("editor")', false, 5000);
  await sleep(400);

  const setup = `(async function(){
    try {
      Exporter.newProject(1600, 1200, 'Export Test');
      Tools.generateLandmass('continent', 0.5, 321, { withElevation:true });
      await Tools.autoBiome(321);
      Tools.generateRivers(3, 321);
      Tools.autoLakes(1, 321);
      App.elevation.showHillshade = true;

      App.symbol.id = Sym.SYMBOLS.castles.items[0].id;
      Tools.placeSymbol({x: Cv.W*0.5, y: Cv.H*0.4});
      App.symbol.id = Sym.SYMBOLS.forests.items[0].id;
      Tools.placeSymbol({x: Cv.W*0.3, y: Cv.H*0.6});

      App.tool = 'territory';
      Tools.addPathPoint({x: Cv.W*0.2, y: Cv.H*0.2});
      Tools.addPathPoint({x: Cv.W*0.5, y: Cv.H*0.15});
      Tools.addPathPoint({x: Cv.W*0.45, y: Cv.H*0.4});
      Tools.finishPath();

      document.getElementById('lb-text').value = 'Wayborne Krallığı';
      App.tool = 'label';
      Tools.placeLabel({x: Cv.W*0.5, y: Cv.H*0.5});
      document.getElementById('lb-text').value = 'مملكة ويبورن';
      Tools.placeLabel({x: Cv.W*0.35, y: Cv.H*0.75});

      Cv.fit(); Cv.requestRender();
      await new Promise(r => setTimeout(r, 300));
      window.__setupOk = true;
    } catch (e) {
      window.__setupErr = e.message + ' | ' + e.stack;
    }
  })();`;
  await evalT(cdp, setup, true, 20000);
  const setupErr = await evalT(cdp, 'window.__setupErr || ""', false, 3000);
  if (setupErr.result?.value) { console.error('[SETUP HATASI]', setupErr.result.value); process.exit(1); }
  console.log('[step] test haritası hazır');

  async function downloadStep(label, triggerExpr) {
    const before = new Set(existsSync(OUT_DIR) ? readdirSync(OUT_DIR) : []);
    await evalT(cdp, triggerExpr, false, 15000);
    const fname = await waitForNewFile(OUT_DIR, before, 45000);
    if (!fname) { console.log(`[FAIL] ${label}: dosya belirmedi`); return null; }
    const full = join(OUT_DIR, fname);
    const size = statSync(full).size;
    console.log(`[ok] ${label}: ${fname} (${(size/1024).toFixed(0)} KB)`);
    return full;
  }

  await downloadStep('PNG 1x', 'Exporter.png(1)');
  await downloadStep('PNG 2x', 'Exporter.png(2)');
  await downloadStep('PNG 4x', 'Exporter.png(4)');
  await downloadStep('SVG', 'Exporter.svg()');
  await downloadStep('HTML (PNG gömülü)', "Exporter.html({ maxDim: 1600, format: 'png', title: 'Export Test' })");
  await downloadStep('HTML (JPEG gömülü)', "Exporter.html({ maxDim: 1600, format: 'jpeg', title: 'Export Test' })");

  /* ---- paylaşım linki + embed kodu (küçük string, evaluate ile sorunsuz) ---- */
  const shareR = await evalT(cdp, `(function(){
    var url = Exporter.buildShareURL({ maxDim: 1200, title: 'Export Test' });
    var embed = Exporter.embedCode(url, 800, 600);
    return JSON.stringify({ urlLen: url.length, embed: embed, urlPrefix: url.slice(0, 80) });
  })()`, false, 10000);
  const shareInfo = JSON.parse(shareR.result?.value || '{}');
  console.log(`[ok] Paylaşım linki: ${shareInfo.urlLen} karakter, prefix=${shareInfo.urlPrefix}...`);
  console.log(`[ok] Embed kodu: ${shareInfo.embed}`);
  writeFileSync(`${OUT_DIR}/share-info.json`, JSON.stringify(shareInfo, null, 2));

  /* ---- canlı editör görünümü ekran görüntüsü (RTL etiket dahil) ---- */
  const shot = await cdp.send('Page.captureScreenshot', { format:'png', clip:{x:0,y:0,width:1280,height:800,scale:1} });
  writeFileSync(`${OUT_DIR}/editor-live-view.png`, Buffer.from(shot.data, 'base64'));
  console.log('[shot] editor-live-view.png');

  console.log('\n[done] Çıktılar: ' + OUT_DIR);
  process.exit(0);
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
