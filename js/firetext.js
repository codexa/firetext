'use strict'; 

/* Globals
------------------------*/
var editor, toolbar, editWindow, docList, dirList, doc, docBrowserDirList, bold, italic, underline, editState, rawEditor, tabRaw, tabDesign;
var storage = navigator.getDeviceStorage("sdcard");

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
  docBrowserDirList = document.getElementById('docBrowserDirList');
  bold = document.getElementById('bold');
  italic = document.getElementById('italic');
  underline = document.getElementById('underline');
  
  // Init extIcon
  extIcon();
  
  // Add event listeners
  document.getElementById('createDialogFileType').addEventListener('change', function() {extIcon();});
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
  
  // Initalize recent docs
  RecentDocs.init();
  
  // Initialize the editor
  initEditor();
  
  // Navigate to welcome screen
  nav('welcome');  
  
  // Check for recent file, and if found, load it.
  var latestDocs = RecentDocs.get();
  if (latestDocs.length >= 1) {
    var latestDocs = RecentDocs.get();
    loadToEditor(latestDocs[0][0], latestDocs[0][1]);
  }
}

function initEditor() {
  /* Disabled until bug 811177 is fixed
  editor.contentWindow.document.designMode = "on";
  editor.contentWindow.document.execCommand('styleWithCSS', false, 'true');
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
  
  // Initialize Raw Editor
  rawEditor.setAttribute('contentEditable', 'true');
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
RecentDocs.add = function(file) {
  if (localStorage["firetext.docs.recent"] != undefined) {
    var docsTMP = this.get();
    
    // Remove duplicates
    for (var i = 0; i < docsTMP.length; i++) {
      if (docsTMP[i][0] == file[0] && docsTMP[i][1] == file[1]) {
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
    this.add(file);
  }
}

// Remove from recent docs
RecentDocs.remove = function(file, merged) {
  if (localStorage["firetext.docs.recent"] != undefined) {
    var docsTMP = this.get();
    
    // Remove item
    for (var i = 0; i < docsTMP.length; i++) {
      if (!merged) {
        if (docsTMP[i][0] == file[0] && docsTMP[i][1] == file[1]) {
          docsTMP.splice(i, 1);
          break;
        }
      }
      else {
        if (file == docsTMP[i][0] + docsTMP[i][1]) {
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
  docsInFolder(function(DOCS) {
    buildDocList(DOCS, [dirList, docBrowserDirList], "Documents Found");
    buildDocList(RecentDocs.get(), [docList], "Recent Documents");
  });
}

function buildDocListItems(DOCS, listElms, description, output) {
  // Remove HTML
  var tmp = document.createElement("DIV");
  tmp.innerHTML = description;
  description = tmp.textContent;
  tmp.innerHTML = description;
  description = tmp.textContent;
    
  // Generate item
  output += '<li class="fileListItem listItem" data-click="loadToEditor" data-click-filename="' + DOCS[0][0] + '" data-click-filetype="' + DOCS[0][1] + '">';
  output += '<a href="#">';
  output += '<aside class="icon icon-document"></aside><aside class="icon icon-arrow pack-end"></aside>'; 
  output += '<p>'+DOCS[0][0]+'<em>'+DOCS[0][1]+'</em></p>';
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
  
  // build next item
  loadFile(DOCS[1][0], DOCS[1][1], function(result) {
    buildDocListItems(DOCS.slice(1, DOCS.length), listElms, result, output);
  });
}

function buildDocList(DOCS, listElms, display) {
  if (listElms != undefined) {
    // Make sure list is not an edit list
    for (var i = 0; i < listElms.length; i++) {
      listElms[i].setAttribute("data-type", "list");
    }
    
    if (DOCS.length > 0) {
      loadFile(DOCS[0][0], DOCS[0][1], function(result) {
        buildDocListItems(DOCS, listElms, result, "")
      });
    } else {
      // No docs message
      var output = '<li style="margin-top: -5px">';
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

function buildEditDocList(DOCS, listElm, display) {
  if (listElm != undefined) {
    // Output HTML
    var output = "";
    
    if (DOCS.length != 0) {
      // generate each list item
      for (var i = 0; i < DOCS.length; i++) {
        output += '<li>';
        output += '<label class="danger"><input type="checkbox" class="edit-selected"/><span></span></label>';
        output += '<p>'+DOCS[i][0]+'<em>'+DOCS[i][1]+'</em></p>';
        output += '</li>';
      }
    } else {
      output += '<li style="margin-top: -5px">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
      output += '</li>';
    }
    
    // Make list an edit list
    listElm.setAttribute("data-type","edit");
    
    // Display output HTML
    listElm.innerHTML = output;
  }
}

function docsInFolder(callback) {
  // List of documents
  var docs = [];
  
  // Get all the docs in /Documents directory
  var cursor = storage.enumerate("Documents");
  
  cursor.onerror = function() {
    if (cursor.error.name == 'TypeMismatchError') {
      saveFile('firetext','.temp','A temp file!  You should not be seeing this.  If you see it, please report it to <a href="https://github.com/codexa/firetext/issues/" target="_blank">us</a>.', false, function() {
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
    if (file.type !== "text/plain" && file.type !== "text/html") {
      cursor.continue();
      return;
    }
    
    
    // At this point, the file should be vaild!
    
    // Get file properties
    var filename = "";
    var filetype = "";
    switch(file.type) {
      case "text\/plain":
        filename = file.name.substring(0, file.name.length-4);
        filetype = ".txt";
        break;
      case "text\/html":
        filename = file.name.substring(0, file.name.length-5);
        filetype = ".html";
        break;
    }
    
    // Add to list of docs
    docs.push([filename, filetype]);
    
    // Check next file
    cursor.continue();
  }
  return docs;
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
  } else {
    extf.src = "style/icons/FiretextExtic.png";
  }
}

/* File IO
------------------------*/
function createFromDialog() {
  var filename = document.getElementById('createDialogFileName').value;
  var filetype = document.getElementById('createDialogFileType').value;
  if (filename == null | filename == undefined | filename == '')  {
    alert('Please enter a name for the new file.');
    return;
  }  
  
  // Save the file
  var type = "text";
  switch (filetype) {
    case ".html":
      type = "text\/html";
      break;
    case ".txt":
      type = "text\/plain";
      break;
    default:
      break;
  }
  var contentBlob = new Blob([' '], { "type" : type });
  var filePath = ("Documents/" + filename + filetype);
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
    loadToEditor(filename, filetype);
  };
  
  // Clear file fields
  document.getElementById('createDialogFileName').value = '';
  document.getElementById('createDialogFileType').value = '.html';
}

