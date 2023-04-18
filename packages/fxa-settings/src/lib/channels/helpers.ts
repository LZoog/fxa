/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AccountData } from '../../models';

const ALLOWED_LOGIN_FIELDS = [
  'declinedSyncEngines',
  'email',
  'keyFetchToken',
  'offeredSyncEngines',
  'sessionToken',
  'services',
  'uid',
  'unwrapBKey',
  'verified',
];

const REQUIRED_LOGIN_FIELDS = [
  'email',
  'keyFetchToken',
  'sessionToken',
  'uid',
  'unwrapBKey',
  'verified',
];

function hasRequiredLoginFields() {}

function getLoginData() {}

export function notifyFirefoxOfLogin(account: AccountData) {}
