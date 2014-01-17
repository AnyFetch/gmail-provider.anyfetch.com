'use strict';

var config = require('./config/configuration.js');
var xoauth2 = require('xoauth2');
var async = require('async');
var Imap = require('imap');
var inspect = require('util').inspect;


var imap = null;
var xoauth2gen = xoauth2.createXOAuth2Generator( {
  user: config.test_account,
  clientId: config.google_id,
  clientSecret: config.google_secret,
  refreshToken: config.test_refresh_token
});

async.waterfall([
  // Create a token from refresh_token
  function(cb) {
    xoauth2gen.getToken(cb);
  },
  // Open imap connection
  function(token, accessToken, cb) {
    // Create a new Imap connection
    // See https://github.com/mscdex/node-imap

    console.log("Start of imap");

    imap = new Imap( {
      xoauth2: token,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
    imap.once('ready', function(err) {
      console.log("Start")
      imap.getBoxes("[Gmail]/", function(err, boxes){

        var nameOfAllGmailBox = "[Gmail]/";

        var listBoxGmail = boxes["[Gmail]"].children;
        for(var key in listBoxGmail){
          var length = listBoxGmail[key].attribs["length"];
          for( var i = 0 ; i < length ; i++) {
            if(listBoxGmail[key].attribs[i] === "\\All") {
              nameOfAllGmailBox += key;
              console.log("Found : ", nameOfAllGmailBox)
            }
          }
        }
        console.log(inspect(boxes, { showHidden: true, depth: null }));
      });
    });

    imap.once('error', function(err){
      console.log("ERROR IMAP", err);

    })

    imap.connect();
  }]);

var getAllEmailBox = function(err, cb){
  imap.getBoxes("[Gmail]/", function(err, boxes){
    console.log(boxes["[GMAIL]"]);
    console.log(inspect(boxes, { showHidden: true, depth: null }));
  });
}