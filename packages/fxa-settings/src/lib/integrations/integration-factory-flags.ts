/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DefaultRelierFlags } from '../reliers';

/**
 * Extrapolates flags from the state of the current data store. The collective state of these flags are used by
 * the factory to determine what underlying type of integration to create.
 *
 * Note: this logic was ported from fxa-content-server app-start.js.
 */

// TODO: Extending from Relier flags is temporary.
// In a follow up we will combine integrations with reliers, or clean this up.
export class DefaultIntegrationFlags extends DefaultRelierFlags {}
