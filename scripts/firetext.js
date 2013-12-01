/*
 * Firetext
 * Copyright (C) Codexa Organization 2013.
 * Licenced released under the GPLv3. 
 * See LICENSE in "licenses/gpl.txt"
 * or at http://www.gnu.org/licenses/gpl-3.0.txt
 */

'use strict';


/* Variables
------------------------*/
// Namespaces
var firetext = {};
firetext.user = {};
firetext.parsers = {};
firetext.analytics = {};

// Misc
firetext.initialized = new CustomEvent('firetext.initialized');
firetext.isInitialized = false;
var html = document.getElementsByTagName('html')[0], head = document.getElementsByTagName("head")[0];
var loadSpinner, editor, toolbar, toolbarInterval, editWindow, doc, editState, rawEditor, tabRaw, tabDesign;
var deviceType, fileChanged, saveTimeout, saving;
var bold, boldCheckbox, italic, italicCheckbox, justifySelect, strikethrough, strikethroughCheckbox;
var underline, underlineCheckbox;
var locationLegend, locationSelect, locationDevice, locationDropbox; // 0.4 , locationGoogle;
var bugsense;

// Lists
var welcomeDocsList, welcomeDeviceArea, welcomeDeviceList, openDialogDeviceArea, openDialogDeviceList;
var welcomeRecentsArea, welcomeRecentsList;

/* 0.4
// Google Drive
var welcomeGoogleArea, welcomeGoogleList, openDialogGoogleArea, openDialogGoogleList;
*/

// Cache
var appCache = window.applicationCache;


/* Start
------------------------*/
window.addEventListener('DOMContentLoaded', function () { firetext.init(); });

firetext.init = function () {
  // Initialize Bugsense
  bugsenseInit();

  // Find device type
  checkDevice();

  /* Select important elements for later */
  // Misc
  loadSpinner = document.getElementById('loadSpinner');
  spinner();
  tabDesign = document.getElementById('tab-design');
  tabRaw = document.getElementById('tab-raw');
  editor = document.getElementById('editor');
  rawEditor = document.getElementById('rawEditor');
  toolbar = document.getElementById('edit-zone');
  editWindow = document.getElementById('edit');
  locationLegend = document.getElementById('locationLegend');
  locationSelect = document.getElementById('createDialogFileLocation');
  
  // Lists
  welcomeDocsList = document.getElementById('welcome-docs-list');
  welcomeDeviceArea = document.getElementById('welcome-device-area');
  welcomeDeviceList = document.getElementById('welcome-device-list');
  openDialogDeviceArea = document.getElementById('open-dialog-device-area');
  openDialogDeviceList = document.getElementById('open-dialog-device-list');
  welcomeRecentsArea = document.getElementById('welcome-recents-area');
  welcomeRecentsList = document.getElementById('welcome-recents-list');
  welcomeDropboxArea = document.getElementById('welcome-dropbox-area');
  welcomeDropboxList = document.getElementById('welcome-dropbox-list');
  openDialogDropboxArea = document.getElementById('open-dialog-dropbox-area');
  openDialogDropboxList = document.getElementById('open-dialog-dropbox-list');
  
  /* 0.4
  welcomeGoogleArea  = document.getElementById('welcome-google-area');
  welcomeGoogleList = document.getElementById('welcome-google-list');
  openDialogGoogleArea = document.getElementById('open-dialog-google-area');
  openDialogGoogleList = document.getElementById('open-dialog-google-list');
  */
  
  // Formatting
  bold = document.getElementById('bold');
  boldCheckbox = document.getElementById('boldCheckbox');
  italic = document.getElementById('italic');
  italicCheckbox = document.getElementById('italicCheckbox');
  justifySelect = document.getElementById('justify-select');
  strikethrough = document.getElementById('strikethrough');
  strikethroughCheckbox = document.getElementById('strikethroughCheckbox');
  underline = document.getElementById('underline');
  underlineCheckbox = document.getElementById('underlineCheckbox');
  
  // Initalize recent docs
  firetext.recents.init();
  
  // Initialize the editor
  initEditor();
  
  // Initialize Settings
  firetext.settings.init();
  
  // Init extIcon
  extIcon();

  // Initiate user id
  firetext.user.id.init();
  
  // Add event listeners
  toolbar.addEventListener(
    'mousedown', function mouseDown(event) {
      event.preventDefault();
      event.target.classList.toggle('active');
    }
  );
  toolbar.addEventListener(
    'mouseup', function mouseDown(event) {
      if (event.target.classList.contains('sticky') != true) {
        event.target.classList.remove('active');
      }
    }
  );
  editWindow.addEventListener(
    'mouseenter', function mouseDown(event) {
      editor.focus();
    }
  );
  
  welcomeDocsList.addEventListener(
    'contextmenu', function contextmenu(event) {
      editDocs();
    }
  );
  
  // Initialize IO
  firetext.io.init(null, function() {
    // Initialize sharing
    cloud.init();
    
    // Check for recent file, and if found, load it.
    if (firetext.settings.get('autoload') == 'true') {
      var lastDoc = [firetext.settings.get('autoload.dir'), firetext.settings.get('autoload.name'), firetext.settings.get('autoload.ext'), firetext.settings.get('autoload.loc')];
      if (firetext.settings.get('autoload.wasEditing') == 'true') {
        // Wait until Dropbox is authenticated
        if (lastDoc[3] == 'dropbox') {
          if (firetext.settings.get('dropbox.enabled') == 'true') {
            window.addEventListener('cloud.dropbox.authed', function() {
              loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
              spinner('hide');
            });
          } else {
            regions.nav('welcome');
            spinner('hide');
          }
        } else {
          loadToEditor(lastDoc[0], lastDoc[1], lastDoc[2], lastDoc[3]);
          spinner('hide');
        }
      } else {
        regions.nav('welcome');
        spinner('hide');
      }
    } else {
      regions.nav('welcome');
      spinner('hide');
    }
  
    // Dispatch init event
    window.dispatchEvent(firetext.initialized);
    firetext.isInitialized = true;
  });
  
  // Update Doc Lists
  updateDocLists();

  // Initialize Night Mode
  night();
};


