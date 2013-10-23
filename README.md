# GMail Cluestr Provider
> Visit http://cluestr.com for details about Cluestr.

Cluestr provider for mails stored in Gmail

# How to install?
Vagrant up everything (`vagrant up`, `vagrant ssh`).

Create a `keys.sh` file on the directory root:

You'll need to define some environment variables

```sh
# Go to https://code.google.com/apis/console/b/0/?pli=1#access to ask from app id and secret
export GMAIL_ID="gmail-app-id"
export GMAIL_SECRET="gmail-app-secret"

# Callback after google consent, most probably http://your-host/init/callback
export GMAIL_CALLBACK_URL="url-for-callback"

# Cluestr app id and secret
export GMAIL_CLUESTR_ID="cluestr-app-id"
export GMAIL_CLUESTR_SECRET="cluestr-app-secret"

# Number of mails to retrieve in one run.
# Will be patched when running tests
export.NUMBER_OF_MAILS_TO_RETRIEVE='*';

# See below for details
export GMAIL_TEST_REFRESH_TOKEN="see-below"
export GMAIL_TEST_ACCOUNT_NAME="see-below"
```

# How does it works?
Cluestr Core will call `/init/connect` with cluestr Oauth-tokens. The user will be transparently redirected to Google consentment page.
Google will then call us back on `/init/callback` with a `code` parameter. We'll trade the `code` for an `access_token` and a `refresh_token` and store it in the database, along with the Cluestr tokens.

We can now sync datas between Google and Cluestr.

This is where the `upload` handler comes into play.
The function will retrieve, for all the accounts, the mail created since the last run, and upload the datas to Cluestr.

# How to test?
Unfortunately, testing this module is really hard.
This project is basically a simple bridge between Google and Cluestr, so testing requires tiptoeing with the network.

Before running the test suite, you'll need to do:

```
> node test-auth.js
```

Follow the link in your browser with your Google Account. You'll be redirected to `localhost` (server is not running, so you'll get an error). Copy-paste the `code` parameter in your shell, then use the returned value as your GMAIL_TEST_REFRESH_TOKEN environment variable.

> Warning: a refresh token is only displayed once. If you get it wrong for some reason, you'll need to clear the permission for your app on https://www.google.com/settings/u/1/security

Support: `support@papiel.fr`.

