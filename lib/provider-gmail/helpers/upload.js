'use strict';

// Sync all mail from all users to Cluestr.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function(mail, CluestrClient, cb) {
  CluestrClient.sendDocument(mail, cb);
};
