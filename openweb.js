// once page loads
document.addEventListener('DOMContentLoaded', function() {
  // identify the submit
  var button = document.getElementById("clickme");
  var webview = document.querySelector('webview');
  webview.src = `data:text/html,`

  if (button) {
    button.addEventListener("click", function() {
      // var url = document.getElementById("website").value.trim();
      // webview.src = url
      // webview.stop()
      // console.log(webview.contentWindow)
      webview.executeScript({code: `document.documentElement.innerHTML = "hey there"`}, function(results) {
        // results[0] would have the webview's innerHTML.

      });
    })
  }

  // webview.addEventListener("contentload", function(load) {
  //   console.log(load);
  //   webview.stop()
  // })
})
