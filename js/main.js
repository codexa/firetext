/*
* RequireJS Configuration
* Copyright (C) Codexa Organization 2013.
*/

'use strict';

requirejs.config({
	baseUrl: "resources",
	paths: {
		"app": "../js",
		"module": "../js/modules",
		"google-code-prettify": "gcprettify/prettify"
	},
	shim: {
		"gcprettify/lang-css": ["google-code-prettify"],
		"gcprettify/lang-wiki": ["google-code-prettify"]
	}
});

define(["app/firetext"], function (firetext) {
	
})