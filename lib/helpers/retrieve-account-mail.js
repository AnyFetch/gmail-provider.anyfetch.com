'use strict';
/**
 * @file Retrieve user email address
 */

var request = require('request');


/**
 * Retrieve the user email associated with this refresh token
 * 
 * @param accessToken token to use
 * @param cb First param is err, second the user email.
 */
module.exports = function(accessToken, cb) {
  // See https://developers.google.com/google-apps/contacts/v3/?csw=1#retrieving_contacts_using_query_parameters for details
  var params = {
    url: 'https://www.googleapis.com/oauth2/v1/userinfo',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
    json: true
  };

  request.get(params, function (err, res, body) {
    if(err) {
      return cb(err);
    }
    if(res.statusCode === 401) {
      return cb(new Error("Wrong Google Authorization provided."));
    }
    if(res.statusCode !== 200) {
      return cb(new Error("Google Error: " + res.body.message));
    }

    cb(null, body.email);
  });
};
