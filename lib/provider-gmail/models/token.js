'use strict';
// # models/token
// Store Cluestr and Google Oauth tokens.

var mongoose = require('mongoose');

var TokenSchema = new mongoose.Schema({
  // Tokens to communicate with Cluestr
  cluestrTokens: {},

  // Tokens to communicate with Google
  googleTokens: {},

  // Google account associated with this token
  googleAccount: {},

  // Last time we checked this account
  mailsSaved: {type: Number, required: true, default: 1},
});

// Register & export the model
module.exports = mongoose.model('TokenSchema', TokenSchema);
