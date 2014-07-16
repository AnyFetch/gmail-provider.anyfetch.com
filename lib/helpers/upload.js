'use strict';

var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var async = require('async');
var rarity = require('rarity');
var managePart = require('./manage-part.js');
var config = require('../../config/configuration.js');

var retrieveMailDetails = function(mail, anyfetchClient, serviceData, client, oauth2Client, finalCb) {
  var document = {
    data: {
      id: mail.id,
      threadId: mail.threadId
    },
    metadata: {},
    actions: {},
    related: [],
    document_type: 'email',
    user_access: [anyfetchClient.accessToken],
  };

  var attachments = [];

  async.waterfall([
    function retrieveMailData(cb) {
      var options = {
        id: mail.id,
        userId: serviceData.accountName
      };

      client.gmail.users.messages.get(options)
      .withAuthClient(oauth2Client)
      .execute(rarity.slice(2, cb));
    },
    function getDatas(mail_data, cb) {
      mail_data.url = "https://mail.google.com/mail/#inbox/" + mail_data.threadId;

      document.identifier = mail_data.url + "#" + mail_data.id;
      document.actions.show = mail_data.url;
      document.metadata.labels = mail_data.labelIds;

      cb(null, mail_data);
    },
    function parseHeaders(mail_data, cb) {
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

      cb(null, mail_data);
    },
    function parseParts(mail_data, cb) {
      if(mail_data.payload) {
        managePart(mail_data, mail_data.payload, document, attachments, serviceData, client, oauth2Client, cb);
      }
      else {
        cb(null);
      }
    },
    function sendDocument(cb) {
      console.log("UPLOADING", document.identifier);
      anyfetchClient.postDocument(document, rarity.slice(1, cb));
    },
    function sendAttachments(cb) {
      async.each(attachments, function(attachment, cb) {
        console.log("UPLOADING", attachment.document.identifier);
        anyfetchClient.sendDocumentAndFile(attachment.document, attachment.fileToSend, rarity.slice(1, cb));
      }, cb);
    }
  ], finalCb);
};

module.exports = function uploadMail(mail, anyfetchClient, serviceData, cache, cb) {
  var oauth2Client = new OAuth2Client(config.googleId, config.googleSecret, serviceData.callbackUrl);
  oauth2Client.credentials = serviceData.tokens;

  // We use LRU Cache to store client and don't create it all the time
  if(cache.has(serviceData.tokens.access_token)) {
    retrieveMailDetails(mail, anyfetchClient, serviceData, cache.get(serviceData.tokens.access_token), oauth2Client, cb);
  }
  else {
    googleapis.discover('gmail', 'v1').execute(function(err, client) {
      if(err) {
        return cb(err);
      }

      cache.set(serviceData.tokens.access_token, client);
      retrieveMailDetails(mail, anyfetchClient, serviceData, client, oauth2Client, cb);
    });
  }
};