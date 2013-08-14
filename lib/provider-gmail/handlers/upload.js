'use strict';

var retrieve = require('../helpers/retrieve.js');
var Token = require('../models/token.js');
var keys = require('../../../keys.js');
var request = require('request');
var async = require('async');

// Upload `users` onto cluestr, then call `cb`.
var account_upload = function(users, cb) {
  var stack = [];
  for(var i = 0; i < users.length; i += 1) {
    var user = users[i];

    stack.push(function(cb) {
      var params = {
        url: keys.CLUESTR_URL,
        form: {
          identifier:'---',
          source:'---',
          metadatas: user
        },
        headers: {
          'Authorization': 'OAuth TODO',
          'GData-Version': '3.0'
        }
      };

      if(keys.CLUESTR_URL === 'http://test/') {
        // We're running test, let's do things a little faster and skip the upload part.
        return cb();
      }

      request.post(params, function (err, resp, body) {
        if(err) {
          throw err;
        }
        if(resp.statusCode === 401) {
          throw new Error("Cluestr Authorization has been revoked.");
        }

        // TODO: test body
        cb();
      });
    });
  }

  async.parallel(stack, cb);
};

// Sync all contacts from all users to Cluestr.
// Note: only the contacts modified since last run will be uploaded.
module.exports = function (cb) {
  var updateTokenAccess = function(token, date, cb) {
    token.lastAccess = date;
    token.save(function(err) {
      if(err) {
        throw err;
      }

      cb();
    });
  };

  Token.find({}, function(err, tokens) {
    if(err) {
      throw err;
    }

    // Build query stack
    var stack = [];
    for(var i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];

      stack.push(function(cb) {
        // Download contacts datas, and upload them
        retrieve(token.googleTokens, token.lastAccess, function(users) {
          // Once the users have been retrieved,
          // Store the current date -- we'll write this onto token.lastAccess if the upload runs smoothly.
          var currentDate = new Date();
          account_upload(users, function() {
            updateTokenAccess(token, currentDate, cb);
          });
        });
      });
    }

    // Real run
    async.parallel(stack, cb);
  });
};
