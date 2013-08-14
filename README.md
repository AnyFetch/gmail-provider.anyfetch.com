# Google Contact Cluestr Provider
> Visit http://cluestr.com for details about Cluestr.

Cluestr provider for contacts stored in Google Contacts.

# How to install?
Vagrant up everything (`vagrant up`, `vagrant ssh`).

Create a `keys.js` file on the directory root:

```javascript
// Google ids
module.exports.GOOGLE_ID = "{your_google_id}";
module.exports.GOOGLE_SECRET = "{yourgoogle_secret}";
module.exports.GOOGLE_URL = "{your_redirect_url}";

// Cluestr ids
module.exports.CLUESTR_ID = "{your_cluestr_id}";
module.exports.CLUESTR_SECRET = "{your_cluestr_secret}";
module.exports.CLUESTR_URL = "{cluestr_provider_url}"

// Access token for test.
// See README.md
module.exports.GOOGLE_TOKENS = '{see below}';
```

# How does it works?
Cluestr Core will call `/init/connect` with cluestr Oauth-tokens. The user will be transparently redirected to Google consentment page.
Google will then call us back on `/init/callback` with a `code` parameter. We'll trade the `code` for an `access_token` and a `refresh_token` and store it in the database, along with the Cluestr tokens.

We can now sync datas between Google and Cluestr.

This is where the `upload` handler comes into play.
The function will retrieve, for all the accounts, the contacts modified since the last run, and upload the datas to Cluestr.

# How to test?
Unfortunately, testing this module is really hard.
This project is basically a simple bridge between Google and Cluestr, so testing requires tiptoeing with the network.

Before running the test suite, you'll need to do:

```
> node test-auth.js
```

Follow the link in your browser with your Google Account. You'll be redirected to `localhost` (server is not running, so you'll get an error). Copy-paste the `code` parameter in your shell, then paste the returned object in your `keys.js` file.

> Warning: a refresh token is only displayed once. If you get it wrong for some reason, you'll need to clear the permission for your app on https://www.google.com/settings/u/1/security

Support: `support@papiel.fr`.
