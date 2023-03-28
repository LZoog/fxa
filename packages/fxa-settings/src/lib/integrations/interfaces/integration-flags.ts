/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Creation flags interface, controls the type of integration that is ultimately produced.
 */
export interface IntegrationFlags {
  isDevicePairingAsAuthority(): boolean;
  isDevicePairingAsSupplicant(): boolean;
  isOAuth(): boolean;
  isOAuthWebChannel(): boolean;
  isChromeAndroid(): boolean;
}
