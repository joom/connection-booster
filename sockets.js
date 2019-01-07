// stops window from loading altogether
// window.stop();

// fires after everything has been loaded (too late for us)
//window.addEventListener('load', function() { console.log('page fully loaded');});

// get current window object
// var win = chrome.app.window.current();

// testing creating a socket - works!
chrome.sockets.tcp.create(function(){});

// show all sockets - works!
chrome.sockets.tcp.getSockets(function(socketInfos) {
  var d = {}
  for (var i=0; i<socketInfos.length; i++) {
    d[socketInfos[i].socketId] = socketInfos[i]
  }
  console.log('current tcp sockets', d);
});



/* EXAMPLES FOR WORKING WITH SOCKETS (https://developer.chrome.com/apps/app_network):

chrome.sockets.tcp.create({}, function(createInfo) {
  chrome.sockets.tcp.connect(createInfo.socketId,
    IP, PORT, onConnectedCallback);
});

chrome.sockets.tcp.send(socketId, arrayBuffer, onSentCallback);

chrome.sockets.tcp.onReceive.addListener(function(info) {
  if (info.socketId != socketId)
    return;
  // info.data is an arrayBuffer.
});

chrome.sockets.tcp.disconnect(socketId);

*/
