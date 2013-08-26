requirejs.config({
	baseUrl: "resources",
	paths: {
		"app": "../js",
		"google-code-prettify": "gcprettify/prettify"
	},
	shim: {
		"gcprettify/lang-css": ["google-code-prettify"],
		"gcprettify/lang-wiki": ["google-code-prettify"]
	}
});

define(["app/firetext"], function (firetext) {
	
})