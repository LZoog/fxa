/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {
  getRoutesExcludingAllReact,
  FRONTEND_ROUTES,
} = require('../../../server/lib/routes/get-frontend');
const { getReactRouteGroups } = require('../../../server/lib/routes/react-app');

const { registerSuite } = intern.getInterface('object');
const assert = intern.getPlugin('chai').assert;

const showReactApp = {
  simpleRoutes: true,
  resetPasswordRoutes: true,
  oauthRoutes: true,
  signInRoutes: true,
  signUpRoutes: true,
  pairRoutes: true,
  postVerifyAddRecoveryKeyRoutes: true,
  postVerifyCADViaQRRoutes: true,
  signInVerificationViaPushRoutes: true,
};

let reactRouteGroups = getReactRouteGroups(showReactApp);
let routeName = [''];

registerSuite('routes/react-app', {
  tests: {
    'get-frontend': {
      before: function () {
        routeName = ['cannot_create_account'];
      },
      'excludes route present in React route group with feature flag on':
        function () {
          assert.includeMembers(FRONTEND_ROUTES, routeName);

          const routesWithExclusion = getRoutesExcludingAllReact(
            reactRouteGroups,
            routeName
          );
          assert.notIncludeMembers(routesWithExclusion, routeName);
        },
      'does not exclude route present in React route group with feature flag off':
        function () {
          reactRouteGroups = getReactRouteGroups({
            ...showReactApp,
            simpleRoutes: false,
          });

          const routesWithExclusion = getRoutesExcludingAllReact(
            reactRouteGroups,
            routeName
          );
          assert.includeMembers(routesWithExclusion, routeName);
        },
      'does not exclude route if not present in React route group with feature flag on':
        function () {
          const modifiedReactRouteGroups = { ...reactRouteGroups };
          modifiedReactRouteGroups.simpleRoutes.routes = [];

          const routesWithExclusion = getRoutesExcludingAllReact(
            modifiedReactRouteGroups,
            routeName
          );
          assert.includeMembers(routesWithExclusion, routeName);
        },
      'route definitions from ReactGroupRoute methods match': function () {},
    },
    //   'when route name is present in React route group with feature flag on, it is excluded from:':
    //     {
    //       // before: function () {
    //       //   reactRouteGroups = getReactRouteGroups(showReactApp);
    //       // },
    //       'get-frontend': function () {},
    //       'get-frontend-pairing': function () {},
    //       'get-oauth-success': function () {},
    //     },

    //   'route definitions from ReactGroupRoute methods match:': {
    //     'get-frontend': function () {},
    //     'get-frontend-pairing': function () {},
    //     'get-oauth-success': function () {},
    //   },

    //   'routes definitions from ReactGroupRoute are omitted if option is passed':
    //     function () {
    //       reactRouteGroups = getReactRouteGroups(showReactApp, false);
    //     },
    // },
  },
});
