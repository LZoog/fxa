/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

  /** @type {import("./types").GetRoute} */
  getFrontEnd(name) {
    return {
      name,
      ...(this.isServer && { definition: getFrontEndRouteDefinition([name]) }),
    };
  }

  /** @type {import("./types").GetRoute} */
  getFrontEndPairing(name) {
    return {
      name,
      ...(this.isServer && {
        definition: getFrontEndPairingRouteDefinition([name]),
      }),
    };
  }

  /** @type {import("./types").GetRoute} */
  getOAuthSuccess(name) {
    return {
      name,
      ...(this.isServer && {
        definition: getOAuthSuccessRouteDefinition([name]),
      }),
    };
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

/** @type {import("./types").GetRouteDefinition} */
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
