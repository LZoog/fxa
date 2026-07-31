/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { OAuthNativeClients, OAuthNativeServices } from '@fxa/accounts/oauth';

import {
  dropUnconsentedSyncScope,
  excludeDauCacheKey,
} from './desktop-sync-consent-bandaid';

const SYNC_SCOPE = 'https://identity.mozilla.com/apps/oldsync';
const SMARTWINDOW_SCOPE = 'https://identity.mozilla.com/apps/smartwindow';
const DESKTOP = OAuthNativeClients.FirefoxDesktop;
const WEB_RP = '98e6508e88680e1b';

describe('dropUnconsentedSyncScope', () => {
  describe('Firefox Desktop signing into a non-Sync browser service', () => {
    it.each([
      OAuthNativeServices.SmartWindow,
      OAuthNativeServices.Relay,
      OAuthNativeServices.Vpn,
    ])('drops the Sync scope for service=%s', (serviceValue) => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE, SMARTWINDOW_SCOPE],
          serviceValue,
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SMARTWINDOW_SCOPE],
        droppedSyncScope: true,
      });
    });

    it('returns the remaining scopes when Sync was the only scope', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: [SYNC_SCOPE],
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({ scopes: [], droppedSyncScope: true });
    });

    it('drops the Sync scope the server added for a keys_jwe flow, since a password is not Sync consent', () => {
      // service=vpn + keys_jwe resolves to [apps/vpn, profile, apps/oldsync]
      // via keysConditionalScope. The user never saw anything about Sync.
      expect(
        dropUnconsentedSyncScope({
          scopes: [
            'https://identity.mozilla.com/apps/vpn',
            'profile',
            SYNC_SCOPE,
          ],
          serviceValue: OAuthNativeServices.Vpn,
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['https://identity.mozilla.com/apps/vpn', 'profile'],
        droppedSyncScope: true,
      });
    });

    it('matches the client id case-insensitively', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP.toUpperCase(),
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({ scopes: ['profile'], droppedSyncScope: true });
    });

    it('matches the service case-insensitively', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: 'SmartWindow',
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({ scopes: ['profile'], droppedSyncScope: true });
    });

    it('does not mutate the scopes it was given', () => {
      const scopes = ['profile', SYNC_SCOPE];
      dropUnconsentedSyncScope({
        scopes,
        serviceValue: OAuthNativeServices.Vpn,
        clientIdHex: DESKTOP,
        syncScope: SYNC_SCOPE,
      });
      expect(scopes).toEqual(['profile', SYNC_SCOPE]);
    });
  });

  describe('cases that must keep the Sync scope', () => {
    it('keeps it when the service is Sync in any casing', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: 'SYNC',
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SYNC_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('keeps it when Desktop signed into Sync itself', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: OAuthNativeServices.Sync,
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SYNC_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('keeps it when no service was resolved, since that means Sync by convention', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: '',
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SYNC_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('keeps it for a non-Desktop native client, which this bandaid leaves alone', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: OAuthNativeServices.Vpn,
          clientIdHex: OAuthNativeClients.Fenix,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SYNC_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('keeps it for a web RP', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: WEB_RP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SYNC_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('keeps everything when Sync has no configured canonical scope', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SYNC_SCOPE],
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          syncScope: undefined,
        })
      ).toEqual({
        scopes: ['profile', SYNC_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('reports no drop when the Sync scope was not requested', () => {
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', SMARTWINDOW_SCOPE],
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', SMARTWINDOW_SCOPE],
        droppedSyncScope: false,
      });
    });

    it('leaves an oldsync sub-scope alone, since the match is on the exact scope URL', () => {
      const subScope = `${SYNC_SCOPE}/bookmarks`;
      expect(
        dropUnconsentedSyncScope({
          scopes: ['profile', subScope],
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          syncScope: SYNC_SCOPE,
        })
      ).toEqual({
        scopes: ['profile', subScope],
        droppedSyncScope: false,
      });
    });
  });
});

describe('excludeDauCacheKey', () => {
  // Pins the literal format. Both consumers derive their expected key by
  // calling this function, so without this a prefix change would keep every
  // test green while orphaning in-flight Redis entries across a deploy —
  // silently dropping the exclude_dau tag for codes issued by the old version.
  it('namespaces the code hash under syncDauExclude', () => {
    expect(excludeDauCacheKey('ab'.repeat(32))).toBe(
      `syncDauExclude:${'ab'.repeat(32)}`
    );
  });
});
