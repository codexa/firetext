'use strict'; 

var editor, toolbar, editWindow;
var storage = navigator.getDeviceStorage("sdcard");

function init() {
  nav('welcome');
  editor = document.getElementById('editor');
  toolbar = document.getElementById('edit-bar');
  editWindow = document.getElementById('edit');
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
}

window.addEventListener('hashchange', function() {
  if (location.hash == '#back') {
    window.history.back();
    window.history.back();
  } else if (document.getElementById(location.hash.replace(/#/, ''))) {
    if (document.querySelector('.current')) { 
      if (document.getElementById(location.hash.replace(/#/, '')).getAttribute('role') == 'dialog') {
        document.querySelector('.current').classList.add('parent');
      } else {
        document.querySelector('.current').classList.remove('parent');      
      }
      document.querySelector('.current').classList.remove('current');
    }
    document.getElementById(location.hash.replace(/#/, '')).classList.add('current');
  } else {
  }
});

function nav(location) {
  document.location.hash = location;
}

function navBack() {
  document.location.hash = 'back';
}
 
function formatDoc(sCmd, sValue) {
  document.execCommand(sCmd, false, sValue);
}  

function saveFromEditor() {
  saveFile(document.getElementById('currentFileName').textContent, editor.innerHTML);
} 

function saveFile(filename, content) {
  var contentBlob = new Blob([content], { "type" : "text\/html" });
  var filePath = ("Documents/" + filename);
  var req = storage.addNamed(contentBlob, filePath);
  req.onsuccess = function () {
    alert('Save successful!');
  };
  req.onerror = function () {
    if (this.error.name == "NoModificationAllowedError") {
      var req2 = storage.delete(filePath);
      req2.onsuccess = function () {
          saveFile(filename, content);
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

function loadToEditor(filename) {
  editor.innerHTML = '';
  document.getElementById('currentFileName').textContent = filename;
  loadFile(filename, function(result) {
    editor.innerHTML = result;
  });
}

function loadFile(filename, callback) {
  var filePath = ("Documents/" + filename);
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
