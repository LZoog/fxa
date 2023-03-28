/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  Integration,
  OAuthRedirectIntegration,
} from '../../models/integrations/base-integration';
import { ModelDataStore, UrlQueryData } from '../model-data';
import { ReachRouterWindow } from '../window';
import { DefaultIntegrationFlags } from './integration-factory-flags';
import { IntegrationFlags } from './interfaces/integration-flags';

export class IntegrationFactory {
  protected readonly data: ModelDataStore;
  public readonly flags: IntegrationFlags;

  constructor(opts: {
    data?: ModelDataStore;
    flags?: IntegrationFlags;
    window: ReachRouterWindow;
  }) {
    const { window } = opts;
    this.data = opts.data || new UrlQueryData(window);
    this.flags =
      opts.flags || new DefaultIntegrationFlags(new UrlQueryData(window));
  }

  /**
   * Produces an integration object given the current data store's state.
   * @returns An integration implementation.
   */
  getIntegration() {
    const data = this.data;
    const flags = this.flags;

    let integration: Integration | undefined;

    if (flags.isOAuth()) {
      integration = this.createOAuthIntegration(data);
    } else {
      // TODO, port over `_getVerificationContext` and `_getContext` from app-start
    }

    // Run final validation. This will ensure that the all fields decorated with an @bind are in the
    // the correct state.
    // Commenting this out so that pages will stop erroring out when we don't have sufficient query params.
    // This might be a TODO to restore this once we have all the data we need in the React app.
    // integration?.validate();

    return integration;
  }

  private createOAuthIntegration(data: ModelDataStore) {
    const flags = this.flags;

    // TODO: pairing integrations
    // if (flags.isDevicePairingAsAuthority()) {
    //   return new PairingAuthorityIntegration(data);
    // }
    // if (flags.isOAuthWebChannel() && flags.isDevicePairingAsSupplicant()) {
    //   return new PairingWebChannelSupplicantIntegration(data);
    // }
    // if (flags.isDevicePairingAsSupplicant()) {
    //   return new PairingSupplicantIntegration(data);
    // }
    if (flags.isOAuthWebChannel()) {
      return new OAuthWebChannelIntegration(data);
    }

    // TODO: do we still need this? Can't find anything about Chrome for Android disabling
    // redirects and forcing a user action instead unless users manually turn it off
    // if (flags.isChromeAndroid()) {
    //   return new ChromeAndroidIntegration(data);
    // }

    return new OAuthRedirectIntegration(data);
  }
}
