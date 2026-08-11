/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { OAuthNativeClients } from '@fxa/accounts/oauth';

import {
  revokeConsentsOnDisconnect,
  RevokeConsentsOnDisconnectOauthDB,
} from './revoke-consents-on-disconnect';

const UID = 'a'.repeat(32);
const DESKTOP = OAuthNativeClients.FirefoxDesktop; // native
const WEB_RP = '98e6508e88680e1b'; // arbitrary non-native web RP (no enum)

function mockDb(rows = 1): jest.Mocked<RevokeConsentsOnDisconnectOauthDB> {
  return {
    deleteConsentsForClientIfUnused: jest.fn().mockResolvedValue(rows),
  };
}

function mockDeps(db: jest.Mocked<RevokeConsentsOnDisconnectOauthDB>) {
  return {
    oauthDB: db,
    statsd: { increment: jest.fn() },
    log: { warn: jest.fn() },
  };
}

describe('revokeConsentsOnDisconnect', () => {
  describe('when rows were revoked', () => {
    it('delegates to the db with the uid and clientId', async () => {
      const db = mockDb();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(db.deleteConsentsForClientIfUnused).toHaveBeenCalledWith(
        UID,
        DESKTOP
      );
    });

    it('counts a revocation tagged as a native client', async () => {
      const db = mockDb(3);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoked',
        { client_type: 'native' }
      );
    });

    it('tags a non-native client as other', async () => {
      const db = mockDb();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: WEB_RP });

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoked',
        { client_type: 'other' }
      );
    });

    it('tags an upper-case native clientId as native', async () => {
      const db = mockDb();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, {
        uid: UID,
        clientId: DESKTOP.toUpperCase(),
      });

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoked',
        { client_type: 'native' }
      );
    });

    it('does not log a warning', async () => {
      const db = mockDb();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.log.warn).not.toHaveBeenCalled();
    });
  });

  describe('when no rows were revoked', () => {
    it('counts a no-op rather than a revocation', async () => {
      const db = mockDb(0);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoke_noop',
        { client_type: 'native' }
      );
      expect(deps.statsd.increment).toHaveBeenCalledTimes(1);
    });
  });

  describe('when there is no OAuth client to revoke', () => {
    it('does not touch the db when clientId is absent', async () => {
      const db = mockDb();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID });

      expect(db.deleteConsentsForClientIfUnused).not.toHaveBeenCalled();
      expect(deps.statsd.increment).not.toHaveBeenCalled();
    });

    it('does not touch the db when uid is absent', async () => {
      const db = mockDb();
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, {
        uid: '',
        clientId: DESKTOP,
      });

      expect(db.deleteConsentsForClientIfUnused).not.toHaveBeenCalled();
      expect(deps.statsd.increment).not.toHaveBeenCalled();
    });
  });

  describe('when the first attempt fails', () => {
    it('retries once and revokes on the second attempt', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValueOnce(2);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(db.deleteConsentsForClientIfUnused).toHaveBeenCalledTimes(2);
      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoke_retried',
        { client_type: 'native' }
      );
      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoked',
        { client_type: 'native' }
      );
    });

    it('does not count a failure when the retry succeeds', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValueOnce(1);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.statsd.increment).not.toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        expect.anything()
      );
      expect(deps.log.warn).not.toHaveBeenCalled();
    });

    it('counts a no-op when the retry finds nothing to revoke', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValueOnce(0);
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoke_noop',
        { client_type: 'native' }
      );
    });
  });

  describe('when the db fails', () => {
    it('does not reject, so the disconnect still succeeds', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused.mockRejectedValue(
        new Error('ECONNREFUSED')
      );
      const deps = mockDeps(db);

      await expect(
        revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP })
      ).resolves.toBeUndefined();
    });

    it('gives up after two attempts', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused.mockRejectedValue(
        new Error('ECONNREFUSED')
      );
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(db.deleteConsentsForClientIfUnused).toHaveBeenCalledTimes(2);
    });

    it('counts the failure', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused.mockRejectedValue(
        new Error('ECONNREFUSED')
      );
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.statsd.increment).toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        { client_type: 'native' }
      );
    });

    it('logs the error message only, never the error object', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused.mockRejectedValue(
        new Error('ECONNREFUSED')
      );
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.log.warn).toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        { err: 'ECONNREFUSED' }
      );
    });

    it('stringifies a non-Error rejection', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused.mockRejectedValue('pool exhausted');
      const deps = mockDeps(db);

      await revokeConsentsOnDisconnect(deps, { uid: UID, clientId: DESKTOP });

      expect(deps.log.warn).toHaveBeenCalledWith(
        'accountAuthorization.revoke_failed',
        { err: 'pool exhausted' }
      );
    });
  });

  describe('without optional collaborators', () => {
    it('still revokes when statsd and log are absent', async () => {
      const db = mockDb();

      await revokeConsentsOnDisconnect(
        { oauthDB: db },
        {
          uid: UID,
          clientId: DESKTOP,
        }
      );

      expect(db.deleteConsentsForClientIfUnused).toHaveBeenCalledWith(
        UID,
        DESKTOP
      );
    });

    it('swallows a db failure when statsd and log are absent', async () => {
      const db = mockDb();
      db.deleteConsentsForClientIfUnused.mockRejectedValue(
        new Error('ECONNREFUSED')
      );

      await expect(
        revokeConsentsOnDisconnect(
          { oauthDB: db },
          {
            uid: UID,
            clientId: DESKTOP,
          }
        )
      ).resolves.toBeUndefined();
    });
  });
});