function saveFromEditor() {
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
  saveFile(filename, filetype, content, true, function(){});
} 

function saveFile(filename, filetype, content, showBanner, callback) {
  var type = "text";
  switch (filetype) {
    case ".html":
      type = "text\/html";
      break;
    case ".txt":
      type = "text\/plain";
      break;
    default:
      break;
  }
  var contentBlob = new Blob([content], { "type" : type });
  var filePath = ("Documents/" + filename + filetype);
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
        saveFile(filename, filetype, content, showBanner, callback);
      };
      req2.onerror = function () {
        alert('Save unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
      }
    }
    else {
      alert('Save unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
    }
  };
}

function loadToEditor(filename, filetype) {
  // Clear editor
  doc.innerHTML = '';
  rawEditor.textContent = '';
  
  // If no tab is selected, nav to the design tab
  if (document.querySelector('.selected') === undefined | document.querySelector('.selected') === null) {
    tab(document.querySelector('#editTabs'), 'design');
  }
  
  // Set file name and type
  document.getElementById('currentFileName').textContent = filename;
  document.getElementById('currentFileType').textContent = filetype;
  
  // Set alert banner name and type
  document.getElementById('save-banner-name').textContent = filename;
  document.getElementById('save-banner-type').textContent = filetype;
  
  // Show/hide toolbar
  switch (filetype) {
    case ".html":
      toolbar.classList.remove('hidden');
      break;
    case ".txt":
    default:
      toolbar.classList.add('hidden');
      break;
  }
  
  // Fill editor
  loadFile(filename, filetype, function(result) {
    var content;
    
    switch (filetype) {
      case ".txt":
        content = txt.parse(result, "HTML");
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
             
        // Add listener to update raw
        doc.addEventListener('compositionupdate', function(event) {
          rawEditor.textContent = event.target.innerHTML;
        });
        doc.addEventListener('blur', function(event) {
          rawEditor.textContent = event.target.innerHTML;
        });
        
        // Add listener to update design
        rawEditor.addEventListener('compositionupdate', function(event) {
          doc.innerHTML = event.target.textContent;
        });
        rawEditor.addEventListener('blur', function(event) {
          doc.innerHTML = event.target.textContent;
        });
        
        break;
    }
  });
  
  // Add file to recent docs
  RecentDocs.add([filename, filetype]);
  
  // Show editor
  nav('edit');  
}

