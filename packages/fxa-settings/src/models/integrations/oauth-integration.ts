/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

type OAuthIntegrationFeatures = IntegrationFeatures & {
  channelSupport: boolean;
};

type OAuthIntegrationTypes =
  | IntegrationType.OAuth
  | IntegrationType.PairingSupplicant;

export class OAuthIntegration extends BaseIntegration {
  protected integrationFeatures: OAuthIntegrationFeatures;

  constructor(type: OAuthIntegrationTypes = IntegrationType.OAuth) {
    super(type);
    this.integrationFeatures = {
      ...super.features,
      handleSignedInNotification: false,
      reuseExistingSession: true,
      channelSupport: this.hasChannelSupport(),
    };
  }

  get features(): OAuthIntegrationFeatures {
    return this.integrationFeatures;
  }

  private hasChannelSupport(): boolean {
    // TODO: check for this._searchParam('context') === Constants.OAUTH_WEBCHANNEL_CONTEXT (`oauth_webchannel_v1`)
    return false;
  }
}
