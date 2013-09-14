/*
* Settings
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Namespace Container
------------------------*/ 
firetext.settings = {};


/* Settings
------------------------*/ 
firetext.settings.init = function () {
  // Select elements
  var autosaveEnabled = document.querySelector('#autosave-enabled-switch');
  var autoloadEnabled = document.querySelector('#autoload-enabled-switch');
  var autozenEnabled = document.querySelector('#autozen-enabled-switch');
  var nightmodeSelect = document.querySelector('#nightmode-select');
  var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
  var gdriveEnabled = document.querySelector('#gdrive-enabled-switch');

  // Autosave
  if (firetext.settings.get('autosave') != 'false') {
    autosaveEnabled.setAttribute('checked', '');
  } else {  
    autosaveEnabled.removeAttribute('checked');
  }
  autosaveEnabled.onchange = function () {
    firetext.settings.save('autosave', this.checked);
    if (firetext.settings.get('autosave') != 'false') {
      document.getElementById('editorSaveButton').style.display = 'none';
      document.getElementById('zenSaveButton').style.display = 'none';
    } else {
      document.getElementById('editorSaveButton').style.display = 'inline-block';
      document.getElementById('zenSaveButton').style.display = 'inline-block';
    }
  }

  // Autoload
  if (firetext.settings.get('autoload') == 'true') {
    autoloadEnabled.setAttribute('checked', '');
  } else {  
    autoloadEnabled.removeAttribute('checked');
  }
  autoloadEnabled.onchange = function () {
    firetext.settings.save('autoload', this.checked);
  }

  // Autozen
  if (firetext.settings.get('autozen') == 'true') {
    autozenEnabled.setAttribute('checked', '');
  } else {  
    autozenEnabled.removeAttribute('checked');
  }
  autozenEnabled.onchange = function () {
    firetext.settings.save('autozen', this.checked);
  }

  // Night Mode
  if (firetext.settings.get('nightmode') == 'true') {
    nightmodeSelect.value = 'Always On';
  } else if (firetext.settings.get('nightmode') == 'false') { 
    nightmodeSelect.value = 'Always Off';
  } else {
    nightmodeSelect.value = 'Auto';  
  }
  nightmodeSelect.addEventListener('change', function () {
    // Convert
    var convertedNightValue;
    if (nightmodeSelect.value == 'Always On') {
      convertedNightValue = 'true';
    } else if (nightmodeSelect.value == 'Always Off') { 
      convertedNightValue = 'false';
    } else {
      convertedNightValue = 'auto';
    }  

    // Save
    firetext.settings.save('nightmode', convertedNightValue);

    // Update
    night();
  });

  // Dropbox
  if (firetext.settings.get('dropbox.enabled') == 'true') {
    dropboxEnabled.setAttribute('checked', '');
  } else {  
    dropboxEnabled.removeAttribute('checked');
  }
  dropboxEnabled.onchange = function () {
    firetext.settings.save('dropbox.enabled', this.checked);
    cloud.init();
  }

  // Google Drive
  if (firetext.settings.get('gdrive.enabled') == 'true') {
    gdriveEnabled.setAttribute('checked', '');
  } else {  
    gdriveEnabled.removeAttribute('checked');
  }
  gdriveEnabled.onchange = function () {
    firetext.settings.save('gdrive.enabled', this.checked);
    cloud.init();
  }
};

firetext.settings.get = function (name) {
  name = ("firetext.settings."+name);
  return localStorage.getItem(name);
};

firetext.settings.save = function (name, value) {
  name = ("firetext.settings."+name);
  localStorage.setItem(name, value);
};
