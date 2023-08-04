/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createHistory, createMemorySource, History } from '@reach/router';
import {
  ModelDataStore,
  StorageData,
  UrlHashData,
  UrlQueryData,
} from '../../../lib/model-data';
import { MozServices } from '../../../lib/types';
import { Account, Integration } from '../../../models';
import { mockAppContext, MOCK_ACCOUNT } from '../../../models/mocks';
import { ReachRouterWindow } from '../../../lib/window';
import AuthClient from 'fxa-auth-client/browser';
import { OAuthClient } from '../../../lib/oauth';
import { IntegrationFactory } from '../../../lib/integrations';
import { mockUrlQueryData } from '../../mocks';

const fxDesktopV3ContextParam = { context: 'fx_desktop_v3' };

export const defaultUrlQueryParams: Record<string, any> = {
  uid: MOCK_ACCOUNT.uid,
  email: MOCK_ACCOUNT.primaryEmail.email,
  emailToHashWith: MOCK_ACCOUNT.primaryEmail.email,
  token: '1111111111111111111111111111111111111111111111111111111111111111',
  code: '11111111111111111111111111111111',
  subscriptionProductName: '',
  subscriptionProductId: '',
  ...fxDesktopV3ContextParam,
};

export const defaultLocationState: Record<string, any> = {
  kB: '123',
  accountResetToken: '123',
  recoveryKeyId: '123',
};

export const syncIntegrationUrlQueryData = mockUrlQueryData({
  ...fxDesktopV3ContextParam,
});

export function mockAccount() {
  return {
    ...MOCK_ACCOUNT,
    setLastLogin: () => {},
    resetPasswordWithRecoveryKey: () => {},
    resetPassword: () => {},
    isSessionVerified: () => true,
  } as unknown as Account;
}

export const MOCK_RESET_DATA = {
  authAt: 12345,
  keyFetchToken: 'keyFetchToken',
  sessionToken: 'sessionToken',
  unwrapBKey: 'unwrapBKey',
  verified: true,
};
