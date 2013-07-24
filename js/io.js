/* Globals
------------------------*/
var storage, deviceAPI;


/* Init
------------------------*/
function startIO(api) {
  if (navigator.getDeviceStorage('sdcard') && api != 'file') {
    // Use deviceStorage API
    deviceAPI = 'deviceStorage';
    storage = navigator.getDeviceStorage('sdcard');
    
    // Check for SD card
    var request = storage.available();

    request.onsuccess = function () {
      // The result is a string
      if (this.result != "available") {
        deviceAPI = null;
        storage = null;
        alert("The SDCard on your device is shared, and thus not available.");
        startIO('file');
        return;
      }
    }

    request.onerror = function () {
      deviceAPI = null;
      storage = null;
      alert("Unable to get the space used by the SDCard: " + this.error);
      startIO('file');
      return;
    }
  } else {
    // Check for File API
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
    if (deviceAPI == 'deviceStorage') {
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
    } else if (deviceAPI == 'file') {
      // TODO
    } else {
      alert('Firetext can not find an internal storage method :(');
    }
  } else if (location == 'dropbox') {
    directory = ('/' + directory);
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
  extIcon();
}

function saveFromEditor(banner, spinner) {
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
  if (spinner != false) {
    spinner = true;
  }
  saveFile(directory, filename, filetype, content, banner, function(){}, location, spinner);
} 

function saveFile(directory, filename, filetype, content, showBanner, callback, location, showSpinner) {
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
    if (deviceAPI == 'deviceStorage') {
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
    } else if (deviceAPI == 'file') {
      // TODO
    } else {
      alert('Firetext can not find an internal storage method :(');
    }
  } else if (location == 'dropbox' && dropboxClient) {
    if (showSpinner != false) {
      loadSpinner.classList.add('shown');
    }
    dropboxClient.writeFile(filePath, contentBlob, function() { loadSpinner.classList.remove('shown'); callback(); });    
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
  loadFile(directory, filename, filetype, function(result, error) {
    if (!error) {
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
          break;
      }             
    
      // Add listener to update views
      watchDocument(filetype);
  
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
  }, location); 
}

function loadFile(directory, filename, filetype, callback, location) {
  var filePath = (directory + filename + filetype);
  if (location == '' | location == 'internal' | !location) {
    if (deviceAPI == 'deviceStorage') {
      var req = storage.get(filePath);
      req.onsuccess = function () {
        var reader = new FileReader();
        reader.readAsText(req.result);
        reader.onerror = function () {
          alert('Load unsuccessful :( \n\nInfo for gurus:\n"' + this.error.name + '"');
          callback(this.error.name, true);
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
    } else if (deviceAPI == 'file') {
      // TODO
    } else {
      alert('Firetext can not find an internal storage method :(');    
    }
  } else if (location = 'dropbox' && dropboxClient) {
    loadSpinner.classList.add('shown');
    dropboxClient.readFile(filePath, function(e, d) {
      loadSpinner.classList.remove('shown');
      if (!e) {
        callback(d);
      } else {
        callback(e.status, true);
      }
    });
  }
}

function deleteFile(name, location) {
  var path = name;
  if (!location | location == '' | location == 'internal') {
    if (deviceAPI == 'deviceStorage') {
      var req = storage.delete(path);
      req.onsuccess = function () {
        // Code to show a deleted banner
      }
      req.onerror = function () {
        // Code to show an error banner (the alert is temporary)
        alert('Delete unsuccessful :(\n\nInfo for gurus:\n"' + this.error.name + '"');
      }
    } else if (deviceAPI == 'file') {
      // TODO
    } else {
      alert('Firetext can not find an internal storage method :(');    
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