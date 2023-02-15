/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { determineLocale } from 'fxa-shared/l10n/determineLocale';
import sentryMetrics from 'fxa-shared/lib/sentry';

export enum LegalDocFile {
  privacy = 'firefox_privacy_notice',
  terms = 'firefox_cloud_services_tos',
}

const LEGAL_DOCS_PATH = '/settings/legal-docs';

// TODO: probably move this + clone script to gql-api to reduce network requests

const fetchLegalMdByLocale = async (locale: string, file: LegalDocFile) => {
  // use the general app error for now, might change when moving this to gql-api
  const error = 'Something went wrong. Please try again later.';

  try {
    const response = await fetch(`${LEGAL_DOCS_PATH}/${locale}/${file}.md`);
    if (response.ok) {
      return { markdown: await response.text() };
    } else {
      throw Error(response.statusText);
    }
  } catch (e) {
    sentryMetrics.captureException(e);

    // TODO: If the first preferred language can't be loaded, recursively try
    // the others and then fallback to English + clean this up
    if (locale !== 'en') {
      try {
        const response = await fetch(`${LEGAL_DOCS_PATH}/en/${file}.md`);
        if (response.ok) {
          return { markdown: await response.text() };
        }
      } catch (e) {
        sentryMetrics.captureException(e);
        return { error, markdown: undefined };
      }
    }
    return { error, markdown: undefined };
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
    // report to Sentry and allow default locales to be loaded
    sentryMetrics.captureException(e);
  }

  const locale = determineLocale(
    localeParam ? localeParam : acceptLanguages.join(', '),
    availableLocales
  );
  return fetchLegalMdByLocale(locale, file);
};
