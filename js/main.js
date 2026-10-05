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
