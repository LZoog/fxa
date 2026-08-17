/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/** A consent row, as stored in accountAuthorizations. */
export interface ConsentRow {
  scope: string;
  service: string;
  clientId: string;
  lastAuthorizedTosAt: number;
}

export interface RemainingRefreshToken {
  clientId: string;
  /** A ScopeSet, so hierarchical scopes resolve correctly. */
  scope: { contains(scope: string): boolean };
}

export interface ConsentRowsToRevokeParams {
  /** Every consent row the user has. */
  rows: ConsentRow[];
  /** Hex client_id being disconnected. */
  clientId: string;
  /** The user's refresh tokens after the disconnect's deletes committed. */
  remainingTokens: RemainingRefreshToken[];
  /** Clients that share a service's consent, or undefined when unconfigured. */
  peerClientsForService: (service: string) => Set<string> | undefined;
}

/**
 * Consent rows that no peer of the disconnected client still sustains.
 *
 * The disconnected client judges every row whose peer group it belongs to, not
 * only rows it wrote itself — which is what lets a mobile disconnect clear a
 * Desktop-written row that mobile had only ever consumed by token exchange.
 * Membership cuts both ways: a client outside a row's peer group has no say over
 * it, and an unconfigured service has a peer group of just the row's own client,
 * so those rows stay reapable only by their own disconnect.
 *
 * Client ids are compared lowercased, since callers source them from both hex
 * DB columns and request payloads.
 */
export function consentRowsToRevoke(
  params: ConsentRowsToRevokeParams
): ConsentRow[] {
  const { rows, clientId, remainingTokens, peerClientsForService } = params;
  const target = clientId.toLowerCase();
  const tokens = remainingTokens.map((t) => ({
    clientId: t.clientId.toLowerCase(),
    scope: t.scope,
  }));

  return rows.filter((row) => {
    const owner = row.clientId.toLowerCase();
    // An empty allowlist is an operational lever for rejecting writes, not a
    // statement that nobody may revoke; reading it as a peer group of nobody
    // would strand the service's existing rows.
    const configured = peerClientsForService(row.service);
    const peers = configured?.size ? configured : new Set([owner]);
    if (!peers.has(target)) {
      return false;
    }
    try {
      return !tokens.some(
        (token) => peers.has(token.clientId) && token.scope.contains(row.scope)
      );
    } catch {
      // ScopeSet.contains throws on an unparseable scope, and the column is NOT
      // NULL DEFAULT ''. Keep the row rather than let one bad value abort the
      // batch and leave this account permanently un-revocable.
      return false;
    }
  });
}
