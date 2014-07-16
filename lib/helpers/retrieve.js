'use strict';
/**
 * @file Retrieve mails from the account
 */

// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`cursor`.
var retrieveMails = function(client, oauth2Client, options, cursor, mails, cb) {
  options.q = "after:" + cursor.getFullYear() + "/" + (cursor.getMonth() + 1) + "/" + cursor.getDate();
  client.gmail.users.messages
    .list(options)
    .withAuthClient(oauth2Client)
    .execute(function(err, res) {
      if(err) {
        return cb(err);
      }

      // We haven't option to have a cursor, so we sort hand
      res.messages.reverse();
      mails = mails.concat(res.messages.filter(function(mail) {
        return parseInt(mail.id, 16) > cursor;
      }));

      if(res.nextPageToken) {
        options.pageToken = res.nextPageToken;
        retrieveMails(client, oauth2Client, options, cursor, mails, cb);
      }
      else {
        cb(null, new Date((new Date()).getTime() - 1000 * 3600 * 24), mails);
      }
    });
};


module.exports = retrieveMails;
