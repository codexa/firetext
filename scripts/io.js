/*
* IO Handler
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Namespace Container
------------------------*/ 
firetext.io = {};


/* Variables
------------------------*/
var storage, deviceAPI, locationDevice


/* Init
------------------------*/
firetext.io.init = function (api, callback) {
	if (navigator.getDeviceStorage && api != 'file') {
		// Use deviceStorage API
		deviceAPI = 'deviceStorage';
		storage = navigator.getDeviceStorage('sdcard');
		if (!storage) {
			firetext.io.init('file', callback);
			return;
		}
		
		// Check for SD card
		var request = storage.available();

		request.onsuccess = function () {
			// The result is a string
			if (this.result != "available") {
				deviceAPI = null;
				storage = null;
				alert(navigator.mozL10n.get('shared-sdcard'));
				firetext.io.init('file', callback);
				return;
			} else {
				storage.onchange = function (change) {
					updateDocLists(['internal', 'recents']);
				}
				callback();
			}
		};

		request.onerror = function () {
			deviceAPI = null;
			storage = null;
			alert(navigator.mozL10n.get('unable-to-get-sdcard') + this.error);
			firetext.io.init('file', callback);
			return;
		};
	} else {
		// Check for File API
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		if (window.requestFileSystem) {
			var onFSError = function() {
				alert(navigator.mozL10n.get('could-not-initialize-filesystem'));
				deviceAPI = 'none';
				disableInternalStorage();
				callback();
			}
			var requestFs = function(grantedBytes) {
				if(grantedBytes > 0) {
					requestFileSystem(PERSISTENT, grantedBytes, function(fs) {
						storage = fs;
						storage.root.getDirectory("Documents/", {create: true});
						deviceAPI = 'file';
						callback();
					}, onFSError);
				} else {
					onFSError();
				}
			}
			if(navigator.webkitPersistentStorage) {
				navigator.webkitPersistentStorage.requestQuota( /*5MB*/5*1024*1024, requestFs, onFSError );
			} else if(webkitStorageInfo) {
				webkitStorageInfo.requestQuota( PERSISTENT, /*5MB*/5*1024*1024, requestFs, onFSError );
			} else {
				deviceAPI = 'none';
				disableInternalStorage();
				callback();
				return;
			}
		} else {
			// If nonexistent, disable internal storage
			deviceAPI = 'none';
			disableInternalStorage();
			callback();
			return;
		}
	}
	
	// Create storage option
	locationDevice = document.createElement('option');
	locationDevice.value = 'internal';
	locationDevice.setAttribute('data-l10n-id','internal-storage');
	locationDevice.textContent = navigator.mozL10n.get('internal-storage');
	locationSelect.appendChild(locationDevice);
	updateAddDialog();
}

function disableInternalStorage() {
	welcomeDeviceArea.style.display = 'none';
	openDialogDeviceArea.style.display = 'none';
};


