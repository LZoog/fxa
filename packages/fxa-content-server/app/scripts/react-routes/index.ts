/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// turn off enforcing camelcase in objects since we want it to route match
/* eslint camelcase: 0 */

import { GetReactRouteGroups } from './types';
import { getFrontEndRouteDefinition } from './route-definitions';

/* When you're ready to serve the React version of a page, identify which feature flag group
 * object it should go in, and add a new object in `routes` with the route name and definition.
 * To determine which route definition is needed, find which `lib/routes` file your route is
 * listed in, e.g. `get-frontend.js` which is where most routes will be, to determine which
 * function to use or create to get the definition, e.g. `get-frontend` corresponds with
 * `getFrontEndRouteDefitions`. */

const frontEndRoute = (routeName: string) => ({
  [routeName]: getFrontEndRouteDefinition([routeName]),
});

export const getReactRouteGroups: GetReactRouteGroups = (showReactApp) => ({
  simpleRoutes: {
    featureFlagOn: showReactApp.simpleRoutes,
    routes: {
      ...frontEndRoute('cannot_create_account'),
    },
  },

  resetPasswordRoutes: {
    featureFlagOn: showReactApp.resetPasswordRoutes,
    routes: {},
  },

  oauthRoutes: {
    featureFlagOn: showReactApp.oauthRoutes,
    routes: {},
  },

  signInRoutes: {
    featureFlagOn: showReactApp.signInRoutes,
    routes: {},
  },

  signUpRoutes: {
    featureFlagOn: showReactApp.signUpRoutes,
    routes: {},
  },

  pairRoutes: {
    featureFlagOn: showReactApp.pairRoutes,
    routes: {},
  },

  postVerifyAddRecoveryKeyRoutes: {
    featureFlagOn: showReactApp.postVerifyAddRecoveryKeyRoutes,
    routes: {},
  },

  postVerifyCADViaQRRoutes: {
    featureFlagOn: showReactApp.postVerifyCADViaQRRoutes,
    routes: {},
  },

  signInVerificationViaPushRoutes: {
    featureFlagOn: showReactApp.signInVerificationViaPushRoutes,
    routes: {},
  },
});
