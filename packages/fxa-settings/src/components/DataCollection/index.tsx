/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Localized } from '@fluent/react';
import React, { useState } from 'react';
// import { useAccount } from '../../models';

export const DataCollection = () => {
  // TODO: grab actual value here
  // const { telemetry }  = useAccount();
  const [telemetry, setTelemetry] = useState<boolean>(true);

  const handleTelemetryToggle = () => {
    setTelemetry(!telemetry);
  };

  return (
    <section className="mt-11" data-testid="settings-data-collection">
      <h2 className="font-header font-bold ltr:ml-4 rtl:mr-4 mb-4">
        <span id="connected-services" className="nav-anchor"></span>
        <Localized id="dc-heading">Data Collection and Use</Localized>
      </h2>
      <div className="bg-white tablet:rounded-xl shadow px-4 tablet:px-6 pt-7 pb-5">
        <div className="flex mb-4">
          <div className="flex-7">
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

          <div className="flex-1 text-center">
            <button
              role="switch"
              aria-checked={telemetry}
              id="telemetry"
              className="switch"
              title={telemetry ? 'Turn off' : 'Turn on'}
              onClick={handleTelemetryToggle}
            >
              <span className="slider"></span>
              <span className="slider-status">
                <span className="sr-only">Status: </span>
                {telemetry ? 'on' : 'off'}
              </span>
            </button>
            <label htmlFor="telemetry" className="sr-only">
              Analytics and Improvements
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataCollection;
