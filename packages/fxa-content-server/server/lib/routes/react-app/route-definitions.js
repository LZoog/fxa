/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { FRONTEND_ROUTES } = require('../get-frontend');
const { PAIRING_ROUTES } = require('../get-frontend-pairing');
const { OAUTH_SUCCESS_ROUTES } = require('../get-oauth-success');

/**
 * Returns a route object with the `name` of the route and the route `definition`
 * if used on the server-side.
 */
class ReactGroupRoute {
  /** @param {Boolean} isServer Is access coming from the server? The client
   * doesn't need route definitions. */
  constructor(isServer) {
    this.isServer = isServer;
  }

  getRoute(name) {
    if (FRONTEND_ROUTES.includes(name)) {
      return this.getFrontEnd(name);
    }
    if (PAIRING_ROUTES.includes(name)) {
      return this.getFrontEndPairing(name);
    }
    if (OAUTH_SUCCESS_ROUTES.includes(name)) {
      return this.getOAuthSuccess(name);
    }
    throw new Error(
      `"${name}" was not found in any existing content-server routes. If this is not a typo, the route might need to be accounted for in "server/lib/routes/react-app/".`
    );
  }

  /**
   * @type {import("./types").GetRoute}
   * @private
   * */
  getRouteObject(name, definition) {
    return {
      name,
      ...(this.isServer && { definition }),
    };
  }

  /** @private */
  getFrontEnd(name) {
    return this.getRouteObject(name, getFrontEndRouteDefinition([name]));
  }

  /** @private */
  getFrontEndPairing(name) {
    return this.getRouteObject(name, getFrontEndPairingRouteDefinition([name]));
  }

  /** @private */
  getOAuthSuccess(name) {
    return this.getRouteObject(name, getOAuthSuccessRouteDefinition(name));
  }
}

/** @type {import("./types").GetRouteDefinition} */
function getFrontEndRouteDefinition(routes) {
  const path = routes.join('|'); // prepare for use in a RegExp
  return {
    method: 'get',
    path: new RegExp('^/(' + path + ')/?$'),
    process: function (req, res, next) {
      // setting the url to / will use the correct
      // index.html for either dev or prod mode.
      req.url = '/';
      next();
    },
  };
}

/** @type {import("./types").GetRouteDefinition} */
function getFrontEndPairingRouteDefinition(routes) {
  const path = routes.join('|'); // prepare for use in a RegExp
  return {
    method: 'get',
    path: new RegExp('^/(' + path + ')/?$'),
    process: function (req, res) {
      res.redirect(302, '/pair/failure');
    },
  };
}

/** @type {import("./types").GetRouteDefinitionSingle} */
function getOAuthSuccessRouteDefinition(path) {
  return {
    method: 'get',
    path,
    process: function (req, res, next) {
      req.url = '/';
      next();
    },
  };
}

module.exports = {
  ReactGroupRoute,
  getFrontEndRouteDefinition,
  getFrontEndPairingRouteDefinition,
  getOAuthSuccessRouteDefinition,
};
