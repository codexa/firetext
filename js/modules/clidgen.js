/*
 * User Client ID Generator
 * Copyright (C) Codexa Organisation 2013.
 */
'use strict';

(function () { 
  window.firetext.user.genClId = function () {
    var edi = "",
        ch1 = "",
        nm1 = "",
        nm2 = "",
        sb1 = "",
        sb2 = "",
        sb3 = "",
        Cij = [],
        ClID = "",
        chnm = [],
        chi = function (l) {
            var chp = chnm[0].charAt(chnm[0].indexOf("D") + (l));
            return chp;
        };
    chnm = ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", "0123456789", "#?!", "&%", "$!"];
    edi = chi(-1) + chi(0) + chi(2) + chi(42) + chi(-1);
    for (var i = 0; i < 3; i++) {
        nm1 += chnm[1].charAt(Math.floor(Math.random() * chnm[1].length));
        nm2 += chnm[1].charAt(Math.floor(Math.random() * chnm[1].length));
    }
    for (i = 0; i < 2; i++) {
        sb1 += chnm[4].charAt(Math.floor(Math.random() * chnm[4].length));
        sb2 += chnm[3].charAt(Math.floor(Math.random() * chnm[3].length));
        sb3 += chnm[2].charAt(Math.floor(Math.random() * chnm[2].length));
    }
    for (i = 0; i < 3; i++) {
        ch1 += chnm[0].charAt(Math.floor(Math.random() * chnm[0].length));
    }
    Cij = [edi + sb1 + sb2 + ch1 + nm1 + chnm[2].charAt(0) + nm2 + sb3].join();
    ClID = window.CryptoJS.AES.encrypt(Cij, "_#$655&876%$£095").toString; // 64-bit number
    window.localStorage.setItem("$#ClId", ClID);
    window.firetext.user.$_ClientID == ClID;
    return ClID;
  };
})();