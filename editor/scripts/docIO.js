function initDocIO(doc) {
  var docIO = {};
  docIO.load = function load(content, filetype) {
  	doc.innerHTML = '';
    switch (filetype) {
      case ".txt":
        content = firetext.parsers.plain.parse(content, "HTML");
        doc.innerHTML = content;
        break;
      /* 0.4
      case ".docx":
        var result = new firetext.parsers.DocxEditor(content);
        content = result.HTMLout();
        doc.appendChild(content);
        break;
      */
      case ".html":
      default:
        doc.innerHTML = content;
        break;
    }             
  }

  return docIO;
}