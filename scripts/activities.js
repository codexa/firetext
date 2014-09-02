/*
* Web Activities
* Copyright (C) Codexa Organization.
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
			if (activity.name === "open" | activity.name === "view") {
				// Define edibility
				var editable;
				
				if (activity.data.url && activity.data.url != '') {
					editable = activity.data.editable;
				}
			
				// Open file
				var file = firetext.io.split(activity.data.url);
				loadToEditor(file[0], file[1], file[2], 'internal', editable);
			}
		});
		if (firetext.isInitialized == true) {
			window.dispatchEvent(firetext.initialized);
		}
	});
}