/* Add dialog
------------------------*/
function updateAddDialog() {
  if (locationSelect.length < 1) {
    // Disable elements
    document.getElementById('add-dialog-create-button').style.pointerEvents = 'none';
    document.getElementById('add-dialog-create-button').style.color = '#999';
    document.querySelector('#add [role="main"]').style.display = 'none';
    
    // Create notice
    if (!document.getElementById('no-storage-notice')) {
      var noStorageNotice = document.createElement('div');
      noStorageNotice.id = 'no-storage-notice';
      noStorageNotice.classList.add('redAlert');
      noStorageNotice.textContent = 'You have not set up a storage method!';
      document.getElementById('add').insertBefore(noStorageNotice, document.querySelector('#add [role="main"]'));
    }
  } else {
    // Enable elements
    document.getElementById('add-dialog-create-button').setAttribute('style', 'pointer-events: auto;');
    document.querySelector('#add [role="main"]').style.display = 'block';
  
    // Remove notice if present
    if (document.getElementById('no-storage-notice')) {
      document.getElementById('no-storage-notice').parentNode.removeChild(document.getElementById('no-storage-notice'));
    }
  }
}


/* Bugsense
------------------------*/
function bugsenseInit() {
  if (firetext.settings.get('stats.enabled') != 'false') {
    bugsense = new Bugsense({ appversion: '0.3', apiKey: '' });
  } else {
    bugsense = null;
  }
}


/* Doc lists
------------------------*/
function updateDocLists(lists) {
  if (!lists) {
    lists = [];
    lists.push('all');
  }
  
  if (lists.indexOf('all') != '-1' | lists.indexOf('recents') != '-1') {
    // Recents
    buildDocList(firetext.recents.get(), [welcomeRecentsList], "Recent Documents", 'internal', true);
  }
    
  if (lists.indexOf('all') != '-1' | lists.indexOf('internal') != '-1') {
    // Internal
    firetext.io.enumerate('/', function(DOCS) {
      buildDocList(DOCS, [welcomeDeviceList, openDialogDeviceList], "Documents Found", 'internal');
    });
  }
    
  if (lists.indexOf('all') != '-1' | lists.indexOf('cloud') != '-1') {
    // Cloud
    cloud.updateDocLists(lists);
  }
}

function completeHTML(tableHTML) {
/*
    Purpose: given a incomplete HTML string <a><b><c>text</c> should complete html <a><b><c>text</c></b></a>
    Test cases:
        var tableHTML = "<table><tbody><tr><td><b>1</b></td><th>2</th><td>3</td></tr>";
        //               012345678901234567890123456789012345678901234567890123456789
        //               0         1         2         3         4         5 
        console.log( completeHTML(tableHTML) );
        //Should produce <table><tbody><tr><td><b>1</b></td><th>2</th><td>3</td></tr></tbody></table>
*/
    var r = /(<[a-zA-Z]+[ >]+|<\/[a-zA-Z]+>)/;
    var i=0;
    var tooManyIterations=50;
    var bail = false;
    var tagSense = new Array();
    //
    i += tableHTML.substr(i).search(r);
    var rResult = r.exec(tableHTML.substr(i));
    if( (rResult != null) && (rResult.length > 0) ) {
        if( rResult[0].indexOf("</") >= 0 ) {
            var tag = rResult[0].substr(2,rResult[0].length - 3 )
            tagSense.pop();
        } else {
            var tag = rResult[0].substr(1,rResult[0].length - 2 );
            tagSense.push(tag);
        }
    }
    //
    while(r.test( tableHTML.substr(i) ) && !bail) {
        i += tableHTML.substr(i).search(r) + 1;
        var rResult = r.exec(tableHTML.substr(i));
        if( (rResult != null) && (rResult.length > 0) ) {
            if( rResult[0].indexOf("</") >= 0 ) {
                var tag = rResult[0].substr(2,rResult[0].length - 3 )
                var t = tagSense.pop();
                if(t != tag) {
                    console.warn("completeHTML() argument contains broken HTML");
                }
            } else {
                var tag = rResult[0].substr(1,rResult[0].length - 2 );
                tagSense.push(tag);
            }
        }
        if(tooManyIterations-- <= 0) {
            bail = true;
            console.warn("infinate loop avoided");
        }
    }
    while(tagSense.length > 0) {
        var t = tagSense.pop();
        tableHTML += "</" + t + ">";   
    }
    return tableHTML;
}

