'use strict';
/**
 * @file Retrieve mails from the account
 */

var googleapis = require('googleapis');

// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`cursor`.
module.exports = function retrieveMails(options, cursor, mails, cb) {
  options.q = "-is:chat after:" + cursor.date.getFullYear() + "/" + (cursor.date.getMonth() + 1) + "/" + cursor.date.getDate();
  googleapis.gmail('v1').users.messages
    .list(options, function(err, res) {
      if(err) {
        return cb(err);
      }

      // We can't use a cursor in the query, so we need to do the sorting ourselves
      res.messages.reverse();
      mails = mails.concat(res.messages.filter(function(mail) {
        return parseInt(mail.id, 16) > cursor.id;
      }));

      if(res.nextPageToken) {
        options.pageToken = res.nextPageToken;
        retrieveMails(options, cursor, mails, cb);
      }
      else {
        cb(null, {
          date: new Date((new Date()).getTime() - 1000 * 3600 * 24),
          id: mails.length > 0 ? parseInt(mails[mails.length - 1].id, 16) : cursor.id
        }, mails);
      }
    });
};
