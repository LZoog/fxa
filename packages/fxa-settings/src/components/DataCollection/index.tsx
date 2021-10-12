/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Localized } from '@fluent/react';
import React from 'react';
// import { useAccount } from '../../models';

export const DataCollection = () => {
  // TODO: grab actual value here
  let telemetry = true;
  // const { telemetry }  = useAccount();

  const handleDataToggle = () => {
    console.log('clicked');
  };

  return (
    <section className="mt-11" data-testid="settings-data-collection">
      <h2 className="font-header font-bold ltr:ml-4 rtl:mr-4 mb-4">
        <span id="connected-services" className="nav-anchor"></span>
        <Localized id="dc-heading">Data Collection and Use</Localized>
      </h2>
      <div className="bg-white tablet:rounded-xl shadow px-4 tablet:px-6 pt-7 pb-5">
        <div className="flex justify-between mb-4">
          <div className="flex-5">
            <Localized id="dc-description">
              <h3 className="font-header mb-4">Analytics and Improvements</h3>
            </Localized>

            <p className="text-sm">
              Help Firefox Accounts improve its product and service by
              automatically sending interaction data with the Firefox accounts
              website. Data could include when you’re active with a Firefox
              service, on which types of devices, and if you’ve tried to turn on
              certain security features like two-step authentication.
            </p>
          </div>

          <div className="flex-1">
            <input
              type="checkbox"
              checked={telemetry}
              onClick={handleDataToggle}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataCollection;
