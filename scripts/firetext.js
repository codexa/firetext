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

// Misc
firetext.initialized = new CustomEvent('firetext.initialized');
firetext.isInitialized = false;
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var themeColor = document.getElementById("theme-color");
var loadSpinner, editor, toolbar, toolbarInterval, editWindow, editState, rawEditor, tabRaw, tabDesign, printButton;
var deviceType, fileChanged, saveTimeout, saving, urls={}, version = '0.4';
var bold, boldCheckbox, italic, italicCheckbox, justifySelect, strikethrough, strikethroughCheckbox;
var underline, underlineCheckbox;
var locationLegend, locationSelect, locationDevice, locationDropbox;
var bugsenseInitialized = false, bugsenseKey = '';
var editorMessageProxy, editorURL;

// Lists
var welcomeDocsList, welcomeDeviceArea, welcomeDeviceList, openDialogDeviceArea, openDialogDeviceList;
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
	
			// Navigate to welcome
			regions.nav('welcome');
		
			// Check for recent file, and if found, load it.
			if (firetext.settings.get('autoload') == 'true') {
				var lastDoc = [firetext.settings.get('autoload.dir'), firetext.settings.get('autoload.name'), firetext.settings.get('autoload.ext'), firetext.settings.get('autoload.loc')];
				if (firetext.settings.get('autoload.wasEditing') == 'true') {
					// Wait until Dropbox is authenticated
					if (lastDoc[3] == 'dropbox') {
						if (firetext.settings.get('dropbox.enabled') == 'true') {
							window.addEventListener('cloud.dropbox.authed', function() {
								loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
								spinner('hide');
							});
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
			} else {
				spinner('hide');
			}
		
			// Create listeners
			initListeners();

			// Dispatch init event
			window.dispatchEvent(firetext.initialized);
			firetext.isInitialized = true;
		});	
	});
};

function initModules(callback) {
	// Initialize Bugsense
	bugsenseInit();
	
	// Initialize urls
	initURLs(function(){
		// Modify links in menu
		fixMenu();		
    
		// Initialize cloud services
		cloud.init();
	});
	
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
	initPrintButton(function() {
		
	});
}

function initElements() {
	// Misc
	loadSpinner = document.getElementById('loadSpinner');
	spinner();
	tabDesign = document.getElementById('tab-design');
	tabRaw = document.getElementById('tab-raw');
	editor = document.getElementById('editor');
	rawEditor = document.getElementById('rawEditor');
	toolbar = document.getElementById('edit-zone');
	editWindow = document.getElementById('edit');
	locationLegend = document.getElementById('locationLegend');
	locationSelect = document.getElementById('createDialogFileLocation');	
	printButton = document.getElementById('printButton');
	
	// Lists
	welcomeDocsList = document.getElementById('welcome-docs-list');
	welcomeDeviceArea = document.getElementById('welcome-device-area');
	welcomeDeviceList = document.getElementById('welcome-device-list');
	openDialogDeviceArea = document.getElementById('open-dialog-device-area');
	openDialogDeviceList = document.getElementById('open-dialog-device-list');
	welcomeRecentsArea = document.getElementById('welcome-recents-area');
	welcomeRecentsList = document.getElementById('welcome-recents-list');
	welcomeDropboxArea = document.getElementById('welcome-dropbox-area');
	welcomeDropboxList = document.getElementById('welcome-dropbox-list');
	openDialogDropboxArea = document.getElementById('open-dialog-dropbox-area');
	openDialogDropboxList = document.getElementById('open-dialog-dropbox-list');

	// Formatting
	bold = document.getElementById('bold');
	boldCheckbox = document.getElementById('boldCheckbox');
	italic = document.getElementById('italic');
	italicCheckbox = document.getElementById('italicCheckbox');
	justifySelect = document.getElementById('justify-select');
	strikethrough = document.getElementById('strikethrough');
	strikethroughCheckbox = document.getElementById('strikethroughCheckbox');
	underline = document.getElementById('underline');
	underlineCheckbox = document.getElementById('underlineCheckbox');
}