function cleanForPreview(text, documentType) {
  /*
    Test cases:
        console.log( cleanForPreview("1sdf 2sdf 3sfd 4sdf-5sdf 6sdf 7sdf", ".txt") );
        console.log( cleanForPreview("1sdf 2sdf 3sfd 4sdf-5sdf-6sdf 7sdf", ".txt") );
        console.log( cleanForPreview("1sdf 2sdf 3sfd 4sdf 5sdf-6sdf 7sdf", ".txt") );
        console.log( cleanForPreview("1sdf 2sdf-3sfd-4sdf-5sdf-6sdf-7sdf", ".txt") );
        console.log( cleanForPreview("1sdf 2sdf-3sfd-4sdf-5sdf-", ".txt") );
        console.log( cleanForPreview("1sdf-2sdf-3sfd-4sdf-5sdf-6sdf-7sdf", ".txt") );
        console.log( cleanForPreview("wwww1 wwww2 wwww3 wwww4 wwww5 wwww6", ".txt") );
        //                            01234567890123456789012345678901234567890
        //                            0         1         2         3         4
        
        var html1 = "<b>1sdf</b> <u>2sdf</u> <i>3sdf</i> 4sdf-5sdf 6sdf 7sdf";
        var html7 = "<b>1sdf</b>-<u>2sdf</u>-<i>3sfd</i>-4sdf-5sdf-6sdf-7sdf";
        console.log( cleanForPreview(html1, ".html") );
        console.log( cleanForPreview(html7, ".html") );
  */
  var approxPreviewWidthInCharacters = 100;
  var additionalCharactersTillWhitespace = 5;
  var regWhiteSpace
  switch(documentType) {
    default:
    case ".txt":
      if(text.length <= approxPreviewWidthInCharacters) {
        return text;
      } else {
        var nextWhitespace = text.substr(approxPreviewWidthInCharacters).search(/\s/);
        var reverseText = text.substr(0,approxPreviewWidthInCharacters).split("").reverse().join("");
        var prevWhitespace = reverseText.search(/\s/);
        if( nextWhitespace == -1 ) {
            nextWhitespace = text.length - approxPreviewWidthInCharacters;
        }
        if( (prevWhitespace > additionalCharactersTillWhitespace) && (nextWhitespace > additionalCharactersTillWhitespace)) {
            //Next whitespace too far
            return text.substr(0, approxPreviewWidthInCharacters) + "...";
        } else if( nextWhitespace <= prevWhitespace  ) {
            //Closest whitespace in less than additionalCharactersTillWhitespace more characters
            return text.substr(0, approxPreviewWidthInCharacters + nextWhitespace);
        } else {
            //Closest whitespace is before our truncation point
            return text.substr(0, approxPreviewWidthInCharacters - prevWhitespace) + (prevWhitespace == -1 ? "..." : "" );
        }
      }
      return text.replace(/\n/g," ").substr(0, approxPreviewWidthInCharacters);
    case ".html":
        var htmlNode = document.createElement("div");
        htmlNode.innerHTML = text;
        var textStripped = htmlNode.textContent;
        var textTruncated = cleanForPreview(textStripped, ".txt");
        textTruncated = textTruncated.replace(/\.\.\.$/, "");
        var r = "^(<[a-zA-Z]+.*?>)*" + textTruncated.split("").join(".*?(<[a-zA-Z]+.*?>)*");
        var rDynamic = new RegExp(r);
        if(! rDynamic.test(text) ) {
          return textTruncated;
        } else {
          var htmlOfTextWanted = rDynamic.exec(text)[0];
          var remainingHTML = text.sub(htmlOfTextWanted.length);
          var firstNewTagAfterHTMLOfTextWanted = remainingHTML.search(/<[a-zA-Z]/);
          if(firstNewTagAfterHTMLOfTextWanted != -1) {
              remainingHTML = remainingHTML.substr(0, firstNewTagAfterHTMLOfTextWanted);
              htmlOfTextWanted = htmlOfTextWanted + remainingHTML;
          }
          //htmlOfTextWanted has the html we want, however it may also contain line breaks
          htmlNode.innerHTML = htmlOfTextWanted;
          var nodesToRemove = htmlNode.getElementsByTagName("br");
          while( (nodesToRemove != undefined) && (nodesToRemove.length > 0) ) {
              nodesToRemove[0].parentElement.insertBefore(document.createTextNode(" "), nodesToRemove[0]);
              nodesToRemove[0].parentElement.removeChild(nodesToRemove[0]);
              nodesToRemove = htmlNode.getElementsByTagName("br");
          }
          nodesToRemove = htmlNode.getElementsByTagName("img");
          while( (nodesToRemove != undefined) && (nodesToRemove.length > 0) ) {
              nodesToRemove[0].parentElement.insertBefore(document.createTextNode(" "), nodesToRemove[0]);
              nodesToRemove[0].parentElement.removeChild(nodesToRemove[0]);
              nodesToRemove = htmlNode.getElementsByTagName("img");
          }
          nodesToRemove = htmlNode.getElementsByTagName("hr");
          while( (nodesToRemove != undefined) && (nodesToRemove.length > 0) ) {
              nodesToRemove[0].parentElement.insertBefore(document.createTextNode(" "), nodesToRemove[0]);
              nodesToRemove[0].parentElement.removeChild(nodesToRemove[0]);
              nodesToRemove = htmlNode.getElementsByTagName("hr");
          }
          htmlNode.innerHTML = completeHTML(htmlNode.innerHTML);
          var bodyTag = htmlNode.getElementsByTagName("body");
          if (bodyTag[0]) {
            htmlNode.innerHTML = bodyTag[0].innerHTML;
          }
          //the following will take a table of n rows and make it a table of 1 row
          var nodesToChange = htmlNode.getElementsByTagName("table");
          for(var t=0; t<nodesToChange.length; t++) {
            var table = nodesToChange[t];
            var trs = table.getElementsByTagName("tr");
            for(var i=1; i<trs.length; i++) {
                var tds = trs[i].getElementsByTagName("td");
                var ths = trs[i].getElementsByTagName("th");
                var cells = new Array();
                for(var j=0; j<tds.length; j++) {
                    cells.push(tds[j]);
                }
                for(var j=0; j<ths.length; j++) {
                    cells.push(ths[j]);
                }
                cells.sort(sortByCellIndex);
                for(var j=0; j<cells.length; j++) {
                    trs[0].appendChild(cells[j]);
                }
            }
            while( (trs != undefined) && (trs.length > 1) ) {
                trs[1].parentElement.removeChild( trs[1] );
                trs = table.getElementsByTagName("tr");
            }
          }
          return htmlNode.innerHTML;
        }
        return text;
    case ".docx":
      console.warn("cleanForPreview docx not implemented text = %s.", text);
      return text;
  }
}

