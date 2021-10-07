/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//  import { Localized } from '@fluent/react';
import React from 'react';

// TODO: remove 'showComponent' boolean when back-end is in place
export type DataCollectionProps = {
  showComponent?: boolean;
};

export const DataCollection = ({
  showComponent = false,
}: DataCollectionProps) => <>{showComponent ? 'hello' : null}</>;

export default DataCollection;