function initListeners() {	
	// Add event listeners
	toolbar.addEventListener(
		'mousedown', function mouseDown(event) {
			event.preventDefault();
			event.target.classList.toggle('active');
		}
	);
	toolbar.addEventListener(
		'mouseup', function mouseDown(event) {
			if (event.target.classList.contains('sticky') != true) {
				event.target.classList.remove('active');
			}
		}
	);
	welcomeDocsList.addEventListener(
		'contextmenu', function contextmenu(event) {
			event.preventDefault();
			editDocs();
		}
	);
}

function initURLs(callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('post','http://firetext.codexa.bugs3.com/',true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("Connection", "close");
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status == 200) {
			urls = JSON.parse(xhr.responseText);
		}
	}
	xhr.addEventListener("loadend", function(){
		callback();
	});
	xhr.send('request=urls&version='+version);
}

function fixMenu() {
	var tempElements = [];
	var urlNames = ['about','support','credits','rate'];

	// Find empty urls
	urlNames.forEach(function(v){
		if (!urls[v]) {
			tempElements = addMenuElementsToArray(tempElements, document.querySelectorAll('[data-type="sidebar"] nav [data-click-location="'+v+'"]'));
		}
	});

	// Remove list items
	for (var i = 0; i < tempElements.length; i++) {
		var tempParent = tempElements[i].parentNode.parentNode;
		if (tempParent) {
			tempParent.removeChild(tempElements[i].parentNode);
		}
	}

	// Remove empty lists
	var tempLists = document.querySelectorAll('[data-type="sidebar"] nav ul');
	for (var i = 0; i < tempLists.length; i++) {
		if (tempLists[i].childElementCount == 0) {
			if (tempLists[i].previousElementSibling) {
				tempLists[i].parentNode.removeChild(tempLists[i].previousElementSibling);
			}
			tempLists[i].parentNode.removeChild(tempLists[i]);
		}
	}
}

function addMenuElementsToArray(array, elements) {
	for (var i = 0; i < elements.length; i++) {
		array.push(elements[i]);
	}
	return array;
}


/* Add dialog
------------------------*/
function updateAddDialog() {
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
	if (bugsenseKey) {
		if (firetext.settings.get('stats.enabled') != 'false' &&
				!bugsenseInitialized) {
			Bugsense.initAndStartSession({ appname: 'Firetext', appVersion: version, apiKey: bugsenseKey });
			bugsenseInitialized = true;
		}
	}
}


/* Doc lists
------------------------*/
function updateDocLists(lists) {
	if (!lists) {
		lists = [];
		lists.push('all');
	}
	
	if (lists.indexOf('all') != '-1' | lists.indexOf('recents') != '-1') {
		// Recents
		buildDocList(firetext.recents.get(), [welcomeRecentsList], "recent-documents", 'internal', true);
	}
		
	if (lists.indexOf('all') != '-1' | lists.indexOf('internal') != '-1') {
		// Internal
		spinner();
		firetext.io.enumerate('/', function(DOCS) {
			buildDocList(DOCS, [welcomeDeviceList, openDialogDeviceList], "documents-found", 'internal');
			spinner('hide');
		});
	}
		
	if (lists.indexOf('all') != '-1' | lists.indexOf('cloud') != '-1') {
		// Cloud
		cloud.updateDocLists(lists);
	}
}

function completeHTML(tableHTML) {
/*
		Purpose: given a incomplete HTML string <a><b><c>text</c> should complete html <a><b><c>text</c></b></a>
		Test cases:
				var tableHTML = "<table><tbody><tr><td><b>1</b></td><th>2</th><td>3</td></tr>";
				//							 012345678901234567890123456789012345678901234567890123456789
				//							 0				 1				 2				 3				 4				 5 
				console.log( completeHTML(tableHTML) );
				//Should produce <table><tbody><tr><td><b>1</b></td><th>2</th><td>3</td></tr></tbody></table>
*/
		var r = /(<[a-zA-Z]+[ >]+|<\/[a-zA-Z]+>)/;
		var i=0;
		var tooManyIterations=50;
		var bail = false;
		var tagSense = new Array();
		//
		i += tableHTML.substr(i).search(r);
		var rResult = r.exec(tableHTML.substr(i));
		if( (rResult != null) && (rResult.length > 0) ) {
				if( rResult[0].indexOf("</") >= 0 ) {
						var tag = rResult[0].substr(2,rResult[0].length - 3 )
						tagSense.pop();
				} else {
						var tag = rResult[0].substr(1,rResult[0].length - 2 );
						tagSense.push(tag);
				}
		}
		//
		while(r.test( tableHTML.substr(i) ) && !bail) {
				i += tableHTML.substr(i).search(r) + 1;
				var rResult = r.exec(tableHTML.substr(i));
				if( (rResult != null) && (rResult.length > 0) ) {
						if( rResult[0].indexOf("</") >= 0 ) {
								var tag = rResult[0].substr(2,rResult[0].length - 3 )
								var t = tagSense.pop();
								if(t != tag) {
										console.warn("completeHTML() argument contains broken HTML");
								}
						} else {
								var tag = rResult[0].substr(1,rResult[0].length - 2 );
								tagSense.push(tag);
						}
				}
				if(tooManyIterations-- <= 0) {
						bail = true;
						console.warn("infinate loop avoided");
				}
		}
		while(tagSense.length > 0) {
				var t = tagSense.pop();
				tableHTML += "</" + t + ">";	 
		}
		return tableHTML;
}

