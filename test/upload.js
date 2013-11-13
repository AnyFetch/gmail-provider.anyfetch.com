'use strict';

var request = require('supertest');
var CluestrProvider = require('cluestr-provider');
require('should');

var config = require('../config/configuration.js');
var serverConfig = require('../lib/provider-gmail');



describe("Workflow", function () {
  before(CluestrProvider.debug.cleanTokens);

  // Create a fake HTTP server
  process.env.CLUESTR_SERVER = 'http://localhost:1337';

  // Create a fake HTTP server
  var apiServer = CluestrProvider.debug.createTestApiServer();
  apiServer.listen(1337);

  before(function(done) {
    CluestrProvider.debug.createToken({
      cluestrToken: 'fake_gc_access_token',
      datas: config.test_refresh_token,
      cursor: 1
    }, done);
  });

  it("should upload datas to Cluestr", function (done) {
    var nbMailsChecked = 0;

    var originalQueueWorker = serverConfig.queueWorker;
    serverConfig.queueWorker = function(task, cluestrClient, refreshToken, cb) {
      task.should.have.property('identifier');
      task.should.have.property('actions');
      task.should.have.property('metadatas');
      task.metadatas.should.have.property('from');
      task.metadatas.should.have.property('subject');
      task.metadatas.should.have.property('text');
      task.should.have.property('datas');

      nbMailsChecked += 1;
      if(nbMailsChecked === 5) {
        done();
      }
      
      originalQueueWorker(task, cluestrClient, cb);
    };
    
    var server = CluestrProvider.createServer(serverConfig);

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
