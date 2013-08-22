/*
 * Copyright (C) Codexa Organisation 2013.
 * Licenced released under the GPLv3. 
 * See LICENSE in "resources/liscence/gpl.txt"
 * or at http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict';


/* Globals
------------------------*/
// Misc
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var loadSpinner, editor, toolbar, editWindow, doc, editState, rawEditor, tabRaw, tabDesign, deviceType;
var bold, italic, underline, boldCheckbox, italicCheckbox, underlineCheckbox;
var locationLegend, locationSelect, locationDevice, locationDropbox, locationGoogle;

// Lists
var welcomeDocsList, welcomeDeviceArea, welcomeDeviceList, openDialogDeviceArea, openDialogDeviceList;
var welcomeRecentsArea, welcomeRecentsList;

// Dropbox
var welcomeDropboxArea, welcomeDropboxList, openDialogDropboxArea, openDialogDropboxList;
var dropboxClient = undefined, dropboxAuthed = new CustomEvent('dropboxAuthed');

// Google Drive
var welcomeGoogleArea, welcomeGoogleList, openDialogGoogleArea, openDialogGoogleList;


/* Start
------------------------*/ 
window.addEventListener('DOMContentLoaded', function() { init(); });
window.setInterval(updateToolbar, 100);

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
    alert('Warning: Your browser does not support some vital Firetext technology.  Please download Firefox from https://mozilla.org/firefox');
  }
}


/* Initalize
------------------------*/
function init() {
  // Find device type
  checkDevice();

  /* Select important elements for later */
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
  welcomeGoogleArea  = document.getElementById('welcome-google-area');
  welcomeGoogleList = document.getElementById('welcome-google-list');
  openDialogGoogleArea = document.getElementById('open-dialog-google-area');
  openDialogGoogleList = document.getElementById('open-dialog-google-list');
  
  // Formatting
  bold = document.getElementById('bold');
  italic = document.getElementById('italic');
  underline = document.getElementById('underline');
  boldCheckbox = document.getElementById('boldCheckbox');
  italicCheckbox = document.getElementById('italicCheckbox');
  underlineCheckbox = document.getElementById('underlineCheckbox');
  
  // Initalize recent docs
  RecentDocs.init();
  
  // Initialize the editor
  initEditor();
  
  // Init extIcon
  extIcon();
  
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
  editWindow.addEventListener(
    'mouseenter', function mouseDown(event) {
      editor.focus();
    }
  );
  
    welcomeDocsList.addEventListener(
    'contextmenu', function contextmenu(event) {
      editDocs();
    }
  );
  
  // Initialize IO
  startIO(null, function() {
    // Update Doc Lists
    updateDocLists();
    
    // Initialize sharing
    initSharing();
    
    // Check for recent file, and if found, load it.
    if (getSettings('autoload') == 'true') {
      var lastDoc = [getSettings('autoload.dir'), getSettings('autoload.name'), getSettings('autoload.ext'), getSettings('autoload.loc')];
      if (getSettings('autoload.wasEditing') == 'true') {
        // Wait until Dropbox is authenticated
        if (lastDoc[3] == 'dropbox') {
          if (getSettings('dropbox.enabled') == 'true') {
            window.addEventListener('dropboxAuthed', function() {
              loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
              spinner('hide');
            });
          } else {
            nav('welcome');
            spinner('hide');
          }
        } else {
          loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
          spinner('hide');
        }
      } else {
        nav('welcome');
        spinner('hide');
      }
    } else {
      nav('welcome');
      spinner('hide');
    }
  });
  
  // Initialize Night Mode
  night();
}

