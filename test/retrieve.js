'use strict';

var should = require('should');
var config = require('../config/configuration.js');
var retrieve = require('../lib/provider-gmail/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should get all mails", function (done) {
    var mails = [];
    retrieve(config.test_refresh_token, config.test_account,new Date(1970), function(mail) {
      mails.push(mail);
    },function (err) {
      if(err) {
        throw err;
      }
      should.exist(mails[0]);

      done();
    });
  });

  it("should list mail modified in future date", function (done) {
    var mails = [];
    retrieve(config.test_refresh_token, config.test_account, new Date(2020, 9, 22), function(mail) {
      mails.push(mail);
    },
    function (err) {
      if(err) {
        throw err;
      }
      mails.should.have.lengthOf(0);
      done();
    });
  });

  it("should list mail modified after specified date", function (done) {
    var mails = [];
    retrieve(config.test_refresh_token, config.test_account, new Date(2013, 9, 22), function(mail) {
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
