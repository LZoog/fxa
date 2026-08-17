/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Consent revocation on sign-out / disconnect. The token-exchange gate denies
// when no accountAuthorizations row exists, so deleting one returns the user to a
// pre-authorization state.
//
// Two rules decide what goes:
//
// 1. Peers, not owners. The gate reads (uid, scope, service) and omits clientId,
//    so consent is shared across a service's clients. A row is judged by the
//    whole peer group — oauthServer.exchange.allowedClientsForService, the same
//    list that gates writes, so write and revoke authority cannot drift — and
//    dropped only when no peer still holds a token covering it. Mobile consumes
//    VPN by exchange without writing its own row, so judging by owner would
//    leave the Desktop-written row unreachable. A service with no allowlist
//    falls back to the row's own client, never to everyone, so an unrelated
//    Firefox token cannot sustain a web RP's row.
//
// 2. A missing refresh token is only evidence for a client that had one. Firefox
//    Desktop does not use them yet, hence destroyedRefreshTokens. Rule 1 can
//    still reap Desktop's rows via a peer's disconnect, since Desktop
//    contributes nothing to sustain them. The exchange gate is unaffected — it
//    needs a refresh token as subject_token, so such a client cannot exchange
//    anyway — but the row has other readers that key on the exact clientId,
//    notably the VPN-in-Desktop DAU bandaid, which will tag exclude_dau until
//    the next sign-in rewrites the row.
//
// Errors are swallowed and counted: the user's tokens are already gone and they
// cannot retry, so bookkeeping must never fail a disconnect.

import { OAUTH_NATIVE_CLIENT_IDS } from '@fxa/accounts/oauth';
import { StatsD } from 'hot-shots';
import { Logger } from 'mozlog';

import { consentRowsToRevoke, type ConsentRow } from '@fxa/accounts/oauth';

export interface RevokeConsentsOnDisconnectOauthDB {
  listAccountConsentsByUid(uid: string): Promise<
    Array<{
      scope: string;
      service: string;
      clientId: Buffer | string;
      lastAuthorizedTosAt: number | string;
    }>
  >;
  getRefreshTokenScopesByUid(uid: string): Promise<
    Array<{
      clientId: Buffer | string;
      scope: { contains(scope: string): boolean };
    }>
  >;
  /** Clients sharing the service's consent, or undefined when unconfigured. */
  getPeerClientsForService(service: string): Set<string> | undefined;
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
   * Hex client_id being disconnected. Absent for a destroy with no OAuth client
   * behind it — a session-token-only device, or one whose token was already gone.
   */
  clientId?: string;
  /**
   * How many refresh tokens the destroy actually removed. Zero means we have no
   * evidence the client was ever refresh-token backed, so nothing is revoked.
   */
  destroyedRefreshTokens: number;
}

const hex = (v: Buffer | string): string =>
  typeof v === 'string' ? v : v.toString('hex');

// One immediate retry. Nothing else revisits these rows, so unlike most writes a
// failure here is terminal rather than recoverable on the next request. Not gated
// on error code, since the sequence is idempotent and retrying re-reads, so the
// second attempt decides on fresh state.
const ATTEMPTS = 2;

// Tagging the raw client_id would give the metric one value per registered RP,
// so bucket to the distinction that matters.
function clientType(clientId: string): 'native' | 'other' {
  return OAUTH_NATIVE_CLIENT_IDS.has(String(clientId).toLowerCase())
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
      // Both reads happen after the caller's token delete committed, which is
      // what makes parallel disconnects safe: each request reads only after its
      // own delete, so the last to run sees the true final token set and no two
      // can both conclude "sustained".
      //
      // Consents first, then tokens — not in parallel. An authorization that
      // commits between the two then shows up as a token we have no row for,
      // which is inert, rather than a row whose sustaining token we missed,
      // which would revoke consent the user just granted.
      const consentRows = await deps.oauthDB.listAccountConsentsByUid(uid);
      const tokens = await deps.oauthDB.getRefreshTokenScopesByUid(uid);

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
        peerClientsForService: (service) =>
          deps.oauthDB.getPeerClientsForService(service),
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