function sortByCellIndex(a,b) {
    return a.cellIndex - b.cellIndex;
}

function buildDocListItems(DOCS, listElms, description, output, location, preview) {
  // Handle description
  if (!description) {
    description = '';
  }
  
  switch (DOCS[0][2]) {
    case ".txt":
      description = firetext.parsers.plain.parse(cleanForPreview(description, DOCS[0][2]), "HTML");
      break;
    case ".docx":
      var tmp = document.createElement("DIV");
      tmp.appendChild(description.HTMLout());
      description = tmp.innerHTML;
    case ".html":
      description = cleanForPreview(description, DOCS[0][2]);
      break;
    default:
      break;
  }
  
  // UI refinements
  var icon, directory;
  if (location != 'internal' && location && location != '') {
    icon = ('document-' + location);
  } else {
    icon = 'document';
    location = 'internal';
  }
  if (DOCS[0][0].charAt(0) == '/' && DOCS[0][0].length > 1) {
    directory = DOCS[0][0].slice(1);
  } else {
    directory = DOCS[0][0];
  }
      
  // Generate item
  output += '<li class="fileListItem" data-click="loadToEditor" data-click-directory="'+DOCS[0][0]+'" data-click-filename="'+DOCS[0][1]+'" data-click-filetype="'+DOCS[0][2]+'" data-click-location="'+location+'">';
  output += '<a href="#">';
  if (description != '') {
    output += '<div class="fileItemDescription">'+description+'</div>';
  }
  output += '<div class="fileItemInfo">';
  output += '<aside data-icon="arrow" class="pack-end"></aside>';  
  output += '<p class="fileItemName">'+DOCS[0][1]+DOCS[0][2]+'</p>'; 
  output += '<p class="fileItemPath">'+directory+DOCS[0][1]+DOCS[0][2]+'</p>';
  output += '</div>'; 
  output += '</a></li>';
  
  // Display output HTML
  for (var i = 0; i < listElms.length; i++) {
    listElms[i].innerHTML = output;
  }
  
  // Base case
  if (DOCS.length <= 1) {    
    return;
  }
  
  // Per doc locations
  if (DOCS[1][4] && DOCS[1][4] != location) {
    location = DOCS[1][4];
  }
  
  // build next item
  if (preview == true) {
    firetext.io.load(DOCS[1][0], DOCS[1][1], DOCS[1][2], function (result) {
      buildDocListItems(DOCS.slice(1, DOCS.length), listElms, result, output, location, preview);
    }, location);
  } else {
    buildDocListItems(DOCS.slice(1, DOCS.length), listElms, null, output, location);  
  }
}

function buildDocList(DOCS, listElms, display, location, preview) {
  if (listElms && DOCS) {
    // Make sure list is not an edit list
    for (var i = 0; i < listElms.length; i++) {
      listElms[i].setAttribute("data-type", "list");
    }
    
    if (DOCS.length > 0) {
      // Per doc locations
      if (DOCS[0][4] && DOCS[0][4] != location) {
        location = DOCS[0][4];
      }
      
      // build next item
      if (preview == true) {
        firetext.io.load(DOCS[0][0], DOCS[0][1], DOCS[0][2], function (result) {
          buildDocListItems(DOCS, listElms, result, "", location, preview);
        }, location);
      } else {
        buildDocListItems(DOCS, listElms, null, "", location, preview);      
      }
    } else {
      // No docs message
      var output = '<li style="margin-top: -5px" class="noLink">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
      output += '</li>';
      
      // Display output HTML
      for (var i = 0; i < listElms.length; i++) {
        listElms[i].innerHTML = output;
      }
    }
  }
}

