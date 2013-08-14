'use strict';
// # models/token
// Store Cluestr and Google Oauth tokens.

var mongoose = require('mongoose');

var TokenSchema = new mongoose.Schema({
  // Tokens to communicate with Cluestr
  cluestrTokens: {},

  // Tokens to communicate with Google
  googleTokens: {},

  // Last time we checked this account
  lastAccess: {type: Date, required: true, default:new Date(1970, 0, 1)},
});

// Register & export the model
module.exports = mongoose.model('TokenSchema', TokenSchema);
