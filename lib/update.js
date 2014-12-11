'use strict';

var googleapis = require('googleapis');
var async = require('async');

var config = require('../config/configuration.js');
var retrieveThreads = require('./helpers/retrieve.js');

module.exports = function updateAccount(serviceData, cursor, queues, cb) {
  // Retrieve all mails since last call
  async.waterfall([
    function refreshTokens(cb) {
      var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, serviceData.callbackUrl);
      oauth2Client.refreshToken_(serviceData.tokens.refresh_token, function(err, tokens) {
        if(err) {
          return cb(err);
        }

        if(typeof tokens !== 'object' || !tokens.access_token) {
          return cb(new Error("Can't refresh tokens"));
        }

        tokens.refresh_token = serviceData.tokens.refresh_token;
        serviceData.tokens = tokens;
        cb(err);
      });
    },
    function getThreads(cb) {
      var options = {
        maxResults: 1000,
        userId: serviceData.accountName
      };

      if(!cursor) {
        cursor = {
          date: new Date(1970),
          id: 0
        };
      }

      var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, serviceData.callbackUrl);
      oauth2Client.credentials = serviceData.tokens;
      options.auth = oauth2Client;

      retrieveThreads(options, cursor, [], {}, cb);
    },
    function addThreadsToQueue(newCursor, threads, cb) {
      threads.forEach(function(thread) {
        thread.identifier = "https://mail.google.com/mail/b/" + serviceData.accountName + "/?cm#all/" + thread.id;
        thread.title = thread.identifier;
        queues.addition.push(thread);
      });
      cb(null, newCursor, serviceData);
    }
  ], cb);
};
