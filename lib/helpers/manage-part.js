'use strict';

var async = require('async');

var config = require('../../config/configuration.js');

var managePart = function(mail, part, document, attachments, serviceData, client, oauth2Client, cb) {
  if(part.filename !== '' && part.body.attachmentId && part.body.size !== 0) {
    var options = {
      id: part.body.attachmentId,
      messageId: mail.id,
      userId: serviceData.accountName
    };

    client.gmail.users.messages.attachments.get(options)
    .withAuthClient(oauth2Client)
    .execute(function(err, res) {
      if(err) {
        return cb(err);
      }

      if(res.size > config.maxSize * 1024 * 1024) {
        return cb(null);
      }

      var attachment = {
        document: {
          identifier: document.identifier + "-" + part.filename,
          actions: {
            show: document.actions.show
          },
          metadata: {
            path: '/' + part.filename
          },
          document_type: 'file',
          related: [document.identifier]
        },
        fileToSend: {
          file: new Buffer(res.data, 'base64'),
          filename: part.filename
        }
      };

      document.related.push(attachment.document.identifier);
      attachments.push(attachment);
      cb(null);
    });
  }
  else if (part.mimeType !== '') {
    if(part.mimeType === 'text/html') {
      document.data.html = (new Buffer(part.body.data, 'base64')).toString();
    }
    else if (part.mimeType === 'text/plain') {
      document.metadata.text = (new Buffer(part.body.data, 'base64')).toString();
    }

    if(part.parts) {
      async.each(part.parts, function(part, cb) {
        managePart(mail, part, document, attachments, serviceData, client, oauth2Client, cb);
      }, cb);
    }
    else {
      cb(null);
    }
  }
};

module.exports = managePart;