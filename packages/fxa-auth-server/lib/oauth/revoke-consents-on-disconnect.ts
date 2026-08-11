/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Consent revocation on sign-out / disconnect (FXA-14101).
//
// accountAuthorizations is written on consent at /oauth/authorization and read
// by the token-exchange gate, where a missing row means no consent and the
// exchange is denied. Until now the only delete was on account deletion, so a
// user had no way back to a pre-authorization state. This helper closes that:
// when a client is disconnected from Connected Services and it was the user's
// last refresh token for that client, the client's consent rows go away and the
// next exchange for the scope denies with NO_CONSENT.
//
// Called from the two functions that actually destroy refresh tokens —
// devices.destroy() and authorizedClients.destroy() — which between them cover
// three routes:
//   POST /account/attached_client/destroy  Connected Services, all three of its
//                                          OAuth branches
//   POST /authorized-clients/destroy       RP-initiated, assertion-authed
//   POST /account/device/destroy           self-initiated, and reachable with a
//                                          refreshToken strategy
// The last one means a browser signing *itself* out of Sync also withdraws that
// client's consent, so a later token exchange for it denies. That is intended:
// any disconnect is a withdrawal, whoever initiates it.
//
// The deliberate omissions are the plain-session branch of the attached-client
// route (a web session has no OAuth client) and removeTokensAndCodes(), which
// password reset shares with account deletion: consent survives credential
// rotation.
//
// Keyed on (uid, clientId) alone. That is the grain the rows are written at,
// and it is enough — a sibling client keeps its own row, so disconnecting
// Desktop leaves the user's Fenix consent for the same service intact, which is
// how consent is shared across clients in the first place (the read query omits
// clientId). Whether any refresh token is left is decided inside the DELETE, so
// there is no scope or token bookkeeping to do here.
//
// Best-effort: bookkeeping must never fail a disconnect. The user's tokens are
// already gone by the time we run and they cannot retry, so every error is
// swallowed and counted, mirroring the write path's
// accountAuthorization.write_failed guard.

import { OAUTH_NATIVE_CLIENT_IDS } from '@fxa/accounts/oauth';
import { StatsD } from 'hot-shots';
import { Logger } from 'mozlog';

export interface RevokeConsentsOnDisconnectOauthDB {
  /** Resolves to the number of consent rows removed. */
  deleteConsentsForClientIfUnused(
    uid: string,
    clientId: string
  ): Promise<number>;
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
}

// One immediate retry, then give up.
//
// What justifies it is not the odds of any single failure but the absence of a
// second chance: nothing else in the system revisits these rows, so a delete
// that does not happen leaves consent standing until the user disconnects the
// same client again, which they have no reason to do. Everywhere else a failed
// write is recoverable on the next request; here it is terminal.
//
// The retry is unconditional because the DELETE is idempotent, so a wasted
// attempt on a permanent fault costs one cheap query and cannot corrupt
// anything. Deliberately not gated on error code: the transient faults worth
// surviving are broader than deadlocks — a connection reaped from the pool, a
// failover blip, a lock timeout. (An earlier version of this comment claimed
// concurrent disconnects deadlock. They mostly do not: the parallel statements
// take locks in the same order and each token delete is its own autocommit
// transaction, so the usual outcome is a short wait, not a 1213.)
//
// A second failure is not retried further. The user is blocked on this request,
// and a fault outlasting two attempts will not clear in another few ms.
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
  const { uid, clientId } = params;
  if (!uid || !clientId) {
    return;
  }

  const client_type = clientType(clientId);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const rows = await deps.oauthDB.deleteConsentsForClientIfUnused(
        uid,
        clientId
      );
      // 0 rows is the common, uninteresting case: the client still has another
      // refresh token, or it never recorded consent (an off-allowlist client, or
      // a silent prompt=none re-auth). Counted separately from a revocation so
      // the two can be told apart without inferring it from a rate.
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
