/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

export class OAuthWebChannelIntegration extends BaseIntegration {
  constructor() {
    super(IntegrationType.OAuthWebChannel);
  }

  get features(): IntegrationFeatures {
    return {
      ...super.features,
      handleSignedInNotification: false,
    };
  }
}
