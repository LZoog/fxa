/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const { pairRoutes } = require('./react-app');
const {
  getFrontEndPairingRouteDefinition,
} = require('./react-app/route-definitions');

// This route handler prevents REFRESH behaviour for the pairing flow
// If the user refreshes the browser during pairing, we instruct them to start over

module.exports = function () {
  // The array is converted into a RegExp
  const PAIRING_ROUTES = [
    'pair/auth/allow',
    'pair/auth/complete',
    'pair/auth/totp',
    'pair/auth/wait_for_supp',
    'pair/supp/allow',
    'pair/supp/wait_for_auth',
  ];

  /* Remove route from list if feature flag is set to true and route is included in
   * relevant feature flag groups. Route definitions for the excluded routes are created
   * separately in `fxa-content-server.js`. */
  const PAIRING_ROUTES_EXCLUDE_REACT = pairRoutes.featureFlagOn
    ? PAIRING_ROUTES.filter(
        (routeName) =>
          !pairRoutes.routes.find((route) => routeName === route.name)
      )
    : PAIRING_ROUTES;

  return getFrontEndPairingRouteDefinition(PAIRING_ROUTES_EXCLUDE_REACT);
};
