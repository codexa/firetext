/*
 * Firetext
 * Copyright (C) Codexa Organization.
 * Licensed and released under the GPLv3.
 * See LICENSE in "licenses/gpl.txt"
 * or at http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict';

/* Variables
------------------------*/
// Namespaces
var firetext = {};
firetext.user = {};
firetext.parsers = {};
firetext.analytics = {};

// Config
var version = '0.5.1';
var serverURL = 'https://firetext-server.herokuapp.com/';

// Misc
firetext.initialized = new CustomEvent('firetext.initialized');
firetext.isInitialized = false;
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var themeColor = document.getElementById("theme-color");
var loadSpinner, editor, toolbar, editWindow, editState, rawEditor, rawEditorElement, tempText, tabRaw, tabDesign, printButton, mainButtonConnectDropbox;
var currentFileName, currentFileType, currentFileLocation, currentFileDirectory;
var deviceType, fileChanged, saveTimeout, saving, firetextVariables={}, firetextVariablesInitialized = false;
var bold, fontSelect, fontSizeSelect, italic, justifySelect, strikethrough, styleSelect;
var underline, underlineCheckbox;
var locationLegend, locationSelect, locationDevice, locationDropbox;
var bugsenseInitialized = false;
var rate;
var editorMessageProxy, editorURL;

// Lists
var welcomeMainArea, welcomeDocsList, openDialogMainArea, openDialogRecentsArea, openDialogRecentsList;
var welcomeRecentsArea, welcomeRecentsList;

// Cache
var appCache = window.applicationCache;


/* Start
------------------------*/
window.addEventListener('DOMContentLoaded', function() {firetext.init();}, false);

firetext.init = function () {
	// l10n catch
	navigator.mozL10n.once(function () {
		// Select elements
		initElements();

		// Load modules
		initModules(function() {
			// Update Doc Lists
			updateDocLists();

			// Check for recent file, and if found, load it.
			if (firetext.settings.get('autoload') == 'true') {
				var lastDoc = [firetext.settings.get('autoload.dir'), firetext.settings.get('autoload.name'), firetext.settings.get('autoload.ext'), firetext.settings.get('autoload.loc')];
				if (firetext.settings.get('autoload.wasEditing') == 'true') {
					// Wait until Dropbox is authenticated
					if (lastDoc[3] == 'dropbox') {
						if (firetext.settings.get('dropbox.enabled') == 'true') {
							if (cloud.dropbox.client) {
								loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
								spinner('hide');
							} else {
								window.addEventListener('cloud.dropbox.authed', function() {
									loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
									spinner('hide');
								});
							}
						} else {
							spinner('hide');
						}
					} else {
						loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
						spinner('hide');
					}
				} else {
					spinner('hide');
				}
				regions.nav('welcome');
			} else {
				spinner('hide');
				regions.nav('welcome');
			}

			// Create listeners
			initListeners();

			// Dispatch init event
			window.dispatchEvent(firetext.initialized);
			firetext.isInitialized = true;
		});
	});

	navigator.mozL10n.ready(function () {
		// Add l10n title attributes and long-press help popups
		initElementTitles();

		// Update document title
		setDocumentTitle();

		// Let Bugsense know about language
		if (bugsenseInitialized) {
			Bugsense.addExtraData('app_locale', navigator.mozL10n.language.code);
		}

		// Freeze style selectors width, for Chrome
		Array.prototype.forEach.call(toolbar.getElementsByTagName('select'), function(select) {
			var style = select.getAttribute('style') || '';
			select.setAttribute('style', '');
			var width = select.clientWidth;
			select.setAttribute('style', style);
			select.style.width = width + 'px';
		});
	});
};

function initModules(callback) {
	// Initialize urls
	initVariables(function(){
		// Initialize Bugsense
		bugsenseInit();

		// Add extra links to menu
		addURLs();

		// Initialize cloud services
		cloud.init();
	});

	// Get user's location
	initLocation();

	// Find device type
	checkDevice();

	// Initialize Settings
	firetext.settings.init();

	// Initialize Language
	firetext.language(firetext.settings.get('language'));

	// Initialize Gestures
	initGestures();

	// Initialize night
	night();

	// Initialize extIcon
	extIcon();

	// Initalize recent docs
	firetext.recents.init();

	// Initialize IO
	firetext.io.init(null, function() {
		callback();
	});

	// Initialize print button
	initPrintButton(function() {});

	// Initialize rating prompter
	rate = Object.create(fxosRate);
	var config = {
				usesUntilPrompt: 4
			};
	rate.init("firetext", version, config);
	rate.promptRequired();

	// Initialize Christmas
	christmas();
}

function initElementTitles() {
	Array.prototype.forEach.call(document.querySelectorAll('[data-l10n-title]'), function(elm) {
		var titleId = elm.getAttribute('data-l10n-title');
		var title = navigator.mozL10n.get(titleId);
		elm.title = title;
		var timeout;
		var startTime;
		var startX;
		var startY;
		elm.ontouchstart = function(evt) {
			startTime = Date.now();
			startX = evt.touches[0].clientX;
			startY = evt.touches[0].clientY;
			timeout = setTimeout(function() {
				var titlePopup = document.createElement('div');
				titlePopup.textContent = title;
				titlePopup.className = 'titlePopup';
				elm.offsetParent.appendChild(titlePopup); // We put it in the document now because we want to know its width, to center it.
				var elmPos = elm.getBoundingClientRect();
				var offsetParentPos = elm.offsetParent.getBoundingClientRect(); // To make calculations easier.
				if (window.innerHeight - elmPos.top - elm.offsetHeight >= 45) {
					titlePopup.style.top = elm.offsetTop + elm.offsetHeight + 10 + 'px';
				} else {
					titlePopup.style.top = elm.offsetTop - 35 + 'px';
				}
				titlePopup.style.left = Math.max(10, Math.min(window.innerWidth - elm.offsetWidth - 10, elmPos.left + (elm.offsetWidth - titlePopup.offsetWidth) / 2)) - offsetParentPos.left + 'px';
				titlePopup.classList.add('shown');
				setTimeout(hide, 3000);
				document.addEventListener('touchstart', hide);
				function hide() {
					document.removeEventListener('touchstart', hide);
					titlePopup.classList.remove('shown');
					titlePopup.addEventListener('transitionend', function() {
						this.parentElement.removeChild(this);
					});
				}
			}, 500);
		};
		elm.ontouchend = function(evt) {
			if (Date.now() - startTime > 500) {
				evt.preventDefault();
			} else {
				cancel();
			}
		};
		elm.ontouchmove = function(evt) {
			if(Math.pow(evt.touches[0].clientX - startX, 2) + Math.pow(evt.touches[0].clientY - startY, 2) > 100) { // 10px * 10px in any direction
				cancel();
			}
		};
		elm.ontouchleave =
		elm.ontouchcancel =
			cancel;
		function cancel(evt) {
			clearTimeout(timeout);
		};
	});
}

