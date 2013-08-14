'use strict';

var readline = require('readline');
var googleapis = require('googleapis');
var keys = require('./keys');
var OAuth2Client = googleapis.OAuth2Client;


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display access and refresh tokens.
var withLoggedClient = function(oauth2Client) {
  console.log("Paste this tokens in your keys.js file: ", oauth2Client.credentials);

  process.exit();
};

// Retrieve a set of tokens from Google
var getAccessToken = function(oauth2Client, callback) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://mail.google.com/'
  });

  console.log('Visit the url: ', url);
  rl.question('Enter the code here:', function(code) {

    // request access token
    oauth2Client.getToken(code, function(err, tokens) {
      if(err) {
        throw err;
      }
      // set tokens to the client
      oauth2Client.credentials = tokens;

      callback(oauth2Client);
    });
  });
};

googleapis.execute(function(err) {
  if(err) {
    throw err;
  }
  
  var oauth2Client =
    new OAuth2Client(keys.GOOGLE_ID, keys.GOOGLE_SECRET, keys.GOOGLE_URL);

  getAccessToken(oauth2Client, withLoggedClient);
});
