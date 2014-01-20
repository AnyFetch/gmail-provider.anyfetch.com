'use strict';
/**
 * @file Retrieve mails from the account
 */

var Imap = require('imap');
var async = require('async');
var MailParser = require('mailparser').MailParser;
var xoauth2 = require('xoauth2');
var inspect = require('util').inspect;

var gmailUrl = require('./gmail-url.js');
var config = require('../../config/configuration.js');


// Gmail connection
var imap = null;
// Store total number of mail to exit on last mail
var totalNumberOfMail = -1;

/**
 * Open the All email box from Gmail not depending of the location
 */
var openAllInbox = function(cb) {
  imap.getBoxes("[Gmail]/", function(err, boxes) {
    if(err) {
      return cb(err);
    }

    var listBoxGmail = boxes["[Gmail]"].children;
    for(var key in listBoxGmail) {
      var length = listBoxGmail[key].attribs.length;
      for( var i = 0 ; i < length ; i += 1) {
        if(listBoxGmail[key].attribs[i] === "\\All") {
          return imap.openBox("[Gmail]/" + key, true, cb);
        }
      }
    }
  });
};



// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`from`.
// For each message, cb will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
var retrieveGmail = function(refreshToken, googleAccount, fromUid, mailCb, finalCb) {
  // Generate a XOAUTH2.0 token
  // See https://developers.google.com/gmail/xoauth2_protocol
  // And https://github.com/andris9/xoauth2
  console.log("Start of retrieveGmail");

  // Keep trace of the last uid for use it in the recursion function
  var lastUid = 0;

  var retryAfterTimeout = function() {
    imap.destroy();
    return retrieveGmail(refreshToken, googleAccount, lastUid, mailCb, finalCb);
  };

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
      console.log("Start of the imap");
      imap = new Imap( {
        xoauth2: token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
        /*,
        debug : //console.log
        function(log) {
          fs.appendFile("log-imap-debug.txt", log + "\n");
        }//*/
      });

      imap.once('ready', function(err) {
        if(err) {
          return finalCb(err);
        }

        console.log("Start of the openAllInbox");
        openAllInbox(function(err) {
          if (err) {
            return finalCb(err);
          }

          console.log("Start of the seach");
          imap.search([['UID', fromUid + ':*']], function(err, results) {
            if(totalNumberOfMail === -1) {
              totalNumberOfMail = results.length;
            }
            if(totalNumberOfMail === 0) {
              finalCb();
            }
            if(process.env.NODE_ENV !== 'test') {
              console.log(results.length + " mails for " + googleAccount);
            }
            console.log("Start of the fetch");
            var f = imap.fetch(results, {  bodies: '' , size : true });
            
            //Set the timeout
            var idTimer = setTimeout(retryAfterTimeout, config.imap_timeout);

            f.on('message', function(msg, seqno) {
              console.log('Message #%d', seqno);

              clearTimeout(idTimer);
              
              // Build a buffer containing all datas from the mail
              var attrs = null;
              var mailObject = null;

              var parser = new MailParser();

              var prefix = '(#' + seqno + '/' + totalNumberOfMail + ') ';


              async.parallel([
                function(cb) {
                  msg.once('body', function(stream) {
                    console.log(prefix + 'Body');

                    stream.pipe(parser);

                    cb();
                  });
                },
                function(cb) {
                  msg.once('attributes', function(a) {
                    attrs = a;

                    console.log(prefix + 'Attributes: %s', inspect(attrs));
                    cb();
                  });
                },
                function(cb) {
                  parser.on("end", function(mail_object) {
                    mailObject = mail_object;
                    cb();
                  });
                },
                function(cb) {
                  msg.once('end', function() {
                    console.log(prefix + 'Finished');

                    clearTimeout(idTimer);
                    // Create a new timer to ensure we won't get stuck waiting for imap new message
                    idTimer = setTimeout(retryAfterTimeout, config.imap_timeout);
                    cb();
                  });
                }
              ],
              function() {
                var url = gmailUrl(googleAccount, attrs['x-gm-thrid']);
                var task = {
                  url: url,
                  id: attrs['x-gm-msgid'],
                  uid: attrs.uid,
                  threadid: attrs['x-gm-thrid'],
                  from: mailObject.from,
                  to: mailObject.to,
                  subject: mailObject.subject,
                  text: mailObject.text,
                  html: mailObject.html,
                  labels: attrs['x-gm-labels'],
                };

                lastUid = task.uid + 1;
                mailCb(task);

                //If we're fetching all the emails
                if(seqno === totalNumberOfMail) {
                  console.log('Done fetching all messages!');
                  finalCb();
                  cb();
                  return;
                }
              });
            });

            f.on('error', function(err) {
              console.log('Fetch error: ' + err);
              finalCb(err);
            });
          });
        });
      });

      imap.connect();
    }
  ], function() {
    console.log("End of the fetch of the message");
  });
};



module.exports = function(refreshToken, googleAccount, fromUid, mailCb, finalCb) {
  var onMailReceived = function(task) {
    var uid = task.uid;
    if(!mails[uid]) {
      mailCb(task);
      mails.push(task.uid);
    }
  };

  var mails = [];
  retrieveGmail(refreshToken, googleAccount, fromUid, onMailReceived, finalCb);
};
