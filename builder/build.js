/*** SET UP AIRBORN OS ***/

var fs = require('fs');

var window = global.window = global;
global.parent = global;

window.sjcl = require('sjcl');

function randomWords(n) {
	return Array.apply(null, new Array(n)).map(function() { return Math.floor(Math.random() * 0xFFFFFFFF); });
}
var hmac_bits = randomWords(4);
var files_hmac = window.files_hmac = new sjcl.misc.hmac(hmac_bits);

window.XMLHttpRequest = function() {
	this.listeners = {};
};
window.XMLHttpRequest.prototype.addEventListener = function(name, listener) {
	if(!this.listeners[name]) {
		this.listeners[name] = [];
	}
	this.listeners[name].push(listener);
};
window.XMLHttpRequest.prototype.emit = function(name) {
	if(this.listeners[name]) {
		var _this = this;
		this.listeners[name].forEach(function(listener) {
			listener.call(_this);
		});
	}
};
window.XMLHttpRequest.prototype.open = function(method, url) {
	if(url.substr(0, 8) === '/object/' && method === 'GET') {
		var hash = url.split('#')[1]
		url = '../' + hash.substr(hash.indexOf('.') + 1).replace('/Core/', 'builder/airbornos/');
		Object.defineProperty(this, 'send', {value: function() {
			var _this = this;
			fs.readFile(url, 'base64', function(err, contents) {
				Object.defineProperty(_this, 'readyState', {get: function() { return 4; }});
				if(err) {
					Object.defineProperty(_this, 'status', {get: function() {
						return 404;
					}});
				} else {
					Object.defineProperty(_this, 'status', {get: function() {
						return 200;
					}, configurable: true});
					Object.defineProperty(_this, 'response', {get: function() {
						return codec.base64.toAB(contents);
					}});
				}
				_this.emit('readystatechange');
				_this.emit('load');
			});
		}});
		return;
	} else if(url.substr(0, 8) === '/object/' || url.substr(0, 13) === '/transaction/') {
		Object.defineProperty(this, 'setRequestHeader', {value: function() {}});
		Object.defineProperty(this, 'send', {value: function() {
			Object.defineProperty(this, 'readyState', {get: function() { return 4; }});
			Object.defineProperty(this, 'status', {get: function() {
				return 200;
			}});
			this.emit('readystatechange');
			this.emit('load');
		}});
		return;
	}
	throw new Error('Unknown XMLHttpRequest url: ' + url);
};

window.document = {};
document.createElement = function() {
	return {};
};
document.head = {};
document.head.appendChild = function() {};

window.crypto = {};
window.crypto.getRandomValues = function(array) {
	var words = randomWords(array.length);
	words.forEach(function(word, i) {
		array[i] = word;
	});
};

window.atob = function(str) { return new Buffer(str, 'base64').toString('binary'); };
window.btoa = function(str) { return new Buffer(str, 'binary').toString('base64'); };

window.TextDecoder = function() {};
TextDecoder.prototype.decode = function(dataview) { return new Buffer(codec.base64.fromAB(dataview.buffer), 'base64').toString('utf8'); };
window.TextEncoder = function() {};
TextEncoder.prototype.encode = function(str) { return {buffer: codec.base64.toAB(new Buffer(str, 'utf8').toString('base64'))}; };

window.navigator = {};
window.navigator.userAgent = {
	match: function() { return String.prototype.match.apply('Safari', arguments); }, // Use the full set of variable rewrites
	indexOf: function() { return String.prototype.match.apply('Chrome', arguments); }, // Use Data URLs
};
window.location = {};
window.location.protocol = 'https:';

window.eval(fs.readFileSync('airbornos/core.js', 'utf8'));

window.encrypt = window.decrypt = function(key, content, callback) {
	callback(content);
};

/*** END SET UP AIRBORN OS ***/


var argv = require('yargs').argv;

