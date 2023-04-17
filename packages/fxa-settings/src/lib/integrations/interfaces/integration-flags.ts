/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RelierFlags } from '../../reliers';

/**
 * Creation flags interface, controls the type of integration that is ultimately produced.
 */

// TODO: Extending from Relier flags is temporary.
// In a follow up we will combine integrations with reliers, or clean this up.
export interface IntegrationFlags extends RelierFlags {
  isVerification(): boolean;
}