/* Directory IO
------------------------*/
firetext.io.enumerate = function (directory, callback) {
	if (directory) {
		// List of files
		var FILES = [];
		
		// Put directory in proper form
		if (directory[0] == '/') {
			directory = directory.slice(1);
		}
		if (directory[directory.length - 1] != '/') {
			directory = (directory + '/');
		}
	
		if (deviceAPI == 'deviceStorage') {
			// Get all the files in the specified directory
			if (directory == '/') {
				var cursor = storage.enumerate();
			} else {
				var cursor = storage.enumerate(directory.substring(0, -1));
			}
		
			cursor.onerror = function() {
				if (cursor.error.name == 'SecurityError') {
					alert(navigator.mozL10n.get('allow-sdcard'));
				} else {
					alert(navigator.mozL10n.get('load-unsuccessful')+cursor.error.name);
				}
			};
			cursor.onsuccess = function() {
				// Get file
				var file = cursor.result;
			
				// Base case
				if (!cursor.result) {						 
					// Finish
					callback(FILES);
					return FILES;
				}
				
				// Split name into parts
				var thisFile = firetext.io.split(file.name);
				thisFile[3] = file.type;
				
				// Don't get any files but docs
				if (!thisFile[1] |
						 thisFile[3] != 'text/html' &&
						 thisFile[3] != 'text/plain' &&
						 thisFile[2] != '.odt') {
					cursor.continue();
					return;				 
				}
				
				// Remove duplicates
				for (var i = 0; i < FILES.length; i++) {
					if (FILES[i][0] == thisFile[0] && FILES[i][1] == thisFile[1] && FILES[i][2] == thisFile[2]) {
					FILES.splice(i, 1);
					break;
				}
				}
				
				// Put file directory in proper form
				if (!thisFile[0] | thisFile[0] == '') {
					thisFile[0] = '/';
				}
				
				// Add to list of files
				FILES.push(thisFile);
			
				// Check next file
				cursor.continue();
			};
		} else if (deviceAPI == 'file') {
			storage.root.getDirectory(directory, {}, function(dirEntry) {
				var dirReader = dirEntry.createReader();
				var SUBDIRS = [];
				var readDirContents = function(results) {
					if(!results.length) {
						if (SUBDIRS.length) {
							for (var i = 0; i < SUBDIRS.length; i++) {
								(function(last) {
									firetext.io.enumerate(SUBDIRS[i].fullPath, function(subFiles) {
										FILES = FILES.concat(subFiles);
										if(last) {
											callback(FILES);
										}
									});
								})(i === SUBDIRS.length-1);
							}
						} else {
							callback(FILES);
						}
						return;
					} else {
						var fileparts;
						var filetype;
						var filename;
						for(var i = 0; i < results.length; i++) {
							if (results[i].isDirectory) {
								SUBDIRS.push(results[i]);
								continue;
							}
							fileparts = results[i].name.split(".");
							filetype = fileparts.length >= 2 ? "." + fileparts[fileparts.length - 1] : "";
							filename = filetype.length >= 2 ? fileparts.slice(0, -1).join("") : fileparts[0];
							if (filetype !== ".txt" && filetype !== ".html" && filetype !== ".odt") {
								continue;
							}
							FILES.push([directory, filename, filetype]);
						}
						dirReader.readEntries(readDirContents);
					}
				}
				dirReader.readEntries(readDirContents);
			}, function(err) {
				if(err.code == FileError.NOT_FOUND_ERR) {
					callback();
				} else {
					alert(navigator.mozL10n.get('load-unsuccessful')+err.code);
				}
			});
		}
		return FILES;
	}
};


/* File IO
------------------------*/

function createAndOpen(location, directory, filename, filetype, contentBlob) {
	// Save the file
	if (!location | location == '' | location == 'internal') {	
		if (deviceAPI == 'deviceStorage') {
			var filePath = (directory + filename + filetype);
			var req = storage.addNamed(contentBlob, filePath);
			req.onerror = function () {
				if (this.error.name == "NoModificationAllowedError" | this.error.name == "FileExistsError") {
					alert(navigator.mozL10n.get('file-exists'));
				}
				else {
					alert(navigator.mozL10n.get('file-creation-fail')+this.error.name);
				}
			};	
			req.onsuccess = function () {	 
				// Load to editor
				loadToEditor(directory, filename, filetype, 'internal');
				
				// Update list
				updateDocLists(['internal']);
			};
		} else if (deviceAPI == 'file') {
			storage.root.getFile(directory + filename + filetype, {create: true, exclusive: true}, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter){
					fileWriter.onwriteend = function(e) {
						e.target.write(contentBlob);
						e.target.onwriteend = function(e) {
							loadToEditor(directory, filename, filetype, 'internal');
						}
						e.target.onerror = function(e) {
							alert(navigator.mozL10n.get('file-creation-fail')+e.message);
						}
					};
					
					fileWriter.onerror = function(e) {
						alert(navigator.mozL10n.get('file-creation-fail')+e.message);
					};
					
					fileWriter.truncate(0);
				}, function(err) {
					alert(navigator.mozL10n.get('file-creation-fail')+err.code);
				});
			}, function(err) {
				if(err.code === FileError.INVALID_MODIFICATION_ERR) {
					alert(navigator.mozL10n.get('file-exists'));
				} else {
					alert(navigator.mozL10n.get('file-creation-fail')+err.code);
				}
			});
		}
	} else if (location == 'dropbox') {
		directory = ('/' + directory);
		firetext.io.save(directory, filename, filetype, contentBlob, false, function () {	 
			// Load to editor
			loadToEditor(directory, filename, filetype, location);			
				
			// Update list
			updateDocLists(['cloud']);
		}, location);
	} else {
		alert(navigator.mozL10n.get('invalid-location'));
	}
}

