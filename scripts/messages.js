/*
* Message Proxy
* Copyright (C) Codexa Organization 2013.
*/

function MessageProxy() {
	var send, recv;
	var messageHandlers = {};
	var pub = this;

	this.registerMessageHandler = function registerMessageHandler(callback, /*optional*/ key, /*optional*/ useOnce) {
		// verify that callback is a function
		if(typeof callback !== "function") {
			throw new TypeError("callback must be a function");
		}
		// find unused key if not specified
		if (!key) {
			key = 0;
			while(messageHandlers[key]) { key++ };
		}
		// register handler
		messageHandlers[key] = {
			callback: callback,
			useOnce: !!useOnce
		};
		// return the used key
		return key;
	}

	this.unRegisterMessageHandler = function unRegisterMessageHandler(key) {
		messageHandlers[key] = undefined;
	}

	this.getMessageHandlers = function getMessageHandlers() {
		return messageHandlers;
	}

	this.setMessageHandlers = function setMessageHandlers(_messageHandlers) {
		messageHandlers = _messageHandlers;
	}

	this.postMessage = function postMessage(data) {
		send.postMessage(data, "*");
	}

	this.setSend = function setSend(_send) {
		send = _send;
	}

	function handler(e) {
		if(e.source !== send) {
			return;
		}
		// check for command
		if(!messageHandlers[e.data.command]) {
			throw new Error('No command registered: "' + e.data.command + '"');
		}
		// call correct callback
		messageHandlers[e.data.command].callback(e);
		// if command handler already removed return
		if(!messageHandlers[e.data.command]) { return }
		// if useOnce is specified, remove command handler
		if(messageHandlers[e.data.command].useOnce) {
			pub.unRegisterMessageHandler(e.data.command);
		}
	}

	this.setRecv = function setRecv(_recv) {
		if(recv) recv.removeEventListener("message", handler, false);
		recv = _recv;
		if(recv) recv.addEventListener("message", handler, false);
	}
};