function buildEditDocList(DOCS, listElm, display, location) {
  if (listElm != undefined) {
    // Output HTML
    var output = "";
    
    if (DOCS.length != 0) {
      // generate each list item
      for (var i = 0; i < DOCS.length; i++) {
        output += '<li>';
        output += '<label class="danger"><input type="checkbox" class="edit-selected"/><span></span></label>';
        output += '<p data-location="'+location+'">'+DOCS[i][0]+DOCS[i][1]+'<em>'+DOCS[i][2]+'</em></p>';
        output += '</li>';
      }   
       
      // Make list an edit list
      listElm.setAttribute("data-type","edit");
    } else {
      output += '<li style="margin-top: -5px" class="noLink">';
      output += '<p>No ' + display + '</p>';
      output += "<p>Click the compose icon to create one.</p>";
      output += '</li>';
    }
    
    // Display output HTML
    listElm.innerHTML = output;
  }
}


/* Display
------------------------*/
// Make save banner hidden after 4 seconds
function hideSaveBanner() {
  window.setTimeout(function() {
    document.getElementById("save-banner").hidden = true;
  }, 4000);
}

// Show the banner
function showSaveBanner() {
  document.getElementById("save-banner").hidden = false;
  hideSaveBanner();
}
  
// File Extension Icon on Create new file
function extIcon() {
  var extf = document.getElementById('extIconFile');
  var option = document.getElementById('createDialogFileType').value;
  if (option != '.html' && option != '.txt' && option != '.docx' && option != '.doc' && option != '.rtf') {
    option = 'default';
  }
  extf.src = ('style/icons/extensions/'+option.replace(/./, '')+'.png');
}


/* Editor
------------------------*/ 
function initEditor() {
  // Initialize Designer
  editor.contentWindow.document.documentElement.setAttribute('style','height: 100%; padding: 0; margin: 0;');
  editor.contentWindow.document.body.setAttribute('style','height: 100%; padding: 0; margin: 0;');
  doc = document.createElement('DIV');
  doc.setAttribute('contentEditable', 'true');
  doc.id = 'tempEditDiv';
  doc.setAttribute('style','border: none; padding: 10px; font-size: 20px; outline: none; min-height: calc(100% - 20px); word-wrap: break-word;');
  editor.contentWindow.document.body.appendChild(doc);
  doc = editor.contentWindow.document.getElementById('tempEditDiv');
  editor.contentWindow.document.execCommand('enableObjectResizing', false, 'true');
  
  // Hide and show toolbar.
  // For reviewers, just in case this looks like a security problem:
  // This frame is sandboxed, so I had to add the listeners to do this.
  // The content CANNOT call any of the parents functions, so this is not a security issue.
  doc.addEventListener('focus', function (event) {
    processActions('data-focus', event.target);
  });
  doc.addEventListener('blur', function (event) {
    processActions('data-blur', event.target);
  });
  
  // Initialize Raw Editor
  rawEditor.setAttribute('contentEditable', 'true');
  
  // Nav to the design tab
  regions.tab(document.querySelector('#editTabs'), 'design');
}

function watchDocument(filetype) {
  // Add listener to update raw
  if (filetype == '.html') {
    prettyPrint();
      
    doc.addEventListener('input', function() {
      fileChanged = true;
      updateViews(rawEditor, doc.innerHTML, 'text');
    });
        
    // Add listener to update design
    rawEditor.addEventListener('input', function() {
      fileChanged = true;
      updateViews(doc, rawEditor.textContent, 'html');
    });
    rawEditor.addEventListener('blur', function() {
      prettyPrint();
    });
  } else {
    doc.addEventListener('input', function() {
      fileChanged = true;
      autosave();
    });
  }  
}

function forceAutosave() {
  autosave(true);
}

function autosave(force) {
  if (firetext.settings.get('autosave') != 'false') {
    if (!saveTimeout | force == true) {
      if (saving != true) {
        // Add timeout for saving
        saveTimeout = window.setTimeout(saveFromEditor, 1000);
      } else {
        saveTimeout = window.setTimeout(forceAutosave, 1000);        
      }
    }
  }
}

function updateViews(destView, source, contentType) {
  if (destView) {
    if (contentType == 'html') {
      destView.innerHTML = source;      
    } else {
      destView.textContent = source;
    }
    autosave();
  }
}


/* Edit Mode
------------------------*/ 
function editDocs() {
  if (editState == true) {    
    // Clear lists
    welcomeDeviceList.innerHTML = '';
    welcomeDropboxList.innerHTML = '';
    
    updateDocLists(['all']);
    editState = false;
    welcomeRecentsArea.style.display = 'block';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 5rem)';
    regions.navBack();
  } else {    
    welcomeRecentsArea.style.display = 'none';
    document.querySelector('#welcome div[role=main]').style.height = 'calc(100% - 12rem)';
    editState = true;
    
    // Clear lists
    welcomeDeviceList.innerHTML = '';
    welcomeDropboxList.innerHTML = '';
    
    // Code to build list
    firetext.io.enumerate('/', function(result) {
      buildEditDocList(result, welcomeDeviceList, 'Documents found', 'internal');
    });
    if (firetext.settings.get('dropbox.enabled') == 'true' && cloud.dropbox.client) {
      cloud.dropbox.enumerate('/Documents', function(DOCS) {
        buildEditDocList(DOCS, welcomeDropboxList, "Dropbox Documents Found", 'dropbox');
      });
    }
    watchCheckboxes();
    
    regions.nav('welcome-edit-mode');
  }
}

