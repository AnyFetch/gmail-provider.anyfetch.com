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
 * Const to param the timeout
 */

var timeForTimeout = 20000;

/**
 * Variable for the program
 */
var imap = null;
var totalNumberOfMail = -1;

/**
 * Open the All email box from Gmail not depending of the location
 */
var openInbox = function(cb) {
  imap.getBoxes("[Gmail]/", function(err, boxes){
    var nameOfAllGmailBox = "[Gmail]/";
    var listBoxGmail = boxes["[Gmail]"].children;
    for(var key in listBoxGmail){
      var length = listBoxGmail[key].attribs["length"];
      for( var i = 0 ; i < length ; i++) {
        if(listBoxGmail[key].attribs[i] === "\\All") {
          nameOfAllGmailBox += key;
          break;
        }
      }
    }
    //console.log("Open box : ", nameOfAllGmailBox);
    imap.openBox(nameOfAllGmailBox, true, cb);
  });
}



// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`from`.
// For each message, cb will be called with datas as parameters.
// then calls `finalCb` when everything is finished.
var retrieveGmail = function(refreshToken, googleAccount, fromUid, mailCb, finalCb, recursionCb) {
  // Generate a XOAUTH2.0 token
  // See https://developers.google.com/gmail/xoauth2_protocol
  // And https://github.com/andris9/xoauth2
  console.log("Start of retrieveGmail");

  //Define of the var for this function :

  var idTimer = null;

  var lastUid = 0;

  //We are define the recurse callback function for the recursion :

  var recurseMailCb = function(task) {
    mailCb(task);
  }
  var recurseFinalCb = function() {
      finalCb();
  }

  var recurseRecursionCb = function(uid) {
    retrieveGmail(refreshToken, googleAccount, uid, function(task){
        recurseMailCb(task);
      }, recurseFinalCb, function(uid) {
        recurseRecursionCb(uid)
      });
  }


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
        console.log("Start of the openInbox");
        openInbox(function(err, box) {
          if (err){
            throw err;
          } 
          console.log("Start of the seach");
          imap.search([['UID', fromUid + ':*']], function(err, results) {
            if(totalNumberOfMail == -1){
              totalNumberOfMail = results.length;
            }
            if(totalNumberOfMail == 0){
              finalCb();
            }
            if(process.env.NODE_ENV !== 'test') {
              console.log(results.length + " mails for " + googleAccount);
            }
            console.log("Start of the fetch");
            var f = imap.fetch(results, {  bodies: '' , size : true });
            f.on('message', function(msg, seqno) {
              
              console.log('Message #%d', seqno);
              
              // Build a buffer containing all datas from the mail
              var attrs = null;
              var mailObject = null;
              var emailsNumber = seqno;

              var parser = new MailParser();

              var prefix = '(#' + seqno + '/' + totalNumberOfMail + ') ';

              async.parallel([
                function(cb){
                  msg.once('body', function(stream) {
                    console.log(prefix + 'Body');
                    if(idTimer != null) {
                      clearTimeout(idTimer);
                      idTimer = null;
                    }
                    stream.pipe(parser);
                    cb();
                  });
                },
                function(cb){
                  msg.once('attributes', function(a) {
                    attrs = a;

                    console.log(prefix + 'Attributes: %s', inspect(attrs));
                    //console.log('attributes is attached from ', emailsNumber);
                    cb();
                  });
                },
                function(cb){
                  parser.on("end", function(mail_object) {
                    mailObject = mail_object;
                    //console.log('parser is attached from ', emailsNumber);
                    cb();
                  });
                },
                function(cb){
                  msg.once('end', function() {
                    console.log(prefix + 'Finished');
                    cb();
                  });
                }
              ],
              function(err){
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

                if(idTimer != null) {
                  clearTimeout(idTimer);
                  idTimer = null;
                }

                //If we have finish the fetch of all the emails
                if(seqno == totalNumberOfMail){
                  console.log('Done fetching all messages!');
                  finalCb();
                  cb();
                  return;
                }
                //Set the timeout
                  idTimer = setTimeout(function(){
                  imap.destroy();
                  idTimer = null;

                  //Manage of the level of the recursion :
                  if(recursionCb == false) {
                    console.log("Appel recursion 1")
                    retrieveGmail(refreshToken, googleAccount, lastUid, function(task){
                      recurseMailCb(task);
                    }, recurseFinalCb, function(uid){
                      recurseRecursionCb(uid)
                    });
                  }
                  else {
                    console.log("recursionCb");
                    recursionCb(lastUid);
                  }
                }, timeForTimeout);
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
  ], function(){
    console.log("End of the fetch of the message");
  });
};



module.exports = function(refreshToken, googleAccount, fromUid, mailCb, finalCb){
  var mails = [];
  retrieveGmail(refreshToken, googleAccount, fromUid, function(task) {
    var uid = task.uid;
    if(!mails[uid]){
      console.log("Add of the mail with the uid : ", task.uid)
      mailCb(task);
      mails.push(task.uid);
    }
  }, function(){
    console.log(inspect(mails));
    finalCb();
  }, false);
};