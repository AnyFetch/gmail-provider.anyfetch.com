'use strict';

var should = require('should');
var async = require('async');

var keys = require('../keys.js');
var providerGoogleContact = require('../lib/provider-google-contact');
var Token = providerGoogleContact.models.Token;

describe("Upload code", function () {
  it("should not raise any exception", function (done) {
    // It is quite hard to really test the upload code,
    // Therefore we'll only check no errors are raised.
    // For faster test, we won't upload.
    keys.CLUESTR_URL = 'http://test/';

    var token = new Token({
      googleTokens: keys.GOOGLE_TOKENS
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
