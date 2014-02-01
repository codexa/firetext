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
    firetext.settings.save('language', 'en-US');    
  } 
  document.webL10n.setLanguage(firetext.settings.get('language'));
}

firetext.language.getCurrent = function () {
  return (firetext.settings.get('language'));
}
