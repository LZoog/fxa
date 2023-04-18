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

const ALLOWED_LOGIN_FIELDS = [
  'declinedSyncEngines',
  'email',
  'keyFetchToken',
  'offeredSyncEngines',
  'sessionToken',
  'services',
  'uid',
  'unwrapBKey',
  'verified',
];

const REQUIRED_LOGIN_FIELDS = [
  'email',
  'keyFetchToken',
  'sessionToken',
  'uid',
  'unwrapBKey',
  'verified',
];

export class SyncDesktopIntegration extends SyncBasicIntegration {
  // private uidOfLoginNotification: hexstring;

  constructor() {
    super(IntegrationType.SyncDesktop);
    this.integrationFeatures = {
      ...super.features,
      allowUidChange: true,
    };
    // this.uidOfLoginNotification = '';
  }

  // private hasRequiredLoginFields(loginData) {
  //   const loginFields = Object.keys(loginData);
  //   return (
  //     REQUIRED_LOGIN_FIELDS.filter((field) => !loginFields.includes(field))
  //       .length === 0
  //   );
  // }

  // notifyRelierOfLogin(account) {
  //   /**
  //    * Workaround for #3078. If the user signs up but does not verify
  //    * their account, then visit `/` or `/settings`, they are
  //    * redirected to `/confirm` which attempts to notify the browser of
  //    * login. Since `unwrapBKey` and `keyFetchToken` are not persisted to
  //    * disk, the passed in account lacks these items. The browser can't
  //    * do anything without this data, so don't actually send the message.
  //    *
  //    * Also works around #3514. With e10s enabled, localStorage in
  //    * about:accounts and localStorage in the verification page are not
  //    * shared. This lack of shared state causes the original tab of
  //    * a password reset from about:accounts to not have all the
  //    * required data. The verification tab sends a WebChannel message
  //    * already, so no need here too.
  //    */
  //   const loginData = this.getLoginData(account);
  //   if (!this.hasRequiredLoginFields(loginData)) {
  //     return;
  //   }

  //   // Only send one login notification per uid to avoid race
  //   // conditions within the browser. Two attempts to send
  //   // a login message occur for users that verify while
  //   // at the /confirm screen. The first attempt is made when
  //   // /confirm is first displayed, the 2nd when verification
  //   // completes.
  //   if (loginData.uid !== this.uidOfLoginNotification) {
  //     this.uidOfLoginNotification = loginData.uid;

  //     return this.send(this.getCommand('LOGIN'), loginData);
  //   }
  // }

  // /**
  //  * Get login data from `account` to send to the browser.
  //  * All returned keys have a defined value.
  //  *
  //  * @param {Object} account
  //  * @returns {Object}
  //  * @private
  //  */
  // private getLoginData(account) {
  //   let loginData = account.pick(ALLOWED_LOGIN_FIELDS) || {};

  //   // TODO: account for multiservice when we combine reliers
  //   // const isMultiService = this.relier && this.relier.get('multiService');
  //   // if (isMultiService) {
  //   //   loginData = this._formatForMultiServiceBrowser(loginData);
  //   // }

  //   loginData.verified = !!loginData.verified;
  //   // TODO: this is set in the `beforeSignIn` auth-broker method
  //   // loginData.verifiedCanLinkAccount = !!this._verifiedCanLinkEmail;
  //   return Object.fromEntries(
  //     Object.entries(loginData).filter(([key, value]) => value !== undefined)
  //   );
  // }
}
