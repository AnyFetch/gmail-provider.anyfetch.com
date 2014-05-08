'use strict';

var fs = require('fs');


// Sync all mail from all users to AnyFetch.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function(task, anyfetchClient, refreshToken, cb) {
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
    document.metadatas = {
      from: task.from,
      to: task.to,
      subject: task.subject,
      labels: task.labels,
      text: task.text,
      date: document.creation_date
    };
    document.datas = {
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
    document.metadatas = {
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

};