function initElements() {
	// Misc
	loadSpinner = document.getElementById('loadSpinner');
	spinner();
	tabDesign = document.getElementById('tab-design');
	tabRaw = document.getElementById('tab-raw');
	editor = document.getElementById('editor');
	rawEditorElement = document.getElementById('rawEditor');
	toolbar = document.getElementById('edit-zone');
	editWindow = document.getElementById('edit');
	locationLegend = document.getElementById('locationLegend');
	locationSelect = document.getElementById('createDialogFileLocation');
	printButton = document.getElementById('printButton');
	mainButtonConnectDropbox = document.getElementById('mainButtonConnectDropbox');

	// Current file information
	currentFileName = document.getElementById('currentFileName');
	currentFileType = document.getElementById('currentFileType');
	currentFileLocation = document.getElementById('currentFileLocation');
	currentFileDirectory = document.getElementById('currentFileDirectory');

	// Lists
	welcomeMainArea = document.getElementById('welcome-main-area');
	welcomeDocsList = document.getElementById('welcome-docs-list');
	welcomeRecentsArea = document.getElementById('welcome-recents-area');
	welcomeRecentsList = document.getElementById('welcome-recents-list');
	openDialogMainArea = document.getElementById('open-dialog-main-area');
	openDialogRecentsArea = document.getElementById('open-dialog-recents-area');
	openDialogRecentsList = document.getElementById('open-dialog-recents-list');

	// Formatting
	bold = document.getElementById('bold');
	fontSelect = document.getElementById('font-select');
	fontSizeSelect = document.getElementById('font-size-select');
	italic = document.getElementById('italic');
	justifySelect = document.getElementById('justify-select');
	strikethrough = document.getElementById('strikethrough');
	underline = document.getElementById('underline');
	styleSelect = document.getElementById('style-select');
}

function throttle(fn, ms) {
	var lastCall = 0;
	var timeout;
	return function() {
		var now = Date.now();
		if(now - lastCall > ms) {
			fn.apply(this, arguments);
			lastCall = now;
		}
		if(timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(fn, ms);
	};
}

function initListeners() {
	// Add event listeners
	toolbar.addEventListener(
		'mousedown', function mouseDown(event) {
			if (event.target.nodeName.toLowerCase() !== 'select') {
				event.preventDefault();
				event.target.classList.toggle('active');
			}
		}
	);
	Array.prototype.forEach.call(toolbar.getElementsByTagName('select'), function(select) {
		select.addEventListener(
			'change', function change() {
				// This doesn't catch the case where the user selects the
				// same option, but we don't have anything better.
				editor.contentWindow.focus();

				// Also, update select styles.
				updateSelectStyles();
			}
		);
	});
	toolbar.addEventListener('mouseup', mouseEnd);
	toolbar.addEventListener('mouseleave', mouseEnd);
	function mouseEnd(event) {
		if (event.target.classList.contains('sticky') != true) {
			event.target.classList.remove('active');
		}
	}
	welcomeMainArea.addEventListener('scroll', throttle(updatePreviews,300));
	openDialogMainArea.addEventListener('scroll', throttle(updatePreviews,300));
	welcomeDocsList.addEventListener(
		'contextmenu', function contextmenu(event) {
			event.preventDefault();
			if (editState != true) {
				editDocs();
			}
			var elm = event.target.closest('.fileListItem');
			if (elm) {
				elm.getElementsByClassName('edit-selected')[0].click();
				updateSelectButton();
			}
		}
	);
}

function initVariables(callback) {
	var requestURL = serverURL+'?request=firetext_variables&version='+version+'&locale='+html.getAttribute('lang');
	var xhr = new XMLHttpRequest();
	xhr.open('get',requestURL,true);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			firetextVariables = JSON.parse(xhr.responseText);
			firetextVariablesInitialized = true;
			callback();
		}
	}
	xhr.send();
}

var user_location = {};
function initLocation() {
	var requestURL = serverURL+'/location';
	var xhr = new XMLHttpRequest();
	xhr.open('get',requestURL,true);
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			user_location = JSON.parse(xhr.responseText);
		}
	}
	xhr.send();
}

function addURLs() {
	// Create url array
	var urls = {};
	for (var category in firetextVariables.urlCategories) {
		urls[firetextVariables.urlCategories[category].id] = {
			"name": firetextVariables.urlCategories[category].name,
			"items": {}
		};
	}
	urls["other"] = {
		"name": "Other",
		"items": {}
	};
	for (var url in firetextVariables.urls) {
		var currentUrl = firetextVariables.urls[url];
		var category = urls[currentUrl.category] ? currentUrl.category : "other";
		urls[category]["items"][url] = {
			"name": currentUrl.name,
			"id": currentUrl.id,
			"url": currentUrl.url
		};
	}

	// Get url menus and clear old urls
	var urlMenus = document.getElementsByClassName("url-menu");
	var tempOldUrls = document.getElementsByClassName("remote-url");
	while(tempOldUrls[0]) tempOldUrls[0].parentNode.removeChild(tempOldUrls[0]);

	// Create DOM elements
	for (var urlCategory in urls) {
		var tempCategoryTitle = document.createElement("h2");
		tempCategoryTitle.classList.add("remote-url");
		if (navigator.mozL10n.get(urlCategory) != ""){
			tempCategoryTitle.setAttribute("data-l10n-id",urlCategory);
			tempCategoryTitle.textContent = navigator.mozL10n.get(urlCategory);
		} else {
			tempCategoryTitle.textContent = urls[urlCategory].name;
		}

		var tempLinkContainer = document.createElement("ul");
		tempLinkContainer.classList.add("remote-url");
		for (var thisUrl in urls[urlCategory].items) {
			// Generate link elements
			var thisUrlItem = urls[urlCategory].items[thisUrl];
			var tempListItem = document.createElement("li");
			var tempLink = document.createElement("a");
			tempLink.href = "#";
			tempLink.setAttribute("data-click","browser");
			tempLink.setAttribute("data-click-location",thisUrlItem.url);
			tempLink.setAttribute("data-url-id",thisUrlItem.id);
			if (navigator.mozL10n.get(thisUrlItem.id) != ""){
				tempLink.setAttribute("data-l10n-id",thisUrlItem.id);
				tempLink.textContent = navigator.mozL10n.get(thisUrlItem.id);
			} else {
				tempLink.textContent = thisUrlItem.name;
			}

			// Add link to list item
			tempListItem.appendChild(tempLink);

			// Add to category container
			tempLinkContainer.appendChild(tempListItem);
		}

		// Add category to url menus
		Array.prototype.filter.call(urlMenus, function(menu){
			menu.appendChild(tempCategoryTitle.cloneNode(true));
			menu.appendChild(tempLinkContainer.cloneNode(true));
		});
	}
}


