/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

export class OAuthRedirectIntegration extends BaseIntegration {
  constructor() {
    super(IntegrationType.OAuthRedirect);
  }

  get features(): IntegrationFeatures {
    return {
      ...super.features,
      handleSignedInNotification: false,
      reuseExistingSession: true,
    };
  }
}
