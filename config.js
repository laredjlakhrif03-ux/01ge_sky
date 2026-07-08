/* ==========================================
   GE_Sky — Environment Configuration
   ========================================== */

const GE_SKY_CONFIG = (() => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // ── Production domains (add your real domain here) ──────────────────────────
  const PRODUCTION_DOMAINS = [
    'ge-sky.com',
    'gesky.io',
    // 'your-domain.com',  ← أضف نطاقك هنا
  ];

  // ── Detect environment ───────────────────────────────────────────────────────
  const isLocalFile   = !hostname || protocol === 'file:';
  const isLocalhost   = hostname === 'localhost' || hostname === '127.0.0.1';
  const isProduction  = PRODUCTION_DOMAINS.some(d => hostname.endsWith(d));
  const isGitHubPages = hostname.endsWith('github.io');
  const isLAN         = !isLocalhost && !isProduction && !isLocalFile && !isGitHubPages;

  let API_BASE, ENV_NAME;

  // ── Check if there is a custom API URL saved in localStorage ─────────────────
  const customApiBase = localStorage.getItem('GE_SKY_API_BASE');

  if (customApiBase) {
    API_BASE = customApiBase;
    ENV_NAME = 'custom';
  } else if (isProduction) {
    // ── Production: same domain, no port (served via nginx/reverse-proxy) ──
    API_BASE = `${protocol}//${hostname}/api`;
    ENV_NAME = 'production';
  } else if (isGitHubPages) {
    // ── GitHub Pages: default to local backend on loopback (allowed by browsers over HTTPS)
    API_BASE = 'http://127.0.0.1:8001/api';
    ENV_NAME = 'github-pages';
  } else if (isLAN) {
    // ── LAN / Mobile: same host but on port 8001 ──────────────────────────
    API_BASE = `http://${hostname}:8001/api`;
    ENV_NAME = 'lan';
  } else {
    // ── Local development (localhost, 127.0.0.1, or local file) ───────────
    API_BASE = 'http://127.0.0.1:8001/api';
    ENV_NAME = isLocalFile ? 'file' : 'development';
  }

  // ── Log environment (only in non-production) ─────────────────────────────
  if (ENV_NAME !== 'production') {
    console.info(`[GE_Sky] ENV: ${ENV_NAME} | API: ${API_BASE}`);
  }

  return { API_BASE, ENV_NAME, isProduction, isLAN, isLocalhost, isGitHubPages, isLocalFile };
})();
