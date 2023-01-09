/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('../../configuration');
const { getFrontEndRouteDefinition } = require('./route-definitions');

/* When you're ready to serve the React version of a page, identify which feature flag group
 * object it should go in, and add a new object in `routes` with the route name and definition.
 * To determine which route definition is needed, find which `lib/routes` file your route is
 * listed in, e.g. `get-frontend.js` which is where most routes will be, to determine which
 * function to use or create to get the definition, e.g. `get-frontend` corresponds with
 * `getFrontEndRouteDefitions`. */

/** @type {import("./types").ReactRouteGroups} */
const reactRouteGroups = {
  simpleRoutes: {
    featureFlagOn: config.get('showReactApp.simpleRoutes'),
    routes: [
      {
        name: 'cannot_create_account',
        definition: getFrontEndRouteDefinition(['cannot_create_account']),
      },
    ],
  },

  resetPasswordRoutes: {
    featureFlagOn: config.get('showReactApp.resetPasswordRoutes'),
    routes: [],
  },

  oauthRoutes: {
    featureFlagOn: config.get('showReactApp.oauthRoutes'),
    routes: [],
  },

  signInRoutes: {
    featureFlagOn: config.get('showReactApp.signInRoutes'),
    routes: [],
  },

  signUpRoutes: {
    featureFlagOn: config.get('showReactApp.signUpRoutes'),
    routes: [],
  },

  pairRoutes: {
    featureFlagOn: config.get('showReactApp.pairRoutes'),
    routes: [],
  },

  postVerifyAddRecoveryKeyRoutes: {
    featureFlagOn: config.get('showReactApp.postVerifyAddRecoveryKeyRoutes'),
    routes: [],
  },

  postVerifyCADViaQRRoutes: {
    featureFlagOn: config.get('showReactApp.postVerifyCADViaQRRoutes'),
    routes: [],
  },

  signInVerificationViaPushRoutes: {
    featureFlagOn: config.get('showReactApp.signInVerificationViaPushRoutes'),
    routes: [],
  },
};

/** Add all routes routes from all route objects for fxa-settings or fxa-content-server to serve.
 * @type {import("./types").AddRoutes}
 */
function addAllReactRoutesConditionally(app, routeHelpers, middleware) {
  /** Check if the feature flag passed in is `true` and the request contains `?showReactApp=true`.
   * If true, use the middleware passed ('createSettingsProxy' in dev, else 'modifySettingsStatic')
   * for that route, allowing `fxa-settings` to serve the page. If false, skip the middleware and
   * use the default routing middleware from `fxa-shared/express/routing.ts`.
   * @param {import("./types").ReactRouteGroup}
   */
  function addReactRoutesConditionally({ featureFlagOn, routes }) {
    if (featureFlagOn === true) {
      routes.forEach(({ definition }) => {
        // possible TODO - `definition.method`s will either be 'get' or 'post'. Not sure if we need
        // this for any 'post' requests but shouldn't hurt anything; 'get' alone may suffice.
        app[definition.method](definition.path, (req, res, next) => {
          if (req.query.showReactApp === 'true') {
            return middleware(req, res, next);
          } else {
            next('route');
          }
        });
        // Manually add route for content-server to serve; occurs when above next('route'); is called
        routeHelpers.addRoute(definition);
      });
    }
  }

  for (const routeGroup in reactRouteGroups) {
    addReactRoutesConditionally(reactRouteGroups[routeGroup]);
  }
}

module.exports = {
  reactRouteGroups,
  addAllReactRoutesConditionally,
};
