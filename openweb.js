// once page loads
document.addEventListener('DOMContentLoaded', function() {
  // identify the submit
  var button = document.getElementById("clickme");
  var webview = document.querySelector('webview');
  webview.src = `data:text/html,`

  if (button) {
    button.addEventListener("click", function() {
      var url = document.getElementById("website").value.trim();
      // webview.src = url
      // webview.stop()
      // console.log(webview.contentWindow)
      socketMagic(url, (res) => {
        webview.src = "data:text/html," + res

        // webview.executeScript({code: `document.documentElement.innerHTML`}, function(results) {
        //   // results[0] would have the webview's innerHTML.
        //   console.log(results);
        // });
      })
    })
  }
})

var socketMagic = (urlString, cb) => {
  // make sure url starts with http://
  var url = new URL(urlString)
  if (url.protocol !== "http:") {
    throw new Error("URL should start with http://")
  }

  var enc = new TextEncoder()
  var dec = new TextDecoder()
  var httpReqHeader = `GET ${url.pathname} HTTP/1.1\r\nHost: ${url.host}\r\n\r\n`
  var httpReqHeaderEnc = enc.encode(httpReqHeader)

  chrome.sockets.tcp.create({}, (createInfo) => {
    var socketId = createInfo.socketId
    chrome.sockets.tcp.connect(socketId, url.host, 80, (result) => {
      chrome.sockets.tcp.send(socketId, httpReqHeaderEnc, (sendInfo) => {
        var chunk = 0
        all = ``
        var len = 0
        var totalLen = 0

        chrome.sockets.tcp.onReceive.addListener((recvInfo) => {
          chunk++

          if (recvInfo.socketId != socketId) {
            return
          }

          // recvInfo.data is an arrayBuffer.
          var res = dec.decode(recvInfo.data)

          if (chunk === 1) {
            var obj = parseHeaders(res)
            all = all.concat(obj.body)
            len += enc.encode(obj.body).byteLength
            totalLen = parseInt(obj.headers["Content-Length"])
          } else {
            all = all.concat(res)
            len += recvInfo.data.byteLength
          }

          console.log(`Chunk ${chunk}, Len: ${len}, TotalLen: ${totalLen}`);

          if(len >= totalLen) {
            cb(all);
            chrome.sockets.tcp.disconnect(socketId);
          }
        })

        chrome.sockets.tcp.onReceiveError.addListener((errInfo) => {
          chrome.sockets.tcp.disconnect(socketId);
        })
      })
    })
  })
}

var parseHeaders = (res) => {
  var s = "\r\n\r\n"
  var ind = res.indexOf(s)
  var headers = res.slice(0,ind)
  var body = res.slice(ind + s.length)
  var obj = {headers: {}}

  headers.split("\r\n").forEach((line) => {
    var ind = line.indexOf(": ")
    var key = line.slice(0, ind)
    var val = line.slice(ind + 2)
    obj.headers[key] = val
  })
  obj.body = body
  console.log(obj)

  return obj
}

