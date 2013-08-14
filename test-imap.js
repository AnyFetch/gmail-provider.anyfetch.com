'use strict';

var retrieve = require('./lib/provider-gmail/helpers/retrieve.js');
var keys = require('./keys.js');

var cb = function(datas) {
  console.log('----------');
  console.log("URL:", datas.actions.show);
  console.log("Id:", datas.metadatas.id);
  console.log("tId:", datas.metadatas.threadid);
  console.log("From:", datas.metadatas.from);
  console.log("To:", datas.metadatas.to);
  console.log("Subject:", datas.metadatas.subject);
  console.log("Labels:", datas.metadatas.labels);
};

retrieve(keys.GOOGLE_TOKENS.refresh_token, keys.IMAP_USER, 1, cb, process.exit);
