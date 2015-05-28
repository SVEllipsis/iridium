#!/usr/bin/node
// Demo software for Iridium Node.JS library
// Version 1.5 (2012-12-28)
// (C) 2012 Razvan Dragomirescu <razvan.dragomirescu@veri.fi>

var iridium = require("./iridium.js");
var sys = require('sys');
var zlib = require('zlib');
var dateFormat = require('dateformat');
var execSync = require('exec-sync');

var pending = 0;
var lock = 0;

sys.log("Welcome to the Ellipsis Global Interconnecting Gateway")

iridium.open({
    debug: 0,
    port: "/dev/tty.usbserial-8254"
});

/*
  IRIDIUM LISTENERS
*/

iridium.on('initialized', function() {
    sys.log("[SBD] IRIDIUM INITIALIZED");
    iridium.getSystemTime(function(err, ctime) {
        sys.log("Current Iridium time is "+ctime);
        var fdate = dateFormat(ctime, "mmddHHMMyyyy.ss");
    })
});

iridium.on('ringalert', function() {
    sys.log("[SBD] RING ALERT");
    mailboxCheck();
});

iridium.on('newmessage', function(message, queued) {
    sys.log("[SBD] Received new message "+message);
    sys.log("[SBD] There are "+queued+" messages still waiting");
    pending = queued;
});


/*
  METHODS TO HANDLE EVENTS
*/

// mailboxCheck
function mailboxCheck() {
    if (lock) {
        pending++;
    } else {
        sendMessage("");
    }
}

// send a plain text message
function sendMessage(text) {
    lock=1;
    iridium.sendMessage(text, function(err, momsn) {
        if (err==null) {
            if (text) sys.log("[SBD] Message sent successfully, assigned MOMSN "+momsn);

            // check to see if there are other messages pending - if there are, send a new mailbox check to fetch them in 1 second
            if (pending>0) setTimeout(function() {
                sendMessage("");
            }, 1000);
            else {
                lock=0;
            }
        } else {
            sys.log("[SBD] Iridium returned error "+err+", will retry in 20s");
            setTimeout(function() {
                sendMessage(text);
            }, 20000);
        }
    });
}

// send a binary message
function sendBinaryMessage(buffer) {
    lock=1;
    iridium.sendBinaryMessage(buffer, function(err, momsn) {
        if (err==null) {
            if (buffer) sys.log("[SBD] Binary message sent successfully, assigned MOMSN "+momsn);

            // check to see if there are other messages pending - if there are, send a new mailbox check to fetch them in 1 second
            if (pending>0) setTimeout(function() {
                sendMessage("");
            }, 1000);
            else {
                lock=0;
            }
        } else {
            sys.log("[SBD] Iridium returned error "+err+", will retry in 20s");
            setTimeout(function() {
                sendBinaryMessage(buffer);
            }, 20000);
        }
    });
}
