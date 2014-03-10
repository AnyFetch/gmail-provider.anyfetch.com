'use strict';

var should = require('should');
var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should get all mails", function (done) {
    var mails = [];
    retrieve(config.test_refresh_token, config.test_account, 1, function(mail) {
      mails.push(mail);
    }, function (err) {
      if(err) {
        throw err;
      }
      should.exist(mails[0]);

      mails.length.should.be.above(4);

      if(!done.called) {
        done();
        done.called = true;
      }
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
      mails.length.should.have.above(3);

      if(!done.called) {
        done();
        done.called = true;
      }
    });
  });
});
