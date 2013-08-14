'use strict';

var keys = require('../../../keys.js');
var mapper = require('../helpers/mapper.js');
var request = require('request');

// Use the refresh token to get a new access_token,
// then call `cb`.
var refreshAccessToken = function(refresh_token, cb) {

  // See https://developers.google.com/accounts/docs/OAuth2WebServer#refresh for details
  var params = {
    url: 'https://accounts.google.com/o/oauth2/token',
    form: {
      'refresh_token': refresh_token,
      'client_id': keys.GOOGLE_ID,
      'client_secret': keys.GOOGLE_SECRET,
      'grant_type': 'refresh_token'
    },
    json: true
  };

  request.post(params, function (err, resp, body) {
    if(err){
      throw new Error(err);
    }

    if(resp.statusCode === 401){
      throw new Error("Access to this refresh_token has been revoked.");
    }

    cb(resp.body.access_token);
  });
};

// Retrieve all contacts associated with this user account,
// whom modification date is over `since`.
// then call `cb` with an array of all the contacts.
var retrieveContacts = function(access_token, since, cb) {

  // Pad n to have a length of width,
  // pad(1, 3) == 001
  var pad = function(n, width) {
    width = width || 2;
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(0) + n;
  };

  // Date, formatted as 2007-03-16T00:00:00
  var formattedDate = since.getFullYear() + '-' + pad(since.getMonth() + 1) + '-' + pad(since.getDate()) + 'T' + pad(since.getHours()) + ':' + pad(since.getMinutes()) + ':' + pad(since.getSeconds());

  // See https://developers.google.com/google-apps/contacts/v3/?csw=1#retrieving_contacts_using_query_parameters for details
  var params = {
    url: 'https://www.google.com/m8/feeds/contacts/default/full',
    qs: {
      alt: 'json',
      'max-results': 100000,
      'orderby': 'lastmodified',
      'updated-min': formattedDate
    },
    headers: {
      'Authorization': 'OAuth ' + access_token,
      'GData-Version': '3.0'
    },
    json: true
  };

  request.get(params, function (err, resp, body) {
    if(err) {
      throw err;
    }
    if(resp.statusCode === 401){
      throw new Error("Wrong Google Authorization provided.");
    }

    var contacts = body.feed.entry ? body.feed.entry.map(mapper):[];

    // Contacts is now full!
    cb(contacts);
  });
};

// Download all contacts from the Google acocunt associated with the tokens
// whom modification date is over `since`
// Then calls `cb` with an array of all the contacts.
module.exports = function(tokens, since, cb) {
  refreshAccessToken(tokens.refresh_token, function(access_token) {
    retrieveContacts(access_token, since, cb);
  });
};
