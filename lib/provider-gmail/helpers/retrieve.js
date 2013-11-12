'use strict';
/**
 * @file Retrieve mails from the account
 */

var Imap = require('imap');
var async = require('async');
var MailParser = require('mailparser').MailParser;
var xoauth2 = require('xoauth2');

var gmailUrl = require('./gmail-url.js');
var config = require('../../../config/configuration.js');
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jui', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var onMessage = function(googleAccount, msg, cb) {
  // Build a buffer containing all datas from the mail
  var attrs = null;

  var parser = new MailParser();
  msg.once('body', function(stream) {
    stream.pipe(parser);
  });

  msg.once('attributes', function(a) {
    attrs = a;
  });

  parser.on("end", function(mail_object) {
    var url = gmailUrl(googleAccount, attrs['x-gm-thrid']);
    var document = {
      identifier: url,
      actions: {
        show: url
      },
      metadatas: {
        id: attrs['x-gm-msgid'],
        threadid: attrs['x-gm-thrid'],
        from: mail_object.from,
        to: mail_object.to,
        subject: mail_object.subject,
        labels: attrs['x-gm-labels'],
        content: mail_object.text
      },
      datas: {
        html: mail_object.html
      }
    };

    cb(document);
  });
};


// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`from`.
// For each message, cb will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
module.exports = function(refreshToken, googleAccount, from, mailCb, finalCb) {
  // Generate a XOAUTH2.0 token
  // See https://developers.google.com/gmail/xoauth2_protocol
  // And https://github.com/andris9/xoauth2

  var xoauth2gen = xoauth2.createXOAuth2Generator( {
    user: googleAccount,
    clientId: config.google_id,
    clientSecret: config.google_secret,
    refreshToken: refreshToken
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
      var imap = new Imap( {
        xoauth2: token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', function(err) {
        cb(err, imap);
      });

      imap.once('error', function(err) {
        console.log("ERROR");
        throw err;
      });

      imap.connect();
    },
    // Open "All Mail" box
    function(imap, cb) {
      imap.openBox('[Gmail]/All Mail', true, function(err) {
        cb(err, imap);
      });
    },
    // Search and filter mails
    function(imap, cb) {
      //from = new Date(2013, 10, 10);
      var dformatted = from.getDate() + '-' + months[from.getMonth()] + "-" + from.getFullYear();
      imap.search([ 'ALL', ['SINCE', dformatted] ], function(err, results) {

        //results = [results[0]];
        cb(err, imap, results);
      });
    },
    function(imap, results, cb) {
      if(results.length === 0) {
        // All is up to date for mail since 'from variable'
        console.log("ALL DONE");
        return cb();
      }

      console.log(results.length + " mails for " + googleAccount);
      var f = imap.seq.fetch(results, { bodies: '' });
      f.on('message', function(msg) {
        console.log("Got mail");
        onMessage(googleAccount, msg, mailCb);
      });

      f.once('error', function(err) {
        console.log("ERROR", err);
        cb(err);
      });

      f.once('end', function() {
        // Can't do f.once('end', imap.end) for... unknown reasons.
        console.log("ENDED Fetching");
        imap.end();
      });

      imap.once('end', function(err) {
        console.log("IMAP ENDED");
        cb(err);
      });
    }
  ], finalCb);
};
