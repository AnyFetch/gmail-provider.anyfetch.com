'use strict';
/**
* This object contains all the handlers to use for this providers
*/
var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var config = require('../config/configuration.js');
var updloadMail = require('./helpers/upload.js');
var retrieveMails = require('./helpers/retrieve.js');
var retrieveAccountMail = require('./helpers/retrieve-account-mail.js');


var initAccount = function(req, next) {
  googleapis.execute(function(err) {
    if(err) {
      return next(err);
    }

    var oauth2Client = new OAuth2Client(config.google_id, config.google_secret, config.google_callback);

    // generate consent page url for Google Contacts access, even when user is not connected (offline)
    var redirectUrl = oauth2Client.generateAuthUrl( {
      access_type: 'offline',
      scope: 'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email',
      approval_prompt: 'force', // Force resending a refresh_token
      state: req.params.code,
    });

    next(null, {code: req.params.code}, redirectUrl);
  });
};

var connectAccountRetrievePreDataIdentifier = function(req, next) {
  if(!req.params.state) {
    return next("State parameter left out of query.");
  }

  next(null, {'data.code': req.params.state});
};

var connectAccountRetrieveAuthData = function(req, preData, next) {
  var oauth2Client = new OAuth2Client(config.google_id, config.google_secret, config.google_callback);
  // request tokens set
  oauth2Client.getToken(req.params.code, function(err, tokens) {
    if(err) {
      return next(new Error(err));
    }

    // Google only send refresh token once, the first time.
    if(!tokens.refresh_token) {
      return next(new Error("You're already subscribed to AnyFetch Google Mail. To subscribe again, please revoke the permission from your Google Account using https://accounts.google.com/b/0/IssuedAuthSubTokens."));
    }

    // Set tokens to the client
    // Not really useful in our case.
    oauth2Client.credentials = tokens;

    // Retrieve user email
    retrieveAccountMail(tokens.access_token, function(err, mail) {
      var data = {
        'refreshToken': tokens.refresh_token,
        'mail': mail
      };
      next(err, data);
    });
  });
};

var updateAccount = function(data, cursor, next) {
  // Retrieve all mails since last calls
  retrieveMails(data.refreshToken, data.mail, cursor, next);
};

module.exports = {
  initAccount: initAccount,
  connectAccountRetrievePreDataIdentifier: connectAccountRetrievePreDataIdentifier,
  connectAccountRetrieveAuthData: connectAccountRetrieveAuthData,
  updateAccount: updateAccount,
  queueWorker: updloadMail,

  anyfetchAppId: config.anyfetch_id,
  anyfetchAppSecret: config.anyfetch_secret,
  connectUrl: config.connect_url,
  concurrency: config.max_concurrency
};
