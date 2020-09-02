document.getElementById('btn').addEventListener('click', () => {
    sendMessageToContentScript({ cmd: 'info' }, function (response) {
        console.log('res', response)
    })
})

function saveStrToFile(str, filename = 'file.txt') {
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
        }
    )
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
            document.getElementById(
                'hint'
            ).innerHTML = `获取所有图片 id：${cur} / ${total}`
            if (cur >= total) {
                const imgURLs = board.pins.map(({ file }) => {
                    const { bucket, key } = file
                    // const url = `https://${bucket}.huabanimg.com/${key}_fw658/format/webp`
                    return `https://${bucket}.huabanimg.com/${key}`
                })
                console.log(imgURLs)
                saveStrToFile(
                    imgURLs.reduce((pre, cur) => pre + cur + '\n', ''),
                    `${board.title}（${board.board_id}）.txt`
                )
            }

            break

        default:
            break
    }
    // sendResponse('我是popup，我已收到你的消息：' + JSON.stringify(request))
})
