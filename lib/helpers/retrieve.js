'use strict';
/**
 * @file Retrieve mails from the account
 */

// Retrieve all mails associated with this user account,
// using refresh_token
// starting from message #`cursor`.
var retrieveMails = function(client, oauth2Client, options, cursor, mails, cb) {
  client.gmail.users.messages
    .list(options)
    .withAuthClient(oauth2Client)
    .execute(function(err, res) {
      if(err) {
        return cb(err);
      }

      // We haven't option to have a cursor, so we sort hand
      res.messages.reverse();
      res.messages.forEach(function(mail) {
        if(parseInt(mail.id, 16) > cursor) {
          mails.push(mail);
        }
      });

      if(res.nextPageToken) {
        options.pageToken = res.nextPageToken;
        retrieveMails(client, oauth2Client, options, cursor, mails, cb);
      }
      else {
        cb(null, mails.length > 0 ? parseInt(mails[mails.length - 1].id, 16) : cursor, mails);
      }
    });
};


module.exports = retrieveMails;
