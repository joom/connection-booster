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
        console.log(res);
        webview.src = "data:text/html," + res

        // webview.executeScript({code: `document.documentElement.innerHTML`}, function(results) {
        //   // results[0] would have the webview's innerHTML.
        //   console.log(results);
        // });
      })
    })
  }

  // webview.addEventListener("contentload", function(load) {
  //   console.log(load);
  //   webview.stop()
  // })
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
        chrome.sockets.tcp.onReceive.addListener((recvInfo) => {
          // recvInfo.data is an arrayBuffer.
          if (recvInfo.socketId != socketId) {
            return
          }
          var res = dec.decode(recvInfo.data)
          cb(res);
          chrome.sockets.tcp.disconnect(socketId);
        })
      })
    })
  })

}
