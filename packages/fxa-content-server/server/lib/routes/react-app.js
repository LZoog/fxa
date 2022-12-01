/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const config = require('../configuration');
const { getFrontEndRouteDefinitions } = require('./route-definitions');

const simpleRoutes = {
  featureFlagOn: config.get('showReactApp.simpleRoutes'),
  routes: [
    // When you're ready to serve the React version of a "simpleRoute", add a new object here
    // with the route name and definition. Definitions come from route files in `lib/routes/` -
    // you need to find which file your new route exists in to determine which definition
    // the route needs. You may need to create and extract out the route definition function
    // from the file if it hasn't been done already.
    {
      name: 'cannot_create_account',
      definition: getFrontEndRouteDefinitions(['cannot_create_account']),
    },
  ],
};

function addReactRoutesConditionally(
  app,
  routeHelpers,
  middleware,
  { featureFlagOn, routes }
) {
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

function addSimpleRoutes(app, routeHelpers, middleware) {
  addReactRoutesConditionally(app, routeHelpers, middleware, simpleRoutes);
}

// middleware: either createSettingsProxy or modifySettingsStatic
function addAllReactRoutesConditionally(app, routeHelpers, middleware) {
  addSimpleRoutes(app, routeHelpers, middleware);
  // add other addRoutes functions here when created
}

// TODO: Add wildcard routes for (I believe) only routes that are nested, like `/pair/*`?
// Or, maybe we don't need this since we're accounting for each route individually
// function addAllReactWildcardRoutesConditionally(
//   app,
//   modifySettingsStatic
// ) {
//   if (simpleRoutes.featureFlagOn === true) {
//     simpleRoutes.routes.forEach((route) => {
//       app.get(`/${route}/*`, (req, res, next) => {
//         if (req.query.showReactApp === 'true') {
//           return modifySettingsStatic(req, res);
//         } else {
//           next('route');
//         }
//       });
//     });
//   }
// }

module.exports = {
  simpleRoutes,
  addAllReactRoutesConditionally,
};
