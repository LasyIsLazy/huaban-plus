document.getElementById('btn').addEventListener('click', () => {
  sendMessageToContentScript({ cmd: 'GET_ALL_PINS' }, function (response) {
    console.log('res', response)
  })
})
document.getElementById('getInfo').addEventListener('click', () => {
  sendMessageToContentScript({ cmd: 'GET_INFO' }, function (response) {
    console.log('res', response)
  })
})

const downloadLog = document.getElementById('downloadLog')

function saveStrToFile(str, filename = 'file.txt') {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url: URL.createObjectURL(
          new Blob([str], {
            type: 'text/plain',
          })
        ),
        filename,
        saveAs: true,
      },
      (downloadId) => {
        console.log('downloadId', downloadId)
        chrome.downloads.onChanged.addListener(({ id, state }) => {
          if (id === downloadId && state && state.current === 'complete') {
            chrome.downloads.search(
              {
                id,
              },
              (downloadItem) => {
                resolve(downloadItem)
              }
            )
          } else if (
            id === downloadId &&
            state &&
            state.current === 'interrupted'
          ) {
            chrome.downloads.search(
              {
                id,
              },
              (downloadItem) => {
                reject(downloadItem)
              }
            )
          }
        })
      }
    )
  })
}

// 向content-script主动发送消息
function sendMessageToContentScript(message, callback) {
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

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('收到来自content-script的消息：')
  console.log(request, sender, sendResponse)
  const { cur, total, board } = request
  switch (request.status) {
    case 'GET_ALL_PINS':
      downloadLog.innerHTML += `<div>获取所有图片 id：${cur} / ${total}</div>`
      if (cur >= total) {
        const imgURLs = board.pins.map(({ file }) => {
          const { bucket, key } = file
          // const url = `https://${bucket}.huabanimg.com/${key}_fw658/format/webp`
          return `https://${bucket}.huabanimg.com/${key}`
        })
        console.log(imgURLs)
        downloadLog.innerHTML += `<div>正在保存所有图片链接</div>`
        saveStrToFile(
          imgURLs.reduce((pre, cur) => pre + cur + '\n', ''),
          `${board.title}（${board.board_id}）.txt`
        ).then(([downloadItem]) => {
          console.log(downloadItem)
          const { filename, endTime, fileSize } = downloadItem
          downloadLog.innerHTML += `<div>${new Date(
            endTime
          )} 已保存所有图片链接至：${filename}</div>
          <div>文件大小：${fileSize}</div>
          <div>（图片链接下载后还需要手动添加 .jpg 后缀）</div>
          `
        })
      }

      break
    case 'GET_INFO':
      //   const {
      //     board_id,
      //     category_id,
      //     category_name,
      //     created_at,
      //     deleting,
      //     description,
      //     follow_count,
      //     is_private,
      //     like_count,
      //     pin_count,
      //     seq,
      //     title,
      //     updated_at,
      //     user_id,
      //   } = board
      let outputStr = ''
      Object.keys(board).forEach((key) => {
        const value = board[key]
        if (value instanceof Object) {
          return
        }
        outputStr += `<div>${key}: ${value}</div>`
      })
      document.getElementById('info').innerHTML = outputStr
      break

    default:
      break
  }
  // sendResponse('我是popup，我已收到你的消息：' + JSON.stringify(request))
})
