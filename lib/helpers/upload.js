'use strict';

var googleapis = require('googleapis');
var async = require('async');
var rarity = require('rarity');
var managePart = require('./manage-part.js');
var config = require('../../config/configuration.js');

function parseField(value) {
  // Value must be a string, it's just if Google change GMail API
  if(typeof value !== "string") {
    console.warn("Field to / from must be string");
    return undefined;
  }

  var newValue = [];

  value.split(',').forEach(function(people) {
    var matches = people.match(/^([^<]+)( <(.+)>)?$/);
    
    if(!matches) {
      newValue.push({
        address: people.replace(/"(.+)"/, '$1').replace(/'(.+)'/, '$1').replace(/<(.+)>/, '$1').trim()
      });
      return;
    }

    for (var i = 0; i < matches.length; i += 1) {
      if(matches[i]) {
        matches[i] = matches[i].replace(/"(.+)"/, '$1').replace(/'(.+)'/, '$1').replace(/<(.+)>/, '$1').trim();
      }
    }

    if(!matches[3] || matches[1] === matches[3]) {
      newValue.push({
        address: matches[1]
      });
    }
    else {
      newValue.push({
        name: matches[1],
        address: matches[3]
      });
    }
  });

  return newValue;
}

var retrieveMailDetails = function(mail, anyfetchClient, serviceData, oauth2Client, finalCb) {
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
        userId: serviceData.accountName,
        auth: oauth2Client
      };

      googleapis.gmail('v1').users.messages.get(options, rarity.slice(2, cb));
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
            document.metadata.to = parseField(header.value);
            break;
          case 'From':
            document.metadata.from = parseField(header.value);
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
        managePart(mail_data, mail_data.payload, document, attachments, serviceData, oauth2Client, cb);
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
  var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, serviceData.callbackUrl);
  oauth2Client.credentials = serviceData.tokens;

  retrieveMailDetails(mail, anyfetchClient, serviceData, oauth2Client, cb);
};