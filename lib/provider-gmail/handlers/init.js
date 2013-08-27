'use strict';
/**
 * @file Define initial handlers,
 *
 * This retrieves access_token for both Google and Cluestr.
 *
 */

var restify = require('restify');
var googleapis = require('googleapis');

var config = require('../../../config/configuration.js');
var Token = require('../models/token.js');
var OAuth2Client = googleapis.OAuth2Client;

/**
 * This handler generates the appropriate URL and redirects the user to Google consentment page.
 *
 * We require a GET `code` parameter (authorization code from Cluestr API)
 * We'll then transparently (302) redirect to Google consentment page. When the user is OK, we'll be redirected back to /init/callback
 * For now, we won't do anything with the Cluestr authorization code: we'll simply pass it along to Google as `state` for later use.
 * @see http://stackoverflow.com/a/7722099/1731144
 * @see https://developers.google.com/accounts/docs/OAuth2WebServer#handlingtheresponse
 * 
 * @param {Object} req Request object from the client
 * @param {Object} res Response we want to return
 * @param {Function} next Callback to call once res has been populated.
 */
module.exports.connect = function (req, res, next) {
  googleapis.execute(function(err) {
    if(err) {
      return next(err);
    }

    if(!req.params.code) {
      return next(new Error("Missing code parameter."));
    }

    var oauth2Client = new OAuth2Client(config.google_id, config.google_secret, config.google_callback);

    // generate consent page url for Google Contacts access, even when user is not connected (offline)
    var url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://mail.google.com/'
    });

    // Add cluestr code token
    url += '&state=' + req.params.code;

    // Redirect to Google page
    res.send(302, null, {
      Location: url
    });

    next();
  });
};

/**
 * The user is redirected to this handler after giving consent to Google.
 *
 * The GET parameter `code` will allow us to retrieve Google access_token and refresh_token for the user.
 * The GET parameter `state` is the Cluestr 
 * 
 * @param {Object} req Request object from the client
 * @param {Object} res Response we want to return
 * @param {Function} next Callback to call once res has been populated.
 */
exports.callback = function (req, res, next) {
  if(!req.params.code) {
    return next(new restify.InternalServerError("Missing code parameter."));
  }

  var oauth2Client = new OAuth2Client(config.google_id, config.google_secret, config.google_callback);
  // request tokens set
  oauth2Client.getToken(req.params.code, function(err, tokens) {
    if(err) {
      return next(err);
    }

    // Set tokens to the client
    // Not really useful in our case.
    oauth2Client.credentials = tokens;

    // Save for future access in MongoDB
    var token = new Token({
      cluestrToken: req.params.state,
      googleToken: tokens.refresh_token
    });

    token.save(function(err) {
      if(err) {
        return next(err);
      }

      // Redirect to Cluestr page
      res.send(302, null, {
        Location: 'http://cluestr.com/app'
      });

      next();
    });
  });
};