function createFromDialog() {
	var directory = 'Documents/';
	var location = document.getElementById('createDialogFileLocation').value; // Moved back and forth in regions.js
	var filename = document.getElementById('createDialogFileName').value;
	var filetype = document.getElementById('createDialogFileType').value;
	if (filename == null | filename == undefined | filename == '')	{
		alert(navigator.mozL10n.get('enter-name'));
		return;
	} else if (!isValidFileName(filename)) {
		alert(navigator.mozL10n.get('contains-special-characters'));
		return;
	}
	
	// Navigate back to the previous screen
	regions.navBack();
	
	// Convert location to lower case
	location = location.toLowerCase();
	
	// Get default file contents
	var contentData = firetext.io.getDefaultContent(filetype);
	
	// Get mime
	var type =  firetext.io.getMime(filetype);
	
	var contentBlob = new Blob([contentData], { "type" : type });
	
	createAndOpen(location, directory, filename, filetype, contentBlob);
	
	// Clear file fields
	document.getElementById('createDialogFileName').value = '';
	document.getElementById('createDialogFileType').value = '.html';
	extIcon();
}

function uploadFromDialog() {
	var directory = 'Documents/';
	var location = document.getElementById('createDialogFileLocation').value; // Moved back and forth in regions.js
	var files = document.getElementById('uploadDialogFiles').files;
	
	// Navigate back to the previous screen
	regions.navBack();
	
	// Convert location to lower case
	location = location.toLowerCase();
	
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		
		if(file.name.lastIndexOf(".") !== -1) {
			var filename = file.name.substr(0, file.name.lastIndexOf("."));
			var filetype = file.name.substr(file.name.lastIndexOf("."));
		} else {
			var filename = file.name;
			var filetype = "";
		}
		
		if (filename == null | filename == undefined | filename == '')	{
			continue;
		} else if (!isValidFileName(filename)) {
			alert(navigator.mozL10n.get('contains-special-characters'));
			continue;
		}
		
		if (['text/html', 'text/plain'].indexOf(file.type) === -1) {
			continue;
		}
		
		createAndOpen(location, directory, filename, filetype, file);
	}
	
	// Clear file fields
	document.getElementById('uploadDialogFiles').value = '';
}

function saveAsFromDialog() {
	var directory = 'Documents/';
	var location = document.getElementById('createDialogFileLocation').value; // Moved back and forth in regions.js
	var filename = document.getElementById('saveAsDialogFileName').value;
	var filetype = document.getElementById('currentFileType').textContent; // Current filetype
	if (filename == null | filename == undefined | filename == '')	{
		alert(navigator.mozL10n.get('enter-name'));
		return;
	} else if (!isValidFileName(filename)) {
		alert(navigator.mozL10n.get('contains-special-characters'));
		return;
	}
	
	// Navigate back to the previous screen
	regions.navBack();
	
	// Convert location to lower case
	location = location.toLowerCase();
	
	var key = editorMessageProxy.registerMessageHandler(function(e){
		createAndOpen(location, directory, filename, filetype, new Blob([StringView.base64ToBytes(e.data.content)], {type: e.data.type}));
	}, null, true);
	editorMessageProxy.postMessage({
		command: "get-content-blob",
		key: key
	});
}

