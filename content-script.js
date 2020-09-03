const src = 'content-script'
console.log('这是content script!')
document.addEventListener('DOMContentLoaded', () => {
  injectCustomJs()
  window.addEventListener(
    'message',
    function (e) {
      if (e.data.src && e.data.src !== src) {
        console.log('收到页面消息：', e.data.msg)
        sendMessageToBackground(e.data.msg)
      }
    },
    false
  )
})

function postToInject(msg) {
  console.log('postToInject', msg)
  window.postMessage({ src, msg }, '*')
}

function injectCustomJs(jsPath) {
  jsPath = jsPath || 'inject.js'
  var temp = document.createElement('script')
  temp.setAttribute('type', 'text/javascript')
  // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
  temp.src = chrome.extension.getURL(jsPath)
  console.log(temp.src)
  temp.onload = function () {
    // 放在页面不好看，执行完后移除掉
    this.parentNode.removeChild(this)
    console.log('注入完成')
  }
  document.body.appendChild(temp)
}

// 接收来自后台的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // 透传到页面
  postToInject(request)
})

// 主动发送消息给后台
// 要演示此功能，请打开控制台主动执行sendMessageToBackground()
function sendMessageToBackground(message = 'tick') {
  chrome.runtime.sendMessage(message)
}
