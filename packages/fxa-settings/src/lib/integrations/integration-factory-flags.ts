/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Constants } from '../constants';
import { UrlQueryData } from '../model-data';
import { IntegrationFlags } from './interfaces/integration-flags';

const DEVICE_PAIRING_SUPPLICANT_PATHNAME_REGEXP = /^\/pair\/supp/;

// TODO: there's a lot of duplication between this + relier factory flags
// We could probably use a relier/integration factory flag shared class.

/**
 * Extrapolates flags from the state of the current data store. The collective state of these flags are used by
 * the factory to determine what underlying type of integration to create.
 *
 * Note: this logic was ported from fxa-content-server app-start.js.
 */
export class DefaultIntegrationFlags implements IntegrationFlags {
  protected get pathname() {
    return this.urlQueryData.pathName;
  }
  constructor(private urlQueryData: UrlQueryData) {}

  // TODO: Same method on the Relier flags, can we DRY?
  isDevicePairingAsAuthority() {
    return (
      this._searchParam('redirect_uri') ===
      Constants.DEVICE_PAIRING_AUTHORITY_REDIRECT_URI
    );
  }

  // TODO: Same method on the Relier flags, can we DRY?
  isDevicePairingAsSupplicant() {
    return DEVICE_PAIRING_SUPPLICANT_PATHNAME_REGEXP.test(this.pathname);
  }

  // TODO: Same method on the Relier flags, can we DRY?
  isOAuth() {
    return (
      !!(
        this._searchParam('client_id') ||
        // verification
        this._isOAuthVerificationSameBrowser()
      ) ||
      !!this._isOAuthVerificationDifferentBrowser() ||
      // any URL with 'oauth' in the path.
      /oauth/.test(this.pathname)
    );
  }

  isOAuthWebChannel() {
    // TODO
    return false;
  }

  isChromeAndroid() {
    // TODO
    return false;
  }

  isSyncService() {
    return this._isService(Constants.SYNC_SERVICE);
  }

  isV3DesktopContext() {
    return this._searchParam('context') === Constants.FX_DESKTOP_V3_CONTEXT;
  }

  isOAuthSuccessFlow() {
    const status = /oauth\/success/.test(this.pathname);

    let clientId = '';
    if (status) {
      const pathname = this.pathname.split('/');
      clientId = pathname[pathname.length - 1];
    }

    return {
      status,
      clientId,
    };
  }

  isOAuthVerificationFlow(): boolean {
    return !!this._searchParam('code');
  }

  // TODO: Same method on the Relier flags, can we DRY?
  // _getSavedClientId requires storage context, maybe get from shared flags class
  private _isOAuthVerificationSameBrowser() {
    return this._isVerification() && this._isService(this._getSavedClientId());
  }

  private _isVerification() {
    return (
      this._isSignUpVerification() ||
      this._isPasswordResetVerification() ||
      this._isReportSignIn()
    );
  }

  private _isPasswordResetVerification() {
    return this._searchParam('code') && this._searchParam('token');
  }

  private _isReportSignIn() {
    return this.pathname === '/report_signin';
  }

  private _isSignUpVerification() {
    return this._searchParam('code') && this._searchParam('uid');
  }

  private _searchParam(key: string) {
    return this.urlQueryData.get(key);
  }

  private _isServiceSync() {
    return this._isService(Constants.SYNC_SERVICE);
  }

  private _isService(compareToService: string) {
    const service = this._searchParam('service');
    return !!(service && compareToService && service === compareToService);
  }

  private _isOAuthVerificationDifferentBrowser() {
    return this._isVerification() && this._isServiceOAuth();
  }

  private _isServiceOAuth() {
    const service = this._searchParam('service');
    return service && !this._isServiceSync();
  }

  // private _getSavedClientId() {
  //   const oauth = this.storageData.get('oauth');
  //   if (
  //     typeof oauth === 'object' &&
  //     oauth != null &&
  //     'client_id' in oauth &&
  //     typeof oauth.client_id === 'string'
  //   ) {
  //     return oauth.client_id;
  //   }
  //   return '';
  // }
}
