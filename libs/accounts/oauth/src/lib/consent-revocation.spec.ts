/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ScopeSet from 'fxa-shared/oauth/scopes';

import { consentRowsToRevoke, ConsentRow } from './consent-revocation';
import { OAuthNativeClients } from './oauth';

const DESKTOP = OAuthNativeClients.FirefoxDesktop;
const FENIX = OAuthNativeClients.Fenix;
const WEB_RP = '98e6508e88680e1b'; // arbitrary non-native web RP (no enum)

const VPN_SCOPE = 'https://identity.mozilla.com/apps/vpn';
const OLDSYNC_SCOPE = 'https://identity.mozilla.com/apps/oldsync';

// Mirrors the deployed shape of the peer config: every browser service lists the
// browser clients, and vpn/relay also list the service's own app.
const PEERS: Record<string, Set<string>> = {
  vpn: new Set([DESKTOP, FENIX, 'e6eb0d1e856335fc']),
  sync: new Set([DESKTOP, FENIX]),
};
const peerClientsForService = (service: string): Set<string> | undefined =>
  PEERS[service];

function row(over: Partial<ConsentRow> = {}): ConsentRow {
  return {
    scope: VPN_SCOPE,
    service: 'vpn',
    clientId: DESKTOP,
    lastAuthorizedTosAt: 1_700_000_000_000,
    ...over,
  };
}

function token(clientId: string, scopes: string[]) {
  return { clientId, scope: ScopeSet.fromArray(scopes) };
}

describe('consentRowsToRevoke', () => {
  it('revokes a row nothing sustains', () => {
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [],
        peerClientsForService,
      })
    ).toEqual([row()]);
  });

  it('keeps a row a peer client still covers', () => {
    // The user disconnected Desktop but still has a VPN-scoped Fenix token, and
    // Fenix is on the vpn allowlist, so the consent stands.
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [token(FENIX, ['profile', VPN_SCOPE])],
        peerClientsForService,
      })
    ).toEqual([]);
  });

  it('revokes when the only remaining token belongs to a non-peer client', () => {
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [token(WEB_RP, [VPN_SCOPE])],
        peerClientsForService,
      })
    ).toHaveLength(1);
  });

  it('revokes when a peer remains but does not carry the scope', () => {
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [token(FENIX, ['profile', OLDSYNC_SCOPE])],
        peerClientsForService,
      })
    ).toHaveLength(1);
  });

  it('applies the same peer rule to sync', () => {
    expect(
      consentRowsToRevoke({
        rows: [row({ scope: OLDSYNC_SCOPE, service: 'sync' })],
        clientId: DESKTOP,
        remainingTokens: [token(FENIX, [OLDSYNC_SCOPE])],
        peerClientsForService,
      })
    ).toEqual([]);
  });

  it('revokes a peer written row the disconnect leaves unsustained', () => {
    // Mobile consumes VPN by token exchange and never writes its own row, so
    // its disconnect has to be able to clear the Desktop-written one.
    const desktopRow = row();

    expect(
      consentRowsToRevoke({
        rows: [desktopRow],
        clientId: FENIX,
        remainingTokens: [],
        peerClientsForService,
      })
    ).toEqual([desktopRow]);
  });

  it('ignores rows for a service the client is not a peer of', () => {
    // Disconnecting a web RP must not reach into a browser service's ledger.
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: WEB_RP,
        remainingTokens: [],
        peerClientsForService,
      })
    ).toEqual([]);
  });

  it('partitions a mixed batch, returning only the unsustained rows', () => {
    const sustained = row();
    const unsustained = row({ scope: OLDSYNC_SCOPE, service: 'sync' });
    const notOurs = row({ scope: 'profile', service: '', clientId: WEB_RP });

    expect(
      consentRowsToRevoke({
        rows: [sustained, unsustained, notOurs],
        clientId: DESKTOP,
        remainingTokens: [token(FENIX, [VPN_SCOPE])],
        peerClientsForService,
      })
    ).toEqual([unsustained]);
  });

  describe('unparseable scopes', () => {
    it('keeps a row whose scope ScopeSet cannot parse', () => {
      // The column is NOT NULL DEFAULT '' and ScopeSet.contains('') throws.
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: '' })],
          clientId: DESKTOP,
          remainingTokens: [token(FENIX, [VPN_SCOPE])],
          peerClientsForService,
        })
      ).toEqual([]);
    });

    it('still revokes the other rows in the batch', () => {
      // Needs a remaining token: with none the predicate never runs, so nothing
      // throws and the bad row is revoked like any other.
      const unsustained = row({ scope: OLDSYNC_SCOPE, service: 'sync' });

      expect(
        consentRowsToRevoke({
          rows: [row({ scope: '' }), unsustained],
          clientId: DESKTOP,
          remainingTokens: [token(FENIX, [VPN_SCOPE])],
          peerClientsForService,
        })
      ).toEqual([unsustained]);
    });
  });

  describe('scope hierarchy', () => {
    it('keeps a narrow row covered by a broader remaining scope', () => {
      // smartwindow writes a profile:uid row; a peer token granted plain
      // `profile` covers it under ScopeSet implication.
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: 'profile:uid', service: 'sync' })],
          clientId: DESKTOP,
          remainingTokens: [token(FENIX, ['profile'])],
          peerClientsForService,
        })
      ).toEqual([]);
    });

    it('revokes a broad row when only a narrower scope remains', () => {
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: 'profile', service: 'sync' })],
          clientId: DESKTOP,
          remainingTokens: [token(FENIX, ['profile:email'])],
          peerClientsForService,
        })
      ).toHaveLength(1);
    });
  });

  it('falls back to the row own client when the allowlist is configured empty', () => {
    // An empty list is a write-rejection lever; reading it as "no peer may
    // revoke" would strand the service's existing rows forever.
    const empty = (service: string) =>
      service === 'vpn' ? new Set<string>() : undefined;

    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [],
        peerClientsForService: empty,
      })
    ).toEqual([row()]);
  });

  describe('services with no allowlist', () => {
    it('falls back to the row own client, so another client cannot sustain it', () => {
      // A web RP's row must not be kept alive by an unrelated Firefox token
      // carrying the same scope, or RP disconnects would stop revoking.
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: 'profile', service: '', clientId: WEB_RP })],
          clientId: WEB_RP,
          remainingTokens: [token(DESKTOP, ['profile'])],
          peerClientsForService,
        })
      ).toHaveLength(1);
    });

    it('keeps the row when the client itself still has a covering token', () => {
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: 'profile', service: '', clientId: WEB_RP })],
          clientId: WEB_RP,
          remainingTokens: [token(WEB_RP, ['profile'])],
          peerClientsForService,
        })
      ).toEqual([]);
    });
  });

  it('compares client ids case-insensitively', () => {
    // authorizedClients.destroy takes clientId straight from a request payload,
    // and rows come back as hex from the DB, so neither side is guaranteed
    // lowercase. A mismatch here would silently skip a revocation.
    expect(
      consentRowsToRevoke({
        rows: [row({ clientId: DESKTOP.toUpperCase() })],
        clientId: DESKTOP.toUpperCase(),
        remainingTokens: [token(FENIX.toUpperCase(), [VPN_SCOPE])],
        peerClientsForService,
      })
    ).toEqual([]);
  });
});
