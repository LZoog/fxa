/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { parseAcceptLanguage } from '../../../fxa-shared/l10n/parseAcceptLanguage';

export enum LegalDocFile {
  privacy = 'firefox_privacy_notice',
  terms = 'firefox_cloud_services_tos',
}

const LEGAL_DOCS_PATH = '/settings/legal-docs';

const fetchLegalMdByLocale = async (locale: string, file: LegalDocFile) => {
  try {
    const response = await fetch(`${LEGAL_DOCS_PATH}/${locale}/${file}.md`);
    const markdown = await response.text();
    return markdown;
  } catch (e) {
    // report to Sentry, try next locale
    console.log('no fetchy fetch md');

    // TODO: If the first preferred language can't be loaded, recursively try
    // the others and then fallback to English + clean this up
    if (locale !== 'en') {
      const response = await fetch(`${LEGAL_DOCS_PATH}/en/${file}.md`);
      const markdown = await response.text();
      return markdown;
    }
    // report to Sentry, try next locale
    console.log('no fetchy fetch fallback english md');
    return 'md error'; //todo
  }
};

export const fetchLegalMd = async (
  acceptLanguages: readonly string[],
  localeParam: string | undefined,
  file: LegalDocFile
) => {
  let availableLocales;
  try {
    const response = await fetch(`${LEGAL_DOCS_PATH}/${file}_locales.json`);
    availableLocales = await response.json();
  } catch (e) {
    // report to Sentry, go with default locales
    console.log('no fetchy fetch json');
    return 'json error'; //todo
  }

  const locales = parseAcceptLanguage(
    localeParam ? localeParam : acceptLanguages.join(', '),
    availableLocales
  );
  const locale = locales[0];
  return fetchLegalMdByLocale(locale, file);
};
