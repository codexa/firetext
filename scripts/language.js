/*
* Language.js
* Localization handler
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Variables
------------------------*/
firetext.language = function () { return this.getCurrent(); }; 


/* Init
------------------------*/ 
firetext.language.init = function () {
	if (!firetext.settings.get('language')) {
		firetext.settings.save('language', navigator.mozL10n.language.code);		 
	} 
	
	// Localize interface
	var language = firetext.language.getCurrent();
	navigator.mozL10n.language.code = language;
	document.body.setAttribute('data-language', language);
	
	// LTR / RTL
	if (navigator.mozL10n.language.direction == 'rtl') {
		document.body.classList.remove('ltr');  
		document.body.classList.add('rtl');
	} else {
		document.body.classList.remove('rtl');  
		document.body.classList.add('ltr'); 
	}
}

firetext.language.getCurrent = function () {
	return (firetext.settings.get('language'));
}