/* Add dialog
------------------------*/
function updateAddDialog() {
	if (bugsenseInitialized) {
		var storageSystems = [], tempLocationOption;
		for (var i=0;i<locationSelect.length;i++) {
			tempLocationOption = locationSelect.children[i];
			storageSystems.push(tempLocationOption.value);
		}
		Bugsense.addExtraData('storage_systems', storageSystems.toString());
	}
	if (locationSelect.length < 1) {
		[].forEach.call(document.getElementsByClassName('create-dialog'), function(createDialog) {
			// Disable elements
			createDialog.getElementsByClassName('create-button')[0].style.pointerEvents = 'none';
			createDialog.getElementsByClassName('create-button')[0].style.color = '#999';
			createDialog.querySelector('[role="main"]').style.display = 'none';

			// Show notice
			var noStorageNotice = createDialog.getElementsByClassName('no-storage-notice')[0];
			if (noStorageNotice.classList.contains('hidden-item')) {
				noStorageNotice.classList.remove('hidden-item');
			}
		});
	} else {
		[].forEach.call(document.getElementsByClassName('create-dialog'), function(createDialog) {
			// Disable elements
			createDialog.getElementsByClassName('create-button')[0].style.pointerEvents = '';
			createDialog.getElementsByClassName('create-button')[0].style.color = '';
			createDialog.querySelector('[role="main"]').style.display = '';

			// Hide location select if only one option exists
			if (locationSelect.length === 1) {
				locationLegend.style.display = 'none';
			} else {
				locationLegend.style.display = 'block';
			}

			// Hide notice
			var noStorageNotice = createDialog.getElementsByClassName('no-storage-notice')[0];
			if (!noStorageNotice.classList.contains('hidden-item')) {
				noStorageNotice.classList.add('hidden-item');
			}
		});
	}
}


/* Bugsense
------------------------*/
function bugsenseInit() {
	if (firetextVariablesInitialized && firetextVariables.services.splunk.apiKey) {
		if (firetext.settings.get('stats.enabled') != 'false' &&
				!bugsenseInitialized) {
			Bugsense.initAndStartSession({ appname: 'Firetext', appVersion: version, apiKey: firetextVariables.services.splunk.apiKey });
			bugsenseInitialized = true;
		}
	}
}


/* Doc lists
------------------------*/
var allDocs,
	recentsDocs,
	internalDocs = [],
	cloudDocs = [];

function updateAllDocs() {
	allDocs = recentsDocs.concat(internalDocs.concat(cloudDocs).sort(function(a, b) {
		return b[5] - a[5];
	})).filter(function(doc, j, docs) {
		for(var i = 0; i < j; i++) {
			if(docs[i][0] == doc[0] && docs[i][1] == doc[1] && docs[i][2] == doc[2]) {
				return false;
			}
		}
		return true;
	});
	buildDocList(allDocs, [welcomeRecentsList, openDialogRecentsList], 'documents-found');
}

function updatePreviewsEnabled() {
	if(firetext.settings.get('previews.enabled') == 'never') {
		Array.prototype.forEach.call(document.getElementsByClassName('docsList'), function(docList) {
			docList.classList.remove('previews');
		});
		updatePreviews();
	} else if(firetext.settings.get('previews.enabled') == 'always') {
		Array.prototype.forEach.call(document.getElementsByClassName('docsList'), function(docList) {
			docList.classList.add('previews');
		});
		updatePreviews();
	} else {
		var conn = navigator.connection || navigator.webkitConnection;
		if(conn) {
			conn.onchange = conn.ontypechange = updatePreviewsEnabledFromConnection;
			updatePreviewsEnabledFromConnection();
		} else {
			Array.prototype.forEach.call(document.getElementsByClassName('docsList'), function(docList) {
				docList.classList.add('previews');
			});
			updatePreviews();
		}
	}
}

function updatePreviewsEnabledFromConnection() {
	if(firetext.settings.get('previews.enabled') == 'auto') {
		var conn = navigator.connection || navigator.webkitConnection;
		if(conn.type !== 'none') { // Don't change if no connection
			if(['bluethooth', 'cellular', 'wimax'].indexOf(conn.type) !== -1) {
				Array.prototype.forEach.call(document.getElementsByClassName('docsList'), function(docList) {
					docList.classList.remove('previews');
				});
			} else {
				Array.prototype.forEach.call(document.getElementsByClassName('docsList'), function(docList) {
					docList.classList.add('previews');
				});
			}
			updatePreviews();
		}
	}
}

function updateDocLists(lists) {
	if (!lists) {
		lists = [];
		lists.push('all');
	}

	if (!lists.length) {
		updateAllDocs();
	}

	if (lists.indexOf('all') != '-1' | lists.indexOf('recents') != '-1') {
		// Recents
		recentsDocs = firetext.recents.get();
		updateAllDocs();
	}

	if (lists.indexOf('all') != '-1' | lists.indexOf('internal') != '-1') {
		// Internal
		spinner();
		firetext.io.enumerate('/', function(DOCS) {
			internalDocs = DOCS;
			updateAllDocs();
			spinner('hide');
		});
	}

	if (lists.indexOf('all') != '-1' | lists.indexOf('cloud') != '-1') {
		// Cloud
		if (firetext.settings.get('dropbox.enabled') == 'true' && cloud.dropbox.client) {
			spinner();
			cloud.dropbox.enumerate('/Documents/', function(DOCS) {
				cloudDocs = DOCS;
				updateAllDocs();
				spinner('hide');
			});
		} else {
			cloudDocs = [];
			updateAllDocs();
		}
	}
}

function getPreview(filetype, content, error) {
	if (!content) {
		content = '';
	}

	if(error) {
		return document.createTextNode(content);
	}

	switch (filetype) {
		case ".txt":
			content = firetext.parsers.plain.parse(content, "HTML");
			break;
		case ".odt":
			content = new ODTDocument(content).getHTMLUnsafe();
			break;
		/* 0.4
		case ".docx":
			docxeditor = new firetext.parsers.DocxEditor(content);
			content = result.HTMLout();
			doc.appendChild(content);
			break;
		*/
		case ".html":
		default:
			if(!/<!DOCTYPE/i.test(content)) content = '<!DOCTYPE html>' + content;
			break;
	}

	var iframe = document.createElement('iframe');
	iframe.sandbox = 'allow-scripts';
	iframe.srcdoc = content
		.replace(' contenteditable="true"', '') // Work around the bug that we used to include contenteditable in the saved file, to disable the spellchecker in Firefox.
		.replace('</head>', [
			'',
			'<style>',
			'html {',
			'	max-width: calc(var(--width) - 2 * var(--margin)) !important;',
			'	height: calc(var(--height) - 2 * var(--margin));',
			'		-moz-column-count: 1;',
			'	column-count: 1;',
			'		-moz-column-gap: 1000px;',
			'	column-gap: 1000px;',
			'	',
			'	/* Defaults */',
user_location.country === 'US' ?
			'	--width: 8.5in;' :
			'	--width: 21cm;',
user_location.country === 'US' ?
			'	--height: 11in;' :
			'	--height: 29.7cm;',
			'	--margin: 1in;',
			'}',
			'body {',
			'	margin: 0;',
			'}',
			'[_firetext_night] body, [_firetext_night] img {',
			'		-webkit-filter: invert(100%) hue-rotate(180deg);',
			'	filter: invert(100%) hue-rotate(180deg);',
			'}',
			'</style>',
			'<script>',
			'window.addEventListener("message", function(e) { nightEditor(e.data.nightMode); });',
			'function nightEditor(nightMode) {',
			'	var html = document.getElementsByTagName("html")[0];',
			'	if(nightMode) {',
			'		document.documentElement.setAttribute("_firetext_night", "");',
			'	} else {',
			'		document.documentElement.removeAttribute("_firetext_night");',
			'	}',
			'}',
			'</script>',
			'</head>',
		].join('\n'));
	iframe.scrolling = 'no';
	return iframe;
}

