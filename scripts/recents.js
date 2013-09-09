/*
* Recent Docs
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* RequireJS
------------------------*/
define(function (require) {


/* Recent Docs
------------------------*/
// Initalize recent docs
function init() {
  if (localStorage["firetext.recents"] == undefined) {
    localStorage["firetext.recents"] = JSON.stringify([]);
  }
}

// Get recent docs
function get() {
  if (localStorage["firetext.recents"] != undefined) {
    return JSON.parse(localStorage["firetext.recents"]);
  }
  else {
    init();
    return get();
  }
}

// Reset recent docs
function reset() {
  if (localStorage["firetext.recents"] != undefined) {
    localStorage["firetext.recents"] = JSON.stringify([]);
  }
}

// Add to recent docs
function add(file, location) {
  if (localStorage["firetext.recents"] != undefined) {
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
    localStorage["firetext.recents"] = JSON.stringify(docsTMP);
  } else {
    this.init();
    this.add(file, location);
  }
}

// Remove from recent docs
function remove(file, location, merged) {
  if (localStorage["firetext.recents"] != undefined) {
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
    localStorage["firetext.recents"] = JSON.stringify(docsTMP);
  }
}

});
