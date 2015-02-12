function initNight(document, messageProxy){
	messageProxy.registerMessageHandler(function(e) { nightEditor(e.data.nightMode); }, "night");
}

function nightEditor(nightMode) {
	var html = document.getElementsByTagName('html')[0];
	if(nightMode) {
		document.documentElement.setAttribute('_firetext_night', '');
	} else {
		document.documentElement.removeAttribute('_firetext_night');
	}
}