function updatePreviewNightModes(iframes) {
	if(!welcomeDocsList.classList.contains('previews')) {
		return;
	}
	Array.prototype.forEach.call(iframes, function(iframe) {
		iframe.contentWindow.postMessage({
			nightMode: html.classList.contains('night')
		}, '*');
	});
}

var gettingPreview = {};

function resetPreviews(location) {
	Object.keys(gettingPreview).forEach(function(key) {
		if(key.substr(key.lastIndexOf(',') + 1) === location) {
			delete gettingPreview[key];
		}
	});
}

function resetPreview() {
	delete gettingPreview[Array.prototype.join.call(arguments, ',')];
}

function setPreview(description, previews) {
	var done;
	var preview;
	previews.some(function(_preview) {
		if(description.firstChild === _preview) {
			done = true;
			return true;
		} else if(!document.contains(_preview)) {
			preview = _preview;
			return true;
		}
	});
	if(done) {
		return;
	}
	if(!preview) {
		preview = previews[0].cloneNode();
		previews.push(preview);
	}
	description.innerHTML = '';
	description.appendChild(preview);
	if(html.classList.contains('night')) {
		preview.addEventListener('load', function() {
			updatePreviewNightModes([preview]);
		});
	}
}

function updatePreviews() {
	if(!welcomeDocsList.classList.contains('previews')) {
		return;
	}
	Array.prototype.forEach.call(document.getElementsByClassName('fileListItem'), function(item) {
		if(!item.offsetParent) {
			// We're in edit mode, item is hidden.
			return;
		}
		var scrollParent = welcomeMainArea.contains(item) ? welcomeMainArea : openDialogMainArea;
		if(item.offsetTop < item.offsetParent.offsetHeight + scrollParent.scrollTop &&
			item.offsetTop + item.offsetHeight > scrollParent.offsetTop + scrollParent.scrollTop) {
			var directory = item.getAttribute('data-click-directory');
			var filename = item.getAttribute('data-click-filename');
			var filetype = item.getAttribute('data-click-filetype');
			var location = item.getAttribute('data-click-location');
			var key = [directory, filename, filetype, location];
			if(!gettingPreview[key]) {
				gettingPreview[key] = true;
				firetext.io.load(directory, filename, filetype, function (result, error) {
					gettingPreview[key] = [getPreview(filetype, result, error)];
					Array.prototype.forEach.call(document.querySelectorAll(
						'.fileListItem' +
						'[data-click-directory="' + directory + '"]' +
						'[data-click-filename="' + filename + '"]' +
						'[data-click-filetype="' + filetype + '"]' +
						'[data-click-location="' + location + '"]'
					), function(item) {
						setPreview(item.getElementsByClassName('fileItemDescription')[0], gettingPreview[key]);
					});
				}, location, false);
			} else if(gettingPreview[key] !== true) {
				setPreview(item.getElementsByClassName('fileItemDescription')[0], gettingPreview[key]);
			}
		}
	});
}

function scrollDocList() {
	Array.prototype.forEach.call(document.getElementsByClassName('fileListItem'), function(item) {
		if(!item.offsetParent) {
			// We're in edit mode, item is hidden.
			return;
		}
		var scrollParent = welcomeMainArea.contains(item) ? welcomeMainArea : openDialogMainArea;
		if(item.offsetTop < item.offsetParent.offsetHeight + scrollParent.scrollTop &&
			item.offsetTop + item.offsetHeight > scrollParent.offsetTop + scrollParent.scrollTop) {
			// Show item
			item.classList.remove("hiddenPreview");
		} else {
			// Hide item
			item.classList.add("hiddenPreview");
		}
	});

}

function buildDocListItems(DOCS, listElms, ctr) {
	// Get current doc
	var DOC = DOCS[ctr];

	// Get doc location
	var location = DOC[4] || 'internal';

	// UI refinements
	var directory;
	if (DOC[0].charAt(0) == '/' && DOC[0].length > 1) {
		directory = DOC[0].slice(1);
	} else {
		directory = DOC[0];
	}

	// Generate item
	var className = 'fileListItem' + (ctr === DOCS.length - 1 ? ' lastItem' : '');
	var output = '<li class="'+className+'" data-click="loadToEditor" data-click-directory="'+DOC[0]+'" data-click-filename="'+DOC[1]+'" data-click-filetype="'+DOC[2]+'" data-click-location="'+location+'" data-index="'+ctr+'" style="-webkit-order: '+ctr+'; order: '+ctr+';">';
	output += '<a href="#">';
	output += '<div class="fileItemDescription"></div>';
	output += '<div class="fileItemInfo">';
	output += '<aside class="pack-end icon-chevron-right"></aside>';
	output += '<aside class="pack-end edit-checkbox"><label class="pack-checkbox danger"><input type="checkbox" class="edit-selected"><span></span></label></aside>';
	output += '<p class="fileItemName" title="'+DOC[1]+DOC[2]+'">'+DOC[1]+DOC[2]+'</p>';
	output += '<p class="fileItemPath" title="'+directory+DOC[1]+DOC[2]+'">'+(location==='dropbox'?'<span class="icon-dropbox" title="'+navigator.mozL10n.get('documents-dropbox')+'"></span> ':'')+directory+DOC[1]+DOC[2]+'</p>';
	output += '</div>';
	output += '</a></li>';

	// Display output HTML
	for (var i = 0; i < listElms.length; i++) {
		var elm = listElms[i].querySelector(
			'.fileListItem' +
			'[data-click-directory="' + DOC[0] + '"]' +
			'[data-click-filename="' + DOC[1] + '"]' +
			'[data-click-filetype="' + DOC[2] + '"]' +
			'[data-click-location="' + location + '"]'
		);
		if(elm) {
			elm.className = className;
			elm.setAttribute('data-index', ctr);
			elm.style.webkitOrder = ctr;
			elm.style.order = ctr;
		} else {
			listElms[i].insertAdjacentHTML('beforeend', output);
		}
	}

	// Fetch previews
	updatePreviews();

	// Base case
	if (ctr === DOCS.length - 1) {
		return;
	}

	// build next item
	buildDocListItems(DOCS, listElms, ctr + 1);
}

