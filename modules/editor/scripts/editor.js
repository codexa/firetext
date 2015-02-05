/*
* Editor Communication Proxy
* Copyright (C) Codexa Organization 2013.
*/

'use strict'

// Closure to isolate code from tampering by scripts in document
var mainClosure = function() {
	function updatePaddingBottom() {
		if(doc.innerHTML === '' || doc.innerHTML === ' ') {
			doc.innerHTML = '<br>';
		}
		var paddingBottom = Math.max(65, window.innerHeight - (doc.offsetHeight - parseInt(doc.style.paddingBottom, 10)));
		doc.style.paddingBottom = paddingBottom + 'px';
		doc.style.marginBottom = -paddingBottom + 'px';
	}
	
	// document to be edited
	var doc;
	
	// WARNING: DO NOT REPLACE, THIS STRING IS REPLACED WITH THE ORIGIN AUTOMATICALLY WHEN LOADED FROM editorProxy.js
	var mainOrigin = "[ORIGIN_OF_MAIN_DOCUMENT]";
	
	// Overide popups
	window.alert = null;
	window.confirm = null;
	window.prompt = null;
	
	// Proxy for communication with parent page
	var parentMessageProxy;

	window.addEventListener("message", function(e){
		if(e.origin !== mainOrigin) {
			throw new Error("origin did not match");
		}
		if(e.data.command === "init" && e.ports.length) {
			// Initialize Designer
			doc = document.createElement('DIV');
			doc.setAttribute('contentEditable', 'true');
			doc.id = 'tempEditDiv';
			document.body.appendChild(doc);
			//doc = document.getElementById('tempEditDiv');
			document.execCommand('enableObjectResizing', false, 'true');

			// register port
			parentMessageProxy = new MessageProxy(e.ports[0]);
			
			// Hide and show toolbar.
			// For reviewers, just in case this looks like a security problem:
			// This frame is sandboxed, so I had to add the listeners to do this.
			// The content CANNOT call any of the parents functions, so this is not a security issue.
			doc.addEventListener('focus', function (event) {
				parentMessageProxy.getPort().postMessage({
					command: "focus",
					focus: true
				});
			});
			doc.addEventListener('blur', function (event) {
				parentMessageProxy.getPort().postMessage({
					command: "focus",
					focus: false
				});
			});

			// Keyboard shortcuts
			doc.addEventListener('keypress', function (event) {
				if((event.ctrlKey || event.metaKey) && !event.shiftKey) {
					if(event.which === 98) { // b
						document.execCommand('bold');
					} else if(event.which === 105) { // i
						document.execCommand('italic');
					} else if(event.which === 117) { // u
						document.execCommand('underline');
					} else {
						return;
					}
					event.preventDefault();
				}
			});
			
			// Update padding-bottom
			doc.addEventListener('input', updatePaddingBottom);
			window.addEventListener('resize', updatePaddingBottom);

			// initialize modules/register handlers
			// night mode
			initNight(parentMessageProxy);
			// editor I/O
			initDocIO(doc, parentMessageProxy, function loadCallback() {
				updatePaddingBottom();
			});
			// format document
			parentMessageProxy.registerMessageHandler(function(e) { document.execCommand(e.data.sCmd, false, e.data.sValue); }, "format")

			parentMessageProxy.getPort().start();
			// success
			parentMessageProxy.getPort().postMessage({command: "init-success"});
		}
	}, false);
}
mainClosure();
mainClosure = undefined;
