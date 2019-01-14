// on launch, load intro window with input field
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 700,
      'height': 700
    }
  }, function(win) {
    // win.maximize()
  });
});

