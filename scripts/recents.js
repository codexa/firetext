/*
* Recent Docs
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Namespace Container
------------------------*/ 
firetext.recents = {};


/* Recent Docs
------------------------*/
// Initalize recent docs
firetext.recents.init = function () {
	if (localStorage["firetext.recents"] == undefined) {
		localStorage["firetext.recents"] = JSON.stringify([]);
	}
};

// Get recent docs
firetext.recents.get = function () {
	if (localStorage["firetext.recents"] != undefined) {
		return JSON.parse(localStorage["firetext.recents"]);
	} else {
		init();
		return firetext.recents.get();
	}
};

// Reset recent docs
firetext.recents.reset = function () {
	if (localStorage["firetext.recents"] != undefined) {
		localStorage["firetext.recents"] = JSON.stringify([]);
	}
};

// Add to recent docs
firetext.recents.add = function (file, location) {
	if (localStorage["firetext.recents"] != undefined) {
		var docsTMP = firetext.recents.get();
		
		// Push mimetype and location
		file.push('');
		file.push(location);
	
		// Remove duplicates
		for (var i = 0; i < docsTMP.length; i++) {
			if (docsTMP[i][0] == file[0] &&
					docsTMP[i][1] == file[1] &&
					docsTMP[i][2] == file[2] &&
					docsTMP[i][3] == file[3] &&
					docsTMP[i][4] == file[4]) {
			docsTMP.splice(i, 1);
			break;
		}
		}
		
		// Add item
		docsTMP.splice(0, 0, file);
	
		// Remove extra items
		if (docsTMP.length > 5) {
		docsTMP.splice(5, docsTMP.length);
		}
	
		// Save array
		localStorage["firetext.recents"] = JSON.stringify(docsTMP);
	} else {
		firetext.recents.init();
		firetext.recents.add(file, location);
	}
};

// Remove from recent docs
firetext.recents.remove = function (file, merged) {
	if (localStorage["firetext.recents"] != undefined) {
		var docsTMP = firetext.recents.get();
	
		// Remove item
		for (var i = 0; i < docsTMP.length; i++) {
		if (merged != true) {
			if (docsTMP[i][0] == file[0] &&
					docsTMP[i][1] == file[1] &&
					docsTMP[i][2] == file[2] &&
					docsTMP[i][3] == file[3] &&
					docsTMP[i][4] == file[4]) {
				docsTMP.splice(i, 1);
			break;
			}
		} else {
			if (file == docsTMP[i][0] + docsTMP[i][1] + docsTMP[i][2] + docsTMP[i][3] + docsTMP[i][4]) {
			docsTMP.splice(i, 1);
			break;
			}
		}
		}
	
		// Save array
		localStorage["firetext.recents"] = JSON.stringify(docsTMP);
	}
};
