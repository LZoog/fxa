/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useLocation } from '@reach/router';
import { useNavigateWithQuery } from '../../../lib/hooks/useNavigateWithQuery';
import { FtlMsg } from 'fxa-react/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../../components/AppLayout';
import CardHeader from '../../../components/CardHeader';
import TermsPrivacyAgreement from '../../../components/TermsPrivacyAgreement';
import { REACT_ENTRYPOINT } from '../../../constants';
import { AuthUiErrors } from '../../../lib/auth-errors/auth-errors';
import GleanMetrics from '../../../lib/glean';
import { usePageViewEvent } from '../../../lib/metrics';
import { useFtlMsgResolver, isWebIntegration } from '../../../models';
import { SigninCachedProps } from '../interfaces';
import { handleNavigation, ensureCanLinkAcountOrRedirect } from '../utils';
import { useWebRedirect } from '../../../lib/hooks/useWebRedirect';
import { getLocalizedErrorMessage } from '../../../lib/error-utils';
import Banner from '../../../components/Banner';
import CmsButtonWithFallback from '../../../components/CmsButtonWithFallback';
import { useConfig } from '../../../models';
import SigninUserBlock from '../SigninUserBlock';

export const viewName = 'signin';

const SigninCached = ({
  integration,
  email,
  sessionToken,
  serviceName,
  hasLinkedAccount,
  hasPassword,
  avatarData,
  avatarLoading,
  cachedSigninHandler,
  localizedErrorFromLocationState,
  finishOAuthFlowHandler,
  localizedSuccessBannerHeading,
  localizedSuccessBannerDescription,
  isSignedIntoFirefox = false,
  setCurrentSplitLayout,
  onSessionExpired,
}: SigninCachedProps & RouteComponentProps) => {
  const config = useConfig();
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const location = useLocation();
  const navigateWithQuery = useNavigateWithQuery();
  const ftlMsgResolver = useFtlMsgResolver();
  const webRedirectCheck = useWebRedirect(integration.data.redirectTo);

  const [localizedBannerError, setLocalizedBannerError] = useState(
    localizedErrorFromLocationState || ''
  );
  const [signinLoading, setSigninLoading] = useState<boolean>(false);

  const isSync = integration.isSync();
  const clientId = integration.getClientId();
  const legalTerms = integration.getLegalTerms();

  // Hide "Use a different account" when the user is signed into Firefox and a
  // Firefox service is requesting authorization. In these flows the active
  // browser account is bound (Desktop Relay/VPN/SmartWindow, Mobile
  // authorization), so account switching isn't a meaningful option here.
  // This is also why Mobile can safely send the `keys_optional` capability:
  // the only Mobile flows that trigger cached sign-in are ones where the user
  // can't reach the index page to switch accounts.
  const hideAccountSwitchLink =
    isSignedIntoFirefox &&
    integration.isFirefoxClient() &&
    !!integration.getService();

  const isServiceWithEmailVerification =
    !!clientId && config.servicesWithEmailVerification.includes(clientId);

  const { handleSubmit } = useForm({
    mode: 'onTouched',
    criteriaMode: 'all',
    defaultValues: { email },
  });

  useEffect(() => {
    GleanMetrics.cachedLogin.view({ event: { thirdPartyLinks: false } });
  }, []);

  const onSubmit = useCallback(async () => {
    setSigninLoading(true);
    GleanMetrics.cachedLogin.submit();

    const { data, error } = await cachedSigninHandler(sessionToken);

    if (data) {
      GleanMetrics.cachedLogin.success();

      // Sync merge check for cached signin
      if (
        (integration.isSync() || integration.isFirefoxNonSync()) &&
        !hasPassword &&
        !hasLinkedAccount
      ) {
        const canLink = await ensureCanLinkAcountOrRedirect({
          email,
          uid: data.uid,
          ftlMsgResolver,
          navigateWithQuery,
        });
        if (!canLink) {
          setSigninLoading(false);
          return;
        }
      }

      const navigationOptions = {
        email,
        signinData: {
          emailVerified: data.emailVerified,
          sessionVerified: data.sessionVerified,
          verificationMethod: data.verificationMethod,
          verificationReason: data.verificationReason,
          uid: data.uid,
          sessionToken,
        },
        integration,
        redirectTo:
          isWebIntegration(integration) && webRedirectCheck?.isValid
            ? integration.data.redirectTo
            : '',
        finishOAuthFlowHandler,
        queryParams: location.search,
        // Passwordless Sync accounts (OTP or third-party auth) need to navigate
        // to set_password within the webview, even on mobile clients. No webchannel
        // messages are sent (deferred until after password creation), so the webview
        // must handle navigation internally.
        performNavigation:
          (isSync && !hasPassword) || !integration.isFirefoxMobileClient(),
        isServiceWithEmailVerification,
        // Sync users in the cached path are passwordless (third-party auth or OTP);
        // defer web channel messages until after password creation.
        handleFxaLogin: !isSync,
        handleFxaOAuthLogin: !isSync,
        // Redirect passwordless Sync users to set_password after session verification.
        isSignInWithThirdPartyAuth: isSync,
      };
      const { error: navError } = await handleNavigation(navigationOptions);
      if (navError) {
        setLocalizedBannerError(
          getLocalizedErrorMessage(ftlMsgResolver, navError)
        );
      }
    }
    if (error) {
      const localizedErrorMessage = getLocalizedErrorMessage(
        ftlMsgResolver,
        error
      );
      if (error.errno === AuthUiErrors.SESSION_EXPIRED.errno) {
        // Container hoists us into the password view and carries this message
        // forward as the initial banner error.
        onSessionExpired(localizedErrorMessage);
        return;
      }
      setLocalizedBannerError(localizedErrorMessage);
      setSigninLoading(false);
    }
  }, [
    cachedSigninHandler,
    sessionToken,
    email,
    ftlMsgResolver,
    navigateWithQuery,
    integration,
    finishOAuthFlowHandler,
    isSync,
    location.search,
    webRedirectCheck,
    isServiceWithEmailVerification,
    hasLinkedAccount,
    hasPassword,
    onSessionExpired,
  ]);

  const cmsInfo = integration.getCmsInfo();
  const cachedPageCms = cmsInfo?.SigninCachedPage;
  const signinPageCms = cmsInfo?.SigninPage;
  const title = cachedPageCms?.pageTitle;
  // If cachedPageCms is the active page but does not have a CMS entry,
  // we reference the splitLayout property from the signinPageCms.
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
          sessionToken,
          additionalAccessibilityInfo,
        }}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="email" className="hidden" value={email} disabled />
        <div className="flex">
          <FtlMsg id="signin-button">
            <CmsButtonWithFallback
              type="submit"
              disabled={signinLoading}
              buttonColor={cmsInfo?.shared.buttonColor}
              buttonText={cachedPageCms?.primaryButtonText}
            >
              Sign in
            </CmsButtonWithFallback>
          </FtlMsg>
        </div>
      </form>

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

export default SigninCached;
