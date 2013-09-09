/*
* Settings
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* RequireJS
------------------------*/
define(function (require) {

var firetext = require('firetext');


/* Settings
------------------------*/ 
function init() {
  // Select elements
  var autosaveEnabled = document.querySelector('#autosave-enabled-switch');
  var autoloadEnabled = document.querySelector('#autoload-enabled-switch');
  var autozenEnabled = document.querySelector('#autozen-enabled-switch');
  var nightmodeSelect = document.querySelector('#nightmode-select');
  var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
  var gdriveEnabled = document.querySelector('#gdrive-enabled-switch');

  // Autosave
  if (get('autosave') != 'false') {
    autosaveEnabled.setAttribute('checked', '');
  } else {  
    autosaveEnabled.removeAttribute('checked');
  }
  autosaveEnabled.onchange = function toggleAutosave() {
    save('autosave', this.checked);
    if (get('autosave') != 'false') {
      document.getElementById('editorSaveButton').style.display = 'none';
      document.getElementById('zenSaveButton').style.display = 'none';
    } else {
      document.getElementById('editorSaveButton').style.display = 'inline-block';
      document.getElementById('zenSaveButton').style.display = 'inline-block';
    }
  }

  // Autoload
  if (get('autoload') == 'true') {
    autoloadEnabled.setAttribute('checked', '');
  } else {  
    autoloadEnabled.removeAttribute('checked');
  }
  autoloadEnabled.onchange = function () {
    save('autoload', this.checked);
  }

  // Autozen
  if (get == 'true') {
    autozenEnabled.setAttribute('checked', '');
  } else {  
    autozenEnabled.removeAttribute('checked');
  }
  autozenEnabled.onchange = function () {
    save('autozen', this.checked);
  }

  // Night Mode
  if (get == 'true') {
    nightmodeSelect.value = 'Always On';
  } else if (get == 'false') { 
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
    save('nightmode', convertedNightValue);

    // Update
    firetext.night();
  });

  // Dropbox
  if (get == 'true') {
    dropboxEnabled.setAttribute('checked', '');
  } else {  
    dropboxEnabled.removeAttribute('checked');
  }
  dropboxEnabled.onchange = function () {
    save('dropbox.enabled', this.checked);
    firetext.initSharing();
  }

  // Google Drive
  if (get == 'true') {
    gdriveEnabled.setAttribute('checked', '');
  } else {  
    gdriveEnabled.removeAttribute('checked');
  }
  gdriveEnabled.onchange = function () {
    save('gdrive.enabled', this.checked);
    firetext.initSharing();
  }
}

function get(name) {
  name = ("firetext.settings."+name);
  return localStorage.getItem(name);
}

function save(name, value) {
  name = ("firetext.settings."+name);
  localStorage.setItem(name, value);
}

});
