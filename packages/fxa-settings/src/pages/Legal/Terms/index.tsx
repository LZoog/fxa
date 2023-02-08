/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import AppLayout from '../../../components/AppLayout';
import { RouteComponentProps } from '@reach/router';
import { FtlMsg } from 'fxa-react/lib/utils';
import { logViewEvent, usePageViewEvent } from '../../../lib/metrics';
import CardHeader from '../../../components/CardHeader';
import { REACT_ENTRYPOINT } from '../../../constants';
import { navigate } from '@reach/router';

export const viewName = 'legal-terms';

const LegalTerms = (_: RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const canGoBack = true; // TODO

  /* TODO: error state */

  const buttonHandler = () => {
    logViewEvent(`flow.${viewName}`, 'back', REACT_ENTRYPOINT);
    navigate(-1);
  };

  // get the accept language
  // get list of locales (must look for dir names + file name)
  // use `determineLocale(acceptLanguage, availableLocales)` to find the best option
  // read the MD file with the best locale option
  // send into react-markdown, render, profit???

  return (
    <AppLayout>
      <CardHeader
        headingTextFtlId="legal-terms-header"
        headingText="Terms of Service"
      />

      <p>MD stuff goes here</p>

      {canGoBack && (
        <div className="flex">
          <FtlMsg id="cookies-disabled-button-try-again">
            <button className="cta-primary cta-xl" onClick={buttonHandler}>
              Back
            </button>
          </FtlMsg>
        </div>
      )}
    </AppLayout>
  );
};

export default LegalTerms;
