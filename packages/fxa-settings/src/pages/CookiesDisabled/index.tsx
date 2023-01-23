/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { RouteComponentProps } from '@reach/router';
import { FtlMsg } from 'fxa-react/lib/utils';
import LinkExternal from 'fxa-react/components/LinkExternal';
import Storage from '../../lib/storage';
import Banner from '../../components/Banner';

const CookiesDisabled = (_: RouteComponentProps) => {
  const [stillDisabled, setStillDisabled] = useState(false);

  const buttonHandler = useCallback(() => {
    if (!Storage.isLocalStorageEnabled(window) || !navigator.cookieEnabled) {
      setStillDisabled(true);
    } else {
      window.history.back();
    }
  }, []);

  return (
    <AppLayout>
      <FtlMsg id="cookies-disabled-header">
        <h1 className="card-header mb-2">
          Cookies and local storage are required
        </h1>
      </FtlMsg>

      {stillDisabled && (
        <Banner type="error">
          <FtlMsg id="auth-error-1003">
            <p>Cookies are still disabled</p>
          </FtlMsg>
        </Banner>
      )}

      <FtlMsg id="cookies-disabled-enable-prompt">
        <p className="text-sm">
          Please enable cookies and local storage in your browser to access
          Firefox Accounts. Doing so will enable functionality such as
          remembering you between sessions.
        </p>
      </FtlMsg>

      <p className="my-6">
        <LinkExternal
          className="link-blue text-sm"
          href="https://support.mozilla.org/kb/cookies-information-websites-store-on-your-computer"
        >
          Learn more
        </LinkExternal>
      </p>

      <div className="flex">
        <FtlMsg id="cookies-disabled-try-again">
          <button className="cta-primary cta-xl" onClick={buttonHandler}>
            Try again
          </button>
        </FtlMsg>
      </div>
    </AppLayout>
  );
};

export default CookiesDisabled;
