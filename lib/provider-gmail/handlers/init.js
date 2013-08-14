'use strict';

var restify = require('restify');
var googleapis = require('googleapis');
var keys = require('../../../keys');
var Token = require('../models/token.js');
var OAuth2Client = googleapis.OAuth2Client;

// This handler generates the appropriate URL and redirects the user to Google consentment page.
exports.connect = function (req, res, next) {
  googleapis.execute(function(err) {
    if(err) {
      throw err;
    }

    var oauth2Client = new OAuth2Client(keys.GOOGLE_ID, keys.GOOGLE_SECRET, keys.GOOGLE_URL);

    // generate consent page url for Google Contacts access, even when user is not connected (offline)
    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.google.com/m8/feeds'
    });

    // Redirect to Google page
    res.send(302, null, {
      Location: url
    });

    next();
  });
};

// The user is redirected to this handler after giving consent.
// The GET parameter code will allow us to retrieve access_token and refresh_token for the user.
exports.callback = function (req, res, next) {
  if(!req.params.code) {
    next(new restify.InternalServerError("Missing code parameter."));
  }

  var code = req.params.code;
  var oauth2Client = new OAuth2Client(keys.GOOGLE_ID, keys.GOOGLE_SECRET, keys.GOOGLE_URL);

  // request tokens set
  oauth2Client.getToken(code, function(err, tokens) {
    if(err) {
      throw err;
    }
    
    // Set tokens to the client
    oauth2Client.credentials = tokens;

    // Save for future access
    var token = new Token({ googleTokens: tokens });
    token.save(function(err) {
      if(err) {
        next(err);
      }

      next();
    });
  });
};
