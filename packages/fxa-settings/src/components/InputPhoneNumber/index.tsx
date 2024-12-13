/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import InputText from '../InputText';
import { useFtlMsgResolver } from '../../models';
import { InputModeEnum } from '../FormVerifyCode';

const countries = [
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇨🇦', name: 'Canada' },
];

const InputPhoneNumber = () => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  const ftlMsgResolver = useFtlMsgResolver();
  const localizedLabel = ftlMsgResolver.getMsg(
    'input-phone-number-enter-number',
    'Enter phone number'
  );

  const handlePhoneNumberChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPhoneNumber(event.target.value);
  };

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(
      (country) => country.code === event.target.value
    );
    if (selected) {
      setSelectedCountry(selected);
    }
  };

  return (
    <div className="flex">
      <select
        onChange={handleCountryChange}
        value={selectedCountry.code}
        // TODO, use intended flag image and adjust spacing
        className="bg-transparent border border-grey-200 rounded-md py-2 pe-6 ps-3 w-[52px] me-2"
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name} ({country.code}){' '}
          </option>
        ))}
      </select>

      {/* Using `type="text" inputmode="numeric"` shows the numeric keyboard on mobile
      and strips out whitespace on desktop, but does not add an incrementer. */}
      <InputText
        name="code"
        type="text"
        inputMode={InputModeEnum.numeric}
        label={localizedLabel}
        onChange={handlePhoneNumberChange}
        // onFocusCb={viewName ? onFocus : undefined}
        // errorText={codeErrorMessage}
        autoFocus
        // pattern={formAttributes.pattern}
        // maxLength={formAttributes.maxLength}
        className="text-start"
        anchorPosition="start"
        autoComplete="off"
        spellCheck={false}
        // prefixDataTestId={viewName}
        tooltipPosition="bottom"
        // TODO, form hookup
        // inputRef={register({ required: true })}
      />
    </div>
  );
};

export default InputPhoneNumber;
