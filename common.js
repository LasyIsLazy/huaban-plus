
// 向content-script主动发送消息
export function sendMessageToContentScript(message, callback) {
    console.log('后台 => content-script', message)
    getCurrentTabId((tabId) => {
      chrome.tabs.sendMessage(tabId, message, function (response) {
        if (callback) callback(response)
      })
    })
  }
  

// 获取当前选项卡ID
function getCurrentTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (callback) callback(tabs.length ? tabs[0].id : null)
    })
  }
  