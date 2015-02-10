/*
* Night Mode
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Night Mode
------------------------*/
var ncss, dcss = document.getElementsByTagName("link")[25];
var nightTheme = '#111', dayTheme = '#fff';

function night() {
	if (firetext.settings.get('nightmode') == 'true') {
		startNight(true);
	} else if (firetext.settings.get('nightmode') == 'false') {
		startNight(false);
	} else {
		startNight(false);
		
		window.addEventListener('devicelight', function(event) {
			if (firetext.settings.get('nightmode') == 'auto') {
				if (event.value < 3.4) {
					if (html.classList.contains('night') != true) {
						startNight(true);
					}
				} else if (event.value > 5) {
					if (html.classList.contains('night')) {
						startNight(false);
					}
				}
			}
		});		 
	}
}

function startNight(start) {
	if (start) {
		html.classList.add('night');
		themeColor.setAttribute('content', nightTheme);
		if (editorMessageProxy) {
			editorMessageProxy.postMessage({
				command: "night",
				nightMode: true
			});
		}
		if (rawEditor) {
			rawEditor.setOption("theme", 'tomorrow-night-bright');
		}
	} else {
		html.classList.remove('night');
		themeColor.setAttribute('content', dayTheme);
		if (editorMessageProxy) {
			editorMessageProxy.postMessage({
				command: "night",
				nightMode: false
			});
		}
		if (rawEditor) {
			rawEditor.setOption("theme", 'default');
		}
	}
}
