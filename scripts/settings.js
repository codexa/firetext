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
var defaultSettings = {
	"autoload": "false",
	"autosave": "true",
	"autosaveNotification": "true",
	"dropbox.enabled": "false",
	"language": "auto",
	"nightmode": "false",
	"previews.enabled": "auto",
	"stats.enabled": "true",	
};

firetext.settings.init = function () {
	// Select elements
	var autoloadEnabled = document.querySelector('#autoload-enabled-switch');
	var autosaveEnabled = document.querySelector('#autosave-enabled-switch');
	var autosaveNotificationEnabled = document.querySelector('#autosave-notification-enabled-switch');
	var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
	var languageSelect = document.querySelector('#language-select');
	var nightmodeSelect = document.querySelector('#nightmode-select');
	var previewsSelect = document.querySelector('#previews-select');
	var statsEnabled = document.querySelector('#stats-enabled-switch');

	// Autoload
	switch (firetext.settings.get('autoload')) {
		case "true":
			autoloadEnabled.setAttribute('checked', '');
			break;
		case "false":
			autoloadEnabled.removeAttribute('checked');
			break;
	}
	autoloadEnabled.onchange = function () {
		firetext.settings.save('autoload', this.checked);
	}

	// Autosave
	switch (firetext.settings.get('autosave')) {
		case "true":
			autosaveEnabled.setAttribute('checked', '');
			if (deviceType == 'desktop') document.getElementById('autosave-notification-setting').style.display = 'block';
			break;
		case "false":
			autosaveEnabled.removeAttribute('checked');
			if (deviceType == 'desktop') document.getElementById('autosave-notification-setting').style.display = 'none';
			break;
	}
	autosaveEnabled.onchange = function () {
		firetext.settings.save('autosave', this.checked);
		if (firetext.settings.get('autosave') != 'false') {
			document.getElementById('editorSaveButton').style.display = 'none';
			if (deviceType == 'desktop') document.getElementById('autosave-notification-setting').style.display = 'block';
		} else {
			document.getElementById('editorSaveButton').style.display = 'inline-block';
			if (deviceType == 'desktop') document.getElementById('autosave-notification-setting').style.display = 'none';
		}
	}

	// Autosave Notification
	if (deviceType == 'desktop') {
		switch (firetext.settings.get('autosaveNotification')) {
			case "true":
				autosaveNotificationEnabled.setAttribute('checked', '');
				break;
			case "false":
				autosaveNotificationEnabled.removeAttribute('checked');
				break;
		}
		autosaveNotificationEnabled.onchange = function () {
			firetext.settings.save('autosaveNotification', this.checked);
		}
	} else {
		document.getElementById('autosave-notification-setting').style.display = 'none';
	}

	// Dropbox
	switch (firetext.settings.get('dropbox.enabled')) {
		case "true":
			dropboxEnabled.setAttribute('checked', '');
			break;
		case "false":
			dropboxEnabled.removeAttribute('checked');
			break;
	}
	dropboxEnabled.onchange = function () {
		firetext.settings.save('dropbox.enabled', this.checked);
		cloud.init();
	}

	// Language
	languageSelect.value = firetext.settings.get('language');
	languageSelect.addEventListener('change', function () {
		// Save
		firetext.settings.save('language', languageSelect.value);

		// Update
		firetext.language(languageSelect.value);
	});

	// Night Mode
	switch (firetext.settings.get('nightmode')) {
		case "false":
			nightmodeSelect.value = '0';
			break;
		case "true":
			nightmodeSelect.value = '1';
			break;
		case "auto":
			nightmodeSelect.value = '2';
			break;
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
	switch (firetext.settings.get('previews.enabled')) {
		case "false":
		case "never":
			previewsSelect.value = '0';
			
			// Fix old value
			if (firetext.settings.get('previews.enabled') == 'false') {
				firetext.settings.save('previews.enabled', 'never');
			}
			break;
		case "always":
			previewsSelect.value = '1';
			break;
		case "auto":
			previewsSelect.value = '2';
			break;
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
	switch (firetext.settings.get('stats.enabled')) {
		case "true":
			statsEnabled.setAttribute('checked', '');
			break;
		case "false":
			statsEnabled.removeAttribute('checked');
			break;
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
	var localStorageItem = localStorage.getItem(("firetext.settings."+name));
	if (localStorageItem) {
		return localStorageItem;
	} else {
		return defaultSettings[name];
	}
};

firetext.settings.save = function (name, value) {
	if (bugsenseInitialized) {
		Bugsense.leaveBreadcrumb("Setting: "+name+" set to: "+value);
	}
	name = ("firetext.settings."+name);
	localStorage.setItem(name, value);
};