function initSharing() {
  // Dropbox
  if (getSettings('dropbox.enabled') == 'true') {
    // Error Handler
    dropAPI.client.onError.addListener(function (error) {
      if (window.console) {
        console.error(error);
        dropboxError(error);
      }
    });
    if (!dropboxClient) {
      // Auth
      dropAPI.client.authenticate(function(error, client) {
        if (!error && client) {
          // Set client
          dropboxClient = client;
          
          // Code to get dropbox files
          updateDocLists();
          
          // Show UI elements
          welcomeDropboxArea.style.display = 'block';
          openDialogDropboxArea.style.display = 'block';
          locationDropbox = document.createElement('option');
          locationDropbox.textContent = 'Dropbox';
          locationSelect.appendChild(locationDropbox);
          
          // Dispatch auth event
          window.dispatchEvent(dropboxAuthed);
          
          // This is a workaround for a very weird bug...          
          setTimeout(updateAddDialog, 1);
        } else {
          // Hide/Remove UI elements
          welcomeDropboxArea.style.display = 'none';
          openDialogDropboxArea.style.display = 'none';
          if (locationDropbox) {
            locationSelect.removeChild(locationDropbox);
            locationDropbox = undefined;
          }
        }                
      });
    } 
  } else {
    // Hide/Remove UI elements
    welcomeDropboxArea.style.display = 'none';
    openDialogDropboxArea.style.display = 'none';
    if (locationDropbox) {
      locationSelect.removeChild(locationDropbox);
      locationDropbox = undefined;
    }
    
    // Sign out
    if (dropboxClient) {
      dropAPI.client.signOut();
      dropboxClient = undefined;
    }
    
    // Close any open Dropbox files
    if (document.getElementById('currentFileLocation').textContent == 'dropbox') {
      nav('welcome');
      nav('settings');    
    }
    
    // Remove Dropbox recents
    var dropRecents = RecentDocs.get();
    for (var i = 0; i < dropRecents.length; i++) {
      if (dropRecents[i][3] == 'dropbox') {
        RecentDocs.remove([dropRecents[i][0], dropRecents[i][1], dropRecents[i][2]], dropRecents[i][3]);
      }
    }  
  }
  
  // Google Drive
  if (getSettings('gdrive.enabled') == 'true') {
    // Code to get Google Drive files
    updateDocLists();
    
    // Show UI Elements
    welcomeGoogleArea.style.display = 'block';
    openDialogGoogleArea.style.display = 'block';
    locationGoogle = document.createElement('option');
    locationGoogle.textContent = 'Google Drive';
    locationSelect.appendChild(locationGoogle);
  } else {
    // Hide/Remove UI elements
    welcomeGoogleArea.style.display = 'none';
    openDialogGoogleArea.style.display = 'none';
    if (locationGoogle) {
      locationSelect.removeChild(locationGoogle);
      locationGoogle = undefined;
    }
    
    // Remove Google recents
    var driveRecents = RecentDocs.get();
    for (var i = 0; i < driveRecents.length; i++) {
      if (driveRecents[i][3] == 'gdrive') {
        RecentDocs.remove([driveRecents[i][0], driveRecents[i][1], driveRecents[i][2]], driveRecents[i][3]);
      }
    }
  }
  
  updateAddDialog();
}

function updateAddDialog() {
  if (locationSelect.length < 1) {
    // Disable elements
    document.getElementById('add-dialog-create-button').style.pointerEvents = 'none';
    document.getElementById('add-dialog-create-button').style.color = '#999';
    document.querySelector('#add [role="main"]').style.display = 'none';
    
    // Create notice
    if (!document.getElementById('no-storage-notice')) {
      var noStorageNotice = document.createElement('div');
      noStorageNotice.id = 'no-storage-notice';
      noStorageNotice.classList.add('redAlert');
      noStorageNotice.textContent = 'You have not set up a storage method!';
      document.getElementById('add').insertBefore(noStorageNotice, document.querySelector('#add [role="main"]'));
    }
  } else {
    // Enable elements
    document.getElementById('add-dialog-create-button').style.pointerEvents = 'auto';
    document.getElementById('add-dialog-create-button').style.color = 'auto';
    document.querySelector('#add [role="main"]').style.display = 'block';
  
    // Remove notice if present
    if (document.getElementById('no-storage-notice')) {
      document.getElementById('no-storage-notice').parentNode.removeChild(document.getElementById('no-storage-notice'));
    }
  }
}


