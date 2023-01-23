/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import classNames from 'classnames';
import React, { ReactElement } from 'react';

type BannerType = 'info' | 'success' | 'error';

const Banner = ({
  type,
  children,
}: {
  type: BannerType;
  children: ReactElement;
}) => {
  const baseClassNames = 'text-xs font-bold p-3 my-3 rounded';

  return (
    <div
      className={classNames(
        baseClassNames,
        type === 'info' && 'bg-grey-50 text-black',
        type === 'success' && 'bg-green-500 text-grey-900',
        type === 'error' && 'bg-red-700 text-white'
      )}
    >
      {children}
    </div>
  );
};
export default Banner;
