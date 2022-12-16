/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import config from '../configuration';
import { getFrontEndRouteDefinitions } from './route-definitions';
import { Express, RequestHandler } from 'express';
import { RouteDefinition } from 'fxa-shared/express/routing';

interface RouteFeatureFlagGroup {
  featureFlagOn: boolean;
  routes: {
    name: string;
    definition: RouteDefinition;
  }[];
}

const simpleRoutes: RouteFeatureFlagGroup = {
  featureFlagOn: config.get('showReactApp.simpleRoutes'),
  routes: [
    /* When you're ready to serve the React version of a "simpleRoute", add a new object here
     * with the route name and definition. Definitions come from route files in `lib/routes/` -
     * you need to find which file your new route exists in to determine which definition
     * the route needs.
     * TODO: Create other get[Descriptor]RouteDefinition functions, FXA-TBD */
    {
      name: 'cannot_create_account',
      definition: getFrontEndRouteDefinitions(['cannot_create_account']),
    },
  ],
};

function addReactRoutesConditionally(
  app: Express,
  routeHelpers: any,
  middleware: RequestHandler,
  { featureFlagOn, routes }: RouteFeatureFlagGroup
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

function addSimpleRoutes(
  app: Express,
  routeHelpers: any,
  middleware: RequestHandler
) {
  addReactRoutesConditionally(app, routeHelpers, middleware, simpleRoutes);
}

function addAllReactRoutesConditionally(
  app: Express,
  routeHelpers: any,
  middleware: RequestHandler // 'createSettingsProxy' in dev, else 'modifySettingsStatic'
) {
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