/* Recent Docs
------------------------*/
// RecentDocs Object
var RecentDocs = {};

// Initalize recent docs
RecentDocs.init = function() {
  if (localStorage["firetext.docs.recent"] == undefined) {
    localStorage["firetext.docs.recent"] = JSON.stringify([]);
  }
}

// Initalize recent docs
RecentDocs.reset = function() {
  if (localStorage["firetext.docs.recent"] != undefined) {
    localStorage["firetext.docs.recent"] = JSON.stringify([]);
  }
}

// Get recent docs
RecentDocs.get = function() {
  if (localStorage["firetext.docs.recent"] != undefined) {
    return JSON.parse(localStorage["firetext.docs.recent"]);
  }
  else {
    this.init();
    return this.get();
  }
}

// Add to recent docs
RecentDocs.add = function(file, location) {
  if (localStorage["firetext.docs.recent"] != undefined) {
    var docsTMP = this.get();
    
    file.push(location);
    
    // Remove duplicates
    for (var i = 0; i < docsTMP.length; i++) {
      if (docsTMP[i][0] == file[0] && docsTMP[i][1] == file[1] && docsTMP[i][2] == file[2] && docsTMP[i][3] == file[3]) {
        docsTMP.splice(i, 1);
        break;
      }
    }
    
    // Add item
    docsTMP.splice(0, 0, file);
    
    // Remove extra items
    if (docsTMP.length > 4) {
      docsTMP.splice(4, docsTMP.length);
    }
    
    // Save array
    localStorage["firetext.docs.recent"] = JSON.stringify(docsTMP);
  }
  else {
    this.init();
    this.add(file, location);
  }
}

// Remove from recent docs
RecentDocs.remove = function(file, location, merged) {
  if (localStorage["firetext.docs.recent"] != undefined) {
    var docsTMP = this.get();
    
    if (!merged) {
      merged = location;
    }    
    if (merged != true) {
      file.push(location);
    }
    
    // Remove item
    for (var i = 0; i < docsTMP.length; i++) {
      if (merged != true) {
        if (docsTMP[i][0] == file[0] && docsTMP[i][1] == file[1] && docsTMP[i][2] == file[2] && docsTMP[i][3] == file[3]) {
          docsTMP.splice(i, 1);
          break;
        }
      } else {
        if (file == docsTMP[i][0] + docsTMP[i][1] + docsTMP[i][2] + docsTMP[i][3]) {
          docsTMP.splice(i, 1);
          break;
        }
      }
    }
    
    // Save array
    localStorage["firetext.docs.recent"] = JSON.stringify(docsTMP);
  }
}


/* Doc lists
------------------------*/
function updateDocLists() {
  buildDocList(RecentDocs.get(), [welcomeRecentsList], "Recent Documents", 'internal');
  docsInFolder('Documents/', function(DOCS) {
    buildDocList(DOCS, [welcomeDeviceList, openDialogDeviceList], "Documents Found", 'internal');
  });
  if (getSettings('dropbox.enabled') == 'true' && dropboxClient) {
    dropboxDocsInFolder(dropboxClient, '/Documents/', function(DOCS) {
      buildDocList(DOCS, [welcomeDropboxList, openDialogDropboxList], "Dropbox Documents Found", 'dropbox');
    });
  }
}

