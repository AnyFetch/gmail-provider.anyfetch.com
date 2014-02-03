'use strict';

var request = require('supertest');
var AnyFetchProvider = require('anyfetch-provider');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/');



describe("Workflow", function () {
  before(AnyFetchProvider.debug.cleanTokens);

  // Create a fake HTTP server
  process.env.ANYFETCH_SERVER = 'http://localhost:1337';

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

  it.skip("should upload datas to AnyFetch", function (done) {
    var nbMailsChecked = 0;

    var originalQueueWorker = serverConfig.queueWorker;
    serverConfig.queueWorker = function(task, anyfetchClient, refreshToken, cb) {
      task.should.have.property('identifier');
      task.should.have.property('actions');
      task.should.have.property('metadatas');
      task.metadatas.should.have.property('from');
      task.metadatas.should.have.property('subject');
      task.metadatas.should.have.property('text');
      task.should.have.property('datas');
      task.should.have.property('semantic_document_type', 'email');

      nbMailsChecked += 1;
      if(nbMailsChecked === 5) {
        done();
      }
      
      originalQueueWorker(task, anyfetchClient, cb);
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
