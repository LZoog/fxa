/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useState } from 'react';
import InputText from '../InputText';
import { useFtlMsgResolver } from '../../models';
import { InputModeEnum } from '../FormVerifyCode';

const countries = [
  // We have to use an 'id' here because country codes can be the same, and countries
  // can have multiple country codes, so 'name' isn't necessarily unique
  { id: 1, code: '+1', flag: '🇺🇸', name: 'United States' },
  { id: 2, code: '+1', flag: '🇨🇦', name: 'Canada' },
  { id: 3, code: '+1', flag: '🏳️‍🌈', name: 'Testo Pesto' },
];

export const InputPhoneNumber = () => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleCountrySelect = (country: (typeof countries)[0]) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex relative">
      <div
        role="combobox"
        aria-expanded={isDropdownOpen}
        aria-controls="country-list"
        aria-owns="country-list"
        aria-activedescendant={`country-${selectedCountry.id}`}
        tabIndex={0}
      >
        <input
          type="text"
          // role="textbox"
          aria-autocomplete="list"
          // aria-controls="country-list"
          value={`${selectedCountry.flag}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          // onChange={(e) => setSearchTerm(e.target.value)}
          className="w-14 bg-transparent border border-grey-200 rounded-md py-2 pe-6 ps-3 me-2"
        />

        {isDropdownOpen && (
          <div
            id="country-list"
            role="listbox"
            className="absolute left-0 right-0 border border-grey-200 bg-white mt-1 rounded-md shadow-lg max-h-48 overflow-auto"
          >
            {countries
              .filter((country) => country.id !== selectedCountry.id)
              .map((country) => (
                <div
                  key={country.id}
                  role="option"
                  aria-selected={selectedCountry.id === country.id}
                  onClick={() => handleCountrySelect(country)}
                  className="px-3 py-2 text-gray-600 cursor-pointer hover:bg-blue-50"
                >
                  {country.flag} {country.name} ({country.code})
                </div>
              ))}
          </div>
        )}
      </div>

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

// Using native elements
export const InputPhoneNumberNative = () => {
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
        value={selectedCountry.id}
        // TODO, use intended flag image and adjust spacing
        className="bg-transparent border border-grey-200 rounded-md py-2 pe-6 ps-3 w-[52px] me-2"
      >
        {/* Selected country is always first */}
        <option>
          {selectedCountry.flag} {selectedCountry.name} ({selectedCountry.code})
        </option>
        <hr className="my-1" />

        {countries
          .filter((country) => country.id !== selectedCountry.id)
          .map((country) => (
            <option key={country.id} value={country.id}>
              {country.flag} {country.name} ({country.code})
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

// export default InputPhoneNumber;
