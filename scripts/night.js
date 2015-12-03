/*
* Night Mode
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Night Mode
------------------------*/
var ncss, dcss = document.getElementsByTagName("link")[25];
var nightTheme = '#111', dayTheme = '#fff';
var nightChangeEvent = new CustomEvent('night.changed'), nightListener;

function night() {
	switch (firetext.settings.get('nightmode')) {
		case "true":
			startNight(true);
			window.removeEventListener('devicelight', processLight);
			nightListener = false;
			break;
		case "false":
			startNight(false);
			window.removeEventListener('devicelight', processLight);
			nightListener = false;
			break;
		case "auto":
			startNight(false);
			if (!nightListener) window.addEventListener('devicelight', processLight);
			nightListener = true;
			break;
	}
}

function processLight(event) {
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
}

function startNight(start) {
	if (start) {
		// Leave breadcrumb
		if (bugsenseInitialized) {
			Bugsense.leaveBreadcrumb("Night mode activated");
		}	
		
		html.classList.add('night');
		themeColor.setAttribute('content', nightTheme);
		if (editorMessageProxy) {
			editorMessageProxy.postMessage({
				command: "night",
				nightMode: true
			});
		}
		if (rawEditor instanceof CodeMirror) {
			rawEditor.setOption("theme", 'tomorrow-night-bright');
		}
	} else {
		// Leave breadcrumb
		if (bugsenseInitialized) {
			Bugsense.leaveBreadcrumb("Night mode deactivated");
		}
		
		html.classList.remove('night');
		themeColor.setAttribute('content', dayTheme);
		if (editorMessageProxy) {
			editorMessageProxy.postMessage({
				command: "night",
				nightMode: false
			});
		}
		if (rawEditor instanceof CodeMirror) {
			rawEditor.setOption("theme", 'default');
		}
	}
	updatePreviewNightModes(document.querySelectorAll('[data-type="list"] li.fileListItem .fileItemDescription iframe'));
	
	// Notify app
	window.dispatchEvent(nightChangeEvent);	
}
