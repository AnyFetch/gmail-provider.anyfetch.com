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



/**
 * Retrieve the All email box from Gmail not depending of the location
 */
var getInboxAllMessages = function(imap, cb) {

  var prefix = "[Gmail]";
  imap.getBoxes(prefix + "/", function(err, boxes) {
    if(err) {
      return cb(err);
    }

    for(var key in boxes[prefix].children) {
      if(boxes[prefix].children[key].attribs.indexOf("\\All") !== -1) {
        return cb(null, prefix + "/" + key);
      }
    }

    return cb(new Error("No inbox all messages detected"));
  });
};



// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`fromUid`.
// For each message, `mailCb` will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
var retrieveGmail = function(refreshToken, googleAccount, fromUid, mailCb, finalCb) {
  // Gmail connection
  var imap = null;

  // Store total number of mail to exit on last mail
  var totalNumberOfMail;

  // Keep trace of the last uid for the next call of this function
  var lastUid = 0;

  // Function called when the retrieve of the email block.
  // This is just a call to retrieveGmail with the current lastUid
  var retryAfterTimeout = function() {
    imap.destroy();
    return retrieveGmail(refreshToken, googleAccount, lastUid, mailCb, finalCb);
  };

  var idTimer = null;

  // Function called when a message is retrieved from Gmail
  // This function get the body and the attributs of the mail and retun a 
  // task variable with all the information of the email
  var onMessage = function(msg, seqno, cb) {
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

      cb(task);
    });
  };

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
    function getXoauthToken(cb) {
      xoauth2gen.getToken(cb);
    },
    function newImapConnection(token, accessToken, cb) {
      // See https://github.com/mscdex/node-imap
      console.log("Start of the imap");
      imap = new Imap( {
        xoauth2: token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', cb);

      imap.connect();
    },
    function(cb) {
      getInboxAllMessages(imap, cb);
    },
    function openImapBox(boxName, cb) {
      imap.openBox(boxName, true, cb);
    },
    function retrieveAllMessages(mailbox, cb) {
      imap.search([['UID', fromUid + ':*']], function(err, results) {
        totalNumberOfMail = results.length;
        if(totalNumberOfMail === 0) {
          return cb();
        }
        if(process.env.NODE_ENV !== 'test') {
          console.log(results.length + " mails for " + googleAccount);
        }
        console.log("Start of the fetch");
        var f = imap.fetch(results, {  bodies: '' });
        
        // Set the timeout
        idTimer = setTimeout(retryAfterTimeout, config.imap_timeout);

        f.on('message', function(msg, seqno){
          onMessage(msg, seqno, function(task) {
            lastUid = task.uid + 1;
            mailCb(task);

            // If we're done fetching all the emails
            if(seqno === totalNumberOfMail) {
              console.log('Done fetching all messages!');
              return cb();
            }
          });
        });

        f.on('error', function(err) {
          console.log('Fetch error: ' + err);
          cb(err);
        });
      });

    }
  ],
    function(err) {
      finalCb(err, lastUid);
      console.log("End of the fetch of the message");
    });
};



module.exports = function(refreshToken, googleAccount, fromUid, mailCb, finalCb) {
  var onMailReceived = function(task) {
    var uid = task.uid;
    if(uids.indexOf(uid) === -1) {
      mailCb(task);
      uids.push(task.uid);
    }
  };

  var uids = [];
  retrieveGmail(refreshToken, googleAccount, fromUid, onMailReceived, finalCb);
};
