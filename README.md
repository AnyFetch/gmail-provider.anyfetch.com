# GMail Provider
> Visit http://anyfetch.com for details about anyFetch.

anyFetch provider for mails stored in Gmail

# How to install?
Create a `keys.sh` file on the directory root:

```sh
# Go to https://code.google.com/apis/console/b/0/?pli=1#access to ask from app id and secret
export GMAIL_ID="gmail-app-id"
export GMAIL_SECRET="gmail-app-secret"

# Callback after google consent, most probably http://your-host/init/callback
export GMAIL_CALLBACK_URL="url-for-callback"

# Anyfetch app id and secret
export GMAIL_ANYFETCH_ID="anyfetch-app-id"
export GMAIL_ANYFETCH_SECRET="anyfetch-app-secret"

# Number of mails to retrieve in one run.
# Will be patched when running tests
export NUMBER_OF_MAILS_TO_RETRIEVE='*';

# See below for details
export GMAIL_TEST_REFRESH_TOKEN="see-below"
export GMAIL_TEST_ACCOUNT_NAME="see-below"
```

# How does it works?
Fetch API will call `/init/connect` with oauth-tokens. The user will be transparently redirected to Google consentment page.
Google will then call us back on `/init/callback` with a `code` parameter. We'll trade the `code` for an `access_token` and a `refresh_token` and store it in the database, along with the anyFetch tokens.

We can now sync datas between Google and anyFetch.

This is where the `upload` handler comes into play.
The function will retrieve, for all the accounts, the mail created since the last run, and upload the datas to anyFetch.

# How to test?
Unfortunately, testing this module is really hard.
This project is basically a simple bridge between GMail and anyFetch, so testing requires tiptoeing with the network.

Before running the test suite, you'll need to do:

```
> node test-auth.js
```

Follow the link in your browser with your Google Account. You'll be redirected to `localhost` (server is not running, so you'll get an error). Copy-paste the `code` parameter in your shell, then use the returned value as your `GMAIL_TEST_REFRESH_TOKEN` environment variable.

> Warning: a refresh token is only displayed once. If you get it wrong for some reason, you'll need to clear the permission for your app on https://www.google.com/settings/u/1/security

Support: `support@papiel.fr`.

