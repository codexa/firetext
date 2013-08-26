/*
* User Change log
* Copyright (C) Codexa Organisation 2013.
*/
'use strict';
/*
Log massages
================*/
// [DD/MM/YY SEC:MIN:HOURS] clientid {document name}? {document extension}? {action} {location(cloud|internal)}? {feature}?
(function () {
    var ln = " logged ",
        dn = " document ",
        en = " enabled ",
        din = " disabled ",
        cn = " changed to ",
        on = " opened ";
    var nightm = window.onload = function () {
        var nightmodeSelect = document.querySelector('#nightmode-select').value;
    };

    window.firetext.user.log = {
        m: {
            log: {
                lin: ln + "in from ",
                out: ln + "out from "
            },
            doc: {
                open: dn + "opened at ",
                close: dn + "closed at ",
                create: dn + "created at ",
                ddelete: dn + "deleted at "
            },
            enable: {
                autosave: en + "autosave",
                lastfile: en + "load last file on start up",
                zen: en + "zen mode"
            },
            disable: {
                autosave: din + "autosave",
                lastfile: din + "load last file on start up",
                zen: din + "zen mode"
            },
            change: {
                night: " night mode" + cn + nightm
            },
            open: {
                about: on + "about",
                ftsup: on + "Firetext support"
            }
        }
    };

    /*
        Usage: on io operation mention document name and extension as "d: mydocument.docx"
        all arguments (docname&ext, action, location(cloud/internal))
    */
    window.firetext.user.logm = function (act) {
        var d = new Date();
        // DD/MM/YY 00:00:00
        this.date = d.getUTCDate() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCFullYear().toString().substr(2, 2);
        this.time = d.getUTCSeconds() + ":" + d.getUTCMinutes() + ":" + d.getUTCHours();
        this.datime = "[" + date + " " + time + "]";
        this.clid = ""; // get client ID
        this.docn = docname;
        this.doce = docext;
        this.action = window.log.m[act.slice(0, act.indexOf("."))][act.slice(act.indexOf(".")+1, act.length)];
        this.feloc = fealoc;
		var logm = [datime + " " + clid + " " + action];
        /*if (docn !== "undefined") {
            log.push(docn);
        };
        if (docext !== "undefined") {
            log.push(doce);
        }*/
        var log = console.log(logm);
        return log;
    };;
})();