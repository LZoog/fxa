/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Constants } from '../../lib/constants';
import { IntegrationFlags } from '../../lib/integrations/interfaces/integration-flags';

import {
  BaseIntegration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

type OAuthIntegrationFeatures = IntegrationFeatures & {
  webChannelSupport: boolean;
};

type OAuthIntegrationTypes =
  | IntegrationType.OAuth
  | IntegrationType.PairingSupplicant;

export type SearchParam = IntegrationFlags['searchParam'];

export class OAuthIntegration extends BaseIntegration {
  protected integrationFeatures: OAuthIntegrationFeatures;
  private searchParam: SearchParam;

  constructor(
    searchParam: SearchParam,
    type: OAuthIntegrationTypes = IntegrationType.OAuth
  ) {
    super(type);
    this.searchParam = searchParam;
    this.integrationFeatures = {
      ...super.features,
      handleSignedInNotification: false,
      reuseExistingSession: true,
      webChannelSupport: this.hasWebChannelSupport(),
    };
  }

  get features(): OAuthIntegrationFeatures {
    return this.integrationFeatures;
  }

  private hasWebChannelSupport() {
    return this.searchParam('context') === Constants.OAUTH_WEBCHANNEL_CONTEXT;
  }
}
