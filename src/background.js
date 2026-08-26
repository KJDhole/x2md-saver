chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'X2MD_SAVE') return;
  save(msg.url)
    .then(sendResponse)
    .catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }));
  return true;
});

async function save(url) {
  const { serverUrl, token } = await chrome.storage.local.get(['serverUrl', 'token']);
  if (!serverUrl) throw new Error('未配置服务器，点击插件图标设置');
  const res = await fetch(serverUrl.replace(/\/+$/, '') + '/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Queue-Token': token || '' },
    body: JSON.stringify({ url: url })
  });
  if (res.status === 401) throw new Error('token 不对');
  if (!res.ok) throw new Error('服务器返回 ' + res.status);
  const data = await res.json().catch(() => ({}));
  return { ok: true, dup: !!data.dup };
}
