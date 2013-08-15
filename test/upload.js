'use strict';

require('should');
var async = require('async');

var keys = require('../keys.js');
var providerGoogleContact = require('../lib/provider-gmail');
var Token = providerGoogleContact.models.Token;

describe("Upload code", function () {
  // Patch number of mails to retrieve for faster tests.
  keys.NUMBER_OF_MAILS_TO_RETRIEVE = 1;

  it("should not raise any exception", function (done) {
    // It is quite hard to really test the upload code,
    // Therefore we'll only check no errors are raised.
    // For faster test, we won't really upload.
    // We'll patch the url.
    keys.CLUESTR_URL = 'http://test/';

    var token = new Token({
      googleTokens: keys.GOOGLE_TOKENS,
      googleAccount: keys.IMAP_USER
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
        providerGoogleContact.handlers.upload(cb);
      }
    ], done);
  });
});
