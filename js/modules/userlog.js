/*
* User Change Log
* Copyright (C) Codexa Organization 2013.
*/

'use strict';

define(["app/firetext", "module/FileSaver"], function(firetext, saveAs) {

  /* User change log creator
  ------------------------*/
  // [DD/MM/YY HOURS:MIN:SEC] clientid {document name}? {document extension}? {action} {location(cloud|internal)}? {feature}?

  var ln = "logged ",
  dn = "document ",
  en = "enabled ",
  din = "disabled ",
  cn = "changed to ",
  on = "opened ",
  nightm = nightmodeSelect = document.querySelector('#nightmode-select').value;

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
      },
      er: "error occured:"
    }
  };

  /*
    Usage: on io operation mention document name and extension as "d:mydocument.docx", the location as "l:Dropbox/file" and errors as "e:errormessage"
    all arguments (docname&ext, action, location(cloud/internal))
  */

  firetext.user.logm = function (act) {
    var d = new Date(),
      logm = [],
      log, arg = arguments, fname;
    // DD/MM/YY HH:MM:SS
    this.date = d.getUTCDate() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCFullYear().toString().substr(2, 2);
    this.time = d.getUTCHours()+ ":" +d.getUTCMinutes()+ ":" +d.getUTCSeconds(); 
    this.datime = "[" + date + " " + time + "]";
    fname = date + " " + time + "log";
    this.clid = window.firetext.user.$_ClientID;
    if (arg.length > 2) {
      this.action = log.m[arg[1].slice(0, arg[1].indexOf("."))][arg[1].slice(arg[1].indexOf(".") + 1, arg[1].length)];
    } else {
      this.action = log.m[act.slice(0, act.indexOf("."))][act.slice(act.indexOf(".") + 1, act.length)];
    }
    logm = [datime, clid, action];
    if (arg.length > 1) {
      for(var i=0; i<arg.length; i++){
        if (arg[i].slice(0, 2) === "d:") {
        this.doc = arg[i].slice(2, arg[i].length);
        logm.splice(2, 0, doc);
        }
        if (arg[i].slice(0, 2) === "l:") {
        this.loc = arg[i].slice(2, arg[i].length);
        logm.push(loc);
        }
        if (arg[i].slice(0, 2) === "e:") {
        this.er = arg[i].slice(2, arg[i].length);
        logm.push(er);
        }
      }
    }
    logm = logm.join(" ");
    // write to file
    log = new Blob([logm], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "resources/userlog/"+fname+".txt");
    return log;
  };
})();