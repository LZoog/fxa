/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import InputPhoneNumber, { defaultCountries } from '.';
import { useForm } from 'react-hook-form';
import AppLayout from '../AppLayout';

export const Subject = ({ countries = defaultCountries }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <AppLayout>
      <InputPhoneNumber {...{ register, countries }} />
    </AppLayout>
  );
};
