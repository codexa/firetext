define([], function() {
  /* Settings
  ------------------------*/ 

  var firetextSettings = {}

  firetextSettings.getSettings = function getSettings(name) {
    name = ("firetext.settings."+name);
    return localStorage.getItem(name);
  }

  firetextSettings.saveSettings = function saveSettings(name, value) {
    name = ("firetext.settings."+name);
    localStorage.setItem(name, value);
  }

  firetextSettings.settings = function settings() {
    // Select elements
    var autosaveEnabled = document.querySelector('#autosave-enabled-switch');
    var autoloadEnabled = document.querySelector('#autoload-enabled-switch');
    var autozenEnabled = document.querySelector('#autozen-enabled-switch');
    var nightmodeSelect = document.querySelector('#nightmode-select');
    var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
    var gdriveEnabled = document.querySelector('#gdrive-enabled-switch');
    
    // Autosave
    if (this.getSettings('autosave') != 'false') {
      autosaveEnabled.setAttribute('checked', '');
    } else {  
      autosaveEnabled.removeAttribute('checked');
    }
    autosaveEnabled.onchange = function toggleAutosave() {
      this.saveSettings('autosave', this.checked);
      if (this.getSettings('autosave') != 'false') {
        document.getElementById('editorSaveButton').style.display = 'none';
        document.getElementById('zenSaveButton').style.display = 'none';
      } else {
        document.getElementById('editorSaveButton').style.display = 'inline-block';
        document.getElementById('zenSaveButton').style.display = 'inline-block';
      }
    }
    
    // Autoload
    if (this.getSettings('autoload') == 'true') {
      autoloadEnabled.setAttribute('checked', '');
    } else {  
      autoloadEnabled.removeAttribute('checked');
    }
    autoloadEnabled.onchange = function () {
      this.saveSettings('autoload', this.checked);
    }
    
    // Autozen
    if (this.getSettings('autozen') == 'true') {
      autozenEnabled.setAttribute('checked', '');
    } else {  
      autozenEnabled.removeAttribute('checked');
    }
    autozenEnabled.onchange = function () {
      this.saveSettings('autozen', this.checked);
    }
    
    // Night Mode
    if (this.getSettings('nightmode') == 'true') {
      nightmodeSelect.value = 'Always On';
    } else if (this.getSettings('nightmode') == 'false') { 
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
      this.saveSettings('nightmode', convertedNightValue);
      
      // Update
      night();
    });
    
    // Dropbox
    if (this.getSettings('dropbox.enabled') == 'true') {
      dropboxEnabled.setAttribute('checked', '');
    } else {  
      dropboxEnabled.removeAttribute('checked');
    }
    dropboxEnabled.onchange = function () {
      this.saveSettings('dropbox.enabled', this.checked);
      initSharing();
    }
    
    // Google Drive
    if (this.getSettings('gdrive.enabled') == 'true') {
      gdriveEnabled.setAttribute('checked', '');
    } else {  
      gdriveEnabled.removeAttribute('checked');
    }
    gdriveEnabled.onchange = function () {
      this.saveSettings('gdrive.enabled', this.checked);
      initSharing();
    }
  }

  return firetextSettings;
});