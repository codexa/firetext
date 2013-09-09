/*
* RequireJS Configuration
* Copyright (C) Codexa Organization 2013.
*/

'use strict';

requirejs.config({
	baseUrl: 'scripts',
	paths: {
		'google-code-prettify': 'lib/prettify'
	},
	shim: {
		'gcprettify/lang-css': ['google-code-prettify'],
		'gcprettify/lang-wiki': ['google-code-prettify']
	}
});

requirejs(['firetext']);
