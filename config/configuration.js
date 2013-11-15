'use strict';

/**
 * @file Defines the provider settings.
 *
 * Will set the path to Mongo, and applications id
 * Most of the configuration can be done using system environment variables.
 */

// node_env can either be "development" or "production"
var node_env = process.env.NODE_ENV || "development";
var default_port = 8000;
if(node_env === "production") {
  default_port = 80;
}

var mandatories = ['GMAIL_ID', 'GMAIL_SECRET', 'GMAIL_CLUESTR_ID', 'GMAIL_CLUESTR_SECRET', 'GOOGLE_CONNECT_URL', 'GMAIL_CALLBACK_URL'];
mandatories.forEach(function(mandatory) {
  if(!process.env[mandatory]) {
    console.log(mandatory + " missing, the provider may fail.");
  }
});

// Exports configuration
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,
  mongo_url: process.env.MONGO_URL || ("mongodb://localhost/provider-gmail-" + node_env),

  max_concurrency: process.env.GMAIL_MAX_CONCURRENCY || 5,
  workers: process.env.WORKERS || 2,

  google_id: process.env.GMAIL_ID,
  google_secret: process.env.GMAIL_SECRET,
  google_callback: process.env.GMAIL_CALLBACK_URL,


  connect_url: process.env.GMAIL_CONNECT_URL,
  cluestr_id: process.env.GMAIL_CLUESTR_ID,
  cluestr_secret: process.env.GMAIL_CLUESTR_SECRET,

  test_refresh_token: process.env.GMAIL_TEST_REFRESH_TOKEN,
  test_account: process.env.GMAIL_TEST_ACCOUNT_NAME
};
