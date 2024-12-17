/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import InputPhoneNumber, { defaultCountries } from '.';
import { withLocalization } from 'fxa-react/lib/storybooks';
import { Meta } from '@storybook/react';
import AppLayout from '../AppLayout';
import { Subject } from './mocks';

export default {
  title: 'Components/InputPhoneNumber',
  component: InputPhoneNumber,
  decorators: [withLocalization],
} as Meta;

export const Default = () => <Subject />;

export const WithMoreOptions = () => {
  const extendedCountryOptions = [
    ...defaultCountries,
    {
      id: 100,
      code: '+44',
      classNameFlag: 'bg-flag-usa',
      name: 'Murica',
    },
    {
      id: 101,
      code: '+11',
      classNameFlag: 'bg-flag-canada',
      name: 'Sorry Canada',
    },
    {
      id: 103,
      code: '+50',
      classNameFlag: 'bg-flag-usa',
      name: 'Eagle Country',
    },
    {
      id: 104,
      code: '+27',
      classNameFlag: 'bg-flag-canada',
      name: 'Maple Country',
    },
  ];
  return <Subject countries={extendedCountryOptions} />;
};
