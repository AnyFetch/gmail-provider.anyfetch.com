'use strict';
/**
* This object contains all the handlers to use for this providers
*/
var googleapis = require('googleapis');
var async = require('async');
var rarity = require('rarity');
var CancelError = require('anyfetch-provider').CancelError;

var config = require('../config/configuration.js');

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
  ], function(err, accountName, data) {
    // This error can happen if Google fail. We can retry
    // See https://code.google.com/p/google-bigquery/issues/detail?id=118 & https://opbeat.com/anyfetch/gcontacts-staging/errors/57/
    if(err && err.toString().match(/backend/i)) {
      return retrieveTokens(reqParams, storedParams, cb);
    }

    cb(err, accountName, data);
  });
};

module.exports = {
  connectFunctions: {
    redirectToService: redirectToService,
    retrieveTokens: retrieveTokens
  },

  config: config
};
