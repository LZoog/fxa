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
import path from 'path';
// import fs from 'fs';

export const viewName = 'legal-terms';

// const LEGAL_DOCS_ROOT = path.dirname(require.resolve('legal-docs/package.json'));

// fs.readdir(LEGAL_DOCS_ROOT, (err, directories) => {
//   if (err) {
//     console.error(err);
//     return;
//   }

//   for (const directory of directories) {
//     const directoryPath = path.join(LEGAL_DOCS_ROOT, directory);
//     fs.stat(directoryPath, (err, stats) => {
//       if (err) {
//         console.error(err);
//         return;
//       }
//       if (stats.isDirectory()) {
//         const filePath = path.join(directoryPath, 'firefox_cloud_services_tos.md');
//         fs.access(filePath, fs.constants.F_OK, (err) => {
//           if (!err) {
//             console.log(`Directory "${directory}" contains file firefox_cloud_services_tos.md`);
//           }
//         });
//       }
//     });
//   }
// });

// or......

// import fs from 'fs';
// import path from 'path';
// import glob from 'glob';

// const LEGAL_DOCS_ROOT = path.dirname(require.resolve('legal-docs/package.json'));

// glob(`${LEGAL_DOCS_ROOT}/*/firefox_cloud_services_tos.md`, (err, files) => {
//   if (err) {
//     console.error(err);
//     return;
//   }

//   for (const file of files) {
//     const directory = path.dirname(file);
//     console.log(`Directory "${path.basename(directory)}" contains file firefox_cloud_services_tos.md`);
//   }
// });

const LegalTerms = (_: RouteComponentProps) => {
  // usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const canGoBack = true; // TODO

  const acceptLanguage = navigator.languages.join(', ');

  // get supportedLanguages
  // const locale = determineLocale(acceptLang)
  // const currentLocales = parseAcceptLanguage(navigator.languages.join(', '));

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
