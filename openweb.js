// once page loads
document.addEventListener('DOMContentLoaded', function() {
	// identify the submit
	var button = document.getElementById("clickme");

	if (button) {

		button.addEventListener("click", function(){
			var url = document.getElementById("website").value.trim();

			// open new webview with URL
			chrome.app.window.create(
     		   'webview.html',
     		   {hidden: true},
     		   function(win) {
       				win.contentWindow.addEventListener('DOMContentLoaded',
         		  		function(e) {
		   		   		 	var webview = win.contentWindow.document.querySelector('webview');
           					webview.src = url;
           	 			   	win.show();
       				});
     		 });
		 });
	 }
});