function cleanForPreview(text, documentType) {
	/*
		Test cases:
				console.log( cleanForPreview("1sdf 2sdf 3sfd 4sdf-5sdf 6sdf 7sdf", ".txt") );
				console.log( cleanForPreview("1sdf 2sdf 3sfd 4sdf-5sdf-6sdf 7sdf", ".txt") );
				console.log( cleanForPreview("1sdf 2sdf 3sfd 4sdf 5sdf-6sdf 7sdf", ".txt") );
				console.log( cleanForPreview("1sdf 2sdf-3sfd-4sdf-5sdf-6sdf-7sdf", ".txt") );
				console.log( cleanForPreview("1sdf 2sdf-3sfd-4sdf-5sdf-", ".txt") );
				console.log( cleanForPreview("1sdf-2sdf-3sfd-4sdf-5sdf-6sdf-7sdf", ".txt") );
				console.log( cleanForPreview("wwww1 wwww2 wwww3 wwww4 wwww5 wwww6", ".txt") );
				//														01234567890123456789012345678901234567890
				//														0					1					2					3					4
				
				var html1 = "<b>1sdf</b> <u>2sdf</u> <i>3sdf</i> 4sdf-5sdf 6sdf 7sdf";
				var html7 = "<b>1sdf</b>-<u>2sdf</u>-<i>3sfd</i>-4sdf-5sdf-6sdf-7sdf";
				console.log( cleanForPreview(html1, ".html") );
				console.log( cleanForPreview(html7, ".html") );
	*/
	var approxPreviewWidthInCharacters = 100;
	var additionalCharactersTillWhitespace = 5;
	var regWhiteSpace
	switch(documentType) {
		default:
		case ".txt":
			if(text.length <= approxPreviewWidthInCharacters) {
				return text;
			} else {
				var nextWhitespace = text.substr(approxPreviewWidthInCharacters).search(/\s/);
				var reverseText = text.substr(0,approxPreviewWidthInCharacters).split("").reverse().join("");
				var prevWhitespace = reverseText.search(/\s/);
				if( nextWhitespace == -1 ) {
						nextWhitespace = text.length - approxPreviewWidthInCharacters;
				}
				if( (prevWhitespace > additionalCharactersTillWhitespace) && (nextWhitespace > additionalCharactersTillWhitespace)) {
						//Next whitespace too far
						return text.substr(0, approxPreviewWidthInCharacters) + "...";
				} else if( nextWhitespace <= prevWhitespace	 ) {
						//Closest whitespace in less than additionalCharactersTillWhitespace more characters
						return text.substr(0, approxPreviewWidthInCharacters + nextWhitespace);
				} else {
						//Closest whitespace is before our truncation point
						return text.substr(0, approxPreviewWidthInCharacters - prevWhitespace) + (prevWhitespace == -1 ? "..." : "" );
				}
			}
			return text.replace(/\n/g," ").substr(0, approxPreviewWidthInCharacters);
		case ".html":
				var htmlNode = (new DOMParser()).parseFromString(text, "text/html").documentElement;
				var textStripped = htmlNode.textContent;
				var textTruncated = cleanForPreview(textStripped, ".txt");
				textTruncated = textTruncated.replace(/\.\.\.$/, "");
				var textTruncatedSplit = textTruncated.split("");
				for (var i = 0; i < textTruncatedSplit.length; i++) {
					textTruncatedSplit[i] = textTruncatedSplit[i].replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
				}
				var r = "^(<[a-zA-Z]+.*?>)*" + textTruncatedSplit.join(".*?(<[a-zA-Z]+.*?>)*");
				var rDynamic = new RegExp(r);
				if(! rDynamic.test(text) ) {
					return textTruncated;
				} else {
					var htmlOfTextWanted = rDynamic.exec(text)[0];
					var remainingHTML = text.substr(htmlOfTextWanted.length);
					var firstNewTagAfterHTMLOfTextWanted = remainingHTML.search(/<[a-zA-Z]/);
					if(firstNewTagAfterHTMLOfTextWanted != -1) {
							remainingHTML = remainingHTML.substr(0, firstNewTagAfterHTMLOfTextWanted);
							htmlOfTextWanted = htmlOfTextWanted + remainingHTML;
					}
					//htmlOfTextWanted has the html we want, however it may also contain line breaks
					htmlNode = (new DOMParser()).parseFromString(htmlOfTextWanted, "text/html").documentElement;
					var nodesToRemove = htmlNode.getElementsByTagName("br");
					while( (nodesToRemove != undefined) && (nodesToRemove.length > 0) ) {
							nodesToRemove[0].parentElement.insertBefore(document.createTextNode(" "), nodesToRemove[0]);
							nodesToRemove[0].parentElement.removeChild(nodesToRemove[0]);
							nodesToRemove = htmlNode.getElementsByTagName("br");
					}
					nodesToRemove = htmlNode.getElementsByTagName("img");
					while( (nodesToRemove != undefined) && (nodesToRemove.length > 0) ) {
							nodesToRemove[0].parentElement.insertBefore(document.createTextNode(" "), nodesToRemove[0]);
							nodesToRemove[0].parentElement.removeChild(nodesToRemove[0]);
							nodesToRemove = htmlNode.getElementsByTagName("img");
					}
					nodesToRemove = htmlNode.getElementsByTagName("hr");
					while( (nodesToRemove != undefined) && (nodesToRemove.length > 0) ) {
							nodesToRemove[0].parentElement.insertBefore(document.createTextNode(" "), nodesToRemove[0]);
							nodesToRemove[0].parentElement.removeChild(nodesToRemove[0]);
							nodesToRemove = htmlNode.getElementsByTagName("hr");
					}
					htmlNode.innerHTML = completeHTML(htmlNode.innerHTML);
					var bodyTag = htmlNode.getElementsByTagName("body");
					if (bodyTag[0]) {
						htmlNode = bodyTag[0];
					}
					//the following will take a table of n rows and make it a table of 1 row
					var nodesToChange = htmlNode.getElementsByTagName("table");
					for(var t=0; t<nodesToChange.length; t++) {
						var table = nodesToChange[t];
						var trs = table.getElementsByTagName("tr");
						for(var i=1; i<trs.length; i++) {
								var tds = trs[i].getElementsByTagName("td");
								var ths = trs[i].getElementsByTagName("th");
								var cells = new Array();
								for(var j=0; j<tds.length; j++) {
										cells.push(tds[j]);
								}
								for(var j=0; j<ths.length; j++) {
										cells.push(ths[j]);
								}
								cells.sort(sortByCellIndex);
								for(var j=0; j<cells.length; j++) {
										trs[0].appendChild(cells[j]);
								}
						}
						while( (trs != undefined) && (trs.length > 1) ) {
								trs[1].parentElement.removeChild( trs[1] );
								trs = table.getElementsByTagName("tr");
						}
					}
					return htmlNode.innerHTML;
				}
				return text;
		case ".docx":
			console.warn("cleanForPreview docx not implemented text = %s.", text);
			return text;
	}
}

