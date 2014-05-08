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
		firetext.settings.save('language', document.webL10n.getLanguage());		 
	} 
	
	// Localize interface
	var language = firetext.language.getCurrent();
	document.webL10n.setLanguage(language);
	document.body.setAttribute('data-language', language);
	
	// LTR / RTL
	if (firetext.language.getDirection() == 'rtl') {
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

firetext.language.getDirection = function () {
	var language = firetext.language.getCurrent();
	if (language == 'he' |
			language == 'ar') {
		return 'rtl';			
	} else {
		return 'ltr';
	}
}
