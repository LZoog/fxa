/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { OAuthNativeClients } from '@fxa/accounts/oauth';
import ScopeSet from 'fxa-shared/oauth/scopes';

import {
  consentRowsToRevoke,
  revokeConsentsOnDisconnect,
  ConsentRow,
  RevokeConsentsOnDisconnectOauthDB,
} from './revoke-consents-on-disconnect';

const UID = 'a'.repeat(32);
const DESKTOP = OAuthNativeClients.FirefoxDesktop;
const FENIX = OAuthNativeClients.Fenix;
const WEB_RP = '98e6508e88680e1b'; // arbitrary non-native web RP (no enum)

const VPN_SCOPE = 'https://identity.mozilla.com/apps/vpn';
const OLDSYNC_SCOPE = 'https://identity.mozilla.com/apps/oldsync';

// Mirrors the prod shape of oauthServer.exchange.allowedClientsForService:
// every browser service lists the browser clients, and vpn/relay also list the
// service's own app (the third member here).
const VPN_PEERS = new Set([DESKTOP, FENIX, 'e6eb0d1e856335fc']);
const SYNC_PEERS = new Set([DESKTOP, FENIX]);
const ALLOWLIST: Record<string, Set<string>> = {
  vpn: VPN_PEERS,
  sync: SYNC_PEERS,
};
const allowedClientsForService = (service: string) => ALLOWLIST[service];

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
        allowedClientsForService,
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
        allowedClientsForService,
      })
    ).toEqual([]);
  });

  it('revokes when the only remaining token belongs to a non-peer client', () => {
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [token(WEB_RP, [VPN_SCOPE])],
        allowedClientsForService,
      })
    ).toHaveLength(1);
  });

  it('revokes when a peer remains but does not carry the scope', () => {
    expect(
      consentRowsToRevoke({
        rows: [row()],
        clientId: DESKTOP,
        remainingTokens: [token(FENIX, ['profile', OLDSYNC_SCOPE])],
        allowedClientsForService,
      })
    ).toHaveLength(1);
  });

  it('applies the same peer rule to sync', () => {
    expect(
      consentRowsToRevoke({
        rows: [row({ scope: OLDSYNC_SCOPE, service: 'sync' })],
        clientId: DESKTOP,
        remainingTokens: [token(FENIX, [OLDSYNC_SCOPE])],
        allowedClientsForService,
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
        allowedClientsForService,
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
        allowedClientsForService,
      })
    ).toEqual([]);
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
          allowedClientsForService,
        })
      ).toEqual([]);
    });

    it('revokes a broad row when only a narrower scope remains', () => {
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: 'profile', service: 'sync' })],
          clientId: DESKTOP,
          remainingTokens: [token(FENIX, ['profile:email'])],
          allowedClientsForService,
        })
      ).toHaveLength(1);
    });
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
          allowedClientsForService,
        })
      ).toHaveLength(1);
    });

    it('keeps the row when the client itself still has a covering token', () => {
      expect(
        consentRowsToRevoke({
          rows: [row({ scope: 'profile', service: '', clientId: WEB_RP })],
          clientId: WEB_RP,
          remainingTokens: [token(WEB_RP, ['profile'])],
          allowedClientsForService,
        })
      ).toEqual([]);
    });
  });
});

function mockDb(
  over: Partial<jest.Mocked<RevokeConsentsOnDisconnectOauthDB>> = {}
): jest.Mocked<RevokeConsentsOnDisconnectOauthDB> {
  return {
    listAccountConsentsByUid: jest.fn().mockResolvedValue([
      {
        scope: VPN_SCOPE,
        service: 'vpn',
        clientId: Buffer.from(DESKTOP, 'hex'),
        lastAuthorizedTosAt: '1700000000000',
      },
    ]),
    getRefreshTokensByUid: jest.fn().mockResolvedValue([]),
    getAllowedClientsForService: jest.fn(allowedClientsForService),
    deleteAccountConsentRows: jest.fn().mockResolvedValue(1),
    ...over,
  } as jest.Mocked<RevokeConsentsOnDisconnectOauthDB>;
}

function mockDeps(db: jest.Mocked<RevokeConsentsOnDisconnectOauthDB>) {
  return {
    oauthDB: db,
    statsd: { increment: jest.fn() },
    log: { warn: jest.fn() },
  };
}

