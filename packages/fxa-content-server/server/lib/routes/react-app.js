/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const config = require('../configuration');
const { getFrontEndRouteDefinitions } = require('./route-definitions');

const simpleRoutes = {
  featureFlagOn: config.get('showReactApp.simpleRoutes'),
  routes: [
    // add route name here when we're ready to serve the React version of a page
    {
      name: 'cannot_create_account',
      definition: getFrontEndRouteDefinitions(['cannot_create_account']),
    },
  ],
  // add other get route definition functions here when this.routes contains a newly added
  // route that's in a content-server routes list outside of what's already included here
  // getRouteDefinitionFns: [getFrontEndRouteDefinitions],
};

module.exports = {
  simpleRoutes,
};