function watchCheckboxes() {
  // Only use this function in edit mode
  if (editState == true) {
    var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
    for (var i = 0; i < checkboxes.length; i++ ) {
      checkboxes[i].onchange = updateSelectButton;
    }
  }
}

function updateSelectButton() {
  if (numSelected() == 0) {
    // Add select all button
    document.getElementById("selectButtons").innerHTML = '<button data-click="selectAll">Select all</button><button data-click="delete" class="danger">Delete selected</button>';
  }
  else {
    // Add deselect all button
    document.getElementById("selectButtons").innerHTML = '<button data-click="deselectAll">Deselect all</button><button data-click="delete" class="danger">Delete selected</button>';
  }
}

function numSelected() {
  // Only use this function in edit mode
  if (editState == true) {
    var n = 0;
    var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
    for (var i = 0; i < checkboxes.length; i++ ) {
      if (checkboxes[i].checked) {
        n++;
      }
    }
    return n;
  }
}

function selectAll() {
  // Only use this function in edit mode
  if (editState == true) {
    var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
    for (var i = 0; i < checkboxes.length; i++ ) {
      checkboxes[i].checked = true;
    }
    updateSelectButton();
  }
}

function deselectAll() {
  // Only use this function in edit mode
  if (editState == true) {
    var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
    for (var i = 0; i < checkboxes.length; i++ ) {
      checkboxes[i].checked = false;
    }
    updateSelectButton();
  }
}

function deleteSelected(confirmed) {
  // Only use this function in edit mode
  if (editState == true) {
    // Get selected files
    var checkboxes = welcomeDocsList.getElementsByClassName('edit-selected');
    var selected = Array.prototype.filter.call(checkboxes, function(elm) {
      return elm.checked;
    });
    
    if (confirmed != true && confirmed != 'true') {
      if (selected.length == 1) {
        var confirmDeletion = confirm('Do you want to delete this file?');      
      } else if (selected.length > 1) {
        var confirmDeletion = confirm('Do you want to delete these files?');      
      } else {
        alert('No files selected.');
        return;
      }
      if (confirmDeletion != true) {
        return;
      }
    }
    
    // Delete selected files
    for (var i = 0; i < selected.length; i++) {
      // Get filename
      var filename = selected[i].parentNode.parentNode.getElementsByTagName("P")[0].textContent;
      var location = selected[i].parentNode.parentNode.getElementsByTagName("P")[0].getAttribute('data-location');
      
      // Remove from RecentDocs
      firetext.recents.remove((filename + location), true);
      
      // Delete file
      firetext.io.delete(filename, location);
      
      // Remove from list
      var elm = selected[i].parentNode.parentNode;
      elm.parentNode.removeChild(elm);
    }
  }
}


/* Format
------------------------*/ 
function formatDoc(sCmd, sValue) {
  editor.contentWindow.document.execCommand(sCmd, false, sValue);
}

function updateToolbar() {
  if (doc != undefined && document.getElementById("edit").classList.contains('current')) {
    // Bold
    if (editor.contentDocument.queryCommandState("bold")) {
      bold.classList.add('active');
      boldCheckbox.checked = true;
    } else {
      bold.classList.remove('active');
      boldCheckbox.checked = false;
    }
    
    // Italic
    if (editor.contentDocument.queryCommandState("italic")) {
      italic.classList.add('active');
      italicCheckbox.checked = true;
    } else {
      italic.classList.remove('active');
      italicCheckbox.checked = false;
    }
    
    // Justify
    if (editor.contentDocument.queryCommandState("justifyCenter")) {
      justifySelect.value = 'Center';
    } else if (editor.contentDocument.queryCommandState("justifyFull")) {
      justifySelect.value = 'Justified';
    } else if (editor.contentDocument.queryCommandState("justifyRight")) {
      justifySelect.value = 'Right';
    } else {
      justifySelect.value = 'Left';
    }
    
    // Underline
    if (editor.contentDocument.queryCommandState("underline")) {
      underline.classList.add('active');
      underlineCheckbox.checked = true;
    } else {
      underline.classList.remove('active');
      underlineCheckbox.checked = false;
    }
    
    // Strikethrough
    if (editor.contentDocument.queryCommandState("strikeThrough")) {
      strikethrough.classList.add('active');
      strikethroughCheckbox.checked = true;
    } else {
      strikethrough.classList.remove('active');
      strikethroughCheckbox.checked = false;
    }
  }
}

/* Actions (had to do this because of CSP policies)
------------------------*/ 
document.addEventListener('click', function(event) {
  processActions('data-click', event.target);
});

document.addEventListener('submit', function(event) {
  processActions('data-submit', event.target);
});

document.addEventListener('keypress', function(event) {
  if (event.key == 13 | event.keyCode == 13) {
    processActions('data-enter', event.target);
  }
});

