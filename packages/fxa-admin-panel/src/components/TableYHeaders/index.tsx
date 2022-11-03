/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { ReactElement } from 'react';
import { HIDE_ROW } from '../PageAccountSearch/Account';

interface TableYHeadersProps {
  header?: string;
  testId?: string;
  children:
    | ReactElement<TableRowYHeaderProps>
    | ReactElement<TableRowYHeaderProps>[];
}

interface TableRowYHeaderProps {
  header: string | ReactElement;
  value?: null | string | ReactElement | ReactElement[];
  testId?: string;
  className?: string;
}

export const TableRowYHeader = ({
  header,
  value,
  testId,
  className,
}: TableRowYHeaderProps) => {
  if (!value || value === 'Unknown' || value === HIDE_ROW) {
    return null;
  }

  return (
    <tr {...{ className }}>
      <th className="table-th text-left">{header}</th>
      <td data-testid={testId} className="table-td border-b">
        {value}
      </td>
    </tr>
  );
};

export const TableYHeaders = ({
  header,
  children,
  testId,
}: TableYHeadersProps) => (
  <>
    {header && <h3 className="header-lg">{header}</h3>}
    <table className="table-y-headers" data-testid={testId}>
      <tbody>{children}</tbody>
    </table>
  </>
);
