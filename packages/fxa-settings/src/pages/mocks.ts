/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UrlQueryData } from '../lib/model-data';
import { MozServices } from '../lib/types';
import { ReachRouterWindow } from '../lib/window';

export const MOCK_UID = 'abc123';
export const MOCK_REDIRECT_URI = 'http://localhost:8080/123Done';
export const MOCK_SERVICE = MozServices.FirefoxMonitor;

export function mockUrlQueryData(params: Record<string, string>) {
  const window = new ReachRouterWindow();
  const data = new UrlQueryData(window);
  for (const param of Object.keys(params)) {
    data.set(param, params[param]);
  }
  return data;
}
