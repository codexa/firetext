/*
* Web Activities
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Web Activities
------------------------*/
if (navigator.mozSetMessageHandler) {
  navigator.mozSetMessageHandler('activity', function(activityRequest) {
    var activity = activityRequest.source;
  
    // Wait for Firetext to be initialized
    window.addEventListener('firetext.initialized', function () {
      // Handle activities
      if (activity.name === "open") {
        // Define edibility
        var editable
        if (activity.data.path && activity.data.path != '') {
          editable = activity.data.editable;
        }
      
        // Open file
        var file = firetext.io.split(activity.data.path);
        loadToEditor(file[0], file[1], file[2], 'internal', editable);
      }
    });
    if (firetext.isInitialized == true) {
      window.dispatchEvent(firetext.initialized);
    }
  });
}
