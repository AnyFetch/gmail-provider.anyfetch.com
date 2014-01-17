'use strict';

var retrieve = require('./lib/helpers/retrieve.js');
var config = require('./config/configuration.js');
var fs = require('fs');

var mails = 0;
var cb = function(datas) {
  mails += 1;
  console.log('----------' + mails);
  //fs.appendFile("log-imap-debug.txt", '----------' + mails + "\n");
  //console.log("URL:", datas.actions.show);
  //console.log("uId:", datas.datas.uid);
  //console.log("Id:", datas.datas.id);
  //console.log("tId:", datas.datas.threadid);
  // console.log("From:", datas.metadatas.from);
  // console.log("To:", datas.metadatas.to);
  // console.log("Subject:", datas.metadatas.subject);
  // console.log("Text:", datas.metadatas.content);
  // console.log("Labels:", datas.metadatas.labels);
};

retrieve(config.test_refresh_token, config.test_account, 1, cb, function(err) {
  if(err) {
    throw err;
  }

  console.log("Bye.");
  process.exit();
});
