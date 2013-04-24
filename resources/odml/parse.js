// This JS-based parser was made by the FireText/ODML contributors.

var odml = {};

odml.parse = function (data, outputType) {
  // Some code to convert ODML into something else
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
