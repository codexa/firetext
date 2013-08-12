/* Globals
------------------------*/
var storage, deviceAPI, locationDevice;


/* Init
------------------------*/
function startIO(api) {
  if (window.navigator.getDeviceStorage && api != 'file') {
    // Use deviceStorage API
    deviceAPI = 'deviceStorage';
    storage = navigator.getDeviceStorage('sdcard');
    if (!storage) {
      startIO('file');
      return;
    }
    
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
    };

    request.onerror = function () {
      deviceAPI = null;
      storage = null;
      alert("Unable to get the space used by the SDCard: " + this.error);
      startIO('file');
      return;
    };
  } else {
    // Check for File API
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    if (window.requestFileSystem) {
      var onFSError = function() {
        alert("Error, could not initialize filesystem");
        deviceAPI = 'none';
        disableInternalStorage();
      }
      var requestFs = function(grantedBytes) {
        if(grantedBytes > 0) {
          requestFileSystem(PERSISTENT, grantedBytes, function(fs) {
            storage = fs;
            deviceAPI = 'file';
          }, onFSError);
        } else {
          onFSError
        }
      }
      if(navigator.webkitPersistentStorage) {
        navigator.webkitPersistentStorage.requestQuota( /*5MB*/5*1024*1024, requestFs, onFSError );
      } else if(webkitStorageInfo) {
        webkitStorageInfo.requestQuota( PERSISTENT, /*5MB*/5*1024*1024, requestFs, onFSError );
      } else {
        deviceAPI = 'none';
        disableInternalStorage();
        return;
      }
    } else {
      // If nonexistent, disable internal storage
      deviceAPI = 'none';
      disableInternalStorage();
      return;
    }
  }
  
  // Create storage option
  locationDevice = document.createElement('option');
  locationDevice.textContent = 'Internal';
  locationSelect.appendChild(locationDevice);
}

function disableInternalStorage() {
  welcomeDeviceArea.style.display = 'none';
  openDialogDeviceArea.style.display = 'none';
}


/* Directory IO
------------------------*/
function docsInFolder(directory, callback) {
  if (directory) {
    // List of documents
    var docs = [];
  
    if (deviceAPI == 'deviceStorage') {
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
        if (file.type !== "text/plain" && file.type !== "text/html") { // && file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
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
      };
    } else if (deviceAPI == 'file') {
      // TODO
    }
    return docs;
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
          if (entries[i][2] != '.txt' && entries[i][2] != '.html' && entries[i][2] != '.htm') { // && entries[i][2] != '.docx') {
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
      } else {
        client.mkdir(directory, function() {
          callback(dropboxDocsInFolder(client, directory, function(l) { return l; }));
        });
      }
    });
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
  banner = !!banner;
  spinner = !!spinner;
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

