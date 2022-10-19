/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { FtlMsg } from '../utils';

const SimpleComponent = (fallbackText: string) => (
  <FtlMsg id="simple-component">{fallbackText}</FtlMsg>
);

const ComponentWithAttrs = (fallbackText: string) => (
  <FtlMsg id="component-attrs" attrs={{ header: true }}>
    <div>
      <h2>{fallbackText}</h2>
    </div>
  </FtlMsg>
);

const ComponentWithVar = (fallbackText: string, name: string) => (
  <FtlMsg id="component-var" vars={{ name }}>
    <p>{fallbackText}</p>
  </FtlMsg>
);

describe('testL10n', () => {});