function sortByCellIndex(a,b) {
		return a.cellIndex - b.cellIndex;
}

function buildDocListItems(DOCS, listElms, description, output, location, preview) {
	// Handle description
	if (!description) {
		description = '';
	}
	
	if (preview && firetext.settings.get('previews.enabled') != 'false') {	 
		switch (DOCS[0][2]) {
			case ".txt":
				description = firetext.parsers.plain.parse(cleanForPreview(description, DOCS[0][2]), "HTML");
				break;
			case ".docx":
				var tmp = document.createElement("DIV");
				var docx = new DocxEditor(description);
				tmp.appendChild(docx.HTMLout());
				description = tmp.innerHTML;
			case ".html":
				description = cleanForPreview(description, DOCS[0][2]);
				break;
			default:
				break;
		}
	}
	
	// UI refinements
	var icon, directory;
	if (location != 'internal' && location && location != '') {
		icon = ('document-' + location);
	} else {
		icon = 'document';
		location = 'internal';
	}
	if (DOCS[0][0].charAt(0) == '/' && DOCS[0][0].length > 1) {
		directory = DOCS[0][0].slice(1);
	} else {
		directory = DOCS[0][0];
	}
			
	// Generate item
	output += '<li class="fileListItem" data-click="loadToEditor" data-click-directory="'+DOCS[0][0]+'" data-click-filename="'+DOCS[0][1]+'" data-click-filetype="'+DOCS[0][2]+'" data-click-location="'+location+'">';
	output += '<a href="#">';
	if (description != '' && firetext.settings.get('previews.enabled') != 'false') {
		output += '<div class="fileItemDescription">'+description+'</div>';
	}
	output += '<div class="fileItemInfo">';
	output += '<aside class="pack-end icon-arrow"></aside>';	
	output += '<p class="fileItemName">'+DOCS[0][1]+DOCS[0][2]+'</p>'; 
	output += '<p class="fileItemPath">'+directory+DOCS[0][1]+DOCS[0][2]+'</p>';
	output += '</div>'; 
	output += '</a></li>';
	
	// Display output HTML
	for (var i = 0; i < listElms.length; i++) {
		listElms[i].innerHTML = output;
	}
	
	// Base case
	if (DOCS.length <= 1) {		 
		return;
	}
	
	// Per doc locations
	if (DOCS[1][4] && DOCS[1][4] != location) {
		location = DOCS[1][4];
	}
	
	// build next item
	if (preview == true) {
		firetext.io.load(DOCS[1][0], DOCS[1][1], DOCS[1][2], function (result) {
			buildDocListItems(DOCS.slice(1, DOCS.length), listElms, result, output, location, preview);
		}, location);
	} else {
		buildDocListItems(DOCS.slice(1, DOCS.length), listElms, null, output, location);	
	}
}

