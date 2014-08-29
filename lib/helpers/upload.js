'use strict';

var googleapis = require('googleapis');
var async = require('async');
var rarity = require('rarity');
var managePart = require('./manage-part.js');
var config = require('../../config/configuration.js');

var retrieveThreadDetails = function(thread, anyfetchClient, serviceData, oauth2Client, finalCb) {
  async.waterfall([
    function retrieveThreadData(cb) {
      var options = {
        id: thread.id,
        userId: serviceData.accountName,
        auth: oauth2Client
      };

      googleapis.gmail('v1').users.threads.get(options, rarity.slice(2, cb));
    },
    function mergeData(threadData, cb) {
      threadData.url = "https://mail.google.com/mail/b/" + serviceData.accountName + "/?cm#all/" + threadData.id;
      var documentDate = mergeThreadDate(threadData.messages);

      var document = {
        identifier: threadData.url,
        data: {
          id: thread.id
        },
        metadata: {
          labels: mergeThreadLabels(threadData.messages),
          subject: mergeThreadSubject(threadData.messages),
          date: documentDate,
          participants: mergeThreadParticipants(threadData.messages)
        },
        actions: {
          show: threadData.url
        },
        related: [],
        document_type: 'email-thread',
        creation_date: documentDate,
        user_access: [anyfetchClient.accessToken],
      };

      cb(null, threadData, document);
    },
    function parseThreadParts(threadData, document, cb) {
      var attachments = [];

      async.eachSeries(threadData.messages, function parseMailParts(mailData, cb) {
        if(mailData.payload) {
          return managePart(mailData, mailData.payload, document, attachments, serviceData, oauth2Client, cb);
        }
        cb();
      }, rarity.carry([attachments, document], cb));
    },
    function sendDocument(attachments, document, cb) {
      console.log("UPLOADING", document.identifier);
      anyfetchClient.postDocument(document, rarity.carryAndSlice([attachments, document], 3, cb));
    },
    function sendAttachments(attachments, document, cb) {
      async.each(attachments, function(attachment, cb) {
        console.log("UPLOADING", attachment.document.identifier);
        anyfetchClient.sendDocumentAndFile(attachment.document, attachment.fileToSend, rarity.slice(1, cb));
      }, cb);
    }
  ], finalCb);
};

module.exports = function uploadThread(thread, anyfetchClient, serviceData, cache, cb) {
  var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, serviceData.callbackUrl);
  oauth2Client.credentials = serviceData.tokens;

  retrieveThreadDetails(thread, anyfetchClient, serviceData, oauth2Client, cb);
};
