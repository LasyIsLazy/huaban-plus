(function () {
  const src = "inject";
  // 通过postMessage调用content-script
  function postToCS(msg) {
    window.postMessage({ src, msg }, "*");
  }

  function base64ToBlob(b64data, contentType, sliceSize) {
    sliceSize || (sliceSize = 512);
    // 使用 atob() 方法将数据解码
    let byteCharacters = atob(b64data);
    let byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      let slice = byteCharacters.slice(offset, offset + sliceSize);

      let byteNumbers = [];
      for (let i = 0; i < slice.length; i++) {
        byteNumbers.push(slice.charCodeAt(i));
      }
      // 8 位无符号整数值的类型化数组。内容将初始化为 0。
      // 如果无法分配请求数目的字节，则将引发异常。
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, {
      type: contentType,
    });
  }

  window.addEventListener(
    "message",
    async function (e) {
      if (e.data.src && e.data.src !== src) {
        console.log("收到消息：", e.data);
        const { cmd, data } = e.data.msg;
        console.log(data);
        const match = location.href.match(/.+huaban\.com\/boards\/(\d+)/);
        if (!match) {
          return;
        }
        let board;
        const boardId = match[1];
        console.log("boardId", boardId);
        console.log(app.page["board"]);
        function fetchPins(lastPinId = "", limit = 100) {
          // 测试发现 limit 最大为 100
          const url = `https://huaban.com/boards/${boardId}/?${Date.now()}&max=${
            lastPinId || ""
          }&limit=${limit}&wfl=1`;
          return fetch(url, {
            headers: {
              accept: "application/json",
              "accept-language": "zh-CN,zh;q=0.9",
              "cache-control": "no-cache",
              pragma: "no-cache",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-request": "JSON",
              "x-requested-with": "XMLHttpRequest",
            },
            referrerPolicy: "unsafe-url",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include",
          }).then((res) => res.json());
        }
        if (cmd === "GET_INFO") {
          const data = await fetchPins("", 1);
          board = data.board;
          postToCS({
            status: "GET_INFO",
            board,
          });
        } else if (cmd === "GET_ALL_PINS") {
          let curPins = [];
          let count = 0;
          do {
            const data = await fetchPins(
              curPins[curPins.length - 1]
                ? curPins[curPins.length - 1].pin_id
                : ""
            );
            curPins = data.board.pins;
            console.log("pins", curPins);

            if (!count++) {
              // 第一次请求
              board = data.board;
              console.log("共有", board.pin_count);
            } else {
              board.pins.push(...curPins);
            }
            if (!curPins.length) {
              break;
            }
            postToCS({
              status: "GET_ALL_PINS",
              cur: board.pins.length,
              total: board.pin_count,
              board,
            });
          } while (curPins.length);
          console.log(board.pins);
        } else if (cmd === "UPLOAD") {
          data.files.forEach(async ({ name, type, base64 }) => {
            const file = base64ToBlob(base64.split(",")[1], type);
            console.log("upload", file);
            let formData = new FormData();
            formData.append("file", file);
            formData.append("check", true);
            const { id } = await fetch("/upload", {
              method: "post",
              body: formData,
            }).then((response) => response.json());
            // const url = `//${bucket}.huabanimg.com/${key}_fw658/format/webp`;
            formData = new FormData();
            const boradId = Number(/boards\/(\d+)\//g.exec(location.href)[1]);
            formData.append("board_id", boradId);
            formData.append("text", name);
            formData.append("file_id", id);
            console.log("formData", formData);
            const resData = await fetch("/pins", {
              method: "post",
              body: formData,
            }).then((res) => res.json());
            console.log("resData", resData);
          });
        }
      }
    },
    false
  );
})();
