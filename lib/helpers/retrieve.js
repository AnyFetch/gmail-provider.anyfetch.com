'use strict';
/**
 * @file Retrieve mails from the account
 */

var async = require('async');
var xoauth2 = require('xoauth2');
var childProcess = require('child_process');

var config = require('../../config/configuration.js');
var gmailScript = __dirname + "/../../python/wrapper.py";

// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`cursor.uid`.
// For each message, `mailCb` will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
var retrieveGmail = function(refreshToken, googleAccount, cursor, next)  {
  cursor = cursor || {reverse: true, uid: 0};

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
      var maxUid = cursor.uid;

      var spawn = childProcess.spawn;

      // console.log('python', gmailScript, googleAccount, accessToken, cursor.uid, cursor.reverse ? 'reverse': '');
      var proc = spawn('python', [gmailScript, googleAccount, accessToken, cursor.uid, cursor.reverse ? 'reverse': '']);

      // Handle stdout
      var buffer = "";
      proc.stdout.on('data', function(chunk) {
        buffer += chunk;
        var mails = buffer.split(/\n{2,}/);
        buffer = mails.pop();

        if(mails.length > 0) {
          mails = mails.map(JSON.parse);
          maxUid = mails.reduce(function(maxUid, mail) {
            if(mail._type === "mail") {
              return Math.max(maxUid, mail.uid);
            }
            return maxUid;
          }, maxUid);

          next(null, mails);
        }
      });

      proc.stdout.once('end', function() {
        process.nextTick(function() {
          if(cursor.reverse) {
            // We were going on reverse order, and have successfully reached the first mail.
            // We can now keep going "the normal way".
            cursor.reverse = false;
          }
          cb(null, maxUid + 1);
        });
      });

      proc.stdout.on('error', function(err) {
        console.error("ERR:", err);
        cb(null, maxUid);
      });

      // Handle stderr
      proc.stderr.on('data', function(data) {
        console.error("ERR:", data.toString());
        cb(null, maxUid);
      });
      proc.on('error', function(err) {
        console.error("ERR:", err);
        cb(null, maxUid);
      });
    },
  ], function(err, maxUid) {
    cursor.uid = maxUid;
    next(err, [], maxUid);
  });
};


module.exports = retrieveGmail;
