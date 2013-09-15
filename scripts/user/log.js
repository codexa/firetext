/*
* User Change Log
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Variables
------------------------*/
// Namespace
firetext.user.log = {};

(function(){
  // [DD/MM/YY HOURS:MIN:SEC] clientid {document name}? {document extension}? {action} {location(cloud|internal)}? {feature}?

  /* User action/error log
  ------------------------*/
  window.firetext.user.log.init = function () {
    // Error
    window.onload = function(){
      window.onerror = function(message, url, lineNumber) {
        var s = "e:";
        window.firetext.user.log.add("log.er", s+message, s+lineNumber, s+url);
        return false;
      };

      window.addEventListener('error', function(e) { 
        var s = "e:";
        window.firetext.user.log.add("log.er", s+e);
      }, false);
    }
  };


  /*
  Usage: on io operation mention document name and extension as "d:mydocument.docx", the location as "l:Dropbox/file" and errors as "e:errormessage"
  all arguments (docname&ext, action, location(cloud/internal))
  */

  window.firetext.user.log.add = function (act) {
    var ln = "logged ",
      dn = "document ",
      en = "enabled ",
      din = "disabled ",
      cn = "changed to ",
      on = "opened ",
      nightm = document.querySelector('#nightmode-select').value;
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
          night: "night mode" + cn + nightm
        },
        open: {
          about: on + "about",
          ftsup: on + "Firetext support"
        },
        er: "error occured:"
      }
    };
    var d = new Date(), logm = [], log, arg = arguments, fname;
        
    // DD/MM/YY HH:MM:SS
    var date = d.getUTCDate() + "/" + (d.getUTCMonth() + 1) + "/" + d.getUTCFullYear().toString().substr(2, 2);
    var time = d.getUTCHours()+ ":" +d.getUTCMinutes()+ ":" +d.getUTCSeconds(); 
    var datime = "[" + date + " " + time + "]";
    fname = date + " " + time + " log.txt";
    var clid = window.firetext.user.id._$Cl;

    if (arg.length > 1) {
      var acts = arg[1].split(".");
      var action = log.m[acts[0]][acts[1]];
    } else {
      var acts = act.split(".");
      var action = log.m[acts[0]][acts[1]];
    }
    
    logm = [datime, clid, action];
    
    if (arg.length > 1) {
      for (var i = 0; i < arg.length; i++) {
        if (arg[i].slice(0, 2) === "d:") {
          doc = arg[i].slice(2, arg[i].length);
          logm.splice(2, 0, doc);
        }
        if (arg[i].slice(0, 2) === "l:") {
          loc = arg[i].slice(2, arg[i].length);
          logm.push(loc);
        }
        if (arg[i].slice(0, 2) === "e:") {
          er = arg[i].slice(2, arg[i].length);
          logm.push(er);
        }
      }
    }

    logm = logm.join(" ");

    // write to file
    log = new Blob([logm], {type: "text/plain;charset=utf-8"});
    window.saveAs(log, fname);
    
    return log;
  };
})();
