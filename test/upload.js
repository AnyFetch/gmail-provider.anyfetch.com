'use strict';

require('should');
var async = require('async');

var config = require('../config/configuration.js');
var providerGoogleContact = require('../lib/provider-gmail');
var Token = providerGoogleContact.models.Token;

describe("Upload code", function () {
  this.timeout(9000);
  
  // Patch number of mails to retrieve for faster tests.
  config.number_of_mails_to_retrieve = 1;

  it("should not raise any exception", function (done) {
    var token = new Token({
      googleToken: config.test_refresh_token,
      googleAccount: config.test_account
    });

    async.series([
      function(cb) {
        token.save(function(err) {
          if(err) {
            throw err;
          }
          cb();
        });
      },
      function(cb) {
        providerGoogleContact.helpers.upload(cb);
      }
    ], done);
  });
});
