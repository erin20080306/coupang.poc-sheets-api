// 這個 API 端點返回一段 JS，用來清除所有快取和 Service Worker
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).end(`<!DOCTYPE html>
<html><head><title>清除快取</title></head>
<body>
<h2>正在清除快取...</h2>
<pre id="log"></pre>
<script>
var log = document.getElementById('log');
function addLog(msg) { log.textContent += msg + '\\n'; }

async function clearAll() {
  // 1. 清除所有 Cache Storage
  if ('caches' in window) {
    var names = await caches.keys();
    for (var n of names) {
      await caches.delete(n);
      addLog('已刪除快取: ' + n);
    }
  }
  // 2. 取消所有 Service Worker
  if (navigator.serviceWorker) {
    var regs = await navigator.serviceWorker.getRegistrations();
    for (var r of regs) {
      await r.unregister();
      addLog('已取消 Service Worker: ' + r.scope);
    }
  }
  // 3. 清除 localStorage
  localStorage.clear();
  addLog('已清除 localStorage');
  
  addLog('\\n✅ 全部清除完成！3秒後跳轉回首頁...');
  setTimeout(function() { window.location.href = '/'; }, 3000);
}
clearAll();
</script>
</body></html>`);
}
