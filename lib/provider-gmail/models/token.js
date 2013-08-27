'use strict';
/**
 * @file Model for Token
 *
 * Every connected user from Cluestr has one, mapping its Cluestr token to some Google token.
 */
var mongoose = require('mongoose');

var TokenSchema = new mongoose.Schema({
  // Access token to communicate with Cluestr
  cluestrToken: '',

  // Refresh token to communicate with Google
  googleToken: '',

  // Last time we checked this account
  mailsSaved: {type: Number, default: 1},
});

// Register & export the model
module.exports = mongoose.model('Token', TokenSchema);
