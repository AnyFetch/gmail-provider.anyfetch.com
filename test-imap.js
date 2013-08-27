'use strict';

var retrieve = require('./lib/provider-gmail/helpers/retrieve.js');
var config = require('./config/configuration.js');

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

retrieve(config.test_refresh_token, config.test_account, 1, cb, process.exit);
