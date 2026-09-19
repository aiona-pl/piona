/*
 * AIona: zgody na pliki cookies (v2)
 *
 * Skrypty pomiarowe ładują się dopiero po zgodzie:
 *  - analityczne: Google Tag Manager (GA4)
 *  - marketingowe: piksel OpenAI, piksel Meta
 *
 * Strona ustawia przed załadowaniem tego pliku:
 *   window.AIONA_CONSENT = { gtm: 'GTM-XXXX', openai: 'pixelId', meta: 'pixelId' };
 * Brakujące klucze oznaczają, że dane narzędzie nie jest na tej stronie używane.
 *
 * Wybór zapisuje się w localStorage pod kluczem aiona_cookie_consent_v2.
 * Link "Ustawienia cookies" w stopce: <a href="#ustawienia-cookies" data-cookie-settings>
 */
(function () {
  'use strict';

  var CFG = window.AIONA_CONSENT || {};
  var KEY = 'aiona_cookie_consent_v2';
  var HASH = '#ustawienia-cookies';
  var state = { analytics: false, marketing: false };
  var loaded = { gtm: false, openai: false, meta: false };
  var hasChoice = false;
  var banner, overlay, lastFocus;

  window.aionaConsent = state;

  /* ---------- pamięć wyboru ---------- */

  function readStored() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o && typeof o.analytics === 'boolean' && typeof o.marketing === 'boolean') return o;
    } catch (e) {}
    return null;
  }

  function store() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        analytics: state.analytics,
        marketing: state.marketing,
        ts: new Date().toISOString(),
        v: 2
      }));
    } catch (e) {}
  }

  /* ---------- ładowanie narzędzi (tylko po zgodzie) ---------- */

  function loadGTM() {
    if (loaded.gtm || !CFG.gtm) return;
    loaded.gtm = true;
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', CFG.gtm);
  }

  function loadOpenAI() {
    if (loaded.openai || !CFG.openai) return;
    loaded.openai = true;
    (function (w, d, s, u) {
      if (w.oaiq) return;
      var q = function () { q.q.push(arguments); };
      q.q = [];
      w.oaiq = q;
      var js = d.createElement(s);
      js.async = true;
      js.src = u;
      var f = d.getElementsByTagName(s)[0];
      f.parentNode.insertBefore(js, f);
    })(window, document, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
    window.oaiq('consent', true);
    window.oaiq('init', { pixelId: CFG.openai, debug: false });
  }

  function loadMeta() {
    if (loaded.meta || !CFG.meta) return;
    loaded.meta = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CFG.meta);
    window.fbq('track', 'PageView');
  }

  function applyConsent() {
    if (state.analytics) loadGTM();
    if (state.marketing) { loadOpenAI(); loadMeta(); }
  }

  /* ---------- czyszczenie cookies po wycofaniu zgody ---------- */

  function expireCookie(name) {
    var parts = location.hostname.split('.');
    var domains = [null];
    for (var i = 0; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    var past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    domains.forEach(function (d) {
      document.cookie = name + '=; expires=' + past + '; path=/' + (d ? '; domain=' + d : '');
    });
  }

  function clearCookies(re) {
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n && re.test(n)) expireCookie(n);
    });
  }

  /* ---------- zapis wyboru ---------- */

  function save(next) {
    var prev = { analytics: state.analytics, marketing: state.marketing };
    state.analytics = !!next.analytics;
    state.marketing = !!next.marketing;
    hasChoice = true;
    store();

    var revoked = (prev.analytics && !state.analytics) || (prev.marketing && !state.marketing);
    if (prev.analytics && !state.analytics) clearCookies(/^(_ga|_gid|_gat|_gac_)/);
    if (prev.marketing && !state.marketing) clearCookies(/^(_fbp|_fbc|__oppref)$/);

    hideBanner();
    closePanel(true);

    if (revoked) {
      // uruchomionych już skryptów nie da się wyładować, więc odświeżamy stronę
      if (location.hash === HASH) {
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      }
      location.reload();
      return;
    }
    applyConsent();
  }

  /* ---------- interfejs ---------- */

  var CSS =
    '.aic-banner[hidden],.aic-overlay[hidden]{display:none!important}' +
    '.aic-banner{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;background:#0D0A16;color:#C7C2DB;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:18px 20px;box-shadow:0 8px 32px rgba(0,0,0,.55);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.aic-inner{max-width:1040px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}' +
    '.aic-text{margin:0;font-size:.92rem;line-height:1.55;color:#fff;max-width:640px}' +
    '.aic-text a,.aic-panel a{color:#F2A93B}' +
    '.aic-actions{display:flex;gap:10px;flex-wrap:wrap}' +
    '.aic-btn{min-height:44px;padding:10px 20px;border-radius:9px;border:2px solid #F2A93B;background:#F2A93B;color:#1A1000;font:700 .9rem Inter,system-ui,sans-serif;cursor:pointer}' +
    '.aic-btn.aic-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.35)}' +
    '.aic-btn:focus-visible,.aic-panel input:focus-visible,.aic-panel a:focus-visible,.aic-text a:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
    '.aic-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(8,6,16,.72);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.aic-panel{background:#171227;color:#C7C2DB;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:24px;max-width:560px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 12px 48px rgba(0,0,0,.6)}' +
    '.aic-panel h2{margin:0 0 8px;font-size:1.2rem;color:#fff}' +
    '.aic-panel p{margin:0 0 16px;font-size:.9rem;line-height:1.55}' +
    '.aic-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid rgba(255,255,255,.1);font-size:.88rem;line-height:1.5}' +
    '.aic-row strong{display:block;color:#fff;font-size:.95rem;margin-bottom:2px}' +
    '.aic-row input{width:22px;height:22px;flex-shrink:0;accent-color:#F2A93B;margin-top:2px;cursor:pointer}' +
    '.aic-always{flex-shrink:0;font-size:.8rem;color:#8B84A8;margin-top:3px}' +
    '.aic-panel .aic-actions{margin:16px 0 14px}' +
    '@media (max-width:560px){.aic-btn{flex:1 1 100%}}';

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html) n.innerHTML = html;
    return n;
  }

  function buildUI() {
    var st = document.createElement('style');
    st.id = 'aic-style';
    st.textContent = CSS;
    document.head.appendChild(st);

    banner = el('div', { 'class': 'aic-banner', id: 'aic-banner', role: 'dialog', 'aria-label': 'Zgoda na pliki cookies', hidden: '' },
      '<div class="aic-inner">' +
        '<p class="aic-text">Używamy cookies, żeby sprawdzać, czy nasza reklama działa i co poprawić na stronie. Możesz zgodzić się na wszystkie, odrzucić je albo wybrać w ustawieniach. Odsłony liczymy zawsze prostym licznikiem bez cookies. <a href="polityka.html">Polityka prywatności</a></p>' +
        '<div class="aic-actions">' +
          '<button type="button" class="aic-btn" data-aic="reject">Odrzuć wszystkie</button>' +
          '<button type="button" class="aic-btn aic-ghost" data-aic="settings">Ustawienia</button>' +
          '<button type="button" class="aic-btn" data-aic="accept">Akceptuję wszystkie</button>' +
        '</div>' +
      '</div>');

    overlay = el('div', { 'class': 'aic-overlay', id: 'aic-overlay', hidden: '' },
      '<div class="aic-panel" role="dialog" aria-modal="true" aria-labelledby="aic-title">' +
        '<h2 id="aic-title">Ustawienia plików cookies</h2>' +
        '<p>Wybierz, na co się zgadzasz. Możesz to zmienić w każdej chwili, klikając „Ustawienia cookies" w stopce strony.</p>' +
        '<div class="aic-row"><div><strong>Niezbędne</strong>Zapisują Twój wybór z tego okna. Nie wymagają zgody.</div><span class="aic-always">Zawsze włączone</span></div>' +
        '<div class="aic-row"><div><strong>Licznik odsłon bez cookies</strong>Cloudflare Web Analytics liczy odsłony stron i nie zapisuje niczego na Twoim urządzeniu.</div><span class="aic-always">Zawsze włączone</span></div>' +
        '<label class="aic-row" for="aic-an"><div><strong>Analityczne</strong>Google Tag Manager i Google Analytics 4: pomiar ruchu na stronie i źródeł wejść.</div><input type="checkbox" id="aic-an"></label>' +
        '<label class="aic-row" for="aic-mk"><div><strong>Marketingowe</strong>Piksel OpenAI i piksel Meta: pomiar skuteczności reklam w ChatGPT i na Facebooku.</div><input type="checkbox" id="aic-mk"></label>' +
        '<div class="aic-actions">' +
          '<button type="button" class="aic-btn" data-aic="reject">Odrzuć wszystkie</button>' +
          '<button type="button" class="aic-btn aic-ghost" data-aic="save">Zapisz wybór</button>' +
          '<button type="button" class="aic-btn" data-aic="accept">Akceptuję wszystkie</button>' +
        '</div>' +
        '<a href="polityka.html">Więcej w polityce prywatności</a>' +
      '</div>');

    document.body.appendChild(banner);
    document.body.appendChild(overlay);

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (link) { e.preventDefault(); e.stopPropagation(); openPanel(); return; }
      var btn = e.target.closest && e.target.closest('[data-aic]');
      if (!btn) return;
      var act = btn.getAttribute('data-aic');
      if (act === 'accept') save({ analytics: true, marketing: true });
      else if (act === 'reject') save({ analytics: false, marketing: false });
      else if (act === 'settings') openPanel();
      else if (act === 'save') {
        save({
          analytics: document.getElementById('aic-an').checked,
          marketing: document.getElementById('aic-mk').checked
        });
      }
    }, true);

    document.addEventListener('keydown', function (e) {
      if (overlay.hasAttribute('hidden')) return;
      if (e.key === 'Escape') { closePanel(); return; }
      if (e.key !== 'Tab') return;
      var f = overlay.querySelectorAll('button,input,a[href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    window.addEventListener('hashchange', function () { if (location.hash === HASH) openPanel(); });
  }

  function showBanner() { if (banner) banner.removeAttribute('hidden'); }
  function hideBanner() { if (banner) banner.setAttribute('hidden', ''); }

  function openPanel() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    document.getElementById('aic-an').checked = state.analytics;
    document.getElementById('aic-mk').checked = state.marketing;
    overlay.removeAttribute('hidden');
    var first = overlay.querySelector('input');
    if (first) first.focus();
  }

  function closePanel(skipRestore) {
    if (!overlay || overlay.hasAttribute('hidden')) return;
    overlay.setAttribute('hidden', '');
    if (!skipRestore && lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }

  /* ---------- start ---------- */

  try { localStorage.removeItem('cookie_consent'); } catch (e) {} // stary, jednokategoriowy wybór

  var saved = readStored();
  if (saved) {
    state.analytics = saved.analytics;
    state.marketing = saved.marketing;
    hasChoice = true;
  }
  applyConsent();

  function init() {
    buildUI();
    if (!hasChoice) showBanner();
    if (location.hash === HASH) openPanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.aionaOpenCookieSettings = openPanel;
})();
