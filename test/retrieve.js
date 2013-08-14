'use strict';

var should = require('should');
var keys = require('../keys.js');
var retrieve = require('../lib/provider-google-contact/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should list first mails", function (done) {
    retrieve(keys.GOOGLE_TOKENS, new Date(1970, 0, 1), function(users) {
      should.exist(users[0]);
      users[0].should.have.property('name');
      done();
    });
  });

  it("should list contacts modified after specified date", function (done) {
    retrieve(keys.GOOGLE_TOKENS, new Date(2020, 0, 1), function(users) {
      users.should.have.lengthOf(0);
      done();
    });
  });
});
