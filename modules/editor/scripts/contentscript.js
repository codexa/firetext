(function(mainOrigin, _parentMessageProxy, initNight, filetype, odtdoc, readOnly) {
  function fixupDocument() {
    if(document.body.children.length === 0) {
      document.body.appendChild(document.createElement('br'));
    }
    if(filetype === '.odt') {
      try {
        odtdoc.setHTML(getHTML());
      } catch(e) {
        document.execCommand('undo');
        evt.stopImmediatePropagation();
      }
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
    }
  });
  
  // Fix up document
  document.addEventListener('input', fixupDocument);
  fixupDocument();
  
  // night mode
  initNight(document, parentMessageProxy);
  
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
    return doctypeString + document.documentElement.outerHTML.replace(/<(style|link)[^>]*_firetext_remove=""[^>]*>[^<>]*(?:<\/\1>)?/g, '').replace(' _firetext_night=""', '');
  }

  // Add listener to update raw
  document.addEventListener('input', function() {
    parentMessageProxy.postMessage({
      command: "doc-changed",
      html: getHTML(),
      filetype: filetype
    });
  });
})(mainOrigin, parentMessageProxy, initNight, filetype, odtdoc, readOnly);