function buildDocListItems(DOCS, listElms, description, output, location) {
  // Convert to html
  switch (DOCS[0][2]) {
    case ".txt":
      description = txt.parse(description, "HTML");
      break;
    case ".docx":
      var tmp = document.createElement("DIV");
      tmp.appendChild(description);
      description = tmp.innerHTML;
    case ".html":
    default:
      break;
  }
  
  // UI refinements
  var icon, directory;
  if (location != 'internal' && location && location != '') {
    icon = ('document-' + location);
  } else {
    icon = 'document';
    location = 'internal';
  }
  if (DOCS[0][0].charAt(0) == '/') {
    directory = DOCS[0][0].slice(1);
  } else {
    directory = DOCS[0][0];
  }
      
  // Generate item
  output += '<li class="fileListItem" data-click="loadToEditor" data-click-directory="'+DOCS[0][0]+'" data-click-filename="'+DOCS[0][1]+'" data-click-filetype="'+DOCS[0][2]+'" data-click-location="'+location+'">';
  output += '<a href="#">';
  output += '<div class="fileItemDescription">'+description+'</div>';
  output += '<div class="fileItemInfo">';
  output += '<aside class="icon icon-arrow pack-end"></aside>';  
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
  if (DOCS[1][3] && DOCS[1][3] != location) {
    location = DOCS[1][3];
  }
  
  // build next item
  loadFile(DOCS[1][0], DOCS[1][1], DOCS[1][2], function(result) {
    buildDocListItems(DOCS.slice(1, DOCS.length), listElms, result, output, location);
  }, location);
}

function buildDocList(DOCS, listElms, display, location) {
  if (listElms && DOCS) {
    // Make sure list is not an edit list
    for (var i = 0; i < listElms.length; i++) {
      listElms[i].setAttribute("data-type", "list");
    }
    
    if (DOCS.length > 0) {
      // Per doc locations
      if (DOCS[0][3] && DOCS[0][3] != location) {
        location = DOCS[0][3];
      }
      loadFile(DOCS[0][0], DOCS[0][1], DOCS[0][2], function(result) {
        buildDocListItems(DOCS, listElms, result, "", location);
      }, location);
    } else {
      // No docs message
      var output = '<li style="margin-top: -5px" class="noLink">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
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
        output += '<label class="danger"><input type="checkbox" class="edit-selected"/><span></span></label>';
        output += '<p data-location="'+location+'">'+DOCS[i][0]+DOCS[i][1]+'<em>'+DOCS[i][2]+'</em></p>';
        output += '</li>';
      }   
       
      // Make list an edit list
      listElm.setAttribute("data-type","edit");
    } else {
      output += '<li style="margin-top: -5px" class="noLink">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
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
function initEditor() {
  /* Disabled until bug 811177 is fixed
  editor.contentWindow.document.designMode = "on";
  doc = editor.contentDocument.body;
  */

  // Initialize Designer
  editor.contentWindow.document.documentElement.setAttribute('style','height: 100%; padding: 0; margin: 0;');
  editor.contentWindow.document.body.setAttribute('style','height: 100%; padding: 0; margin: 0;');
  doc = document.createElement('DIV');
  doc.setAttribute('contentEditable', 'true');
  doc.id = 'tempEditDiv';
  doc.setAttribute('style','border: none; padding: 10px; font-size: 20px; outline: none; min-height: calc(100% - 20px); word-wrap: break-word;');
  editor.contentWindow.document.body.appendChild(doc);
  doc = editor.contentWindow.document.getElementById('tempEditDiv');
  editor.contentWindow.document.execCommand('styleWithCSS', false, 'true');
  
  // Hide and show toolbar.
  // For reviewers, just in case this looks like a security problem:
  // This frame is sandboxed, so I had to add the listeners to do this.
  // The content CANNOT call any of the parents functions, so this is not a security issue.
  doc.addEventListener('focus', function (event) {
    processActions('data-focus', event.target);
  });
  doc.addEventListener('blur', function (event) {
    processActions('data-blur', event.target);
  });
  
  // Initialize Raw Editor
  rawEditor.setAttribute('contentEditable', 'true');
  
  // Nav to the design tab
  tab(document.querySelector('#editTabs'), 'design');
}

function watchDocument(filetype) {
  // Add listener to update raw
  if (filetype == '.html') {
    prettyPrint();
      
    doc.addEventListener('input', function() {
      updateViews(rawEditor, doc.innerHTML, 'text');
    });
        
    // Add listener to update design
    rawEditor.addEventListener('input', function() {
      updateViews(doc, rawEditor.textContent, 'html');
    });
    rawEditor.addEventListener('blur', function() {
      prettyPrint();
    });
  } else {
    doc.addEventListener('input', function() {
      if (getSettings('autosave') != 'false') {
        saveFromEditor(false, false);
      }    
    });    
  }
}

function updateViews(destView, source, contentType) {
  if (destView) {
    if (contentType == 'html') {
      destView.innerHTML = source;      
    } else {
      destView.textContent = source;
    }
    if (getSettings('autosave') != 'false') {
      saveFromEditor(false, false);
    }
  }
}


/* Edit Mode
------------------------*/ 
function editDocs() {
  if (editState == true) {
    updateDocLists();
    editState = false;
    welcomeRecentsArea.style.display = 'block';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 5rem)';
    navBack();
  } else {    
    welcomeRecentsArea.style.display = 'none';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 12rem)';
    editState = true;
    
    // Code to build list
    docsInFolder('Documents/', function(result) {
      buildEditDocList(result, welcomeDeviceList, 'Documents found', 'internal');
    });
    if (getSettings('dropbox.enabled') == 'true' && dropboxClient) {
      dropboxDocsInFolder(dropboxClient, '/Documents', function(DOCS) {
        buildEditDocList(DOCS, welcomeDropboxList, "Dropbox Documents Found", 'dropbox');
      });
    }
    watchCheckboxes();
    
    nav('welcome-edit-mode');
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
    document.getElementById("selectButtons").innerHTML = '<button data-click="selectAll">Select all</button><button data-click="delete" class="danger">Delete selected</button>';
  }
  else {
    // Add deselect all button
    document.getElementById("selectButtons").innerHTML = '<button data-click="deselectAll">Deselect all</button><button data-click="delete" class="danger">Delete selected</button>';
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
    var selected = Array.prototype.filter.call( checkboxes, function(elm) {
      return elm.checked;
    });
    
    if (confirmed != true && confirmed != 'true') {
      var confirmDeletion = confirm('Do you want to delete these files?');
      if (confirmDeletion != true) {
        return;
      }
    }
    
    // Delete selected files
    for (var i = 0; i < selected.length; i++ ) {
      // Get filename
      var filename = selected[i].parentNode.parentNode.getElementsByTagName("P")[0].textContent;
      var location = selected[i].parentNode.parentNode.getElementsByTagName("P")[0].getAttribute('data-location');
      
      // Remove from RecentDocs
      RecentDocs.remove((filename + location), true);
      
      // Delete file
      deleteFile(filename, location);
      
      // Remove from list
      var elm = selected[i].parentNode.parentNode;
      elm.parentNode.removeChild(elm);
    }
  }
}


