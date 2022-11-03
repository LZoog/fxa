/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { Children, ReactElement } from 'react';

interface TableXHeadersProps {
  header?: string;
  rowHeaders: string[];
  testId?: string;
  children:
    | ReactElement<TableRowXHeaderProps>
    | ReactElement<TableRowXHeaderProps>[];
}

interface TableRowXHeaderProps {
  children: ReactElement | ReactElement[];
}

export const TableRowXHeader = ({ children }: TableRowXHeaderProps) => {
  const arrayElements = Children.toArray(children);
  return (
    <tr>
      {arrayElements.map((element) => (
        <td className="table-td border-r">{element}</td>
      ))}
    </tr>
  );
};

export const TableXHeaders = ({
  header,
  rowHeaders,
  children,
  testId,
}: TableXHeadersProps) => (
  <>
    {header && <h3 className="header-lg">{header}</h3>}
    <table className="table-x-headers" data-testid={testId}>
      <thead>
        <tr>
          {rowHeaders.map((rowHeader) => (
            <th className="table-th">{rowHeader}</th>
          ))}
        </tr>
      </thead>

      <tbody>{children}</tbody>
    </table>
  </>
);
