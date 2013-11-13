'use strict';

var should = require('should');
var config = require('../config/configuration.js');
var retrieve = require('../lib/provider-gmail/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should get all mails", function (done) {
    var mails = [];
    retrieve(config.test_refresh_token, config.test_account, 1, function(mail) {
      mails.push(mail);
    },function (err, lastUid) {
      if(err) {
        throw err;
      }
      should.exist(mails[0]);

      lastUid.should.be.above(8);

      done();
    });
  });

  it("should list mails modified after specified uid", function (done) {
    var mails = [];
    retrieve(config.test_refresh_token, config.test_account, 4, function(mail) {
      mails.push(mail);
    }, function (err) {
      if(err) {
        throw err;
      }
      mails.should.have.lengthOf(6);
      done();
    });
  });
});
