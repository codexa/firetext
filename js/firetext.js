'use strict'; 

var editor, toolbar, editWindow, docList, dirList, doc, docsTMP;
var storage = navigator.getDeviceStorage("sdcard");

function init() {
  // Navigate to welcome screen
  nav('welcome');
  
  // Select important elements for later
  editor = document.getElementById('editor');
  toolbar = document.getElementById('edit-bar');
  editWindow = document.getElementById('edit');
  docList = document.getElementById('docs');
  dirList = document.getElementById('dir');
  
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
  
  // TODO: remove predefined docs list
  var docsTMP = [["foo", ".html"], ["baz", ".txt"]];
  
  // Generate recent docs list
  buildDocList(docsTMP, docList);
  
  // Initialize the editor
  initEditor();
  
  // For testing, remove before publishing
  docsInFolder(buildDirList);
}
 
function formatDoc(sCmd, sValue) {
  editor.contentWindow.document.execCommand(sCmd, false, sValue);
}

function createFromDialog() {
  var filename = document.getElementById('createDialogFileName').value;
  var filetype = document.getElementById('createDialogFileType').value;
  saveFile(filename, filetype, '');
  loadToEditor(filename, filetype);
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
  saveFile(filename, filetype, content);
} 

function saveFile(filename, filetype, content) {
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
  req.onerror = function () {
    if (this.error.name == "NoModificationAllowedError") {
      var req2 = storage.delete(filePath);
      req2.onsuccess = function () {
          saveFile(filename, filetype, content);
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
  
  // Get file name and type
  document.getElementById('currentFileName').textContent = filename;
  document.getElementById('currentFileType').textContent = filetype;
  
  // Set tool bar
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

function buildDocList(DOCS, listElm) {
  // Output HTML
  var output = "";
  
  if (DOCS.length != 0) {
    // generate each list item
    for (var i = 0; i < DOCS.length; i++) {
      output += '<li>'
      output += '<a href="#" onClick="loadToEditor(\'' + DOCS[i][0] + '\', \'' + DOCS[i][1] + '\')">';
      output += '<aside class="icon icon-document"></aside><aside class="icon icon-arrow pack-end"></aside>'; 
      output += '<p>'+DOCS[i][0]+'<em>'+DOCS[i][1]+'</em></p>';
      output += '<p>The first few words of the file go here.</p>';
      output += '</a></li>';
    }
  } else {
    output += "<li>"
    output += "<p>No Recent Documents</p>";
    output += "<p>Click the '+' icon to create one.</p>";
    output += "</li>";
  }
  
  // Display output HTML
  listElm.innerHTML = output;
}

function buildDirList(DOCS) {
  buildDocList(DOCS, dirList);
}

function docsInFolder(callback) {
  // List of documents
  var docs = [];
  
  // Get all the docs in /Documents directory
  var cursor = storage.enumerate("Documents");
  
  cursor.onerror = function() {
    alert('Load unsuccessful :\'( \n\nInfo for gurus:\n"' + cursor.error.name + '"');
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
}

function initEditor() {
  editor.contentWindow.document.designMode = "on";
  editor.contentWindow.document.execCommand('styleWithCSS', false, 'true');
  doc = editor.contentDocument.body;
}
