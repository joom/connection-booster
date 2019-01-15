var enc = new TextEncoder('utf-8')
var dec = new TextDecoder('utf-8')

// Takes the first chunk of an HTTP response,
// or whatever it is given that has to end with \r\n\r\n,
// parses the headers and the body to an object.
const parseHeaders = (res) => {
  var obj = { headers: {} }
  var s = '\r\n\r\n'
  var ind = res.indexOf(s)
  var headers = res.slice(0, ind)
  obj.headerLength = enc.encode(res.slice(0, ind + s.length)).byteLength
  var body = res.slice(ind + s.length)

  headers.split('\r\n').forEach((line) => {
    if (line.indexOf('HTTP/1.1') === 0) {
      obj.headers.status = line
      return
    }
    var ind = line.indexOf(': ')
    var key = line.slice(0, ind)
    var val = line.slice(ind + 2)
    obj.headers[key] = val
  })

  obj.body = body
  ind = obj.headers['Content-Type'].indexOf('; ')
  if (ind !== -1) {
    obj.encoding = obj.headers['Content-Type'].slice(ind + 2)
    obj.encoding = obj.encoding.slice(obj.encoding.indexOf('charset=') + 8)
    obj.mimeType = obj.headers['Content-Type'].slice(0, ind)
  } else {
    obj.mimeType = obj.headers['Content-Type']
  }
  return obj
}

var activeSockets = 0
var sockets = {} // mapping URLs to SocketInfo

// Takes a URL string, opens a TCP connection, sends an HTTP request, receives
// an HTTP response and parses it. The callback function takes the response
// body as a string, and the parsed object from the initial chunk.
const socketMagic = (urlString, cb) => {
  var url = new URL(urlString)
  if (url.protocol !== 'http:') {
    return
    // throw new Error("URL should start with http://")
  }
  var httpReqHeader = `GET ${url.pathname} HTTP/1.1\r\nHost: ${url.host}\r\nAccept-Encoding: UTF-8\r\nAccept-Charset: UTF-8\r\n\r\n`
  var httpReqHeaderEnc = enc.encode(httpReqHeader)

  chrome.sockets.tcp.create({}, (createInfo) => {
    console.log(`Created socket for ${urlString}, active ${activeSockets}`)
    activeSockets++
    var socketId = createInfo.socketId
    sockets[urlString] = socketId
    chrome.sockets.tcp.connect(socketId, url.host, 80, (result) => {
      console.log(`Connected to socket for ${urlString}, active ${activeSockets}`)
      chrome.sockets.tcp.send(socketId, httpReqHeaderEnc, (sendInfo) => {
        var chunk = 0
        var all = []
        var len = 0
        var totalLen = 0
        var obj = {}

        var listener = (recvInfo) => {
          if (recvInfo.socketId !== socketId) { return }
          // console.log(`RECEIVED for ${url.pathname}`)
          // console.log(recvInfo)
          chunk++

          // recvInfo.data is an arrayBuffer.
          if (chunk === 1) {
            var arr = new Uint8Array(recvInfo.data)
            var arrLenLimit = arr.length - 3
            var i = 0
            while (0 <= i < arrLenLimit) {
              // console.log(`PARSE LOOP at ${i}`)
              // look for the sequence: 13 10 13 10, which corresponds to \r\n\r\n,
              // which signals the end of a HTTP response header
              i = arr.indexOf(13, i)
              // console.log(`sequence: ${arr[i]} ${arr[i+1]} ${arr[i+2]} ${arr[i+3]}`)

              // we need == instead of === because the array consists of 8-bit integers, not numbers
              if (arr[i + 1] == 10 && arr[i + 2] == 13 && arr[i + 3] == 10) {
                break // then i is what we are looking for!
              } else {
                i++ // we gotta increase it so that this \r is not included in the next indexOf
              }
            }
            var nonHeaderData = arr.slice(i + 4) // just get the part AFTER the \r\n\r\n
            var headerData = arr.slice(0, i + 4) // just get the part before the body, including \r\n\r\n
            all.push(nonHeaderData.buffer)

            obj = parseHeaders(dec.decode(headerData))
            len += recvInfo.data.byteLength - obj.headerLength
            totalLen = parseInt(obj.headers['Content-Length'])
          } else {
            all.push(recvInfo.data)
            len += recvInfo.data.byteLength
          }

          // console.log(`Chunk #${chunk}, ${len}/${totalLen}, loaded ${((len / totalLen) * 100).toFixed(1)}% of file: ${url.pathname}, active ${activeSockets}`)

          if (len >= totalLen) {
            //chrome.sockets.tcp.onReceive.removeListener(listener)
            try {
              chrome.sockets.tcp.disconnect(socketId)
            } catch (e) {}

            if (sockets[urlString]) {
              activeSockets--
              delete sockets[urlString]
            }
            console.log(`Finished loading ${url.pathname}, active ${activeSockets}`)
            var blob = new Blob(all, { type: obj.mimeType })
            cb(blob, obj)
          }
        }

        chrome.sockets.tcp.onReceive.addListener(listener)

        var listenerError = (errInfo) => {
          //chrome.sockets.tcp.onReceive.removeListener(listener)
          //chrome.sockets.tcp.onReceive.removeListener(listenerError)
          // if (sockets[urlString]) {
//             activeSockets--
//             delete sockets[urlString]
//           }
        }
        chrome.sockets.tcp.onReceiveError.addListener(listenerError)
      })
    })
  })
}

