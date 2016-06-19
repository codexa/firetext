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
		// In Firefox <48, we use moznomarginboxes to remove headers and footers.
		// In Firefox 48, that attribute was removed, however, with @page { margin: 0 },
		// the headers and footers are not rendered. However, we also (obviously) lose
		// page margins. body { margin: 20mm } only adds margin to the first and last
		// pages. However, in Firefox, table headers and footers are rendered on every
		// page, so we wrap the page in a table and use those to add margin.
		// In Chrome, this behavior doesn't exist, so we only do it in Firefox.
		// Luckily, in Chrome, it's pretty easy for the user to remove page headers and
		// footers from the UI.
		var firefox = navigator.userAgent.indexOf('Firefox') !== -1;
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
							'	html {',
							'		width: var(--width);',
							'		max-width: none !important; /* Older documents have style="max-width: 690px" */',
							'		overflow-x: hidden;',
							'	}',
							'	body {',
							'		padding: var(--margin);',
							'		margin: 0;',
							'		word-wrap: break-word;',
							'		overflow-x: hidden;',
							'	}',
							'	#firetext_print_notice {',
							'		border: 2px solid;',
							'		font-size: xx-large;',
							'		margin: 20px;',
							'		padding: 20px;',
							'		border-radius: 8px;',
							'		font-family: sans-serif;',
							'	}',
							'	@media print {',
							'		html {',
							'			width: calc(var(--width) - 2 * var(--margin));',
							'		}',
							'		body {',
							'			padding: 0;',
							'		}',
							'		#firetext_print_notice {',
							'			display: none;',
							'		}',
						(firefox ? [
							'		@page {',
							'			margin: 0 ' + e.data.content.match(/--margin:([^;]*)/)[1] + ';',
							'		}',
							'		.firetext_page_margin {',
							'			height: var(--margin);',
							'		}',
						] : [
							'		@page {',
							'			margin: ' + e.data.content.match(/--margin:([^;]*)/)[1] + ';',
							'		}',
						]).join('\n'),
							'	}',
							'	</style>',
							'</head>',
						].join('\n'))
						.replace('<body>', firefox ? [
							'<body>',
							'<table style="border-collapse: collapse; table-layout: fixed; width: 100%;">',
							'	<thead>',
							'		<tr class="firetext_page_margin"><td></td></tr>',
							'	</thead>',
							'	<tbody>',
							'		<tr>',
							'			<td style="padding: 0">',
						].join('\n') : '$&')
						.replace('</body>', firefox ? [
							'',
							'			</td>',
							'		</tr>',
							'	</tbody>',
							'	<tfoot>',
							'		<tr class="firetext_page_margin"><td></td></tr>',
							'	</tfoot>',
							'</table>',
							'</body>',
						].join('\n') : '$&')
						.replace('</body>', [
							"",
							"<script>",
							"window.addEventListener('load', function() {",
							"	var t0 = Date.now();",
							"	setTimeout(function() {",
							"		if(Date.now() - t0 < 200) {",
							"			// The browser doesn't support window.print() (or window.print() is non-blocking).",
							"			// So we ask the user that, if the browser supports printing, they print manually.",
							"			var notice = document.createElement('div');",
							"			notice.id = 'firetext_print_notice';",
							"			notice.textContent = " + JSON.stringify(e.data['automatic-printing-failed']) + ";",
							"			document.body.insertBefore(notice, document.body.firstChild);",
							"		} else if(",
							"			navigator.userAgent.indexOf('Chrome') !== -1 &&",
							"				// In both Firefox and IE the window.print() dialog is less featureful than menu -> print,",
							"				// (preview and page settings,) so we allow the user to select the latter if they want.",
							"			navigator.userAgent.indexOf('Android') === -1",
							"				// Chrome Android returns from printing before it's done and crashes if we window.close().",
							"				// Also match Android tablet and WebView Android because they're probably the same.",
							"		) {",
							"			window.close();",
							"		}",
							"	});",
							"	try {",
							"		window.print();",
							"	} catch(e) {}",
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