function buildDocList(DOCS, listElms, display) {
	if (listElms && DOCS) {
		// Make sure list is not an edit list
		for (var i = 0; i < listElms.length; i++) {
			listElms[i].setAttribute("data-type", "list");
		}

		if (DOCS.length > 0) {
			// build next item
			buildDocListItems(DOCS, listElms, 0);

			// remove outdated items
			for (var i = 0; i < listElms.length; i++) {
				for (var j = 0; j < listElms[i].childNodes.length; j++) {
					var childNode = listElms[i].childNodes[j];
					var DOC = DOCS[childNode.getAttribute('data-index')];
					if (
						!DOC ||
						DOC[0] !== childNode.getAttribute('data-click-directory') ||
						DOC[1] !== childNode.getAttribute('data-click-filename') ||
						DOC[2] !== childNode.getAttribute('data-click-filetype') ||
						(DOC[4] || 'internal') !== childNode.getAttribute('data-click-location')
					) {
						listElms[i].removeChild(childNode);
					}
				}
			}
		} else {
			// No docs message
			var output = '<li style="margin-top: -5px" class="noLink">';
			output += '<p style="padding: 1.5rem 0 0.5rem;" data-l10n-id="no-'+display+'">'+navigator.mozL10n.get('no-'+display)+'</p>';
			output += '<p style="padding-bottom: 1rem;" data-l10n-id="click-compose-icon-to-create">'+navigator.mozL10n.get('click-compose-icon-to-create')+'</p>';
			output += '</li>';

			// Display output HTML
			for (var i = 0; i < listElms.length; i++) {
				listElms[i].innerHTML = output;
			}
		}
	}
}


/* Display
------------------------*/
function showSaveBanner(filepath) {
	firetext.notify(navigator.mozL10n.get('successfully-saved')+' '+filepath);
}

// File Extension Icon on Create new file
function extIcon() {
	var extf = document.getElementById('extIconFile');
	var option = document.getElementById('createDialogFileType').value;
	var icon;
	if (option == '.txt') {
		icon = 'format-align-left';
	} else {
		icon = 'format-float-left';
	}
	extf.outerHTML = [
		'<span id="extIconFile" class="icon icon-file" style="display:block; width: 150px; margin: 10px auto; font-size: 150px;">',
		'	<span style="position: absolute; font-size: 13px; left: 35.5px; top: 45px; color: white; text-transform: uppercase; font-weight: bold;">' + option.replace('.', '') + '</span>',
		'	<span style="position: absolute; font-size: 80px; left: 35.5px; top: 56px; color: white; transform: scaleX(1.3);"class="icon icon-' + icon + '" style=""></span>',
		'</span>',
	].join('\n');
}


/* Editor
------------------------*/
function initEditor(callback) {
	if (editorURL) {
		app.modules.fill(editorURL, editor, function() {
			editorCommunication(function(){
				callback();
			});
		});
	} else {
		app.modules.load('modules/editor/editor.html', editor, function(u) {
			editorURL = u;
			editorCommunication(function(){
				callback();
			});
		}, true, true);
	}
}

function editorCommunication(callback) {
	editor.onload = null;
	editor.onload = function() {
		// Stop listening to editor
		if(editorMessageProxy) editorMessageProxy.setRecv(null);

		// See: scripts/messages.js
		editorMessageProxy = new MessageProxy();
		editorMessageProxy.setSend(editor.contentWindow);
		editorMessageProxy.setRecv(window);
		// Successful initialization
		editorMessageProxy.registerMessageHandler(function(e) {
			callback();
		}, "init-success", true);

		// Handle errors and logs
		editorMessageProxy.registerMessageHandler(function(e) {
			console.log(e.data.details);
		}, "error", true);
		editorMessageProxy.registerMessageHandler(function(e) {
			console.log(e.data.details);
		}, "log", true);

		editorMessageProxy.registerMessageHandler(function(e) {
			tempText = e.data.html;
			fileChanged = true;
			autosave();
		}, "doc-changed");

		editorMessageProxy.registerMessageHandler(function(e) {
			updateToolbar();
		}, "update-toolbar");

		// editor focus and blur
		editorMessageProxy.registerMessageHandler(function(e) {
			if(e.data.focus) {
				processActions('data-focus', editor);
			} else {
				processActions('data-blur', editor);
			}
		}, "focus");
		editorMessageProxy.postMessage({command: "init"});

		editor.onload = function() {
			editorMessageProxy.setSend(editor.contentWindow);
		}
	}
}

function watchDocument(filename, filetype) {
	if(filetype === ".html") {
		// Add listener to update design
		rawEditor.on('change', function() {
			fileChanged = true;
			editorMessageProxy.registerMessageHandler(function(e) { autosave(); }, 'autosave-ready');
			editorMessageProxy.postMessage({
				command: "load",
				content: rawEditor.getValue(),
				filename: filename,
				filetype: ".html",
				user_location: user_location,
				key: 'autosave-ready'
			});
		});
		rawEditor.on('focus', function() {
			processActions('data-focus',rawEditorElement);
		});
		rawEditor.on('blur', function() {
			processActions('data-blur',rawEditorElement);
		});
	}
}

function forceAutosave() {
	autosave(true);
}

function autosave(force) {
	if (firetext.settings.get('autosave') != 'false') {
		if (!saveTimeout || force == true) {
			if (saving != true) {
				// Add timeout for saving
				saveTimeout = window.setTimeout(function() { saveFromEditor(deviceType == 'desktop' && firetext.settings.get('autosaveNotification') == 'true'); }, 1000);
			} else {
				saveTimeout = window.setTimeout(forceAutosave, 1000);
			}
		}
	}
}


/* Edit Mode
------------------------*/
function editDocs() {
	if (editState == true) {
		editState = false;
		document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 5rem)';
		welcomeDocsList.classList.remove('editMode');

		updateDocLists(['all']);
		editModeListeners();

		regions.navBack();
	} else {
		editState = true;
		document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 10rem)';
		welcomeDocsList.classList.add('editMode');

		editModeListeners();

		regions.nav('welcome-edit-mode');
	}
}

function editModeListeners() {
	if (editState == true) {
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		for (var i = 0; i < checkboxes.length; i++ ) {
			checkboxes[i].onchange = updateSelectButton;
		}
		var listItems = welcomeDocsList.getElementsByClassName('fileListItem');
		for (var i = 0; i < listItems.length; i++ ) {
			listItems[i].onclick = updateCheckbox;
		}
	} else {
		var listItems = welcomeDocsList.getElementsByClassName('fileListItem');
		for (var i = 0; i < listItems.length; i++ ) {
			listItems[i].onclick = null;
		}
	}
}

function updateCheckbox(evt) {
	evt.stopPropagation();
	if(!this.getElementsByClassName('pack-checkbox')[0].contains(evt.target)) {
		this.getElementsByClassName('edit-selected')[0].click();
	}
}

function updateSelectButton() {
	if (numSelected() != numCheckboxes()) {
		// Add select all button
		document.getElementById("selectButtons").innerHTML = '<button data-click="selectAll" data-l10n-id="select-all"></button><button data-click="delete" class="danger" data-l10n-id="delete-selected"></button>';
	}
	else {
		// Add deselect all button
		document.getElementById("selectButtons").innerHTML = '<button data-click="deselectAll" data-l10n-id="deselect-all"></button><button data-click="delete" class="danger" data-l10n-id="delete-selected"></button>';
	}
}

function numSelected() {
	// Only use this function in edit mode
	if (editState == true) {
		var n = 0;
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		for (var i = 0; i < checkboxes.length; i++ ) {
			if (checkboxes[i].checked) {
				n++;
			}
		}
		return n;
	}
}

