window.addEventListener('DOMContentLoaded', function() {
	// Proxy for communication with parent page
	var parentMessageProxy = new MessageProxy();
	parentMessageProxy.setSend(parent);
	parentMessageProxy.setRecv(window);
	
	window.addEventListener('click', function() {
		var win = window.open(URL.createObjectURL(new Blob([
			"<script>",
			"window.addEventListener('message', function(evt) {",
			"	document.open('text/html', 'replace');",
			"	document.write(evt.data.content);",
			"	document.close();",
			"});",
			"</script>",
		], {type: 'text/html'})));
		var key = parentMessageProxy.registerMessageHandler(function(e){
			win.postMessage({
				content: 
					e.data.content
						.replace('<html', '<html moznomarginboxes')
						.replace('</head>', [
							'',
							'	<meta charset="utf-8">', // Default to utf-8
							'	<title>' + e.data.filename.replace(/</g, '&lt;') + e.data.filetype + '</title>',
							'	<style>',
							'	#firetext_print_notice {',
							'		border: 2px solid;',
							'		font-size: xx-large;',
							'		margin: 20px;',
							'		padding: 20px;',
							'		border-radius: 8px;',
							'		font-family: sans-serif;',
							'	}',
							'	@media print {',
							'		#firetext_print_notice {',
							'			display: none;',
							'		}',
							'	}',
							'	</style>',
							'</head>',
						].join('\n'))
						.replace('</body>', [
							"",
							"<script>",
							"window.addEventListener('load', function() {",
							"	var onAfterPrint = function(mql) {",
							"		if(!mql.matches) {",
							"			window.close();",
							"		}",
							"	};",
							"	var mql = window.matchMedia('print');",
							"	if(",
							"		navigator.userAgent.indexOf('Chrome') !== -1 &&",
							"			// In both Firefox and IE the window.print() dialog is less featureful than menu -> print,",
							"			// (preview and page settings,) so we allow the user to select the latter if they want.",
							"			// Also, they don't support the following (they have onafterprint), but they might in the future.",
							"		navigator.userAgent.indexOf('Android') === -1",
							"			// Chrome Android returns from printing before it's done and crashes if we window.close().",
							"			// Also match Android tablet and WebView Android because they're probably the same.",
							"	) {",
							"		mql.addListener(onAfterPrint);",
							"	}",
							"	var onAutoPrintUnsupported = function() {",
							"		// The browser doesn't support window.print() (or window.print() is non-blocking).",
							"		// So we ask the user that, if the browser supports printing, they print manually.",
							"		var notice = document.createElement('div');",
							"		notice.id = 'firetext_print_notice';",
							"		notice.textContent = " + JSON.stringify(e.data['automatic-printing-failed']) + ";",
							"		document.body.insertBefore(notice, document.body.firstChild);",
							"		mql.removeListener(onAfterPrint);",
							"		onAutoPrintUnsupported = function() {};",
							"	};",
							"	var t0 = Date.now();",
							"	setTimeout(function() {",
							"		if(Date.now() - t0 < 200) {",
							"			onAutoPrintUnsupported();",
							"		}",
							"	});",
							"	try {",
							"		window.print();",
							"	} catch(e) {",
							"		onAutoPrintUnsupported();",
							"	}",
							"});",
							"</script>",
							"</body>",
						].join('\n'))
			}, '*');
		}, null, true);
		parentMessageProxy.postMessage({
			command: "print-button-pressed",
			key: key
		});
	});
});