/*
* Plain Text Parser
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Variables
------------------------*/
// Namespace
window.firetext = window.firetext || {};
firetext.parsers = firetext.parsers || {};
firetext.parsers.plain = {};


/* Parser
------------------------*/
firetext.parsers.plain.parse = function (data, type) {
	// Some code to convert TXT into something else
	var output = "";
	if (type == "HTML") {
		output = '<!DOCTYPE html>' + // Chrome html height
					data.replace(/</gi, '<pre><code>&lt;')
					 .replace(/>/gi, '&gt;</code></pre>')
					 .replace(/&amp;/gi, '&amp;amp;')
					 .replace(/\n/gi, '<br>');
		return output;
	}
	// Didn't parse, return false
	return false;
};

firetext.parsers.plain.encode = function (data, type) {
	// Some code to convert data to TXT
	var output = "";
	if (type == "HTML") {
		output = data.replace(/<br\/>/gi, '\n')
					 .replace(/<br>/gi, '\n');
		var tmp = document.createElement("DIV");
		tmp.innerHTML = output;
		return tmp.textContent;
	}
	// Didn't convert to TXT, return false
	return false;
};
