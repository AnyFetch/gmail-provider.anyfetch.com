'use strict';

var googleapis = require('googleapis');
var async = require('async');
var rarity = require('rarity');
var managePart = require('./manage-part.js');
var config = require('../../config/configuration.js');

var retrieveMailDetails = function(mail, anyfetchClient, serviceData, oauth2Client, finalCb) {
  async.waterfall([
    function retrieveMailData(cb) {
      var options = {
        id: mail.id,
        userId: serviceData.accountName,
        auth: oauth2Client
      };

      googleapis.gmail('v1').users.messages.get(options, rarity.slice(2, cb));
    },
    function getDatas(mail_data, cb) {
      mail_data.url = "https://mail.google.com/mail/#inbox/" + mail_data.threadId;

      var document = {
        identifier: mail_data.url + "#" + mail_data.id,
        data: {
          id: mail.id,
          threadId: mail.threadId
        },
        metadata: {
          labels: mail_data.labelIds
        },
        actions: {
          show: mail_data.url
        },
        related: [],
        document_type: 'email',
        user_access: [anyfetchClient.accessToken],
      };

      cb(null, mail_data, document);
    },
    function parseHeaders(mail_data, document, cb) {
      if(mail_data.payload.headers) {
        mail_data.payload.headers.forEach(function(header) {
          switch(header.name) {
          case 'Subject':
            document.metadata.subject = header.value;
            break;
          case 'Date':
            document.creation_date = new Date(header.value);
            document.metadata.date = document.creation_date;
            break;
          case 'To':
            document.metadata.to = header.value;
            break;
          case 'From':
            document.metadata.from = header.value;
            break;
          case 'Message-ID':
            document.data.uid = header.value;
            break;
          }
        });
      }

      cb(null, mail_data, document);
    },
    function parseParts(mail_data, document, cb) {
      var attachments = [];

      if(mail_data.payload) {
        managePart(mail_data, mail_data.payload, document, attachments, serviceData, oauth2Client, rarity.carry([attachments, document], cb));
      }
      else {
        cb(null, attachments, document);
      }
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

module.exports = function uploadMail(mail, anyfetchClient, serviceData, cache, cb) {
  var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, serviceData.callbackUrl);
  oauth2Client.credentials = serviceData.tokens;

  retrieveMailDetails(mail, anyfetchClient, serviceData, oauth2Client, cb);
};