'use strict';

require('should');
var async = require('async');
var request = require('request');

var config = require('../config/configuration.js');
var retrieveAccountMail = require('../lib/helpers/retrieve-account-mail.js');

/**
 * Use the Google refresh token to get a new accessToken,
 *
 * @param {String} refreshToken Refresh token issued by Google
 * @param {Function} cb First parameter is the error (if any), then the new accessToken (valid for one hour)
 */
var refreshAccessToken = function(refreshToken, cb) {

  // See https://developers.google.com/accounts/docs/OAuth2WebServer#refresh for details
  var params = {
    url: 'https://accounts.google.com/o/oauth2/token',
    form: {
      'refresh_token': refreshToken,
      'client_id': config.google_id,
      'client_secret': config.google_secret,
      'grant_type': 'refresh_token'
    },
    json: true
  };

  request.post(params, function (err, res) {
    if(err) {
      return cb(err);
    }

    if(res.statusCode === 401) {
      return cb(new Error("Access to this refresh_token has been revoked."));
    }
    if(res.statusCode !== 200) {
      return cb(new Error("Google Error: " + res.body.message));
    }

    cb(null, res.body.access_token);
  });
};


describe("Retrieve account mail", function () {
  it("should get the user email", function (done) {
    async.waterfall([
      async.apply(refreshAccessToken, config.test_refresh_token),
      function(accessToken, cb) {
        retrieveAccountMail(accessToken, cb);
      },
      function(userMail, cb) {
        userMail.should.equal(config.test_account);
        cb();
      }
    ], done);
  });
});
