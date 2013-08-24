/*
* User Change log
* Copyright (C) Codexa Organisation 2013.
*/

/*
Log massages
================*/
// [date&time] clientid {document name}? {document extension}? {message} {location(cloud|internal)}? {feature}?
firetext.user.log = {
	mn: { ln : " logged ", dn : " document ", en : " enabled ", din : " disabled ", cn : " changed to ", on : " opened "},
	m: {
	    log: {
	        lin: mn.ln + "in from ",
	        out: mn.ln + "out from "
	    },
	    doc: {
	        open: mn.dn + "opened at ",
	        close: mn.dn + "closed at ",
	        create: mn.dn + "created at ",
	        ddelete: mn.dn + "deleted at "
	    },
	    enable: {
	        autosave: mn.en + "autosave",
	        lastfile: mn.en + "load last file on start up",
	        zen: en + "zen mode"
	    },
	    disable: {
	        autosave: mn.din + "autosave",
	        lastfile: mn.din + "load last file on start up",
	        zen: din + "zen mode"
	    },
	    change: {
	        nval: nightmodeSelect.value,
	        night: " night mode" + mn.cn + this.nval
	    },
	    open: {
	        about: mn.on + "about",
	        ftsup: mn.on + "Firetext support"
	    }
	}
}