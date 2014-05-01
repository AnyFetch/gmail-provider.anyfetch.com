'use strict';

var should = require('should');
var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve.js');

var toMailsOnly = function(allMails) {
  return allMails.filter(function(document) {
    return document._type === "mail";
  });
};

describe("Retrieve code", function () {
  it("should get all mails, in reverse order the first time", function (done) {
    var allMails = [];

    retrieve(config.test_refresh_token, config.test_account, null, function(err, mails, cursor) {
      if(err) {
        throw err;
      }

      allMails = allMails.concat(mails);

      if(cursor) {
        cursor.reverse.should.eql(false);

        should.exist(allMails[0]);

        var allMailsWithoutAttachments = toMailsOnly(allMails);
        allMailsWithoutAttachments.length.should.be.above(10);

        parseInt(allMailsWithoutAttachments[0].uid).should.be.above(allMailsWithoutAttachments[1].uid);

        done();
      }
    });
  });

  it("should get all mails, in reverse order after a first crash", function (done) {
    var allMails = [];

    var cursor = {
      uid: 0,
      minUid:3,
      reverse: true,
    };

    retrieve(config.test_refresh_token, config.test_account, cursor, function(err, mails, cursor) {
      if(err) {
        throw err;
      }

      allMails = allMails.concat(mails);

      if(cursor) {
        cursor.reverse.should.eql(false);

        should.exist(allMails[0]);

        var allMailsWithoutAttachments = toMailsOnly(allMails);
        allMailsWithoutAttachments.should.have.lengthOf(2);

        parseInt(allMailsWithoutAttachments[0].uid).should.be.above(allMailsWithoutAttachments[1].uid);

        done();
      }
    });
  });

  it("should list mails modified after specified uid", function (done) {
    var allMails = [];

    retrieve(config.test_refresh_token, config.test_account, {reverse: false, uid: 5}, function(err, mails, cursor) {
      if(err) {
        throw err;
      }

      allMails = allMails.concat(mails);

      if(cursor) {
        allMails.length.should.be.above(4);

        done();
      }
    });
  });
});
