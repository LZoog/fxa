/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Integration, IntegrationType } from './base-integration';
import { SyncBasicIntegration } from './sync-basic-integration';

export function isSyncDesktopIntegration(
  integration: Integration
): integration is SyncDesktopIntegration {
  return integration.type === IntegrationType.SyncDesktop;
}

export class SyncDesktopIntegration extends SyncBasicIntegration {
  constructor() {
    super(IntegrationType.SyncDesktop);
    this.integrationFeatures = {
      ...super.features,
      allowUidChange: true,
    };
  }
}
