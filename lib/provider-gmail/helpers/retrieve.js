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

  var xoauth2gen = xoauth2.createXOAuth2Generator( {
    user: googleAccount,
    clientId: config.google_id,
    clientSecret: config.google_secret,
    refreshToken: refreshToken
  });

  async.series([
    // Create a token from refresh_token
    function(cb) {
      xoauth2gen.getToken(function(err, t) {
        if(err) {
          throw err;
        }
        token = t;
        cb();
      });
    },
    // Retrieve  messages from the account
    function(cb) {
      // Create a new Imap connection
      // See https://github.com/mscdex/node-imap
      var imap = new Imap( {
        xoauth2:token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', function() {
        imap.openBox('[Gmail]/All Mail', true, function(err) {
          if (err) {
            throw err;
          }
          // --- select query for provisioning with cursor
          var dformated = months[from.getMonth()]+" "+ from.getDate() + ", "+from.getFullYear();
          imap.search([ 'ALL', ['SINCE', dformated] ], function(err, results) {
            if(err) {
              throw err;
            }
            if(results.length === 0) {
              // All is up to date for mail since 'from variable'
              return finalCb();
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
            f.once('error', function(err) {
              console.log('Fetch error: ' + err);
            });

            f.once('end', function() {
              imap.end();
            });
          });
        });
      });

      imap.once('error', function(err) {
        throw err;
      });

      imap.once('end', cb);

      imap.connect();
    },
  ], finalCb);
};
