'use strict';

var should = require('should');
var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should get all mails", function (done) {
    var allMails = [];

    retrieve(config.test_refresh_token, config.test_account, {reverse: false, uid: 1}, function(err, mails, lastUid) {
      if(err) {
        throw err;
      }

      allMails = allMails.concat(mails);

      if(lastUid) {
        should.exist(allMails[0]);

        allMails.length.should.be.above(10);

        done();
      }
    });
  });

  it("should list mails modified after specified uid", function (done) {
    var allMails = [];

    retrieve(config.test_refresh_token, config.test_account, {reverse: false, uid: 5}, function(err, mails, lastUid) {
      if(err) {
        throw err;
      }

      allMails = allMails.concat(mails);

      if(lastUid) {
        allMails.length.should.be.above(4);

        done();
      }
    });
  });
});
