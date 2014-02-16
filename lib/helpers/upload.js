'use strict';

// Sync all mail from all users to Anyfetch.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function(task, anyfetchClient, refreshToken, cb) {
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
    document_type: 'email',
    user_access: [anyfetchClient.accessToken]
  };

  anyfetchClient.sendDocument(mail, function(err, document) {
    if(err) {
      console.log(err);
    }
    cb(err, document);
  });

  return mail;
};
