/*
  Floating floor boards: the hero showstopper.
  Flat slabs textured with photos of real materials hang in 3D and lean toward the cursor.
  Needs three.js (r128, loaded globally from index.html). No build step.
*/
(function () {
  'use strict';

  var canvas = document.getElementById('boards');
  if (!canvas) return;
  var hero = canvas.closest('.stage');   // hero + founders share one canvas
  var tip = document.getElementById('tip');
  var hint = document.getElementById('hint');

  function fallback() { hero.classList.add('no-webgl'); if (hint) hint.style.display = 'none'; }
  if (!window.THREE) return fallback();

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // `?touch` in the address forces phone mode on a desktop, for testing.
  var coarse = window.matchMedia('(pointer: coarse)').matches || /[?&]touch\b/.test(location.search);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return fallback(); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.z = 14;
  var TAN = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  var key = new THREE.DirectionalLight(0xfff3df, 0.8);
  key.position.set(-4, 6, 9);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xdfe8ff, 0.25);
  fill.position.set(6, -3, 4);
  scene.add(fill);

  var group = new THREE.Group();
  scene.add(group);

  // w/h are board size in scene units; edge is the colour of the slab's side.
  var DEFS = [
    { file: 'wood-honey',    w: 3.0, h: 0.95, t: 0.07, edge: '#a9733a', label: 'Hardwood-look plank' },
    { file: 'vinyl-oak',     w: 3.0, h: 0.85, t: 0.06, edge: '#cdb892', label: 'Vinyl plank' },
    { file: 'tile-marble',   w: 1.7, h: 1.7,  t: 0.09, edge: '#e7e0d4', label: 'Marble-look tile' },
    { file: 'vinyl-grey',    w: 3.0, h: 0.7,  t: 0.06, edge: '#555d5d', label: 'Vinyl plank' },
    { file: 'tile-hex',      w: 1.5, h: 1.5,  t: 0.09, edge: '#e9e6df', label: 'Hex mosaic' },
    { file: 'tile-green',    w: 3.0, h: 1.0,  t: 0.09, edge: '#6d7a68', label: 'Stone-look tile' },
    { file: 'vinyl-amber',   w: 3.0, h: 0.6,  t: 0.06, edge: '#b27a3e', label: 'Vinyl plank' },
    { file: 'tile-quarry',   w: 1.6, h: 1.6,  t: 0.10, edge: '#8a3a22', label: 'Quarry tile' },
    { file: 'tile-flower',   w: 1.5, h: 1.5,  t: 0.09, edge: '#e5e2d8', label: 'Mosaic tile' },
    { file: 'vinyl-teal',    w: 3.0, h: 0.6,  t: 0.06, edge: '#6f8f8c', label: 'Vinyl plank' },
    { file: 'tile-grey',     w: 2.4, h: 1.2,  t: 0.09, edge: '#7a7770', label: 'Porcelain tile' }
  ];

  var pieces = [];
  var aspect = 1, W = 1, H = 1;
  var pt = { x: 0, y: 0 };      // target pointer, -1..1
  var pm = { x: 0, y: 0 };      // smoothed pointer
  var lastMove = -1e9;
  var pointerNDC = null;
  var hovered = null;
  var running = false, visible = true, raf = 0;
  var clock = new THREE.Clock();
  var tAll = 0;
  var raycaster = new THREE.Raycaster();

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }

  // ---------- build ----------
  function loadTextures(done) {
    var loader = new THREE.TextureLoader();
    var aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var left = DEFS.length;
    DEFS.forEach(function (d) {
      var edge = new THREE.MeshStandardMaterial({ color: d.edge, roughness: 0.8 });
      var back = new THREE.MeshStandardMaterial({ color: new THREE.Color(d.edge).multiplyScalar(0.7), roughness: 0.9 });
      d.mats = { edge: edge, back: back, front: null };
      loader.load('assets/tex/' + d.file + '.jpg', function (tex) {
        tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = aniso;
        d.mats.front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 });
        if (--left === 0) done();
      }, undefined, function () {
        d.mats.front = new THREE.MeshStandardMaterial({ color: d.edge, roughness: 0.6 });
        if (--left === 0) done();
      });
    });
  }

  function build() {
    var count = coarse || window.innerWidth < 700 ? 15 : 28;
    for (var i = 0; i < count; i++) {
      var d = DEFS[i % DEFS.length];
      var geo = new THREE.BoxGeometry(d.w, d.h, d.t);
      var mesh = new THREE.Mesh(geo, [d.mats.edge, d.mats.edge, d.mats.edge, d.mats.edge, d.mats.front, d.mats.back]);
      var sc = rand(0.8, 1.2);
      var p = {
        mesh: mesh, def: d, scale: sc,
        base: new THREE.Vector3(),
        rx: rand(-0.45, 0.45), ry: rand(-0.6, 0.6), rz: rand(-0.7, 0.7),
        phase: rand(0, Math.PI * 2), delay: 0.05 + i * 0.045, df: 0, hover: 0
      };
      mesh.userData.piece = p;
      mesh.scale.setScalar(reduce ? sc : 0.001);
      group.add(mesh);
      pieces.push(p);
    }
    layout();
    pieces.forEach(function (p) {
      p.mesh.position.copy(p.base);
      p.mesh.rotation.set(p.rx, p.ry, p.rz);
    });
  }

  // Scatter boards through the view, keeping the headline area clear.
  function layout() {
    var portrait = aspect < 0.9;
    var sizeMul = clamp(aspect / 1.3, 0.55, 1);
    var placed = [];
    var minD = portrait ? 0.34 : 0.26;
    pieces.forEach(function (p) {
      var best = null, bestScore = -1;
      for (var n = 0; n < 80; n++) {
        var z = rand(-4.5, 2.4);
        var hh = (14 - z) * TAN, hw = hh * aspect;
        var nx = rand(-1.05, 1.05), ny = rand(-1.45, 1.0);   // extra room below: scrolling lifts boards up into view behind the founders
        var blocked = portrait
          ? Math.abs(ny) < 0.40
          : (nx / 0.64) * (nx / 0.64) + (ny / 0.58) * (ny / 0.58) < 1;
        if (blocked) continue;
        var nearest = 9;
        for (var k = 0; k < placed.length; k++) {
          var dx = (nx - placed[k][0]) * aspect, dy = ny - placed[k][1];
          nearest = Math.min(nearest, Math.sqrt(dx * dx + dy * dy));
        }
        if (nearest > bestScore) { bestScore = nearest; best = { z: z, hw: hw, hh: hh, nx: nx, ny: ny }; }
        if (nearest >= minD) break;
      }
      if (!best) best = { z: 0, hw: 4 * aspect, hh: 4, nx: rand(0.6, 1), ny: rand(-1, 1) };
      placed.push([best.nx, best.ny]);
      p.base.set(best.nx * best.hw, best.ny * best.hh, best.z);
      p.df = (best.z + 5) / 8;     // 0 far .. ~1 near
      p.size = sizeMul;
      p.mesh.userData.targetScale = p.scale * sizeMul;
    });
  }

  // ---------- size ----------
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    renderer.setSize(W, H, false);
    var a = W / H;
    var rebucket = (a < 0.9) !== (aspect < 0.9) || Math.abs(a - aspect) > 0.25;
    aspect = a;
    camera.aspect = a;
    camera.updateProjectionMatrix();
    if (pieces.length && rebucket) {
      layout();
      if (reduce) renderOnce();
    }
  }

  // ---------- pointer ----------
  function setPointer(e) {
    var r = canvas.getBoundingClientRect();
    pt.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    pt.y = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -1, 1);
    var onContent = !!(e.target.closest && e.target.closest('.hero-copy, .founders-photo, .btn, a, header'));
    pointerNDC = onContent ? null : new THREE.Vector2(pt.x, pt.y);   // no hover labels under the headline or photo
    lastMove = performance.now();
    if (tip && !coarse && e.pointerType === 'mouse') { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; }
    if (hint && !hint.classList.contains('gone')) hint.classList.add('gone');
  }
  if (!reduce && !coarse) {
    hero.addEventListener('pointermove', setPointer, { passive: true });
    hero.addEventListener('pointerdown', setPointer, { passive: true });
    hero.addEventListener('pointerleave', function () { pointerNDC = null; setHover(null); lastMove = performance.now() - 2000; }, { passive: true });
  }
  // Phones: the hint fades once the visitor starts scrolling.
  if (coarse && hint) {
    window.addEventListener('scroll', function () { if (window.scrollY > 40) hint.classList.add('gone'); }, { passive: true });
  }

  function setHover(p) {
    if (hovered === p) return;
    hovered = p;
    if (!tip) return;
    if (p) { tip.textContent = p.def.label; tip.classList.add('show'); } else { tip.classList.remove('show'); }
  }

  // ---------- frame ----------
  function frame() {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05);
    tAll += dt;
    var now = performance.now();
    var idle = now - lastMove > 3000;

    if (coarse) {
      // Phones: no touch tracking and no sensors. The boards shift and tilt as you scroll.
      var sp = window.scrollY / Math.max(H, 1);
      pt.x = clamp(Math.sin(sp * 3.0) * 0.85, -1, 1);
      pt.y = clamp(Math.cos(sp * 2.2) * 0.45 - sp * 0.2, -1, 1);
    } else if (idle) {
      // Wander gently when the mouse rests.
      pt.x = Math.sin(tAll * 0.35) * 0.6;
      pt.y = Math.cos(tAll * 0.27) * 0.4;
    }
    var ks = 1 - Math.exp(-dt * 4);
    pm.x += (pt.x - pm.x) * ks;
    pm.y += (pt.y - pm.y) * ks;

    group.rotation.y = pm.x * 0.1;
    group.rotation.x = -pm.y * 0.07;
    group.position.y = (window.scrollY / Math.max(H, 1)) * 1.1;
    // As the founders scroll into view, boards drift in toward the middle so they float right behind them.
    var sprog = clamp(window.scrollY / Math.max(H * 0.9, 1), 0, 1);
    var pull = sprog * sprog * (3 - 2 * sprog) * 0.6;

    if (pointerNDC && !idle && !coarse) {
      raycaster.setFromCamera(pointerNDC, camera);
      var hit = raycaster.intersectObjects(group.children, false)[0];
      setHover(hit ? hit.object.userData.piece : null);
    } else if (hovered) setHover(null);

    var k = 1 - Math.exp(-dt * 6);
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i], m = p.mesh, z = p.base.z;
      var hh = (14 - z) * TAN, hw = hh * aspect;
      var bob = Math.sin(tAll * 0.6 + p.phase) * 0.12;
      var amp = coarse ? 1.7 : 1;
      var px = p.base.x * (1 - pull) + pm.x * 0.8 * amp * p.df;
      var py = p.base.y + pm.y * 0.55 * amp * p.df + bob;
      var dx = pm.x * hw - px, dy = pm.y * hh - py;
      var sig = 2.6 * p.size;
      var infl = coarse ? 0 : Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
      p.hover += ((p === hovered ? 1 : 0) - p.hover) * k;

      var tx = px + dx * 0.07 * infl;
      var ty = py + dy * 0.07 * infl;
      var tz = z + infl * 1.0 + p.hover * 0.7;
      var trx = p.rx - dy * 0.2 * infl - pm.y * 0.18 * amp * p.df + Math.cos(tAll * 0.45 + p.phase) * 0.05;
      var try_ = p.ry + dx * 0.22 * infl + pm.x * 0.22 * amp * p.df + Math.sin(tAll * 0.4 + p.phase) * 0.08;
      var trz = p.rz + infl * 0.3 * (p.phase > Math.PI ? 1 : -1) + Math.sin(tAll * 0.3 + p.phase) * 0.04;

      m.position.x += (tx - m.position.x) * k;
      m.position.y += (ty - m.position.y) * k;
      m.position.z += (tz - m.position.z) * k;
      m.rotation.x += (trx - m.rotation.x) * k;
      m.rotation.y += (try_ - m.rotation.y) * k;
      m.rotation.z += (trz - m.rotation.z) * k;

      var intro = ease(clamp((tAll - p.delay) / 1.1, 0, 1));
      m.scale.setScalar(Math.max(0.001, m.userData.targetScale * intro * (1 + p.hover * 0.06)));
    }
    renderer.render(scene, camera);
  }

  function renderOnce() { renderer.render(scene, camera); }

  function start() { if (running || reduce) return; running = true; clock.getDelta(); frame(); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function sync() { if (visible && !document.hidden) start(); else stop(); }

  // ---------- boot ----------
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);

  loadTextures(function () {
    build();
    hero.classList.add('ready');
    if (hint) {
      if (reduce) hint.style.display = 'none';
      else if (coarse) hint.querySelector('.hint-text').textContent = 'Scroll to move the boards';
    }
    if (reduce) renderOnce();
    else {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
      }
      document.addEventListener('visibilitychange', sync);
      sync();
    }
  });
})();
