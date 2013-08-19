/**
 * A class used to edit docx documents
 * @param {ArrayBuffer | ArrayBufferView} [f] see: {@link DocxEditor#load} for details
 * @constructor
 */
function DocxEditor(f) {
    // check for required dependencies
	if( !window.ArrayBuffer ) {
		throw new Error("ArrayBuffer object is not supported in this browser");
	}
	if( !window.JSZip ) {
		throw new Error("DocxEditor requires JSZip");
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
    /**
     * the main document part
     * @type {Document}
     */
    var mainPart;
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

    function runParser(rElement) {
        var mainDoc = rElement.ownerDocument ? rElement.ownerDocument : rElement;
        var mainPartResolver = mainDoc.createNSResolver(mainDoc.documentElement);
        var textElm;
        var spanElm;

        textElm = mainDoc.evaluate("./w:t", rElement, mainPartResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        spanElm = document.createElement("span");
        spanElm.appendChild(document.createTextNode(textElm.textContent));
        return spanElm;
    }

    function pParser(pElement) {
        var mainDoc = pElement.ownerDocument ? pElement.ownerDocument : pElement;
        var mainPartResolver = mainDoc.createNSResolver(mainDoc.documentElement);
        var runIterator;
        var currentNode;
        var textElm;
        var pElementHTML = document.createElement("p");

        runIterator = mainDoc.evaluate("./w:r", pElement, mainPartResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

        currentNode = runIterator.iterateNext();
        while(currentNode) {
            pElementHTML.appendChild(runParser(currentNode));
            currentNode = runIterator.iterateNext();
        }

        return pElementHTML;
    }

    /**
     * Loads a new docx document into instance of DocxEditor
     * @param {ArrayBuffer | ArrayBufferView} f the docx file to load
     */
    this.load = function load(f) {
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
        var mainPartPath;
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
        mainPartPath = tempMainRels.evaluate("/rels:Relationships/rels:Relationship[@Type='http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument']/@Target", tempMainRels, relsNSResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (!mainPartPath) {
            throw new Error("Invalid docx document");
        }
        tempMainPart = getDocAsXML(tempZip, mainPartPath.textContent);
        if (!tempMainPart) {
            throw new Error("Invalid docx document");
        }

        // everything went successful, update private class variables
        file = tempFile;
        zip = tempZip;
        mainRels = tempMainRels;
        mainPart = tempMainPart;
    };

    /**
     * generate docx document as type
     * @param {string} type the type to return the zip file as, accepted values:
     * <ul>
     *     <li>base64</li>
     *     <li>string</li>
     *     <li>unit8array</li>
     *     <li>arraybuffer</li>
     *     <li>blob</li>
     * </ul>
     * @returns {string | Uint8Array | ArrayBuffer | Blob} docx file returned as type
     */
    this.generate = function (type) {
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
        var output = document.createDocumentFragment();

        bodyElm = mainPart.evaluate("/w:document/w:body", mainPart, mainPartResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        window.bodyElm = bodyElm;

        paragraphIterator = mainPart.evaluate("./w:p", bodyElm, mainPartResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        currentNode = paragraphIterator.iterateNext();
        while( currentNode ) {
            output.appendChild( pParser( currentNode ) );
            currentNode = paragraphIterator.iterateNext();
        }

        return output;
	};

    /**
     * update html with new document fragment
     */
	this.HTMLin = function() {

	};

	if(f) {
		this.load(f);
	}
}