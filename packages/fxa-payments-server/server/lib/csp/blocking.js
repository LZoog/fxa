/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Middleware to take care of CSP. CSP headers are not sent unless config
// option 'csp.enabled' is set (default true in development), with a special
// exception for the /tests/index.html path, which are the frontend unit
// tests.

const url = require("url");

function getOrigin(link) {
  const parsed = url.parse(link);
  return parsed.protocol + "//" + parsed.host;
}

/**
 * blockingCspMiddleware is where to declare rules that will cause a resource
 * to be blocked if it runs afowl of a rule.
 */
module.exports = function(config) {
  const AUTH_SERVER = getOrigin(config.get("servers.auth.url"));
  const BLOB = "blob:";
  const CDN_URL = config.get("staticResources.url");
  const DATA = "data:";
  const GRAVATAR = "https://secure.gravatar.com";
  const OAUTH_SERVER = getOrigin(config.get("servers.oauth.url"));
  const PROFILE_SERVER = getOrigin(config.get("servers.profile.url"));

  // Do we need this? The content server config has this but the payments
  // server does not, and hits the profile server instead, yet I still see `:1112`
  // hit (images server defined in content server config)
  const PROFILE_IMAGES_SERVER = getOrigin(
    config.get("servers.profileImages.url")
  );

  const PUBLIC_URL = config.get("listen.publicUrl");

  //
  // Double quoted values
  //
  const NONE = "'none'";
  // keyword sources - https://www.w3.org/TR/CSP2/#keyword_source
  // Note: "'unsafe-inline'" and "'unsafe-eval'" are not used in this module.
  const SELF = "'self'";

  function addCdnRuleIfRequired(target) {
    if (CDN_URL !== PUBLIC_URL) {
      target.push(CDN_URL);
    }

    return target;
  }

  const rules = {
    // TO DO: add https://stripe.com/docs/security#content-security-policy
    directives: {
      connectSrc: [SELF, AUTH_SERVER, OAUTH_SERVER, PROFILE_SERVER],
      defaultSrc: [SELF],
      fontSrc: addCdnRuleIfRequired([SELF]),
      imgSrc: addCdnRuleIfRequired([
        SELF,
        DATA,
        // Gravatar support was removed in #4927, but we don't want
        // to break the site for users who already use a Gravatar as
        // their profile image.
        GRAVATAR,
        PROFILE_IMAGES_SERVER
      ]),
      mediaSrc: [BLOB],
      objectSrc: [NONE],
      reportUri: config.get("csp.reportUri"),
      scriptSrc: addCdnRuleIfRequired([SELF]),
      styleSrc: addCdnRuleIfRequired([SELF])
    },
    reportOnly: false,
    // Sources are exported for unit tests
    Sources: {
      //eslint-disable-line sorting/sort-object-props
      AUTH_SERVER,
      BLOB,
      CDN_URL,
      DATA,
      GRAVATAR,
      NONE,
      OAUTH_SERVER,
      PROFILE_IMAGES_SERVER,
      PROFILE_SERVER,
      PUBLIC_URL,
      SELF
    }
  };

  return rules;
};