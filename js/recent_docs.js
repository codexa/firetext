define([], function() {
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
      localStorage["firetext.docs.recent"] = JSON.stringify(docsTMP);
    }
  }

  return RecentDocs;
});