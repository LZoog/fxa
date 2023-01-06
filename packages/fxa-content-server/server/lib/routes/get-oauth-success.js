/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const {
  getOAuthSuccessRouteDefinition,
} = require('./react-app/route-definitions');

/** @type {import("./react-app/types").GetBackboneRouteDefinition} */
module.exports = function ({ oauthRoutes }) {
  if (oauthRoutes.featureFlagOn) {
    return null;
  } else {
    return getOAuthSuccessRouteDefinition('/oauth/success/:clientId');
  }
};
