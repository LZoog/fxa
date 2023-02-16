/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { searchParams } from '../../../lib/utilities';

enum LinkStatus {
  damaged = 'damaged',
  expired = 'expired',
  valid = 'valid',
}

function parseLink(url: string) {
  const { email, token, code, uid } = searchParams(url);

  return {
    status,
    email,
    token,
    code,
    uid,
  };
}
