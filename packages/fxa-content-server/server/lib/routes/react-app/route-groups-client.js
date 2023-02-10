/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { reactRouteClient } = require('./react-route-client');
const { getReactRouteGroups } = require('.');

/**
 * When you're ready to serve the React version of a page, identify which feature flag
 * group object it should go in and add a new object in `routes` by calling `.getRoute`
 * or setting `routes` with `.getRoutes` on the react route class. See tests for examples.
 *
 * When setting a regex, the corresponding matches for `router.js` must be set in
 * `react-route-client.js`.
 *  @type {import("./types").GetReactRouteGroups}
 */
const getClientReactRouteGroups = (showReactApp) => {
  return getReactRouteGroups(showReactApp, reactRouteClient);
};

module.exports = {
  getClientReactRouteGroups,
};
