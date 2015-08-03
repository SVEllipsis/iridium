#!/usr/bin/node
// Demo software for Iridium Node.JS library
// Version 1.5 (2012-12-28)
// (C) 2012 Razvan Dragomirescu <razvan.dragomirescu@veri.fi>

var prompt = require('prompt');
var iridium = require("./iridium.js");
var zlib = require('zlib');
var dateFormat = require('dateformat');

var pending = 0;
var lock = 0;

console.log("Welcome to the Ellipsis Global Gateway\r\n");
console.log("......now conecting to iridium........\r\n");

prompt.start();

iridium.open({
    debug: 0,
    port: "/dev/tty.usbserial-8254"
});

/*
  IRIDIUM LISTENERS
*/

iridium.on('initialized', function() {
    console.log("...........CONNECTED!..................\r\n")
    console.log("Lets get transmitting: \r\n")

    prompt.get(['latitude', 'longitude', 'message'], function (err, result) {
      if (err) { return onErr(err); }

      message = result.latitude+","+result.longitude+","+result.message;

      console.log("......now sending........");
      console.log(message);
      sendMessage(message);

    });
});

iridium.on('ringalert', function() {
    console.log("[SBD] RING ALERT");
    mailboxCheck();
});

iridium.on('newmessage', function(message, queued) {
    console.log("[SBD] Received new message "+message);
    console.log("[SBD] There are "+queued+" messages still waiting");
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
            if (text) console.log("[SBD] Message sent successfully, assigned MOMSN "+momsn);

            // check to see if there are other messages pending - if there are, send a new mailbox check to fetch them in 1 second
            if (pending>0) setTimeout(function() {
                sendMessage("");
            }, 1000);
            else {
                lock=0;
            }
        } else {
            console.log("[SBD] Iridium returned error "+err+", will retry in 20s");
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
            if (buffer) console.log("[SBD] Binary message sent successfully, assigned MOMSN "+momsn);

            // check to see if there are other messages pending - if there are, send a new mailbox check to fetch them in 1 second
            if (pending>0) setTimeout(function() {
                sendMessage("");
            }, 1000);
            else {
                lock=0;
            }
        } else {
            console.log("[SBD] Iridium returned error "+err+", will retry in 20s");
            setTimeout(function() {
                sendBinaryMessage(buffer);
            }, 20000);
        }
    });
}
