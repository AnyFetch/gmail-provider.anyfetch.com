'use strict';

// Sync all mail from all users to Cluestr.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function(mails, CluestrClient, cb) {
  if(process.env.NODE_ENV === 'test') {
    return cb();
  }
  CluestrClient.sendDocument(mails, cb);
};
