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
    var ln = "logged ",
    dn = "document ",
    en = "enabled ",
    din = "disabled ",
    cn = "changed to ",
    on = "opened ",
    nightm = window.onload = function () {
        var nightmodeSelect = document.querySelector('#nightmode-select').value;
    };

    var log = {
        m: {
            log: {
                lin: ln + "in from",
                out: ln + "out from"
            },
            doc: {
                open: dn + "opened at",
                close: dn + "closed at",
                create: dn + "created at",
                ddelete: dn + "deleted at"
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
        Usage: on io operation mention document name and extension as "d:mydocument.docx" and the location as "l:Dropbox/file"
        all arguments (docname&ext, action, location(cloud/internal))
    */
    window.firetext.user.logm = function (act) {
        var d = new Date(),
            logm = [],
            log, arg = arguments;
        // DD/MM/YY 00:00:00
        this.date = d.getUTCDate() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCFullYear().toString().substr(2, 2);
        this.time = d.getUTCSeconds() + ":" + d.getUTCMinutes() + ":" + d.getUTCHours();
        this.datime = "[" + date + " " + time + "]";
        this.clid = window.firetext.user.$_ClientID;
        if (arg.length > 2) {
            this.action = window.log.m[arg[1].slice(0, arg[1].indexOf("."))][arg[1].slice(arg[1].indexOf(".") + 1, arg[1].length)];
        } else {
            this.action = window.log.m[act.slice(0, act.indexOf("."))][act.slice(act.indexOf(".") + 1, act.length)];
        }
        logm = [datime, clid, action];
        if (arg.length > 1) {
            if (arg[0].slice(0, 2) === "d:") {
                console.log(arg[0].slice(2, arg[0].length));
                this.doc = arg[0].slice(2, arg[0].length);
                logm.splice(2, 0, doc);
            }
            if (arg[1].slice(0, 2) === "l:") {
                this.loc = arg[1].slice(2, arg[1].length);
                logm.push(loc);
            } else if (arg[2].slice(0, 2) === "l:") {
                this.loc = arg[2].slice(2, arg[2].length);
                logm.push(loc);
            }
        }
        logm = logm.join(" ");
        log = console.log(logm); // need to implement write to file
        return log;
    };
})();