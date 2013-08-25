/*
* User Change log
* Copyright (C) Codexa Organisation 2013.
*/

/*
Log massages
================*/
// [DD/MM/YY SEC:MIN:HOURS] clientid {document name}? {document extension}? {action} {location(cloud|internal)}? {feature}?
var ln = " logged ", dn = " document ", en = " enabled ", din = " disabled ", cn = " changed to ", on = " opened ", nightmodeSelect = getSettings('nightmode');

firetext.user.log = {
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
	        night: " night mode" + cn + nightmodeSelect.value
	    },
	    open: {
	        about: on + "about",
	        ftsup: on + "Firetext support"
	    }
	}
};

function logm(docname, docext, act, feature, loc){
	var d = new Date();
	// DD/MM/YY 00:00:00
	this.date = d.getUTCDate() + "/" + (d.getUTCMonth()+1) + "/" + d.getUTCFullYear().toString().substr(2,2);
    this.time = d.getUTCSeconds() + ":" + d.getUTCMinutes() + ":" + d.getUTCHours();
    this.datime = "[" + date + " " + time + "]";
    this.clid = "";// get client ID
	this.docn = docname;
	this.doce = docext;
	this.act = firetext.user.log.m[action];
}