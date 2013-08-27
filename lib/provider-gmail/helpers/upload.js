'use strict';

var async = require('async');
var Cluestr = require('cluestr');

var retrieve = require('../helpers/retrieve.js');
var Token = require('../models/token.js');
var config = require('../../../config/configuration.js');

/**
 * Upload a mail onto Cluestr
 *
 * @param {Object} mail The mail to be uploaded
 * @param {String} accessToken Cluestr access token (the account to upload datas on)
 * @param {Function} cb Callback
 */
var account_upload = function(mail, accessToken, cb) {
  var cluestr = new Cluestr(config.cluestr_id, config.cluestr_secret);
  cluestr.setAccessToken(accessToken);

  // Ugly: skip when testing
  if(process.env.NODE_ENV === 'test') {
    return cb();
  }

  cluestr.sendDocument(mail, cb);
};

// Sync all mail from all users to Cluestr.
// Note: only the last mail modified since last run will be uploaded.
module.exports = function (cb) {
  var updateTokenMailsSaved = function(token, mailsSaved, cb) {
    if(mailsSaved === -1) {
      return cb();
    }

    //token.mailsSaved = mailsSaved;
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
    tokens.forEach(function(token) {


      stack.push(function(cb) {

        /**
         * Upload a mail after retrieval
         */
        var uploadMail = function(mail) {
          account_upload(mail, token.cluestrToken, function() {});
        };

        /**
         * All mails uploaded.
         *
         * @param {int} mailsSaved Number of mails saved (total, not only in this run)
         */
        var mailsUploaded = function(mailsSaved) {
          updateTokenMailsSaved(token, mailsSaved, cb);
        };

        // Download mails datas, and upload them
        retrieve(token.googleToken, token.googleAccount, token.mailsSaved, uploadMail, mailsUploaded);
      });
    });

    // Real run
    async.parallel(stack, cb);
  });
};