document.addEventListener('mousedown', function(event) {
  processActions('data-mouse-down', event.target);
});

document.addEventListener('change', function(event) {
  processActions('data-change', event.target);
});

document.addEventListener('focus', function(event) {
  processActions('data-focus', event.target);
});

document.addEventListener('blur', function(event) {
  processActions('data-blur', event.target);
});

function processActions(eventAttribute, target) {
  if (target && target.getAttribute) {
    if (target.hasAttribute(eventAttribute) != true) {
      while (target.parentNode && target.parentNode.getAttribute) {
        target = target.parentNode;
        if (target.hasAttribute(eventAttribute)) {
          break;
        }
      }
    }
    var calledFunction = target.getAttribute(eventAttribute);
    if (calledFunction == 'loadToEditor') {
      loadToEditor(target.getAttribute(eventAttribute + '-directory'), target.getAttribute(eventAttribute + '-filename'), target.getAttribute(eventAttribute + '-filetype'), target.getAttribute(eventAttribute + '-location'));
    } else if (calledFunction == 'nav') {
      var navLocation = target.getAttribute(eventAttribute + '-location');
      if (navLocation == 'welcome') {
        updateDocLists(['recents', 'cloud']);
      } else if (navLocation == 'open') {
        updateDocLists(['cloud']);
      } else if (navLocation == 'settings') {
        firetext.settings.init();
      }
      if (document.getElementById(navLocation).getAttribute('role') != 'dialog') {
        editFullScreen(false);      
      }
      regions.nav(navLocation);
    } else if (calledFunction == 'navBack') {
      regions.navBack();
    } else if (calledFunction == 'sidebar') {
      regions.sidebar(target.getAttribute(eventAttribute + '-id'));
    } else if (calledFunction == 'saveFromEditor') {
      saveFromEditor(true, true);
    } else if (calledFunction == 'closeFile') {
      // Check if file is changed.  If so, prompt the user to save it.
      if (firetext.settings.get('autosave') == 'false' && fileChanged == true) {
        if (target.getAttribute(eventAttribute + '-action')) {
          var action = target.getAttribute(eventAttribute + '-action');          
          if (action == 'yes') {
            regions.navBack();
            saveFromEditor();
            regions.nav('welcome');          
          } else if (action == 'no') {
            fileChanged = false;
            regions.navBack();
            regions.nav('welcome');          
          } else {
            regions.navBack();
          }
        } else {
          regions.nav('save-file');
          return;
        }
      }
      
      // Clear toolbar update interval
      window.clearInterval(toolbarInterval);
      
      // Navigate to the welcome screen
      regions.nav('welcome');
    } else if (calledFunction == 'formatDoc') {
      formatDoc(target.getAttribute(eventAttribute + '-action'), target.getAttribute(eventAttribute + '-value'));
      if (target.getAttribute(eventAttribute + '-back') == 'true') {
        regions.navBack();
      }
    } else if (calledFunction == 'createFromDialog') {
      createFromDialog();
    } else if (calledFunction == 'editDocs') {
      editDocs();
    } else if (calledFunction == 'extIcon') {
      extIcon();
    } else if (calledFunction == "delete") {
      deleteSelected(target.getAttribute(eventAttribute + '-confirmed'));
    } else if (calledFunction == "selectAll") {
      selectAll();
    } else if (calledFunction == "deselectAll") {
      deselectAll();
    } else if (calledFunction == 'tab') {
      regions.tab(target.parentNode.id, target.getAttribute(eventAttribute + '-name'));
    } else if (calledFunction == 'clearForm') {
      if (target.parentNode.children[0]) {
        target.parentNode.children[0].value = '';
      }
    } else if (calledFunction == 'clearCreateForm') {
      clearCreateForm();
    } else if (calledFunction == 'fullscreen') {
      if (target.getAttribute(eventAttribute + '-state') == 'off') {
        editFullScreen(false);      
      } else {
        editFullScreen();
      }
    } else if (calledFunction == 'browser') {
      var browseLocation = '';
      var browserFrame = document.getElementById('browserFrame');
      
      // Set browser frame's src to blank
      browserFrame.src = 'about:blank';
      
      // Get location
      if (target.getAttribute(eventAttribute + '-location') == 'about') {
        browseLocation = 'about.html';
      } else if (target.getAttribute(eventAttribute + '-location') == 'support') {
        browseLocation = 'http://firetext.codexa.org/support';
      } else if (target.getAttribute(eventAttribute + '-location') == 'rate') {
        browseLocation = 'https://marketplace.firefox.com/app/firetext/ratings/add';
      } else {
        browseLocation = target.getAttribute(eventAttribute + '-location');
      }
      
      // Open a new tab on desktop browsers
      if (deviceType == 'desktop') {
        window.open(browseLocation);
        return;
      }
      
      // Open the internal browser on mobile
      browserFrame.src = browseLocation;
      regions.nav('browser');
    } else if (calledFunction == 'justify') {
      var justifyDirection = justifySelect.value;
      if (justifyDirection == 'Justified') {
        justifyDirection = 'Full';
      }
      formatDoc('justify'+justifyDirection);
    } else if (calledFunction == 'hideToolbar') {
      if (document.getElementById('currentFileType').textContent != '.txt') {
        document.getElementById('edit-bar').style.display = 'none';
        editor.classList.add('no-toolbar');
      }
    } else if (calledFunction == 'showToolbar') {
      if (document.getElementById('currentFileType').textContent != '.txt') {
        document.getElementById('edit-bar').style.display = 'block';
        editor.classList.remove('no-toolbar');
      }
    } else if (calledFunction == 'hyperlink') {
      if (target.getAttribute(eventAttribute + '-dialog')) {
        formatDoc('createLink', document.getElementById('web-address').value);
        regions.navBack();
        regions.navBack();
      } else {
        regions.nav('hyperlink');
        if (editor.contentDocument.queryCommandState("createLink")) {
          document.getElementById('web-address').value = editor.contentDocument.queryCommandValue("createLink");
        } else {
          document.getElementById('web-address').value = '';        
        }
      }
    } else if (calledFunction == 'image') {
      if (target.getAttribute(eventAttribute + '-location')) {
        // Get location
        var location = target.getAttribute(eventAttribute + '-location');
        
        // Close location window
        regions.navBack();
        
        // Pick image based on location
        if (location == 'internal') {
          var pick = new MozActivity({
            name: "pick",
            data: {
              type: ["image/*"]
            }
          });

          pick.onsuccess = function () { 
            var image = this.result.blob;
            var reader = new FileReader();
        
            // Read blob
            reader.addEventListener("loadend", function() {
              formatDoc('insertImage', reader.result);
              regions.navBack();
            });
        
            reader.readAsDataURL(image);
          };

          pick.onerror = function () { 
          };        
        } else {
          if (target.getAttribute(eventAttribute + '-dialog') == 'true') {
            formatDoc('insertImage', document.getElementById('image-address').value);
            regions.navBack();
          } else {
            regions.nav('image-web');
          }
        }
        
        // Clear inputs
        document.getElementById('image-address').value = null;
      } else {
        if (navigator.mozSetMessageHandler) {
          // Web Activities are supported, allow user to choose them or web URI
          regions.nav('image-location');
        } else {
          // Just allow web URIs
          regions.nav('image-web');          
        }
      }
    } else if (calledFunction == 'table') {
      if (target.getAttribute(eventAttribute + '-dialog')) {
        if (parseInt(document.getElementById('table-rows').value) &&
            parseInt(document.getElementById('table-columns').value)) {
          var rows = parseInt(document.getElementById('table-rows').value);
          var cols = parseInt(document.getElementById('table-columns').value);            
        } else {
          alert('Please enter a valid value (e.g. 2 or 5)');
          return;
        }
      
        // Make sure # is above 0
        if ((rows > 0) && (cols > 0)) {
          // Generate HTML
          var output = '<style>table.default { border: 1px solid #000; width: 100%; }';
          output += ' table.default td { border: 1px solid #000; }</style>';
          output += '<table class="default">';
          for (var r = 0; r < rows; r++) {
            output += '<tr>';
            for (var c = 0; c < cols; c++) {
              output += '<td></td>';
            }
            output += '</tr>';
          }
          
          // Output HTML
          output += '</table>';
          formatDoc('insertHTML', output);
          
          // Nav Back
          regions.navBack();
          regions.navBack();          
        }
      } else {
        regions.nav('table');
      }
      
      // Clear inputs
      document.getElementById('table-rows').value = null;
      document.getElementById('table-columns').value = null;
    } else if (calledFunction == 'clearRecents') {
      firetext.recents.reset();
      alert('Your recent documents list has been successfully eliminated!');
    }
  }
}


