/*
* Docx Editor
* Copyright (C) Codexa Organization.
*/
 
'use strict';

// Namespace
window.firetext = window.firetext || {};
firetext.parsers = firetext.parsers || {};

/* Docx Editor
------------------------*/

/**
* A class used to edit docx documents
* @param {ArrayBuffer | ArrayBufferView} [f] see: {@link DocxEditor#load} for details
* @constructor
*/
firetext.parsers.DocxEditor = function DocxEditor(f) {
	// check for required dependencies
	if( !window.ArrayBuffer ) {
		throw new Error("ArrayBuffer object is not supported in this browser");
	}
	if( !window.DOMParser ) {
		throw new Error("DOMParser is not supported in this browser");
	}

	/**
	 * the docx file as an ArrayBuffer
	 * @type {ArrayBuffer | ArrayBufferView}
	 */
	var file;
	/**
	 * the docx file as a JSZip object
	 * @type {JSZip}
	 */
	var zip;
	/**
	 * the main relationships part
	 * @type {Document}
	 */
	var mainRels;
	var mainPartPath;
	/**
	 * the main document part
	 * @type {Document}
	 */
	var mainPart;
	var helperArray;
	/**
	 * Creates new namespace resolver mapping the property names of ns to the proper namespace
	 * @param {object} ns object to map prefixes to namespaces
	 * @param {Function} [backupNS] a function to call if no there is no property for the prefix
	 * @returns {Function} a new namespace resolver
	 */
	function NSResolverTemplate(ns, backupNS) {
		if( typeof backupNS !== "function" ) {
			backupNS = function() {}
		}
		return function(prefix) {
			return ns[prefix] || backupNS(prefix) || null;
		}
	}

	/**
	 * namespace resolver for relationship parts
	 * @param {string} prefix the prefix to be mapped to a namespace
	 * @returns {string} the namespace mapped to prefix
	 * @function
	 */
	var relsNSResolver = NSResolverTemplate({
		"rels": "http://schemas.openxmlformats.org/package/2006/relationships"
	});

	/**
	 * returns a file of name fName from zipFile parsed as XML
	 * @param {JSZip} zipFile zip file to get file from
	 * @param {string} fName the name of the file
	 * @returns {Document} the parsed document
	 */
	function getDocAsXML(zipFile, fName) {
		/**
		 * The document as a string
		 * @type {object}
		 */
		var zippedFile;
		/**
		 * The DOMParser object to parse the document as XML
		 * @type {DOMParser}
		 */
		var parser;

		// argument checking
		if( !(zipFile instanceof JSZip) ) {
			throw new TypeError("getDocAsXML only accepts an instance of a JSZip object as the first argument");
		}
		if( typeof fName !== "string" ) {
			throw new TypeError("getDocAsXML only accepts a string as the second argument");
		}

		// find file in zipFile and if not found, throw error
		zippedFile = zipFile.file(fName);
		if( !zippedFile ) {
			throw new Error("No such file");
		}

		// parse file as xml
		parser = new DOMParser();
		return parser.parseFromString(zippedFile.asText(), "text/xml");
	}

	function isBlockLevelHTML(node) {
		var blockLevelElms = ["DIV"];
		if(node.nodeType === Node.ELEMENT_NODE) {
			for(var i = 0; i < blockLevelElms.length; i++) {
				if(node.tagName === blockLevelElms[i]) {
					return true;
				}
			}
			return false;
		}
		return false;
	}

	function runParser(rElement) {
		var mainDoc = rElement.ownerDocument ? rElement.ownerDocument : rElement;
		var mainPartResolver = mainDoc.createNSResolver(mainDoc.documentElement);
		var textElm;
		var spanElm;

		textElm = mainDoc.evaluate("./w:t", rElement, mainPartResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		spanElm = document.createElement("span");
		if(textElm && textElm.textContent) {
			spanElm.appendChild(document.createTextNode(textElm.textContent));
		}
		return spanElm;
	}

	function pParser(pElement) {
		var mainDoc = pElement.ownerDocument ? pElement.ownerDocument : pElement;
		var mainPartResolver = mainDoc.createNSResolver(mainDoc.documentElement);
		var runIterator;
		var currentNode;
		var currentHTML;
		var pElementHTML = document.createElement("div");
		var localHelperArray = [];

		runIterator = mainDoc.evaluate("./w:r", pElement, mainPartResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

		currentNode = runIterator.iterateNext();
		while(currentNode) {
			currentHTML = runParser(currentNode);
			
			localHelperArray.push({
				html: currentHTML,
				xml: currentNode
			});

			pElementHTML.appendChild(currentHTML);
			currentNode = runIterator.iterateNext();
		}

		return {
			element: pElementHTML,
			helperArray: localHelperArray
		};
	}

	function nodeExists(nodeToFind, node) {
		for (var i = 0; i < node.childNodes.length; i++) {
			if(node.childNodes[i] === nodeToFind) {
				return true;
			} else if(node.childNodes) {
				if(nodeExists(nodeToFind, node.childNodes[i])) {
					return true;
				}
			}
		}
		return false;
	}

	function getUnReferencedNodes(helperArray, DocNode) {
		var unReferencedNodes = [];
		var referencedNodes = [];
		for (var i = 0; i < helperArray.length; i++) {
			if(!nodeExists(helperArray[i].html, DocNode)) {
				unReferencedNodes.push(helperArray[i].xml);
			} else {
				referencedNodes.push(helperArray[i]);
			}
		}
		return {
			unReferenced: unReferencedNodes,
			referenced: referencedNodes
		};
	}

	function removeNodes(listOfNodes) {
		for (var i = 0; i < listOfNodes.length; i++) {
			listOfNodes[i].parentNode.removeChild(listOfNodes[i]);
		}
	}

	function mapHTMLtoXML(HTMLNode, nodeList) {
		for (var i = 0; i < nodeList.length; i++) {
			if(nodeList[i].html === HTMLNode) {
				return nodeList[i].xml;
			}
		}
	}

	function insertNode(HTMLNode, DocNode, insertMethod, listOfNodes, mergeWith) {
		var insertFunction;
		var insertMethods = {
			pMerger: function pMerger(HTMLNode, DocNode, insertMethod, listOfNodes, mergeWith) {
				var currentNode;
				var mainDoc = DocNode.ownerDocument ? DocNode.ownerDocument : DocNode;
				var nodeToInsert;
				var prevNode;
				var currentXmlNode;
				var newList = [];
				var insertResult;

				if(mergeWith) {
					nodeToInsert = mergeWith;
				} else {
					nodeToInsert = mainDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:p");
				}

				for (var i = 0; i < HTMLNode.childNodes.length; i++) {
					currentNode = HTMLNode.childNodes[i];

					currentXmlNode = mapHTMLtoXML(currentNode, listOfNodes);

					insertResult = insertNode(currentNode, prevNode || nodeToInsert, prevNode ? insertNode.INSERT_AFTER : insertNode.INSERT_FIRST, helperArray, currentXmlNode || null);

					if(insertResult) {
						if(!currentXmlNode && insertResult) {
							newList.push({
								html: currentNode,
								xml: insertResult.node
							});
						}

						if(insertResult.newList) {
							newList = newList.concat(insertResult.newList);
						}
						prevNode = insertResult.node;
					}
				}

				if(insertMethod === insertNode.INSERT_FIRST) {
					DocNode.insertBefore(nodeToInsert, DocNode.firstChild);
				} else if(insertMethod === insertNode.INSERT_AFTER) {
					DocNode.parentNode.insertBefore(nodeToInsert, DocNode.nextSibling);
				}
				return {
					node: nodeToInsert,
					newList: newList
				};
			},
			runMerger: function runMerger(HTMLNode, DocNode, insertMethod, listOfNodes, mergeWith) {
				var mainDoc = DocNode.ownerDocument ? DocNode.ownerDocument : DocNode;
				var mainDocResolver = mainDoc.createNSResolver(mainDoc.documentElement);
				var textElm;
				var nodeToInsert;

				if(mergeWith) {
					nodeToInsert = mergeWith;
				} else {
					nodeToInsert = mainDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:r");
				}

				textElm = mainDoc.evaluate("./w:t", nodeToInsert, mainDocResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				if(!textElm) {
					textElm = mainDoc.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:t");
					nodeToInsert.appendChild(textElm);
				}

				if(HTMLNode.nodeType === Node.ELEMENT_NODE) {
					textElm.textContent = HTMLNode.textContent;
				} else {
					textElm.textContent = HTMLNode.nodeValue;
				}

				if(insertMethod === insertNode.INSERT_FIRST) {
					DocNode.insertBefore(nodeToInsert, DocNode.firstChild);
				} else if(insertMethod === insertNode.INSERT_AFTER) {
					DocNode.parentNode.insertBefore(nodeToInsert, DocNode.nextSibling);
				}

				return {
					node: nodeToInsert
				};
			}
		};

		if(HTMLNode.nodeType !== Node.ELEMENT_NODE) {
			insertFunction = insertMethods.runMerger;
		} else {
			switch(HTMLNode.tagName) {
				case "DIV":
					insertFunction = insertMethods.pMerger;
					break;
				case "SPAN":
					insertFunction = insertMethods.runMerger;
					break;
			}
		}

		if(insertFunction) {
			return insertFunction(HTMLNode, DocNode, insertMethod, listOfNodes, mergeWith);
		}
	}

	insertNode.INSERT_AFTER = 1;
	insertNode.INSERT_FIRST = 2;

	/**
	 * Loads a new docx document into instance of DocxEditor
	 * @param {ArrayBuffer | ArrayBufferView} f the docx file to load
	 */
	this.load = function(f) {
		/**
		 * temporary variable to store new file property
		 * @see DocxEditor-file
		 * @type {ArrayBuffer | ArrayBufferView}
		 */
		var tempFile;
		/**
		 * temporary variable to store new zip property
		 * @see DocxEditor-zip
		 * @type {JSZip}
		 */
		var tempZip;
		/**
		 * temporary variable to store new mainRels property
		 * @see DocxEditor-mainRels
		 * @type {Document}
		 */
		var tempMainRels;
		/**
		 * the path to the main document part
		 * @type {Node}
		 */
		var tempMainPartPath;
		/**
		 * temporary variable to store new mainPart property
		 * @see DocxEditor-mainPart
		 * @type {Document}
		 */
		var tempMainPart;

		// argument checking
		if (!((f instanceof ArrayBuffer) || (f instanceof ArrayBufferView))) {
			throw new TypeError("load only accepts an instance of an ArrayBuffer(View) object as an argument");
		}

		// initialize temporary variables for docx file as ArrayBuffer and JSZip instance
		tempFile = f;
		tempZip = new JSZip(f);

		// get main relationships file
		try {
			tempMainRels = getDocAsXML(tempZip, "_rels/.rels");
		}
		catch (err) {
			if (err.message === "No such file") {
				throw new Error("Invalid docx document");
			} else {
				throw err;
			}
		}

		// get main document part
		tempMainPartPath = tempMainRels.evaluate("/rels:Relationships/rels:Relationship[@Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument']/@Target", tempMainRels, relsNSResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		if (!tempMainPartPath) {
			throw new Error("Invalid docx document");
		}
		tempMainPart = getDocAsXML(tempZip, tempMainPartPath.textContent);
		if (!tempMainPart) {
			throw new Error("Invalid docx document");
		}

		// everything went successful, update private class variables
		file = tempFile;
		zip = tempZip;
		mainRels = tempMainRels;
		mainPartPath = tempMainPartPath.textContent;
		mainPart = tempMainPart;
	};

	/**
	 * generate docx document as type
	 * @param {string} type the type to return the zip file as, accepted values:
	 * <ul>
	 *		 <li>base64</li>
	 *		 <li>string</li>
	 *		 <li>unit8array</li>
	 *		 <li>arraybuffer</li>
	 *		 <li>blob</li>
	 * </ul>
	 * @returns {string | Uint8Array | ArrayBuffer | Blob} docx file returned as type
	 */
	this.generate = function (type) {
		if(!type) {
			type = "blob";
		}
		// argument checking
		if (typeof type !== "string") {
			throw new TypeError("method generate of DocxEditor only accepts a string as a parameter")
		}
		type = type.toLowerCase();
		if (type !== "base64" && type !== "string" && type !== "unit8array" && type !== "arraybuffer" && type !== "blob") {
			throw new TypeError("method generate of DocxEditor only accepts string values of base64, string, unit8array, arraybuffer, or blob")
		}

		// return docx file
		return zip.generate({
			compression: "DEFLATE",
			type: type
		});
	};

	/**
	 * creates a document fragment to be edited and updated with HTMLin method
	 * @see DocxEditor#HTMLin
	 * @returns {DocumentFragment} a document fragment representing the html version of the docx document to be edited
	 */
	this.HTMLout = function() {
		/**
		 * the body tag of the main document part
		 * @type {Node}
		 */
		var bodyElm;
		var paragraphIterator;
		var mainPartResolver = mainPart.createNSResolver(mainPart.documentElement);
		var currentNode;
		var currentHTML;
		var output = document.createDocumentFragment();
		var currentP;
		helperArray = [];

		bodyElm = mainPart.evaluate("/w:document/w:body", mainPart, mainPartResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

		window.bodyElm = bodyElm;

		paragraphIterator = mainPart.evaluate("./w:p", bodyElm, mainPartResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
		currentNode = paragraphIterator.iterateNext();
		while( currentNode ) {
			currentP = pParser(currentNode);
			currentHTML = currentP.element;

			helperArray.push({
				html: currentHTML,
				xml: currentNode
			});

			helperArray = helperArray.concat(currentP.helperArray);

			output.appendChild( currentHTML );
			currentNode = paragraphIterator.iterateNext();
		}

		return output;
	};

	/**
	 * update html with new document fragment
	 */
	this.HTMLin = function(html) {
		var currentNode;
		var tempNode;
		var prevNode;
		var prevTempNode;
		var mainPartResolver = mainPart.createNSResolver(mainPart);
		var bodyElm;
		var serializer = new XMLSerializer();
		var unReferencedNodes;
		var currentXmlNode;
		var unReferencedResult;
		var insertResult;

		bodyElm = mainPart.evaluate("/w:document/w:body", mainPart, mainPartResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

		unReferencedResult = getUnReferencedNodes(helperArray, html);
		unReferencedNodes = unReferencedResult.unReferenced;
		helperArray = unReferencedResult.referenced;


		for (var i = 0; i < html.childNodes.length; i++) {
			currentNode = html.childNodes[i];

			currentXmlNode = mapHTMLtoXML(currentNode, helperArray);

			if(isBlockLevelHTML(currentNode)) {
				tempNode = undefined;
				prevTempNode = undefined;

				insertResult = insertNode(currentNode, prevNode || bodyElm, prevNode ? insertNode.INSERT_AFTER : insertNode.INSERT_FIRST, helperArray, currentXmlNode || null);
				if(insertResult) {
					prevNode = insertResult.node;
					if(insertResult.newList) {
						helperArray = helperArray.concat(insertResult.newList);
					}
					if(!currentXmlNode) {
						helperArray.push({
							html: currentNode,
							xml: insertResult.node
						});
					}
				}
			} else {
				if(!tempNode) {
					tempNode = mainPart.createElementNS("http://schemas.openxmlformats.org/wordprocessingml/2006/main", "w:p");
					bodyElm.insertBefore(tempNode, prevNode && prevNode.nextSibling ? prevNode.nextSibling : null);
					prevNode = tempNode;
					helperArray.push({
						html: null,
						xml: tempNode
					});
				}

				insertResult = insertNode(currentNode, prevTempNode || tempNode, prevTempNode ? insertNode.INSERT_AFTER : insertNode.INSERT_FIRST, helperArray, currentXmlNode || null);
				if(insertResult) {
					prevTempNode = insertResult.node;

					if(insertResult.newList) {
						helperArray = helperArray.concat(insertResult.newList);
					}
					if(!currentXmlNode) {
						helperArray.push({
							html: currentNode,
							xml: insertResult.node
						});
					}
				}

			}
			
		}

		removeNodes(unReferencedNodes);

		zip.file(mainPartPath, serializer.serializeToString(mainPart));
	};

	if(f) {
		this.load(f);
	}
}

firetext.parsers.DocxEditor.blank = StringView.base64ToBytes("UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC0lMtuwjAQRfeV+g+Rt1Vi6KKqKgKLPpYtUukHGHsCVv2Sx7z+vhMCUVUBkQpsIiUz994zVsaD0dqabAkRtXcl6xc9loGTXmk3K9nX5C1/ZBkm4ZQw3kHJNoBsNLy9GUw2ATAjtcOSzVMKT5yjnIMVWPgAjiqVj1Ykeo0zHoT8FjPg973eA5feJXApT7UHGw5eoBILk7LXNX1uSCIYZNlz01hnlUyEYLQUiep86dSflHyXUJBy24NzHfCOGhg/mFBXjgfsdB90NFEryMYipndhqYuvfFRcebmwpCxO2xzg9FWlJbT62i1ELwGRztyaoq1Yod2e/ygHpo0BvDxF49sdDymR4BoAO+dOhBVMP69G8cu8E6Si3ImYGrg8RmvdCZFoA6F59s/m2NqciqTOcfQBaaPjP8ber2ytzmngADHp039dm0jWZ88H9W2gQB3I5tv7bfgDAAD//wMAUEsDBBQABgAIAAAAIQAekRq37wAAAE4CAAALAAgCX3JlbHMvLnJlbHMgogQCKKAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArJLBasMwDEDvg/2D0b1R2sEYo04vY9DbGNkHCFtJTBPb2GrX/v082NgCXelhR8vS05PQenOcRnXglF3wGpZVDYq9Cdb5XsNb+7x4AJWFvKUxeNZw4gyb5vZm/cojSSnKg4tZFYrPGgaR+IiYzcAT5SpE9uWnC2kiKc/UYySzo55xVdf3mH4zoJkx1dZqSFt7B6o9Rb6GHbrOGX4KZj+xlzMtkI/C3rJdxFTqk7gyjWop9SwabDAvJZyRYqwKGvC80ep6o7+nxYmFLAmhCYkv+3xmXBJa/ueK5hk/Nu8hWbRf4W8bnF1B8wEAAP//AwBQSwMEFAAGAAgAAAAhANZks1H0AAAAMQMAABwACAF3b3JkL19yZWxzL2RvY3VtZW50LnhtbC5yZWxzIKIEASigAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArJLLasMwEEX3hf6DmH0tO31QQuRsSiHb1v0ARR4/qCwJzfThv69ISevQYLrwcq6Yc8+ANtvPwYp3jNR7p6DIchDojK971yp4qR6v7kEQa1dr6x0qGJFgW15ebJ7Qak5L1PWBRKI4UtAxh7WUZDocNGU+oEsvjY+D5jTGVgZtXnWLcpXndzJOGVCeMMWuVhB39TWIagz4H7Zvmt7ggzdvAzo+UyE/cP+MzOk4SlgdW2QFkzBLRJDnRVZLitAfi2Myp1AsqsCjxanAYZ6rv12yntMu/rYfxu+wmHO4WdKh8Y4rvbcTj5/oKCFPPnr5BQAA//8DAFBLAwQUAAYACAAAACEAWKsvxRICAAAzBgAAEQAAAHdvcmQvZG9jdW1lbnQueG1spFRNb9swDL0P2H8wdE9sZ27XGXWKbdmCHgYUy3YeFFm2hViiIMnxul8/yh+x94EibU4SRfK9R0ri7d1PWQdHbqwAlZF4GZGAKwa5UGVGvn/7vLghgXVU5bQGxTPyyC25W79+ddumObBGcuUChFA2bTXLSOWcTsPQsopLapdSMAMWCrdkIEMoCsF42ILJw1UUR91OG2DcWuT7SNWRWjLAyX/RQHOFzgKMpA5NU4aSmkOjF4iuqRN7UQv3iNjR9QgDGWmMSgeIxUmQT0l7QcMyZphzePuUzdCBjjE0vEYNoGwl9FTGS9HQWY0gx6eKOMp6jGt1nFx2BxtDW1wmwHPk532SrHvlTyPG0Rk34iFOGedI+JNzVCKpUBPxi1oza2589TyA1d8AurzscrYGGj2hicvQ7tXhhOV/9jOwhkuel2YvE7OrqMYfKFl6XyowdF+jIryyALse+GdN1jhx9pA/+lUHbYoTK/+akShK3iXvY5xSw9GGF7Sp3czTZ8LBz4qdo8ZhqMgxwOcoKpHpxxY+UHYg4Tz2k8pPkegIkde7LWfuwfxHQaes3P1CF77ZeLVKOoYK91c3SYfhA75Qn+wAv1ac9CFGlJWbzD04B3Kya17MvBWnOcch9XbVmQWAm5ll4zpzoGNQWzy1mjLex3THOLq3RvjyaqH4g3AMVb65HuvsS+y2fcvDadqvfwMAAP//AwBQSwMEFAAGAAgAAAAhAKpSJd8jBgAAixoAABUAAAB3b3JkL3RoZW1lL3RoZW1lMS54bWzsWU2LGzcYvhf6H8TcHX/N+GOJN9hjO2mzm4TsJiVHeUaeUawZGUneXRMCJTkWCqVp6aGB3noobQMJ9JL+mm1T2hTyF6rReGzJllnabGApWcNaH8/76tH7So80nstXThICjhDjmKYdp3qp4gCUBjTEadRx7hwOSy0HcAHTEBKaoo4zR9y5svvhB5fhjohRgoC0T/kO7DixENOdcpkHshnyS3SKUtk3piyBQlZZVA4ZPJZ+E1KuVSqNcgJx6oAUJtLtzfEYBwgcZi6d3cL5gMh/qeBZQ0DYQeYaGRYKG06q2Refc58wcARJx5HjhPT4EJ0IBxDIhezoOBX155R3L5eXRkRssdXshupvYbcwCCc1Zcei0dLQdT230V36VwAiNnGD5qAxaCz9KQAMAjnTnIuO9XrtXt9bYDVQXrT47jf79aqB1/zXN/BdL/sYeAXKi+4Gfjj0VzHUQHnRs8SkWfNdA69AebGxgW9Wun23aeAVKCY4nWygK16j7hezXULGlFyzwtueO2zWFvAVqqytrtw+FdvWWgLvUzaUAJVcKHAKxHyKxjCQOB8SPGIY7OEolgtvClPKZXOlVhlW6vJ/9nFVSUUE7iCoWedNAd9oyvgAHjA8FR3nY+nV0SBvXv745uVzcProxemjX04fPz599LPF6hpMI93q9fdf/P30U/DX8+9eP/nKjuc6/vefPvvt1y/tQKEDX3397I8Xz1598/mfPzyxwLsMjnT4IU4QBzfQMbhNEzkxywBoxP6dxWEMsW7RTSMOU5jZWNADERvoG3NIoAXXQ2YE7zIpEzbg1dl9g/BBzGYCW4DX48QA7lNKepRZ53Q9G0uPwiyN7IOzmY67DeGRbWx/Lb+D2VSud2xz6cfIoHmLyJTDCKVIgKyPThCymN3D2IjrPg4Y5XQswD0MehBbQ3KIR8ZqWhldw4nMy9xGUObbiM3+XdCjxOa+j45MpNwVkNhcImKE8SqcCZhYGcOE6Mg9KGIbyYM5C4yAcyEzHSFCwSBEnNtsbrK5Qfe6lBd72vfJPDGRTOCJDbkHKdWRfTrxY5hMrZxxGuvYj/hELlEIblFhJUHNHZLVZR5gujXddzEy0n323r4jldW+QLKeGbNtCUTN/TgnY4iU8/Kanic4PVPc12Tde7eyLoX01bdP7bp7IQW9y7B1R63L+Dbcunj7lIX44mt3H87SW0huFwv0vXS/l+7/vXRv28/nL9grjVaX+OKqrtwkW+/tY0zIgZgTtMeVunM5vXAoG1VFGS0fE6axLC6GM3ARg6oMGBWfYBEfxHAqh6mqESK+cB1xMKVcng+q2eo76yCzZJ+GeWu1WjyZSgMoVu3yfCna5Wkk8tZGc/UItnSvapF6VC4IZLb/hoQ2mEmibiHRLBrPIKFmdi4s2hYWrcz9Vhbqa5EVuf8AzH7U8NyckVxvkKAwy1NuX2T33DO9LZjmtGuW6bUzrueTaYOEttxMEtoyjGGI1pvPOdftVUoNelkoNmk0W+8i15mIrGkDSc0aOJZ7ru5JNwGcdpyxvBnKYjKV/nimm5BEaccJxCLQ/0VZpoyLPuRxDlNd+fwTLBADBCdyretpIOmKW7XWzOZ4Qcm1KxcvcupLTzIaj1EgtrSsqrIvd2LtfUtwVqEzSfogDo/BiMzYbSgD5TWrWQBDzMUymiFm2uJeRXFNrhZb0fjFbLVFIZnGcHGi6GKew1V5SUebh2K6PiuzvpjMKMqS9Nan7tlGWYcmmlsOkOzUtOvHuzvkNVYr3TdY5dK9rnXtQuu2nRJvfyBo1FaDGdQyxhZqq1aT2jleCLThlktz2xlx3qfB+qrNDojiXqlqG68m6Oi+XPl9eV2dEcEVVXQinxH84kflXAlUa6EuJwLMGO44Dype1/Vrnl+qtLxBya27lVLL69ZLXc+rVwdetdLv1R7KoIg4qXr52EP5PEPmizcvqn3j7UtSXLMvBTQpU3UPLitj9falWtv+9gVgGZkHjdqwXW/3GqV2vTssuf1eq9T2G71Sv+E3+8O+77Xaw4cOOFJgt1v33cagVWpUfb/kNioZ/Va71HRrta7b7LYGbvfhItZy5sV3EV7Fa/cfAAAA//8DAFBLAwQUAAYACAAAACEAiTTNVZgDAACTCQAAEQAAAHdvcmQvc2V0dGluZ3MueG1stFbbbts4EH1fYP/B0PM6luRbItQpHDvepojbonI/gBIpmwhvICk7brH/vkNKjOy0KLxb9MnUnLnzzNBv3j5z1tsTbagUsyi5iqMeEaXEVGxn0ZfNqn8d9YxFAiMmBZlFR2Kit7d//vHmkBliLaiZHrgQJuPlLNpZq7LBwJQ7wpG5kooIACupObLwqbcDjvRTrfql5ApZWlBG7XGQxvEkat3IWVRrkbUu+pyWWhpZWWeSyaqiJWl/goW+JG5jspRlzYmwPuJAEwY5SGF2VJngjf9fbwDugpP9z4rYcxb0Dkl8QbkHqfGLxSXpOQOlZUmMgQviLCRIRRd49J2jl9hXELst0bsC8yT2p9PMx//NQfrKgWGXVNJAj7TQSDc8acvgZfawFVKjggEroZweZBTdAi2/Ssl7h0wRXcLdAKfjOBo4AJMK1cxuUJFbqUBljyCHadrC5Q5pVFqic4VKaNtCCqslC3pYfpB2AbTV0NXWwpO4O+XNQICFQByyOiP5WmJg7CGrNb28cc7AR4faTkK+DiRhgDXFZOO6kdsjIytIPqdfyVzg97WxFDx6qv9CBj9LgAgX+SPc3+aoyIogW0ObflMwfxMrRtWaai31g8Bwz78tGK0qoiEARZasgT5Uy4Pv8zuCMOzNX4w7OKURbGFswuGzlDaoxvEiHS3iaZOpQztkdDOaJ9c/QiY3yXDVEucc6bwNXqLyzG2wTzqcHIV6vLFYIF5oinprt+MGTqPQT3dUBLwgMLTkFMnrIoD9fgMYjhhbwYwFwA8ezzA1akkqf2ZrpLed31ZD/1AK8/z+xZebdaL/1rJWDXrQSDXUCCrJaNRaUmEfKQ9yUxd5sBKwZk6gWuCPe+371LXnkFm4Yj9ij8hTxesS0f+St1RiOnc0IGukVMOmYpvMIka3O5s4Alj4wvAU+o9im7ZY6rG0wfwHKl1loN0eOlkaZCd6wyAbdrJRkI062TjIxp1sEmQTJ9vBHGtGxRMQOxydvJKMyQPB7zr8O1HTBLNDiiybnQv0ko2gXcKmt8/IM2xngqmFfxiKYo6e3bJOJ8681WboKGt7puswp6zOPWBkURipM2NP8Ve5uLegpEDH/MiLbsVfNYkzamANKHgNrNQB+8tjydg/E3YDLH6Ci/1MqjtkCG4xLMsH7B6ixubb9H46TefLYT+9m0/7o/vhtH8znVz3x8tkvBgu7uP5ZPFPO4Xh39TtvwAAAP//AwBQSwMEFAAGAAgAAAAhAPameeXEAQAA7QQAABIAAAB3b3JkL2ZvbnRUYWJsZS54bWy8km1r2zAQx98P+h2M3jeWnaQPpk7JsgYGYy9G9wEURbZF9WB0Stx8+55kxxsLZQmFyiDk/939dPpzD4+vWiV74UBaU5JsQkkiDLdbaeqS/H5eX9+RBDwzW6asESU5CCCPi6svD11RWeMhwXoDheYlabxvizQF3gjNYGJbYTBYWaeZx19Xp5q5l117za1umZcbqaQ/pDmlN2TAuHMotqokF98s32lhfKxPnVBItAYa2cKR1p1D66zbts5yAYBv1qrnaSbNiMlmJyAtubNgKz/BxwwdRRSWZzSetPoDmF8GyEeA5sX32ljHNgrNx04ShJHF4H7SFYZpDKyYkhsnY6BlxoLIMLZnqiQ0p2s6xz18MzoNO0lDIm+YAxEgfSLt5YppqQ5HFToJ0Ada6Xlz1PfMydBUHwJZY2AHG1qSJ4orX69Jr2QlmaGwXI1KHu6KKxuU6ajQoPDI6TPuYxWPnDEH70x7B06ceJZaQPJTdMkvq5l5x5Gc3qATc/QjODO9yBEXuZc6ki//dmSFyu3dbHriyP3/Hek55zsyzEbyQ9aNf3dCwlx81oQsQ8v50z8TktPbryd+xNd/cEKGAyzeAAAA//8DAFBLAwQUAAYACAAAACEAW239kwkBAADxAQAAFAAAAHdvcmQvd2ViU2V0dGluZ3MueG1slNHBSgMxEAbgu+A7LLm32RYVWbotiFS8iKA+QJrOtsFMJsykrvXpHWutSC/1lkkyHzP8k9k7xuoNWAKl1oyGtakgeVqGtGrNy/N8cG0qKS4tXaQErdmCmNn0/GzSNz0snqAU/SmVKkka9K1Zl5Iba8WvAZ0MKUPSx44YXdGSVxYdv27ywBNmV8IixFC2dlzXV2bP8CkKdV3wcEt+g5DKrt8yRBUpyTpk+dH6U7SeeJmZPIjoPhi/PXQhHZjRxRGEwTMJdWWoy+wn2lHaPqp3J4y/wOX/gPEBQN/crxKxW0SNQCepFDNTzYByCRg+YE58w9QLsP26djFS//hwp4X9E9T0EwAA//8DAFBLAwQUAAYACAAAACEAnhCwkGsBAADFAgAAEAAIAWRvY1Byb3BzL2FwcC54bWwgogQBKKAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcUk1PwzAMvSPxH6reWTokEJq8TGgIceBj0go7R4nbRqRJlATE/j3OykoRnMjJ79l+eXYCq4/eFO8YonZ2Wc5nVVmglU5p2y7L5/r27KosYhJWCeMsLss9xnLFT09gE5zHkDTGgiRsXJZdSn7BWJQd9iLOKG0p07jQi0QwtMw1jZZ44+Rbjzax86q6ZPiR0CpUZ34ULAfFxXv6r6hyMvuLL/Xekx6HGntvREL+mDvNTLnUAxtZqF0SptY98oroEcBGtBj5HNgQwM4FFXPNEMC6E0HIRPvL5ATBtfdGS5For/xBy+Cia1LxdDBb5G5g0xKgAbYo34JO+yw1hXCvLR4uGAJyFUQbhO8O5ATBVgqDaxqdN8JEBPZNwNr1XliSY2NEeq/x2dfuJm/hq+UnORlxp1O39UIOXv7kYUssKnI/GhgJuKPHCCarU69tUR1rfify+l6GX8nnF7OKzmFfR46mHr8L/wQAAP//AwBQSwMEFAAGAAgAAAAhAM9pU2JtAQAA7QIAABEACAFkb2NQcm9wcy9jb3JlLnhtbCCiBAEooAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJySXUvDMBSG7wX/Q8l9m3ZVkdJ2oGMX4kBwongXk7Mtrvkgydbt35u2a2dxV96dj+e8OXmTfHoQVbAHY7mSBUqiGAUgqWJcrgv0tpyH9yiwjkhGKiWhQEewaFpeX+VUZ1QZeDFKg3EcbOCVpM2oLtDGOZ1hbOkGBLGRJ6RvrpQRxPnUrLEmdEvWgCdxfIcFOMKII7gRDPWgiE6SjA6SemeqVoBRDBUIkM7iJErwmXVghL040HZ+kYK7o4aLaN8c6IPlA1jXdVSnLer3T/DH4vm1vWrIZeMVBVTmjGaOuwrKHJ9DH9nd1zdQ15WHxMfUAHHKlE/emmCmuFGyZfp64/gWjrUyzPrpUeYxBpYarp1/x057VPB0Raxb+IddcWAPx/Exf9vNhIE9b/5FmbTEkOYnk7vVgAXenKyzsu+8p4+z5RyVkzhJw/g+nKTL5Da7SbI4/my2G82fBcVpgX8r9gKdQeMPWv4AAAD//wMAUEsDBBQABgAIAAAAIQDkBdSITAsAAH5wAAAPAAAAd29yZC9zdHlsZXMueG1svJ1dU+M6Eobvt2r/gytXuxcMhM8Z6jCngBkWagcOZ8LsXCu2QrTIVtYfA+yvX0l2EoW2HLfcyxUkTj+W9fYrqf2R/Pb7SyqjXzwvhMrORuMPe6OIZ7FKRPZ4NvrxcLXzcRQVJcsSJlXGz0avvBj9/vmvf/nt+bQoXyUvIg3IitM0PhvNy3JxurtbxHOesuKDWvBMb5ypPGWlfpk/7qYsf6oWO7FKF6wUUyFF+bq7v7d3PGoweR+Kms1EzL+ouEp5Vtr43ZxLTVRZMReLYkl77kN7VnmyyFXMi0IfdCprXspEtsKMDwEoFXGuCjUrP+iDaVpkUTp8vGf/S+UacIQD7K8AaXx685ipnE2l7n3dkkjDRp919ycq/sJnrJJlYV7m93nzsnll/1yprCyi51NWxEI86D1rSCo07/o8K8RIb+GsKM8LwVo3zs0/rVvionTevhCJGO2aPRb/1Rt/MXk22t9fvnNpWrDxnmTZ4/I9nu38mLgtcd6aau7ZiOU7k3MTuNscWP3XOdzF21d2xwsWC7sfNiu5zqzx8Z6BSmESef/o0/LF98r0LatK1ezEAuq/K+wu6HGdcDr9JrUL9FY++6biJ55MSr3hbGT3pd/8cXOfC5XrTD8bfbL71G9OeCquRZLwzPlgNhcJ/znn2Y+CJ+v3/7yy2dq8Easq0/8fnIxtFsgi+foS84XJfb01Y0aTOxMgzacrsd65Df/PEjZulGiLn3NmBoBo/BZhm49C7JuIwjnadmb15tjtp1A7OnivHR2+146O3mtHx++1o5P32tHH99qRxfw/dySyhL/URoS7AdRtHI8b0RyP2dAcj5fQHI9V0ByPE9AcT6KjOZ48RnM8aYrglCr2ZaGT7AeebO/mbp8jwrjbp4Qw7vYZIIy7fcAP424f38O424fzMO720TuMu32wxnPrpVZ0o22WlYNdNlOqzFTJo5K/DKexTLNsVUTDM5Mez0kOkgBTj2zNRDyYFjP7enuGWJOGz+elKeQiNYtm4rHKdTE9tOE8+8WlLmsjliSaRwjMeVnlnh4Jyemcz3jOs5hTJjYd1FSCUValU4LcXLBHMhbPEuLuWxJJBoVVQuv6eW5MIgiSOmVxroY3TTGy8eGbKIb3lYFEF5WUnIh1R5NiljW8NrCY4aWBxQyvDCxmeGHgaEbVRQ2NqKcaGlGHNTSifqvzk6rfGhpRvzU0on5raMP77UGU0g7x7qpj3P/c3aVU5jz24HZMxGPG9AJg+HTTnDON7lnOHnO2mEfmrHQ71j1m7H4uVPIaPVDMaSsS1brepsilPmqRVcM7dINGZa4Vj8heKx6RwVa84Ra71ctks0C7pqlnJtW0bDWtJfUy7YTJql7QDncbK4dn2NoAVyIvyGzQjiXI4DuznDVyUox861YOb9iaNdxWb0cl0uY1SIJWShU/0QzD168Lnuuy7Gkw6UpJqZ55QkeclLmqc821/L6VpJflv6aLOSuErZU2EP2n+uUV8OiWLQYf0L1kIqPR7etOyoSM6FYQ1w+336IHtTBlpukYGuCFKkuVkjGbM4F/+8mnf6dp4LkugrNXoqM9Jzo9ZGGXgmCSqUkqISLpZabIBMkcann/5K9TxfKEhnaf8/qmk5ITEScsXdSLDgJv6XHxWY8/BKshy/sXy4U5L0RlqgcSmHPasKim/+bx8KHuTkUkZ4b+qEp7/tEudW00HW74MmEDN3yJYNXU04PJX4KD3cANP9gNHNXBXkpWFMJ7CTWYR3W4Sx718Q4v/hqekiqfVZKuA5dAsh5cAsm6UMkqzQrKI7Y8wgO2POrjJUwZyyM4JWd5/8hFQiaGhVEpYWFUMlgYlQYWRirA8Dt0HNjw23Qc2PB7dWoY0RLAgVHlGen0T3SVx4FR5ZmFUeWZhVHlmYVR5dnBl4jPZnoRTDfFOEiqnHOQdBNNVvJ0oXKWvxIhv0r+yAhOkNa0+1zNzNMIKqtv4iZAmnPUknCxXeOoRP7Jp2RNMyzKdhGcEWVSKkV0bm094djIzXvXtoXZJzkGN+FespjPlUx47jkmf6yulyf1Yxlvm2+b0eu05zfxOC+jyXx1tt/FHO9tjVwW7Bth23fY1ufHy+dZ2sJueSKqdNlQ+DDF8UH/YJvRG8GH24PXK4mNyKOekXCfx9sj16vkjciTnpFwnx97RlqfbkR2+eELy59aE+GkK39WNZ4n+U66smgV3LrbrkRaRbal4ElXFm1YJTqPY3O1AKrTzzP++H7m8cdjXOSnYOzkp/T2lR/RZbDv/JcwMztm0LT7W909AcZ9u4juNXL+Wan6vP3GBaf+D3Xd6IVTVvColXPQ/8LVxijj78few40f0Xvc8SN6D0B+RK+RyBuOGpL8lN5jkx/Re5DyI9CjFZwRcKMVjMeNVjA+ZLSClJDRasAqwI/ovRzwI9BGhQi0UQesFPwIlFFBeJBRIQVtVIhAGxUi0EaFCzCcUWE8zqgwPsSokBJiVEhBGxUi0EaFCLRRIQJtVIhAGzVwbe8NDzIqpKCNChFoo0IE2qh2vTjAqDAeZ1QYH2JUSAkxKqSgjQoRaKNCBNqoEIE2KkSgjQoRKKOC8CCjQgraqBCBNipEoI1aP2oYblQYjzMqjA8xKqSEGBVS0EaFCLRRIQJtVIhAGxUi0EaFCJRRQXiQUSEFbVSIQBsVItBGtRcLBxgVxuOMCuNDjAopIUaFFLRRIQJtVIhAGxUi0EaFCLRRIQJlVBAeZFRIQRsVItBGhYiu/GwuUfpusx/jz3p679jvf+mqadR391FuF3XQH7VslZ/V/1mEC6WeotYHDw9svdEPIqZSKHuK2nNZ3eXaWyJQFz7/uOx+wselD/zSpeZZCHvNFMAP+0aCcyqHXSnvRoIi77Ar091IsOo87Bp93UgwDR52DbrWl8ubUvR0BIK7hhkneOwJ7xqtnXDYxV1jtBMIe7hrZHYCYQd3jcdO4FFkBue30Uc9++l4dX8pIHSlo0M48RO60hJqtRyOoTH6iuYn9FXPT+gro5+A0tOLwQvrR6EV9qPCpIY2w0odblQ/ASs1JARJDTDhUkNUsNQQFSY1HBixUkMCVurwwdlPCJIaYMKlhqhgqSEqTGo4lWGlhgSs1JCAlXrghOzFhEsNUcFSQ1SY1HBxh5UaErBSQwJWakgIkhpgwqWGqGCpISpMalAlo6WGBKzUkICVGhKCpAaYcKkhKlhqiOqS2p5F2ZAapbATjluEOYG4CdkJxA3OTmBAteREB1ZLDiGwWoJaLTXHVUuuaH5CX/X8hL4y+gkoPb0YvLB+FFphPypMaly11CZ1uFH9BKzUuGrJKzWuWuqUGlctdUqNq5b8UuOqpTapcdVSm9Thg7OfECQ1rlrqlBpXLXVKjauW/FLjqqU2qXHVUpvUuGqpTeqBE7IXEy41rlrqlBpXLfmlxlVLbVLjqqU2qXHVUpvUuGrJKzWuWuqUGlctdUqNq5b8UuOqpTapcdVSm9S4aqlNaly15JUaVy11So2rljql9lRLu88bP8Bk2PYHyfSHy9cFN9/B7Twwk9TfQdpcBLQfvElWP5Rkgk1LouYnqZq3bYObC4b2/7zQVV3zmb2940/jg6vmIlnr722djR5Eyovojj9H31XK7EM/9ie14BZLcX48y162c37vyjYZHmQ810cZN9/b5DnI5vtXVw8Q2W9ffXvIni9ptc1ad/7y042Y64uw9ec2LrjW7fe0uzRid7TZJkOnOnW++Br4qTHAthbq9kxlrZ3+5yYz8j43P5VVtzR5YTVKb7/kUt6y+tNq4f+o5LOy3jres4/rv9k+rb95zhuf2yHKC9jdbEz9sjtP6u+ib66de81gfNjS3fZGjqE9vW7b8r/i8/8AAAD//wMAUEsBAi0AFAAGAAgAAAAhAN+k0mxaAQAAIAUAABMAAAAAAAAAAAAAAAAAAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECLQAUAAYACAAAACEAHpEat+8AAABOAgAACwAAAAAAAAAAAAAAAACTAwAAX3JlbHMvLnJlbHNQSwECLQAUAAYACAAAACEA1mSzUfQAAAAxAwAAHAAAAAAAAAAAAAAAAACzBgAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVsc1BLAQItABQABgAIAAAAIQBYqy/FEgIAADMGAAARAAAAAAAAAAAAAAAAAOkIAAB3b3JkL2RvY3VtZW50LnhtbFBLAQItABQABgAIAAAAIQCqUiXfIwYAAIsaAAAVAAAAAAAAAAAAAAAAACoLAAB3b3JkL3RoZW1lL3RoZW1lMS54bWxQSwECLQAUAAYACAAAACEAiTTNVZgDAACTCQAAEQAAAAAAAAAAAAAAAACAEQAAd29yZC9zZXR0aW5ncy54bWxQSwECLQAUAAYACAAAACEA9qZ55cQBAADtBAAAEgAAAAAAAAAAAAAAAABHFQAAd29yZC9mb250VGFibGUueG1sUEsBAi0AFAAGAAgAAAAhAFtt/ZMJAQAA8QEAABQAAAAAAAAAAAAAAAAAOxcAAHdvcmQvd2ViU2V0dGluZ3MueG1sUEsBAi0AFAAGAAgAAAAhAJ4QsJBrAQAAxQIAABAAAAAAAAAAAAAAAAAAdhgAAGRvY1Byb3BzL2FwcC54bWxQSwECLQAUAAYACAAAACEAz2lTYm0BAADtAgAAEQAAAAAAAAAAAAAAAAAXGwAAZG9jUHJvcHMvY29yZS54bWxQSwECLQAUAAYACAAAACEA5AXUiEwLAAB+cAAADwAAAAAAAAAAAAAAAAC7HQAAd29yZC9zdHlsZXMueG1sUEsFBgAAAAALAAsAwQIAADQpAAAAAA==").buffer;
