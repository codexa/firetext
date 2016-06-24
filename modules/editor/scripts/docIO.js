/*
* Document I/O
* Copyright (C) Codexa Organization 2013.
*/

'use strict'

function initDocIO(document, messageProxy, loadCallback) {
	/* 0.4
	var docxeditor;
	*/
	var odtdoc;
	var filename;
	var filetype;
	
	// Unsupported odt features flag
	var readOnly;

	function getHTML() {
		/*** This function is duplicated in contentscript.js ***/
		var doctype = document.doctype;
		var doctypeString = doctype ? '<!DOCTYPE '
			+ doctype.name
			+ (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '')
			+ (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') 
			+ (doctype.systemId ? ' "' + doctype.systemId + '"' : '')
			+ '>' : '';
		return doctypeString + document.documentElement.outerHTML.replace(/<(style|link)[^>]*_firetext_remove=""[^>]*>[^<>]*(?:<\/\1>)?/g, '').replace(' _firetext_night=""', '').replace(' _firetext_print_view=""', '');
	}
	/* Function to get HTML for saving and printing */
	function getRichHTML() {
		// In Firefox <48, we use moznomarginboxes to remove headers and footers.
		// In Firefox 48, that attribute was removed, however, with @page { margin: 0 },
		// the headers and footers are not rendered. However, we also (obviously) lose
		// page margins. body { margin: 20mm } only adds margin to the first and last
		// pages. However, in Firefox, table headers and footers are rendered on every
		// page, so we wrap the page in a table and use those to add margin.
		// In Chrome, this behavior doesn't exist, so we only do it in Firefox.
		// Luckily, in Chrome, it's pretty easy for the user to remove page headers and
		// footers from the UI.
		var html = getHTML();
		html = html
			.replace('<html', '<html moznomarginboxes')
			.replace('</head>', [
				'',
				'	<!--_firetext_import_remove_start-->',
				'	<title>' + filename.replace(/</g, '&lt;') + '</title>',
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
				'	@media screen {',
				'		html {',
				'			padding: 65px;',
				'			background-color: #efefef;',
				'		}',
				'		body {',
				'			border: 1px solid #ddd;',
				'			margin: -1px;',
				'			box-shadow: 0 0 5px #ddd;',
				'			background-color: #ffffff;',
				'		}',
				'	}',
				'	@media print {',
				'		html {',
				'			width: calc(var(--width) - 2 * var(--margin));',
				'		}',
				'		body {',
				'			padding: 0;',
				'		}',
				'		@page {',
				'			size: ' + html.match(/--width:([^;]*)/)[1] + ' ' + html.match(/--height:([^;]*)/)[1] + ';',
				'			margin: ' + html.match(/--margin:([^;]*)/)[1] + ';',
				'		}',
				'		@supports (-moz-appearance: none) { /* Firefox */',
				'			@page {',
				'				margin: 0 ' + html.match(/--margin:([^;]*)/)[1] + ';',
				'			}',
				'			.firetext_page_margin {',
				'				height: var(--margin);',
				'			}',
				'		}',
				'	}',
				'	</style>',
				'	<!--_firetext_import_remove_end-->',
				'</head>',
			].join('\n'))
			.replace('<body>', [
				'<body>',
				'<!--_firetext_import_remove_start-->',
				'<table style="border-collapse: collapse; table-layout: fixed; width: 100%;">',
				'	<thead>',
				'		<tr class="firetext_page_margin"><td style="padding: 0;"></td></tr>',
				'	</thead>',
				'	<tbody>',
				'		<tr>',
				'			<td style="padding: 0;">',
				'			<!--_firetext_import_remove_end-->',
			].join('\n'))
			.replace('</body>', [
				'',
				'			<!--_firetext_import_remove_start-->',
				'			</td>',
				'		</tr>',
				'	</tbody>',
				'	<tfoot>',
				'		<tr class="firetext_page_margin"><td style="padding: 0;"></td></tr>',
				'	</tfoot>',
				'</table>',
				'<!--_firetext_import_remove_end-->',
				'</body>',
			].join('\n'));
		if(!/<meta[^>]+charset/.test(html)) html = html.replace('<head>', '<head><meta charset="utf-8">'); // Default to utf-8
		return html;
	}
	function getText() {
		var textValue;
		if (!('innerText' in document.documentElement)) {
			textValue = innerText(document.documentElement)
		} else {
			textValue = document.documentElement.innerText;
		}
		return textValue;
	}

	function load(content, _filename, _filetype, user_location) {
		// Check for night
		var wasNight = false
		if (document.documentElement.hasAttribute('_firetext_night')) {
			wasNight = true;
		}
		
		filename = _filename;
		filetype = _filetype;
		readOnly = false;
		document.open();
		switch (filetype) {
			case ".txt":
				content = firetext.parsers.plain.parse(content, "HTML");
				document.write(content);
				break;
			case ".odt":
				odtdoc = new ODTDocument(content);
				var html = odtdoc.getHTMLUnsafe();
				try {
					html = odtdoc.getHTML();
				} catch(e) {
					readOnly = true;
				}
				document.write(html);
				break;
			/* 0.4
			case ".docx":
				docxeditor = new firetext.parsers.DocxEditor(content);
				content = result.HTMLout();
				doc.appendChild(content);
				break;
			*/
			case ".html":
			default:
				content = content.replace(/<!--_firetext_import_remove_start-->[\s\S]*?<!--_firetext_import_remove_end-->/g, '');
				if(!/<!DOCTYPE/i.test(content)) content = '<!DOCTYPE html>' + content;
				document.write(content);
				break;
		}
		document.close();
		
		if (wasNight) {
			nightEditor(true);
		}
		
		loadCallback(filetype, user_location, odtdoc, readOnly);
	}

	messageProxy.registerMessageHandler(function(e) {
		var content;
		var type;
		var binary = false;
		switch (filetype) {
			case ".html":
				content = (e.data.rich ? getRichHTML : getHTML)();
				type = "text\/html";
				break;
			case ".txt":
				content = getText();
				type = "text\/plain";
				break;
			case ".odt":
				if(!readOnly) odtdoc.setHTML(getHTML());
				content = odtdoc.getODT({type: 'string'});
				type = "application\/vnd.oasis.opendocument.text";
				binary = true;
				break;
			/* 0.4
			case ".docx":
				content = docxeditor.generate("uint8array");
				application/vnd.openxmlformats-officedocument.wordprocessingml.document
				break;
			*/
			default:
				content = getText();
				break;
		}
		
		messageProxy.postMessage({
			command: e.data.key,
			content: binary ? btoa(content) : new StringView(content).toBase64(),
			type: type
		});
	}, "get-content-blob");

	messageProxy.registerMessageHandler(function(e) {
		messageProxy.postMessage({
			command: e.data.key,
			content: (e.data.rich ? getRichHTML : getHTML)()
		});
	}, "get-content-html");

	messageProxy.registerMessageHandler(function(e) {
		load(e.data.content, e.data.filename, e.data.filetype, e.data.user_location);
		if(e.data.key) {
			messageProxy.postMessage({
				command: e.data.key
			});
		}
	}, "load");

	messageProxy.registerMessageHandler(function(e) {
		var commands = e.data.commands
		var commandStates = {};
		for(var i = 0; i < commands.length; i++) {
			commandStates[commands[i]] = {};
			commandStates[commands[i]].state = document.queryCommandState(commands[i]);
			commandStates[commands[i]].value = document.queryCommandValue(commands[i]);
		}
		messageProxy.postMessage({
			command: e.data.key,
			commandStates: commandStates
		})
	}, "query-command-states");

	messageProxy.registerMessageHandler(function(e) {
		var propertyValues = {};
		e.data.properties.forEach(function(property) {
			propertyValues[property] = document.documentElement.style.getPropertyValue('--' + property).replace(/\s+/g, '');
		});
		messageProxy.postMessage({
			command: e.data.key,
			propertyValues: propertyValues
		})
	}, "get-properties");

	messageProxy.registerMessageHandler(function(e) {
		Object.keys(e.data.properties).forEach(function(property) {
			document.documentElement.style.setProperty('--' + property, e.data.properties[property]);
		});
		printViewOnInput();
		printViewOnResize();
	}, "set-properties");
}