function isValidFileName(filename) {
	return (/^[a-zA-Z0-9-\._ ]+$/.test(filename) && !(/\.\./.test(filename)) && !(/\.$/.test(filename)));
}

function saveFromEditor(banner, spinner) {
	// Clear save timeout
	saveTimeout = null;

	// Select elements
	var location = document.getElementById('currentFileLocation').textContent;
	var directory = document.getElementById('currentFileDirectory').textContent;
	var filename = document.getElementById('currentFileName').textContent;
	var filetype = document.getElementById('currentFileType').textContent;

	var key = editorMessageProxy.registerMessageHandler(function(e){
		firetext.io.save(directory, filename, filetype, new Blob([StringView.base64ToBytes(e.data.content)], {type: e.data.type}), banner, function(){ fileChanged = false; }, location, spinner);
	}, null, true);
	editorMessageProxy.postMessage({
		command: "get-content-blob",
		key: key
	});
}

function download() {
	// Select elements
	var location = document.getElementById('currentFileLocation').textContent;
	var directory = document.getElementById('currentFileDirectory').textContent;
	var filename = document.getElementById('currentFileName').textContent;
	var filetype = document.getElementById('currentFileType').textContent;

	var key = editorMessageProxy.registerMessageHandler(function(e){
		saveAs(new Blob([StringView.base64ToBytes(e.data.content)], {type: e.data.type}), filename + filetype);
	}, null, true);
	editorMessageProxy.postMessage({
		command: "get-content-blob",
		key: key
	});
}

function loadToEditor(directory, filename, filetype, location, editable) {
	// Clear editor
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
			document.getElementById('edit-bar').style.display = 'block';
			editor.classList.remove('no-toolbar');
			toolbar.classList.remove('hidden');
			break;
		case ".txt":
		case ".odt":
		default:
			document.getElementById('edit-bar').style.display = 'none';
			editor.classList.add('no-toolbar');
			toolbar.classList.add('hidden');
			break;
	}
	
	// Fill editor
	firetext.io.load(directory, filename, filetype, function(result, error, fileInfo) {
		if (!error) {
			initEditor(function() {
				editorMessageProxy.postMessage({
					command: "load",
					content: result,
					filetype: filetype
				});
				switch (filetype) {
					case ".txt":
					case ".odt":
						document.querySelector('[data-tab-id="raw"]').classList.add('hidden-item');
						tabRaw.classList.add('hidden-item');
						regions.tab(document.querySelector('#editTabs'), 'design');
						break;
					case ".html":
					default:
						rawEditor.textContent = result;
						document.querySelector('[data-tab-id="raw"]').classList.remove('hidden-item');
						tabRaw.classList.remove('hidden-item');	
						break;
				}
				
				// Handle read-only files
				if (editable == false) {
					formatDoc('contentReadOnly', true);
				} else {
					formatDoc('contentReadOnly', false);			
				}
				
				// Add listener to update views
				watchDocument(filetype);
				
				// Start toolbar update interval			
				toolbarInterval = window.setInterval(updateToolbar, 100);
				
				// Add file to recent docs
				firetext.recents.add([fileInfo[0], fileInfo[1], fileInfo[2]], location);
		
				// Show editor
				regions.nav('edit');
		
				// Hide save button if autosave is enabled
				if (firetext.settings.get('autosave') != 'false') {
					document.getElementById('editorSaveButton').style.display = 'none';
				} else {
					document.getElementById('editorSaveButton').style.display = 'inline-block';
				}
			})
		} else {
			alert(navigator.mozL10n.get('load-unsuccessful')+result);
		}
	}, location); 
}