function numCheckboxes() {
	// Only use this function in edit mode
	if (editState == true) {
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		return checkboxes.length;
	}
}

function selectAll() {
	// Only use this function in edit mode
	if (editState == true) {
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		for (var i = 0; i < checkboxes.length; i++ ) {
			checkboxes[i].checked = true;
		}
		updateSelectButton();
	}
}

function deselectAll() {
	// Only use this function in edit mode
	if (editState == true) {
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		for (var i = 0; i < checkboxes.length; i++ ) {
			checkboxes[i].checked = false;
		}
		updateSelectButton();
	}
}

function deleteSelected(confirmed) {
	// Only use this function in edit mode
	if (editState == true) {
		// Get selected files
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		var selected = Array.prototype.filter.call(checkboxes, function(elm) {
			return elm.checked;
		});

		if (confirmed != true && confirmed != 'true') {
			if (selected.length == 1) {
				var confirmDeletion = confirm(navigator.mozL10n.get('want-to-delete-singular'));
			} else if (selected.length > 1) {
				var confirmDeletion = confirm(navigator.mozL10n.get('want-to-delete-plural'));
			} else {
				firetext.notify(navigator.mozL10n.get('no-files-selected'));
				return;
			}
			if (confirmDeletion != true) {
				return;
			}
		}

		// Delete selected files
		for (var i = 0; i < selected.length; i++) {
			// Get filename
			var elm = selected[i].closest('.fileListItem');
			var filename = elm.getAttribute('data-click-directory') + elm.getAttribute('data-click-filename') + elm.getAttribute('data-click-filetype');
			var location = elm.getAttribute('data-click-location');

			// Remove from RecentDocs
			firetext.recents.remove((filename + location), true);

			// Delete file
			firetext.io.delete(filename, location);

			// Remove from list
			elm.parentNode.removeChild(elm);
		}
	}
}


/* Format
------------------------*/
function formatDoc(sCmd, sValue) {
	editorMessageProxy.postMessage({
		command: "format",
		sCmd: sCmd,
		sValue: sValue
	});
}

