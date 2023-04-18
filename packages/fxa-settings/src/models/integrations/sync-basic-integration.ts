/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  Integration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

type SyncIntegrationFeatures = IntegrationFeatures & {
  sendChangePasswordNotice: boolean;
};

type SyncIntegrationTypes =
  | IntegrationType.SyncBasic
  | IntegrationType.SyncDesktop;

export function isSyncBasicIntegration(
  integration: Integration
): integration is SyncBasicIntegration {
  return integration.type === IntegrationType.SyncBasic;
}

/**
 * This integration offers very basic Sync page support _without_ browser communication
 * via webchannels. Currently it is only used 1) when a user is on a verification page
 * through Sync in a different browser, and 2) as a base class for desktop Sync support,
 * which has webchannel support.
 */
export class SyncBasicIntegration extends BaseIntegration {
  protected integrationFeatures: SyncIntegrationFeatures;

  constructor(
    type: SyncIntegrationTypes = IntegrationType.SyncBasic,
    features: Partial<SyncIntegrationFeatures> = {}
  ) {
    super(type);
    this.integrationFeatures = {
      ...super.features,
      sendChangePasswordNotice: false,
      syncOptional: this.isSyncOptional(),
      ...features,
    };
  }

  get features(): SyncIntegrationFeatures {
    return this.integrationFeatures;
  }

  private isSyncOptional(): boolean {
    // TODO: check if multiService + service not being sync
    return false;
  }
}
