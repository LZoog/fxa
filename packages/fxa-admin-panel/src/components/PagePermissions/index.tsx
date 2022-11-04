/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { IFeatureFlag } from 'fxa-shared/guards';
import { useUserContext } from '../../hooks/UserContext';
import { useGuardContext } from '../../hooks/GuardContext';
import { TableRowYHeader, TableYHeaders } from '../TableYHeaders';
import { TableRowXHeader, TableXHeaders } from '../TableXHeaders';

export const PermissionsTable = ({
  featureFlags,
}: {
  featureFlags: IFeatureFlag[];
}) => {
  return featureFlags.length === 0 ? (
    <></>
  ) : (
    <TableXHeaders rowHeaders={['Feature', 'Enabled']} borderL={false}>
      <>
        {featureFlags.map((flag) => {
          const testId = `permissions-row-${flag.id}`;
          return (
            <TableRowXHeader key={flag.id} {...{ testId }}>
              <span data-testid={`${testId}-label`}>{flag.name}</span>
              <p data-testid={`${testId}-value`} className="text-center">
                {flag.enabled ? '✅' : '❌'}
              </p>
            </TableRowXHeader>
          );
        })}
      </>
    </TableXHeaders>
  );
};

export const PagePermissions = () => {
  const { user } = useUserContext();
  const { guard } = useGuardContext();

  const featureFlags: IFeatureFlag[] = guard.getFeatureFlags(user.group);

  return (
    <div className="text-grey-900">
      <h2 className="header-page">Permissions</h2>
      <p>
        This page displays your current user, group, and associated permissions.
      </p>

      <hr />

      <TableYHeaders borderL={false}>
        <TableRowYHeader
          header="Signed In As"
          value={user.email}
          testId="permissions-user-email"
        />
        <TableRowYHeader
          header="Your Group"
          value={user.group.name}
          testId="permissions-user-group"
        />
      </TableYHeaders>

      <PermissionsTable {...{ featureFlags }} />
    </div>
  );
};

export default Permissions;
