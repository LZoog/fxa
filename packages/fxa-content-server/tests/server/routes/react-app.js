/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {
  getRoutesExcludingAllReact,
} = require('../../../server/lib/routes/get-frontend');
const {
  getRoutesExcludingPairingReact,
} = require('../../../server/lib/routes/get-frontend-pairing');
const { getReactRouteGroups } = require('../../../server/lib/routes/react-app');
const {
  ReactGroupRoute,
} = require('../../../server/lib/routes/react-app/route-definitions');

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
    // 'route definitions from ReactGroupRoute methods match': function () {
    //   for (const routeGroup in reactRouteGroups) {
    //     routeGroup.routes.forEach((route) => {
    //       // route.name
    //     });
    //   }
    // },
    ReactGroupRoute: {
      'getRoute returns expected value': function () {
        const reactRoute = new ReactGroupRoute();
        const result = reactRoute.getRoute('cannot_create_account');
        console.log('RESULT!', result);
      },
      'route definitions are omitted if option is passed': function () {
        const reactRoute = new ReactGroupRoute(false);
        const result = reactRoute.getRoute('cannot_create_account');
        console.log('RESULT!', result);
      },
    },
    'get-frontend': {
      before: function () {
        routeName = ['cannot_create_account'];
      },
      'excludes route present in React route group with feature flag on':
        function () {
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
    },
    'get-frontend-pairing': {
      before: function () {
        routeName = ['pair/auth/allow'];
      },
      'excludes route present in React route group with feature flag on':
        function () {
          const routesWithExclusion = getRoutesExcludingPairingReact(
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

          const routesWithExclusion = getRoutesExcludingPairingReact(
            reactRouteGroups,
            routeName
          );
          assert.includeMembers(routesWithExclusion, routeName);
        },
      'does not exclude route if not present in React route group with feature flag on':
        function () {
          const modifiedReactRouteGroups = { ...reactRouteGroups };
          modifiedReactRouteGroups.pairingRoutes.routes = [];

          const routesWithExclusion = getRoutesExcludingPairingReact(
            modifiedReactRouteGroups,
            routeName
          );
          assert.includeMembers(routesWithExclusion, routeName);
        },
    },
    'get-oauth': {
      before: function () {
        routeName = ['pair/auth/allow'];
      },
      'excludes route present in React route group with feature flag on':
        function () {
          const routesWithExclusion = getRoutesExcludingPairingReact(
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

          const routesWithExclusion = getRoutesExcludingPairingReact(
            reactRouteGroups,
            routeName
          );
          assert.includeMembers(routesWithExclusion, routeName);
        },
      'does not exclude route if not present in React route group with feature flag on':
        function () {
          const modifiedReactRouteGroups = { ...reactRouteGroups };
          modifiedReactRouteGroups.pairingRoutes.routes = [];

          const routesWithExclusion = getRoutesExcludingPairingReact(
            modifiedReactRouteGroups,
            routeName
          );
          assert.includeMembers(routesWithExclusion, routeName);
        },
    },
  },
});
