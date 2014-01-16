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
var fs = require('fs');
var inspect = require('util').inspect;

var imap = null;

/**
 * Var to param the timeout
 */
var timeForTimeout = 10000;
var idTimer = null;
var numberTotalOfMail = 0;
var lastUid = 0;




function openInbox(cb) {
  imap.openBox('[Gmail]/Tous les messages', true, cb);
}


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

      console.log("Start of imap");

      imap = new Imap( {
        xoauth2: token,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
        /*,
        debug : console.log
        /*function(log) {
          fs.appendFile("log-imap-debug.txt", log + "\n");
        }//*/
      });

      imap.once('ready', function(err) {
        openInbox(function(err, box) {
          if (err) throw err;
          imap.search([['UID', fromUid + ':*']], function(err, results) {
            numberTotalOfMail = results.length;
            if(process.env.NODE_ENV !== 'test') {
              console.log(results.length + " mails for " + googleAccount);
            }

            var f = imap.fetch(results, {  bodies: '' , size : true });
            f.on('message', function(msg, seqno) {
              
              console.log('Message #%d', seqno);
              
              // Build a buffer containing all datas from the mail
              var attrs = null;
              var mailObject = null;
              var emailsNumber = seqno;

              var parser = new MailParser();

              var prefix = '(#' + seqno + '/' + numberTotalOfMail + ') ';

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

                lastUid = task.uid;
                console.log("Last uid after onMessage :", lastUid);
                mailCb(task);

                if(idTimer != null) {
                  clearTimeout(idTimer);
                  idTimer = null;
                }
                //Set the timeout
                idTimer = setTimeout(function(){
                  console.log("Timeout reach next timeout : ", timeForTimeout);
                  console.log("Last uid : ", lastUid);
                  imap.destroy();
                  idTimer = null;
                  retrieveGmail(refreshToken, googleAccount, lastUid, 
                    function(task){
                      mailCb(task);
                    },
                    function(){
                      finalCb();
                    });
                }, timeForTimeout);
              });
              /*
              msg.on('body', function(stream, info) {
                console.log(prefix + 'Body');
                stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
              });
              msg.once('attributes', function(attrs) {
                console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
              });//*/
            });
            f.on('error', function(err) {
              console.log('Fetch error: ' + err);
            });
            f.on('end', function() {
              console.log('Done fetching all messages!');
              cb();
            });
          });
        });
      });

      imap.connect();
    }
  ], finalCb);
};



module.exports = function(refreshToken, googleAccount, fromUid, mailCb, finalCb){
  retrieveGmail(refreshToken, googleAccount, fromUid, function(task) {
    mailCb(task);
  }, function(){
    finalCb();
  });
};