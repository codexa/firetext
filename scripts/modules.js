/*
* Modules
* Copyright (C) Codexa Organization.
*/

if (!app) {
	var app = {};
}

(function(window, undefined) {
	'use strict';
	
	function loadModule(url, callback, deep) {
		// Validate params
		if (!url) {
			callback('bad-params');
		}
	
		// Get module
		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "document";
		request.overrideMimeType("text/html");
		request.addEventListener("load", function(e) {
			if(this.status === 200) {
				var response = this.response;
				if (deep) {
					var scriptTags = response.querySelectorAll("script");
					var scripts = {};
					for (var i = 0; i < scriptTags.length; i++) {
						if(scriptTags[i].src) {
							(function() {
								var scriptURL = new URI(scriptTags[i].src, new URI(location.href)).toString();
								if(!scripts[scriptURL]) {
									scripts[scriptURL] = [];
									var scriptReq = new XMLHttpRequest();
									scriptReq.open("GET", scriptURL, true);
									scriptReq.responseType = "text";
									scriptReq.addEventListener("load", function(e) {
										var done = true;
										if(this.status === 200) {
											var inlineScript = response.createElement("script");
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
												callback(null, createBlob(response));
											}
										}
									}, false);
									scriptReq.send();
								}
								scripts[scriptURL].push(scriptTags[i]);
							})();
						}
					}
				} else {
					callback(null, createBlob(response));
				}
			} else {
				callback(this.status);
			}
		}, false);
		request.send();
	}
	
	function fillFrame(blobURL, destinations, callback) {
		// Validate params
		if (!blobURL || !destinations) {
			callback('bad-params');
		}
		
		if (!Array.isArray(destinations)) {
			destinations = [destinations];
		}
		
		// Fill frames
		destinations.forEach(function(t){
			t.src = blobURL;
		});
		
		// Done!
		callback();
	}
	
	function createBlob(response) {
		var moduleBlob = new Blob([response.documentElement.outerHTML], {type: "text/html"});
		var moduleURL = URL.createObjectURL ? URL.createObjectURL(moduleBlob) : URL.webkitCreateObjectURL ? URL.webkitCreateObjectURL(moduleBlob) : null;
		return moduleURL;	
	}
	
	app.modules = {
    	load: function (url, destinations, callback, deep) {
    		console.log('Loading '+url);
    		loadModule(url, function(e,b){
    			if (e) {
    				console.log(e);
    			} else {
					fillFrame(b, destinations, function(e){
						if (e) {
							console.log(e);
						} else {
							console.log('Finished loading '+url);
							callback();
						}
					});
    			}
    		}, deep);
    	}
    };
})(this);
