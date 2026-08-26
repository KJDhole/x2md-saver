const $ = (id) => document.getElementById(id);

const DEFAULT_SERVER = '';
const DEFAULT_TOKEN = '';

chrome.storage.local.get(['serverUrl', 'token']).then((c) => {
  $('serverUrl').value = c.serverUrl || DEFAULT_SERVER;
  $('token').value = c.token || DEFAULT_TOKEN;
});

$('save').onclick = async () => {
  await chrome.storage.local.set({
    serverUrl: $('serverUrl').value.trim(),
    token: $('token').value.trim()
  });
  const st = $('status');
  st.textContent = '✓ 已保存';
  st.className = 'ok';
};

$('check').onclick = async (e) => {
  e.preventDefault();
  const st = $('status');
  const serverUrl = $('serverUrl').value.trim();
  if (!serverUrl) { st.textContent = '✗ 先填服务器地址'; st.className = 'err'; return; }
  st.textContent = '测试中…';
  st.className = '';
  try {
    const res = await fetch(serverUrl.replace(/\/+$/, '') + '/status');
    const data = await res.json();
    st.textContent = `✓ 连接成功，已索引 ${data.indexed} 篇`;
    st.className = 'ok';
  } catch (err) {
    st.textContent = '✗ 连接失败：' + err.message;
    st.className = 'err';
  }
};
