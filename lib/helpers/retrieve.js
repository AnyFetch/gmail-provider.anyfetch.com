'use strict';
/**
 * @file Retrieve mails from the account
 */

var async = require('async');
var xoauth2 = require('xoauth2');
var shellExec = require('child_process').exec;

var config = require('../../config/configuration.js');
var gmailScript = __dirname + "/../../gmail/wrapper.py";


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
      shellExec('python ' + gmailScript + " " + googleAccount + " " + accessToken + " " + fromUid, {maxBuffer: 20480 * 1024}, cb);
    },
    function withMails(stdout, stderr, cb) {
      var mails = JSON.parse(stdout.toString());
      mails.forEach(mailCb);
      cb();
    }
  ], finalCb);
};


module.exports = retrieveGmail;
