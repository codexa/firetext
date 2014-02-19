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
  var language = firetext.settings.get('language');
  document.webL10n.setLanguage(language);
  document.body.setAttribute('language', language);
}

firetext.language.getCurrent = function () {
  return (firetext.settings.get('language'));
}
