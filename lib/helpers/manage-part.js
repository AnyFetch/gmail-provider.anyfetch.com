'use strict';

var async = require('async');
var googleapis = require('googleapis');
var generateTitle = require('anyfetch-provider').util.generateTitle;
var logError = require('anyfetch-provider').util.logError;

var config = require('../../config/configuration.js');
var decomposeMails = require('./tools.js').decomposeMails;

var alreadyHaveThisAttachment = function(filename, attachments) {
  return attachments.some(function(attachment) {
    return filename === attachment.fileToSend.filename;
  });
};

module.exports = function managePart(mail, part, document, attachments, serviceData, oauth2Client, cb) {
  mail.data = mail.data || {
    id: mail.id
  };

  mail.metadata = mail.metadata || {};

  // Is it an attachment ?
  if(part.filename !== '' && part.body.attachmentId && part.body.size !== 0) {
    if (alreadyHaveThisAttachment(part.filename, attachments)) {
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
          creation_date: (mail.metadata && mail.metadata.creation_date) || document.creation_date,
          modification_date: (mail.metadata && mail.metadata.modification_date) || document.modification_date,
          related: [document.identifier],
          user_access: document.user_access
        },
        fileToSend: {
          file: new Buffer(res.data, 'base64'),
          filename: part.filename
        }
      };

      document.related.push(attachment.document.identifier);
      document.metadata.attachmentsCount += 1;

      attachments.push(attachment);
      cb(null);
    });
  }
  else if (part.mimeType !== '') {
    mail.payload.headers.forEach(function walkHeaders(header) {
      switch(header.name) {
        case "From":
        case "To":
        case "Cc":
          mail.metadata[header.name.toLowerCase()] = decomposeMails(header.value);
          break;
        case "Subject":
          mail.metadata.subject = header.value;
          break;
        case "Date":
          mail.metadata.date = new Date(header.value);
          document.modification_date = new Date(header.value);
          break;
      }
    });

    // Is it the content of the mail ?
    if(part.mimeType === 'text/html') {
      mail.data.html = (new Buffer(part.body.data, 'base64')).toString();
    }
    else if (part.mimeType === 'text/plain') {
      mail.metadata.text = (new Buffer(part.body.data, 'base64')).toString().replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
    logError(new Error("ERR: Parts without mimetype and filename", {link: document.actions.show, part: part, mail: mail}));
    cb(null);
  }
};
