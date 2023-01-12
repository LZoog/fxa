/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const {
  getOAuthSuccessRouteDefinition,
} = require('./react-app/route-definitions');

const OAUTH_SUCCESS_ROUTES = ['/oauth/success/:clientId'];

/** @type {import("./react-app/types").GetBackboneRouteDefinition} */
function getOAuthSuccessRoutes(
  { oauthRoutes },
  routeNames = OAUTH_SUCCESS_ROUTES
) {
  if (oauthRoutes.featureFlagOn) {
    return null;
  } else {
    return getOAuthSuccessRouteDefinition('/oauth/success/:clientId');
  }
}

module.exports = {
  default: getOAuthSuccessRoutes,
  OAUTH_SUCCESS_ROUTES,
};
