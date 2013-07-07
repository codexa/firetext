// Copyright (C) Codexa Organisation 2013.

var txt = {};

txt.parse = function (data, type) {
  // Some code to convert TXT into something else
  output = "";
  if (type == "HTML") {
    output = data.replace(/</gi, '<pre><code>&lt;')
    			 .replace(/>/gi, '&gt;</code></pre>')
    			 .replace(/&amp;/gi, '&amp;amp;')
    			 .replace(/\n/gi, '<br>');
    return output;
  }
  // Didn't parse, return false
  return false;
};

txt.encode = function (data, type) {
  // Some code to convert data to TXT
  output = "";
  if (type == "HTML") {
    output = data.replace(/<br\/>/gi, '\n')
    			 .replace(/<br>/gi, '\n');
    var tmp = document.createElement("DIV");
    tmp.innerHTML = output;
    return tmp.textContent;
    return tmp;
  }
  // Didn't convert to TXT, return false
  return false;
};
