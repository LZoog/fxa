/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useEffect, useState } from 'react';
import AppLayout from '../../../components/AppLayout';
import { RouteComponentProps } from '@reach/router';
import { FtlMsg } from 'fxa-react/lib/utils';
import { logViewEvent, usePageViewEvent } from '../../../lib/metrics';
import CardHeader from '../../../components/CardHeader';
import { REACT_ENTRYPOINT } from '../../../constants';
import { navigate } from '@reach/router';
import { fetchLegalMd, LegalDocFile } from '../../../lib/file-utils-legal';
import MarkdownLegal from '../../../components/MarkdownLegal';
import Banner, { BannerType } from '../../../components/Banner';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';

export const viewName = 'legal-terms';

const LegalTerms = ({ locale }: { locale?: string } & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const [terms, setTerms] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [hasH1, setHasH1] = useState(false);

  useEffect(() => {
    (async () => {
      const { markdown, error } = await fetchLegalMd(
        navigator.languages,
        locale,
        LegalDocFile.terms
      );
      if (markdown) {
        setTerms(markdown);
      }
      if (error) {
        setError(error);
      }
    })();
  }, [locale]);

  const buttonHandler = () => {
    logViewEvent(`flow.${viewName}`, 'back', REACT_ENTRYPOINT);
    navigate(-1);
  };

  return (
    <AppLayout widthClass="mobileLandscape:w-192">
      {!hasH1 && (
        <CardHeader
          headingTextFtlId="legal-terms-heading"
          headingText="Terms of Service"
        />
      )}

      {terms && (
        <article className="text-start">
          <MarkdownLegal markdown={terms} {...{ setHasH1 }} />
        </article>
      )}

      {!terms && error && (
        <Banner type={BannerType.error}>
          <FtlMsg id="app-general-err-message">{error}</FtlMsg>
        </Banner>
      )}

      {!terms && !error && (
        <LoadingSpinner imageClassName="w-10 h-10 animate-spin mx-auto" />
      )}

      <div className="flex mt-5">
        <FtlMsg id="legal-terms-back-button">
          <button className="cta-primary cta-xl" onClick={buttonHandler}>
            Back
          </button>
        </FtlMsg>
      </div>
    </AppLayout>
  );
};

export default LegalTerms;