function buildDocList(DOCS, listElms, display, location, preview) {
	if (listElms && DOCS) {
		// Make sure list is not an edit list
		for (var i = 0; i < listElms.length; i++) {
			listElms[i].setAttribute("data-type", "list");
		}
		
		if (DOCS.length > 0) {
			// Per doc locations
			if (DOCS[0][4] && DOCS[0][4] != location) {
				location = DOCS[0][4];
			}
			
			// build next item
			if (preview == true) {
				firetext.io.load(DOCS[0][0], DOCS[0][1], DOCS[0][2], function (result) {
					buildDocListItems(DOCS, listElms, result, "", location, preview);
				}, location);
			} else {
				buildDocListItems(DOCS, listElms, null, "", location, preview);			 
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

function buildEditDocList(DOCS, listElm, display, location) {
	if (listElm != undefined) {
		// Output HTML
		var output = "";
		
		if (DOCS.length != 0) {
			// generate each list item
			for (var i = 0; i < DOCS.length; i++) {
				output += '<li>';
				output += '<label class="pack-checkbox danger"><input type="checkbox" class="edit-selected"><span></span></label>';
				output += '<p data-location="'+location+'">'+DOCS[i][0]+DOCS[i][1]+'<em>'+DOCS[i][2]+'</em></p>';
				output += '</li>';
			}		
			 
			// Make list an edit list
			listElm.setAttribute("data-type","edit");
		} else {
			output += '<li style="margin-top: -5px" class="noLink">';
			output += '<p style="padding: 1.5rem 0 0.5rem;" data-l10n-id="no-'+display+'">'+navigator.mozL10n.get('no-'+display)+'</p>';
			output += '<p style="padding-bottom: 1rem;" data-l10n-id="click-compose-icon-to-create">'+navigator.mozL10n.get('click-compose-icon-to-create')+'</p>';
			output += '</li>';
		}
		
		// Display output HTML
		listElm.innerHTML = output;
	}
}


/* Display
------------------------*/
// Make save banner hidden after 4 seconds
function hideSaveBanner() {
	window.setTimeout(function() {
		document.getElementById("save-banner").hidden = true;
	}, 4000);
}

// Show the banner
function showSaveBanner() {
	document.getElementById("save-banner").hidden = false;
	hideSaveBanner();
}
	
// File Extension Icon on Create new file
function extIcon() {
	var extf = document.getElementById('extIconFile');
	var option = document.getElementById('createDialogFileType').value;
	if (option != '.html' && option != '.txt' && option != '.docx' && option != '.doc' && option != '.rtf') {
		option = 'default';
	}
	extf.src = ('style/icons/extensions/'+option.replace(/./, '')+'.png');
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
			// Initialize Raw Editor
			rawEditor.setAttribute('contentEditable', 'true');
	
			// Nav to the design tab
			regions.tab(document.querySelector('#editTabs'), 'design');
			callback();

			// Initialize Night Mode
			night();
		}, "init-success", true);

		editorMessageProxy.registerMessageHandler(function(e) {
			fileChanged = true;
			if(e.data.filetype === ".html") {
				rawEditor.textContent = e.data.html;
			}
			autosave();
		}, "doc-changed");

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

function watchDocument(filetype) {
	if(filetype === ".html") {
		prettyPrint();
		// Add listener to update design
		rawEditor.addEventListener('input', function() {
			fileChanged = true;
			var callbackKey = editorMessageProxy.registerMessageHandler(function(e) { autosave(); }, null, true);
			editorMessageProxy.postMessage({
				command: "load",
				content: rawEditor.textContent,
				filetype: ".html",
				key: callbackKey
			});
		});
		rawEditor.addEventListener('blur', function() {
			prettyPrint();
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
				saveTimeout = window.setTimeout(saveFromEditor, 1000);
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
		// Clear lists
		welcomeDeviceList.innerHTML = '';
		welcomeDropboxList.innerHTML = '';
		
		updateDocLists(['all']);
		editState = false;
		welcomeRecentsArea.style.display = 'block';
		document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 5rem)';
		regions.navBack();
	} else {		
		welcomeRecentsArea.style.display = 'none';
		document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 12rem)';
		editState = true;
		
		// Clear lists
		welcomeDeviceList.innerHTML = '';
		welcomeDropboxList.innerHTML = '';
		
		// Code to build list
		firetext.io.enumerate('/', function(result) {
			buildEditDocList(result, welcomeDeviceList, 'documents-found', 'internal');
		});
		if (firetext.settings.get('dropbox.enabled') == 'true' && cloud.dropbox.client) {
			cloud.dropbox.enumerate('/Documents', function(DOCS) {
				buildEditDocList(DOCS, welcomeDropboxList, "dropbox-documents-found", 'dropbox');
			});
		}
		watchCheckboxes();
		
		regions.nav('welcome-edit-mode');
	}
}

function watchCheckboxes() {
	// Only use this function in edit mode
	if (editState == true) {
		var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
		for (var i = 0; i < checkboxes.length; i++ ) {
			checkboxes[i].onchange = updateSelectButton;
		}
	}
}

function updateSelectButton() {
	if (numSelected() == 0) {
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
				alert(navigator.mozL10n.get('no-files-selected'));
				return;
			}
			if (confirmDeletion != true) {
				return;
			}
		}
		
		// Delete selected files
		for (var i = 0; i < selected.length; i++) {
			// Get filename
			var filename = selected[i].parentNode.parentNode.getElementsByTagName("P")[0].textContent;
			var location = selected[i].parentNode.parentNode.getElementsByTagName("P")[0].getAttribute('data-location');
			
			// Remove from RecentDocs
			firetext.recents.remove((filename + location), true);
			
			// Delete file
			firetext.io.delete(filename, location);
			
			// Remove from list
			var elm = selected[i].parentNode.parentNode;
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
				boldCheckbox.checked = true;
			} else {
				bold.classList.remove('active');
				boldCheckbox.checked = false;
			}
			
			// Italic
			if (commandStates.italic.state) {
				italic.classList.add('active');
				italicCheckbox.checked = true;
			} else {
				italic.classList.remove('active');
				italicCheckbox.checked = false;
			}
			
			// Justify
			if (commandStates.justifyCenter.state) {
				justifySelect.value = 'Center';
			} else if (commandStates.justifyFull.state) {
				justifySelect.value = 'Justified';
			} else if (commandStates.justifyRight.state) {
				justifySelect.value = 'Right';
			} else {
				justifySelect.value = 'Left';
			}
			
			// Underline
			if (commandStates.underline.state) {
				underline.classList.add('active');
				underlineCheckbox.checked = true;
			} else {
				underline.classList.remove('active');
				underlineCheckbox.checked = false;
			}
			
			// Strikethrough
			if (commandStates.strikeThrough.state) {
				strikethrough.classList.add('active');
				strikethroughCheckbox.checked = true;
			} else {
				strikethrough.classList.remove('active');
				strikethroughCheckbox.checked = false;
			}
		}, null, true);
		editorMessageProxy.postMessage({
			command: "query-command-states",
			commands: ["bold", "italic", "justifyCenter", "justifyFull", "justifyRight", "underline", "strikeThrough"],
			key: key
		});
	}
}

