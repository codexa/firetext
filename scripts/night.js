/*
* Night Mode
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Night Mode
------------------------*/
var ncss, dcss = document.getElementsByTagName("link")[25];

function night() {
	if (firetext.settings.get('nightmode') == 'true') {
		html.classList.add('night');
		editorMessageProxy.getPort().postMessage({
			command: "night",
			nightMode: true
		});
	} else if (firetext.settings.get('nightmode') == 'false') {
		html.classList.remove('night');
		editorMessageProxy.getPort().postMessage({
			command: "night",
			nightMode: false
		});
	} else {
		html.classList.remove('night');
		editorMessageProxy.getPort().postMessage({
			command: "night",
			nightMode: false
		});
		
		window.addEventListener('devicelight', function(event) {
			if (firetext.settings.get('nightmode') == 'auto') {
				if (event.value < 5) {
					if (html.classList.contains('night') != true) {
						html.classList.add('night');
						editorMessageProxy.getPort().postMessage({
						 command: "night",
						 nightMode: true
						});
					}
				} else if (event.value > 10) {
					if (html.classList.contains('night')) {
						html.classList.remove('night');
						editorMessageProxy.getPort().postMessage({
						 command: "night",
						 nightMode: false
						});
					}
				}
			}
		});		 
	}
}
