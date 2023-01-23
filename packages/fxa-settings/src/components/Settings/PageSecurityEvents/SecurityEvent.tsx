/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FtlMsg } from 'fxa-react/lib/utils';

enum SecurityEventName {
  Create = 'account.create',
  Disable = 'account.disable',
  Enable = 'account.enable',
  Login = 'account.login',
  Reset = 'account.reset',
  ClearBounces = 'account.clearBounces',
}

const getSecurityEventNameL10n = (name: SecurityEventName) => {
  if (name === SecurityEventName.Create) {
    return {
      ftlId: 'security-name-event-create',
      fallbackText: 'Account was created',
    };
  }
  if (name === SecurityEventName.Disable) {
    return {
      ftlId: 'security-events-account-disable',
      fallbackText: 'Account was disabled',
    };
  }
  return { ftlId: '', fallbackText: '' };
};

export function SecurityEvent({
  name,
  createdAt,
  verified,
}: {
  name: SecurityEventName;
  createdAt: number;
  verified?: boolean;
}) {
  const createdAtDateText = Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(createdAt));

  const { ftlId, fallbackText } = getSecurityEventNameL10n(name);

  return (
    <li className="mt-5 ml-4">
      <div className="absolute w-3 h-3 bg-green-600 rounded-full mt-1.5 -left-1.5 border border-green-700"></div>
      <time className="text-grey-900 text-s mobileLandscape:mt-3">
        {createdAtDateText}
      </time>
      <FtlMsg id={ftlId}>
        <p className="text-grey-400 text-xs mobileLandscape:mt-3">
          {fallbackText}
        </p>
      </FtlMsg>
    </li>
  );
}
export default SecurityEvent;
