/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { FRONTEND_ROUTES } = require('../get-frontend');
const { PAIRING_ROUTES } = require('../get-frontend-pairing');
const { OAUTH_SUCCESS_ROUTES } = require('../get-oauth-success');
const { TERMS_PRIVACY_REGEX } = require('../get-terms-privacy');

/**
 */
const reactRouteClient = {
  /** @param {String|RegExp} name */
  getRoute(name) {
    if (
      typeof name === 'string' &&
      (FRONTEND_ROUTES.includes(name) ||
        PAIRING_ROUTES.includes(name) ||
        OAUTH_SUCCESS_ROUTES.includes(name))
    ) {
      return name;
    }
    // When using a regex, explicitly return matched routes from router.js
    if (name instanceof RegExp && TERMS_PRIVACY_REGEX.test(name)) {
      return ['legal/privacy', 'legal/terms'];
    }

    throw new Error(
      `"${name}" was not found in any existing content-server routes. Check for typos and path slash mismatches. Otherwise, the route might need to be accounted for in "server/lib/routes/react-app/".`
    );
  },

  /** @param {Array<String|RegExp>} names */
  getRoutes(names) {
    const routes = [];
    for (const name of names) {
      const match = this.getRoute(name);
      if (Array.isArray(match)) {
        routes.push(...match);
      } else {
        routes.push(match);
      }
    }
    return routes;
  },
};

module.exports = {
  reactRouteClient,
};
