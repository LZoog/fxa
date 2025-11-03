/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import useFxAStatus from '../../../lib/hooks/useFxAStatus';
import { Integration } from '../../../models';
import { NavigationOptions } from '../../Signin/interfaces';

export type SignupConfirmedSyncIntegration = Pick<
  Integration,
  'isDesktopSync' | 'getCmsInfo'
>;

export interface SignupConfirmedSyncProps {
  integration: SignupConfirmedSyncIntegration;
  offeredSyncEngines: ReturnType<typeof useFxAStatus>['offeredSyncEngines'];
}

export interface LocationState {
  origin?: NavigationOptions['origin'];
}
