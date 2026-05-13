/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import { FtlMsg } from 'fxa-react/lib/utils';
import React, { useEffect, useState } from 'react';
import AppLayout from '../../../components/AppLayout';
import CardHeader from '../../../components/CardHeader';
import TermsPrivacyAgreement from '../../../components/TermsPrivacyAgreement';
import ThirdPartyAuth from '../../../components/ThirdPartyAuth';
import GleanMetrics from '../../../lib/glean';
import { useNavigateWithQuery } from '../../../lib/hooks/useNavigateWithQuery';
import Banner from '../../../components/Banner';
import { SigninThirdPartyProps } from '../interfaces';
import SigninUserBlock from '../SigninUserBlock';

export const viewName = 'signin';

// Third-party-auth-only signin: user has a linked account (Google/Apple) but
// no password set, so the only meaningful action is to authenticate via the
// linked provider. No password input, no Sign-in button — just ThirdPartyAuth
// buttons and the option to switch accounts.
const SigninThirdParty = ({
  integration,
  email,
  serviceName,
  avatarData,
  avatarLoading,
  flowQueryParams,
  localizedErrorFromLocationState,
  localizedSuccessBannerHeading,
  localizedSuccessBannerDescription,
  isSignedIntoFirefox = false,
  setCurrentSplitLayout,
}: SigninThirdPartyProps & RouteComponentProps) => {
  const navigateWithQuery = useNavigateWithQuery();
  const clientId = integration.getClientId();
  const legalTerms = integration.getLegalTerms();

  const [localizedBannerError] = useState(
    localizedErrorFromLocationState || ''
  );

  // Same hide rule as the password view: Desktop's merge warning blocks
  // account switching, so the link would lead to a dead end. Mobile users
  // see the link.
  const hideAccountSwitchLink =
    isSignedIntoFirefox && integration.isFirefoxDesktopClient();

  useEffect(() => {
    // TODO: linked-passwordless users were historically tracked under
    // cachedLogin.view (alongside true cached signins) because they share
    // the simplified header. Preserved here to avoid distorting the metric;
    // a dedicated event would be a follow-up coordinated with data science.
    GleanMetrics.cachedLogin.view({ event: { thirdPartyLinks: true } });
  }, []);

  const cmsInfo = integration.getCmsInfo();
  // Linked-passwordless reuses the cached page's "Sign in" framing — same
  // header text, same CMS surface — since there's no password to enter.
  const cachedPageCms = cmsInfo?.SigninCachedPage;
  const signinPageCms = cmsInfo?.SigninPage;
  const title = cachedPageCms?.pageTitle;
  const splitLayout = cachedPageCms
    ? cachedPageCms.splitLayout
    : signinPageCms?.splitLayout;
  const additionalAccessibilityInfo =
    cmsInfo?.shared.additionalAccessibilityInfo;

  return (
    <AppLayout {...{ cmsInfo, title, splitLayout, setCurrentSplitLayout }}>
      {(localizedSuccessBannerHeading || localizedSuccessBannerDescription) && (
        <Banner
          type="success"
          content={{
            localizedHeading: localizedSuccessBannerHeading || '',
            localizedDescription: localizedSuccessBannerDescription || '',
          }}
        />
      )}
      <CardHeader
        headingText="Sign in"
        headingTextFtlId="signin-header"
        subheadingWithDefaultServiceFtlId="signin-subheader-without-logo-default"
        subheadingWithCustomServiceFtlId="signin-subheader-without-logo-with-servicename"
        {...{
          clientId,
          serviceName,
          cmsLogoUrl: cmsInfo?.shared.logoUrl,
          cmsLogoAltText: cmsInfo?.shared.logoAltText,
          cmsHeadline: cachedPageCms?.headline,
          cmsDescription: cachedPageCms?.description,
          cmsHeadlineFontSize: cmsInfo?.shared.headlineFontSize,
          cmsHeadlineTextColor: cmsInfo?.shared.headlineTextColor,
        }}
      />
      {localizedBannerError && (
        <Banner
          type="error"
          content={{ localizedHeading: localizedBannerError }}
        />
      )}
      <SigninUserBlock
        {...{
          email,
          avatarData,
          avatarLoading,
          additionalAccessibilityInfo,
        }}
      />

      <ThirdPartyAuth
        showSeparator={true}
        separatorType="signInWith"
        {...{ viewName, flowQueryParams }}
      />

      <TermsPrivacyAgreement legalTerms={legalTerms} />

      <div className="flex flex-col mt-8 tablet:justify-between tablet:flex-row">
        {!hideAccountSwitchLink && (
          <FtlMsg id="signin-use-a-different-account-link">
            <a
              href="/"
              className="text-sm link-blue cursor-pointer mb-4 mx-auto tablet:mx-0 tablet:mb-0"
              onClick={(e) => {
                e.preventDefault();
                GleanMetrics.login.diffAccountLinkClick();

                // Some RPs may specify an email address in the query params which
                // we prioritize. Users attempting to change their email address is a signal
                // that the email in query params is not correct.
                const searchParams = new URLSearchParams(
                  window.location.search
                );
                searchParams.delete('email');
                navigateWithQuery(`/?${searchParams.toString()}`, {
                  state: {
                    prefillEmail: email,
                  },
                });
              }}
            >
              Use a different account
            </a>
          </FtlMsg>
        )}
      </div>
    </AppLayout>
  );
};

export default SigninThirdParty;
