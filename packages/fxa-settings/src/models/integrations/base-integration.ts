/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// export enum IntegrationBaseType {
//   Base,
//   Sync,
// }

export enum IntegrationType {
  OAuth, // should check for this._searchParam('context') === Constants.OAUTH_WEBCHANNEL_CONTEXT? (oauth_webchannel_v1) for web channel support
  PairingAuthority, // TODO
  PairingSupplicant, // TODO
  SyncBasic, // only used when user is on a verification page through sync & verifying in a different browser (🥴)
  SyncDesktop,
  Web, // default
}

// pairing authority just needs base
// pairing supplicant will need oauth webchannel support (extend from oauth)

// export enum IntegrationType {
//   OAuthRedirect,
//   OAuthWebChannel,
//   SyncChannel,
//   SyncWebChannel,
//   V3Desktop,
//   Web, // default
// }

export abstract class Integration {
  type: IntegrationType;
  abstract features: Partial<IntegrationFeatures>;

  constructor(type: IntegrationType) {
    this.type = type;
  }
}

export type IntegrationFeatures = {
  /**
   * If the provided UID no longer exists on the auth server, can the
   * user sign up/in with the same email address but a different uid?
   */
  allowUidChange: boolean;
  /**
   * Should the user agent be queried for FxA data?
   */
  fxaStatus: boolean;
  /**
   * Should the view handle signed-in notifications from other tabs?
   */
  handleSignedInNotification: boolean;
  /**
   * If the user has an existing sessionToken, can we safely re-use it on
   * subsequent signin attempts rather than generating a new token each time?
   */
  reuseExistingSession: boolean;
  /**
   * Does this environment support pairing?
   */
  supportsPairing: boolean;
  /**
   * Does this environment support the Sync Optional flow?
   */
  syncOptional: boolean;
};

/* TODO, do we care about these capabilities/features?
 * -isOpenWebmailButtonVisible: we have a webmail link showing only in desktop v3 on the confirm
 * reset PW page and confirm page. We have this comment: "we do not show [this] in mobile context
 * because it performs worse".
 * -
 */

export class BaseIntegration extends Integration {
  protected integrationFeatures: IntegrationFeatures;

  constructor(
    type: IntegrationType,
    features: Partial<IntegrationFeatures> = {}
  ) {
    super(type);
    this.integrationFeatures = {
      allowUidChange: false,
      fxaStatus: false,
      handleSignedInNotification: true,
      reuseExistingSession: false,
      supportsPairing: false,
      syncOptional: false,
      ...features,
    };
  }

  get features(): IntegrationFeatures {
    return this.integrationFeatures;
  }
}