/* Actions (had to do this because of CSP policies)
------------------------*/ 
document.addEventListener('click', function(event) {
	processActions('data-click', event.target);
});

document.addEventListener('submit', function(event) {
	processActions('data-submit', event.target);
});

document.addEventListener('keypress', function(event) {
	if (event.key == 13 | event.keyCode == 13) {
		processActions('data-enter', event.target);
	}
});

document.addEventListener('mousedown', function(event) {
	processActions('data-mouse-down', event.target);
});

document.addEventListener('change', function(event) {
	processActions('data-change', event.target);
});

document.addEventListener('focus', function(event) {
	processActions('data-focus', event.target);
});

document.addEventListener('blur', function(event) {
	processActions('data-blur', event.target);
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
		processActions(('data-swipe-'+direction), event.target); 
	});
}

function processActions(eventAttribute, target) {
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
		} else if (calledFunction == 'sidebar') {
			regions.sidebar(target.getAttribute(eventAttribute + '-id'), target.getAttribute(eventAttribute + '-state'));
		} else if (calledFunction == 'saveFromEditor') {
			saveFromEditor(true, true);
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
			
			// Clear toolbar update interval
			window.clearInterval(toolbarInterval);
			
			// Navigate to the welcome screen
			regions.nav('welcome');
		} else if (calledFunction == 'formatDoc') {
			formatDoc(target.getAttribute(eventAttribute + '-action'), target.getAttribute(eventAttribute + '-value'));
			if (target.getAttribute(eventAttribute + '-back') == 'true') {
				regions.navBack();
			}
		} else if (calledFunction == 'createFromDialog') {
			createFromDialog();
		} else if (calledFunction == 'uploadFromDialog') {
			uploadFromDialog();
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
			regions.tab(target.parentNode.id, target.getAttribute(eventAttribute + '-name'));
		} else if (calledFunction == 'clearForm') {
			if (target.parentNode.children[0]) {
				target.parentNode.children[0].value = '';
			}
		} else if (calledFunction == 'clearCreateForm') {
			clearCreateForm();
		} else if (calledFunction == 'fullscreen') {
			if (target.getAttribute(eventAttribute + '-state') == 'off') {
				editFullScreen(false);		
			} else {
				editFullScreen();
			}
		} else if (calledFunction == 'browser') {      
			// Get location
			var browseLocation = '';
			if (target.getAttribute(eventAttribute + '-location') == 'about') {
				browseLocation = urls.about;
			} else if (target.getAttribute(eventAttribute + '-location') == 'credits') {
				browseLocation = urls.credits;
			} else if (target.getAttribute(eventAttribute + '-location') == 'rate') {
				browseLocation = urls.rate;
			} else if (target.getAttribute(eventAttribute + '-location') == 'support') {
				browseLocation = urls.support;
			} else {
				browseLocation = target.getAttribute(eventAttribute + '-location');
			}

			// Fix for empty locations
			if(!browseLocation || browseLocation==''){
				alert(navigator.mozL10n.get('not-functional-link'));
				return;
			}

			// Open a new tab
			window.open(browseLocation);
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
		} else if (calledFunction == 'hideToolbar') {
			if (deviceType != 'desktop') {
				if (document.getElementById('currentFileType').textContent != '.txt' &&
						target.id === 'editor') {
					document.getElementById('edit-bar').style.display = 'none';
					editor.classList.add('no-toolbar');
				}
				document.getElementById('hide-keyboard-button').classList.add('shown');
			}
		} else if (calledFunction == 'showToolbar') {
			if (document.getElementById('currentFileType').textContent != '.txt' &&
					target.id === 'editor') {
				document.getElementById('edit-bar').style.display = 'block';
				editor.classList.remove('no-toolbar');
			}
			document.getElementById('hide-keyboard-button').classList.remove('shown');
		} else if (calledFunction == 'hyperlink') {
			if (target.getAttribute(eventAttribute + '-dialog')) {
				formatDoc('createLink', document.getElementById('web-address').value);
				regions.navBack();
				regions.navBack();
			} else {
				var key = editorMessageProxy.registerMessageHandler(function(e) {
					var createLink = e.data.commandStates.createLink;
					console.log(createLink);
					if (createLink.state) {
						document.getElementById('web-address').value = createLink.value;
					} else {
						document.getElementById('web-address').value = '';				
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
							regions.navBack();
						});
				
						reader.readAsDataURL(image);
					};

					pick.onerror = function () {
					};				
				} else {
					if (target.getAttribute(eventAttribute + '-dialog') == 'true') {
						formatDoc('insertImage', document.getElementById('image-address').value);
						regions.navBack();
					} else {
						regions.nav('image-web');
					}
				}
				
				// Clear inputs
				document.getElementById('image-address').value = null;
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
					alert(navigator.mozL10n.get('valid-integer-value'));
					return;
				}
			
				// Make sure # is above 0
				if ((rows > 0) && (cols > 0)) {
					// Generate HTML
					var output = '<style>table.default { border: 1px solid #afafaf; width: 100%; }';
					output += ' table.default td { border: 1px solid #afafaf; }</style>';
					output += '<table class="default">';
					for (var r = 0; r < rows; r++) {
						output += '<tr>';
						for (var c = 0; c < cols; c++) {
							output += '<td></td>';
						}
						output += '</tr>';
					}
					
					// Output HTML
					output += '</table>';
					formatDoc('insertHTML', output);
					
					// Nav Back
					regions.navBack();
					regions.navBack();					
				}
			} else {
				regions.nav('table');
			}
			
			// Clear inputs
			document.getElementById('table-rows').value = null;
			document.getElementById('table-columns').value = null;
		} else if (calledFunction == 'clearRecents') {
			firetext.recents.reset();
			alert(navigator.mozL10n.get('recents-eliminated'));
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
	
	if (window.opera) {
		alert(navigator.mozL10n.get('warning-unsupported-technology'));
	}
};

