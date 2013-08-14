'use strict';

var request = require('supertest');
var should = require('should');
var async = require('async');
var Browser = require('zombie');

var app = require('../app.js');
var keys = require('../keys.js');

describe("Init APIs endpoints", function () {
  describe("GET /init/connect", function () {
    it("should redirect to Google", function (done) {
      var req = request(app).get('/init/connect')
        .expect(302)
        .expect('Location', /google\.com/)
        .end(done);
    });
  });

  // TODO: get it running.
  // Currently buggy. I believe it is due to Google having some JS errors on their redirection page.
  describe("GET /init/callback", function () {
    it.skip("should be called after Google consentment page", function (done) {
      var browser = new Browser();
      var googleUrl;

      this.timeout(7000);
      async.auto({
        retrieveGoogleLocation: function(cb) {
          var req = request(app).get('/init/connect')
            .expect(302)
            .expect('Location', /google\.com/)
            .end(function(err, res) {
            if(err) {
              throw err;
            }
            
            googleUrl = res.headers.location;
            cb();
          });
        },
        downloadGooglePage: ['retrieveGoogleLocation', function(cb) {
          browser.visit(googleUrl, cb);
        }],
        loginToGoogle: ['downloadGooglePage', function(cb) {
          browser.success.should.equal(true);

          browser
            .fill("#Email", keys.GOOGLE_LOGIN)
            .fill("#Passwd", keys.GOOGLE_PASSWORD)
            .pressButton("#signIn", cb);
        }],
        testing: ['loginToGoogle', function(cb) {
          cb();
        }]
        // consentToGoogle: ['------loginToGoogle', function(cb) {
        //   browser.success.should.equal(true);
        //   browser.pressButton("#submit_approve_access", cb);
        //   cb();
        // }],
        // test: ['consentToGoogle', function(cb) {
        //   cb();
        //   // To this point, a token should have been created.
        //   Token.count({}, function(err, count) {
        //     console.log(count);
        //     cb();
        //   })
        // }]
      }, done);
    });
  });

});
