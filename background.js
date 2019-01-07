// on launch, load intro window with input field
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 400,
      'height': 300
    }
  }, function(win) {
    win.maximize()
  });
});

