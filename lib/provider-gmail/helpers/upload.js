'use strict';

var async = require('async');
var request = require('request');

var retrieve = require('../helpers/retrieve.js');
var Token = require('../models/token.js');
var keys = require('../../../keys.js');

// Upload `mail` onto cluestr, then call `cb`.
var account_upload = function(mail, cb) {
  var params = {
    url: keys.CLUESTR_URL,
    form: {
      identifier:mail.id,
      metadatas: mail
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
};

// Sync all mail from all users to Cluestr.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function (cb) {
  var updateTokenMailsSaved = function(token, mailsSaved, cb) {
    if(mailsSaved === -1) {
      return cb();
    }

    token.mailsSaved = mailsSaved;
    token.save(function(err) {
      if(err) {
        throw err;
      }

      cb();
    });
  };

  var uploadMail = function(mail) {
    // Once a mail has been retrieved,
    // Upload it !
    account_upload(mail, function() {});
  };

  Token.find({}, function(err, tokens) {
    if(err) {
      throw err;
    }

    // Build query stack
    var stack = [];
    tokens.forEach(function(token) {
      stack.push(function(cb) {
        // Download mails datas, and upload them
        retrieve(token.googleTokens.refresh_token, token.googleAccount, token.mailsSaved, uploadMail, function(mailsSaved) {
          updateTokenMailsSaved(token, mailsSaved, cb);
        });
      });
    });

    // Real run
    async.parallel(stack, cb);
  });
};
