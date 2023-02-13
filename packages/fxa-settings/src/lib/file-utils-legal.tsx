/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import path from 'path';
import { parseAcceptLanguage } from '../../../fxa-shared/l10n/parseAcceptLanguage';

export enum LegalDocFile {
  privacy = 'firefox_privacy_notice',
  terms = 'firefox_cloud_services_tos',
}

const LEGAL_DOCS_PATH = '/settings/legal-docs';

// const LEGAL_DOCS_ROOT = path.dirname(
//   require.resolve('legal-docs/package.json')
// );

//
export const fetchLegalMd = async (
  acceptLanguages: readonly string[],
  file: LegalDocFile
) => {
  // const availableLocales

  let availableLocales;
  try {
    const response = await fetch(`${LEGAL_DOCS_PATH}/${file}_locales.json`);
    availableLocales = await response.json();
    console.log('availableLocales', availableLocales);
  } catch (e) {
    // report to Sentry, go with default locales
    console.log('no fetchy fetch json');
    return 'json error';
  }

  const acceptLanguage = parseAcceptLanguage(
    acceptLanguages.join(', '),
    availableLocales
  );

  try {
    const response = await fetch(
      `${LEGAL_DOCS_PATH}/${acceptLanguage}/${file}.md`
    );
    // const response = await fetch(`${legalDocs}/${locale}/${file}.md`);
    console.log('response', response);
    const markdown = await response.text();
    console.log('markdown', markdown);
    return markdown;
  } catch (e) {
    // report to Sentry, try next locale
    console.log('no fetchy fetch md');
    return 'md error';
  }
};