/* Format
------------------------*/ 
function formatDoc(sCmd, sValue) {
  editor.contentWindow.document.execCommand(sCmd, false, sValue);
}

function updateToolbar() {
  if (doc != undefined && document.getElementById("edit").classList.contains('current')) {
    if (editor.contentDocument.queryCommandState("bold")) {
      bold.classList.add('active');
      boldCheckbox.checked = true;
    } else {
      bold.classList.remove('active');
      boldCheckbox.checked = false;
    }
    if (editor.contentDocument.queryCommandState("italic")) {
      italic.classList.add('active');
      italicCheckbox.checked = true;
    } else {
      italic.classList.remove('active');
      italicCheckbox.checked = false;
    }
    if (editor.contentDocument.queryCommandState("underline")) {
      underline.classList.add('active');
      underlineCheckbox.checked = true;
    } else {
      underline.classList.remove('active');
      underlineCheckbox.checked = false;
    }
  }
}


/* Settings
------------------------*/ 
function getSettings(name) {
  name = ("firetext.settings."+name);
  return localStorage.getItem(name);
}

function saveSettings(name, value) {
  name = ("firetext.settings."+name);
  localStorage.setItem(name, value);
}

function settings() {
  // Select elements
  var autosaveEnabled = document.querySelector('#autosave-enabled-switch');
  var autoloadEnabled = document.querySelector('#autoload-enabled-switch');
  var autozenEnabled = document.querySelector('#autozen-enabled-switch');
  var nightmodeSelect = document.querySelector('#nightmode-select');
  var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
  var gdriveEnabled = document.querySelector('#gdrive-enabled-switch');
  
  // Autosave
  if (getSettings('autosave') != 'false') {
    autosaveEnabled.setAttribute('checked', '');
  } else {  
    autosaveEnabled.removeAttribute('checked');
  }
  autosaveEnabled.onchange = function toggleAutosave() {
    saveSettings('autosave', this.checked);
    if (getSettings('autosave') != 'false') {
      document.getElementById('editorSaveButton').style.display = 'none';
      document.getElementById('zenSaveButton').style.display = 'none';
    } else {
      document.getElementById('editorSaveButton').style.display = 'inline-block';
      document.getElementById('zenSaveButton').style.display = 'inline-block';
    }
  }
  
  // Autoload
  if (getSettings('autoload') == 'true') {
    autoloadEnabled.setAttribute('checked', '');
  } else {  
    autoloadEnabled.removeAttribute('checked');
  }
  autoloadEnabled.onchange = function () {
    saveSettings('autoload', this.checked);
  }
  
  // Autozen
  if (getSettings('autozen') == 'true') {
    autozenEnabled.setAttribute('checked', '');
  } else {  
    autozenEnabled.removeAttribute('checked');
  }
  autozenEnabled.onchange = function () {
    saveSettings('autozen', this.checked);
  }
  
  // Night Mode
  if (getSettings('nightmode') == 'true') {
    nightmodeSelect.value = 'Always On';
  } else if (getSettings('nightmode') == 'false') { 
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
    saveSettings('nightmode', convertedNightValue);
    
    // Update
    night();
  });
  
  // Dropbox
  if (getSettings('dropbox.enabled') == 'true') {
    dropboxEnabled.setAttribute('checked', '');
  } else {  
    dropboxEnabled.removeAttribute('checked');
  }
  dropboxEnabled.onchange = function () {
    saveSettings('dropbox.enabled', this.checked);
    initSharing();
  }
  
  // Google Drive
  if (getSettings('gdrive.enabled') == 'true') {
    gdriveEnabled.setAttribute('checked', '');
  } else {  
    gdriveEnabled.removeAttribute('checked');
  }
  gdriveEnabled.onchange = function () {
    saveSettings('gdrive.enabled', this.checked);
    initSharing();
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
    var calledFunction = target.getAttribute(eventAttribute);
    if (calledFunction == 'loadToEditor') {
      loadToEditor(target.getAttribute(eventAttribute + '-directory'), target.getAttribute(eventAttribute + '-filename'), target.getAttribute(eventAttribute + '-filetype'), target.getAttribute(eventAttribute + '-location'));
    } else if (calledFunction == 'nav') {
      var navLocation = target.getAttribute(eventAttribute + '-location');
      if (navLocation == 'welcome' | navLocation == 'open') {
        updateDocLists();     
      } else if (navLocation == 'settings') {
        settings();
      }
      if (document.getElementById(navLocation).getAttribute('role') != 'dialog') {
        editFullScreen(false);      
      }
      nav(navLocation);
    } else if (calledFunction == 'navBack') {
      navBack();
    } else if (calledFunction == 'sidebar') {
      sidebar(target.getAttribute(eventAttribute + '-id'));
    } else if (calledFunction == 'saveFromEditor') {
      saveFromEditor();
    } else if (calledFunction == 'formatDoc') {
      formatDoc(target.getAttribute(eventAttribute + '-action'), true, target.getAttribute(eventAttribute + '-value'));
      if (target.getAttribute(eventAttribute + '-back') == 'true') {
        navBack();
      }
    } else if (calledFunction == 'createFromDialog') {
      createFromDialog();
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
      tab(target.parentNode.id, target.getAttribute(eventAttribute + '-name'));
    } else if (calledFunction == 'clearCreateForm') {
      clearCreateForm();
    } else if (calledFunction == 'fullscreen') {
      if (target.getAttribute(eventAttribute + '-state') == 'off') {
        editFullScreen(false);      
      } else {
        editFullScreen();
      }
    } else if (calledFunction == 'browser') {
      var browseLocation = '';
      var browserFrame = document.getElementById('browserFrame');
      if (target.getAttribute(eventAttribute + '-location') == 'about') {
        browseLocation = 'resources/about.html'
      } else if (target.getAttribute(eventAttribute + '-location') == 'support') {
        browseLocation = 'http://firetext.codexa.org/support'
      } else {
        browseLocation = target.getAttribute(eventAttribute + '-location');
      }
      
      // Open a new tab on desktop browsers
      if (deviceType == 'desktop') {
        window.open(browseLocation);
        return;
      }
      
      // Open the internal browser on mobile
      browserFrame.src = browseLocation;
      nav('browser');
    } else if (calledFunction == 'justify') {
      var justifyDirection = document.getElementById('justify-select').value;
      if (justifyDirection == 'Justified') {
        justifyDirection = 'Full';
      }
      formatDoc('justify'+justifyDirection);
    } else if (calledFunction == 'hideToolbar') {
      if (document.getElementById('currentFileType').textContent != '.txt') {
        document.getElementById('edit-bar').style.display = 'none';
        editor.classList.add('no-toolbar');
      }
    } else if (calledFunction == 'showToolbar') {
      if (document.getElementById('currentFileType').textContent != '.txt') {
        document.getElementById('edit-bar').style.display = 'block';
        editor.classList.remove('no-toolbar');
      }
    }
  }
}


