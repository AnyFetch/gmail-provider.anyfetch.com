'use strict';

var should = require('should');
var async = require('async');
var googleapis = require('googleapis');
var rarity = require('rarity');
var config = require('../config/configuration.js');
var retrieve = require('../lib/helpers/retrieve.js');

describe("Retrieve code", function () {
  it("should get all mails", function (done) {
    async.waterfall([
      function getClient(cb) {
        googleapis.discover('gmail', 'v1').execute(cb);
      },
      function refreshToken(client, cb) {
        var oauth2Client = new googleapis.OAuth2Client(config.googleId, config.googleSecret, config.providerUrl + "/init/callback");
        oauth2Client.refreshToken_(config.testRefreshToken, rarity.carryAndSlice([oauth2Client, client], 4, cb));
      },
      function callRetrieve(oauth2Client, client, tokens, cb) {
        var options = {
          userId: config.testAccount,
          maxResults: 1000
        };
        
        oauth2Client.credentials = tokens;
        retrieve(client, oauth2Client, options, {date: new Date(1970), id: 0}, [], cb);
      },
      function checkMails(newCursor, mails, cb) {
        should.exist(mails[0]);
        mails.length.should.be.above(10);
        parseInt(mails[0].id, 16).should.be.below(parseInt(mails[1].id, 16));
        cb(null);
      }
    ], done);
  });

  it("should list mails modified after specified id", function (done) {
    async.waterfall([
      function getClient(cb) {
        googleapis.discover('gmail', 'v1').execute(cb);
      },
      function refreshToken(client, cb) {
        var oauth2Client = new googleapis.OAuth2Client(config.googleId, config.googleSecret, config.providerUrl + "/init/callback");
        oauth2Client.refreshToken_(config.testRefreshToken, rarity.carryAndSlice([oauth2Client, client], 4, cb));
      },
      function callRetrieve(oauth2Client, client, tokens, cb) {
        var options = {
          userId: config.testAccount,
          maxResults: 1000
        };
        
        oauth2Client.credentials = tokens;
        retrieve(client, oauth2Client, options, {date: new Date("Thu Oct 24 2013 14:19:57 GMT+0200 (CEST)"), id: 0}, [], cb);
      },
      function checkMails(newCursor, mails, cb) {
        should.exist(mails[0]);
        mails.length.should.be.above(8);
        parseInt(mails[0].id, 16).should.be.below(parseInt(mails[1].id, 16));
        cb(null);
      }
    ], done);
  });
});
