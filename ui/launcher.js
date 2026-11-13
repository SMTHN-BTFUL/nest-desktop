// The Nest desktop launcher.
// The dashboard lives behind Vercel Deployment Protection, so the app needs a
// "Protection Bypass for Automation" secret to open straight to it.
// The secret is stored only in this app's own localStorage (never leaves the
// machine) and is sent to Vercel as ?x-vercel-protection-bypass=... with
// &x-vercel-set-bypass-cookie=true, which makes Vercel set a bypass cookie
// so every later request in the session (data JSON, API calls, tab iframes)
// stays authorized.
(function () {
  var NEST_URL = 'https://today-widget-sb-54b6.vercel.app/';
  var KEY = 'nest.vercel_bypass';
  var REDIRECT_DELAY_MS = 2500;

  var openingEl = document.getElementById('opening');
  var setupEl = document.getElementById('setup');
  var form = document.getElementById('secretForm');
  var input = document.getElementById('secretInput');
  var errorEl = document.getElementById('formError');
  var cancelBtn = document.getElementById('cancelBtn');
  var skipBtn = document.getElementById('skipBtn');
  var redirectTimer = null;

  function nestUrl(secret) {
    if (!secret) return NEST_URL;
    return NEST_URL + '?x-vercel-protection-bypass=' + encodeURIComponent(secret) +
      '&x-vercel-set-bypass-cookie=true';
  }

  function go(secret) {
    window.location.replace(nestUrl(secret));
  }

  function showSetup() {
    openingEl.classList.add('hidden');
    setupEl.classList.remove('hidden');
    input.focus();
  }

  function showOpening(secret) {
    setupEl.classList.add('hidden');
    openingEl.classList.remove('hidden');
    redirectTimer = setTimeout(function () { go(secret); }, REDIRECT_DELAY_MS);
  }

  function loadSecret() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }

  function saveSecret(secret) {
    try { localStorage.setItem(KEY, secret); } catch (e) {}
  }

  function clearSecret() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var secret = input.value.trim();
    if (!secret) {
      errorEl.textContent = 'Paste the bypass secret first — or use “Continue without a secret” below.';
      errorEl.classList.remove('hidden');
      return;
    }
    errorEl.classList.add('hidden');
    saveSecret(secret);
    showOpening(secret);
  });

  cancelBtn.addEventListener('click', function () {
    if (redirectTimer) { clearTimeout(redirectTimer); redirectTimer = null; }
    clearSecret();
    input.value = '';
    showSetup();
  });

  skipBtn.addEventListener('click', function () {
    go('');
  });

  var saved = loadSecret();
  if (saved) showOpening(saved);
  else showSetup();
})();
