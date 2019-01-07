// once page loads
document.addEventListener('DOMContentLoaded', function() {
  // identify the submit
  var button = document.getElementById("clickme");

  if (button) {
    button.addEventListener("click", function() {
      var url = document.getElementById("website").value.trim();
      var webview = document.querySelector('webview');
      webview.src = url;
    })
  }
})
