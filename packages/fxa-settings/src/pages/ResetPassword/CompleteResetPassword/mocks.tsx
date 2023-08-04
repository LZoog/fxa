/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import { LinkStatus, LinkType } from 'fxa-settings/src/lib/types';
import CompleteResetPassword from '.';
import { Integration, IntegrationType } from '../../../models';
import { MOCK_ACCOUNT } from '../../../models/mocks';
import { CompleteResetPasswordLink } from '../../../models/reset-password/verification';
import {
  CompleteResetPasswordBaseIntegration,
  CompleteResetPasswordIntegration,
  CompleteResetPasswordOAuthIntegration,
} from './interfaces';
import { MOCK_UID } from '../../mocks';
import LinkValidator from '../../../components/LinkValidator';
import { ReachRouterWindow } from '../../../lib/window';
import { UrlQueryData } from '../../../lib/model-data';

// TODO: combine a lot of mocks with AccountRecoveryResetPassword
const fxDesktopV3ContextParam = { context: 'fx_desktop_v3' };

export const mockCompleteResetPasswordParams = {
  email: MOCK_ACCOUNT.primaryEmail.email,
  emailToHashWith: MOCK_ACCOUNT.primaryEmail.email,
  token: '1111111111111111111111111111111111111111111111111111111111111111',
  code: '11111111111111111111111111111111',
  uid: MOCK_ACCOUNT.uid,
};

export const paramsWithSyncDesktop = {
  ...mockCompleteResetPasswordParams,
  ...fxDesktopV3ContextParam,
};

export const paramsWithMissingEmail = {
  ...mockCompleteResetPasswordParams,
  email: '',
};

export const paramsWithMissingCode = {
  ...mockCompleteResetPasswordParams,
  code: '',
};

export const paramsWithMissingEmailToHashWith = {
  ...mockCompleteResetPasswordParams,
  emailToHashWith: '',
};

export const paramsWithMissingToken = {
  ...mockCompleteResetPasswordParams,
  token: '',
};

export const MOCK_RESET_DATA = {
  authAt: 12345,
  keyFetchToken: 'keyFetchToken',
  sessionToken: 'sessionToken',
  unwrapBKey: 'unwrapBKey',
  verified: true,
};

export function mockUrlQueryData(
  params: Record<string, string> = mockCompleteResetPasswordParams
) {
  const window = new ReachRouterWindow();
  const data = new UrlQueryData(window);
  for (const param of Object.keys(params)) {
    data.set(param, params[param]);
  }
  return data;
}

export const Subject = ({
  integrationType = IntegrationType.Web,
  params = mockCompleteResetPasswordParams,
}: {
  integrationType?: IntegrationType;
  params?: Record<string, string>;
}) => {
  const urlQueryData = mockUrlQueryData(params);

  let completeResetPasswordIntegration: CompleteResetPasswordIntegration;
  switch (integrationType) {
    case IntegrationType.OAuth:
      completeResetPasswordIntegration =
        createMockResetPasswordOAuthIntegration();
      break;
    case IntegrationType.SyncDesktop:
      completeResetPasswordIntegration =
        createMockResetPasswordSyncDesktopIntegration();
      break;
    case IntegrationType.Web:
    default:
      completeResetPasswordIntegration =
        createMockResetPasswordWebIntegration();
  }

  return (
    <LinkValidator
      linkType={LinkType['reset-password']}
      viewName={'complete-reset-password'}
      getParamsFromModel={() => {
        return new CompleteResetPasswordLink(urlQueryData);
      }}
      // TODO fix type
      integration={completeResetPasswordIntegration as Integration}
    >
      {({ setLinkStatus, params }) => (
        <CompleteResetPassword
          {...{ setLinkStatus, params }}
          integration={completeResetPasswordIntegration}
          finishOAuthFlowHandler={jest.fn()}
        />
      )}
    </LinkValidator>
  );
};

function createMockResetPasswordWebIntegration(): CompleteResetPasswordBaseIntegration {
  return {
    type: IntegrationType.Web,
  };
}

function createMockResetPasswordSyncDesktopIntegration(): CompleteResetPasswordBaseIntegration {
  return {
    type: IntegrationType.SyncDesktop,
  };
}

function createMockResetPasswordOAuthIntegration(): CompleteResetPasswordOAuthIntegration {
  return {
    type: IntegrationType.OAuth,
    data: {
      uid: MOCK_UID,
    },
  };
}
