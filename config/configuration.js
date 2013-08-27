// # config/configuration
// Defines application's settings

// Process some values
var node_env = process.env.NODE_ENV || "development";
var default_port = 8000;
if(node_env === "production") {
  default_port = 80;
}

// Exports configuration
module.exports = {
  env: node_env,
  port: process.env.PORT || default_port,
  mongo_url: process.env.MONGO_URL || ("mongodb://localhost/provider-gmail-" + node_env),

  google_id: process.env.GMAIL_ID,
  google_secret: process.env.GMAIL_SECRET,
  google_callback: process.env.GMAIL_CALLBACK_URL,

  cluestr_id: process.env.GMAIL_CLUESTR_ID,
  cluestr_secret: process.env.GMAIL_CLUESTR_SECRET,
  number_of_mails_to_retrieve: process.env.NUMBER_OF_MAILS_TO_RETRIEVE,

  test_refresh_token: process.env.GMAIL_TEST_REFRESH_TOKEN,
  test_account: process.env.GMAIL_TEST_ACCOUNT_NAME
};
