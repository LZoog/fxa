/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { SyncEngines } from '../../lib/channels/firefox';
import { Constants } from '../../lib/constants';
import { ModelDataStore } from '../../lib/model-data';
import { Integration, IntegrationType } from './integration';
import {
  OAuthIntegrationOptions,
  OAuthWebIntegration,
} from './oauth-web-integration';
import {
  OAuthNativeClients,
  OAuthNativeServices,
  OAUTH_NATIVE_SERVICE_SCOPES,
} from '@fxa/accounts/oauth';

export function isOAuthNativeIntegration(integration: {
  type: IntegrationType;
}): integration is OAuthNativeIntegration {
  return (
    (integration as OAuthNativeIntegration).type === IntegrationType.OAuthNative
  );
}

export type OAuthIntegration = OAuthWebIntegration | OAuthNativeIntegration;

/**
 * Check if the integration is OAuth-based (OAuthWeb, OAuthNative, or Pairing)
 */
export function isOAuthIntegration(integration: {
  type: IntegrationType;
}): integration is OAuthIntegration {
  return (
    (integration as OAuthWebIntegration).type === IntegrationType.OAuthWeb ||
    (integration as OAuthNativeIntegration).type ===
      IntegrationType.OAuthNative ||
    integration.type === IntegrationType.PairingAuthority ||
    integration.type === IntegrationType.PairingSupplicant
  );
}

/**
 * A convenience function for the OAuthNativeIntegration type guard + isSync().
 */
export const isOAuthNativeIntegrationSync = (
  integration: Pick<Integration, 'type'>
) => isOAuthNativeIntegration(integration) && integration.isSync();

/**
 * This integration is used for OAuth implementations by the browser including
 * mobile clients (currently all Sync), the oauth desktop sync flow, and the oauth
 * desktop flow for other services.
 *
 * FxA sends and receives web channel messages if this integration is created.
 */
export class OAuthNativeIntegration extends OAuthWebIntegration {
  constructor(
    data: ModelDataStore,
    protected readonly storageData: ModelDataStore,
    public readonly opts: OAuthIntegrationOptions
  ) {
    super(data, storageData, opts, IntegrationType.OAuthNative);
  }

  isSync() {
    return this.isFirefoxClient() && this.isDefaultSyncService();
  }

  isDesktopSync() {
    return this.isFirefoxDesktopClient() && this.isDefaultSyncService();
  }

  // Sync should always provide a `service=sync` parameter for all Fx Desktop versions
  // and newer mobile versions. We'll default to Sync if it's missing.
  private isDefaultSyncService() {
    return (
      this.data.service === undefined ||
      this.data.service === OAuthNativeServices.Sync
    );
  }

  isFirefoxClientServiceRelay() {
    return (
      this.isFirefoxClient() && this.data.service === OAuthNativeServices.Relay
    );
  }

  isFirefoxClientServiceSmartWindow() {
    return (
      this.isFirefoxClient() &&
      this.data.service === OAuthNativeServices.SmartWindow
    );
  }

  isFirefoxClientServiceVpn() {
    return (
      this.isFirefoxClient() && this.data.service === OAuthNativeServices.Vpn
    );
  }

  isFirefoxNonSync() {
    return (
      this.isFirefoxClientServiceRelay() ||
      this.isFirefoxClientServiceSmartWindow() ||
      this.isFirefoxClientServiceVpn()
    );
  }

  isFirefoxMobileClient() {
    return (
      this.clientInfo?.clientId === OAuthNativeClients.FirefoxIOS ||
      this.clientInfo?.clientId === OAuthNativeClients.Fenix ||
      this.clientInfo?.clientId === OAuthNativeClients.Fennec ||
      this.clientInfo?.clientId === OAuthNativeClients.ReferenceBrowser
    );
  }

