// Copyright (C) Codexa Organisation 2013.

var txt = {};

txt.parse = function (data, type) {
  // Some code to convert TXT into something else
  output = "";
  if (type == "HTML") {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = output;
    output = tmp.textContent;
    output = data.replace(/\n/gi, '<br/>');
    return output;
  }
  // Didn't parse, return false
  return false;
};

txt.encode = function (data, type) {
  // Some code to convert data to TXT
  output = "";
  if (type == "HTML") {
    output = data.replace(/<br\/>/gi, '\n');
    output = output.replace(/<br>/gi, '\n');
    var tmp = document.createElement("DIV");
    tmp.innerHTML = output;
    return tmp.textContent;
    return tmp;
  }
  // Didn't convert to TXT, return false
  return false;
};
