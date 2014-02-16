var temp;
var loadEditor = (function () {
  var editorURL;
  var loadEditor = function loadEditor(callback) {
    if(editorURL) {
      callback(editorURL);
      return;
    }
    var editorDoc;
    var createObjectURL = URL.createObjectURL || URL.webkitCreateObjectURL;

    var editorReq = new XMLHttpRequest();
    editorReq.open("GET", "editor/editor.html", true);
    editorReq.responseType = "document";
    editorReq.overrideMimeType("text/html");
    editorReq.addEventListener("load", function(e) {
      if(this.status === 200) {
        editorDoc = this.response;
        var scriptTags = editorDoc.querySelectorAll("script");
        var scripts = {};
        temp = editorDoc;
        for (var i = 0; i < scriptTags.length; i++) {
          if(scriptTags[i].src) {
            (function() {
              var scriptURL = new URL(scriptTags[i].src, new URL("editor", location.href)).href;
              if(!scripts[scriptURL]) {
                scripts[scriptURL] = [];
                var scriptReq = new XMLHttpRequest();
                scriptReq.open("GET", scriptURL, true);
                scriptReq.responseType = "text";
                scriptReq.addEventListener("load", function(e) {
                  var done = true;
                  if(this.status === 200) {
                    var inlineScript = editorDoc.createElement("script");
                    inlineScript.type = "text/javascript";
                    inlineScript.src = "data:text/javascript;base64," + btoa(this.response);
                    scripts[scriptURL][0].parentNode.replaceChild(inlineScript, scripts[scriptURL][0]);
                    for (var i = 1; i < scripts[scriptURL].length; i++) {
                      scripts[scriptURL][i].parentNode.removeChild(scripts[scriptURL][i]);
                    }
                    delete scripts[scriptURL];
                    for(var x in scripts) {
                      done = false;
                      break;
                    }
                    if (done) {
                      editorURL = createObjectURL(new Blob([editorDoc.documentElement.outerHTML], {type: "text/html"}));
                      callback(editorURL);
                    }
                  }
                }, false);
                scriptReq.send();
              }
              scripts[scriptURL].push(scriptTags[i]);
            })();
          }
        }
      }
    }, false);
    editorReq.send();
  }
  return loadEditor;
})();