/* Dropbox
------------------------*/ 
function dropboxError(error) {
  switch (error.status) {
  case Dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    alert('Your Dropbox is full :(');
    break;


  case Dropbox.ApiError.NETWORK_ERROR:
    alert('Your network appears to be unavailable.\n\nPlease check your connection and try again.');
    break;

  case Dropbox.ApiError.RATE_LIMITED:
  case Dropbox.ApiError.INVALID_TOKEN:
  case Dropbox.ApiError.INVALID_PARAM:
  case Dropbox.ApiError.OAUTH_ERROR:
  case Dropbox.ApiError.INVALID_METHOD:    
  case 404:  
  default:
    // TBD Code to Notify Fireanalytic
    break;
  }
}


/* Night Mode
------------------------*/
var ncss, dcss = document.getElementsByTagName("link")[25];

function night() {
  if (getSettings('nightmode') == 'true') {
    // Add nighticons.css to DOM
    if (!ncss) {
      ncss = document.createElement("link");
      ncss.rel = "stylesheet";
      ncss.type = "text/css";
      ncss.href = "style/nighticons.css";
      head.insertBefore(ncss, dcss);
    }
    
    html.classList.add('night');
    doc.style.color = '#fff';
  } else if (getSettings('nightmode') == 'false') {
    if (ncss) {
      head.removeChild(ncss);
      ncss = null;
    }
    html.classList.remove('night');
    doc.style.color = '#000';
  } else {
    if (ncss) {
      head.removeChild(ncss);
      ncss = null;
    }
    html.classList.remove('night');
    doc.style.color = '#000';
    window.addEventListener('devicelight', function(event) {
      if (getSettings('nightmode') == 'auto') {
        console.log(event.value);
        if (event.value < 50) {
          html.classList.add('night');
        } else {
          html.classList.remove('night');
        }
      }
    });    
  }
}


/* Miscellaneous
------------------------*/ 
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
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && enter != false) {  // current working methods
    // Make app fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    
    // Special editor UI
    document.querySelector('#edit header:first-child').style.display = 'none';
    document.getElementById('editTabs').setAttribute('data-items', '4.1');
    document.querySelector('#editTabs .tabToolbar').classList.add('visible');
    editor.classList.add('fullscreen');
  } else {
    // Exit fullscreen
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
    
    // Regular editor UI
    document.querySelector('#edit header:first-child').style.display = 'block';
    document.getElementById('editTabs').setAttribute('data-items', '2');
    document.querySelector('#editTabs .tabToolbar').classList.remove('visible');
    editor.classList.remove('fullscreen');
  }
}
