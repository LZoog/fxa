/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { ReactGroupRoute } = require('./route-definitions');

/* When you're ready to serve the React version of a page, identify which feature flag group
 * object it should go in, and add a new object in `routes` by calling a helper method on
 * the route class. To determine which helper method to call, which will give you the
 * corresponding route `definition`, find which `lib/routes` file your route is
 * listed in, e.g. `get-frontend.js` which is where most routes will be, to determine which
 * function to use or create to get the definition, e.g. `get-frontend` corresponds with
 * `route.getFrontEnd`. */
/**
 *  @type {import("./types").GetReactRouteGroups}
 *  @returns {import("./types").ReactRouteGroups}
 */
const getReactRouteGroups = (showReactApp, isServer = true) => {
  const route = new ReactGroupRoute(isServer);

  return {
    simpleRoutes: {
      featureFlagOn: showReactApp.simpleRoutes,
      routes: [route.getFrontEnd('cannot_create_account')],
    },

    resetPasswordRoutes: {
      featureFlagOn: showReactApp.resetPasswordRoutes,
      routes: [],
    },

    oauthRoutes: {
      featureFlagOn: showReactApp.oauthRoutes,
      routes: [route.getOAuthSuccess('oauth/success/:clientId')],
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
