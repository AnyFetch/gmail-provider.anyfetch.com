'use strict';
/**
* This object contains all the handlers to use for this providers
*/
var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var config = require('../config/configuration.js');
var async = require('async');
var rarity = require('rarity');
var uploadMail = require('./helpers/upload.js');
var retrieveMails = require('./helpers/retrieve.js');

var redirectToService = function(callbackUrl, cb) {
  googleapis.execute(function(err) {
    if(err) {
      return cb(err);
    }

    var oauth2Client = new OAuth2Client(config.googleId, config.googleSecret, callbackUrl);

    // generate consent page url for Gmail access, even when user is not connected (offline)
    var redirectUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      approval_prompt: 'force', // Force resending a refresh_token
    });

    cb(null, redirectUrl, {callbackUrl: callbackUrl});
  });
};

var retrieveTokens = function(reqParams, storedParams, cb) {
  async.waterfall([
    function getClient(cb) {
      googleapis.discover('oauth2', 'v2').execute(cb);
    },
    function getToken(client, cb) {
      var oauth2Client = new OAuth2Client(config.googleId, config.googleSecret, storedParams.callbackUrl);
      oauth2Client.getToken(reqParams.code, rarity.carryAndSlice([oauth2Client, client], 4, cb));
    },
    function getUserInfo(oauth2Client, client, tokens, cb) {
      oauth2Client.credentials = tokens;
      client.oauth2.userinfo.get().withAuthClient(oauth2Client).execute(rarity.carryAndSlice([tokens], 3, cb));
    },
    function callFinalCb(tokens, data, cb) {
      cb(null, data.email, {tokens: tokens, callbackUrl: storedParams.callbackUrl, accountName: data.email});
    }
  ], cb);
};

var updateAccount = function(serviceData, cursor, queues, cb) {
  // Retrieve all mails since last call
  async.waterfall([
    function getClient(cb) {
      googleapis.discover('gmail', 'v1').execute(cb);
    },
    function getMails(client, cb) {
      var options = {
        maxResults: 1000,
        userId: serviceData.accountName
      };

      if(!cursor) {
        cursor = new Date(1970);
      }

      var oauth2Client = new OAuth2Client(config.googleId, config.googleSecret, serviceData.callbackUrl);
      oauth2Client.credentials = serviceData.tokens;

      retrieveMails(client, oauth2Client, options, cursor, [], cb);
    },
    function addMailsToQueue(newCursor, mails, cb) {
      queues.addition = mails;
      cb(null, newCursor);
    }
  ], cb);
};

var additionQueueWorker = function(job, cb) {
  uploadMail(job.task, job.anyfetchClient, job.serviceData, job.cache, cb);
};

additionQueueWorker.concurrency = config.maxConcurrency;

module.exports = {
  connectFunctions: {
    redirectToService: redirectToService,
    retrieveTokens: retrieveTokens
  },
  updateAccount: updateAccount,
  workers: {
    addition: additionQueueWorker
  },

  config: config
};