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
      var dformatted = months[from.getMonth()] + " " + from.getDate() + ", " + from.getFullYear();
      console.log("filtering");
      imap.search([ 'ALL', ['SINCE', dformatted] ], function(err, results) {
        console.log("got", results);
        cb(err, imap, results);
      });
    },
    function(imap, results, cb) {
      if(results.length === 0) {
        // All is up to date for mail since 'from variable'
        return cb();
      }

      //console.log(results.length + " new mails for " + googleAccount);
      var f = imap.seq.fetch(results, { bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE)', 'TEXT'] });
      f.on('message', function(msg) {
        // Build a buffer containing all datas from the mail
        var buffer = '';
        var attrs = null;

        msg.on('body', function(stream, info) {
          // Add data to buffer.
          // Headers are added to the top of the buffer,
          // Body after.
          stream.on('data', function(chunk) {
            if(info.which === 'TEXT') {
              buffer += chunk.toString();
            } else {
              buffer = chunk.toString() + buffer;
            }
          });
        });

        msg.once('attributes', function(a) {
          attrs = a;
        });

        msg.on('end', function() {
          // Create a new parser
          var parser = new MailParser();
          // Normally asynchronous, but we'll feed every data at once so this will be called just after the call to parser.end().
          parser.on("end", function(mail_object) {
            var url = gmailUrl(googleAccount, attrs['x-gm-thrid']);
            async.nextTick(async.apply(
            mailCb,
            {
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
              }
            }
            ));
          });

          parser.write(buffer);
          parser.end();
        });

      });
      f.once('error', cb);

      f.once('end', function() {
        // Can't do f.once('end', imap.end) for... unknown reasons.
        imap.end();
      });

      imap.once('end', cb);
    }
  ], finalCb);
};