// Compile everything into a single html file
prepareFile(argv._[0].replace('../', ''), {compat: false, _compat: false, bootstrap: false, rootParent: ''}, function(contents) {
	
	// Extract scripts
	var scripts = [];
	contents = contents.replace(/<script([^>]*)src="([^"]*)"([^>]*)><\/script>/g, function(match, preAttrs, url, postAttrs) {
		scripts.push('../' + decodeURIComponent(url.split(',')[0].match(/filename=([^;]*);/)[1]));
		return '';
	});
	
	
	// Minify scripts
	var scriptsFileName = argv._[0].replace('../', '../build/').replace(/[^\/]*\.html/, 'scripts.js');
	var cc = require('child_process').spawn('java', [
		'-jar', 'node_modules/google-closure-compiler/compiler.jar',
		'--language_in', 'ECMASCRIPT5',
		'--js_output_file', scriptsFileName,
	].concat(argv.sourceMap === false ? [] : [
		'--create_source_map', '%outname%.map'
	]).concat(scripts));
	cc.stderr.on('data', function(data) {
		console.error('' + data);
	});
	cc.on('close', function() {
		contents = contents.replace(/(?=<\/head)/i, '<script src="scripts.js"></script>');
		
		
		// Extract styles
		var styles = [];
		contents = contents.replace(/<link([^>]*)href="([^"]*)"([^>]*)>/g, function(match, preAttrs, url, postAttrs) {
			var attrs = preAttrs + postAttrs;
			if(attrs.indexOf(' rel="stylesheet"') !== -1) {
				var style = decodeURIComponent(url.split(',')[1]);
				var media = attrs.match(/media="([^"]*)"/);
				if(media) style = '@media ' + media[1] + '{' + style + '}';
				styles.push(style);
				return '';
			}
			return match;
		});
		
		
		// Remove unused css
		require('uncss')(contents, {
			raw: styles.join('\n'),
			ignoreModifiers: [
				'[disabled]',
				'.current',
				'.parent',
				'.active',
				'.selected-tab-button',
				'.selected-tab',
				'.shown',
				'.hidden-item',
				'[dir="rtl"]',
				'.fullscreen',
				'.night',
				'.previews',
				'[data-state="drawer"]',
				'.titlePopup',
			],
			ignore: [
				/section\[role="status"\]/,
				'.mainButtons button b',
				/\.fileListItem/,
				'[data-type="list"] li > a',
				'[data-type="list"] aside[class*=" icon-"]',
				'label.pack-checkbox',
				'label.pack-checkbox input',
				'label.pack-checkbox input ~ span',
				'label.pack-checkbox.danger input ~ span',
				/\.CodeMirror/,
				/\.cm-/,
				/\.icon-fullscreen-exit/,
				/\.icon-file/,
				/\.icon-format-align-left/,
				/\.icon-format-float-left/,
				/\.icon-chevron-right/,
			]
		}, function(err, css) {
			// Remove unused glyphs from icon font
			var rIconFontUrl = /(url\(".*?materialdesignicons-webfont.woff.*?base64,)(.*?)("\))/;
			var rIconRuleMatch = /\.icon-.*?:before {\n  content: "\\([\da-f]+)";\n}/g;
			var rIconRuleExtract = /\.icon-.*?:before {\n  content: "\\([\da-f]+)";\n}/; // not global
			
			window.language = 'en-US'; // Since there is a window, fontmin expects window.language
			
			var Fontmin = require('fontmin');
			var fontmin = new Fontmin()
				.src(argv._[0].replace(/[^\/]*\.html/, 'style/fonts/materialdesignicons-webfont.ttf'))
				.use(Fontmin.glyph({
					text: css.match(rIconRuleMatch).map(function(iconRule) {
						return String.fromCharCode(parseInt(iconRule.match(rIconRuleExtract)[1], 16));
					}).join(''),
				}))
				.use(Fontmin.ttf2woff({
					deflate: true // Does nothing but shouldn't hurt
				}));
			fontmin.run(function(err, files) {
				if(err) {
					throw err;
				}
				
				css = css.replace(rIconFontUrl,
					'$1' +
					files[0].contents.toString('base64') +
					'$3'
				);
				
				
				// Minify css
				css = require('more-css').compress(css);
				fs.writeFileSync(argv._[0].replace('../', '../build/').replace(/[^\/]*\.html/, 'styles.css'), css);
				contents = contents.replace(/<head>/i, '$&<link rel="stylesheet" href="styles.css">');
				
				
				// Minify html
				contents = require('html-minifier').minify(contents, {
					removeComments: true,
					removeCommentsFromCDATA: true,
					collapseWhitespace: true,
					collapseBooleanAttributes: true,
					removeAttributeQuotes: true,
					removeScriptTypeAttributes: true,
					removeStyleLinkTypeAttributes: true,
					minifyJS: true,
					minifyCSS: true,
				});
				
				
				// Pre-prepare script
				// We do this now instead of immediately in order to have a working script for uncss (phantomjs).
				if(argv.airborn) {
					prepareFile(scriptsFileName.replace('../', ''), {}, function(prepared) {
						contents = contents.split('<script src=scripts.js></script>').join('<script>' + prepared.replace(/<\/(script)/ig, '<\\\/$1') + '</script>'); // split and join instead of replace to not interpret replacement string ($1 etc)
						fs.unlinkSync(scriptsFileName);
						
						// Write to build folder
						fs.writeFileSync(argv._[0].replace('../', '../build/'), contents);
					});
				} else {
					// Write to build folder
					fs.writeFileSync(argv._[0].replace('../', '../build/'), contents);
				}
			});
		});
	});
	
});