'use strict';

var should = require('should');
var async = require('async');
var googleapis = require('googleapis');
var rarity = require('rarity');
var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should get all threads", function (done) {
    async.waterfall([
      function refreshToken(cb) {
        var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, config.providerUrl + "/init/callback");
        oauth2Client.refreshToken_(config.testRefreshToken, rarity.carryAndSlice([oauth2Client], 3, cb));
      },
      function callRetrieve(oauth2Client, tokens, cb) {
        var options = {
          userId: config.testAccount,
          maxResults: 1000
        };
        oauth2Client.credentials = tokens;
        options.auth = oauth2Client;

        retrieve(options, {date: new Date(1970), id: 0}, [], cb);
      },
      function checkThreads(newCursor, threads, cb) {
        should.exist(threads[0]);
        threads.length.should.be.above(10);
        parseInt(threads[0].id, 16).should.be.below(parseInt(threads[1].id, 16));
        cb(null);
      }
    ], done);
  });

  it("should list threads modified after specified id", function (done) {
    async.waterfall([
      function refreshToken(cb) {
        var oauth2Client = new googleapis.auth.OAuth2(config.googleId, config.googleSecret, config.providerUrl + "/init/callback");
        oauth2Client.refreshToken_(config.testRefreshToken, rarity.carryAndSlice([oauth2Client], 3, cb));
      },
      function callRetrieve(oauth2Client, tokens, cb) {
        var options = {
          userId: config.testAccount,
          maxResults: 1000
        };
        oauth2Client.credentials = tokens;
        options.auth = oauth2Client;

        retrieve(options, {date: new Date("Thu Oct 24 2013 14:19:57 GMT+0200 (CEST)"), id: 0}, [], cb);
      },
      function checkThreads(newCursor, threads, cb) {
        should.exist(threads[0]);
        threads.length.should.be.above(8);
        parseInt(threads[0].id, 16).should.be.below(parseInt(threads[1].id, 16));
        cb(null);
      }
    ], done);
  });
});
