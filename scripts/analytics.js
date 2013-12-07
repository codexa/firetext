/*
 * Recent Docs
 * Copyright (C) Codexa Organization 2013.
 */

'use strict';


/* Namespace Container
------------------------*/
firetext.analytics = {};
firetext.analytics.doc = {
    name: ,
    path: ,
    size: ,
    modifyDate: ,
    words: ,
    characters:
};


/* Recent Docs
------------------------*/
// Initalize doc analytics
firetext.analytics.doc.init = function() {
    var FtanlCD = window.localStorage.getItem("FtanlCD");
    if (FtanlCD) {

    } else if (firetext.analytics.doc.name) {
        window.localStorage.setItem("FtanlCD", JSON.stringify(firetext.analytics.doc);
    }
};
firetext.analytics.doc.findWords = function(text) {
    var count,
        temp;
    // Sanitize
    temp = text.replace(/\W+/g, " ");
    temp = temp.split(" ");
    count = temp.length;
    firetext.analytics.doc.words = count;
}
firetext.analytics.doc.findChars = function(text) {
    var count,
        temp;
    // Sanitize
    temp = text.split("");
    count = temp.length;
    firetext.analytics.doc.characters = count;
}
firetext.analytics.doc.modified = function() {

    firetext.analytics.doc.modifyDate = ;
}
