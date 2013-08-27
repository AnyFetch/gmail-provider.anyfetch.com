'use strict';

require('should');
var retrieve = require('../lib/provider-gmail/helpers/retrieve.js');
var config = require('../config/configuration.js');

describe("Retrieve code", function () {
  // increase timeout, Gmail can be quite slow sometimes
  // and no one likes failing test cases due to timeout.
  this.timeout(9000);
  // Patch number of mails to retrieve for faster tests.
  config.number_of_mails_to_retrieve = 1;

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

    retrieve(config.test_refresh_token, config.test_account, 1, mailHandler, function() {});
  });

  it("should list mails with respect to `from` parameter", function (done) {
    var mailHandler = function() {
      throw "Should not be called.";
    };

    retrieve(config.test_refresh_token, config.test_account, 10000000, mailHandler, function() { done(); });
  });
});