describe('revokeConsentsOnDisconnect', () => {
  const destroyed = { uid: UID, clientId: DESKTOP, destroyedRefreshTokens: 1 };

  it('deletes the rows nothing sustains, normalizing the buffer clientId', async () => {
    const db = mockDb();
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, destroyed);

    expect(db.deleteAccountConsentRows).toHaveBeenCalledWith(UID, [
      {
        scope: VPN_SCOPE,
        service: 'vpn',
        clientId: DESKTOP,
        lastAuthorizedTosAt: 1_700_000_000_000,
      },
    ]);
    expect(deps.statsd.increment).toHaveBeenCalledWith(
      'accountAuthorization.revoked',
      { client_type: 'native' }
    );
  });

  it('does not delete when a peer token sustains the row', async () => {
    const db = mockDb({
      getRefreshTokensByUid: jest.fn().mockResolvedValue([
        {
          clientId: Buffer.from(FENIX, 'hex'),
          scope: ScopeSet.fromArray([VPN_SCOPE]),
        },
      ]),
    });
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, destroyed);

    expect(db.deleteAccountConsentRows).not.toHaveBeenCalled();
    expect(deps.statsd.increment).toHaveBeenCalledWith(
      'accountAuthorization.revoke_noop',
      { client_type: 'native' }
    );
  });

  it('skips entirely when no refresh token was destroyed', async () => {
    // Firefox Desktop today: it has consent rows but no refresh tokens, so
    // finding none is not evidence of a disconnect.
    const db = mockDb();
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, {
      ...destroyed,
      destroyedRefreshTokens: 0,
    });

    expect(db.listAccountConsentsByUid).not.toHaveBeenCalled();
    expect(db.deleteAccountConsentRows).not.toHaveBeenCalled();
    expect(deps.statsd.increment).toHaveBeenCalledWith(
      'accountAuthorization.revoke_skipped',
      { client_type: 'native', reason: 'no_refresh_token' }
    );
  });

  it('does not touch the db when clientId is absent', async () => {
    const db = mockDb();
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, {
      uid: UID,
      destroyedRefreshTokens: 1,
    });

    expect(db.listAccountConsentsByUid).not.toHaveBeenCalled();
    expect(deps.statsd.increment).not.toHaveBeenCalled();
  });

  it('does not touch the db when uid is absent', async () => {
    const db = mockDb();
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, {
      uid: '',
      clientId: DESKTOP,
      destroyedRefreshTokens: 1,
    });

    expect(db.listAccountConsentsByUid).not.toHaveBeenCalled();
    expect(deps.statsd.increment).not.toHaveBeenCalled();
  });

  it('counts a no-op when the delete matched nothing', async () => {
    // The optimistic lastAuthorizedTosAt guard rejected the row because a
    // concurrent authorization re-earned it.
    const db = mockDb({
      deleteAccountConsentRows: jest.fn().mockResolvedValue(0),
    });
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, destroyed);

    expect(deps.statsd.increment).toHaveBeenCalledWith(
      'accountAuthorization.revoke_noop',
      { client_type: 'native' }
    );
  });

  it('tags a non-native client as other', async () => {
    const db = mockDb({
      listAccountConsentsByUid: jest.fn().mockResolvedValue([
        {
          scope: 'profile',
          service: '',
          clientId: Buffer.from(WEB_RP, 'hex'),
          lastAuthorizedTosAt: 1,
        },
      ]),
    });
    const deps = mockDeps(db);

    await revokeConsentsOnDisconnect(deps, {
      uid: UID,
      clientId: WEB_RP,
      destroyedRefreshTokens: 1,
    });

    expect(deps.statsd.increment).toHaveBeenCalledWith(
      'accountAuthorization.revoked',
      { client_type: 'other' }
    );
  });

  describe('when the first attempt fails', () => {
    it('retries once and revokes on the second attempt', async () => {
      const db = mockDb();
      db.deleteAccountConsentRows
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValueOnce(2);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(db.deleteAccountConsentRows).toHaveBeenCalledTimes(2);
      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoke_retried',
        { client_type: 'native' }
      );
      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoked',
        { client_type: 'native' }
      );
    });

    it('re-reads on the retry rather than replaying a stale decision', async () => {
      const db = mockDb();
      db.deleteAccountConsentRows
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValueOnce(1);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(db.listAccountConsentsByUid).toHaveBeenCalledTimes(2);
      expect(db.getRefreshTokensByUid).toHaveBeenCalledTimes(2);
    });

    it('does not count a failure when the retry succeeds', async () => {
      const db = mockDb();
      db.deleteAccountConsentRows
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValueOnce(1);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(deps.statsd.increment).not.toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        expect.anything()
      );
      expect(deps.log.warn).not.toHaveBeenCalled();
    });
  });

  describe('when the db fails', () => {
    const failing = () =>
      mockDb({
        listAccountConsentsByUid: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED')),
      });

    it('does not reject, so the disconnect still succeeds', async () => {
      const deps = mockDeps(failing());

      await expect(
        revokeConsentsOnDisconnect(deps, destroyed)
      ).resolves.toBeUndefined();
    });

    it('gives up after two attempts', async () => {
      const db = failing();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(db.listAccountConsentsByUid).toHaveBeenCalledTimes(2);
    });

    it('counts the failure', async () => {
      const deps = mockDeps(failing());

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        { client_type: 'native' }
      );
    });

    it('logs the error message only, never the error object', async () => {
      const deps = mockDeps(failing());

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(deps.log.warn).toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        { err: 'ECONNREFUSED' }
      );
    });

    it('stringifies a non-Error rejection', async () => {
      const deps = mockDeps(
        mockDb({
          listAccountConsentsByUid: jest
            .fn()
            .mockRejectedValue('pool exhausted'),
        })
      );

      await revokeConsentsOnDisconnect(deps, destroyed);

      expect(deps.log.warn).toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        { err: 'pool exhausted' }
      );
    });
  });

  describe('without optional collaborators', () => {
    it('still revokes when statsd and log are absent', async () => {
      const db = mockDb();

      await revokeConsentsOnDisconnect({ oauthDB: db }, destroyed);

      expect(db.deleteAccountConsentRows).toHaveBeenCalled();
    });

    it('swallows a db failure when statsd and log are absent', async () => {
      const db = mockDb({
        listAccountConsentsByUid: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED')),
      });

      await expect(
        revokeConsentsOnDisconnect({ oauthDB: db }, destroyed)
      ).resolves.toBeUndefined();
    });
  });
});
