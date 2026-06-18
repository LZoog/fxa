/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { OAuthNativeClients, OAuthNativeServices } from '@fxa/accounts/oauth';

import {
  deriveFirstAuthorization,
  ConsentRowLike,
} from './first-authorization';

const DESKTOP = OAuthNativeClients.FirefoxDesktop; // native
const IOS = OAuthNativeClients.FirefoxIOS; // native, different app
const WEB_RP = '98e6508e88680e1b'; // arbitrary non-native web RP (no enum)

function row(service: string, clientIdHex: string): ConsentRowLike {
  return { service, clientId: clientIdHex };
}

describe('deriveFirstAuthorization', () => {
  describe('browser service (native client)', () => {
    it('is true on the first authorization of the service', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          isNativeClient: true,
          existingConsents: [],
        })
      ).toBe(true);
    });

    it('is true even when the user already used a different service on the same client', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          isNativeClient: true,
          existingConsents: [row(OAuthNativeServices.Sync, DESKTOP)],
        })
      ).toBe(true);
    });

    it('is false on a repeat authorization of the service', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: OAuthNativeServices.SmartWindow,
          clientIdHex: DESKTOP,
          isNativeClient: true,
          existingConsents: [row(OAuthNativeServices.SmartWindow, DESKTOP)],
        })
      ).toBe(false);
    });

    it('is false when the prior consent for the service came from a different client (cross-device)', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: OAuthNativeServices.Vpn,
          clientIdHex: DESKTOP,
          isNativeClient: true,
          existingConsents: [row(OAuthNativeServices.Vpn, IOS)],
        })
      ).toBe(false);
    });
  });

  describe('web RP (non-native client, no resolved service)', () => {
    it('is true on the first authorization of the RP', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: '',
          clientIdHex: WEB_RP,
          isNativeClient: false,
          existingConsents: [],
        })
      ).toBe(true);
    });

    it('is true when the user has used a different RP before', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: '',
          clientIdHex: WEB_RP,
          isNativeClient: false,
          existingConsents: [row('', 'aaaaaaaaaaaaaaaa')],
        })
      ).toBe(true);
    });

    it('is false on a repeat authorization of the RP, regardless of scope', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: '',
          clientIdHex: WEB_RP,
          isNativeClient: false,
          existingConsents: [row('', WEB_RP)],
        })
      ).toBe(false);
    });
  });

  describe('ambiguous native client with no resolved service', () => {
    it('is false (not a marketing RP, service unknown)', () => {
      expect(
        deriveFirstAuthorization({
          serviceValue: '',
          clientIdHex: DESKTOP,
          isNativeClient: true,
          existingConsents: [],
        })
      ).toBe(false);
    });
  });
});
