'use strict';

var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/');



describe.only("Workflow", function () {
  before(AnyFetchProvider.debug.cleanTokens);

  // Create a fake HTTP server
  process.env.ANYFETCH_API_URL = 'http://localhost:1337';

  // Create a fake HTTP server
  var apiServer = AnyFetchProvider.debug.createTestApiServer();
  apiServer.listen(1337);

  before(function(done) {
    AnyFetchProvider.debug.createToken({
      anyfetchToken: 'fake_gc_access_token',
      datas: {
        refreshToken: config.test_refresh_token,
        mail : config.test_account
      },
      cursor: 1
    }, done);
  });

  it("should upload datas to AnyFetch", function (done) {
    var nbMailsChecked = 0;

    var originalQueueWorker = serverConfig.queueWorker;

    serverConfig.queueWorker = function(task, anyfetchClient, refreshToken, cb) {
      var mail = originalQueueWorker(task, anyfetchClient, refreshToken, cb);

      try {
        mail.should.have.property('identifier');
        mail.should.have.property('actions');
        mail.should.have.property('metadatas');
        mail.metadatas.should.have.property('from');
        mail.metadatas.should.have.property('subject');
        mail.metadatas.should.have.property('text');
        mail.should.have.property('datas');
        mail.should.have.property('document_type', 'email');
      }
      catch(e) {
        return done(e);
      }

      nbMailsChecked += 1;
      if(nbMailsChecked === 3) {
        done();
      }

      cb();
      //originalQueueWorker(task, anyfetchClient, cb);
    };

    var server = AnyFetchProvider.createServer(serverConfig);

    request(server)
      .post('/update')
      .send({
        access_token: 'fake_gc_access_token'
      })
      .expect(202)
      .end(function(err) {
        if(err) {
          throw err;
        }
      });
  });
});
