function initPrintView(document, messageProxy){
	messageProxy.registerMessageHandler(function(e) { printView(e.data.printView); }, "printView");
}

function printView(printView) {
	var html = document.getElementsByTagName('html')[0];
	if(printView) {
		document.documentElement.setAttribute('_firetext_print_view', '');
		document.addEventListener('input', printViewOnInput);
		document.defaultView.addEventListener('resize', printViewOnResize);
		document.addEventListener('wheel', printViewOnWheel);
		document.head.appendChild(documentSizeStyle);
		document.head.appendChild(windowSizeStyle);
		printViewOnInput();
		printViewOnResize();
	} else {
		document.documentElement.removeAttribute('_firetext_print_view');
		document.removeEventListener('input', printViewOnInput);
		document.defaultView.removeEventListener('resize', printViewOnResize);
		document.removeEventListener('wheel', printViewOnWheel);
		if(documentSizeStyle.parentElement) documentSizeStyle.parentElement.removeChild(documentSizeStyle);
		if(windowSizeStyle.parentElement) windowSizeStyle.parentElement.removeChild(windowSizeStyle);
	}
}

var documentSizeStyle = document.createElement('style');
documentSizeStyle.setAttribute('_firetext_remove', '');
function printViewOnInput() {
	documentSizeStyle.textContent = '';
	var pages = Math.ceil(document.body.offsetHeight / (document.documentElement.offsetHeight - 65));
	documentSizeStyle.textContent = [
		'html {',
		'	padding-right: calc(' + (pages - 1) + ' * (var(--width) - 2 * var(--margin) + 65px) + 65px);',
		'}',
		'body {',
		'	height: ' + pages + '00%;',
		'}',
	].join('\n');
}

var windowSizeStyle = document.createElement('style');
windowSizeStyle.setAttribute('_firetext_remove', '');
var scale;
function printViewOnResize() {
	scale = (window.innerHeight - 65) / document.documentElement.offsetHeight;
	windowSizeStyle.textContent = [
		'html {',
		'	transform: scale(' + scale + ');',
		'}',
	].join('\n');
}

function printViewOnWheel(evt) {
	if(evt.deltaX) {
		return;
	}
	var px;
	switch(evt.deltaMode) {
		case WheelEvent.DOM_DELTA_PIXEL: px = evt.deltaY; break;
		case WheelEvent.DOM_DELTA_LINE: px = evt.deltaY * 30; break;
		case WheelEvent.DOM_DELTA_PAGE: px = evt.deltaY * scale * document.body.clientWidth; break;
	}
	document.defaultView.scrollBy(px, 0);
	evt.preventDefault();
}