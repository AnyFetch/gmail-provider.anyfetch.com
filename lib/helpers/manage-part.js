'use strict';

var async = require('async');
var googleapis = require('googleapis');
var generateTitle = require('anyfetch-provider').util.generateTitle;

var config = require('../../config/configuration.js');

var alreadyHaveThisAttachment = function(filename, attachments) {
  return attachments.some(function(attachment) {
    return filename === attachment.fileToSend.filename;
  });
};

module.exports = function managePart(mail, part, document, attachments, serviceData, oauth2Client, cb) {
  // Is it an attachment ?
  if(part.filename !== '' && part.body.attachmentId && part.body.size !== 0) {
    if (alreadyHaveThisAttachment(part.filename, attachments)) {
      console.warn("Already have `" + part.filename + "` for `" + document.identifier + "`");
      return cb(null);
    }

    var options = {
      id: part.body.attachmentId,
      messageId: mail.id,
      userId: serviceData.accountName,
      auth: oauth2Client
    };

    googleapis.gmail('v1').users.messages.attachments.get(options, function(err, res) {
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
            path: '/' + part.filename,
            title: generateTitle(part.filename)
          },
          document_type: 'file',
          creation_date: document.creation_date,
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
    // Is it the content of the mail ?
    if(part.mimeType === 'text/html') {
      document.data.html = (new Buffer(part.body.data, 'base64')).toString();
    }
    else if (part.mimeType === 'text/plain') {
      document.metadata.text = (new Buffer(part.body.data, 'base64')).toString();
    }

    if(part.parts) {
      async.eachSeries(part.parts, function(part, cb) {
        managePart(mail, part, document, attachments, serviceData, oauth2Client, cb);
      }, cb);
    }
    else {
      cb(null);
    }
  }
  else {
    console.warn("ERR: Parts without mimetype and filename", part);
    cb(null);
  }
};
