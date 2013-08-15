'use strict';

require('should');
var retrieve = require('../lib/provider-gmail/helpers/retrieve.js');
var keys = require('../keys.js');

describe("Retrieve code", function () {
  // increase timeout, Gmail can be quite slow sometimes
  // and no one likes failing test cases due to timeout.
  this.timeout(9000);
  // Patch number of mails to retrieve for faster tests.
  keys.NUMBER_OF_MAILS_TO_RETRIEVE = 1;

  it("should list mails", function (done) {
    var mailHandler = function(datas) {
      datas.should.have.property('identifier');
      datas.should.have.property('actions');
      datas.actions.should.have.property('show');
      datas.should.have.property('metadatas');
      datas.metadatas.should.have.property('id');
      datas.metadatas.should.have.property('subject');

      done();
    };

    retrieve(keys.GOOGLE_TOKENS.refresh_token, keys.IMAP_USER, 1, mailHandler, function() {});
  });

  it("should list mails with respect to `from` parameter", function (done) {
    var mailHandler = function() {
      throw "Should not be called.";
    };

    retrieve(keys.GOOGLE_TOKENS.refresh_token, keys.IMAP_USER, 10000000, mailHandler, function() { done() });
  });
});
