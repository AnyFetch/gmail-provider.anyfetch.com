'use strict';
/**
 * @file Retrieve mails from the account
 */

var async = require('async');
var xoauth2 = require('xoauth2');
var childProcess = require('child_process');
var JSONStream = require('JSONStream');

var config = require('../../config/configuration.js');
var gmailScript = __dirname + "/../../python/wrapper.py";

// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`fromUid`.
// For each message, `mailCb` will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
var retrieveGmail = function(refreshToken, googleAccount, fromUid, mailCb, finalCb)  {
  fromUid = fromUid || 0;

  async.waterfall([
    function getXoauthToken(cb) {
      // Generate a XOAUTH2.0 token
      // See https://developers.google.com/gmail/xoauth2_protocol
      // And https://github.com/andris9/xoauth2
      var xoauth2gen = xoauth2.createXOAuth2Generator( {
        user: googleAccount,
        clientId: config.google_id,
        clientSecret: config.google_secret,
        refreshToken: refreshToken
      });
      xoauth2gen.getToken(cb);
    },
    function retrieveMails(token, accessToken, cb) {
      var lastUid = fromUid;

      var spawn = childProcess.spawn;

      // console.log('python', gmailScript, googleAccount, accessToken, fromUid);
      var proc = spawn('python', [gmailScript, googleAccount, accessToken, fromUid]);
      var stream = JSONStream.parse([true]);
      proc.stdout.pipe(stream);
      proc.stderr.on('data', function(data) {
        console.error("ERR:", data.toString());
        cb(null, lastUid);
      });
      proc.on('error', function(err) {
        console.error("ERR:", err);
        cb(null, lastUid);
      });

      stream.on('data', function(mail) {
        mailCb(mail);
        if(mail._type === "mail") {
          lastUid = mail.uid;
        }
      });

      stream.on('root', function(root, count) {
        console.log("GOT " + count + " mails. Final UID: " + lastUid);
        cb(null, lastUid + 1);
      });

      stream.on('error', function(err) {
        console.error("ERR:", err);
        cb(null, lastUid);
      });
    },
  ], finalCb);
};


module.exports = retrieveGmail;