firetext.io.save = function (directory, filename, filetype, contentBlob, showBanner, callback, location, showSpinner) {
	// Set saving to true
	saving = true;

	var filePath = (directory + filename + filetype);
	
	if (location == '' | location == 'internal' | !location) {	
		// Start spinner	
		if (showSpinner == true) {
			spinner();
		}
		
		// Save file
		if (deviceAPI == 'deviceStorage') {
			var req = storage.addNamed(contentBlob, filePath);
			req.onsuccess = function () {
				// Show banner or hide spinner
				if (showBanner) {
					showSaveBanner();
				}
				if (showSpinner == true) {
					spinner('hide');
				}
				
				// Finish
				saving = false;
				callback();
			};
			req.onerror = function () {
				if (this.error.name == "NoModificationAllowedError") {
					var req2 = storage.delete(filePath);
					req2.onsuccess = function () {
						firetext.io.save(directory, filename, filetype, contentBlob, showBanner, function(){
							callback();
						}, location, showSpinner);
					};
					req2.onerror = function () {
						alert(navigator.mozL10n.get('save-unsuccessful')+this.error.name);
					}
				} else {
					alert(navigator.mozL10n.get('save-unsuccessful')+this.error.name);
				}
				saving = false;
			};
		} else if (deviceAPI == 'file') {
			storage.root.getFile(directory + filename + filetype, {create: true}, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter){
					fileWriter.onwriteend = function(e) {
						e.target.onwriteend = function(e) {
							// Show banner or hide spinner
							if (showBanner) {
								showSaveBanner();
							}
							if (showSpinner == true) {
								spinner('hide');
							}
							
							// Finish
							saving = false;
							callback();
						}
						e.target.onerror = function(e) {
							saving = false;
							alert(navigator.mozL10n.get('save-unsuccessful')+e.message);
						}
						e.target.write(contentBlob);
					};
					
					fileWriter.onerror = function(e) {
						saving = false;
						alert(navigator.mozL10n.get('save-unsuccessful')+e.message);
					};
					fileWriter.truncate(0);
				}, function(err) {
					saving = false;
					alert(navigator.mozL10n.get('save-unsuccessful')+err.code);
				});
			}, function(err) {
				saving = false;
				alert(navigator.mozL10n.get('load-unsuccessful')+err.code);
			});
		}
	} else if (location == 'dropbox') {
		cloud.dropbox.save(filePath, contentBlob, showSpinner, function () { 
			// Show banner
			if (showBanner) {
				showSaveBanner();
			}
			 
			// Finish 
			saving = false;
			callback(); 
		});
	}
};

firetext.io.load = function (directory, filename, filetype, callback, location) {
	if (!directory | !filename | !filetype | !callback) {
		return;
	}
	
	// Show spinner
	spinner();

	// Put directory in proper form
	if (directory[directory.length - 1] != '/') {
		directory = (directory + '/');
	}
	if (directory == '/' && directory.length == 1) {
		directory = '';
	}
		
	var filePath = (directory + filename + filetype);
	
	if (location == '' | location == 'internal' | !location) {
		if (deviceAPI == 'deviceStorage') {
			var req = storage.get(filePath);
			req.onsuccess = function () {
				var file = req.result;
				var reader = new FileReader();
				
				if (filetype == ".odt") {
					reader.readAsArrayBuffer(file);
				} else {
					reader.readAsText(file);
				}
				
				reader.onerror = function () {	
					// Hide spinner
					spinner('hide');
					
					alert(navigator.mozL10n.get('load-unsuccessful')+this.error.name);
					callback(this.error.name, true);
				};
				reader.onload = function () {
					// Hide spinner
					spinner('hide');
					
					// Update file info
					var thisFile = firetext.io.split(file.name);
					thisFile[3] = file.type;
					
					callback(this.result,undefined,thisFile);
				};
			};
			req.onerror = function () {
				if (this.error.name == "NotFoundError") {
					// New file, leave user to edit and save it
				}
				else {
					alert(navigator.mozL10n.get('load-unsuccessful')+this.error.name);
				}
				
				// Hide spinner
				spinner('hide');
			};
		} else if (deviceAPI == 'file') {
			storage.root.getFile(directory + filename + filetype, {}, function(fileEntry) {
				fileEntry.file(function(file) {
					var reader = new FileReader();
					
					reader.onerror = function () {
						// Hide spinner
						spinner('hide');
						
						alert(navigator.mozL10n.get('load-unsuccessful')+this.error.name);
						callback(this.error.name, true);
					};
					reader.onload = function () {
						// Hide spinner
						spinner('hide');
						
						callback(this.result, undefined, [directory, filename, filetype]);
					};
					
					if (filetype === ".odt") {
						reader.readAsArrayBuffer(file);
					} else {
						reader.readAsText(file);
					}
				}, function(err) {
					alert(navigator.mozL10n.get('load-unsuccessful')+err.code);
					
					// Hide spinner
					spinner('hide');
				});
			}, function(err) {
				if (err.code === FileError.NOT_FOUND_ERR) {
					alert(navigator.mozL10n.get('load-unsuccessful')+err.code);					 
				} else {
					alert(navigator.mozL10n.get('load-unsuccessful')+err.code);
				}
				
				// Hide spinner
				spinner('hide');
			});
		}
	} else if (location = 'dropbox') {
		cloud.dropbox.load(filePath, filetype, function (result, error) {
			// Hide spinner
			spinner('hide');
					
			callback(result, error, [directory, filename, filetype]);
		});
	}
};