/* Miscellaneous
------------------------*/
function checkDevice() {
  var width, height;
  if (window.screen) {
    width = window.screen.availWidth;
    height = window.screen.availHeight;
  } else if (window.innerWidth && window.innerHeight) {
    width = window.innerWidth;
    height = window.innerHeight;
  } else if (document.body) {
    width = document.body.clientWidth;
    height = document.body.clientHeight;
  }  
  if (width <= 766) {      
    deviceType = 'mobile';  
  } else {
    deviceType = 'desktop';
  }
  
  if (window.opera) {
    alert('Warning: Your browser does not support some vital Firetext technology.  Please download Firefox from https://mozilla.org/firefox');
  }
};

function clearCreateForm() {
  document.getElementById('createDialogFileName').value = '';
  document.getElementById('createDialogFileType').value = '.html';
  extIcon();
}

function spinner(state) {
  if (state == 'hide') {
    loadSpinner.classList.remove('shown');  
  } else {
    loadSpinner.classList.add('shown');  
  }
}

function editFullScreen(enter) {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && enter != false) {  // current working methods
    // Make app fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
    
    // Special editor UI
    document.querySelector('#edit header:first-child').style.display = 'none';
    document.getElementById('editTabs').setAttribute('data-items', '4.1');
    document.querySelector('#editTabs .tabToolbar').classList.add('visible');
    editor.classList.add('fullscreen');
  } else {
    // Exit fullscreen
    if (document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
    
    // Regular editor UI
    document.querySelector('#edit header:first-child').style.display = 'block';
    document.getElementById('editTabs').setAttribute('data-items', '2');
    document.querySelector('#editTabs .tabToolbar').classList.remove('visible');
    editor.classList.remove('fullscreen');
  }
}
