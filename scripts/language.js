/*
* Language.js
* Localization handler
* Copyright (C) Codexa Organization.
*/

'use strict';

firetext.language = function(code){
	if (code) {
		// Catch for 'auto' case
		if (code === 'auto') {
			code = navigator.language;
		}
		
		// Localize interface
		if (code !== navigator.mozL10n.language.code) {
			navigator.mozL10n.language.code = code;
		}
	} else {
		return navigator.mozL10n.language.code;
	}
};

// Lock language (can be removed when Bug 1036696 is fixed)
window.addEventListener('languagechange', function() {
	navigator.mozL10n.ready(function () {
		firetext.language(firetext.settings.get('language'));
	});
});
