/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  IntegrationFeatures,
  IntegrationType,
} from './base-integration';

export type SyncIntegrationFeatures = IntegrationFeatures & {
  sendChangePasswordNotice: boolean;
};

export class BaseSyncIntegration extends BaseIntegration {
  protected integrationFeatures: SyncIntegrationFeatures;

  constructor(
    type: IntegrationType = IntegrationType.Sync,
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

  private isSyncOptional(): boolean {
    // TODO: check if multiService + service not being sync
    return false;
  }

  get features(): SyncIntegrationFeatures {
    return this.integrationFeatures;
  }
}
