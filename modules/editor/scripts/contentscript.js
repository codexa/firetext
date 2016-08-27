(function(mainOrigin, _parentMessageProxy, initNight, initPrintView, filetype, user_location, odtdoc, readOnly) {
  function fixupDocument(evt) {
    if(document.body.children.length === 0) {
      if(filetype === '.txt') {
        document.body.appendChild(document.createElement('br'));
      } else {
        var p = document.createElement('p');
        p.appendChild(document.createElement('br'));
        document.body.appendChild(p);
      }
    }
    if(filetype === '.odt') {
      try {
        odtdoc.setHTML(getHTML());
      } catch(e) {
        document.execCommand('undo');
        evt.stopImmediatePropagation();
      }
    }
    if(!document.documentElement.style.getPropertyValue('--width')) {
      document.documentElement.style.setProperty('--width', user_location.country === 'US' ? '8.5in' : '21cm');
    }
    if(!document.documentElement.style.getPropertyValue('--height')) {
      document.documentElement.style.setProperty('--height', user_location.country === 'US' ? '11in' : '29.7cm');
    }
    if(!document.documentElement.style.getPropertyValue('--margin')) {
      document.documentElement.style.setProperty('--margin', '1in');
    }
  }
  
  var parentMessageProxy = new MessageProxy();
  parentMessageProxy.setSend(parent);
  parentMessageProxy.setRecv(window);
  parentMessageProxy.setMessageHandlers(_parentMessageProxy.getMessageHandlers());
  
  // Initialize Designer
  if(!readOnly) {
    document.documentElement.contentEditable = "true";
    document.execCommand('enableObjectResizing', false, 'true');
  }
  
  if(filetype !== '.txt') {
    // Make p, not div
    document.execCommand('defaultParagraphSeparator', false, 'p'); // Chrome
  }
  if(document.getElementsByTagName('style').length === 0) {
    var style = document.createElement('style');
    style.textContent = [
      /* The following default style is duplicated in io.js and index.html */
      'h1 {',
      '  font-size: 1.5em;',
      '  margin: 0;',
      '}',
      'h2 {',
      '  font-size: 1.17em;',
      '  margin: 0;',
      '}',
      'h3 {',
      '  font-size: 1em;',
      '  margin: 0;',
      '}',
      'h4 {',
      '  font-size: 1em;',
      '  font-weight: normal;',
      '  text-decoration: underline;',
      '  margin: 0;',
      '}',
      'h5 {',
      '  font-size: 1em;',
      '  color: #555;',
      '  margin: 0;',
      '}',
      'h6 {',
      '  font-size: 1em;',
      '  font-weight: normal;',
      '  text-decoration: underline;',
      '  color: #444;',
      '  margin: 0;',
      '}',
      'p {',
      '  margin: 0;',
      '}',
      'blockquote {',
      '  margin: 0px 0px 0px 40px;',
      '}',
      'table.default, table.default td {',
      '  border: 1px solid #afafaf;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }
  
  // Hide and show toolbar.
  // For reviewers, just in case this looks like a security problem:
  // This frame is sandboxed, so I had to add the listeners to do this.
  // The content CANNOT call any of the parents functions, so this is not a security issue.
  window.addEventListener('focus', function (event) {
    parentMessageProxy.postMessage({
      command: "focus",
      focus: true
    });
  });
  window.addEventListener('blur', function (event) {
    parentMessageProxy.postMessage({
      command: "focus",
      focus: false
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keypress', function (event) {
    if((event.ctrlKey || event.metaKey) && !event.shiftKey) {
      if(event.which === 98) { // b
        document.execCommand('bold');
      } else if(event.which === 105) { // i
        document.execCommand('italic');
      } else if(event.which === 117) { // u
        document.execCommand('underline');
      } else {
        return;
      }
      event.preventDefault();
      parentMessageProxy.postMessage({
        command: "update-toolbar"
      });
    }
  });
  document.addEventListener('keydown', function (event) {
    if(event.which === 9) { // Tab
      if(event.shiftKey) {
        document.execCommand('outdent');
      } else {
        document.execCommand('indent');
      }
      event.preventDefault();
      parentMessageProxy.postMessage({
        command: "update-toolbar"
      });
    }
  });
  
  // Fix up document
  document.addEventListener('input', fixupDocument);
  fixupDocument();
  
  // night mode
  initNight(document, parentMessageProxy);
  // print view
  initPrintView(document, parentMessageProxy);
  
  // format document
  parentMessageProxy.registerMessageHandler(function(e) { document.execCommand(e.data.sCmd, false, e.data.sValue); }, "format")
  
  function getHTML() {
    /*** This function is duplicated in docIO.js ***/
    var doctype = document.doctype;
    var doctypeString = doctype ? '<!DOCTYPE '
      + doctype.name
      + (doctype.publicId ? ' PUBLIC "' + doctype.publicId + '"' : '')
      + (!doctype.publicId && doctype.systemId ? ' SYSTEM' : '') 
      + (doctype.systemId ? ' "' + doctype.systemId + '"' : '')
      + '>' : '';
    return doctypeString + document.documentElement.outerHTML.replace(/<(style|link)[^>]*_firetext_remove=""[^>]*>[^<>]*(?:<\/\1>)?/g, '').replace(' _firetext_night=""', '').replace(' _firetext_print_view=""', '');
  }

  // Add listener to update raw
  document.addEventListener('input', function() {
    parentMessageProxy.postMessage({
      command: "doc-changed",
      html: getHTML(),
      filetype: filetype
    });
  });
  
  document.addEventListener('selectionchange', function() {
    parentMessageProxy.postMessage({
      command: "update-toolbar"
    });
  });
  if(!('onselectionchange' in document)) { // Firefox
    var getSelectionRange = function() {
      var selection = document.getSelection();
      return selection.rangeCount ? selection.getRangeAt(selection.rangeCount - 1) : null; // Last range to match Firefox behavior
    }
    var prevRange;
    setInterval(function() {
      var range = getSelectionRange();
      if(range !== prevRange &&
        (!range || !prevRange || ['startContainer', 'startOffset', 'endContainer', 'endOffset'].some(function(attr) {
          return range[attr] !== prevRange[attr];
        }))) {
        parentMessageProxy.postMessage({
          command: "update-toolbar"
        });
      }
      prevRange = range;
    }, 100);
  }
})(mainOrigin, parentMessageProxy, initNight, initPrintView, filetype, user_location, odtdoc, readOnly);