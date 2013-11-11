'use strict';

var retrieve = require('./lib/provider-gmail/helpers/retrieve.js');
var config = require('./config/configuration.js');

var mails = 0;
var cb = function(datas) {
  mails += 1;
  console.log('----------' + mails);
  console.log("URL:", datas.actions.show);
  console.log("Id:", datas.metadatas.id);
  console.log("tId:", datas.metadatas.threadid);
  console.log("From:", datas.metadatas.from);
  console.log("To:", datas.metadatas.to);
  console.log("Subject:", datas.metadatas.subject);
  console.log("Text:", datas.metadatas.content);
  console.log("Labels:", datas.metadatas.labels);
};

retrieve(config.test_refresh_token, config.test_account, new Date(1970), cb, function(err) {
  if(err) {
    throw err;
  }
  process.exit();
});