  isFirefoxDesktopClient() {
    return (
      this.clientInfo?.clientId === OAuthNativeClients.FirefoxDesktop ||
      // TODO / HACK: this check is temporary to unblock Thunderbird until
      // we can work on FXA-10848
      this.clientInfo?.clientId === OAuthNativeClients.Thunderbird
    );
  }

  // Sync requires keys, which forces password entry.
  requiresKeys(): boolean {
    return this.isSync() && this._scopeRequestsKeys();
  }

  // Non-Sync browser services (Relay, VPN, SmartWindow) want keys
  // opportunistically if the user enters a password for another reason,
  // so they can turn Sync on without being bounced back to FxA.
  wantsKeysIfPasswordEntered(): boolean {
    return this.isFirefoxNonSync() && this._scopeRequestsKeys();
  }

  // ADR 0049: under server-side scope resolution, the URL may omit
  // `scope=` for native flows and the server resolves it from `service=`.
  // For client-side decisions that previously inspected `data.scope`
  // (e.g. whether to request scoped keys, what service this is), use
  // this helper instead. Returns the explicit URL scope when present,
  // otherwise the canonical scope for the URL's `service=`, else ''.
  getEffectiveScope(): string {
    if (this.data.scope) {
      return this.data.scope;
    }
    const service = this.data.service as OAuthNativeServices | undefined;
    if (service && OAUTH_NATIVE_SERVICE_SCOPES[service]) {
      return OAUTH_NATIVE_SERVICE_SCOPES[service];
    }
    return '';
  }

  // ADR 0049: when the URL omits `scope=`, send empty so the server's
  // /oauth/authorization gate resolves it from `service=`. Bypasses
  // super.getPermissions() which would otherwise throw on empty scope.
  // Explicit URL scope still wins (parent path).
  override getNormalizedScope(): string {
    if (!this.data.scope) {
      return '';
    }
    return super.getNormalizedScope();
  }

  // ADR 0049: when the URL omits `scope=`, derive the effective scope
  // from `service=` so key-related decisions (Sync requires keys, Relay/
  // VPN/SmartWindow want keys opportunistically) match what the server
  // is about to resolve. Otherwise defer to the parent's URL-scope-based
  // check.
  protected override _scopeRequestsKeys(): boolean {
    if (this.data.scope) {
      return super._scopeRequestsKeys();
    }
    if (!this.opts.scopedKeysEnabled || this.data.keysJwk == null) {
      return false;
    }
    const effective = this.getEffectiveScope();
    if (!effective) {
      return false;
    }
    const validation = this.opts.scopedKeysValidation;
    // eslint-disable-next-line no-prototype-builtins
    if (!validation.hasOwnProperty(effective)) {
      return false;
    }
    return validation[effective].redirectUris.includes(
      this.clientInfo?.redirectUri
    );
  }

  getWebChannelServices(syncEngines?: SyncEngines) {
    if (this.isFirefoxClientServiceRelay()) {
      return { relay: {} };
    }
    if (this.isFirefoxClientServiceSmartWindow()) {
      return { smartwindow: {} };
    }
    if (this.isFirefoxClientServiceVpn()) {
      return { vpn: {} };
    }
    if (this.isDefaultSyncService()) {
      return { sync: syncEngines || {} };
    }
    return undefined;
  }

  getServiceName() {
    if (this.isDefaultSyncService()) {
      return Constants.RELIER_SYNC_SERVICE_NAME;
    }
    if (this.isFirefoxClientServiceRelay()) {
      return Constants.RELIER_FF_CLIENT_RELAY_SERVICE_NAME;
    }
    if (this.isFirefoxClientServiceSmartWindow()) {
      return Constants.RELIER_FF_CLIENT_SMART_WINDOW_SERVICE_NAME;
    }
    if (this.isFirefoxClientServiceVpn()) {
      return Constants.RELIER_FF_CLIENT_VPN_SERVICE_NAME;
    }
    // TODO: handle Thunderbird case better? FXA-10848
    return 'Firefox';
  }
}
