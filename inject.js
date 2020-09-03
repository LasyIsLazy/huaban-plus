;(function () {
  const src = 'inject'
  // 通过postMessage调用content-script
  function postToCS(msg) {
    window.postMessage({ src, msg }, '*')
  }

  window.addEventListener(
    'message',
    async function (e) {
      if (e.data.src && e.data.src !== src) {
        console.log('收到消息：', e.data)
        const { cmd, data } = e.data.msg
        const match = location.href.match(/.+huaban\.com\/boards\/(\d+)/)
        if (!match) {
          return
        }
        let board
        const boardId = match[1]
        console.log('boardId', boardId)
        console.log(app.page['board'])
        function fetchPins(lastPinId = '', limit = 100) {
          // 测试发现 limit 最大为 100
          const url = `https://huaban.com/boards/${boardId}/?${Date.now()}&max=${
            lastPinId || ''
          }&limit=${limit}&wfl=1`
          return fetch(url, {
            headers: {
              accept: 'application/json',
              'accept-language': 'zh-CN,zh;q=0.9',
              'cache-control': 'no-cache',
              pragma: 'no-cache',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-origin',
              'x-request': 'JSON',
              'x-requested-with': 'XMLHttpRequest',
            },
            referrerPolicy: 'unsafe-url',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          }).then((res) => res.json())
        }
        if (cmd === 'GET_INFO') {
          const data = await fetchPins('', 1)
          board = data.board
          postToCS({
            status: 'GET_INFO',
            board,
          })
        }
        if (cmd === 'GET_ALL_PINS') {
          let curPins = []
          let count = 0
          do {
            const data = await fetchPins(
              curPins[curPins.length - 1]
                ? curPins[curPins.length - 1].pin_id
                : ''
            )
            curPins = data.board.pins
            console.log('pins', curPins)

            if (!count++) {
              // 第一次请求
              board = data.board
              console.log('共有', board.pin_count)
            } else {
              board.pins.push(...curPins)
            }
            if (!curPins.length) {
              break
            }
            postToCS({
              status: 'GET_ALL_PINS',
              cur: board.pins.length,
              total: board.pin_count,
              board,
            })
          } while (curPins.length)
          console.log(board.pins)
        }
      }
    },
    false
  )
})()
