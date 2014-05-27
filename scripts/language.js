/*
* Language.js
* Localization handler
* Copyright (C) Codexa Organization.
*/

'use strict';

firetext.language = function(code){
	if (code) {
		// Localize interface
		if (code !== navigator.mozL10n.language.code) {
			navigator.mozL10n.language.code = code;
		}
		document.body.setAttribute('data-language', code);

		// LTR / RTL
		if (navigator.mozL10n.language.direction == 'rtl') {
			document.body.classList.remove('ltr');  
			document.body.classList.add('rtl');
		} else {
			document.body.classList.remove('rtl');  
			document.body.classList.add('ltr'); 
		}		
	} else {
		return navigator.mozL10n.language.code;
	}
};
