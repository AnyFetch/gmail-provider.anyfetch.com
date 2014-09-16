# GMail AnyFetch Provider
> Visit http://anyfetch.com for details about AnyFetch.

AnyFetch provider for mails stored in Gmail

# How to install?
Clone the repo, then `npm install`.
Create a `keys.sh` file on the directory root:

You'll need to define some environment variables

```sh
# Go to https://code.google.com/apis/console/b/0/?pli=1#access to ask from app id and secret
export GMAIL_API_ID="gmail-app-id"
export GMAIL_API_SECRET="gmail-app-secret"

# Your provider URL, most probably http://your-host
export PROVIDER_URL="url-for-callback"

# AnyFetch app id and secret
export ANYFETCH_API_ID="anyfetch-app-id"
export ANYFETCH_API_SECRET="anyfetch-app-secret"

# See below for details
export GMAIL_TEST_REFRESH_TOKEN="see-below"
export GMAIL_TEST_ACCOUNT_NAME="see-below"
```

# How does it works?
AnyFetch Core will call `/init/connect` with anyfetch Oauth-tokens. The user will be transparently redirected to Google consentment page.
Google will then call us back on `/init/callback` with a `code` parameter. We'll trade the `code` for an `access_token` and a `refresh_token` and store it in the database, along with the AnyFetch tokens.

We can now sync data between Google and AnyFetch.

This is where the `upload` handler comes into play.
The function will retrieve, for all the accounts, the mail created since the last run, and upload the data to AnyFetch.

# How to test?
Unfortunately, testing this module is really hard.
This project is basically a simple bridge between Google and AnyFetch, so testing requires tiptoeing with the network.

Before running the test suite, you'll need to do:

```
> node test-auth.js
```

Follow the link in your browser with your Google Account. You'll be redirected to `localhost` (server is not running, so you'll get an error). Copy-paste the `code` parameter in your shell, then use the returned value as your `GMAIL_TEST_REFRESH_TOKEN` environment variable.

> Warning: a refresh token is only displayed once. If you get it wrong for some reason, you'll need to clear the permission for your app on https://www.google.com/settings/u/1/security

Support: `support@anyfetch.com`.

