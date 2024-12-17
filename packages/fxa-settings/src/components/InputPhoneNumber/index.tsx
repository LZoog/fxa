/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import InputText from '../InputText';
import { useFtlMsgResolver } from '../../models';
import { InputModeEnum } from '../FormVerifyCode';
import { UseFormMethods } from 'react-hook-form';

interface Country {
  id: number;
  code: string;
  classNameFlag: string;
  name: string;
  validationPattern: RegExp;
}

// North American Numbering Plan (NANP) countries are 123-123-1234.
// This allows for any and all characters so users can type spaces,
// dashes, parenthesis etc. but keeps the number of digits to 10.
const phoneValidationNorthAmerica = /^(?:\D*\d){10}\D*$/;

export const defaultCountries = [
  // We need an id because country codes can be the same, and countries
  // can have multiple country codes, so 'name' isn't necessarily unique
  {
    id: 1,
    code: '+1',
    classNameFlag: 'bg-flag-usa',
    name: 'United States',
    validationPattern: phoneValidationNorthAmerica,
  },
  {
    id: 2,
    code: '+1',
    classNameFlag: 'bg-flag-canada',
    name: 'Canada',
    validationPattern: phoneValidationNorthAmerica,
  },
];

const InputPhoneNumber = ({
  countries = defaultCountries,
  register,
}: {
  countries?: Country[];
  register: UseFormMethods['register'];
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const ftlMsgResolver = useFtlMsgResolver();
  const localizedLabel = ftlMsgResolver.getMsg(
    'input-phone-number-enter-number',
    'Enter phone number'
  );

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(
      (country) => country.id === parseInt(event.target.value, 10)
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
        className={`bg-transparent border border-grey-200 rounded-md py-2 ps-10 w-[60px] me-2 focus:border-blue-400 focus:outline-none focus:shadow-input-blue-focus ${selectedCountry.classNameFlag} bg-no-repeat bg-[length:1.5rem_1rem] bg-[40%_50%]`}
      >
        {/* Selected country is always first */}
        <option className={`${selectedCountry.classNameFlag} bg-contain`}>
          {selectedCountry.name} ({selectedCountry.code})
        </option>

        {/* Note, at the time of writing we're using react-dom 18.3 which complains about
        <hr> inside <select> being invalid, but it is valid. This should be fixed in later
         versions: https://github.com/facebook/react/issues/27572 */}
        <hr className="my-1" />

        {countries
          .filter((country) => country.id !== selectedCountry.id)
          .map((country) => (
            <option
              key={country.id}
              value={country.id}
              className={`${country.classNameFlag} bg-contain`}
            >
              {country.name} ({country.code})
            </option>
          ))}
      </select>

      {/* Because the country code may not be unique, the above `select`'s `value` must
       be by country ID. This hidden input allows us to access it in the form data. */}
      <input
        type="hidden"
        name="countryCode"
        value={selectedCountry.code}
        ref={register}
      />

      {/* Using `type="text" inputmode="numeric"` shows the numeric keyboard on mobile
      and strips out whitespace on desktop, but does not add an incrementer. */}
      <InputText
        name="phoneNumber"
        type="text"
        inputMode={InputModeEnum.numeric}
        label={localizedLabel}
        autoFocus
        required
        className="text-start w-full"
        anchorPosition="start"
        autoComplete="off"
        spellCheck={false}
        tooltipPosition="bottom"
        inputRef={register({
          required: true,
          pattern: selectedCountry.validationPattern,
        })}
      />
    </div>
  );
};

export default InputPhoneNumber;
