/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { ReactRouteServer } = require('./react-route');
const { reactRouteClient } = require('./react-route-client');

/**
 * When you're ready to serve the React version of a page, identify which feature flag
 * group object it should go in and add a new object in `routes` by calling `.getRoute`
 * or setting `routes` with `.getRoutes` on the react route class. See tests for examples.
 *
 * When setting a regex, the corresponding matches for `router.js` must be set in
 * `react-route-client.js`.
 *  @type {import("./types").GetReactRouteGroups}
 */
const getReactRouteGroups = (showReactApp, i18n) => {
  // const reactRoute = new ReactRoute(i18n);

  const reactRoute = !!i18n ? new ReactRouteServer(i18n) : reactRouteClient;

  return {
    simpleRoutes: {
      featureFlagOn: showReactApp.simpleRoutes,
      routes: reactRoute.getRoutes([
        'cannot_create_account',
        'clear',
        'cookies_disabled',
        'legal',
        // Match (allow for optional trailing slash):
        // * /legal/terms
        // * /<locale>/legal/terms
        // * /legal/privacy
        // * /<locale>/legal/privacy
        /^\/(?:([a-zA-Z-\_]*)\/)?legal\/(terms|privacy)(?:\/)?$/,
      ]),
    },

    resetPasswordRoutes: {
      featureFlagOn: showReactApp.resetPasswordRoutes,
      routes: reactRoute.getRoutes(['reset_password']),
    },

    oauthRoutes: {
      featureFlagOn: showReactApp.oauthRoutes,
      routes: [],
    },

    signInRoutes: {
      featureFlagOn: showReactApp.signInRoutes,
      routes: [],
    },

    signUpRoutes: {
      featureFlagOn: showReactApp.signUpRoutes,
      routes: [],
    },

    pairRoutes: {
      featureFlagOn: showReactApp.pairRoutes,
      routes: [],
    },

    postVerifyAddRecoveryKeyRoutes: {
      featureFlagOn: showReactApp.postVerifyAddRecoveryKeyRoutes,
      routes: [],
    },

    postVerifyCADViaQRRoutes: {
      featureFlagOn: showReactApp.postVerifyCADViaQRRoutes,
      routes: [],
    },

    signInVerificationViaPushRoutes: {
      featureFlagOn: showReactApp.signInVerificationViaPushRoutes,
      routes: [],
    },
  };
};

module.exports = {
  getReactRouteGroups,
};
