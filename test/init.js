'use strict';

var request = require('supertest');

var app = require('../app.js');

describe("Init APIs endpoints", function () {
  describe("GET /init/connect", function () {
    it("should redirect to Google", function (done) {
      var req = request(app).get('/init/connect?code=123')
        .expect(302)
        .expect('Location', /google\.com/)
        .end(done);
    });
  });
});
