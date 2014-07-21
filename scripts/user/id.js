/*
* User ID
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Variables
------------------------*/
// Namespace
firetext.user.id = {};

/* User ID
------------------------*/
firetext.user.id.init = function () {
	var ClId = firetext.user.id._$Cl,
			CClId = window.localStorage.getItem("$#ClId");
	// Client ID Verification and Validation
	if (ClId === undefined && CClId === null){
		firetext.user.id.generate();
	} else if(ClId === undefined){
		firetext.user.id._$Cl = localStorage.getItem("$#ClId");
	} else if (CClId === null){
		localStorage.setItem("$#ClId", firetext.user.id._$Cl);
	} else if(ClId.length/4 !== 16 || CClId.length/4 !== 16){
		firetext.user.id.generate();
		firetext.user.id.init();
	}
};

firetext.user.id.generate = function () {
	var edi = "",
			ch1 = "",
			nm1 = "",
			nm2 = "",
			sb1 = "",
			sb2 = "",
			sb3 = "",
			Cep = [],
			Cij = [],
			ClID = "",
			chnm = [],
			chi = function (l) {
				var arg = arguments[1], a = 0, chp;
				if (arg !== undefined){
				a = arg;
					chp = chnm[a].charAt(l);
				} else {
					chp = chnm[a].charAt(chnm[a].indexOf("D") + (l));
				}
				return chp;
				};

	chnm = ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", "0123456789", "#?!_", "&%", "$!£"];
	edi = chi(-1)+chi(0)+chi(2)+chi(42)+chi(-1);
	
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
	
	Cep = [chi(3,2)+chi(0,2)+chi(0,4)+chi(26)+chi(4)+chi(8-5,1)+chi(9-5,1)+chi(21)+chi(23)+chi(3)+chi(1,3)+chi(0,4)+chi(2,4)+chi(5-5,1)+chi(14-5,1)+chi(5,5-5,1)].join();
	Cij = [edi + sb1 + sb2 + ch1 + nm1 + chnm[2].charAt(0) + nm2 + sb3].join();
	ClID = CryptoJS.AES.encrypt(Cij, Cep).toString(); // 64-bit number
	window.localStorage.setItem("$#ClId", ClID);
	window.firetext.user.id._$Cl == ClID;
	
	return ClID;
};
