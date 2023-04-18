/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { StorageData } from '../../lib/model-data';
import { IntegrationType } from './base-integration';
import { OAuthIntegration, SearchParam } from './oauth-integration';

// TODO!
export class PairingSupplicantIntegration extends OAuthIntegration {
  constructor(storageData: StorageData, searchParam: SearchParam) {
    super(storageData, searchParam, IntegrationType.PairingSupplicant);
  }
}
