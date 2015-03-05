/*
* Editor Communication Proxy
* Copyright (C) Codexa Organization 2013.
*/

'use strict'

// Closure to isolate code from tampering by scripts in document
var mainClosure = function() {
	// document to be edited
	var doc;
	
	// Overide popups
	window.alert = null;
	window.confirm = null;
	window.prompt = null;
	
	// Proxy for communication with parent page
	var parentMessageProxy = new MessageProxy();
	parentMessageProxy.setSend(parent);
	parentMessageProxy.setRecv(window);

	parentMessageProxy.registerMessageHandler(function(e){
		// initialize modules/register handlers
		// night mode
		initNight(doc, parentMessageProxy);
		
		var content_styles = document.querySelectorAll('link[data-for-content]');
		
		var content_scripts = document.querySelectorAll('script[data-for-content]');
		
		initDocIO(document, parentMessageProxy, function loadCallback(filetype, odtdoc, readOnly) {
			window.mainOrigin = mainOrigin;
			window.parentMessageProxy = parentMessageProxy;
			window.initNight = initNight;
			window.filetype = filetype;
			window.odtdoc = odtdoc;
			window.readOnly = readOnly;
			
			// Content styles
			[].forEach.call(content_styles, function(content_style) {
				content_style = document.importNode(content_style, false);
				content_style.setAttribute('_firetext_remove', '');
				content_style.setAttribute('type', 'text/css');
				document.head.appendChild(content_style);
			});
			
			// Content scripts
			[].forEach.call(content_scripts, function(content_script) {
				content_script = document.importNode(content_script, false);
				content_script.setAttribute('_firetext_remove', '');
				content_script.setAttribute('type', 'text/javascript');
				content_script.async = false;
				document.body.appendChild(content_script);
			});
		});
		
		// success
		parentMessageProxy.postMessage({command: "init-success"});
	}, "init");
}
mainClosure();
mainClosure = undefined;
