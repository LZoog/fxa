/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { LocationProvider } from '@reach/router';
import { MozServices } from '../../lib/types';
import { IntegrationType, OAuthIntegration } from '../../models';
import { IndexIntegration } from './interfaces';
import Index from '.';
import { MOCK_CLIENT_ID } from '../mocks';

class MockIndexWebIntegration implements IndexIntegration {
  type = IntegrationType.Web;
  isSync() {
    return false;
  }
  getService() {
    return undefined;
  }
  isOAuth(): this is OAuthIntegration {
    return false;
  }
}
export function createMockIndexWebIntegration(): IndexIntegration {
  return new MockIndexWebIntegration();
}

class MockIndexSyncIntegration implements IndexIntegration {
  type = IntegrationType.OAuth;
  clientId: string;
  constructor(clientId = MOCK_CLIENT_ID) {
    this.clientId = clientId;
  }
  isSync() {
    return true;
  }
  getService() {
    return this.clientId;
  }
  isOAuth(): this is OAuthIntegration {
    return true;
  }
}

export function createMockIndexSyncIntegration(): IndexIntegration {
  return new MockIndexSyncIntegration();
}

class MockIndexOAuthIntegration implements IndexIntegration {
  type = IntegrationType.OAuth;
  clientId: string;
  constructor(clientId = MOCK_CLIENT_ID) {
    this.clientId = clientId;
  }
  isSync() {
    return false;
  }
  getService() {
    return this.clientId;
  }
  isOAuth(): this is OAuthIntegration {
    return true;
  }
}

export function createMockIndexOAuthIntegration(): IndexIntegration {
  return new MockIndexOAuthIntegration();
}

export const Subject = ({
  integration = createMockIndexWebIntegration(),
  serviceName = MozServices.Default,
}: {
  integration?: IndexIntegration;
  serviceName?: MozServices;
}) => {
  return (
    <LocationProvider>
      <Index
        {...{
          integration,
          serviceName,
        }}
      />
    </LocationProvider>
  );
};
