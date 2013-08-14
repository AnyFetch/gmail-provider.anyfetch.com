'use strict';

var Imap = require('imap');
var async = require('async');
var MailParser = require('mailparser').MailParser;
var keys = require('../../../keys.js');
var gmailUrl = require('./gmail-url.js');
var xoauth2 = require('xoauth2');
var token;

// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`from`.
// For each message, cb will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
module.exports = function(refreshToken, googleAccount, from, mailCb, finalCb) {
  // Generate a XOAUTH2.0 token
  // See https://developers.google.com/gmail/xoauth2_protocol
  // And https://github.com/andris9/xoauth2
  var xoauth2gen = xoauth2.createXOAuth2Generator({
    user: googleAccount,
    clientId: keys.GOOGLE_ID,
    clientSecret: keys.GOOGLE_SECRET,
    refreshToken: refreshToken
  });

  async.series([
    function(cb) {
      // Create a token from refresh_token
      xoauth2gen.getToken(function(err, t){
        if(err) {
          return console.log(err);
        }
        token = t;
        cb();
      });
    },
    // Retrieve 10 first messages from the account
    function(cb) {
      // Create a new Imap connection
      // See https://github.com/mscdex/node-imap
      var imap = new Imap({
        xoauth2:token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', function() {
        imap.openBox('[Gmail]/All Mail', true, function(err, box) {
          if (err) {
            throw err;
          }

          if(from >= box.messages.total) {
            return finalCb();
          }

          // 1:10 (first argument) is the span of items to retrieve (first ten items here)
          var f = imap.seq.fetch('1:10', { bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE)', 'TEXT'] });

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
              // Normally asynchronous, but we'll feed every data at once so this will be called just after the call to parsen.end().
              parser.on("end", function(mail_object) {
                var url = gmailUrl(googleAccount, attrs['x-gm-thrid']);

                mailCb({
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
                });
              });

              parser.write(buffer);
              parser.end();
            });
          });

          f.once('error', function(err) {
            console.log('Fetch error: ' + err);
          });

          f.once('end', function() {
            imap.end();
          });
        });
      });

      imap.once('error', function(err) {
        console.log(err);
      });

      imap.once('end', function(err) {
        if(err) {
          throw err;
        }
        cb();
      });

      imap.connect();
    },
  ], finalCb);
};
