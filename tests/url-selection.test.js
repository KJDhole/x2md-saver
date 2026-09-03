const assert = require('assert');
const { canonicalStatusUrl, chooseTweetUrl } = require('../src/url-selection.js');

const main = 'https://x.com/MANISH1027512/status/2095347397509652954?s=20';
const quoted = 'https://x.com/MANISH1027512/status/2094786658914930945';

assert.strictEqual(
  canonicalStatusUrl(main, 'https://x.com'),
  'https://x.com/MANISH1027512/status/2095347397509652954'
);

// Long-form article toolbar: DOM may contain a quoted tweet, but the current page URL is the intended save target.
assert.strictEqual(
  chooseTweetUrl({ pageUrl: main, origin: 'https://x.com', tweetCardUrl: null, fallbackCardUrl: quoted }),
  'https://x.com/MANISH1027512/status/2095347397509652954'
);

// Timeline/search: no /status/ in location, so use the clicked tweet card.
assert.strictEqual(
  chooseTweetUrl({ pageUrl: 'https://x.com/home', origin: 'https://x.com', tweetCardUrl: quoted, fallbackCardUrl: null }),
  quoted
);

// If the user explicitly clicks the share/caret inside a real nested tweet card, that card wins even on a status page.
assert.strictEqual(
  chooseTweetUrl({ pageUrl: main, origin: 'https://x.com', tweetCardUrl: quoted, fallbackCardUrl: null }),
  quoted
);

console.log('url-selection tests passed');
