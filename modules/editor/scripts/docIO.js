/*
* Document I/O
* Copyright (C) Codexa Organization 2013.
*/

'use strict'

function initDocIO(doc, messageProxy) {
	/* 0.4
	var docxeditor;
	*/
	var filetype;

	function watchDocument(filetype) {
		// Add listener to update raw
		doc.addEventListener('input', function() {
			messageProxy.getPort().postMessage({
				command: "doc-changed",
				html: doc.innerHTML,
				filetype: filetype
			});
		});
	}

	function load(content, ft) {
		filetype = ft;
		doc.innerHTML = '';
		switch (filetype) {
			case ".txt":
				content = firetext.parsers.plain.parse(content, "HTML");
				doc.innerHTML = content;
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
				doc.innerHTML = content;
				break;
		}
		watchDocument(filetype);
	}

	messageProxy.registerMessageHandler(function(e) {
		var content;
		var type;
		switch (filetype) {
			case ".html":
				content = doc.innerHTML;
				type = "text\/html";
				break;
			case ".txt":
				content = firetext.parsers.plain.encode(doc.innerHTML, "HTML");
				type = "text\/plain";
				break;
			/* 0.4
			case ".docx":
				content = docxeditor.generate("uint8array");
				application/vnd.openxmlformats-officedocument.wordprocessingml.document
				break;
			*/
			default:
				content = doc.textContent;
				break;
		}
		
		var contentView = new StringView(content);
		messageProxy.getPort().postMessage({
			command: e.data.key,
			content: contentView.toBase64(),
			type: type
		});
	}, "get-content-blob");

	messageProxy.registerMessageHandler(function(e) {
		load(e.data.content, e.data.filetype);
		if(e.data.key) {
			messageProxy.getPort().postMessage({
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
		messageProxy.getPort().postMessage({
			command: e.data.key,
			commandStates: commandStates
		})
	}, "query-command-states");
}