function loadFile(filename, filetype, callback) {
  var filePath = ("Documents/" + filename + filetype);
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
}

function deleteFile(name) {  
  var path = ('Documents/'+name);
  var req = storage.delete(path);
  req.onsuccess = function () {
    // Code to show a deleted banner
  }
  req.onerror = function () {
    // Code to show an error banner (the alert is temporary)
    alert('Delete unsuccessful :(\n\nInfo for gurus:\n"' + this.error.name + '"');
  }
}

function renameFile(name, type, newname) {
  loadFile(name, type, function(result) {
    var fullName = (name + type);
    saveFile(name, type, result, function(){});
    deleteFile(fullName);
  });
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
    docsInFolder(function(result) {
      buildEditDocList(result, docBrowserDirList, 'Documents found');
      watchCheckboxes();
    });
    
    nav('welcome-edit-mode');
  }
}

function watchCheckboxes() {
  // Only use this function in edit mode
  if (editState == true) {
    var checkboxes = docBrowserDirList.getElementsByClassName('edit-selected');
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
    var checkboxes = docBrowserDirList.getElementsByClassName('edit-selected');
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
    var checkboxes = docBrowserDirList.getElementsByClassName('edit-selected');
    for (var i = 0; i < checkboxes.length; i++ ) {
      checkboxes[i].checked = true;
    }
    updateSelectButton();
  }
}

function deselectAll() {
  // Only use this function in edit mode
  if (editState == true) {
    var checkboxes = docBrowserDirList.getElementsByClassName('edit-selected');
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
    var checkboxes = docBrowserDirList.getElementsByClassName('edit-selected');
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
      
      // Remove from RecentDocs
      RecentDocs.remove(filename, true);
      
      // Delete file
      deleteFile(filename);
      
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
    } else {
      bold.classList.remove('active');
    }
    if (editor.contentDocument.queryCommandState("italic")) {
      italic.classList.add('active');
    } else {
      italic.classList.remove('active');
    }
    if (editor.contentDocument.queryCommandState("underline")) {
      underline.classList.add('active');
    } else {
      underline.classList.remove('active');
    }
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

function processActions(eventAttribute, target) {
  if (target && target.getAttribute) {
    if (target.parentNode && target.parentNode.classList && target.parentNode.classList.contains('listItem')) {
      target = target.parentNode;
    } else if (target.parentNode && target.parentNode.parentNode && target.parentNode.parentNode.classList && target.parentNode.parentNode.classList.contains('listItem')) {
      target = target.parentNode.parentNode;
    } else if (target.parentNode && target.parentNode.parentNode && target.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.classList && target.parentNode.parentNode.parentNode.classList.contains('listItem')) {
      target = target.parentNode.parentNode.parentNode;
    } else if (target.parentNode && target.parentNode.parentNode && target.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.parentNode && target.parentNode.parentNode.parentNode.parentNode.classList && target.parentNode.parentNode.parentNode.parentNode.classList.contains('listItem')) {
      target = target.parentNode.parentNode.parentNode.parentNode;
    }
    var calledFunction = target.getAttribute(eventAttribute);
    if (calledFunction == 'loadToEditor') {
      loadToEditor(target.getAttribute(eventAttribute + '-filename'), target.getAttribute(eventAttribute + '-filetype'));
    } else if (calledFunction == 'nav') {
      if (target.getAttribute(eventAttribute + '-location') == 'welcome' | target.getAttribute(eventAttribute + '-location') == 'open') {
        updateDocLists();      
      }
      nav(target.getAttribute(eventAttribute + '-location'));
    } else if (calledFunction == 'navBack') {
      navBack();
    } else if (calledFunction == 'sidebar') {
      sidebar(target.getAttribute(eventAttribute + '-id'), target.getAttribute(eventAttribute + '-hidden'));
    } else if (calledFunction == 'saveFromEditor') {
      saveFromEditor();
    } else if (calledFunction == 'formatDoc') {
      formatDoc(target.getAttribute(eventAttribute + '-action'));
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
    } else if (calledFunction == 'settings') {
      var settingsLoc = ('settings-'+target.getAttribute(eventAttribute + '-name'));
      nav(settingsLoc);
    }
  }
}


/* Start
------------------------*/ 
window.addEventListener('DOMContentLoaded', function() { init(); });
window.setInterval(updateToolbar, 100);