firetext.io.delete = function (name, location) {
	var path = name;
	if (!location | location == '' | location == 'internal') {
		if (deviceAPI == 'deviceStorage') {
			var req = storage.delete(path);
			req.onsuccess = function () {
				// Code to show a deleted banner
			}
			req.onerror = function () {
				// Code to show an error banner (the alert is temporary)
				alert(navigator.mozL10n.get('delete-unsuccessful')+this.error.name);
			}
		} else if (deviceAPI == 'file') {
			storage.root.getFile(path, {}, function(fileEntry) {
				fileEntry.remove(function() {
				}, function(err) {
					alert(navigator.mozL10n.get('delete-unsuccessful')+err.code);
				});
			}, function(err) {
				alert(navigator.mozL10n.get('delete-unsuccessful')+err.code);
			});
		}
	} else if (location == 'dropbox') {
		cloud.dropbox.delete(path);
	}
};

firetext.io.rename = function (directory, name, type, newname, location) {
	firetext.io.load(directory, name, type, function(result) {
		var fullName = (directory + name + type);
		firetext.io.save(directory, name, type, result, function () {}, location);
		firetext.io.delete(fullName, location);
	}, location);
};

firetext.io.getDefaultContent = function (extension) {
	var contentData;
	switch (extension) {
		case ".html":
			contentData = [
				'<!DOCTYPE html>',
				'<html style="max-width: 690px; position: relative; margin: 0 auto;">',
				'<head>',
				'	<meta charset="utf-8">',
				'</head>',
				'<body>',
				'	<br>',
				'</body>',
				'</html>',
				''
			].join('\n');
			break;
		case ".txt":
			contentData = ' ';
			break;
		case ".odt":
			contentData = 'blabla';
			break;
		default:
			contentData = ' ';
			break;
	}
	return contentData;
};

firetext.io.getMime = function (extension) {
	var type;
	switch (extension) {
		case ".html":
			type = "text/html";
			break;
		case ".txt":
			type = "text/plain";
			break;
		case ".odt":
			type = "application/vnd.oasis.opendocument.text";
			break;
		default:
			type = "application/octet-stream";
			break;
	}
	return type;
}

firetext.io.split = function (path) {
	var file = new Array();
	file[0] = path.substring(0, (path.lastIndexOf('/') + 1));
	file[1] = path.substring((path.lastIndexOf('/') + 1), path.lastIndexOf('.')).replace(/\//, '');
	file[2] = path.substring(path.lastIndexOf('.'), path.length).replace(/\//, '');
	if (file[1] == '' && file[2] == '') {
		file[0] = (file[0] + file[2]);
		if (file[0][file[0].length - 1] != '/') {
			file[0] = (file[0] + '/');
		}
		file[1] = '';
		file[2] = '';
	}
	return [file[0], file[1], file[2]];
};
