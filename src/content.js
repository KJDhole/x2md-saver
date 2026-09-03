(function () {
  const LABEL = '保存到知识库';
  const SUB = '由 X2MD 知识库提供';
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:18px;height:18px"><g><path fill="currentColor" d="M6 3C5.45 3 5 3.45 5 4v16.38c0 .58.65.93 1.13.61L12 17.36l5.87 3.63c.48.32 1.13-.03 1.13-.61V4c0-.55-.45-1-1-1H6zm1 2h10v13.45l-4.87-3.01a1 1 0 0 0-1.05 0L7 18.45V5z"></path></g></svg>';

  let lastTweetArticle = null;
  let lastCell = null;
  let lastCaretTime = 0;
  const handled = new WeakSet();

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const caret = e.target.closest('[data-testid="caret"]');
    const share = e.target.closest('[data-testid="share"], [data-testid="app-bar-share"], [aria-label*="Share"], [aria-label*="分享"]');
    if (caret || share) {
      const trigger = caret || share;
      // Only treat a real tweet card as an explicit target. X long-form Article pages
      // also contain a generic <article> wrapper, whose first /status/ link may
      // belong to an embedded/quoted tweet rather than the page being viewed.
      lastTweetArticle = trigger.closest('article[data-testid="tweet"]');
      lastCell = trigger.closest('[data-testid="cellInnerDiv"]');
      lastCaretTime = Date.now();
    }
  }, true);

  function statusUrlFrom(root) {
    if (!root) return null;
    const t = root.querySelector && root.querySelector('time');
    const a = t && t.closest('a[href*="/status/"]');
    if (a && a.getAttribute('href')) return location.origin + a.getAttribute('href');
    const direct = root.querySelector && root.querySelector('a[href*="/status/"]');
    return direct && direct.getAttribute('href') ? location.origin + direct.getAttribute('href') : null;
  }

  function tweetUrl() {
    const helper = globalThis.X2MDUrlSelection;
    const explicitTweetCardUrl = statusUrlFrom(lastTweetArticle);
    const fallbackCardUrl = statusUrlFrom(lastCell);

    // Priority:
    // 1) a real tweet card explicitly clicked by the user (timeline / nested tweet)
    // 2) the current /status/ page URL (critical for X long-form Article toolbar)
    // 3) a generic cell fallback only when the page itself has no status URL
    return helper.chooseTweetUrl({
      pageUrl: location.href,
      origin: location.origin,
      tweetCardUrl: explicitTweetCardUrl,
      fallbackCardUrl: fallbackCardUrl
    });
  }

  function toast(msg, ok) {
    const d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText =
      'position:fixed;left:50%;bottom:48px;transform:translateX(-50%);z-index:99999;' +
      'background:' + (ok ? 'rgba(29,155,240,.95)' : 'rgba(244,33,46,.95)') + ';' +
      'color:#fff;padding:10px 18px;border-radius:8px;font-size:14px;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.35);transition:opacity .3s;white-space:nowrap;';
    document.body.appendChild(d);
    setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 350); }, 2600);
  }

  function closeMenu() {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true
    }));
  }

  function buildItem(template) {
    const el = template.cloneNode(true);
    const svg = el.querySelector('svg');
    if (svg) {
      const tmp = document.createElement('div');
      tmp.innerHTML = ICON;
      svg.replaceWith(tmp.firstChild);
    }
    let label = null;
    el.querySelectorAll('span').forEach((s) => {
      if (!label && s.childElementCount === 0 && s.textContent.trim()) label = s;
    });
    if (label) {
      label.textContent = LABEL;
      const box = label.closest('div[dir]') || label.parentElement;
      const sub = document.createElement('div');
      sub.textContent = SUB;
      sub.dir = 'ltr';
      sub.style.cssText = 'font-size:12px;line-height:16px;color:rgb(83,100,113);white-space:nowrap;';
      box.appendChild(sub);
    }
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = tweetUrl();
      if (!url) { toast('未识别到推文链接', false); closeMenu(); return; }
      if (label) label.textContent = '保存中…';
      chrome.runtime.sendMessage({ type: 'X2MD_SAVE', url: url }, (res) => {
        const ok = !!(res && res.ok);
        toast(
          ok ? (res.dup ? '这条已在知识库里' : '已提交，云端归档中…')
             : '保存失败：' + ((res && res.error) || '未知错误'),
          ok
        );
        closeMenu();
      });
    });
    return el;
  }

  function scan() {
    if (Date.now() - lastCaretTime > 4000) return;
    document.querySelectorAll('div[role="menu"]').forEach((menu) => {
      if (handled.has(menu)) return;
      const items = menu.querySelectorAll('[role="menuitem"]');
      if (!items.length) return;
      handled.add(menu);
      menu.insertBefore(buildItem(items[0]), items[0]);
    });
  }

  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
