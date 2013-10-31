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

if(!process.env.GMAIL_ID) {
  console.log("GMAIL_ID not specified, api will not work.");
}
if (!process.env.GMAIL_SECRET){
  console.log("GMAIL_SECRET not specified, api will not work.");
}
if (!process.env.GMAIL_CLUESTR_ID){
  console.log("GMAIL_CLUESTR_ID not specified, api will not work.");
}
if (!process.env.GMAIL_CLUESTR_SECRET){
  console.log("GMAIL_CLUESTR_SECRET not specified, api will not work.");
}
if (!process.env.NUMBER_OF_MAILS_TO_RETRIEVE){
  console.log("NUMBER_OF_MAILS_TO_RETRIEVE not specified, api will not work.");
}
if (!process.env.GMAIL_TEST_REFRESH_TOKEN){
  console.log("GMAIL_TEST_REFRESH_TOKEN not specified, api will not work.");
}
if (!process.env.GMAIL_TEST_ACCOUNT_NAME) {
  console.log("GMAIL_TEST_ACCOUNT_NAME not specified, api will not work.");
}
if (!process.env.GOOGLE_CONNECT_URL) {
  console.log("GOOGLE_CONNECT_URL not specified, api will not work.");
}
if (!process.env.GMAIL_CALLBACK_URL) {
  console.log("GMAIL_CALLBACK_URL not specified, api will not work.");
}


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


  connect_url: process.env.GOOGLE_CONNECT_URL,
  cluestr_id: process.env.GMAIL_CLUESTR_ID,
  cluestr_secret: process.env.GMAIL_CLUESTR_SECRET,
  number_of_mails_to_retrieve: process.env.NUMBER_OF_MAILS_TO_RETRIEVE,

  test_refresh_token: process.env.GMAIL_TEST_REFRESH_TOKEN,
  test_account: process.env.GMAIL_TEST_ACCOUNT_NAME
};
