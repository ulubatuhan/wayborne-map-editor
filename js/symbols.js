/* ============================================================
   Cartographer — symbols.js  v2
   ~200 ink-style fantasy sembol. Path2D, 0-100 koordinat uzayı,
   merkez (50,50). Ayrıca custom PNG sembol sistemi.
   ============================================================ */
(function (global) {
  'use strict';

  var PAL = {
    ink:'#2a1f0e', ink2:'#3d2e18', ink3:'#5a4228',
    fill:'#ede0c4', fill2:'#f5eedc', fill3:'#d8c9a8',
    shade:'#c4a87a', shade2:'#a08660', shade3:'#7a6240',
    snow:'#fdfaf4', stone:'#c8bba0', stoned:'#9a8d74',
    green:'#6a8c52', greend:'#3d5e2a', green2:'#8aaa66',
    water:'#5a88a0', waterd:'#3d6478',
    red:'#8c3a2e', red2:'#b04030', gold:'#c49a20', gold2:'#a07a10',
    wood:'#7a5428', wood2:'#9a6c38', rust:'#8a5030',
    purple:'#6a3a7a', blue:'#3a5a8a', darkgray:'#4a4438'
  };

  function part(d,f,s,lw,tr){return{d:d,f:f||null,s:s||null,lw:lw||0,tr:tr||null};}

  /* ---- shared path fragments ---- */
  var F={
    /* mountains */
    peak1:'M6 90 L36 22 L52 50 L64 30 L94 90 Z',
    peak1s:'M36 22 L52 50 L64 30 L94 90 L48 90 Z',
    peak1n:'M36 22 L26 44 L33 38 L40 47 L46 38 L52 50 Z',
    cone1:'M20 90 L50 16 L80 90 Z',
    cone1s:'M50 16 L80 90 L50 90 Z',
    peak2:'M4 90 L28 34 L42 56 L50 38 L58 56 L72 34 L96 90 Z',
    hatches:'M12 70 L20 60 M18 78 L28 66 M26 82 L36 70 M60 70 L68 60 M66 78 L76 66',

    /* hills */
    hill1:'M10 88 C20 56 50 52 70 88 Z',
    hill2:'M4 88 C16 52 46 48 66 88 Z',
    hillhatch:'M26 78 C32 68 42 66 50 72',

    /* trees */
    pine:'M50 12 L62 40 L56 40 L66 60 L58 60 L68 80 L32 80 L42 60 L34 60 L44 40 L38 40 Z',
    pineTrk:'M46 80 H54 V94 H46 Z',
    pine2:'M50 8 L60 32 L55 32 L64 52 L57 52 L66 72 L58 72 L66 88 L34 88 L42 72 L34 72 L43 52 L36 52 L45 32 L40 32 Z',
    leaf:'M50 16 C68 16 80 30 74 46 C82 58 66 74 50 68 C34 74 18 58 26 46 C20 30 32 16 50 16 Z',
    leafTrk:'M47 66 H53 V94 H47 Z',
    leafV:'M50 92 V46 M50 62 L34 50 M50 62 L66 50 M50 54 L38 42 M50 54 L62 42',
    palm:'M50 92 C48 68 52 52 60 38',
    palmF:'M60 38 C46 24 28 28 22 40 C36 32 50 36 60 44 M60 38 C72 22 88 26 92 40 C78 30 64 34 60 44 M60 38 C58 20 44 10 30 14 C44 20 54 30 58 44',
    dead:'M48 94 V42 M48 60 L26 38 M48 68 L70 46 M48 50 L34 24 M48 54 L66 28 M26 38 L18 44 M70 46 L78 40 M34 24 L28 18 M66 28 L74 22',
    oak:'M50 14 C30 14 16 28 18 44 C10 48 8 60 16 66 C14 76 22 82 32 80 C36 88 44 92 50 90 C56 92 64 88 68 80 C78 82 86 76 84 66 C92 60 90 48 82 44 C84 28 70 14 50 14 Z',
    oakTrk:'M46 88 H54 V96 H46 Z',
    jungleleaf:'M50 10 C80 10 92 40 78 60 C88 74 72 90 50 82 C28 90 12 74 22 60 C8 40 20 10 50 10 Z',
    cactus:'M50 92 V40 M50 60 C40 60 34 52 34 44 V30 M50 60 C60 60 66 52 66 44 V30 M34 30 H30 V24 H38 M66 30 H70 V24 H62',
    willowTrk:'M50 92 V32',
    willowB:'M50 36 C36 50 32 66 38 80 M50 36 C44 52 44 68 50 80 M50 36 C64 50 68 66 62 80 M50 36 C30 44 22 56 26 70 M50 36 C70 44 78 56 74 70',

    /* city/town structures */
    houseB:'M34 90 V60 H66 V90 Z',
    houseR:'M28 62 L50 42 L72 62 Z',
    houseDr:'M46 90 V74 H54 V90 Z',
    houseW:'M38 72 H46 V80 H38 Z M54 72 H62 V80 H54 Z',
    bigHouseB:'M24 90 V56 H76 V90 Z',
    bigHouseR:'M18 58 L50 34 L82 58 Z',
    towerB:'M40 90 V36 H60 V90 Z',
    towerCren:'M36 38 H44 V28 H36 Z M48 38 H56 V28 H48 Z M60 38 H66 V28 H60 Z M36 38 H66 V44 H36 Z',
    towerR:'M34 38 L50 12 L66 38 Z',
    towerW:'M44 56 H56 V68 H44 Z',
    wallB:'M8 90 V58 H92 V90 Z',
    wallC:'M8 58 H18 V50 H8 Z M26 58 H36 V50 H26 Z M44 58 H54 V50 H44 Z M62 58 H72 V50 H62 Z M80 58 H92 V50 H80 Z',
    gate:'M42 90 V72 A8 8 0 0 1 58 72 V90 Z',
    flagP:'M62 36 V6',
    flag:'M62 8 L84 16 L62 24 Z',
    domeB:'M30 90 V62 H70 V90 Z',
    dome:'M28 62 A22 22 0 0 1 72 62 Z',
    spire:'M50 10 L58 46 H42 Z',
    column:'M43 88 V32 H53 V88 Z',
    columnCap:'M36 32 H58 V24 H36 Z',
    columnBase:'M36 88 H58 V92 H36 Z',
    arch:'M22 90 V54 A28 28 0 0 1 78 54 V90 H64 V58 A14 14 0 0 0 36 58 V90 Z',
    crossTop:'M46 8 H54 V24 H58 V30 H42 V24 H46 Z',
    chapel:'M36 90 V56 H64 V90 Z',
    chapelR:'M30 58 L50 38 L70 58 Z',
    chapelW:'M44 72 H56 V84 H44 Z',

    /* ships */
    hull:'M16 68 H84 L72 86 H28 Z',
    mast:'M50 68 V18 M50 24 L78 36 L50 48 Z',
    mast2:'M50 68 V18 M50 24 L78 36 L50 48 Z M26 68 V36 M26 40 L48 50 L26 60 Z',
    wave:'M6 76 q11-9 22 0 t22 0 t22 0 t22 0 M6 88 q11-9 22 0 t22 0 t22 0 t22 0',
    anchor:'M50 22 V80 M34 62 A18 18 0 0 0 66 62 M36 34 H64',

    /* misc decorative */
    compass:'M50 6 A44 44 0 1 1 49.9 6 Z',
    compassN:'M50 8 L60 50 L50 92 L40 50 Z',
    compassCross:'M8 50 H92 M50 8 V92',
    star8:'M50 6 L57 40 L92 50 L57 60 L50 94 L43 60 L8 50 L43 40 Z',
    sunFace:'M50 18 A32 32 0 1 1 49.9 18 Z',
    sunRay:'M50 4 L53 16 L47 16 Z M50 96 L53 84 L47 84 Z M4 50 L16 53 L16 47 Z M96 50 L84 53 L84 47 Z M18 18 L26 28 L20 32 Z M82 18 L74 28 L80 32 Z M18 82 L26 72 L20 68 Z M82 82 L74 72 L80 68 Z',
    skull:'M24 40 C24 16 76 16 76 40 C76 56 66 60 66 72 H34 C34 60 24 56 24 40 Z',
    skullEyes:'M36 44 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M64 44 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
    skullNose:'M46 52 L50 60 L54 52 Z',
    skullTeeth:'M38 72 V80 M44 72 V82 M50 72 V82 M56 72 V82 M62 72 V80',
    dragon:'M10 70 C20 50 40 44 56 50 C62 36 76 28 88 34 C78 36 70 44 68 52 C80 46 90 50 88 60 C78 54 68 58 62 66 C72 72 78 82 72 90 C64 80 54 76 48 80 C42 88 32 92 24 86 C34 82 40 74 38 68 C28 76 14 78 10 70 Z',
    dragonWing:'M56 50 C60 38 72 30 86 32 C74 38 64 46 62 56',
    tentacles:'M50 30 C44 50 48 70 44 88 M50 30 C56 48 52 68 58 86 M50 30 C36 46 32 66 28 84 M50 30 C64 46 68 66 72 84',
    kraken:'M50 24 A18 18 0 1 1 49.9 24 Z',
    pickaxe:'M20 80 L74 26 M58 12 C72 14 86 26 88 40 C76 32 66 24 58 12 Z',
    torch:'M44 88 H56 V48 H44 Z',
    torchFl:'M50 48 C42 36 36 24 40 12 C46 22 48 32 50 32 C52 32 54 22 60 12 C64 24 58 36 50 48 Z',
    cave:'M18 90 C18 50 82 50 82 90 Z',
    caveDark:'M34 90 C34 66 66 66 66 90 Z',
    crystals:'M36 88 L42 52 L48 72 L52 44 L56 68 L64 88 Z',
    bridge:'M8 62 C30 34 70 34 92 62 M8 62 V80 M92 62 V80 M30 47 V70 M50 40 V74 M70 47 V70',
    bridgeFloor:'M8 80 H92',
    passGap:'M6 90 L30 34 L46 74 Z M54 74 L70 34 L94 90 Z',
    scroll:'M22 20 C22 10 38 10 38 20 V80 C38 90 62 90 62 80 V20 C62 10 78 10 78 20 M22 20 H78 M22 80 H78',
    scrollLine:'M34 36 H66 M34 46 H66 M34 56 H66 M34 66 H62',
    banner:'M20 12 H80 V72 L50 58 L20 72 Z',
    bannerLine:'M30 28 H70 M30 40 H70 M30 52 H64',
    mill:'M38 90 V50 H62 V90 Z',
    millRoof:'M32 52 L50 32 L68 52 Z',
    millBlades:'M50 50 L50 22 M50 50 L78 50 M50 50 L50 78 M50 50 L22 50',
    well:'M36 90 H64 V72 H36 Z',
    wellTop:'M30 72 H70 V64 H30 Z',
    wellArch:'M36 64 A14 14 0 0 1 64 64',
    wellRope:'M50 64 V74',
    forge:'M34 90 V58 H66 V90 Z',
    forgeRoof:'M28 60 L50 40 L72 60 Z',
    forgeChim:'M62 44 V20 H74 V44 Z',
    forgeAnvil:'M36 76 H64 V80 H36 Z M40 72 H60 V76 H40 Z M46 68 H54 V72 H46 Z',
    inn:'M28 90 V54 H72 V90 Z',
    innRoof:'M22 56 L50 30 L78 56 Z',
    innSign:'M42 66 H58 V76 H42 Z M50 58 V66',
    market:'M16 90 V60 H84 V90 Z',
    marketAwn:'M12 60 H44 V48 H12 Z M48 60 H88 V48 H48 Z',
    lighthouse:'M40 90 L46 30 H54 L60 90 Z',
    lighthouseTop:'M40 30 H60 V22 H40 Z',
    lighthouseLight:'M22 26 L38 26 M62 26 L78 26 M50 10 V22',
    colossus:'M38 90 V60 H62 V90 Z',
    colossusBody:'M38 60 H62 V40 H38 Z',
    colossusHead:'M42 40 H58 V24 H42 Z',
    colossusArms:'M20 54 H38 M62 54 H80',
    obelisk:'M44 90 V20 H56 V90 Z M46 18 L50 8 L54 18 Z',
    pyramid:'M10 90 L50 20 L90 90 Z',
    pyramidLine:'M22 82 L50 28 L78 82 M34 74 L50 36 L66 74',
    megalith:'M38 90 V30 H48 V90 Z M52 90 V36 H62 V90 Z M34 34 H66 V26 H34 Z',
    magic:'M50 12 L62 40 L92 40 L68 58 L78 88 L50 70 L22 88 L32 58 L8 40 L38 40 Z',
    magicInner:'M50 28 L57 46 L74 46 L60 56 L66 74 L50 64 L34 74 L40 56 L26 46 L43 46 Z',
    vortex:'M50 50 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0 M50 50 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 M50 50 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0',
    eye:'M10 50 C26 26 74 26 90 50 C74 74 26 74 10 50 Z',
    eyePupil:'M50 50 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0',
    eyeInner:'M50 50 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
    grave:'M44 90 V40 H56 V90 Z M38 42 H62 V28 H38 Z M44 34 H56',
    graveCross:'M50 44 V28 M38 36 H62',
    bonepile:'M20 88 C24 72 36 68 50 72 C64 68 76 72 80 88 Z M30 72 C28 60 36 54 44 58 M50 60 C48 48 58 44 66 50 M62 70 C68 56 78 54 80 64',
    ruins1:'M22 90 V54 A28 28 0 0 1 78 54 V90 H64 V60 A14 14 0 0 0 36 60 V90 Z',
    ruins2:'M38 90 V40 L46 32 L52 44 L60 28 L62 90 Z',
    stockade:'M14 90 V50 H86 V90 Z M14 50 L22 36 L30 50 L38 36 L46 50 L54 36 L62 50 L70 36 L78 50 L86 36',
    docks:'M8 90 H92 M8 76 H92 M20 76 V54 M36 76 V48 M50 76 V52 M64 76 V48 M80 76 V54',
    windmill:'M38 90 V52 H62 V90 Z',
    windmillR:'M32 54 L50 36 L68 54 Z',
    windmillB:'M50 52 L50 18 L56 52 Z M50 52 L84 56 L52 60 Z M50 52 L50 86 L44 52 Z M50 52 L16 48 L48 44 Z',
    monolith:'M44 92 V18 H56 V92 Z M44 16 L50 6 L56 16 Z M36 92 H64',
    graveyard:'M28 90 V56 H36 V90 Z M42 90 V52 H50 V90 Z M56 90 V58 H64 V90 Z M32 52 H32 V44 H32 M46 48 H46 V40 H46 M60 54 H60 V46 H60',
    graveyardCross:'M32 56 V44 M28 50 H36 M46 52 V40 M42 46 H50 M60 58 V46 M56 52 H64',
    gallows:'M20 90 V20 H70 V34 M70 20 L82 20 M68 32 L68 54 L58 68',
    gibet:'M38 90 V20 H70 V30 M70 20 H84 M66 28 L66 52 L56 66',
  };

  /* ====================================================================
     SEMBOL TANIMLAMALARI
     ==================================================================== */
  function c(arr){return Array.prototype.concat.apply([],arr);}

  var SYMBOLS = {

    /* ------------------------------------------------------------------ */
    mountains:{ tr:'Dağlar', en:'Mountains', items:[
      {id:'mnt_peak',tr:'Tek zirve',en:'Single peak',parts:[
        part(F.peak1,'fill','ink',3.5),part(F.peak1s,'shade',null,0),
        part(F.peak1n,'snow',null,0),part(F.peak1,null,'ink',3.5),
        part(F.hatches,null,'ink2',1.8)]},
      {id:'mnt_snow',tr:'Karlı zirve',en:'Snowy peak',parts:[
        part(F.peak1,'fill','ink',3.5),part(F.peak1s,'shade2',null,0),
        part(F.peak1n,'snow',null,0),part(F.peak1,null,'ink',3.5)]},
      {id:'mnt_cone',tr:'Sivri',en:'Cone peak',parts:[
        part(F.cone1,'fill','ink',3.5),part(F.cone1s,'shade',null,0),
        part('M50 16 L40 38 L46 34 L52 42 L58 34 L62 38 Z','snow',null,0),
        part(F.cone1,null,'ink',3.5)]},
      {id:'mnt_double',tr:'Çift zirve',en:'Double peak',parts:c([
        [part(F.peak1,'fill','ink',4,[-4,10,0.68]),part(F.peak1s,'shade',null,0,[-4,10,0.68])],
        [part(F.peak1,'fill','ink',4,[36,18,0.58]),part(F.peak1s,'shade',null,0,[36,18,0.58])]])},
      {id:'mnt_triple',tr:'Sıradağ',en:'Mountain range',parts:c([
        [part(F.peak1,'fill','ink',5,[-16,24,0.5]),part(F.peak1s,'shade',null,0,[-16,24,0.5])],
        [part(F.peak1,'fill','ink',5,[38,28,0.44]),part(F.peak1s,'shade',null,0,[38,28,0.44])],
        [part(F.peak1,'fill','ink',4.2,[8,4,0.64]),part(F.peak1s,'shade',null,0,[8,4,0.64]),
         part(F.peak1n,'snow',null,0,[8,4,0.64])]])},
      {id:'mnt_volcano',tr:'Yanardağ',en:'Volcano',parts:[
        part('M12 90 L40 24 H60 L88 90 Z','fill','ink',3.5),
        part('M50 24 L60 24 L88 90 L50 90 Z','shade',null,0),
        part('M38 24 C42 12 58 12 62 24 Z','red','ink',2.5),
        part('M44 20 C42 6 58 6 56 2','red2','ink3',4),
        part('M46 10 C40 4 36 6 30 2 M54 8 C60 2 66 4 70 0',null,'ink2',2.4)]},
      {id:'mnt_jagged',tr:'Dikenli dağ',en:'Jagged peak',parts:[
        part(F.peak2,'fill','ink',3.5),
        part('M4 90 L28 34 L42 56 L50 38 L58 56 L72 34 L96 90 L54 90 Z','shade',null,0),
        part(F.peak2,null,'ink',3.5)]},
      {id:'mnt_cliff',tr:'Uçurum',en:'Cliff',parts:[
        part('M14 90 V22 H38 V90 Z','fill','ink',3.5),
        part('M14 22 H38 V90 L14 90 Z','shade',null,0),
        part('M38 22 L70 40 L72 90 H38 Z','fill3','ink',3),
        part('M18 30 L18 80 M22 32 L22 76 M26 34 L26 80',null,'ink3',1.6),
        part('M40 44 L68 56 M40 54 L66 64',null,'ink3',1.6)]},
      {id:'mnt_glacier',tr:'Buzul',en:'Glacier',parts:[
        part('M10 90 L34 28 L50 52 L60 34 L90 90 Z','fill2','ink',3.5),
        part('M34 28 L50 52 L60 34 L90 90 L50 90 Z','snow','ink3',1.5),
        part('M30 60 L46 46 M38 72 L54 56 M50 78 L66 62',null,'water',2)]},
    ]},

    /* ------------------------------------------------------------------ */
    hills:{ tr:'Tepeler', en:'Hills', items:[
      {id:'hill_1',tr:'Tek tepe',en:'Hill',parts:[
        part(F.hill1,'fill','ink',3.2),part(F.hillhatch,null,'ink2',2.2)]},
      {id:'hill_grassy',tr:'Otlak tepe',en:'Grassy hill',parts:[
        part(F.hill1,'fill','ink',3.2),
        part('M20 80 L24 72 M28 76 L30 68 M34 72 L38 64 M42 70 L44 62 M48 68 L50 60 M54 68 L56 62',null,'greend',2)]},
      {id:'hill_2',tr:'Çift tepe',en:'Twin hills',parts:c([
        [part(F.hill1,'fill','ink',4.4,[-8,12,0.7])],
        [part(F.hill1,'fill','ink',4.4,[32,6,0.76]),part(F.hillhatch,null,'ink2',3,[32,6,0.76])]])},
      {id:'hill_3',tr:'Tepelik',en:'Hill cluster',parts:c([
        [part(F.hill1,'fill','ink',5,[-18,18,0.54])],
        [part(F.hill1,'fill','ink',5,[38,18,0.54])],
        [part(F.hill2,'fill','ink',4.4,[8,0,0.72]),part(F.hillhatch,null,'ink2',3,[8,0,0.72])]])},
      {id:'hill_rocky',tr:'Kayalık',en:'Rocky hills',parts:[
        part('M10 88 L28 52 L44 64 L58 42 L74 62 L86 88 Z','stone','ink',3.2),
        part('M28 52 L44 64 L58 42 L74 62 L86 88 L50 88 Z','stoned',null,0),
        part('M20 78 L28 64 M40 72 L48 58 M60 70 L70 56',null,'ink2',2)]},
      {id:'hill_mound',tr:'Höyük',en:'Barrow mound',parts:[
        part('M14 86 C20 58 80 58 86 86 Z','fill3','ink',3.2),
        part('M30 80 C34 68 66 68 70 80 Z','shade',null,0),
        part('M48 84 V70 M42 82 V72 M54 82 V72',null,'ink2',2)]},
    ]},

    /* ------------------------------------------------------------------ */
    forests:{ tr:'Ormanlar', en:'Forests', items:[
      {id:'for_pine1',tr:'Çam',en:'Pine',parts:[
        part(F.pineTrk,'wood','ink3',2),part(F.pine,'greend','ink',3)]},
      {id:'for_pine2',tr:'Yüksek çam',en:'Tall pine',parts:[
        part(F.pineTrk,'wood','ink3',2),part(F.pine2,'greend','ink',3)]},
      {id:'for_pine3',tr:'Çamlık',en:'Pine grove',parts:c([
        [part(F.pineTrk,'wood','ink3',2,[-24,10,0.58]),part(F.pine,'greend','ink',3,[-24,10,0.58])],
        [part(F.pineTrk,'wood','ink3',2,[24,10,0.58]),part(F.pine,'greend','ink',3,[24,10,0.58])],
        [part(F.pineTrk,'wood','ink3',2,[0,-8,0.76]),part(F.pine,'greend','ink',3,[0,-8,0.76])]])},
      {id:'for_leaf1',tr:'Yapraklı',en:'Broadleaf',parts:[
        part(F.leafTrk,'wood','ink3',2),part(F.leaf,'green','ink',3),part(F.leafV,null,'ink3',1.8)]},
      {id:'for_oak',tr:'Meşe',en:'Oak',parts:[
        part(F.oakTrk,'wood','ink3',2),part(F.oak,'green','ink',3),
        part('M50 14 C36 18 22 30 22 44 C14 52 14 64 22 70',null,'ink3',1.8)]},
      {id:'for_leaf3',tr:'Koru',en:'Grove',parts:c([
        [part(F.leafTrk,'wood','ink3',2,[-24,10,0.56]),part(F.leaf,'green','ink',3,[-24,10,0.56])],
        [part(F.leafTrk,'wood','ink3',2,[22,10,0.56]),part(F.leaf,'green','ink',3,[22,10,0.56])],
        [part(F.leafTrk,'wood','ink3',2,[0,-10,0.74]),part(F.leaf,'green','ink',3,[0,-10,0.74])]])},
      {id:'for_mixed',tr:'Karışık',en:'Mixed wood',parts:c([
        [part(F.pineTrk,'wood','ink3',2,[-24,8,0.58]),part(F.pine,'greend','ink',3,[-24,8,0.58])],
        [part(F.leafTrk,'wood','ink3',2,[24,10,0.56]),part(F.leaf,'green','ink',3,[24,10,0.56])],
        [part(F.leafTrk,'wood','ink3',2,[0,-10,0.74]),part(F.leaf,'green2','ink',3,[0,-10,0.74])]])},
      {id:'for_jungle',tr:'Orman',en:'Jungle',parts:[
        part(F.oakTrk,'wood','ink3',2),part(F.jungleleaf,'green2','ink',3),
        part('M50 10 C28 16 12 34 16 52',null,'ink3',2)]},
      {id:'for_palm',tr:'Palmiye',en:'Palm',parts:[
        part(F.palm,null,'wood',5),part(F.palmF,null,'greend',3.5)]},
      {id:'for_dead',tr:'Kuru orman',en:'Dead wood',parts:[part(F.dead,null,'ink',3.5)]},
      {id:'for_willow',tr:'Söğüt',en:'Willow',parts:[
        part(F.willowTrk,null,'wood',5),part(F.willowB,null,'greend',2.5)]},
      {id:'for_cactus',tr:'Kaktüs',en:'Cactus',parts:[part(F.cactus,'green','ink',3)]},
      {id:'for_swamp_tree',tr:'Bataklık ağacı',en:'Swamp tree',parts:[
        part(F.willowTrk,null,'wood2',4),
        part('M50 36 C36 52 32 68 38 82 M50 36 C44 54 44 70 50 82 M50 36 C64 52 68 68 62 82',null,'greend',3),
        part('M50 36 C30 46 22 58 28 72 M50 36 C70 46 78 58 74 72',null,'greend',2.5)]},
    ]},

    /* ------------------------------------------------------------------ */
    cities:{ tr:'Şehirler', en:'Cities', items:[
      {id:'city_small',tr:'Küçük şehir',en:'Small city',parts:[
        part(F.wallB,'fill','ink',3),part(F.wallC,'stone','ink',2.2),part(F.gate,'ink2',null,0),
        part(F.towerB,'fill','ink',3,[-8,18.4,0.44]),part(F.towerCren,'stone','ink',2,[-8,18.4,0.44]),
        part(F.towerB,'fill','ink',3,[64,18.4,0.44]),part(F.towerCren,'stone','ink',2,[64,18.4,0.44])]},
      {id:'city_capital',tr:'Başkent',en:'Capital',parts:c([
        [part(F.wallB,'fill','ink',3),part(F.wallC,'stone','ink',2.2),part(F.gate,'ink2',null,0)],
        [part(F.towerB,'fill','ink',3,[-11,13,0.5]),part(F.towerR,'red','ink',3,[-11,13,0.5]),
         part(F.flagP,null,'ink',2.5,[-11,13,0.5]),part(F.flag,'red','ink',2,[-11,13,0.5])],
        [part(F.towerB,'fill','ink',3,[61,13,0.5]),part(F.towerR,'red','ink',3,[61,13,0.5])],
        [part(F.spire,'shade','ink',2.4,[10,8,0.6])]])},
      {id:'city_port',tr:'Liman şehri',en:'Port city',parts:c([
        [part(F.wallB,'fill','ink',3),part(F.wallC,'stone','ink',2.2),part(F.gate,'ink2',null,0)],
        [part(F.towerB,'fill','ink',3,[-8,18.4,0.44]),part(F.towerCren,'stone','ink',2,[-8,18.4,0.44])],
        [part(F.hull,'wood','ink',3,[38,18,0.4]),part(F.mast,'fill','ink',2.5,[38,18,0.4])]])},
      {id:'city_ruin',tr:'Yıkık şehir',en:'Ruined city',parts:[
        part('M14 90 V60 H86 V90 Z','stone','ink',3),
        part('M14 60 H28 V52 H14 Z M40 60 H50 V52 H40 Z M62 60 H72 V52 H62 Z','stoned','ink',2),
        part('M86 60 L74 50 L70 60','stoned','ink',2.5),
        part('M30 90 V68 M46 90 V64 M62 90 V70',null,'ink3',2.5),
        part('M22 82 H38 M58 78 H74',null,'ink3',2)]},
      {id:'city_castle_city',tr:'Kale-şehir',en:'Castle city',parts:c([
        [part(F.wallB,'fill','ink',3),part(F.wallC,'stone','ink',2),part(F.gate,'ink2',null,0)],
        [part(F.towerB,'fill','ink',3.5,[-12,11.2,0.52]),part(F.towerCren,'stone','ink',2.5,[-12,11.2,0.52]),
         part(F.towerR,'red','ink',3,[-12,11.2,0.52])],
        [part(F.towerB,'fill','ink',3.5,[60,11.2,0.52]),part(F.towerCren,'stone','ink',2.5,[60,11.2,0.52]),
         part(F.towerR,'red','ink',3,[60,11.2,0.52])],
        [part(F.dome,'shade','ink',2.5,[10,6,0.5]),part(F.domeB,'fill','ink',2.5,[10,6,0.5]),
         part(F.spire,'red','ink',2,[10,-8,0.4])]])},
      {id:'city_trade',tr:'Ticaret kenti',en:'Trade city',parts:c([
        [part(F.wallB,'fill','ink',3),part(F.wallC,'stone','ink',2),part(F.gate,'ink2',null,0)],
        [part(F.bigHouseB,'fill','ink',3,[10,-28,0.46]),part(F.bigHouseR,'shade','ink',3,[10,-28,0.46])],
        [part(F.inn,'fill','ink',2.5,[-34,4,0.38]),part(F.innRoof,'shade','ink',2.5,[-34,4,0.38])]])},
    ]},

    /* ------------------------------------------------------------------ */
    towns:{ tr:'Kasabalar', en:'Towns', items:[
      {id:'town_basic',tr:'Kasaba',en:'Town',parts:c([
        [part(F.houseB,'fill','ink',3,[-20,6,0.6]),part(F.houseR,'shade','ink',3,[-20,6,0.6])],
        [part(F.houseB,'fill','ink',3,[18,6,0.6]),part(F.houseR,'shade','ink',3,[18,6,0.6])],
        [part(F.houseB,'fill','ink',3,[-2,-18,0.56]),part(F.houseR,'shade','ink',3,[-2,-18,0.56])]])},
      {id:'town_walled',tr:'Surlu kasaba',en:'Walled town',parts:c([
        [part('M18 88 V58 H82 V88 Z','fill','ink',3),
         part('M18 58 H28 V50 H18 Z M40 58 H50 V50 H40 Z M62 58 H72 V50 H62 Z','stone','ink',2)],
        [part(F.houseB,'fill','ink',2.5,[2,-24,0.44]),part(F.houseR,'shade','ink',2.5,[2,-24,0.44])]])},
      {id:'town_crossroads',tr:'Kavşak kasabası',en:'Crossroads town',parts:c([
        [part('M6 76 H94 M50 40 V96',null,'ink3',3)],
        [part(F.houseB,'fill','ink',3,[-26,-8,0.5]),part(F.houseR,'shade','ink',3,[-26,-8,0.5])],
        [part(F.houseB,'fill','ink',3,[22,-8,0.5]),part(F.houseR,'shade','ink',3,[22,-8,0.5])]])},
      {id:'town_market',tr:'Pazar kasabası',en:'Market town',parts:c([
        [part(F.market,'fill','ink',3),part(F.marketAwn,'shade','ink',3)],
        [part(F.houseB,'fill','ink',2.5,[-34,-22,0.42]),part(F.houseR,'shade','ink',2.5,[-34,-22,0.42])]])},
      {id:'town_riverside',tr:'Nehir kasabası',en:'Riverside town',parts:c([
        [part(F.houseB,'fill','ink',3,[-20,4,0.6]),part(F.houseR,'shade','ink',3,[-20,4,0.6])],
        [part(F.houseB,'fill','ink',3,[18,4,0.6]),part(F.houseR,'shade','ink',3,[18,4,0.6])],
        [part(F.bridge,null,'ink',3.5,[2,22,0.5])]])},
      {id:'town_mining',tr:'Maden kasabası',en:'Mining town',parts:c([
        [part(F.houseB,'fill','ink',3,[-20,4,0.6]),part(F.houseR,'shade','ink',3,[-20,4,0.6])],
        [part(F.forge,'fill','ink',3,[22,2,0.58]),part(F.forgeRoof,'shade','ink',3,[22,2,0.58]),
         part(F.forgeChim,'stone','ink',2.5,[22,2,0.58])]])},
    ]},

    /* ------------------------------------------------------------------ */
    villages:{ tr:'Köyler', en:'Villages', items:[
      {id:'vil_hamlet',tr:'Mezra',en:'Hamlet',parts:c([
        [part(F.houseB,'fill','ink',3),part(F.houseR,'shade','ink',3),part(F.houseDr,'ink2',null,0)]])},
      {id:'vil_2house',tr:'Köy',en:'Village',parts:c([
        [part(F.houseB,'fill','ink',3,[-16,8,0.5]),part(F.houseR,'shade','ink',3,[-16,8,0.5])],
        [part(F.houseB,'fill','ink',3,[16,0,0.5]),part(F.houseR,'shade','ink',3,[16,0,0.5])]])},
      {id:'vil_farm',tr:'Çiftlik',en:'Farmstead',parts:c([
        [part(F.houseB,'fill','ink',3,[-8,2,0.62]),part(F.houseR,'shade','ink',3,[-8,2,0.62])],
        [part('M56 88 V62 H86 V88 Z','shade','ink',3),part('M52 64 L71 52 L90 64 Z','wood','ink',3)]])},
      {id:'vil_fishing',tr:'Balıkçı köyü',en:'Fishing village',parts:c([
        [part(F.houseB,'fill','ink',3,[-20,4,0.56]),part(F.houseR,'shade','ink',3,[-20,4,0.56])],
        [part(F.hull,'wood','ink',3,[26,12,0.36]),part(F.mast,'fill','ink',2.5,[26,12,0.36])],
        [part(F.wave,null,'water',2.5,[2,18,0.5])]])},
      {id:'vil_mill',tr:'Değirmen köyü',en:'Mill village',parts:c([
        [part(F.houseB,'fill','ink',3,[-24,4,0.56]),part(F.houseR,'shade','ink',3,[-24,4,0.56])],
        [part(F.windmill,'fill','ink',3,[26,-4,0.58]),part(F.windmillR,'shade','ink',3,[26,-4,0.58]),
         part(F.windmillB,'fill','ink',2,[26,-4,0.58])]])},
      {id:'vil_inn',tr:'Han',en:'Inn',parts:c([
        [part(F.inn,'fill','ink',3),part(F.innRoof,'shade','ink',3),
         part(F.innSign,'wood','ink',2.5)]])},
    ]},

    /* ------------------------------------------------------------------ */
    castles:{ tr:'Kaleler', en:'Castles', items:[
      {id:'cas_keep',tr:'İç kale',en:'Keep',parts:c([
        [part(F.towerB,'fill','ink',3),part(F.towerCren,'stone','ink',2.2),
         part(F.towerW,'ink2',null,0)],
        [part('M28 90 V70 H72 V90 Z','shade','ink',2.8)],
        [part(F.flagP,null,'ink',2.5),part(F.flag,'red','ink',2)]])},
      {id:'cas_castle',tr:'Kale',en:'Castle',parts:c([
        [part('M22 90 V56 H78 V90 Z','fill','ink',3),
         part('M22 56 H32 V48 H22 Z M45 56 H55 V48 H45 Z M68 56 H78 V48 H68 Z','stone','ink',2)],
        [part(F.towerB,'fill','ink',3,[3,14.6,0.46]),part(F.towerCren,'stone','ink',2,[3,14.6,0.46])],
        [part(F.towerB,'fill','ink',3,[51,14.6,0.46]),part(F.towerCren,'stone','ink',2,[51,14.6,0.46])]])},
      {id:'cas_fortress',tr:'Kale-hisar',en:'Fortress',parts:c([
        [part('M14 90 V60 H86 V90 Z','fill','ink',3),
         part('M14 60 H26 V52 H14 Z M44 60 H56 V52 H44 Z M74 60 H86 V52 H74 Z','stone','ink',2)],
        [part(F.towerB,'fill','ink',3.5,[1,25.8,0.38]),part(F.towerCren,'stone','ink',2.5,[1,25.8,0.38]),
         part(F.towerR,'red','ink',3,[1,25.8,0.38])],
        [part(F.towerB,'fill','ink',3.5,[61,25.8,0.38]),part(F.towerCren,'stone','ink',2.5,[61,25.8,0.38]),
         part(F.towerR,'red','ink',3,[61,25.8,0.38])],
        [part(F.gate,'ink2',null,0)]])},
      {id:'cas_watchtower',tr:'Gözetleme',en:'Watchtower',parts:c([
        [part(F.towerB,'fill','ink',3),part(F.towerCren,'stone','ink',2.2),
         part(F.towerR,'red','ink',3),part(F.towerW,'ink2',null,0)],
        [part('M32 90 H68',null,'ink',3)]])},
      {id:'cas_ruins',tr:'Kale harabeleri',en:'Castle ruins',parts:[
        part('M22 90 V56 H78 V90 Z','stone','ink',3),
        part('M22 56 H32 V48 H22 Z M68 56 H78 V48 H68 Z','stoned','ink',2),
        part('M58 90 V56 L68 48 L78 56','stoned','ink',2.5),
        part('M34 90 V64 M48 90 V60',null,'ink3',3),
        part('M24 78 H38',null,'ink3',2.5)]},
      {id:'cas_donjon',tr:'Donjon',en:'Donjon',parts:c([
        [part('M30 90 V30 H70 V90 Z','fill','ink',3.5),
         part('M30 30 H40 V20 H30 Z M60 30 H70 V20 H60 Z M30 30 H70 V36 H30 Z','stone','ink',2.5)],
        [part(F.towerW,'ink2',null,0,[0,6,1])],
        [part(F.flagP,null,'ink',2.5),part(F.flag,'red','ink',2)]])},
      {id:'cas_palisade',tr:'Kazık çit',en:'Palisade',parts:[
        part(F.stockade,'fill','ink',3),
        part('M50 50 L50 26 M44 52 L38 30 M56 52 L62 30',null,'ink',3)]},
    ]},

    /* ------------------------------------------------------------------ */
    ports:{ tr:'Limanlar', en:'Ports', items:[
      {id:'prt_anchor',tr:'Liman',en:'Harbour',parts:[
        part(F.anchor,null,'ink',5.5),
        part('M44 22 H56',null,'ink',5.5)]},
      {id:'prt_ship',tr:'Yelkenli',en:'Sailing ship',parts:[
        part(F.hull,'wood','ink',3),part(F.mast,'fill','ink',3),part(F.wave,null,'water',3,[0,12,1])]},
      {id:'prt_galleon',tr:'Kalyonu',en:'Galleon',parts:[
        part(F.hull,'wood','ink',3.5),part(F.mast2,'fill','ink',3),part(F.wave,null,'water',3,[0,12,1])]},
      {id:'prt_lighthouse',tr:'Deniz feneri',en:'Lighthouse',parts:[
        part(F.lighthouse,'fill','ink',3),part(F.lighthouseTop,'stone','ink',2.5),
        part(F.lighthouseLight,null,'gold',3.5),
        part('M40 56 L60 56 M40 44 L60 44',null,'red',4)]},
      {id:'prt_docks',tr:'Rıhtım',en:'Docks',parts:[
        part(F.docks,null,'wood',3.5),part(F.hull,'wood','ink',2.5,[26,-16,0.36]),
        part(F.wave,null,'water',2.5,[0,14,1])]},
    ]},

    /* ------------------------------------------------------------------ */
    ruins:{ tr:'Harabeler', en:'Ruins', items:[
      {id:'run_columns',tr:'Sütunlar',en:'Columns',parts:c([
        [part(F.column,'stone','ink',2.8,[-24,8,0.78]),part(F.columnCap,'stone','ink',2.8,[-24,8,0.78]),
         part(F.columnBase,'stone','ink',2,[-24,8,0.78])],
        [part(F.column,'stone','ink',2.8,[16,2,0.88]),part(F.columnCap,'stone','ink',2.8,[16,2,0.88]),
         part(F.columnBase,'stone','ink',2,[16,2,0.88])],
        [part('M6 88 H94',null,'ink',3.5)]])},
      {id:'run_arch',tr:'Kemer',en:'Arch ruin',parts:[
        part(F.arch,'stone','ink',3),
        part('M22 70 L14 80 M78 62 L88 72',null,'ink2',2.8)]},
      {id:'run_tower',tr:'Yıkık kule',en:'Ruined tower',parts:[
        part(F.ruins2,'stone','ink',3),
        part('M44 62 H56 V74 H44 Z','ink2',null,0),
        part('M20 90 H80',null,'ink',3)]},
      {id:'run_walls',tr:'Yıkık surlar',en:'Ruined walls',parts:[
        part('M10 90 V58 L24 62 V50 L40 56 V70 L58 62 V52 L74 66 L90 60 V90 Z','stone','ink',3),
        part('M24 78 H40 M58 76 H74',null,'ink3',2.5)]},
      {id:'run_bonepile',tr:'Kemik yığını',en:'Bone pile',parts:[
        part(F.bonepile,'fill3','ink',3),
        part(F.skull,'fill2','ink',2.5,[-4,-34,0.44]),
        part(F.skullEyes,'ink',null,0,[-4,-34,0.44])]},
      {id:'run_overgrown',tr:'Sarmaşıklı harabe',en:'Overgrown ruin',parts:[
        part(F.ruins1,'stone','ink',3),
        part('M22 70 C14 56 22 48 32 52 C28 40 40 38 44 46',null,'greend',2.5),
        part('M78 62 C88 50 84 40 74 44 C76 34 64 32 62 42',null,'greend',2.5)]},
      {id:'run_graveyard',tr:'Mezarlık',en:'Graveyard',parts:[
        part(F.graveyard,'fill','ink',3),part(F.graveyardCross,null,'ink',2.8),
        part('M12 90 H88',null,'ink',2.5)]},
      {id:'run_gallows',tr:'Darağacı',en:'Gallows',parts:[
        part(F.gallows,null,'ink',3.5),
        part('M56 68 A6 6 0 1 1 55.9 68 Z',null,'ink',3)]},
    ]},

    /* ------------------------------------------------------------------ */
    temples:{ tr:'Tapınaklar', en:'Temples', items:[
      {id:'tmp_temple',tr:'Tapınak',en:'Temple',parts:[
        part('M12 90 H88 V80 H12 Z','stone','ink',2.8),
        part(F.column,'fill','ink',2.5,[-26,-6,0.7]),
        part(F.column,'fill','ink',2.5,[0,-6,0.7]),
        part(F.column,'fill','ink',2.5,[26,-6,0.7]),
        part('M8 42 L50 12 L92 42 Z','shade','ink',3)]},
      {id:'tmp_dome',tr:'Kubbeli mabet',en:'Domed shrine',parts:[
        part(F.domeB,'fill','ink',3),part(F.dome,'shade','ink',3),
        part('M46 90 V70 H54 V90 Z','ink2',null,0),
        part('M50 40 V26 M44 32 H56',null,'gold',3.5)]},
      {id:'tmp_monastery',tr:'Manastır',en:'Monastery',parts:c([
        [part('M20 90 V60 H80 V90 Z','fill','ink',3),
         part('M16 62 L50 42 L84 62 Z','shade','ink',3)],
        [part(F.spire,'stone','ink',2.5,[-4,-22,0.6]),
         part('M40 24 V12 M35 17 H45',null,'gold',2.8)]])},
      {id:'tmp_shrine',tr:'Yol mabedi',en:'Wayshrine',parts:[
        part('M40 90 V52 H60 V90 Z','stone','ink',3),
        part('M32 54 L50 34 L68 54 Z','shade','ink',3),
        part(F.magic,'gold','ink',1.8,[30,4,0.38])]},
      {id:'tmp_cathedral',tr:'Katedral',en:'Cathedral',parts:c([
        [part('M16 90 V56 H84 V90 Z','fill','ink',3),
         part('M12 58 L50 34 L88 58 Z','shade','ink',3)],
        [part(F.spire,'stone','ink',2.5,[-8,-18,0.52]),
         part(F.spire,'stone','ink',2.5,[36,-18,0.52]),
         part('M50 32 V16 M45 22 H55',null,'gold',3)]])},
      {id:'tmp_oracle',tr:'Kehanet yeri',en:'Oracle',parts:[
        part(F.arch,'stone','ink',3),
        part(F.magic,'gold','ink',2,[6,-14,0.48]),
        part('M44 56 L56 56 M42 62 L58 62',null,'gold',2.5)]},
      {id:'tmp_idol',tr:'Put',en:'Idol',parts:[
        part(F.obelisk,'stone','ink',3.5),
        part('M38 30 H62 M40 50 H60',null,'ink2',2),
        part('M50 8 L58 20 H42 Z','gold','ink',2.5)]},
      {id:'tmp_druids',tr:'Druid taşları',en:'Standing stones',parts:[
        part(F.megalith,'stone','ink',3.5),
        part('M50 24 A10 10 0 1 1 49.9 24 Z','gold','ink',1.8,[-2,-20,0.4])]},
    ]},

    /* ------------------------------------------------------------------ */
    mines:{ tr:'Madenler', en:'Mines', items:[
      {id:'min_mine',tr:'Maden',en:'Mine',parts:[
        part(F.cave,'stone','ink',3),part(F.caveDark,'ink',null,0),
        part(F.pickaxe,null,'ink',3,[10,-32,0.5])]},
      {id:'min_forge',tr:'Demirhane',en:'Forge',parts:c([
        [part(F.forge,'fill','ink',3),part(F.forgeRoof,'shade','ink',3),
         part(F.forgeChim,'stone','ink',2.5),part(F.forgeAnvil,'stoned','ink',2)]])},
      {id:'min_quarry',tr:'Taş ocağı',en:'Quarry',parts:[
        part('M10 90 L28 54 H72 L90 90 Z','stone','ink',3),
        part('M28 54 L40 76 L58 58 L72 82',null,'ink2',2.5),
        part('M34 90 L44 76 L54 90 Z','stoned','ink',2)]},
      {id:'min_crystal',tr:'Kristal mağarası',en:'Crystal cave',parts:[
        part(F.cave,'stone','ink',3),part(F.caveDark,'ink',null,0),
        part(F.crystals,'purple','ink',2.5,[0,-14,0.7])]},
      {id:'min_furnace',tr:'Fırın',en:'Smelter',parts:[
        part('M34 90 V50 H66 V90 Z','stone','ink',3),
        part('M28 52 L50 32 L72 52 Z','shade','ink',3),
        part('M60 38 V16 H72 V38 Z','stoned','ink',2.5),
        part('M44 70 H56 V82 H44 Z','red','ink',2.5),
        part('M46 68 C46 58 54 58 54 68',null,'red',3)]},
    ]},

    /* ------------------------------------------------------------------ */
    passes:{ tr:'Geçitler', en:'Passes', items:[
      {id:'pss_pass',tr:'Dağ geçidi',en:'Mountain pass',parts:[
        part(F.passGap,'fill','ink',3.2),
        part('M46 90 C50 70 50 62 50 44',null,'ink2',3)]},
      {id:'pss_bridge',tr:'Köprü',en:'Bridge',parts:[
        part(F.bridge,null,'ink',4),part(F.bridgeFloor,null,'stone',6)]},
      {id:'pss_ford',tr:'Geçit',en:'Ford',parts:[
        part('M6 50 q12-10 24 0 t24 0 t24 0 t16 0',null,'water',4),
        part('M6 70 q12-10 24 0 t24 0 t24 0 t16 0',null,'water',4),
        part('M30 34 L44 88 M56 34 L70 88',null,'ink2',3.5)]},
      {id:'pss_border',tr:'Sınır kapısı',en:'Border gate',parts:c([
        [part(F.towerB,'fill','ink',3,[-10,36,0.6]),part(F.towerCren,'stone','ink',2,[-10,36,0.6])],
        [part(F.towerB,'fill','ink',3,[50,36,0.6]),part(F.towerCren,'stone','ink',2,[50,36,0.6])],
        [part('M34 52 H66 V62 H34 Z','wood','ink',2.8)]])},
    ]},

    /* ------------------------------------------------------------------ */
    special:{ tr:'Özel', en:'Special', items:[
      {id:'spc_wizard',tr:'Büyücü kulesi',en:'Wizard tower',parts:c([
        [part(F.towerB,'fill2','ink',3.5),part(F.towerCren,'purple','ink',2.5)],
        [part(F.towerR,'purple','ink',3)],
        [part(F.magic,'gold','ink',1.8,[0,-36,0.46])],
        [part(F.flagP,null,'ink',2.5),part('M62 8 L84 18 L62 28 Z','purple','ink',2)]])},
      {id:'spc_dragon_lair',tr:'Ejderha ini',en:'Dragon lair',parts:[
        part(F.cave,'stone','ink',3),part(F.caveDark,'ink',null,0),
        part(F.dragon,'red2','ink',2.8,[-2,-24,0.56]),
        part(F.dragonWing,'red','ink2',2.2,[-2,-24,0.56])]},
      {id:'spc_camp',tr:'Ordu kampı',en:'Army camp',parts:[
        part('M10 78 C26 58 74 58 90 78 Z','fill','ink',3),
        part('M30 78 V56 L50 44 L70 56 V78 Z','shade','ink',3),
        part('M50 44 V28',null,'ink',3),
        part('M50 30 L64 38 L50 46 Z','red','ink',2.5),
        part('M22 74 L28 60 M38 70 L40 56 M60 70 L62 56 M72 74 L78 60',null,'ink2',2)]},
      {id:'spc_graveyard',tr:'Mezarlık',en:'Graveyard',parts:[
        part(F.graveyard,'fill','ink',3),part(F.graveyardCross,null,'ink',3),
        part('M12 90 H88 M8 86 H16',null,'ink',2.5)]},
      {id:'spc_colossus',tr:'Dev heykel',en:'Colossus',parts:[
        part(F.colossus,'stone','ink',3),part(F.colossusBody,'fill','ink',3),
        part(F.colossusHead,'fill','ink',3),part(F.colossusArms,null,'ink',3.5),
        part('M44 28 H56 M44 34 H56',null,'ink2',2)]},
      {id:'spc_pyramid',tr:'Piramit',en:'Pyramid',parts:[
        part(F.pyramid,'fill','ink',3.5),part(F.pyramidLine,null,'ink2',1.8),
        part('M50 20 L90 90 L50 90 Z','shade',null,0)]},
      {id:'spc_portal',tr:'Portal',en:'Portal',parts:[
        part(F.vortex,null,'purple',2.5),
        part('M50 50 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0','purple','ink',2),
        part('M32 20 L36 32 M68 20 L64 32 M20 50 L32 48 M80 50 L68 48',null,'gold',3)]},
      {id:'spc_eye',tr:'Kötü Göz',en:'Evil Eye',parts:[
        part(F.eye,'fill2','ink',3.5),part(F.eyePupil,'purple','ink',2.5),
        part(F.eyeInner,'ink',null,0),
        part('M10 50 C20 36 34 30 50 30 M90 50 C80 36 66 30 50 30',null,'red',2)]},
      {id:'spc_kraken',tr:'Kraken',en:'Kraken',parts:[
        part(F.kraken,'fill3','ink',3),part(F.tentacles,null,'ink',3.5),
        part('M42 22 A8 8 0 1 1 41.9 22 Z M58 22 A8 8 0 1 1 57.9 22 Z','ink',null,0)]},
      {id:'spc_torch',tr:'Işık feneri',en:'Beacon',parts:[
        part(F.torch,'stone','ink',3),part(F.torchFl,'gold','ink',2.5),
        part('M50 10 C44 4 56 4 50 0',null,'gold',2)]},
      {id:'spc_library',tr:'Kütüphane',en:'Library',parts:[
        part(F.bigHouseB,'fill','ink',3),part(F.bigHouseR,'shade','ink',3),
        part(F.scroll,'fill2','ink',2.5,[-2,-22,0.44]),
        part(F.scrollLine,null,'ink3',1.8,[-2,-22,0.44])]},
      {id:'spc_arena',tr:'Arena',en:'Arena',parts:[
        part('M50 50 m-36 0 a36 36 0 1 0 72 0 a36 36 0 1 0 -72 0','stone','ink',4),
        part('M50 50 m-28 0 a28 28 0 1 0 56 0 a28 28 0 1 0 -56 0','fill','ink',2.5),
        part('M50 50 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0','shade','ink',2)]},
    ]},

    /* ------------------------------------------------------------------ */
    misc:{ tr:'Dekoratif', en:'Decorative', items:[
      {id:'msc_compass',tr:'Pusula gülü',en:'Compass rose',parts:[
        part(F.compass,null,'ink',3),
        part(F.compassCross,null,'ink2',1.6),
        part(F.compassN,'fill','ink',2.2),
        part('M50 8 L57 50 L50 92 Z','ink',null,0),
        part('M50 50 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0','gold','ink',2)]},
      {id:'msc_suncompass',tr:'Güneş pusulası',en:'Sun compass',parts:[
        part(F.sunFace,'fill2','ink',3),part(F.sunRay,'fill','ink',2.5),
        part('M50 34 A16 16 0 1 1 49.9 34 Z','shade','ink',2.5),
        part('M44 44 L50 50 L56 44 M50 50 V58',null,'ink',2.5)]},
      {id:'msc_star',tr:'Yıldız işareti',en:'Star mark',parts:[
        part(F.star8,'fill','ink',2.5),
        part('M50 24 L54 46 L50 50 L46 46 Z','ink',null,0)]},
      {id:'msc_banner',tr:'Sancak',en:'Banner',parts:[
        part(F.banner,'fill','ink',3),part(F.bannerLine,null,'ink2',2)]},
      {id:'msc_skull',tr:'Tehlike',en:'Danger',parts:[
        part(F.skull,'fill','ink',3),part(F.skullEyes,'ink',null,0),
        part(F.skullNose,'ink',null,0),part(F.skullTeeth,null,'ink',2.8)]},
      {id:'msc_ship',tr:'Gemi',en:'Ship at sea',parts:[
        part(F.hull,'wood','ink',3),part(F.mast,'fill','ink',3),
        part(F.wave,null,'water',3,[0,12,1])]},
      {id:'msc_monster',tr:'Deniz canavarı',en:'Sea monster',parts:[
        part(F.dragon,'fill3','ink',3),part(F.dragonWing,'shade','ink',2.5)]},
      {id:'msc_scale',tr:'Ölçek',en:'Scale bar',parts:[
        part('M8 46 H92 V62 H8 Z','fill','ink',2.8),
        part('M29 46 H50 V62 H29 Z M71 46 H92 V62 H71 Z','ink',null,0),
        part('M8 40 V46 M50 40 V46 M92 40 V46',null,'ink',2.5)]},
      {id:'msc_scroll',tr:'Tomar',en:'Scroll',parts:[
        part(F.scroll,'fill2','ink',3),part(F.scrollLine,null,'ink3',1.8)]},
    ]},

    /* ------------------------------------------------------------------
       CANLILAR — nüfus/kalabalık işaretleri ve jenerik fantazya ırkları
       (§ catalog2.js'teki izometrik ırk binalarıyla aynı jenerik/isimsiz
       yaklaşım) artı birkaç yaygın hayvan. Basit, tek-silüet mürekkep
       ikonlar — harita ölçeğinde okunaklı kalması için ayrıntı az. */
    beings:{ tr:'Canlılar', en:'Beings', items:[
      {id:'bg_person',tr:'İnsan',en:'Human',parts:[
        part('M41 21 A9 9 0 1 1 59 21 A9 9 0 1 1 41 21 Z','fill','ink',2.6),
        part('M50 29 L37 48 L41 90 H59 L63 48 Z','shade','ink',2.6)]},
      {id:'bg_crowd',tr:'Kalabalık',en:'Crowd',parts:c([
        [part('M32 30 A7 7 0 1 1 46 30 A7 7 0 1 1 32 30 Z','shade2','ink',2.2),
         part('M39 37 L28 52 L31 84 H47 L50 52 Z','shade2','ink',2.2)],
        [part('M54 26 A7 7 0 1 1 68 26 A7 7 0 1 1 54 26 Z','fill','ink',2.4),
         part('M61 33 L50 50 L53 88 H69 L72 50 Z','shade','ink',2.4)],
        [part('M70 32 A6 6 0 1 1 82 32 A6 6 0 1 1 70 32 Z','shade2','ink',2.2),
         part('M76 38 L67 52 L70 80 H82 L85 52 Z','shade2','ink',2.2)]])},
      {id:'bg_elf',tr:'Elf',en:'Elf',parts:[
        part('M41 21 A9 9 0 1 1 59 21 A9 9 0 1 1 41 21 Z','fill','ink',2.6),
        part('M40 18 L32 12 L38 24 Z M60 18 L68 12 L62 24 Z','fill','ink',2),
        part('M50 29 L38 47 L42 90 H58 L62 47 Z','green','ink',2.6)]},
      {id:'bg_dwarf',tr:'Cüce',en:'Dwarf',parts:[
        part('M41 20 A8 8 0 1 1 57 20 A8 8 0 1 1 41 20 Z','fill','ink',2.6),
        part('M50 34 L35 50 L39 88 H61 L65 50 Z','stoned','ink',2.6),
        part('M41 24 L38 44 L49 52 L60 44 L57 24 Z','shade3','ink',2.4)]},
      {id:'bg_orc',tr:'Ork',en:'Orc',parts:[
        part('M40 22 A9 9 0 1 1 60 22 A9 9 0 1 1 40 22 Z','green2','ink',2.6),
        part('M44 28 L42 34 L47 30 Z M56 28 L58 34 L53 30 Z','fill','ink',1.8),
        part('M50 31 L34 50 L39 90 H61 L66 50 Z','shade3','ink',2.8)]},
      {id:'bg_halfling',tr:'Küçük halk',en:'Little folk',parts:[
        part('M43 24 A7 7 0 1 1 57 24 A7 7 0 1 1 43 24 Z','fill','ink',2.4),
        part('M50 31 L41 46 L44 82 H56 L59 46 Z','gold','ink',2.4)]},
      {id:'bg_gnome',tr:'Cin ustası',en:'Gnome',parts:[
        part('M43 26 A7 7 0 1 1 57 26 A7 7 0 1 1 43 26 Z','fill','ink',2.4),
        part('M50 6 L43 18 H57 Z','red','ink',2),
        part('M50 33 L41 46 L44 82 H56 L59 46 Z','blue','ink',2.4)]},
      {id:'bg_horse',tr:'At',en:'Horse',parts:[
        part('M26 55 A22 12 0 1 1 70 55 A22 12 0 1 1 26 55 Z','shade2','ink',2.4),
        part('M56 48 L62 24 L70 24 L66 48 Z','shade2','ink',2.2),
        part('M57 20 A7 7 0 1 1 71 20 A7 7 0 1 1 57 20 Z','fill','ink',2.2),
        part('M60 14 L58 8 L64 13 Z','fill','ink',1.6),
        part('M62 26 L57 22 M64 30 L59 26 M66 34 L61 30',null,'ink3',2),
        part('M56 62 H60 V84 H56 Z M64 62 H68 V84 H64 Z M30 62 H34 V84 H30 Z M38 62 H42 V84 H38 Z','shade3','ink',2),
        part('M27 50 Q18 54 21 66',null,'ink3',2.4)]},
      {id:'bg_wolf',tr:'Kurt',en:'Wolf',parts:[
        part('M28 58 Q14 54 18 40 Q26 44 30 54 Z','stoned','ink',2.2),
        part('M28 60 A18 9 0 1 1 62 60 A18 9 0 1 1 28 60 Z','stoned','ink',2.4),
        part('M60 52 A6 6 0 1 1 72 52 A6 6 0 1 1 60 52 Z','stoned','ink',2.2),
        part('M70 52 L79 55 L70 59 Z','stoned','ink',1.8),
        part('M62 47 L60 39 L67 46 Z M68 47 L71 39 L73 47 Z','stoned','ink',1.8),
        part('M32 66 H36 V82 H32 Z M40 66 H44 V82 H40 Z M48 66 H52 V82 H48 Z M56 66 H60 V82 H56 Z','shade3','ink',2)]},
      {id:'bg_deer',tr:'Geyik',en:'Deer',parts:[
        part('M28 58 A18 9 0 1 1 62 58 A18 9 0 1 1 28 58 Z','shade3','ink',2.4),
        part('M54 52 L60 28 L66 28 L62 52 Z','shade3','ink',2.2),
        part('M55 24 A6 6 0 1 1 67 24 A6 6 0 1 1 55 24 Z','shade3','ink',2),
        part('M58 20 L54 10 M58 20 L56 14 L52 12 M64 20 L68 10 M64 20 L66 14 L70 12',null,'ink3',2),
        part('M32 64 H36 V82 H32 Z M40 64 H44 V82 H40 Z M48 64 H52 V82 H48 Z M56 64 H60 V82 H56 Z','wood','ink',2)]},
      {id:'bg_sheep',tr:'Koyun',en:'Sheep',parts:[
        part('M24 60 Q22 46 36 44 Q40 38 52 40 Q64 38 70 46 Q80 46 80 58 Q80 64 72 64 L70 82 L64 82 L65 66 L34 66 L34 82 L28 82 L29 64 Q24 66 24 60 Z','fill3','ink',2.6),
        part('M74 44 A6 6 0 1 1 86 44 A6 6 0 1 1 74 44 Z','shade2','ink',2)]},
      {id:'bg_birdflock',tr:'Kuş sürüsü',en:'Bird flock',parts:[
        part('M20 40 Q26 34 32 40 Q38 34 44 40',null,'ink',2.6),
        part('M46 56 Q54 48 62 56 Q70 48 78 56',null,'ink',2.6),
        part('M30 68 Q35 63 40 68 Q45 63 50 68',null,'ink',2.2),
        part('M58 30 Q63 25 68 30 Q73 25 78 30',null,'ink',2.2)]},
    ]},

    /* ------------------------------------------------------------------
       EŞYA — bölge bağlantısıyla girilen İÇ MEKÂN haritaları (oda, avlu,
       salon) için taşınabilir eşya/nesne sembolleri. Mekanik olarak yeni
       bir şey gerekmiyor: aynı "Kara" fırçasıyla oda şeklini boyayıp
       üstüne iç mekân doku(ları)nı (bkz. layers.js — Ahşap/Taş zemin,
       Halı, Taş duvar vb.) işleyip bu sembolleri yerleştirmek yeterli. */
    furniture:{ tr:'Eşya', en:'Furniture', items:[
      {id:'fn_bed',tr:'Yatak',en:'Bed',parts:[
        part('M18 26 H82 V88 H18 Z','fill','ink',2.6),
        part('M18 18 H82 V28 H18 Z','shade2','ink',2.4),
        part('M26 32 H46 V46 H26 Z M54 32 H74 V46 H54 Z','fill2','ink',1.8),
        part('M18 62 H82',null,'ink3',2)]},
      {id:'fn_table_round',tr:'Yuvarlak masa',en:'Round table',parts:[
        part('M50 50 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0','wood','ink',3),
        part('M50 50 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0',null,'ink3',1.6)]},
      {id:'fn_table_rect',tr:'Masa',en:'Table',parts:[
        part('M14 34 H86 V66 H14 Z','wood','ink',3),
        part('M14 34 H86 M14 66 H86',null,'ink3',1.6)]},
      {id:'fn_chair',tr:'Sandalye',en:'Chair',parts:[
        part('M28 30 H72 V74 H28 Z','wood','ink',2.6),
        part('M28 30 H72 V38 H28 Z','shade2','ink',2)]},
      {id:'fn_chest',tr:'Sandık',en:'Chest',parts:[
        part('M16 40 H84 V82 H16 Z','wood','ink',3),
        part('M16 40 H84 V30 Q50 18 16 30 Z','shade2','ink',2.6),
        part('M46 40 H54 V50 H46 Z','ink',null,0)]},
      {id:'fn_bookshelf',tr:'Kitaplık',en:'Bookshelf',parts:[
        part('M16 16 H84 V84 H16 Z','wood','ink',3),
        part('M16 34 H84 M16 52 H84 M16 68 H84',null,'ink3',2),
        part('M22 20 H26 V32 H22 Z M30 20 H35 V32 H30 Z M40 20 H44 V32 H40 Z','shade','ink',1.4),
        part('M22 38 H27 V50 H22 Z M32 38 H36 V50 H32 Z M60 38 H66 V50 H60 Z','red','ink',1.4)]},
      {id:'fn_fireplace',tr:'Şömine',en:'Fireplace',parts:[
        part('M14 20 H86 V70 H68 V40 H32 V70 H14 Z','stoned','ink',3),
        part('M14 20 H86 V28 H14 Z','shade2','ink',2),
        part('M40 66 L46 46 L50 58 L56 42 L60 66 Z','red','ink',2)]},
      {id:'fn_cauldron',tr:'Kazan',en:'Cauldron',parts:[
        part('M38 70 L44 58 L50 68 L56 56 L62 70',null,'red',2.4),
        part('M50 50 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0','darkgray','ink',3),
        part('M28 44 H72',null,'ink',2.4),
        part('M20 40 L32 44 M80 40 L68 44',null,'ink3',2)]},
      {id:'fn_cabinet',tr:'Dolap',en:'Cabinet',parts:[
        part('M22 16 H78 V88 H22 Z','wood','ink',3),
        part('M48 16 V88',null,'ink3',2),
        part('M39 46 H43 V50 H39 Z M57 46 H61 V50 H57 Z','ink3',null,0)]},
      {id:'fn_crate',tr:'Kasa',en:'Crate',parts:[
        part('M20 20 H80 V80 H20 Z','wood','ink',3),
        part('M20 20 L80 80 M80 20 L20 80',null,'ink3',2)]},
      {id:'fn_rug',tr:'Halı',en:'Rug',parts:[
        part('M14 24 H86 V76 H14 Z','red','ink',2.6),
        part('M22 32 H78 V68 H22 Z',null,'gold',1.6),
        part('M50 50 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0',null,'gold',1.4)]},
      {id:'fn_window',tr:'Pencere',en:'Window',parts:[
        part('M20 30 H80 V70 H20 Z','water','ink',3),
        part('M50 30 V70 M20 50 H80',null,'ink',2.4)]},
      {id:'fn_door',tr:'İç kapı',en:'Interior door',parts:[
        part('M30 12 H70 V88 H30 Z',null,'ink',3),
        part('M30 88 A40 40 0 0 0 70 48',null,'ink3',1.6)]},
      {id:'fn_sconce',tr:'Duvar meşalesi',en:'Wall sconce',parts:[
        part('M46 60 H54 V90 H46 Z','wood','ink',2.4),
        part('M46 50 H54 V62 H46 Z','stoned','ink',2),
        part('M42 30 Q50 10 58 30 Q54 46 50 50 Q46 46 42 30 Z','red','ink',2)]},
      {id:'fn_weaponrack',tr:'Silah rafı',en:'Weapon rack',parts:[
        part('M20 78 H80 V86 H20 Z','wood','ink',2.4),
        part('M30 78 L26 20 M45 78 L45 16 M60 78 L64 20 M75 78 L79 24',null,'ink3',2.4),
        part('M26 20 L20 26 L26 14 Z M45 16 L39 22 L51 22 Z M64 20 L70 26 L58 26 Z','shade',null,0)]},
      {id:'fn_throne',tr:'Taht',en:'Throne',parts:[
        part('M26 20 H74 V40 H60 V78 H40 V40 H26 Z','gold','ink',3),
        part('M30 16 L50 6 L70 16 Z','gold','ink',2.4),
        part('M20 40 H30 V70 H20 Z M70 40 H80 V70 H70 Z','shade2','ink',2.4)]},
      {id:'fn_anvil',tr:'Örs',en:'Anvil',parts:[
        part('M20 68 H80 V78 H20 Z','darkgray','ink',2.8),
        part('M32 50 H68 V68 H32 Z','darkgray','ink',2.6),
        part('M28 40 H88 L80 50 H28 Z','darkgray','ink',2.6)]},
    ]},
  };



  /* ====================================================================
     İZOMETRİK KATALOG ENTEGRASYONU
     catalog.js içindeki Iso.Scene tarifleri ilgili kategorilere
     eklenir. Yeni kategoriler gerekiyorsa oluşturulur.
     ==================================================================== */
  var EXTRA_CATS = {
    nomads:   { tr:'Göçebe & Kamp', en:'Nomads & Camps' },
    military: { tr:'Askerî',        en:'Military' },
    magic:    { tr:'Büyü & Karanlık',en:'Magic & Dark' },
    cultures: { tr:'Kültürler',     en:'Cultures' }
  };

  function integrateIso() {
    if (!global.IsoCatalog || !global.Iso) return;
    var CAT = global.IsoCatalog.ITEMS;
    Object.keys(CAT).forEach(function (cat) {
      if (!SYMBOLS[cat]) {
        var meta = EXTRA_CATS[cat] || { tr:cat, en:cat };
        SYMBOLS[cat] = { tr:meta.tr, en:meta.en, items:[] };
      }
      CAT[cat].forEach(function (def) {
        var built = null;
        var item = {
          id:def.id, tr:def.tr, en:def.en, iso:true,
          get parts() {
            if (!built) built = def.make().build(part);
            return built;
          }
        };
        SYMBOLS[cat].items.push(item);
      });
    });
  }

  /* ====================================================================
     CUSTOM PNG SEMBOL SİSTEMİ
     ==================================================================== */
  var customSymbols = [];
  var customMap = {};

  function addCustom(id, name, dataURL, w, h) {
    var entry = { id: id, tr: name, en: name, dataURL: dataURL, imgW: w || 100, imgH: h || 100, custom: true };
    customSymbols.push(entry);
    customMap[id] = entry;
    return entry;
  }

  function removeCustom(id) {
    customSymbols = customSymbols.filter(function(s){ return s.id !== id; });
    delete customMap[id];
  }

  function getCustomAll() { return customSymbols; }

  /* custom PNG'yi canvas'a çiz */
  var imgCache = {};
  function loadImg(url, cb) {
    if (imgCache[url]) { cb(imgCache[url]); return; }
    var im = new Image();
    im.onload = function(){ imgCache[url]=im; cb(im); };
    im.onerror = function(){ cb(null); };
    im.src = url;
  }

  /* ====================================================================
     INDEKS
     ==================================================================== */
  integrateIso();

  var index = {};
  Object.keys(SYMBOLS).forEach(function(ck){
    SYMBOLS[ck].items.forEach(function(it){ index[it.id]={def:it,cat:ck}; });
  });

  function get(id) {
    if(index[id]) return index[id].def;
    if(customMap[id]) return customMap[id];
    return null;
  }
  function catOf(id){
    if(index[id]) return index[id].cat;
    if(customMap[id]) return '__custom__';
    return null;
  }
  function isCustom(id){ return !!customMap[id]; }

  /* ====================================================================
     RENKLENDİRME
     ==================================================================== */
  var hueCache={};
  function hexToHsl(h){
    h=h.replace('#','');
    if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n=parseInt(h,16),r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255;
    var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=0,hv=0,d=mx-mn;
    if(d){s=l>0.5?d/(2-mx-mn):d/(mx+mn);
      if(mx===r)hv=(g-b)/d+(g<b?6:0);
      else if(mx===g)hv=(b-r)/d+2;
      else hv=(r-g)/d+4; hv/=6;}
    return[hv*360,s,l];
  }
  function shift(color,hue){
    if(!hue)return color;
    var k=color+'|'+hue;if(hueCache[k])return hueCache[k];
    var c=PAL[color]||color,hsl=hexToHsl(c);
    var nh=((hsl[0]+hue)%360+360)%360;
    var out='hsl('+nh.toFixed(1)+','+( hsl[1]*100).toFixed(1)+'%,'+(hsl[2]*100).toFixed(1)+'%)';
    hueCache[k]=out;return out;
  }
  function resolve(key,hue,wear){
    var c=PAL[key]||key;
    if(!wear) return shift(c,hue||0);
    /* yıpranma: doygunluk/parlaklık düşer, ton toprak/kir rengine kayar */
    var hsl=hexToHsl(c);
    var h=((hsl[0]+(hue||0))%360+360)%360;
    var dirtHue=32;
    var diff=((dirtHue-h)%360+540)%360-180;
    h=((h+diff*wear*0.30)%360+360)%360;
    var s=Math.max(0,hsl[1]*(1-wear*0.50));
    var l=Math.max(0,Math.min(1,hsl[2]*(1-wear*0.18)));
    return 'hsl('+h.toFixed(1)+','+(s*100).toFixed(1)+'%,'+(l*100).toFixed(1)+'%)';
  }

  function wearSeed(o){
    var idStr=String(o.id||'')+'_'+Math.round(o.x||0)+'_'+Math.round(o.y||0);
    var seed=0;
    for(var q=0;q<idStr.length;q++) seed+=idStr.charCodeAt(q)*(q+1);
    return seed;
  }
  function seededRand(seed){ var x=Math.sin(seed)*43758.5453; return x-Math.floor(x); }

  /* yıpranmış semboller için kir/leke serpmesi — obje bazlı deterministik desen */
  function drawWearSpeckle(ctx, o){
    if(!o.wear) return;
    var n=Math.round(5+o.wear*16);
    var seed=wearSeed(o);
    ctx.save();
    for(var i=0;i<n;i++){
      var r1=seededRand(seed+i*12.9898), r2=seededRand(seed+i*78.233), r3=seededRand(seed+i*37.719);
      var ang=r1*Math.PI*2, rad=Math.sqrt(r2)*44;
      var px=50+Math.cos(ang)*rad, py=50+Math.sin(ang)*rad;
      var rr=0.7+r3*1.6;
      ctx.globalAlpha=(0.20+r3*0.20)*o.wear;
      ctx.fillStyle=r3<0.5?'rgba(58,42,22,1)':'rgba(20,18,14,1)';
      ctx.beginPath(); ctx.arc(px,py,rr,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  /* ====================================================================
     ÇİZİM
     ==================================================================== */
  var pathCache={};
  function getp(d){if(!pathCache[d])pathCache[d]=new Path2D(d);return pathCache[d];}

  function draw(ctx, id, o, onDone) {
    if(isCustom(id)){
      var ce=customMap[id];
      loadImg(ce.dataURL,function(im){
        if(!im){if(onDone)onDone();return;}
        var sz=o.size||64, hf=sz/2;
        ctx.save();
        ctx.globalAlpha=(o.opacity===undefined?1:o.opacity)*ctx.globalAlpha;
        ctx.translate(o.x||0,o.y||0);
        if(o.rot)ctx.rotate(o.rot*Math.PI/180);
        if(o.hue){
          ctx.filter='hue-rotate('+o.hue+'deg)';
        }
        ctx.drawImage(im,-hf,-hf,sz,sz);
        ctx.restore();
        if(onDone)onDone();
      });
      return;
    }

    var def=get(id);if(!def)return;
    var size=o.size||64,hue=o.hue||0;
    ctx.save();
    ctx.globalAlpha=(o.opacity===undefined?1:o.opacity)*ctx.globalAlpha;
    ctx.translate(o.x||0,o.y||0);
    if(o.rot)ctx.rotate(o.rot*Math.PI/180);
    var s=size/100;
    ctx.scale(o.flip?-s:s,s);
    ctx.translate(-50,-50);
    ctx.lineJoin='round';ctx.lineCap='round';
    for(var i=0;i<def.parts.length;i++){
      var pt=def.parts[i];
      ctx.save();
      if(pt.tr){ctx.translate(pt.tr[0],pt.tr[1]);ctx.scale(pt.tr[2],pt.tr[2]);}
      var path=getp(pt.d);
      if(pt.f){ctx.fillStyle=resolve(pt.f,hue,o.wear);ctx.fill(path);}
      if(pt.s&&pt.lw){ctx.strokeStyle=resolve(pt.s,hue,o.wear);ctx.lineWidth=pt.lw;ctx.stroke(path);}
      ctx.restore();
    }
    drawWearSpeckle(ctx, o);
    ctx.restore();
    if(onDone)onDone();
  }

  /* SVG export */
  function toSVG(id,o){
    if(isCustom(id)){
      var ce=customMap[id],sz=o.size||64,hf=sz/2;
      return '<image x="'+(o.x-hf)+'" y="'+(o.y-hf)+'" width="'+sz+'" height="'+sz+
             '" opacity="'+(o.opacity||1)+'" transform="rotate('+(o.rot||0)+' '+o.x+' '+o.y+
             ')" xlink:href="'+ce.dataURL+'"/>';
    }
    var def=get(id);if(!def)return'';
    var hue=o.hue||0,s=(o.size||64)/100;
    var t='translate('+o.x+','+o.y+') rotate('+(o.rot||0)+') scale('+
          ((o.flip?-s:s))+','+s+') translate(-50,-50)';
    var out='<g transform="'+t+'" opacity="'+(o.opacity===undefined?1:o.opacity)+
            '" stroke-linejoin="round" stroke-linecap="round">';
    def.parts.forEach(function(pt){
      var attrs=' d="'+pt.d+'"';
      attrs+=' fill="'+(pt.f?resolve(pt.f,hue,o.wear):'none')+'"';
      if(pt.s&&pt.lw)attrs+=' stroke="'+resolve(pt.s,hue,o.wear)+'" stroke-width="'+pt.lw+'"';
      else attrs+=' stroke="none"';
      if(pt.tr)attrs+=' transform="translate('+pt.tr[0]+','+pt.tr[1]+') scale('+pt.tr[2]+')"';
      out+='<path'+attrs+'/>';
    });
    if(o.wear) out+=wearSpeckleSVG(o);
    return out+'</g>';
  }

  function wearSpeckleSVG(o){
    var n=Math.round(5+o.wear*16), seed=wearSeed(o), out='';
    for(var i=0;i<n;i++){
      var r1=seededRand(seed+i*12.9898), r2=seededRand(seed+i*78.233), r3=seededRand(seed+i*37.719);
      var ang=r1*Math.PI*2, rad=Math.sqrt(r2)*44;
      var px=(50+Math.cos(ang)*rad).toFixed(2), py=(50+Math.sin(ang)*rad).toFixed(2);
      var rr=(0.7+r3*1.6).toFixed(2);
      var col=r3<0.5?'#3a2a16':'#141210';
      var a=((0.20+r3*0.20)*o.wear).toFixed(2);
      out+='<circle cx="'+px+'" cy="'+py+'" r="'+rr+'" fill="'+col+'" opacity="'+a+'"/>';
    }
    return out;
  }

  function bounds(o){
    if (o.kind === 'group') {
      if (!o.members || !o.members.length) return { x:0, y:0, w:0, h:0 };
      var bs = o.members.map(bounds);
      var x0 = Math.min.apply(null, bs.map(function(b){return b.x;}));
      var y0 = Math.min.apply(null, bs.map(function(b){return b.y;}));
      var x1 = Math.max.apply(null, bs.map(function(b){return b.x+b.w;}));
      var y1 = Math.max.apply(null, bs.map(function(b){return b.y+b.h;}));
      return { x:x0, y:y0, w:x1-x0, h:y1-y0 };
    }
    var h=(o.size||64)/2;return{x:o.x-h,y:o.y-h,w:h*2,h:h*2};
  }

  function count(){
    var n=0;
    Object.keys(SYMBOLS).forEach(function(k){n+=SYMBOLS[k].items.length;});
    return n+customSymbols.length;
  }

  function serializeCustom(){
    return customSymbols.map(function(s){return{id:s.id,tr:s.tr,en:s.en,dataURL:s.dataURL,imgW:s.imgW,imgH:s.imgH};});
  }
  function deserializeCustom(arr){
    customSymbols=[];customMap={};
    (arr||[]).forEach(function(e){addCustom(e.id,e.tr||e.en,e.dataURL,e.imgW,e.imgH);});
  }

  global.Sym={
    PAL:PAL,SYMBOLS:SYMBOLS,get:get,catOf:catOf,isCustom:isCustom,
    draw:draw,toSVG:toSVG,bounds:bounds,count:count,
    shift:shift,resolve:resolve,
    addCustom:addCustom,removeCustom:removeCustom,getCustomAll:getCustomAll,
    serializeCustom:serializeCustom,deserializeCustom:deserializeCustom,
    loadImg:loadImg
  };
})(window);
