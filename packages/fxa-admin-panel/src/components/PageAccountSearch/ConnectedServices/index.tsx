/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import dateFormat from 'dateformat';
import { AttachedClient, Location } from 'fxa-admin-server/src/graphql';
import { DATE_FORMAT, HIDE_ROW } from '../Account';
import { TableRowYHeader } from '../../TableYHeaders';

export const NUMBER_OF_SERVICES_TO_SHOW = 3;

export const ConnectedServices = ({
  services,
}: {
  services?: Nullable<AttachedClient[]>;
}) => {
  if (services && services.length > 0) {
    if (services.length > NUMBER_OF_SERVICES_TO_SHOW) {
      return (
        <details>
          <summary className="hover:cursor-pointer text-violet-900 font-semibold mb-4">
            Toggle viewing {services.length} connected services
          </summary>
          {services.map((service) => (
            <ConnectedService
              key={`${service.name}-${service.createdTime}`}
              {...service}
            />
          ))}
        </details>
      );
    }
    return (
      <>
        {services.map((service) => (
          <ConnectedService
            key={`${service.name}-${service.createdTime}`}
            {...service}
          />
        ))}
      </>
    );
  }

  return (
    <li className="account-li account-border-info">
      This account has no connected services.
    </li>
  );
};

const ConnectedService = ({
  clientId,
  createdTime,
  createdTimeFormatted,
  deviceId,
  deviceType,
  lastAccessTime,
  lastAccessTimeFormatted,
  location,
  name,
  os,
  userAgent,
  sessionTokenId,
  refreshTokenId,
}: AttachedClient) => {
  const testId = (id: string) => `connected-service-${id}`;
  return (
    <div className="account-li account-border-info">
      <table className="pt-1">
        <tbody>
          <TableRowYHeader
            header="Client"
            value={format.client(name, clientId)}
            testId={testId('client')}
          />
          <TableRowYHeader
            header="Device Type"
            value={deviceType}
            testId={testId('device-type')}
          />
          <TableRowYHeader
            header="User Agent"
            value={userAgent}
            testId={testId('user-agent')}
          />
          <TableRowYHeader
            header="Operating System"
            value={os}
            testId={testId('os')}
          />
          <TableRowYHeader
            header="Created At"
            value={format.time(createdTime, createdTimeFormatted)}
            testId={testId('created-at')}
          />
          <TableRowYHeader
            header="Last Used"
            value={format.time(lastAccessTime, lastAccessTimeFormatted)}
            testId={testId('last-accessed-at')}
          />
          <TableRowYHeader
            header="Location"
            value={format.location(location)}
            testId={testId('location')}
          />
          <TableRowYHeader
            header="Client ID"
            value={clientId || HIDE_ROW}
            testId={testId('client-id')}
          />
          <TableRowYHeader
            header="Device ID"
            value={deviceId || HIDE_ROW}
            testId={testId('device-id')}
          />
          <TableRowYHeader
            header="Session Token ID"
            value={sessionTokenId || HIDE_ROW}
            testId={testId('session-token-id')}
          />
          <TableRowYHeader
            header="Refresh Token ID"
            value={refreshTokenId || HIDE_ROW}
            testId={testId('refresh-token-id')}
          />
        </tbody>
      </table>
    </div>
  );
};

const format = {
  location(location?: Nullable<Location>) {
    if (
      !location ||
      (!location.city &&
        !location.state &&
        !location.stateCode &&
        !location.country &&
        !location.countryCode)
    ) {
      return null;
    }

    return (
      <>
        {[
          location.city || <i>Unknown City</i>,
          location.state || location.stateCode || '',
          location.country || location.country || <i>Unknown Country</i>,
        ].join(', ')}
      </>
    );
  },
  time(raw?: Nullable<number>, formatted?: Nullable<string>) {
    if (!raw || raw < 1) return null;

    return (
      <>
        {dateFormat(new Date(raw), DATE_FORMAT)}
        {formatted ? <i> ({formatted})</i> : <></>}
      </>
    );
  },
  client(name?: Nullable<string>, clientId?: Nullable<string>) {
    return (
      <>
        {name} {clientId && <i>[{clientId}]</i>}
      </>
    );
  },
};
