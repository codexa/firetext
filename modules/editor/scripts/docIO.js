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
		return doctypeString + document.documentElement.outerHTML.replace(/<(style|link)[^>]*_firetext_remove=""[^>]*>[^<>]*(?:<\/\1>)?/g, '').replace(' _firetext_night=""', '');
	}
	function getText() {
		return document.documentElement.textContent;
	}

	function load(content, ft) {
		// Check for night
		var wasNight = false
		if (document.documentElement.hasAttribute('_firetext_night')) {
			wasNight = true;
		}
		
		filetype = ft;
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
				if(!/<!DOCTYPE/i.test(content)) content = '<!DOCTYPE html>' + content;
				document.write(content);
				break;
		}
		document.close();
		
		if (wasNight) {
			nightEditor(true);
		}
		
		loadCallback(filetype, odtdoc, readOnly);
	}

	messageProxy.registerMessageHandler(function(e) {
		var content;
		var type;
		var binary = false;
		switch (filetype) {
			case ".html":
				content = getHTML();
				if(!/<meta[^>]+charset/.test(content)) content = content.replace('</head>', '<meta charset="utf-8"></head>');
				type = "text\/html";
				break;
			case ".txt":
				content = firetext.parsers.plain.encode(getHTML(), "HTML");
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
			content: getHTML()
		});
	}, "get-content-html");

	messageProxy.registerMessageHandler(function(e) {
		load(e.data.content, e.data.filetype);
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
}
