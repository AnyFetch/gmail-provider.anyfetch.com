'use strict';

// Sync all mail from all users to Cluestr.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function(task, cluestrClient, cb) {
  console.log("UPPING", task.url);

  var mail = {
    identifier: task.url,
    actions: {
      show: task.url
    },
    metadatas: {
      from: task.from,
      to: task.to,
      subject: task.subject,
      labels: task.labels,
      text: task.text
    },
    datas: {
      html: task.html,
      id: task.id,
      threadid: task.threadid,
      uid: task.uid,
    },
    semantic_document_type: 'email',
    user_access: [cluestrClient.accessToken]
  };

  cluestrClient.sendDocument(mail, function(err, document) {
    if(err) {
      console.log(err);
    }
    cb(err, document);
  });
};
