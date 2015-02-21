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
					var elements = response.querySelectorAll("script, link");
					var loading = {};
					for (var i = 0; i < elements.length; i++) {
						(function() {
							var element = elements[i];
							var name = element.tagName;
							if(name === "SCRIPT" ? element.src : element.href) {
								var type = element.type;
								var url = name === "SCRIPT" ? element.src : element.href;
								var rel = element.getAttribute('rel');
								var data = element.dataset;
								if(!loading[url]) {
									loading[url] = [];
									var req = new XMLHttpRequest();
									req.open("GET", url, true);
									req.responseType = "text";
									req.addEventListener("load", function(e) {
										var done = true;
										if(this.status === 200) {
											var inline = response.createElement(name);
											var text = this.response;
											text = text.replace(/\[ORIGIN_OF_MAIN_DOCUMENT\]/g, window.location.origin ? window.location.origin : window.location.protocol + "//" + window.location.host);
											inline.type = type;
											if(name === "SCRIPT") {
												inline.src = "data:text/javascript;base64," + btoa(text + '\n//# sourceURL=' + url);
											} else {
												inline.href = "data:text/css;base64," + btoa(text + '\n/*# sourceURL=' + url + '*/');
											}
											inline.setAttribute('rel', rel);
											for (var key in data) {
												inline.dataset[key] = data[key];
											}
											loading[url][0].parentNode.replaceChild(inline, loading[url][0]);
											for (var i = 1; i < loading[url].length; i++) {
												loading[url][i].parentNode.removeChild(loading[url][i]);
											}
											delete loading[url];
											for(var x in loading) {
												done = false;
												break;
											}
											if (done) {
												callback(null, createBlob(response));
											}
										}
									}, false);
									req.send();
								}
								loading[url].push(element);
							}
						})();
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
	
	function fillFrame(url, destinations, callback) {
		// Validate params
		if (!url || !destinations) {
			callback('bad-params');
		}
		
		if (!Array.isArray(destinations)) {
			destinations = [destinations];
		}
		
		// Fill frames
		destinations.forEach(function(t){
			t.src = url;
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
		fill: function (url, destinations, callback) {
			fillFrame(url, destinations, function(e){
				if (e) {
					console.log(e);
				} else {
					callback();
				}
			});
		},
		load: function (url, destinations, callback, store, deep) {
			console.log('Loading '+url);
			
			if (store) {
				loadModule(url, function(e,b){
					if (e) {
						console.log(e);
					} else {
						fillFrame(b, destinations, function(e){
							if (e) {
								console.log(e);
							} else {
								console.log('Finished loading '+url);
								callback(b);
							}
						});
					}
				}, deep);
			} else {
				fillFrame(url, destinations, function(e){
					if (e) {
						console.log(e);
					} else {
						console.log('Finished loading '+url);
						callback();
					}
				});
			}
		}
	};
})(this);
