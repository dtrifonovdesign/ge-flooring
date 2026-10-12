/* Small helper for privacy.html and 404.html: fills in phone, email and year from js/config.js. */
(function () {
  'use strict';
  var cfg = window.GE_CONFIG || {};
  var digits = String(cfg.phone || '').replace(/[^\d+]/g, '');
  document.querySelectorAll('[data-phone-text]').forEach(function (a) { a.textContent = cfg.phone; a.setAttribute('href', 'tel:' + digits); });
  document.querySelectorAll('[data-phone]').forEach(function (a) { a.textContent = 'Call ' + cfg.phone; a.setAttribute('href', 'tel:' + digits); });
  document.querySelectorAll('[data-email-text]').forEach(function (a) { a.textContent = cfg.email; a.setAttribute('href', 'mailto:' + cfg.email); });
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
