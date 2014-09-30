'use strict';
/**
 * @file Retrieve threads from the account
 */

var googleapis = require('googleapis');

// Retrieve all threads associated with this user account,
// using refresh_token
// starting from message #`cursor`.
module.exports = function retrieveThreads(options, cursor, threads, cb) {
  options.q = "-is:chat after:" + cursor.date.getFullYear() + "/" + (cursor.date.getMonth() + 1) + "/" + cursor.date.getDate();
  googleapis.gmail('v1').users.threads
    .list(options, function(err, res) {
      if(err) {
        return cb(err);
      }

      // We can't use a cursor in the query, so we need to do the sorting ourselves
      if(res.threads) {
        res.threads.reverse();
        threads = threads.concat(res.threads.filter(function(thread) {
          return parseInt(thread.historyId, 16) > cursor.id;
        }));
      }

      if(res.nextPageToken) {
        options.pageToken = res.nextPageToken;
        retrieveThreads(options, cursor, threads, cb);
      }
      else {
        cb(null, {
          date: new Date((new Date()).getTime() - 1000 * 3600 * 24),
          id: threads.length > 0 ? parseInt(threads[threads.length - 1].historyId, 16) : cursor.id
        }, threads);
      }
    });
};
