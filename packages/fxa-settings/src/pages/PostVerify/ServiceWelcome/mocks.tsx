/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { LocationProvider } from '@reach/router';
import ServiceWelcome from '.';
import { ServiceWelcomeIntegration } from './interfaces';

export function createMockIntegration(): ServiceWelcomeIntegration {
  return {
    isFirefoxClientServiceVpn: () => true,
  };
}

export const Subject = ({
  integration = createMockIntegration(),
}: {
  integration?: ServiceWelcomeIntegration;
}) => (
  <LocationProvider>
    <ServiceWelcome {...{ integration }} />
  </LocationProvider>
);
