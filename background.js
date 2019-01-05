// on launch, load intro window with input field
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 400,
      'height': 300
    }
  });
});

// once window loaded, wait for click and read url 
document.addEventListener('DOMContentLoaded', function() {
	// button is null for some reason ???? wtf
	var button = document.getElementById("go");
	if (button) {
		console.log("button isn't null");
	button.addEventListener("click", function(){
			var url = document.getElementById("website").value.trim();
			
			//this snippet works by itself
			chrome.app.window.create(
			     'webview.html',
			     {hidden: true},   // only show window when webview is configured
			     function(win) {
			       win.contentWindow.addEventListener('DOMContentLoaded',
			         function(e) {
			           // when window is loaded, set webview source
			           var webview = win.contentWindow.
			                document.querySelector('webview');
			           webview.src = url;
			           // now we can show it:
			           appWin.show();
			         }
			       );
			     });

		});
	} 
	console.log("button is null");
});
