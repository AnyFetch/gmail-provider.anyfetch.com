'use strict';
var decHex = require('./dec-hex.js');

module.exports = function(account, threadId) {
  return 'https://mail.google.com/mail/b/' + account + '/?cm#all/' + decHex(threadId);
};
