'use strict';

/**
 * @file Defines the provider settings.
 *
 * Will set the path to Mongo, and applications id
 * Most of the configuration can be done using system environment variables.
 */

// Load environment variables from .env file
var dotenv = require('dotenv');
dotenv.load();

// node_env can either be "development" or "production"
var node_env = process.env.NODE_ENV || "development";
var default_port = 8000;
if(node_env === "production") {
  default_port = 80;
}

var mandatories = ['GMAIL_API_ID', 'GMAIL_API_SECRET', 'ANYFETCH_API_ID', 'ANYFETCH_API_SECRET'];
mandatories.forEach(function(mandatory) {
  if(!process.env[mandatory]) {
    console.log(mandatory + " missing, the provider may fail.");
  }
});


// Exports configuration
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,
  maxSize: process.env.MAX_SIZE || 50,

  mongoUrl: process.env.MONGO_URL || process.env.MONGOLAB_URI,
  redisUrl: process.env.REDIS_URL || process.env.REDISCLOUD_URL,

  maxConcurrency: process.env.GMAIL_MAX_CONCURRENCY || 10,

  googleId: process.env.GMAIL_API_ID,
  googleSecret: process.env.GMAIL_API_SECRET,

  appId: process.env.ANYFETCH_API_ID,
  appSecret: process.env.ANYFETCH_API_SECRET,

  providerUrl: process.env.PROVIDER_URL,

  testRefreshToken: process.env.GMAIL_TEST_REFRESH_TOKEN,
  testAccount: process.env.GMAIL_TEST_ACCOUNT_NAME,
  imapTimeout: process.env.IMAP_TIMEOUT || 20000
};
