'use strict';

var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var async = require('async');
var rarity = require('rarity');

var config = require('../../config/configuration.js');

var managePart = function(mail, part, document, attachments, serviceData, client, oauth2Client, finalCb) {
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
        return finalCb(err);
      }

      if(res.size > config.maxSize * 1024 * 1024) {
        return finalCb(null);
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
      finalCb(null);
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
      }, finalCb);
    }
    else {
      finalCb(null);
    }
  }
};

var retrieveMail = function(mail, anyfetchClient, serviceData, client, oauth2Client, finalCb) {
  var document = {
    data: {
      id: mail.id,
      threadId: mail.threadId
    },
    metadata: {},
    actions: {},
    related: [],
    user_access: [anyfetchClient.accessToken],
  };

  var attachments = [];

  async.waterfall([
    function retrieveMailData(cb) {
      var options = {
        id: mail.id,
        userId: serviceData.accountName
      };

      client.gmail.users.messages.get(options).withAuthClient(oauth2Client).execute(rarity.slice(2, cb));
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
      anyfetchClient.postDocument(document, rarity.slice(1, cb));
    },
    function sendAttachments(cb) {
      async.each(attachments, function(attachment, cb) {
        anyfetchClient.sendDocumentAndFile(attachment.document, attachment.fileToSend, rarity.slice(1, cb));
      }, cb);
    }
  ], finalCb);
};

module.exports = function(mail, anyfetchClient, serviceData, cache, cb) {
  var oauth2Client = new OAuth2Client(config.googleId, config.googleSecret, serviceData.callbackUrl);
  oauth2Client.credentials = serviceData.tokens;

  if(cache.has(serviceData.tokens.access_token)) {
    retrieveMail(mail, anyfetchClient, serviceData, cache.get(serviceData.tokens.access_token), oauth2Client, cb);
  }
  else {
    googleapis.discover('gmail', 'v1').execute(function(err, client) {
      if(err) {
        return cb(err);
      }

      cache.set(serviceData.tokens.access_token, client);
      retrieveMail(mail, anyfetchClient, serviceData, client, oauth2Client, cb);
    });
  }
};

// Sync all mail from all users to AnyFetch.
// Note: only the last mail modified since last run will be uploaded.
/*module.exports = function(task, anyfetchClient, refreshToken, cb) {
  var logErr = function(err, document) {
    if(err) {
      console.log(err);
    }
    cb(err, document);
  };

  var document = {
    creation_date: new Date(task.date).toString(),
    user_access: [anyfetchClient.accessToken],
  };

  if(task._type === "mail") {
    document.identifier = task.url + "#" + task.id;
    document.actions = {
      show: task.url
    };
    document.metadata = {
      from: task.from,
      to: task.to,
      subject: task.subject,
      labels: task.labels,
      text: task.text,
      date: document.creation_date
    };
    document.data = {
      html: task.html,
      id: task.id,
      threadid: task.thread_id,
      uid: task.uid,
    };
    document.related = task.attachments.map(function(attachmentName) {
      return document.identifier + "-" + attachmentName;
    });

    document.document_type = 'email';

    console.log("UPPING", document.identifier);
    anyfetchClient.sendDocument(document, logErr);
  }
  else if(task._type === "attachment") {
    document.identifier = task.mail_url + "#" + task.mail_id + "-" + task.name;
    document.actions = {
      show: task.mail_url
    };
    document.metadata = {
      path: "/" + task.name
    };
    document.document_type = 'file';
    document.related = [task.mail_url + "#" + task.mail_id];

    console.log("UPPING", document.identifier);

    var fileToSend = function() {
      return {
        file: fs.createReadStream(task.path),
      };
    };

    // Send document
    anyfetchClient.sendDocumentAndFile(document, fileToSend, function(err, document) {
      if(err) {
        return logErr(err, document);
      }

      // Remove document
      fs.unlink(task.path, function(err) {
        logErr(err, document);
      });
    });
  }

};*/
