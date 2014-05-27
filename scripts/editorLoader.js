var temp;
var loadEditor = (function () {
	var editorURL;
	var loadEditor = function loadEditor(callback) {
		if(editorURL) {
			callback(editorURL);
			return;
		}
		var editorDoc;

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
							var scriptURL = new URI(scriptTags[i].src, new URI("editor", location.href)).toString();
							if(!scripts[scriptURL]) {
								scripts[scriptURL] = [];
								var scriptReq = new XMLHttpRequest();
								scriptReq.open("GET", scriptURL, true);
								scriptReq.responseType = "text";
								scriptReq.addEventListener("load", function(e) {
									var done = true;
									if(this.status === 200) {
										var inlineScript = editorDoc.createElement("script");
										var scriptText = this.response;
										scriptText = scriptText.replace(/\[ORIGIN_OF_MAIN_DOCUMENT\]/g, window.location.origin ? window.location.origin : window.location.protocol + "//" + window.location.host);
										inlineScript.type = "text/javascript";
										inlineScript.src = "data:text/javascript;base64," + btoa(scriptText);
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
											var editorBlob = new Blob([editorDoc.documentElement.outerHTML], {type: "text/html"})
											editorURL = URL.createObjectURL ? URL.createObjectURL(editorBlob) : URL.webkitCreateObjectURL ? URL.webkitCreateObjectURL(editorBlob) : null;
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