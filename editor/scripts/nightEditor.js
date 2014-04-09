function initNight(doc, messageProxy){
  function nightEditor(nightMode) {
    if(nightMode) {
      doc.style.color = '#fff';
    } else {
      doc.style.color = '#000';
    }
  }
  messageProxy.registerMessageHandler(function(e) { nightEditor(e.data.nightMode); }, "night");
}