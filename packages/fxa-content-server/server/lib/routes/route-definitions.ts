/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express from 'express';
import { RouteDefinition } from 'fxa-shared/express/routing';

export function getFrontEndRouteDefinitions(routes: string[]): RouteDefinition {
  const path = routes.join('|'); // prepare for use in a RegExp
  return {
    method: 'get',
    path: new RegExp('^/(' + path + ')/?$'),
    process: function (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) {
      // setting the url to / will use the correct
      // index.html for either dev or prod mode.
      req.url = '/';
      next();
    },
  };
}
