// This JS-based parser was made by the FireText/ODML contributors.

var odml = {};

odml.parse = function (data, type) {
  // Some code to convert ODML into something else
  output = "";
  if (type == "HTML") {
    // Location of <content> tags
    start = data.indexOf("<content")+"<content>".length;
    end = data.indexOf("</content>");
    // Check for errors
    if (start > end || start - "<content>".length == -1 || end == -1) {
      alert("Parse error! >:(");
    } else {
      return data.substring(start, end);
    }
  }
  // Didn't parse, return false
  return false;
};

odml.encode = function (data, type) {
  // Some code to convert data to ODML
  output = "";
  if (type == "HTML") {
    // Start document
    output += "<!DOCTYPE odml><odml>";
    // Add info
    output += "<info><title>TODO</title></info>";
    // Add content
    output += "<content>";
    output += data;
    output += "</content>";
    // End document
    output += "</odml>";
    // Return document
    return output;
  }
  // Didn't convert to ODML, return false
  return false;
};