function clearCreateForm() {
	document.getElementById('createDialogFileName').value = '';
	document.getElementById('createDialogFileType').value = '.html';
	extIcon();
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
		document.querySelector('#editor-zen-button span').classList.remove('icon-fs');
		document.querySelector('#editor-zen-button span').classList.add('icon-efs');
	} else {
		// Regular editor UI
		html.classList.remove('fullscreen');
		document.querySelector('#editor-zen-button span').classList.remove('icon-efs');
		document.querySelector('#editor-zen-button span').classList.add('icon-fs');
	}
}

document.addEventListener('fullscreenchange', onFullScreenChange);
document.addEventListener('mozfullscreenchange', onFullScreenChange);
document.addEventListener('webkitfullscreenchange', onFullScreenChange);

document.addEventListener('fullscreenerror', onFullScreenError);
document.addEventListener('mozfullscreenerror', onFullScreenError);
document.addEventListener('webkitfullscreenerror', onFullScreenError);

firetext.alert = function(message) {
	alert(message);
};

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
				var filename = document.getElementById('currentFileName').textContent;
				var filetype = document.getElementById('currentFileType').textContent;
				
				printButtonMessageProxy.postMessage({
					command: printEvt.data.key,
					filename: filename,
					filetype: filetype,
					content: editorEvt.data.content,
					'automatic-printing-failed': navigator.mozL10n.get('automatic-printing-failed')
				});
			}, null, true);
			editorMessageProxy.postMessage({
				command: "get-content-html",
				key: key
			});
			regions.nav('edit');
		}, "print-button-pressed");
	}
}
