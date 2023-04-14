/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  OAuthIntegration,
  PairingAuthorityIntegration,
  PairingSupplicantIntegration,
  SyncBasicIntegration,
  SyncDesktopIntegration,
  WebIntegration,
} from '../../models';
import { Integration } from '../../models/integrations/base-integration';
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

  private chooseIntegration() {}

  /**
   * Produces an integration object given the current data store's state.
   * @returns An integration implementation.
   */
  getIntegration() {
    const data = this.data;
    const flags = this.flags;

    let integration: Integration;

    if (flags.isOAuth()) {
      if (flags.isDevicePairingAsAuthority()) {
        return new PairingAuthorityIntegration();
      }
      if (flags.isDevicePairingAsSupplicant()) {
        return new PairingSupplicantIntegration();
      }
      integration = this.createOAuthIntegration(data);
    } else if (this.isVerification()) {
      integration = this.getVerificationIntegration();

      // must bind this data or... somehow combine with or read from relier.
      // const contextParam = this._searchParam('context');
      // if context is v3desktop, return SyncDesktop
    } else if (this._searchParam('context') === 'fx_desktop_v3') {
      integration = new SyncDesktopIntegration();
    } else {
      integration = new WebIntegration();
    }

    // Run final validation. This will ensure that the all fields decorated with an @bind are in the
    // the correct state.
    // Commenting this out so that pages will stop erroring out when we don't have sufficient query params.
    // This might be a TODO to restore this once we have all the data we need in the React app.
    // integration?.validate();

    return integration;
  }

  private isVerification() {
    // return this._isSignUpVerification() ||
    // this._isPasswordResetVerification() ||
    // this._isReportSignIn()
    // _isSignUpVerification() {
    //   return this._searchParam('code') && this._searchParam('uid');
    // },
    // _isPasswordResetVerification() {
    //   return this._searchParam('code') && this._searchParam('token');
    // },
    // _isReportSignIn() {
    //   return this._window.location.pathname === '/report_signin';
    // },
  }

  private getVerificationIntegration() {
    // If the user verifies in the same browser, use the same context that
    // was used to sign up to allow the verification tab to have the same
    // capabilities as the signup tab.
    // For users that verify in a 2nd browser, choose the most appropriate
    // broker based on the service to allow the verification tab to have
    // service specific behaviors and messaging. For Sync, use the generic
    // Sync broker, for OAuth, use the OAuth broker.
    // If no service is specified and the user is verifies in a 2nd browser,
    // then fall back to the default content server context.
    const sameBrowserVerificationContext =
      this._getSameBrowserVerificationModel('context').get('context');
    if (sameBrowserVerificationContext) {
      // user is verifying in the same browser, use the same context they signed up with.
      return sameBrowserVerificationContext;
    } else if (this._isServiceSync()) {
      // user is verifying in a different browser.
      return new SyncBasicIntegration();
    } else if (this._isServiceOAuth()) {
      // oauth, user is verifying in a different browser.
      return new OAuthIntegration();
    }
    return new WebIntegration();
  }

  private createOAuthIntegration(data: ModelDataStore) {
    const flags = this.flags;

    if (flags.isDevicePairingAsAuthority()) {
      return new PairingAuthorityIntegration();
    }
    if (flags.isDevicePairingAsSupplicant()) {
      return new PairingSupplicantIntegration();
    }

    // if (flags.isOAuthWebChannel() && flags.isDevicePairingAsSupplicant()) {
    //   return new PairingWebChannelSupplicantIntegration();
    // }

    // if (flags.isDevicePairingAsSupplicant()) {
    //   return new PairingSupplicantIntegration(data);
    // }
    // if (flags.isOAuthWebChannel()) {
    //   return new OAuthIntegration();
    // }

    // TODO: do we still need this? Can't find anything about Chrome for Android disabling
    // redirects and forcing a user action instead unless users manually turn it off
    // if (flags.isChromeAndroid()) {
    //   return new ChromeAndroidIntegration(data);
    // }

    return new OAuthIntegration();
  }
}
