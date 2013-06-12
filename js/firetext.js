/*
 * Copyright (C) Codexa Organisation 2013.
 * Licenced released under the GPLv3. 
 * See LICENSE in "resources/liscence/gpl.txt"
 * or at http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict'; 

/* Globals
------------------------*/
var editor, toolbar, editWindow, docList, dirList, doc, docBrowserDirList, openDialogDropboxList, welcomeDocsList, openDialogDropboxArea, editState, rawEditor, tabRaw, tabDesign;
var bold, italic, underline, boldCheckbox, italicCheckbox, underlineCheckbox;
var dropboxClient, dropboxDocsList, dropboxDirList, gDriveDocsList, gDriveDirList, dropboxAuthed = new CustomEvent('dropboxAuthed');;
var storage = navigator.getDeviceStorage("sdcard");

/* Start
------------------------*/ 
window.addEventListener('DOMContentLoaded', function() { init(); });
window.setInterval(updateToolbar, 100);

/* Initalize
------------------------*/
function init() {
  // Select important elements for later
  tabDesign = document.getElementById('tab-design');
  tabRaw = document.getElementById('tab-raw');
  editor = document.getElementById('editor');
  rawEditor = document.getElementById('rawEditor');
  toolbar = document.getElementById('edit-zone');
  editWindow = document.getElementById('edit');
  docList = document.getElementById('docs');
  dirList = document.getElementById('openDialogDirList');
  dropboxDocsList = document.getElementById('dropbox-docs-list');
  dropboxDirList = document.getElementById('dropboxDirList');
  gDriveDocsList  = document.getElementById('gDrive-docs-list');
  gDriveDirList = document.getElementById('gDriveDirList');
  docBrowserDirList = document.getElementById('docBrowserDirList');
  openDialogDropboxArea = document.getElementById('open-dropbox-docs-list');
  openDialogDropboxList = document.getElementById('openDialogDropboxDirList');
  welcomeDocsList = document.getElementById('welcome-docs-list');
  bold = document.getElementById('bold');
  italic = document.getElementById('italic');
  underline = document.getElementById('underline');
  boldCheckbox = document.getElementById('boldCheckbox');
  italicCheckbox = document.getElementById('italicCheckbox');
  underlineCheckbox = document.getElementById('underlineCheckbox');
  
  // Initalize recent docs
  RecentDocs.init();
  
  // Initialize sharing
  initSharing();
  
  // Update Doc Lists
  updateDocLists();
  
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
  
  // Check for recent file, and if found, load it.
  if (getSettings('autoload') == 'true') {
    var latestDocs = RecentDocs.get();
    if (latestDocs.length >= 1) {
      // Wait until Dropbox is authenticated
      if (latestDocs[0][3] == 'dropbox') {
        window.addEventListener('dropboxAuthed', function() {
          loadToEditor(latestDocs[0][0], latestDocs[0][1], latestDocs[0][2], latestDocs[0][3]);        
        });
      } else {
        loadToEditor(latestDocs[0][0], latestDocs[0][1], latestDocs[0][2], latestDocs[0][3]);
      }
    } else {
      nav('welcome');    
    }
  } else {
    nav('welcome');
  }
}

