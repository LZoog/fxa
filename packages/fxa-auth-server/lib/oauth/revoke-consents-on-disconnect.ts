/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Consent revocation on sign-out / disconnect.
//
// accountAuthorizations is written at /oauth/authorization and read by the
// token-exchange gate, where a missing row means no consent and the exchange is
// denied. Deleting a row therefore returns the user to a pre-authorization
// state; before this, only account deletion did.
//
// Called from the two functions that destroy refresh tokens — devices.destroy()
// and authorizedClients.destroy() — covering three routes:
//   POST /account/attached_client/destroy  Connected Services
//   POST /authorized-clients/destroy       RP-initiated
//   POST /account/device/destroy           self-initiated (refreshToken strategy)
// The last means a browser signing itself out also withdraws its consent, which
// is intended: any disconnect is a withdrawal, whoever initiates it. Deliberately
// not covered: the plain-session branch of the attached-client route (no OAuth
// client), and removeTokensAndCodes(), which password reset shares with account
// deletion — consent survives credential rotation.
//
// Two rules decide what goes:
//
// 1. Peers, not owners. The exchange gate reads (uid, scope, service) and omits
//    clientId, so consent is shared across a service's clients. A row is judged
//    by the whole peer group — the service's allowlist in
//    oauthServer.exchange.allowedClientsForService — and dropped only when no
//    peer still holds a token covering it. Mobile consumes VPN by exchange and
//    never writes its own row, so without this the Desktop-written row would be
//    unreachable: Desktop cannot be reaped (see 2) and no other client would
//    consider it. A service with no allowlist falls back to the row's own
//    client, never to "everyone", so a web RP's `profile` row cannot be kept
//    alive by an unrelated Firefox token.
//
// 2. Absence of a refresh token is only evidence for a client that had one.
//    Firefox Desktop does not use refresh tokens yet, so finding none says
//    nothing about whether it is still signed in — hence destroyedRefreshTokens.
//    A consequence of rule 1 is that Desktop's rows can still be reaped by a
//    peer's disconnect, since Desktop contributes no token to sustain them.
//    Accepted: exchange requires a refresh token as subject_token, so a client
//    without one cannot exchange anyway, and the next sign-in rewrites the row.
//    The cost is metrics, not access.
//
// Scope containment uses ScopeSet, not string equality: scopes are hierarchical,
// so a remaining `profile` token covers a `profile:uid` row (smartwindow writes
// those). Exact matching would revoke rows still backed by consent.
//
// Best-effort throughout. Bookkeeping must never fail a disconnect: the user's
// tokens are already gone and they cannot retry, so errors are swallowed and
// counted, mirroring the write path's accountAuthorization.write_failed guard.

import { OAUTH_NATIVE_CLIENT_IDS } from '@fxa/accounts/oauth';
import { StatsD } from 'hot-shots';
import { Logger } from 'mozlog';

/** A consent row as returned by listAccountConsentsByUid. */
export interface ConsentRow {
  scope: string;
  service: string;
  /** Hex, normalized by the caller — the DB hands these back as Buffers. */
  clientId: string;
  lastAuthorizedTosAt: number;
}

export interface RemainingRefreshToken {
  /** Hex, normalized by the caller. */
  clientId: string;
  /** ScopeSet, so hierarchical scopes resolve correctly. */
  scope: { contains(scope: string): boolean };
}

export interface RevokeConsentsOnDisconnectOauthDB {
  listAccountConsentsByUid(uid: string): Promise<
    Array<{
      scope: string;
      service: string;
      clientId: Buffer | string;
      lastAuthorizedTosAt: number | string;
    }>
  >;
  getRefreshTokensByUid(uid: string): Promise<
    Array<{
      clientId: Buffer | string;
      scope: { contains(scope: string): boolean };
    }>
  >;
  /** Clients allowed to claim the service, or undefined when unconfigured. */
  getAllowedClientsForService(service: string): Set<string> | undefined;
  /** Resolves to the number of rows actually removed. */
  deleteAccountConsentRows(uid: string, rows: ConsentRow[]): Promise<number>;
}

export interface RevokeConsentsOnDisconnectDeps {
  oauthDB: RevokeConsentsOnDisconnectOauthDB;
  // Only the methods this module uses, picked from the real collaborator types
  // so a minimal mock satisfies them without re-declaring the contract.
  statsd?: Pick<StatsD, 'increment'>;
  log?: Pick<Logger, 'warn'>;
}

export interface RevokeConsentsOnDisconnectParams {
  uid: string;
  /**
   * Hex client_id being disconnected. Absent for a destroy that has no OAuth
   * client behind it — a session-token-only device, or a device whose refresh
   * token was already gone.
   */
  clientId?: string;
  /**
   * How many refresh tokens the destroy actually removed. Zero means we have no
   * evidence the client was ever refresh-token backed, so nothing is revoked.
   */
  destroyedRefreshTokens: number;
}

