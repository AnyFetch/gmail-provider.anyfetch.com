'use strict';

require('should');
var keys = require('../keys.js');
var retrieve = require('../lib/provider-gmail/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should list first mails", function (done) {
    var mailHandler = function(datas) {
      datas.should.have.property('identifier');
      datas.should.have.property('actions');
      datas.actions.should.have.property('show');
      datas.should.have.property('metadatas');
      datas.metadatas.should.have.property('id');
      datas.metadatas.should.have.property('subject');
    };

    retrieve(keys.GOOGLE_TOKENS.refresh_token, keys.IMAP_USER, 1, mailHandler, done);
  });

  it("should list mails with respect to `from` parameter", function (done) {
    var mailHandler = function() {
      throw "Should not be called.";
    };

    retrieve(keys.GOOGLE_TOKENS.refresh_token, keys.IMAP_USER, 10000000, mailHandler, done);
  });
});
