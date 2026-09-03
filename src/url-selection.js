(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.X2MDUrlSelection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function canonicalStatusUrl(href, origin) {
    if (!href) return null;
    const m = String(href).match(/https?:\/\/(?:x|twitter)\.com\/[^/?#]+\/status\/\d+/i);
    if (!m) return null;
    try {
      const u = new URL(m[0]);
      const base = origin || u.origin;
      return base.replace(/\/+$/, '') + u.pathname;
    } catch (_) {
      return m[0].split('?')[0].split('#')[0];
    }
  }

  function chooseTweetUrl({ pageUrl, origin, tweetCardUrl, fallbackCardUrl }) {
    const explicitCard = canonicalStatusUrl(tweetCardUrl, origin);
    if (explicitCard) return explicitCard;

    const currentPage = canonicalStatusUrl(pageUrl, origin);
    if (currentPage) return currentPage;

    return canonicalStatusUrl(fallbackCardUrl, origin);
  }

  return { canonicalStatusUrl, chooseTweetUrl };
});
