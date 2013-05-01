'use strict'; 

/* Globals
------------------------*/
var editor, toolbar, editWindow, docList, dirList, doc, docBrowserDirList, bold, italic, underline, editState;
var storage = navigator.getDeviceStorage("sdcard");

/* Initalize
------------------------*/
function init() {
  // Navigate to welcome screen
  nav('welcome');
  
  // Select important elements for later
  editor = document.getElementById('editor');
  toolbar = document.getElementById('edit-bar');
  editWindow = document.getElementById('edit');
  docList = document.getElementById('docs');
  dirList = document.getElementById('openDialogDirList');
  docBrowserDirList = document.getElementById('docBrowserDirList');
  bold = document.getElementById('bold');
  italic = document.getElementById('italic');
  underline = document.getElementById('underline');
  
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
  
  // Initalize recent docs
  RecentDocs.init();
  
  // Generate docs list
  updateDocLists();
  
  // Initialize the editor
  initEditor();
}

function initEditor() {
  editor.contentWindow.document.designMode = "on";
  editor.contentWindow.document.execCommand('styleWithCSS', false, 'true');
  doc = editor.contentDocument.body;
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
    
    // Remove duplicate
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

/* Doc lists
------------------------*/
function updateDocLists() {
  buildDocList(RecentDocs.get(), docList, "Recent Documents");
  docsInFolder(buildDirList);
}

function buildDirList(DOCS) {
  buildDocList(DOCS, dirList, "Documents Found");
  buildDocList(DOCS, docBrowserDirList, "Documents Found");
}

function buildDocList(DOCS, listElm, display) {
  if (listElm != undefined) {
    // Output HTML
    var output = "";
    var description = "";
    
    if (DOCS.length != 0) {     
      // generate each list item 
      for (var i = 0; i < DOCS.length; i++) {
        // TODO: Get first few words of file.
        output += '<li>'
        output += '<a href="#" onClick="loadToEditor(\'' + DOCS[i][0] + '\', \'' + DOCS[i][1] + '\')">';
        output += '<aside class="icon icon-document"></aside><aside class="icon icon-arrow pack-end"></aside>'; 
        output += '<p>'+DOCS[i][0]+'<em>'+DOCS[i][1]+'</em></p>';
        output += '<p>'+description+'</p>';
        output += '</a></li>';
      }
    } else {
      output += '<li style="margin-top: -5px">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
      output += '</li>';
    }
    
    // Make sure list is not an edit list
    listElm.setAttribute("data-type", "list");
    
    // Display output HTML
    listElm.innerHTML = output;
  }
}

function buildEditDocList(DOCS, listElm, display) {
  if (listElm != undefined) {
    // Output HTML
    var output = "";
    var description = "";
    
    if (DOCS.length != 0) {     
      // generate each list item 
      for (var i = 0; i < DOCS.length; i++) {
        // TODO: Get first few words of file.
        output += '<li>';
        output += '<label class="danger"><input type="checkbox" /><span></span></label>';
        output += '<p><input type="text" placeholder="File Name" value="'+DOCS[i][0]+'" /><em>'+DOCS[i][1]+'</em></p>';
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
      saveFile('Welcome','.html','<h1><b>Welcome</b> to <i>Firetext</i>!</h1>', false, function() {
      loadToEditor('Welcome', '.html');
    });
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

function showAllDocs() {
  document.getElementById("device").style.display = "block";
  document.getElementById("showAll").style.display = "none";
}

/* File IO
------------------------*/
function createFromDialog() {
  var filename = document.getElementById('createDialogFileName').value;
  var filetype = document.getElementById('createDialogFileType').value;
  saveFile(filename, filetype, '', false, function() {
    navBack();
    RecentDocs.add([filename,filetype]);
    loadToEditor(filename, filetype);
  });
}

function saveFromEditor() {
  var filename = document.getElementById('currentFileName').textContent;
  var filetype = document.getElementById('currentFileType').textContent;
  var content = "";
  switch (filetype) {
    case ".odml":
      odml.encode(doc.innerHTML, "HTML");
      break;
    case ".html":
      content = doc.innerHTML;
      break;
    case ".txt":
    default:
      content = doc.textContent;
      break;
  }
  saveFile(filename, filetype, content, true, false);
} 

function saveFile(filename, filetype, content, showBanner, callback) {
  var type = "text";
  switch (filetype) {
    case ".odml":
      type = "text\/odml";
      break;
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
    if (callback) {
      callback();
    }
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
  
  // Set file name and type
  document.getElementById('currentFileName').textContent = filename;
  document.getElementById('currentFileType').textContent = filetype;
  
  // Set alert banner name and type
  document.getElementById('save-banner-name').textContent = filename;
  document.getElementById('save-banner-type').textContent = filetype;
  
  // Show/hide toolbar
  switch (filetype) {
    case ".odml":
    case ".html":
      toolbar.style.display = "block";
      break;
    case ".txt":
    default:
      toolbar.style.display = "none";
      break;
  }
  
  // Fill editor
  loadFile(filename, filetype, function(result) {
    if (filetype == ".odml") {
      doc.innerHTML = odml.parse(result, "HTML");
    } else {
      doc.innerHTML = result;
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
    saveFile(name, type, result, false);
    deleteFile(fullName);
  });
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

window.setInterval(updateToolbar, 100);

/* Edit Mode
------------------------*/ 
function editDocs() {
  if (editState == true) {
    navBack();
    editState = false;
    updateDocLists();
    document.getElementById('recent-docs-list').style.display = 'block';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 5rem)';
  } else {
    nav('welcome-edit-mode');
    document.getElementById('recent-docs-list').style.display = 'none';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 12rem)';
    editState = true;
    
    // Code to build list
    docsInFolder(function(result) {
      buildEditDocList(result, docBrowserDirList, 'Documents found');
    });
  }
}

/* Actions (had to do this because of CSP policies)
------------------------*/ 
document.addEventListener('click', function(event) {
  var calledFunction = event.target.getAttribute('data-click');
  eval(calledFunction);
});

document.addEventListener('submit', function(event) {
  var calledFunction = event.target.getAttribute('data-submit');
  eval(calledFunction);
});
