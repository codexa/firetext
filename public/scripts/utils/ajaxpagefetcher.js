/***********************************************
* Ajax Page Fetcher- by JavaScript Kit (www.javascriptkit.com)
***********************************************/

var ajaxpagefetcher={
loadingmessage: "Loading...",
exfilesadded: "",

connect:function(containerid, pageurl, bustcache, jsfiles, cssfiles){
	var page_request = false
	var bustcacheparameter=""
	if (window.XMLHttpRequest) // if Mozilla, IE7, Safari etc
		page_request = new XMLHttpRequest()
	else if (window.ActiveXObject){ // if IE6 or below
		try {
		page_request = new ActiveXObject("Msxml2.XMLHTTP")
		} 
		catch (e){
			try{
			page_request = new ActiveXObject("Microsoft.XMLHTTP")
			}
			catch (e){}
		}
	}
	else
		return false
	var ajaxfriendlyurl=pageurl.replace(/^http:\/\/[^\/]+\//i, "http://"+window.location.hostname+"/") 
	page_request.onreadystatechange=function(){ajaxpagefetcher.loadpage(page_request, containerid, pageurl, jsfiles, cssfiles)}
	if (bustcache) //if bust caching of external page
		bustcacheparameter=(ajaxfriendlyurl.indexOf("?")!=-1)? "&"+new Date().getTime() : "?"+new Date().getTime()
	document.getElementById(containerid).innerHTML=ajaxpagefetcher.loadingmessage //Display "fetching page message"
	page_request.open('GET', ajaxfriendlyurl+bustcacheparameter, true)
	page_request.send(null)
},

loadpage:function(page_request, containerid, pageurl, jsfiles, cssfiles){
	if (page_request.readyState == 4 && (page_request.status==200 || window.location.href.indexOf("http")==-1)){
		document.getElementById(containerid).innerHTML=page_request.responseText
		for (var i=0; i<jsfiles.length; i++)
			this.loadjscssfile(jsfiles[i], "js")
		for (var i=0; i<cssfiles.length; i++)
			this.loadjscssfile(cssfiles[i], "css")
		this.pageloadaction(pageurl) //invoke custom "onpageload" event
	}
},

createjscssfile:function(filename, filetype){
	if (filetype=="js"){ //if filename is a external JavaScript file
		var fileref=document.createElement('script')
		fileref.setAttribute("type","text/javascript")
		fileref.setAttribute("src", filename)
	}
	else if (filetype=="css"){ //if filename is an external CSS file
		var fileref=document.createElement("link")
		fileref.setAttribute("rel", "stylesheet")
		fileref.setAttribute("type", "text/css")
		fileref.setAttribute("href", filename)
	}
	return fileref
},

loadjscssfile:function(filename, filetype){ //load or replace (if already exists) external .js and .css files
	if (this.exfilesadded.indexOf("["+filename+"]")==-1){ //if desired file to load hasnt already been loaded
		var newelement=this.createjscssfile(filename, filetype)
		document.getElementsByTagName("head")[0].appendChild(newelement)
		this.exfilesadded+="["+filename+"]" //remember this file as being added
	}
	else{ //if file has been loaded already (replace/ refresh it)
 	var targetelement=(filetype=="js")? "script" : (filetype=="css")? "link" : "none" //determine element type to create nodelist using
 	var targetattr=(filetype=="js")? "src" : (filetype=="css")? "href" : "none" //determine corresponding attribute to test for
 	var allsuspects=document.getElementsByTagName(targetelement)
 	for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
  	if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!=null && allsuspects[i].getAttribute(targetattr).indexOf(filename)!=-1){
   	var newelement=this.createjscssfile(filename, filetype)
   	allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i])
  	}
		}
 }
},


pageloadaction:function(pageurl){
	this.onpageload(pageurl) //call customize onpageload() function when an ajax page is fetched/ loaded
},

onpageload:function(pageurl){
 //do nothing by default
},

load:function(containerid, pageurl, bustcache, jsfiles, cssfiles){
	var jsfiles=(typeof jsfiles=="undefined" || jsfiles=="")? [] : jsfiles
	var cssfiles=(typeof cssfiles=="undefined" || cssfiles=="")? [] : cssfiles
	this.connect(containerid, pageurl, bustcache, jsfiles, cssfiles)
}

} //End object

//Sample usage:
//1) ajaxpagefetcher.load("mydiv", "content.htm", true)
//2) ajaxpagefetcher.load("mydiv2", "content.htm", true, ["external.js"])
//3) ajaxpagefetcher.load("mydiv2", "content.htm", true, ["external.js"], ["external.css"])
//4) ajaxpagefetcher.load("mydiv2", "content.htm", true, ["external.js", "external2.js"])
//5) ajaxpagefetcher.load("mydiv2", "content.htm", true, "", ["external.css", "external2.css"])