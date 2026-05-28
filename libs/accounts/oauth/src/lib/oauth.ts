/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export enum OAuthNativeClients {
  FirefoxIOS = '1b1a3e44c54fbb58',
  FirefoxDesktop = '5882386c6d801776',
  Fenix = 'a2270f727f45f648',
  Fennec = '3332a18d142636cb',
  // For Android testing
  ReferenceBrowser = '3c49430b43dfba77',
  // TODO: handle Thunderbird case better, FXA-10848
  Thunderbird = '8269bacd7bbc7f80',
}

/**
 * These come through via data.service (a query parameter).
 */
export enum OAuthNativeServices {
  Sync = 'sync',
  Relay = 'relay',
  SmartWindow = 'smartwindow',
  Vpn = 'vpn',
}

// Lookup set for "is this clientId an OAuthNative (Firefox) client?". Enum
// values are already lowercase hex; callers should lowercase the input
// before checking since `client_id` arriving over the wire may differ in
// case from what the clients table stores.
export const OAUTH_NATIVE_CLIENT_IDS: ReadonlySet<string> = new Set(
  Object.values(OAuthNativeClients)
);

// Browser-service → canonical scope URL. Mirrors the auth-server config at
// oauthServer.exchange.serviceScopes (which is authoritative). The client
// keeps a copy so settings can derive a scope from `service=` for ADR 0049
// flows where the URL omits `scope=` — e.g. whether to request scoped keys
// (Sync) or set up key-bearing UI prompts (Relay/VPN/SmartWindow). Adding
// a new native service requires updating both this map and the server
// config.
export const OAUTH_NATIVE_SERVICE_SCOPES: Readonly<
  Record<OAuthNativeServices, string>
> = {
  [OAuthNativeServices.Sync]: 'https://identity.mozilla.com/apps/oldsync',
  [OAuthNativeServices.Relay]: 'https://identity.mozilla.com/apps/relay',
  [OAuthNativeServices.SmartWindow]:
    'https://identity.mozilla.com/apps/smartwindow',
  [OAuthNativeServices.Vpn]: 'https://identity.mozilla.com/apps/vpn',
};