const hex = (v: Buffer | string): string =>
  (typeof v === 'string' ? v : v.toString('hex')).toLowerCase();

/**
 * Rows that no peer of the disconnected client still sustains.
 *
 * Pure, so the policy is testable without a DB. The disconnected client judges
 * every row whose peer group it belongs to, not just rows it wrote itself —
 * which is what lets a mobile disconnect clear a Desktop-written row that mobile
 * had only ever consumed by exchange. Membership cuts both ways: a client
 * outside a row's peer group has no say over it, and since a service with no
 * allowlist has a peer group of just the row's own client, web RP rows remain
 * reapable only by their own disconnect.
 */
export function consentRowsToRevoke(params: {
  rows: ConsentRow[];
  clientId: string;
  remainingTokens: RemainingRefreshToken[];
  allowedClientsForService: (service: string) => Set<string> | undefined;
}): ConsentRow[] {
  const { rows, clientId, remainingTokens, allowedClientsForService } = params;
  const target = clientId.toLowerCase();

  return rows.filter((row) => {
    const peers =
      allowedClientsForService(row.service) ?? new Set([row.clientId]);
    if (!peers.has(target)) {
      return false;
    }
    return !remainingTokens.some(
      (token) => peers.has(token.clientId) && token.scope.contains(row.scope)
    );
  });
}

// One immediate retry, then give up.
//
// Justified by the absence of a second chance rather than the odds of any single
// failure: nothing else revisits these rows, so a delete that does not happen
// leaves consent standing until the user disconnects the same client again.
// Elsewhere a failed write is recoverable on the next request; here it is
// terminal. Unconditional, since the sequence is idempotent (two reads and a
// PK-matched DELETE) and the transient faults worth surviving are broader than
// any one error code — a reaped pool connection, a failover blip, a lock
// timeout. Retrying re-reads, so the second attempt decides on fresh state.
//
// Not retried further: the user is blocked on this request, and a fault
// outlasting two attempts will not clear in another few ms.
const ATTEMPTS = 2;

// Bounded tag: browser services and web RPs behave differently on disconnect
// and are worth telling apart, but tagging the raw client_id would give the
// metric unbounded cardinality (one value per registered RP).
function clientType(clientId: string): string {
  return OAUTH_NATIVE_CLIENT_IDS.has(clientId.toLowerCase())
    ? 'native'
    : 'other';
}

export async function revokeConsentsOnDisconnect(
  deps: RevokeConsentsOnDisconnectDeps,
  params: RevokeConsentsOnDisconnectParams
): Promise<void> {
  const { uid, clientId, destroyedRefreshTokens } = params;
  if (!uid || !clientId) {
    return;
  }
  if (!destroyedRefreshTokens) {
    // Nothing was destroyed, so "none remain" is not evidence of a disconnect.
    // Firefox Desktop is the live case — see rule 2 in the header.
    deps.statsd?.increment('accountAuthorization.revoke_skipped', {
      client_type: clientType(clientId),
      reason: 'no_refresh_token',
    });
    return;
  }

  const client_type = clientType(clientId);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      // Reads happen after the caller's token delete has committed. That
      // ordering is what makes parallel disconnects safe: each request reads
      // only after its own delete, so the last to run sees the true final token
      // set and no two can both conclude "sustained".
      const [consentRows, tokens] = await Promise.all([
        deps.oauthDB.listAccountConsentsByUid(uid),
        deps.oauthDB.getRefreshTokensByUid(uid),
      ]);

      const toRevoke = consentRowsToRevoke({
        rows: consentRows.map((r) => ({
          scope: r.scope,
          service: r.service,
          clientId: hex(r.clientId),
          lastAuthorizedTosAt: Number(r.lastAuthorizedTosAt),
        })),
        clientId,
        remainingTokens: tokens.map((t) => ({
          clientId: hex(t.clientId),
          scope: t.scope,
        })),
        allowedClientsForService: (service) =>
          deps.oauthDB.getAllowedClientsForService(service),
      });

      const rows = toRevoke.length
        ? await deps.oauthDB.deleteAccountConsentRows(uid, toRevoke)
        : 0;
      // 0 is the common case: a peer still sustains every row, or there was no
      // consent to begin with. Counted separately from a revocation so the two
      // can be told apart without inferring it from a rate.
      deps.statsd?.increment(
        rows > 0
          ? 'accountAuthorization.revoked'
          : 'accountAuthorization.revoke_noop',
        { client_type }
      );
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < ATTEMPTS) {
        // Counted rather than logged: paired against revoke_failed, this shows
        // how often the retry is what saved the revocation.
        deps.statsd?.increment('accountAuthorization.revoke_retried', {
          client_type,
        });
        continue;
      }
      deps.statsd?.increment('accountAuthorization.revoke_failed', {
        client_type,
      });
      // Message only. The mysql driver decorates errors with connection options
      // that can carry credentials, so the error object never goes to the log.
      deps.log?.warn('accountAuthorization.revoke_failed', { err: message });
    }
  }
}
