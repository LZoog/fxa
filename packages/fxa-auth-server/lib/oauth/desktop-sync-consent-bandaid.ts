/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Bandaid (FXA-14263): keep a Sync consent row out of `accountAuthorizations`
// when the user signed into a non-Sync browser service on Firefox Desktop.
//
// Desktop hardcodes the Sync scope into the scopes it requests for *every*
// browser-initiated flow (`FxAccountsConfig.sys.mjs::_getAuthParams`), whatever
// service the user is actually signing into. `recordAuthorizationRows` writes
// one consent row per requested scope, so signing into Smart Window, Relay or
// VPN files an `apps/oldsync` row for a user who never authorized Sync — which
// over-counts Sync authorizations (FXA-13364).
//
// Entering a password is deliberately NOT treated as Sync consent, confirmed
// with Product. A `keys_jwe` flow on a non-Sync service makes the server add
// `keysConditionalScope` (apps/oldsync) so the user can turn Sync on later
// without another round trip, but they saw nothing about Sync on the FxA
// screen and have not consented to it — so that row is dropped too. Recording
// real consent when the user turns Sync on inside the browser needs a signal
// Firefox does not send us today; FXA-14295 covers the endpoint for it.
// Only `service=sync`, or a missing service (very old browsers, which default
// to Sync), records Sync consent on Desktop.
//
// The same decision has two consumers. It keeps the Sync scope out of the
// consent ledger, and — carried to /oauth/token on the auth code via
// `excludeDauCacheKey` — it tags the `access_token_created` Glean event
// `exclude_dau`, so the sign-in isn't counted as Sync DAU. /oauth/token cannot
// make the call itself: it never receives `service=`.
//
// The scope is still granted and the access token still carries it, so nothing
// about the sign-in or the tokens Desktop receives changes here.
//
// The real fix is on the Desktop side: stop sending `scope=` and let the server
// resolve scopes from `service=` (ADR 0049), which arrives with the
// session-token -> refresh-token switchover. Delete this module then.
//
// Deliberately Desktop-only. Fenix sends `profile + oldsync + vpn` with
// `service=vpn`, but while Sync is not decoupled on Android a VPN signup there
// genuinely is a Sync signup, so mobile is left alone until that lands. No
// ticket is filed for the mobile case yet.
//
// See also `vpn-in-desktop-dau-bandaid.ts`, the read-side counterpart that
// reasons about the same ledger from the token endpoint. Its deletion trigger
// is different (Desktop VPN no longer over-minting), so the two expire apart.

import { OAuthNativeClients, OAuthNativeServices } from '@fxa/accounts/oauth';

/**
 * Redis key holding the pending exclude-DAU decision for an auth code, keyed on
 * the code's hash (never the code itself, which is a credential). Written at
 * /oauth/authorization, read when the code is redeemed. Set to expire with the
 * code, so a code that is never redeemed leaves nothing behind.
 */
export function excludeDauCacheKey(codeIdHex: string): string {
  return `syncDauExclude:${codeIdHex}`;
}

/**
 * `serviceValue` and `clientIdHex` are compared case-insensitively rather than
 * trusting callers to normalize. Both are lowercase on today's path, but only
 * by coincidence of their producers: `clientIdHex` because it round-trips
 * through a BINARY column, `serviceValue` because the `service=` branch
 * lowercases it — the scope-inference branch returns an
 * `oauthServer.exchange.serviceScopes` key verbatim, and that config is
 * env-overridable. A stray uppercase key would otherwise make the Sync guard
 * miss and drop a genuine Sync consent, the one failure mode here that loses
 * real data rather than over-recording.
 */
export interface DropUnconsentedSyncScopeParams {
  /** Scopes about to be written to `accountAuthorizations`. */
  scopes: string[];
  /** Resolved browser service; '' when absent, unknown, or ambiguous. */
  serviceValue: string;
  /** Hex OAuth client id for this authorization. */
  clientIdHex: string;
  /**
   * Canonical Sync scope, from `oauthServer.exchange.serviceScopes.sync`.
   * Undefined when Sync has no configured scope, in which case nothing is
   * dropped — config drift must not silently change what we record.
   */
  syncScope?: string;
}

export interface DropUnconsentedSyncScopeResult {
  /** The scopes to record consent for. */
  scopes: string[];
  /** True when the Sync scope was removed, for the caller's metric. */
  droppedSyncScope: boolean;
}

/**
 * Returns the scopes to record consent for, with the Sync scope removed when
 * Firefox Desktop resolved a browser service other than Sync. Every other
 * caller and scope is passed through untouched.
 */
export function dropUnconsentedSyncScope({
  scopes,
  serviceValue,
  clientIdHex,
  syncScope,
}: DropUnconsentedSyncScopeParams): DropUnconsentedSyncScopeResult {
  if (!syncScope) {
    return { scopes, droppedSyncScope: false };
  }
  if ((clientIdHex || '').toLowerCase() !== OAuthNativeClients.FirefoxDesktop) {
    return { scopes, droppedSyncScope: false };
  }
  // An absent or unresolved service conventionally means Sync (see
  // `isDefaultSyncService` in fxa-settings), so only drop the scope when some
  // other browser service was positively resolved. Erring toward recording
  // keeps us from losing genuine Sync consent.
  const service = (serviceValue || '').toLowerCase();
  if (!service || service === OAuthNativeServices.Sync) {
    return { scopes, droppedSyncScope: false };
  }
  // Exact match on the full scope URL (https://identity.mozilla.com/apps/
  // oldsync). Sub-scopes such as .../apps/oldsync/bookmarks are left alone;
  // Desktop only ever requests the bare scope.
  const kept = scopes.filter((scope) => scope !== syncScope);
  return { scopes: kept, droppedSyncScope: kept.length !== scopes.length };
}