function initSharing() {
  // Dropbox
  dropAPI.client.onError.addListener(function (error) {
    if (window.console) {
      console.error(error);
      dropboxError(error);
    }
  });
  if (getSettings('dropbox.enabled') == 'true') {
    // Auth
    dropAPI.client.authenticate(function(error, client) {
      if (!error) {
        // Set client
        dropboxClient = client;
        window.dispatchEvent(dropboxAuthed);
        
        // Code to get dropbox files
        dropboxDocsList.style.display = 'block';
        openDialogDropboxArea.style.display = 'block';
        document.getElementById('locationLegend').style.display = 'inline-block';
        updateDocLists();
      } else {
        dropboxDocsList.style.display = 'none';
        openDialogDropboxArea.style.display = 'none';
      }
    });    
  } else {
    document.getElementById('locationLegend').style.display = 'none';
    document.getElementById('locationLegend').value = 'Internal';
    dropboxDocsList.style.display = 'none';
    openDialogDropboxArea.style.display = 'none';
    
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
  
  /* Version 0.3
  // Google Drive
  if (getSettings('gDrive.enabled') == true) {
    // Code to get Google Drive files
  } else {
    gDriveDocsList.style.display = 'none';
  }
  */
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
    
    file.push(location);
    
    // Remove item
    for (var i = 0; i < docsTMP.length; i++) {
      if (!merged) {
        if (docsTMP[i][0] == file[0] && docsTMP[i][1] == file[1] && docsTMP[i][2] == file[2] && docsTMP[i][3] == file[3]) {
          docsTMP.splice(i, 1);
          break;
        }
      }
      else {
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
  buildDocList(RecentDocs.get(), [docList], "Recent Documents", 'internal');
  docsInFolder('Documents/', function(DOCS) {
    buildDocList(DOCS, [dirList, docBrowserDirList], "Documents Found", 'internal');
  });
  if (getSettings('dropbox.enabled') == 'true' && dropboxClient) {
    dropboxDocsInFolder(dropboxClient, '/', function(DOCS) {
      buildDocList(DOCS, [dropboxDirList, openDialogDropboxList], "Dropbox Documents Found", 'dropbox');
    });
  }
}

function buildDocListItems(DOCS, listElms, description, output, location) {    
  // Remove HTML
  var tmp = document.createElement("DIV");
  tmp.innerHTML = description;
  description = tmp.textContent;
  tmp.innerHTML = description;
  description = tmp.textContent;
  
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
  output += '<li class="fileListItem listItem" data-click="loadToEditor" data-click-directory="'+DOCS[0][0]+'" data-click-filename="'+DOCS[0][1]+'" data-click-filetype="'+DOCS[0][2]+'" data-click-location="'+location+'">';
  output += '<a href="#">';
  output += '<aside class="icon icon-'+icon+'"></aside><aside class="icon icon-arrow pack-end"></aside>'; 
  output += '<p>'+directory+DOCS[0][1]+'<em>'+DOCS[0][2]+'</em></p>';
  output += '<p>'+description+'</p>';
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

function docsInFolder(directory, callback) {
  if (directory) {
    // List of documents
    var docs = [];
  
    // Get all the docs in the specified directory
    var cursor = storage.enumerate(directory.substring(0, -1));
  
    cursor.onerror = function() {
      if (cursor.error.name == 'TypeMismatchError') {
        saveFile(directory, 'firetext','.temp','A temp file!  You should not be seeing this.  If you see it, please report it to <a href="https://github.com/codexa/firetext/issues/" target="_blank">us</a>.', false, function() {
          deleteFile('firetext.temp');
        });
        updateDocLists();
        return;
      } else if (cursor.error.name == 'SecurityError') {
        alert('Please allow Firetext to access your SD card.');
      } else {
        alert('Load unsuccessful :\'( \n\nInfo for gurus:\n"' + cursor.error.name + '"');
      }
    };
    cursor.onsuccess = function() {
      // Get file
      var file = cursor.result;
    
      // Base case
      if (!cursor.result) {
        // Finished
        callback(docs);
        return;
      }
    
      // Only get documents
      if (file.type !== "text/plain" && file.type !== "text/html" && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        cursor.continue();
        return;
      }
    
    
      // At this point, the file should be vaild!    
      // Get file properties
      var directoryReplace = new RegExp((directory), 'i');
      var filename = "";
      var filetype = "";
      switch(file.type) {
        case "text\/plain":
          filename = file.name.substring(0, file.name.length-4).replace(directoryReplace, '');
          filetype = ".txt";
          break;
        case "text\/html":
          filename = file.name.substring(0, file.name.length-5).replace(directoryReplace, '');
          filetype = ".html";
          break;
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          filename = file.name.substring(0, file.name.length-5).replace(directoryReplace, '');
          filetype = ".docx";
          break;
      }
    
      // Add to list of docs
      docs.push([directory, filename, filetype]);
    
      // Check next file
      cursor.continue();
    }
    return docs;
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
  if (option == ".html") {
    extf.src = "style/icons/extic/FTichtml.png";
  } else if (option == ".txt") {
    extf.src = "style/icons/extic/FTictxt.png";
  } else if (option == '.docx') {
    extf.src = "style/icons/extic/FTicdocx.png";  
  } else {
    extf.src = "style/icons/FiretextExtic.png";
  }
}

/* File IO
------------------------*/
function createFromDialog() {
  var directory = 'Documents/';
  var location = document.getElementById('createDialogFileLocation').value;
  var filename = document.getElementById('createDialogFileName').value;
  var filetype = document.getElementById('createDialogFileType').value;
  if (filename == null | filename == undefined | filename == '')  {
    alert('Please enter a name for the new file.');
    return;
  }
  
  // Convert location to lower case
  location = location.toLowerCase();
  
  // Save the file
  if (!location | location == '' | location == 'internal') {
    var type = "text";
    switch (filetype) {
      case ".html":
        type = "text\/html";
        break;
      case ".txt":
        type = "text\/plain";
        break;
      case ".docx":
        type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      default:
        break;
    }
    var contentBlob = new Blob([' '], { "type" : type });
    var filePath = (directory + filename + filetype);
    var req = storage.addNamed(contentBlob, filePath);
    req.onerror = function () {
      if (this.error.name == "NoModificationAllowedError" | this.error.name == "FileExistsError") {
        alert('This file already exists, please choose another name.'); 
      }
      else {
        alert('File creation unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
      }
    };  
    req.onsuccess = function () {  
      // Load to editor
      loadToEditor(directory, filename, filetype, 'internal');
    };
  } else if (location == 'dropbox') {
    directory = '/';
    saveFile(directory, filename, filetype, ' ', false, function () {  
      // Load to editor
      loadToEditor(directory, filename, filetype, location);      
    }, location);
  } else {
    alert('Could not create file.  Please choose a valid location.');
  }
  
  // Clear file fields
  document.getElementById('createDialogFileName').value = '';
  document.getElementById('createDialogFileType').value = '.html';
  document.getElementById('createDialogFileLocation').value = 'Internal';
}

function saveFromEditor(banner) {
  var location = document.getElementById('currentFileLocation').textContent;
  var directory = document.getElementById('currentFileDirectory').textContent;
  var filename = document.getElementById('currentFileName').textContent;
  var filetype = document.getElementById('currentFileType').textContent;
  var content = "";
  switch (filetype) {
    case ".html":
      content = rawEditor.textContent;
      break;
    case ".txt":
      content = txt.encode(doc.innerHTML, "HTML");
      break;
    default:
      content = doc.textContent;
      break;
  }
  if (banner != false) {
    banner = true;
  }
  saveFile(directory, filename, filetype, content, banner, function(){}, location);
} 

function saveFile(directory, filename, filetype, content, showBanner, callback, location) {
  var type = "text";
  switch (filetype) {
    case ".html":
      type = "text\/html";
      break;
    case ".docx":
      type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".txt":
    default:
      type = "text\/plain";
      break;
  }
  var contentBlob = new Blob([content], { "type" : type });
  
  // Special handling for .docx
  if (filetype == '.docx') {
    //contentBlob = docx(contentBlob);
  }
  
  var filePath = (directory + filename + filetype);
  
  if (location == '' | location == 'internal' | !location) {
    var req = storage.addNamed(contentBlob, filePath);
    req.onsuccess = function () {
      if (showBanner) {
        showSaveBanner();
      }
      callback();
    };
    req.onerror = function () {
      if (this.error.name == "NoModificationAllowedError") {
        var req2 = storage.delete(filePath);
        req2.onsuccess = function () {
          saveFile(directory, filename, filetype, content, showBanner, callback);
        };
        req2.onerror = function () {
          alert('Save unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
        }
      }
      else {
        alert('Save unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
      }
    };
  } else if (location == 'dropbox' && dropboxClient) {
    dropboxClient.writeFile(filePath, contentBlob, function() { });
    callback();
  }
}

function loadToEditor(directory, filename, filetype, location) {
  // Clear editor
  doc.innerHTML = '';
  rawEditor.textContent = '';
  
  // Set file name and type
  document.getElementById('currentFileLocation').textContent = location;
  document.getElementById('currentFileDirectory').textContent = directory;
  document.getElementById('currentFileName').textContent = filename;
  document.getElementById('currentFileType').textContent = filetype;
  
  // Set alert banner name and type
  document.getElementById('save-banner-name').textContent = (directory + filename);
  document.getElementById('save-banner-type').textContent = filetype;
  
  // Show/hide toolbar
  switch (filetype) {
    case ".html":
      document.getElementById('edit-bar').style.display = 'block'; // 0.2 only
      editor.classList.remove('no-toolbar'); // 0.2 only
      toolbar.classList.remove('hidden');
      break;
    case ".txt":
    default:
      document.getElementById('edit-bar').style.display = 'none'; // 0.2 only
      editor.classList.add('no-toolbar'); // 0.2 only
      toolbar.classList.add('hidden');
      break;
  }
  
  // Fill editor
  loadFile(directory, filename, filetype, function(result) {
    var content;
    
    switch (filetype) {
      case ".txt":
        content = txt.parse(result, "HTML");
        doc.innerHTML = content;
        tabRaw.classList.add('hidden');
        tab(document.querySelector('#editTabs'), 'design');
        break;
      case ".docx":
        //content = docx(result);
        doc.innerHTML = content;
        tabRaw.classList.add('hidden');
        tab(document.querySelector('#editTabs'), 'design');
        break;
      case ".html":
      default:
        content = result;
        doc.innerHTML = content;
        rawEditor.textContent = content;
        tabRaw.classList.remove('hidden');  
        prettyPrint();
        break;
    }             
        
    // Add listener to update views
    watchDocument(filetype);
    
  }, location);
  
  // Add file to recent docs
  RecentDocs.add([directory, filename, filetype], location);
  
  // Show editor
  nav('edit');
  
  // Hide save button if autosave is enabled
  if (getSettings('autosave') != 'false') {
    document.getElementById('editorSaveButton').style.display = 'none';
    document.getElementById('zenSaveButton').style.display = 'none';
  } else {
    document.getElementById('editorSaveButton').style.display = 'inline-block';
    document.getElementById('zenSaveButton').style.display = 'inline-block';
  }  
}

function loadFile(directory, filename, filetype, callback, location) {
  var filePath = (directory + filename + filetype);
  if (location == '' | location == 'internal' | !location) {
    var req = storage.get(filePath);
    req.onsuccess = function () {
      var reader = new FileReader();
      reader.readAsText(req.result);
      reader.onerror = function () {
        alert('Load unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
      };
      reader.onload = function () {
        callback(this.result);
      };
    };
    req.onerror = function () {
      if (this.error.name == "NotFoundError") {
        // New file, leave user to edit and save it
      }
      else {
        alert('Load unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
      }
    };
  } else if (location = 'dropbox' && dropboxClient) {
    dropboxClient.readFile(filePath, function(e, d) {
      callback(d);
    });
  }
}

function deleteFile(name, location) {  
  var path = name;
  if (!location | location == '' | location == 'internal') {
    var req = storage.delete(path);
    req.onsuccess = function () {
      // Code to show a deleted banner
    }
    req.onerror = function () {
      // Code to show an error banner (the alert is temporary)
      alert('Delete unsuccessful :(\n\nInfo for gurus:\n"' + this.error.name + '"');
    }
  } else if (location == 'dropbox' && dropboxClient) {
    dropboxClient.remove(path, function(e) { });
  }
}

function renameFile(directory, name, type, newname, location) {
  loadFile(directory, name, type, function(result) {
    var fullName = (directory + name + type);
    saveFile(directory, name, type, result, function(){}, location);
    deleteFile(fullName, location);
  }, location);
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
  doc.setAttribute('style','border: none; padding: 10px; font-size: 20px; outline: none; min-height: calc(100% - 20px);');
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
    doc.addEventListener('input', function() {
      updateViews(rawEditor, doc.innerHTML, 'text');
      prettyPrint();
    });
        
    // Add listener to update design
    rawEditor.addEventListener('input', function() {
      updateViews(doc, rawEditor.textContent, 'html');
    });
    rawEditor.addEventListener('blur', function() {
      prettyPrint();
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
      saveFromEditor(false);
    }
  }
}

/* Edit Mode
------------------------*/ 
function editDocs() {
  if (editState == true) {
    updateDocLists();
    editState = false;
    document.getElementById('recent-docs-list').style.display = 'block';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 5rem)';
    navBack();
  } else {    
    document.getElementById('recent-docs-list').style.display = 'none';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 12rem)';
    editState = true;
    
    // Code to build list
    docsInFolder('Documents/', function(result) {
      buildEditDocList(result, docBrowserDirList, 'Documents found', 'internal');
    });
    if (getSettings('dropbox.enabled') == 'true' && dropboxClient) {
      dropboxDocsInFolder(dropboxClient, '/', function(DOCS) {
        buildEditDocList(DOCS, dropboxDirList, "Dropbox Documents Found", 'dropbox');
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
    var selected = Array.filter( checkboxes, function(elm) {
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
      RecentDocs.remove(filename, location, true);
      
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
  var dropboxEnabled = document.querySelector('#dropbox-enabled-switch');
  
  /* Version 0.3
  var gDriveEnabled = document.querySelector('#gDrive-enabled input');
  var gDriveSettings = document.querySelector('#gDrive-settings-list');
  var gDriveUser = document.querySelector('#gDrive-settings-list'); 
  */
  
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
  
  /* Version 0.3
  // Google Drive
  gDriveEnabled.setAttribute('checked', getSettings('gDrive.enabled'))
  gDriveEnabled.onchange = function togglegDrive() {
    saveSettings('gDrive.enabled', this.checked);
  }
  */
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
      if (target.parentNode && target.parentNode.classList && target.parentNode.classList.contains('listItem')) {
        target = target.parentNode;
      } else if (target.parentNode && target.parentNode.parentNode && target.parentNode.parentNode.classList && target.parentNode.parentNode.classList.contains('listItem')) {
        target = target.parentNode.parentNode;
      } else if (target.parentNode && target.parentNode.parentNode && target.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.classList && target.parentNode.parentNode.parentNode.classList.contains('listItem')) {
        target = target.parentNode.parentNode.parentNode;
      } else if (target.parentNode && target.parentNode.parentNode && target.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.parentNode.classList && target.parentNode.parentNode.parentNode.parentNode.classList.contains('listItem')) {
        target = target.parentNode.parentNode.parentNode.parentNode;
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
      } else {
        browseLocation = target.getAttribute(eventAttribute + '-location');
      }
      browserFrame.src = browseLocation;
      nav('browser');
      editFullScreen(false);
      browserFrame.addEventListener('mozbrowsertitlechange', function (e) {
        document.getElementById('browserTitle').textContent = e.detail;      
      });
      browserFrame.addEventListener('mozbrowserclose', function () {
        navBack();      
      });
      browserFrame.addEventListener('mozbrowserloadstart', function() {
        document.getElementById('browserSpinner').classList.add('shown');
      }); 
      browserFrame.addEventListener('mozbrowserloadend', function() {
        document.getElementById('browserSpinner').classList.remove('shown');
      });
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
  case Dropbox.ApiError.INVALID_TOKEN:
    alert('The session expired, retrying...');
    dropAPI.client.authenticate(function(error, client) {});    
    break;

  case Dropbox.ApiError.OVER_QUOTA:
    // The user is over their Dropbox quota.
    // Tell them their Dropbox is full. Refreshing the page won't help.
    alert('Your Dropbox is full :(');
    break;

  case Dropbox.ApiError.RATE_LIMITED:
    alert('Dropbox API request limit was exceeded.\n\nPlease try again later.');
    break;

  case Dropbox.ApiError.NETWORK_ERROR:
    alert('Your network appears to be unavailable.\n\nPlease check your connection and try again.');
    break;
    
  case 404:
    break;
  
  case Dropbox.ApiError.INVALID_PARAM:
  case Dropbox.ApiError.OAUTH_ERROR:
  case Dropbox.ApiError.INVALID_METHOD:
  default:
    alert('A Dropbox error occured.\n\nInfo for Gurus:\n'+error.status);
  }
}

function dropboxDocsInFolder(client, directory, callback) {
  if (directory && client.readdir(directory)) {
    var docs = client.readdir(directory, function(error, entries) {
      if (!error) {
        for (var i = 0; i < entries.length; i++) {
          var dir;
          if (directory[directory.length - 1] != '/') {
            dir = (directory + '/');
          } else {
            dir = directory;
          }
          entries[i] = (dir + entries[i]);
          entries[i] = fileAddress(entries[i]);
          
          // Only get documents
          if (entries[i][2] != '.txt' && entries[i][2] != '.docx' && entries[i][2] != '.html' && entries[i][2] != '.htm') {
            entries.splice(i, 1);
            i = (i - 1);
          }
        }
        // Remove folders
        for (var i = 0; i < entries.length; i++) {
          if (Array.isArray(entries[i]) == false | entries[i][2].length == 1 | entries[i][2][0] != '.') {
            entries.splice(i, 1);
          }
        }
        for (var i = 0; i < entries.length; i++) {
          if (Array.isArray(entries[i]) == false | entries[i][2].length <= 1 | entries[i][2][0] != '.') {
            entries.splice(i, 1);
            i = (i - 1);
          }
        }
        callback(entries);
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

function fileAddress(path) {
  var file = new Array();
  file[0] = path.substring(0, (path.lastIndexOf('/') + 1));
  file[1] = path.substring((path.lastIndexOf('/') + 1), path.lastIndexOf('.')).replace(/\//, '');
  file[2] = path.substring(path.lastIndexOf('.'), path.length).replace(/\//, '');
  if (file[1] == '') {
    file[0] = (file[0] + file[2]);
    if (file[0][file[0].length - 1] != '/') {
      file[0] = (file[0] + '/');
    }
    file[2] = '';
    file[1] = '';
  }
  return [file[0], file[1], file[2]];
}
