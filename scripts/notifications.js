/*
* Notifications
* Copyright (C) Codexa Organization.
*/

'use strict';

firetext.notify = function (message, title, time) {
	// Fix variables
	if (!time) {
		time = 5000;
	}
	
	// Create notification
	var notification = document.createElement('section');
	notification.setAttribute('role','status');
	
	if (title) {
		var notificationTitle = document.createElement('p');
		notificationTitle.classList.add('notification-title');
		notificationTitle.textContent = title;
		notification.appendChild(notificationTitle);		
	}
	
	var notificationBody = document.createElement('p');
	notificationBody.textContent = message;
	notification.appendChild(notificationBody);
	
	document.body.appendChild(notification);
	setTimeout(function(){
		notification.classList.add('notification-shown');
		
		// Set timeout to hide notification
		setTimeout(function(){
			notification.classList.remove('notification-shown');
			setTimeout(function(){
				document.body.removeChild(notification);
			},300);
		},time);
	}, 100);
};
