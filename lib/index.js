'use strict';
/**
* This object contains all the handlers to use for this providers
*/
var googleapis = require('googleapis');
var async = require('async');
var rarity = require('rarity');
var CancelError = require('anyfetch-provider').CancelError;

var config = require('../config/configuration.js');
var uploadMail = require('./helpers/upload.js');
var retrieveMails = require('./helpers/retrieve.js');

var redirectToService = function(callbackUrl, cb) {
  var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, callbackUrl);

  // generate consent page url for Gmail access, even when user is not connected (offline)
  var redirectUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
    approval_prompt: 'force', // Force resending a refresh_token
  });

  cb(null, redirectUrl, {callbackUrl: callbackUrl});
};

var retrieveTokens = function(reqParams, storedParams, cb) {
  if(reqParams.error === "access_denied") {
    return cb(new CancelError());
  }

  async.waterfall([
    function getToken(cb) {
      var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, storedParams.callbackUrl);
      oauth2Client.getToken(reqParams.code, rarity.carryAndSlice([oauth2Client], 3, cb));
    },
    function getUserInfo(oauth2Client, tokens, cb) {
      oauth2Client.credentials = tokens;
      googleapis.oauth2('v2').userinfo.get({auth: oauth2Client}, rarity.carryAndSlice([tokens], 3, cb));
    },
    function callFinalCb(tokens, data, cb) {
      cb(null, data.email, {tokens: tokens, callbackUrl: storedParams.callbackUrl, accountName: data.email});
    }
  ], cb);
};

var updateAccount = function(serviceData, cursor, queues, cb) {
  // Retrieve all mails since last call
  async.waterfall([
    function refreshTokens(cb) {
      var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, serviceData.callbackUrl);
      oauth2Client.refreshToken_(serviceData.tokens.refresh_token, function(err, tokens) {
        tokens.refresh_token = serviceData.tokens.refresh_token;
        serviceData.tokens = tokens;
        cb(err);
      });
    },
    function getMails(cb) {
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

      retrieveMails(options, cursor, [], cb);
    },
    function addMailsToQueue(newCursor, mails, cb) {
      mails.forEach(function(mail) {
        mail.title = "https://mail.google.com/mail/#inbox/" + mail.threadId + "#" + mail.id;
        queues.addition.push(mail);
      });
      cb(null, newCursor, serviceData);
    }
  ], cb);
};

var additionQueueWorker = function(job, cb) {
  uploadMail(job.task, job.anyfetchClient, job.serviceData, job.cache, cb);
};

additionQueueWorker.concurrency = config.concurrency;

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