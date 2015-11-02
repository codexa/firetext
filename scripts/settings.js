/*
* Settings
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Namespace Container
------------------------*/ 
firetext.settings = {};


/* Settings
------------------------*/ 
firetext.settings.init = function () {
	// Select elements
	var autoloadEnabled = document.querySelector('#autoload-enabled-switch');
	var autosaveEnabled = document.querySelector('#autosave-enabled-switch');
	var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
	var languageSelect = document.querySelector('#language-select');
	var nightmodeSelect = document.querySelector('#nightmode-select');
	var previewsSelect = document.querySelector('#previews-select');
	var statsEnabled = document.querySelector('#stats-enabled-switch');

	// Autoload
	if (firetext.settings.get('autoload') == 'true') {
		autoloadEnabled.setAttribute('checked', '');
	} else {	
		autoloadEnabled.removeAttribute('checked');
		if (!firetext.settings.get('autoload')) {
			firetext.settings.save('autoload', 'false');
		}
	}
	autoloadEnabled.onchange = function () {
		firetext.settings.save('autoload', this.checked);
	}

	// Autosave
	if (firetext.settings.get('autosave') != 'false') {
		autosaveEnabled.setAttribute('checked', '');
		if (firetext.settings.get('autosave') != 'true') {
			firetext.settings.save('autosave', 'true');
		}
	} else {	
		autosaveEnabled.removeAttribute('checked');
	}
	autosaveEnabled.onchange = function () {
		firetext.settings.save('autosave', this.checked);
		if (firetext.settings.get('autosave') != 'false') {
			document.getElementById('editorSaveButton').style.display = 'none';
		} else {
			document.getElementById('editorSaveButton').style.display = 'inline-block';
		}
	}

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

	// Language
	if (!firetext.settings.get('language')) {
		firetext.settings.save('language', 'auto');		 
	}
	languageSelect.value = firetext.settings.get('language');
	languageSelect.addEventListener('change', function () {
		// Save
		firetext.settings.save('language', languageSelect.value);

		// Update
		firetext.language(languageSelect.value);
	});

	// Night Mode
	if (firetext.settings.get('nightmode') == 'true') {
		nightmodeSelect.value = '1';
	} else if (firetext.settings.get('nightmode') == 'false') { 
		nightmodeSelect.value = '0';
	} else {
		nightmodeSelect.value = '2';
		if (firetext.settings.get('nightmode') != 'auto') {
			firetext.settings.save('nightmode', 'auto');
			night();
		} 
	}
	nightmodeSelect.addEventListener('change', function () {
		// Convert
		var convertedNightValue;
		if (nightmodeSelect.value == '1') {
			convertedNightValue = 'true';
		} else if (nightmodeSelect.value == '0') { 
			convertedNightValue = 'false';
		} else {
			convertedNightValue = 'auto';
		}	 

		// Save
		firetext.settings.save('nightmode', convertedNightValue);

		// Update
		night();
	});

	// Previews
	if (firetext.settings.get('previews.enabled') == 'always') {
		previewsSelect.value = '1';
	} else if (firetext.settings.get('previews.enabled') == 'never' || firetext.settings.get('previews.enabled') == 'false') {
		previewsSelect.value = '0';
		if (firetext.settings.get('previews.enabled') != 'never') {
			firetext.settings.save('previews.enabled', 'never');
		}
	} else { // true, auto
		previewsSelect.value = '2';
		if (firetext.settings.get('previews.enabled') != 'auto') {
			firetext.settings.save('previews.enabled', 'auto');
		}
	}
	updatePreviewsEnabled();
	previewsSelect.addEventListener('change', function () {
		// Convert
		var convertedPreviewsValue;
		if (previewsSelect.value == '1') {
			convertedPreviewsValue = 'always';
		} else if (previewsSelect.value == '0') { 
			convertedPreviewsValue = 'never';
		} else {
			convertedPreviewsValue = 'auto';
		}	 

		// Save
		firetext.settings.save('previews.enabled', convertedPreviewsValue);

		// Update
		updatePreviewsEnabled();
	});

	// Stats
	if (firetext.settings.get('stats.enabled') != 'false') {
		statsEnabled.setAttribute('checked', '');
		if (firetext.settings.get('stats.enabled') != 'true') {
			firetext.settings.save('stats.enabled', 'true');
		}
	} else {
		statsEnabled.removeAttribute('checked');
	}
	statsEnabled.onchange = function () {
		firetext.settings.save('stats.enabled', this.checked);
		if (!this.checked) {
			var r = confirm(navigator.mozL10n.get('needs-restart'));
			if (r) {
				window.location.reload();
			}
		} else {
			bugsenseInit();
		}
	}
};

firetext.settings.get = function (name) {
	name = ("firetext.settings."+name);
	return localStorage.getItem(name);
};

firetext.settings.save = function (name, value) {
	if (bugsenseInitialized) {
		Bugsense.leaveBreadcrumb("Setting: "+name+" set to: "+value);
	}
	name = ("firetext.settings."+name);
	localStorage.setItem(name, value);
};
