(function () {
  var GA_ID = 'G-X8QWMMBJ7K';
  var KEY = 'aiona_cookie_consent';

  function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function showBanner() {
    var style = document.createElement('style');
    style.textContent =
      '#cookie-consent-bar{position:fixed;bottom:0;left:0;right:0;z-index:200;' +
      'background:#fff;border-top:1px solid #E8E4F3;box-shadow:0 -4px 24px rgba(20,15,35,.08);' +
      'padding:16px clamp(20px,5vw,72px);font-family:"Inter",sans-serif;animation:cc-slide-up .4s ease}' +
      '@keyframes cc-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}' +
      '.cc-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}' +
      '.cc-text{font-size:.82rem;color:#4A4560;line-height:1.5;margin:0;flex:1;min-width:240px}' +
      '.cc-text a{color:#6E56CF;text-decoration:underline}' +
      '.cc-actions{display:flex;gap:10px;flex-shrink:0}' +
      '.cc-btn{font-size:.82rem;font-weight:500;padding:9px 18px;border-radius:8px;cursor:pointer;transition:opacity .2s;font-family:inherit}' +
      '.cc-reject{background:transparent;color:#4A4560;border:1px solid #E8E4F3}' +
      '.cc-accept{background:#6E56CF;color:#fff;border:none}' +
      '.cc-btn:hover{opacity:.85}' +
      '@media(max-width:560px){.cc-inner{flex-direction:column;align-items:stretch}.cc-actions{justify-content:flex-end}}';
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'cookie-consent-bar';
    bar.innerHTML =
      '<div class="cc-inner">' +
      '<p class="cc-text">Używamy plików cookie do analizy ruchu na stronie (Google Analytics). ' +
      'Możesz zaakceptować lub odrzucić — <a href="polityka.html">więcej w polityce prywatności</a>.</p>' +
      '<div class="cc-actions">' +
      '<button class="cc-btn cc-reject" id="cc-reject">Odrzuć</button>' +
      '<button class="cc-btn cc-accept" id="cc-accept">Akceptuję</button>' +
      '</div></div>';
    document.body.appendChild(bar);

    document.getElementById('cc-accept').addEventListener('click', function () {
      localStorage.setItem(KEY, 'accepted');
      bar.remove();
      loadGA();
    });
    document.getElementById('cc-reject').addEventListener('click', function () {
      localStorage.setItem(KEY, 'rejected');
      bar.remove();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var consent = localStorage.getItem(KEY);
    if (consent === 'accepted') {
      loadGA();
    } else if (consent !== 'rejected') {
      showBanner();
    }
  });
})();
