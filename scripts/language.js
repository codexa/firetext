/*
* Language.js
* Localization handler
* Copyright (C) Codexa Organization.
*/

'use strict';

firetext.language = function(code){
	if (code) {
		var codes;
		if (code === 'auto') {
			codes = navigator.languages || [navigator.language];
		} else {
			codes = [code];
		}
		
		// Localize interface
		navigator.mozL10n.ctx.requestLocales.apply(navigator.mozL10n.ctx, codes);
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
