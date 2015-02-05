function initNight(messageProxy){
	function nightEditor(nightMode) {
  		var html = document.getElementsByTagName('html')[0];
		if(nightMode) {
			html.classList.add('night');
		} else {
			html.classList.remove('night');
		}
	}
	messageProxy.registerMessageHandler(function(e) { nightEditor(e.data.nightMode); }, "night");
}