/*
* Recent Docs
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Namespace Container
------------------------*/ 
firetext.analytics = {};
firetext.analytics.doc = {
    name:,
    modifyDate:,
    size:,
    words:,
    characters: 
};


/* Recent Docs
------------------------*/
// Initalize doc analytics
firetext.analytics.doc.init = function () {
  firetext.analytics.doc.findWords = function(text){
    var count,
        temp;
    // Sanitize
    text = text.replace(/\W+/g, " ");
    text = text.split(" ");
    count = text.length;
    firetext.analytics.doc.words = count;
  }

};
