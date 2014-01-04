function initNight(doc){
  return function nightEditor(nightMode) {
    if(nightMode) {
      doc.style.color = '#fff';
    } else {
  	  doc.style.color = '#000';
    }
  }
}