function updateToolbar() {
	if (document.getElementById("edit").classList.contains('current')) {
		var key = editorMessageProxy.registerMessageHandler(function(e){
			var commandStates = e.data.commandStates;

			// Bold
			if (commandStates.bold.state) {
				bold.classList.add('active');
			} else {
				bold.classList.remove('active');
			}

			// Font
			fontSelect.value = commandStates.fontName.value.replace(/'/g, '"').replace(/,\s*/g, ', ');

			// Font size
			fontSizeSelect.value = commandStates.fontSize.value;

			// Italic
			if (commandStates.italic.state) {
				italic.classList.add('active');
			} else {
				italic.classList.remove('active');
			}

			// Justify
			if (commandStates.justifyCenter.state) {
				justifySelect.value = 'c';
			} else if (commandStates.justifyFull.state) {
				justifySelect.value = 'j';
			} else if (commandStates.justifyRight.state) {
				justifySelect.value = 'r';
			} else {
				justifySelect.value = 'l';
			}

			// Underline
			if (commandStates.underline.state) {
				underline.classList.add('active');
			} else {
				underline.classList.remove('active');
			}

			// Strikethrough
			if (commandStates.strikeThrough.state) {
				strikethrough.classList.add('active');
			} else {
				strikethrough.classList.remove('active');
			}

			// Style
			styleSelect.value = commandStates.formatBlock.value;

			// Update select current styles
			updateSelectStyles();
		}, null, true);
		editorMessageProxy.postMessage({
			command: "query-command-states",
			commands: ["bold", "fontName", "fontSize", "italic", "justifyCenter", "justifyFull", "justifyRight", "underline", "strikeThrough", "formatBlock"],
			key: key
		});
	}
}

function updateSelectStyles() {
	// Set selects current style
	Array.prototype.forEach.call(toolbar.getElementsByTagName('select'), function(select) {
		var width = select.style.width;
		select.setAttribute('style',
			select.selectedOptions[0] ?
				(select.selectedOptions[0].getAttribute('style') || '').replace('text-decoration: underline;', '') : // Firefox doesn't support text-decoration: none; on options elements apparently
				''
		);
		select.style.width = width;
	});
}

/* Actions (had to do this because of CSP policies)
------------------------*/
document.addEventListener('click', function(event) {
	if (event.button !== 2) {
		processActions('data-click', event.target, event);
	}
});

document.addEventListener('submit', function(event) {
	processActions('data-submit', event.target, event);
});

document.addEventListener('keypress', function(event) {
	if (event.key == 13 | event.keyCode == 13) {
		processActions('data-enter', event.target, event);
	}
});

document.addEventListener('keyup', function(event) {
	if (event.key == 27 | event.keyCode == 27) {
		processActions('data-esc', event.target, event);
	}
});

document.addEventListener('mousedown', function(event) {
	processActions('data-mouse-down', event.target, event);
});

document.addEventListener('change', function(event) {
	processActions('data-change', event.target, event);
});

document.addEventListener('focus', function(event) {
	processActions('data-focus', event.target, event);
});

document.addEventListener('blur', function(event) {
	processActions('data-blur', event.target, event);
});

function initGestures () {
	new GestureDetector(document.body).startDetecting();
	document.body.addEventListener('swipe', function (event) {
		// Detect direction
		var direction;
		if (html.getAttribute('dir')==='rtl') {
			if (event.detail.direction == 'right') {
				direction = 'left';
			} else if (event.detail.direction == 'left') {
				direction = 'right';
			}
		} else {
			direction = event.detail.direction;
		}

		// Process the action
		processActions(('data-swipe-'+direction), event.target, event);
	});
}

function processActions(eventAttribute, target, event) {
	if (target && target.getAttribute) {
		if (target.hasAttribute(eventAttribute) != true) {
			while (target.parentNode && target.parentNode.getAttribute) {
				target = target.parentNode;
				if (target.hasAttribute(eventAttribute)) {
					break;
				}
			}
		}

		// Check to see if it has the right class
		if (target.getAttribute(eventAttribute+'-only')) {
			if (!target.classList.contains(target.getAttribute(eventAttribute+'-only'))) {
				return;
			}
		}

		var calledFunction = target.getAttribute(eventAttribute);
		if (calledFunction == 'loadToEditor') {
			loadToEditor(target.getAttribute(eventAttribute + '-directory'), target.getAttribute(eventAttribute + '-filename'), target.getAttribute(eventAttribute + '-filetype'), target.getAttribute(eventAttribute + '-location'));
		} else if (calledFunction == 'nav') {
			regions.nav(target.getAttribute(eventAttribute + '-location'));
		} else if (calledFunction == 'navBack') {
			regions.navBack();
		} else if (calledFunction == 'closeOverlay') {
			regions.closeOverlay();
		} else if (calledFunction == 'sidebar') {
			regions.sidebar(target.getAttribute(eventAttribute + '-id'), target.getAttribute(eventAttribute + '-state'));
		} else if (calledFunction == 'saveFromEditor') {
			saveFromEditor(true, true);
		} else if (calledFunction == 'downloadFile') {
			download();
		} else if (calledFunction == 'closeFile') {
			// Check if file is changed.	If so, prompt the user to save it.
			if (firetext.settings.get('autosave') == 'false' && fileChanged == true) {
				if (target.getAttribute(eventAttribute + '-action')) {
					var action = target.getAttribute(eventAttribute + '-action');
					if (action == 'yes') {
						regions.navBack();
						saveFromEditor();
						regions.nav('welcome');
					} else if (action == 'no') {
						fileChanged = false;
						regions.navBack();
						regions.nav('welcome');
					} else {
						regions.navBack();
					}
				} else {
					regions.nav('save-file');
					return;
				}
			}

			// Navigate to the welcome screen
			regions.nav('welcome');
		} else if (calledFunction == 'formatDoc') {
			formatDoc(target.getAttribute(eventAttribute + '-action'), target.getAttribute(eventAttribute + '-value'));
		} else if (calledFunction == 'createFromDialog') {
			createFromDialog();
		} else if (calledFunction == 'uploadFromDialog') {
			uploadFromDialog();
		} else if (calledFunction == 'saveAsFromDialog') {
			saveAsFromDialog();
		} else if (calledFunction == 'editDocs') {
			editDocs();
		} else if (calledFunction == 'extIcon') {
			extIcon();
		} else if (calledFunction == "delete") {
			deleteSelected(target.getAttribute(eventAttribute + '-confirmed'));
		} else if (calledFunction == "selectAll") {
			selectAll();
		} else if (calledFunction == "deselectAll") {
			deselectAll();
		} else if (calledFunction == 'tab') {
			regions.tab(target.getAttribute('data-tab-id'), target.getAttribute(eventAttribute + '-name'));
		} else if (calledFunction == 'clearForm') {
			if (target.parentNode.children[0]) {
				target.parentNode.children[0].value = '';
				event.preventDefault();
				setTimeout(function() { // Fix autocapitalization in Chrome mobile
					target.parentNode.children[0].blur();
					target.parentNode.children[0].focus();
				});
			}
		} else if (calledFunction == 'clearCreateForm') {
			clearCreateForm();
			event.preventDefault();
		} else if (calledFunction == 'fullscreen') {
			if (target.getAttribute(eventAttribute + '-state') == 'off') {
				editFullScreen(false);
			} else {
				editFullScreen();
			}
		} else if (calledFunction == 'browser') {
			// Launch rate activity if available
			if (target.getAttribute("data-url-id") == 'rate-firetext') {
				if (window.MozActivity) {
					var activity = new MozActivity({
						name: "marketplace-app-rating",
						data: {slug: "firetext"}
					});
					activity.onerror = function() {
						visitURL(target.getAttribute(eventAttribute + '-location'));
					};
					return;
				}
			}

			visitURL(target.getAttribute(eventAttribute + '-location'));
		} else if (calledFunction == 'justify') {
			var justifyDirection = justifySelect.value;
			if (justifyDirection == 'l') {
				justifyDirection = 'Left';
			} else if (justifyDirection == 'r') {
				justifyDirection = 'Right';
			} else if (justifyDirection == 'c') {
				justifyDirection = 'Center';
			} else if (justifyDirection == 'j') {
				justifyDirection = 'Full';
			}
			formatDoc('justify'+justifyDirection);
		} else if (calledFunction == 'style') {
			formatDoc('formatBlock', styleSelect.value);
		} else if (calledFunction == 'hideToolbar') {
			if (deviceType != 'desktop' && !document.getElementById('edit-bar').contains(document.activeElement)) {
				if (document.getElementById('currentFileType').textContent != '.odt' &&
						(target.id === 'editor' || target.id === 'hide-keyboard-button')) {
					document.querySelector('.edit-header').classList.remove('hidden');
					document.getElementById('edit-bar').classList.add('hidden');
				}
				document.getElementById('header-close-file').style.visibility = '';
				document.getElementById('hide-keyboard-button').classList.add('hidden');
			}
		} else if (calledFunction == 'showToolbar') {
			if (deviceType != 'desktop') {
				if (document.getElementById('currentFileType').textContent != '.odt' &&
						(target.id === 'editor' || target.id === 'hide-keyboard-button')) {
					document.querySelector('.edit-header').classList.add('hidden');
					document.getElementById('edit-bar').classList.remove('hidden');
				}
				document.getElementById('header-close-file').style.visibility = 'hidden';
				document.getElementById('hide-keyboard-button').classList.remove('hidden');
			}
		} else if (calledFunction == 'hyperlink') {
			if (target.getAttribute(eventAttribute + '-dialog')) {
				formatDoc('createLink', document.getElementById('web-address').value);
				regions.navBack();
			} else {
				var key = editorMessageProxy.registerMessageHandler(function(e) {
					var createLink = e.data.commandStates.createLink;
					if (createLink.state) {
						document.getElementById('web-address').value = createLink.value;
					}
					regions.nav('hyperlink');
				}, null, true);
				editorMessageProxy.postMessage({
					command: "query-command-states",
					commands: ["createLink"],
					key: key
				});

			}
		} else if (calledFunction == 'image') {
			if (target.getAttribute(eventAttribute + '-location')) {
				// Get location
				var location = target.getAttribute(eventAttribute + '-location');

				// Close location window
				regions.navBack();

				// Pick image based on location
				if (location == 'internal') {
					var pick = new MozActivity({
						name: "pick",
						data: {
							type: ["image/*"]
						}
					});

					pick.onsuccess = function () {
						var image = this.result.blob;
						var reader = new FileReader();

						// Read blob
						reader.addEventListener("loadend", function() {
							formatDoc('insertImage', reader.result);
						});

						reader.readAsDataURL(image);
					};

					pick.onerror = function () {
					};
				} else {
					if (target.getAttribute(eventAttribute + '-dialog') == 'true') {
						formatDoc('insertImage', document.getElementById('image-address').value);
					} else {
						regions.nav('image-web');
					}
				}
			} else {
				if (navigator.mozSetMessageHandler) {
					// Web Activities are supported, allow user to choose them or web URI
					regions.nav('image-location');
				} else {
					// Just allow web URIs
					regions.nav('image-web');
				}
			}
		} else if (calledFunction == 'table') {
			if (target.getAttribute(eventAttribute + '-dialog')) {
				if (parseInt(document.getElementById('table-rows').value) &&
						parseInt(document.getElementById('table-columns').value)) {
					var rows = parseInt(document.getElementById('table-rows').value);
					var cols = parseInt(document.getElementById('table-columns').value);
				} else {
					firetext.notify(navigator.mozL10n.get('valid-integer-value'));
					return;
				}

				// Make sure # is above 0
				if ((rows > 0) && (cols > 0)) {
					// Generate HTML
					var output = '<table class="default" style="width: 100%;">';
					for (var r = 0; r < rows; r++) {
						output += '<tr>';
						for (var c = 0; c < cols; c++) {
							output += '<td><br></td>';
						}
						output += '</tr>';
					}

					// Output HTML
					output += '</table>';
					formatDoc('insertHTML', output);

					// Nav Back
					regions.navBack();
				}
			} else {
				regions.nav('table');
			}
		} else if (calledFunction == 'openPageSetup') {
			var key = editorMessageProxy.registerMessageHandler(function(e) {
				var values = e.data.propertyValues;
				var size = [values.width, values.height];
				if(parseFloat(values.width) <= parseFloat(values.height)) {
					document.getElementById('page-orientation-portrait').checked = true;
				} else {
					size.reverse();
					document.getElementById('page-orientation-landscape').checked = true;
				}
				document.getElementById('page-size').value = size.join(' ');
				document.getElementById('page-margin').value = values.margin.replace('in', '"').replace(/[^\d"]+$/, ' $&').replace('.', .5.toLocaleString().indexOf(',') !== -1 ? ',' : '.');
				regions.nav('page-setup');
			}, null, true);
			editorMessageProxy.postMessage({
				command: "get-properties",
				properties: ["width", "height", "margin"],
				key: key
			});
		} else if (calledFunction == 'pageSetup') {
			var size = document.getElementById('page-size').value.split(' ');
			if(document.getElementById('page-orientation-landscape').checked) {
				size = size.reverse();
			}
			var width = size[0];
			var height = size[1];
			var margin = document.getElementById('page-margin').value.replace('"', 'in').replace(/\s+/g, '').replace(',', '.');
			editorMessageProxy.postMessage({
				command: "set-properties",
				properties: {
					width: width,
					height: height,
					margin: margin,
				}
			});
		} else if (calledFunction == 'clearRecents') {
			firetext.recents.reset();
			firetext.notify(navigator.mozL10n.get('recents-eliminated'));
		} else if (calledFunction == 'font') {
			formatDoc("fontName", target.value);
		} else if (calledFunction == 'fontSize') {
			formatDoc("fontSize", target.value);
		}
	}
}


/* Miscellaneous
------------------------*/
function checkDevice() {
	var width, height;
	if (window.screen) {
		width = window.screen.availWidth;
		height = window.screen.availHeight;
	} else if (window.innerWidth && window.innerHeight) {
		width = window.innerWidth;
		height = window.innerHeight;
	} else if (document.body) {
		width = document.body.clientWidth;
		height = document.body.clientHeight;
	}
	if (width <= 766) {
		deviceType = 'mobile';
	} else {
		deviceType = 'desktop';
	}

	// Let Bugsense know about device type
	if (bugsenseInitialized) {
		Bugsense.addExtraData('device_type', deviceType);
	}
};

function clearCreateForm() {
	document.getElementById('createDialogFileName').value = '';
	document.getElementById('createDialogFileType').value = '.html';
	extIcon();
	setTimeout(function() { // Fix autocapitalization in Chrome mobile
		document.getElementById('createDialogFileName').blur();
		document.getElementById('createDialogFileName').focus();
	});
}

function spinner(state) {
	if (state == 'hide') {
		loadSpinner.classList.remove('shown');
	} else {
		loadSpinner.classList.add('shown');
	}
}

function editFullScreen(enter) {
	if (enter === true ||
				enter != false &&
				!html.classList.contains('fullscreen')) {	// current working methods
		// Make app fullscreen
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		// Exit fullscreen
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}
	}
}

function onFullScreenChange() {
	if (
		document.fullscreenElement ||
		document.mozFullScreenElement ||
		document.webkitFullscreenElement
	) {
		// Special editor UI
		html.classList.add('fullscreen');
		document.querySelector('#editor-zen-button span').classList.remove('icon-fullscreen');
		document.querySelector('#editor-zen-button span').classList.add('icon-fullscreen-exit');
	} else {
		// Regular editor UI
		html.classList.remove('fullscreen');
		document.querySelector('#editor-zen-button span').classList.remove('icon-fullscreen-exit');
		document.querySelector('#editor-zen-button span').classList.add('icon-fullscreen');
	}
}

function onFullScreenError() {
	firetext.notify('Could not enter into fullscreen.');
}

document.addEventListener('fullscreenchange', onFullScreenChange);
document.addEventListener('mozfullscreenchange', onFullScreenChange);
document.addEventListener('webkitfullscreenchange', onFullScreenChange);

document.addEventListener('fullscreenerror', onFullScreenError);
document.addEventListener('mozfullscreenerror', onFullScreenError);
document.addEventListener('webkitfullscreenerror', onFullScreenError);

/* Print button
------------------------*/
function initPrintButton(callback) {
	app.modules.load('modules/printButton/printButton.html', printButton, function() {
		printButtonCommunication(function(){
			callback();
		});
	}, true, true);
}

function printButtonCommunication(callback) {
	printButton.onload = null;
	printButton.onload = function() {
		// See: scripts/messages.js
		var printButtonMessageProxy = new MessageProxy();
		printButtonMessageProxy.setSend(printButton.contentWindow);
		printButtonMessageProxy.setRecv(window);

		printButtonMessageProxy.registerMessageHandler(function(printEvt) {
			var key = editorMessageProxy.registerMessageHandler(function(editorEvt){
				printButtonMessageProxy.postMessage({
					command: printEvt.data.key,
					content: editorEvt.data.content,
					'automatic-printing-failed': navigator.mozL10n.get('automatic-printing-failed')
				});
			}, null, true);
			editorMessageProxy.postMessage({
				command: "get-content-html",
				rich: true,
				key: key
			});
			regions.nav('edit');
		}, "print-button-pressed");
	}
}

function setDocumentTitle() {
	var selectedRegion = document.querySelector('section.current');
	if (selectedRegion) {
		if (selectedRegion.id == 'welcome') {
			document.title = 'Firetext';
		} else if (selectedRegion.id == 'edit') {
			document.title = currentFileName.textContent+currentFileType.textContent+' - Firetext';
		} else {
			document.title = selectedRegion.querySelector('header:first-child h1').textContent+' - Firetext';
		}
	}
}

function visitURL(browseLocation) {
	// Fix for empty locations
	if(!browseLocation || browseLocation==''){
		firetext.notify(navigator.mozL10n.get('not-functional-link'));
		return;
	}

	// Open a new tab
	window.open(browseLocation);
}

function christmas() {
	var testDate = new Date(),
			testMonth = testDate.getMonth()+1,
			testDay = testDate.getDate();
	if (testMonth === 12 && (testDay >= 13 && testDay <= 31)) {
		doChristmas();
		window.addEventListener('night.changed', doChristmas);
	}

	function doChristmas() {
		var wordmark = document.getElementById('welcome-wordmark');
		if (html.classList.contains('night') != true) {
			if (!wordmark.hasAttribute('data-original-src')) {
				wordmark.setAttribute('data-original-src',wordmark.src);
			}
			wordmark.src = 'style/icons/app/firetext_christmas.svg';
		} else {
			if (wordmark.hasAttribute('data-original-src')) {
				wordmark.src = wordmark.getAttribute('data-original-src');
			}
		}

		// Override theme color
		themeColor.setAttribute('content', '#034f20');
	}
}
