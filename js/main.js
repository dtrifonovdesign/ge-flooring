(function () {
  'use strict';
  var cfg = window.GE_CONFIG || {};
  var digits = String(cfg.phone || '').replace(/[^\d+]/g, '');

  // Phone + email from config
  document.querySelectorAll('[data-phone]').forEach(function (a) {
    a.setAttribute('href', 'tel:' + digits);
    if (a.classList.contains('big-phone')) a.textContent = cfg.phone;
    else if (a.classList.contains('btn')) a.textContent = 'Call ' + cfg.phone;
    else a.setAttribute('aria-label', 'Call ' + cfg.phone);
  });
  var emailLine = document.querySelector('[data-email-line]');
  if (emailLine && cfg.email) {
    emailLine.textContent = 'Or email ';
    var ea = document.createElement('a');
    ea.href = 'mailto:' + cfg.email; ea.textContent = cfg.email;
    emailLine.appendChild(ea);
  }
  if (/000-0000|example\.com/.test((cfg.phone || '') + (cfg.email || ''))) {
    console.warn('G&E Tile and Flooring: update js/config.js with the real phone and email before publishing.');
  }

  document.getElementById('year').textContent = new Date().getFullYear();

  // Header solidifies after the hero
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Reveal on scroll
  var items = document.querySelectorAll('.section h2, .section .label, .services li, .ba, .grid figure, .steps li, .founders-photo, .area-copy > p, .area-copy .btn, .map, .estimate-copy, .form');
  items.forEach(function (el) { el.classList.add('reveal'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });

  // Founders: layered depth. The backdrop, outline and photo drift at different speeds with the
  // cursor (desktop) and with scroll (everywhere). Faces are never warped, only the layers shift.
  (function () {
    var frame = document.getElementById('founders-frame');
    if (!frame || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var tx = 0, ty = 0, x = 0, y = 0, onScreen = false, raf = 0, last = 0;
    function clamp(v) { return Math.max(-1, Math.min(1, v)); }
    if (fine) {
      window.addEventListener('pointermove', function (e) {
        var r = frame.getBoundingClientRect();
        tx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
        ty = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2));
      }, { passive: true });
    }
    function tick(now) {
      raf = onScreen ? requestAnimationFrame(tick) : 0;
      var k = 1 - Math.exp(-((now - last) / 1000 || 0.016) * 5); last = now;
      x += (tx - x) * k; y += (ty - y) * k;
      var r = frame.getBoundingClientRect();
      var sy = clamp((r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight / 2));
      frame.style.setProperty('--px', x.toFixed(3));
      frame.style.setProperty('--py', y.toFixed(3));
      frame.style.setProperty('--sy', sy.toFixed(3));
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        onScreen = es[0].isIntersecting;
        if (onScreen && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
      }, { rootMargin: '100px' }).observe(frame);
    }
  })();

  // Founders: the empty sides turn into a floor as you scroll. Planks (wood and vinyl) lay down
  // row by row on the left, tile sets in on the right. Pieces are CSS-driven from one variable, --fp.
  (function () {
    var section = document.getElementById('founders');
    if (!section) return;
    var left = section.querySelector('.floor-left'), right = section.querySelector('.floor-right');
    var frame = document.getElementById('founders-frame');
    if (!left || !right || !frame) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var PLANKS = ['wood-honey', 'wood-honey', 'vinyl-oak', 'vinyl-oak', 'vinyl-amber', 'vinyl-grey', 'vinyl-teal'];
    var TILES = ['tile-marble', 'tile-marble', 'tile-marble', 'tile-grey', 'tile-grey', 'tile-green', 'tile-green', 'tile-hex', 'tile-hex', 'tile-flower', 'tile-quarry'];
    var built = '';

    function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function tex(n) { return 'url(' + new URL('assets/tex/' + n + '.jpg', document.baseURI).href + ')'; }   // absolute, so it also resolves inside CSS variables
    function el(cls, css) { var d = document.createElement('div'); d.className = cls; d.style.cssText = css; return d; }

    function build() {
      var sw = section.clientWidth, sh = section.offsetHeight;
      var gap = Math.floor((sw - frame.offsetWidth) / 2) - 36;
      var key = sw + 'x' + sh;
      if (key === built) return;
      built = key;
      left.innerHTML = ''; right.innerHTML = '';
      if (gap < 140) { section.style.setProperty('--gap', '0px'); return; }
      section.style.setProperty('--gap', gap + 'px');
      var rand = rng(7), ROW = 52, rows = Math.ceil(sh / ROW) + 1;

      // Planks (left): laid one at a time, a row at a time from the bottom, working inward.
      var planks = [];
      for (var r = 0; r < rows; r++) {
        var x = -Math.floor(rand() * 150), top = sh - (r + 1) * ROW;
        while (x < gap + 10) {
          var len = 150 + Math.floor(rand() * 100);
          planks.push({ x: x, top: top, len: len });
          x += len;
        }
      }
      planks.forEach(function (p, n) {
        var t = 0.86 * n / Math.max(1, planks.length - 1);
        var rot = (rand() * 3 - 1.5).toFixed(2);
        var bp = Math.floor(rand() * 100) + '% ' + Math.floor(rand() * 100) + '%';
        left.appendChild(el('fp', 'left:' + p.x + 'px;top:' + p.top + 'px;width:' + (p.len - 2) + 'px;height:' + (ROW - 2) + 'px;--t:' + t.toFixed(4) + ';--rot:' + rot + ';background-image:' + tex(PLANKS[Math.floor(rand() * PLANKS.length)]) + ';background-position:' + bp));
      });

      // Tile (right): a mortar bed with trowel lines goes down first, then each tile lowers onto it.
      var T = 74, cols = Math.ceil(gap / T) + 1, trows = Math.ceil(sh / T) + 1, count = cols * trows, n2 = 0;
      for (var rr = 0; rr < trows; rr++) {
        for (var c = 0; c < cols; c++) {
          var tt = 0.04 + 0.82 * n2++ / Math.max(1, count - 1);
          right.appendChild(el('ft', 'right:' + (c * T - 6) + 'px;top:' + (sh - (rr + 1) * T) + 'px;width:' + (T - 4) + 'px;height:' + (T - 4) + 'px;--t:' + tt.toFixed(4) + ';--img:' + tex(TILES[Math.floor(rand() * TILES.length)]) + ';--bp:' + Math.floor(rand() * 100) + '% ' + Math.floor(rand() * 100) + '%'));
        }
      }
    }
    function update() {
      var r = section.getBoundingClientRect(), vh = window.innerHeight;
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.8)));
      section.style.setProperty('--fp', p.toFixed(3));
    }
    var ticking = false;
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }
    var rt;
    function onResize() { clearTimeout(rt); rt = setTimeout(function () { build(); update(); }, 150); }
    build(); update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('load', function () { built = ''; build(); update(); });
  })();

  // Before / after slider
  (function () {
    var ba = document.getElementById('ba');
    var handle = document.getElementById('ba-handle');
    if (!ba || !handle) return;
    var tagB = ba.querySelector('.ba-tag-before'), tagA = ba.querySelector('.ba-tag-after');
    var pos = 50, dragging = false, sweeping = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function set(v) {
      pos = Math.max(0, Math.min(100, v));
      ba.style.setProperty('--pos', pos + '%');
      handle.setAttribute('aria-valuenow', Math.round(pos));
      handle.setAttribute('aria-valuetext', Math.round(pos) + '% before');
      tagB.style.opacity = pos < 14 ? 0 : 1;
      tagA.style.opacity = pos > 86 ? 0 : 1;
    }
    function fromEvent(e) {
      var r = ba.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }
    ba.addEventListener('pointerdown', function (e) {
      sweeping = false; dragging = true; ba.classList.add('drag');
      ba.setPointerCapture(e.pointerId); fromEvent(e);
    });
    ba.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    function end(e) { dragging = false; ba.classList.remove('drag'); if (e.pointerId != null && ba.hasPointerCapture(e.pointerId)) ba.releasePointerCapture(e.pointerId); }
    ba.addEventListener('pointerup', end);
    ba.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 3, used = true;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(pos - step);
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(pos + step);
      else if (e.key === 'Home') set(0);
      else if (e.key === 'End') set(100);
      else used = false;
      if (used) { e.preventDefault(); sweeping = false; }
    });

    // One gentle sweep the first time it scrolls into view, to show it is draggable.
    if (!reduce && 'IntersectionObserver' in window) {
      var seen = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        seen.disconnect();
        var t0 = performance.now(); sweeping = true;
        (function tick(now) {
          if (!sweeping) return;
          var t = (now - t0) / 2400;
          if (t >= 1) { set(50); sweeping = false; return; }
          set(50 + Math.sin(t * Math.PI * 2) * 32 * (1 - t * 0.3));
          requestAnimationFrame(tick);
        })(t0);
      }, { threshold: 0.6 });
      seen.observe(ba);
    }
    set(50);
  })();

  // Estimate form
  var form = document.getElementById('estimate-form');
  var status = document.getElementById('form-status');
  var btn = form.querySelector('button[type="submit"]');

  function setErr(field, msg) {
    var old = field.parentNode.querySelector('.err');
    if (old) old.remove();
    field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby');
    if (!msg) return;
    var p = document.createElement('p');
    p.className = 'err'; p.id = field.id + '-err'; p.textContent = msg;
    field.parentNode.appendChild(p);
    field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', p.id);
  }
  function validate() {
    var first = null;
    form.querySelectorAll('input, select, textarea').forEach(function (f) {
      var msg = '';
      if (f.required && !f.value.trim()) msg = f.id === 'type' ? 'Please choose a project type.' : 'This field is required.';
      else if (f.type === 'email' && f.value && !/^\S+@\S+\.\S+$/.test(f.value)) msg = 'Enter a valid email, like name@example.com.';
      else if (f.type === 'tel' && f.value && f.value.replace(/\D/g, '').length < 7) msg = 'Enter a phone number we can call.';
      setErr(f, msg);
      if (msg && !first) first = f;
    });
    return first;
  }
  form.addEventListener('blur', function (e) {
    var f = e.target;
    if (f.matches && f.matches('input, select') && f.value) { var had = f.getAttribute('aria-invalid'); if (had) validate(); }
  }, true);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'status'; status.textContent = '';
    var bad = validate();
    if (bad) { status.textContent = 'Please fix the highlighted fields.'; bad.focus(); return; }

    var data = new FormData(form);
    var obj = {}; data.forEach(function (v, k) { obj[k] = v; });

    if (cfg.formEndpoint) {
      btn.disabled = true; status.textContent = 'Sendingâ€¦';
      data.append('_subject', 'Free estimate request from ' + obj.name);
      data.append('_template', 'table');
      data.append('_captcha', 'false');
      fetch(cfg.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: data })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) {
          if (j && String(j.success) === 'false') throw new Error(j.message || 'rejected');
          form.reset(); status.className = 'status ok'; status.textContent = 'Thank you. We will be in touch soon.';
        })
        .catch(function () { status.textContent = 'That did not go through. Please call ' + cfg.phone + ' or email ' + cfg.email + '.'; })
        .then(function () { btn.disabled = false; });
    } else {
      var body = ['Name: ' + obj.name, 'Phone: ' + obj.phone, obj.email ? 'Email: ' + obj.email : '', 'Project: ' + obj.type, '', obj.message || '']
        .filter(function (l, i) { return l !== '' || i === 5 || i === 4; }).join('\n');
      window.location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent('Free estimate request') + '&body=' + encodeURIComponent(body);
      status.className = 'status ok';
      status.textContent = 'Your email app should open with the request ready to send.';
    }
  });
})();
