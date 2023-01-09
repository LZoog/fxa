/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TS setup for anything outside of `app/` is complex. This file defines types we
// import for JSDoc instead.

import {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { RouteDefinition } from 'fxa-shared/express/routing';

export interface ReactRouteGroup {
  featureFlagOn: boolean;
  routes: {
    name: string;
    definition: RouteDefinition;
  }[];
}

export interface GetRouteDefinition {
  (routes: string[]): RouteDefinition;
}

export interface RouteHelpers {
  addRoute: (routeDefinition: RouteDefinition) => void;
  validationErrorHandler: (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => void;
}

export interface AddRoutes {
  (app: Express, routeHelpers: RouteHelpers, middleware: RequestHandler): void;
}

export interface ReactRouteGroups {
  [key: string]: ReactRouteGroup;
}