const blobToBase64 = (blob, cb) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => cb(reader.result))
  reader.readAsDataURL(blob)
}
const blobToText = (blob, cb) => {
  const reader = new FileReader()
  reader.addEventListener('load', () => cb(reader.result))
  reader.readAsText(blob)
}

// Takes an absolute base URL (the page that the browser is looking at),
// the response body as a string, the MIME type,
// and a callback that takes a document.
const domMagic = (baseURL, body, cb) => {
  var parser = new DOMParser()
  var doc = parser.parseFromString(body, 'text/html')

  // Example code to stop clicks in the page, so that we can overload them.
  // It's not super clear how we can send a message from the WebView
  // to the outer app.
  /*
    var script = doc.createElement("script")
    script.appendChild(doc.createTextNode(
    // doesn't work yet
    `document.addEventListener("click", function(event) {
        event.preventDefault()
        console.log(event.target)
    })
    `))
    doc.body.appendChild(script)
  */

  // fully qualify all the links. i.e. resolve relative paths etc.
  doc.querySelectorAll('[src], [href]').forEach((elt) => {
    if (elt.attributes.src) {
      elt.setAttribute('src', new URL(elt.attributes.src.value, baseURL).href)
    }
    if (elt.attributes.href) {
      elt.setAttribute('href', new URL(elt.attributes.href.value, baseURL).href)
    }
  })

  // a sourcemap is a dictionary with fully qualified URLs as keys, and the downloaded content as values
  var sourcemap = {}

  // gotta load images and stuff, i.e. socket shit
  var parallelFns = []
  doc.querySelectorAll('img[src], script[src], link[href]').forEach((elt) => {
    var addr = ``
    if (elt.attributes.src) { addr = elt.attributes.src.value }
    if (elt.attributes.href) { addr = elt.attributes.href.value }
    if (sourcemap[addr]) { return } // don't download twice

    parallelFns.push(function (callback) {
      socketMagic(addr, (blob, obj) => {
        blobToBase64(blob, (b) => {
          sourcemap[addr] = b
          callback(null, {})
        })
      })
    })
  })

  var limit
  if (document.querySelector('#parallel1').checked) {
    limit = parallelFns.length / 2
  } else {
    limit = parseInt(document.querySelector('#parallel').value)
  }
  console.log(`Starting to download ${parallelFns.length} files in parallel, with max ${limit} at a time`)

  runParallelLimit(parallelFns, limit, function (err, results) {
	console.log(err)
	console.log(results)
    // now all resources have been downloaded
    console.log('All downloads finished, sourcemap filled')
    // console.log(sourcemap)
    cb(doc, sourcemap)
  })
}

// Takes a URL, does all the connection stuff and updates the WebView,
// then calls the callback which takes a document.
const urlMagic = (url, cb) => {
  socketMagic(url, (blob, obj) => {
    var webview = document.querySelector('webview')
    blobToBase64(blob, (b64) => { webview.src = b64 })

    if (obj.mimeType !== 'text/html') { return }
    blobToText(blob, (body) => {
      domMagic(url, body, (doc, sourcemap) => {
        // console.log("DOMMAGIC CALLBACK:")
        // doc is the corrected document

        doc.querySelectorAll('img[src], script[src], link[href]').forEach(function (elt) {
          if (elt.attributes.src && sourcemap[elt.attributes.src.value]) {
            elt.setAttribute('src', sourcemap[elt.attributes.src.value])
            // console.log("src changed")
          }
          if (elt.attributes.href && sourcemap[elt.attributes.href.value]) {
            elt.setAttribute('href', sourcemap[elt.attributes.href.value])
            // console.log("href changed")
          }
        })

        var dochtml = new XMLSerializer().serializeToString(doc)
        webview.src = `data:${obj.mimeType},${dochtml}`

        // WRITE ABOUT WHY WE COULDN'T DO THIS
        // var code = `(function(){var sourcemap = ${str};
        //             })()`
        // webview.executeScript({code: code}, function(results) {
        //   // results[0] would have the webview's innerHTML.
        //   console.log("RAN THE CODE");
        //   console.log(results)
        // })

        cb(doc)
      })
    })
  })
}

const closeAllSockets = () => {
  chrome.sockets.tcp.getSockets((sockets) => {
    sockets.forEach((socketInfo) => {
      chrome.sockets.tcp.disconnect(socketInfo.socketId, () => {})
      chrome.sockets.tcp.close(socketInfo.socketId, () => {})
    })
  })
  activeSockets = 0
}

// Once page loads
document.addEventListener('DOMContentLoaded', (ev) => {
  var go = document.getElementById('go')
  var webview = document.querySelector('webview')
  webview.src = `data:text/html,` // empty page

  go.addEventListener('click', (ev) => {
    var t1 = performance.now()
    closeAllSockets()
    var url = document.getElementById('website').value.trim()
    urlMagic(url, (doc) => {
      var t2 = performance.now()
      var diff = t2 - t1
      console.log(`Page loaded in ${diff} ms: ${url}`)
    })
  })
  document.getElementById('reload').addEventListener('click', (ev) => {
    chrome.runtime.reload()
  })
})
