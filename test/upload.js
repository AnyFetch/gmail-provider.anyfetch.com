'use strict';

var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
var Anyfetch = require('anyfetch');
var sinon = require('sinon');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/');

describe("Workflow", function () {
  before(AnyFetchProvider.debug.cleanTokens);

  // Create a fake HTTP server
  Anyfetch.setApiUrl('http://localhost:1337');
  var apiServer = Anyfetch.createMockServer();
  apiServer.listen(1337);

  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_gc_access_token',
      data: {
        callbackUrl: config.providerUrl + "/init/callback",
        tokens: {
          refresh_token: config.testRefreshToken,
          access_token: config.testRefreshToken
        },
        accountName: config.testAccount
      },
      accountName: config.testAccount
    }, done);
  });

  it("should upload data to AnyFetch", function (done) {
    var nbAttachments = 0;
    var nbMails = 0;
    var originalQueueWorker = serverConfig.workers.addition;

    serverConfig.workers.addition = function(job, cb) {
      var spyPostDocument = sinon.spy(job.anyfetchClient, "postDocument");
      var spySendDocumentAndFile = sinon.spy(job.anyfetchClient, "sendDocumentAndFile");
      originalQueueWorker(job, function(err) {
        if(err) {
          return done(err);
        }

        spyPostDocument.callCount.should.be.above(0);
        nbAttachments += spySendDocumentAndFile.callCount;

        nbMails += 1;
        if(nbMails === 12) {
          nbAttachments.should.eql(6);
          return done(null);
        }

        cb(null);
      });
    };

    var server = AnyFetchProvider.createServer(serverConfig.connectFunctions, serverConfig.updateAccount, serverConfig.workers, serverConfig.config);

    request(server)
      .post('/update')
      .send({
        access_token: 'fake_gc_access_token',
        api_url: 'http://localhost:1337'
      })
      .expect(202)
      .end(function(err) {
        if(err) {
          throw err;
        }
      });
  });
});
