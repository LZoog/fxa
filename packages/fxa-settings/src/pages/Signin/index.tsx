/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback, useEffect, useState } from 'react';
import { usePageViewEvent } from '../../lib/metrics';
import { isOAuthIntegration, useFtlMsgResolver } from '../../models';
import { FtlMsg, hardNavigateToContentServer } from 'fxa-react/lib/utils';
import {
  RouteComponentProps,
  Link,
  useLocation,
  useNavigate,
} from '@reach/router';
import InputPassword from '../../components/InputPassword';
import TermsPrivacyAgreement from '../../components/TermsPrivacyAgreement';
import { REACT_ENTRYPOINT } from '../../constants';
import CardHeader from '../../components/CardHeader';
import ThirdPartyAuth from '../../components/ThirdPartyAuth';
import { BrandMessagingPortal } from '../../components/BrandMessaging';
import GleanMetrics from '../../lib/glean';
import AppLayout from '../../components/AppLayout';
import { SigninFormData, SigninProps } from './interfaces';
import Avatar from '../../components/Settings/Avatar';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import classNames from 'classnames';
import {
  isClientMonitor,
  isClientPocket,
} from '../../models/integrations/client-matching';
import { StoredAccountData, storeAccountData } from '../../lib/storage-utils';
import { useForm } from 'react-hook-form';
import Banner, { BannerType } from '../../components/Banner';

export const viewName = 'signin';

/* The avatar size must not increase until the tablet breakpoint due to logging into
 * Pocket with FxA and maybe others later: an Apple-controlled modal displays FxA in a
 * web view and we want the "Sign in" button to be displayed above the fold. See FXA-7425 */
const avatarClassNames = 'mx-auto h-24 w-24 tablet:h-40 tablet:w-40';

const Signin = ({
  integration,
  email,
  isPasswordNeeded,
  serviceName,
  hasLinkedAccount,
  beginSigninHandler,
  hasPassword,
  avatarData,
  avatarLoading,
}: SigninProps & RouteComponentProps) => {
  usePageViewEvent(viewName, REACT_ENTRYPOINT);
  const location = useLocation();
  const navigate = useNavigate();
  const [signinLoading, setSigninLoading] = useState<boolean>(false);
  const [bannerErrorText, setBannerErrorText] = useState<string>('');

  const isOAuth = isOAuthIntegration(integration);
  const isPocketClient = isOAuth && isClientPocket(integration.getService());
  const isMonitorClient = isOAuth && isClientMonitor(integration.getService());
  const hasLinkedAccountAndNoPassword = hasLinkedAccount && !hasPassword;

  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const ftlMsgResolver = useFtlMsgResolver();
  const localizedPasswordFormLabel = ftlMsgResolver.getMsg(
    'password',
    'Password'
  );

  const { handleSubmit, register } = useForm<SigninFormData>({
    mode: 'onTouched',
    criteriaMode: 'all',
    defaultValues: {
      email,
      password: '',
    },
  });

  useEffect(() => {
    if (!isPasswordNeeded) {
      GleanMetrics.cachedLogin.view();
    } else {
      GleanMetrics.login.view();
    }
  }, [isPasswordNeeded]);

  const signInUsingLoggedInAccount = useCallback(() => {
    GleanMetrics.cachedLogin.submit();

    // TODO: add in functionality to sign in using the logged in account
    // return an error to be displayed if anythign goes wrong.

    // Move this event if necessary.  The branching logic for a successful or
    // failed login has not been implemented when the event was added.
    GleanMetrics.cachedLogin.success();
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      GleanMetrics.login.submit();

      setSigninLoading(true);
      const { data, error } = await beginSigninHandler(email, password);

      if (data) {
        GleanMetrics.login.success();

        const accountData: StoredAccountData = {
          email,
          uid: data.signIn.uid,
          lastLogin: Date.now(),
          sessionToken: data.signIn.sessionToken,
          verified: data.signIn.verified,
          metricsEnabled: data.signIn.metricsEnabled,
        };

        storeAccountData(accountData);
        // check verification method and navigate accordingly
        // if 'totp-2fa', go to signin_totp_code
        navigate('/settings');
      }
      if (error) {
        const { message, ftlId } = error;
        setBannerErrorText(ftlMsgResolver.getMsg(ftlId, message));
        // if the request errored, loading state must be marked as false to reenable submission
        setSigninLoading(false);
      }
    },
    []
  );

  const onSubmit = useCallback(async () => {
    console.log('on submit called');
    try {
      isPasswordNeeded
        ? signInWithPassword(email, password)
        : signInUsingLoggedInAccount();
      // TODO: add message in Banner re: success, then navigate to where appropriate
    } catch (e) {
      // TODO: metrics event for error
      // TODO: Add in localized Banner message for error
      setError(e);
    }
  }, [
    email,
    password,
    signInUsingLoggedInAccount,
    signInWithPassword,
    isPasswordNeeded,
    setError,
  ]);

  const showThirdPartyAuth =
    (!integration.isSync() && !hasLinkedAccount) ||
    (!integration.isSync() && isOAuth && hasLinkedAccount) ||
    (integration.isSync() && hasLinkedAccount && !hasPassword);

  return (
    <AppLayout>
      <BrandMessagingPortal {...{ viewName }} />
      {isPasswordNeeded ? (
        <CardHeader
          headingText="Enter your password"
          headingAndSubheadingFtlId="signin-password-needed-header-2"
        />
      ) : (
        <CardHeader
          headingText="Sign in"
          headingTextFtlId="signin-header"
          subheadingWithDefaultServiceFtlId="signin-subheader-without-logo-default"
          subheadingWithCustomServiceFtlId="signin-subheader-without-logo-with-servicename"
          subheadingWithLogoFtlId="signin-subheader-with-logo"
          {...{ serviceName }}
        />
      )}
      {bannerErrorText && (
        <Banner type={BannerType.error}>
          <p>{bannerErrorText}</p>
        </Banner>
      )}
      <section>
        {/* TODO banner for success/error messages */}
        <div className="mt-9">
          {avatarData?.account.avatar ? (
            <Avatar
              className={avatarClassNames}
              avatar={avatarData.account.avatar}
            />
          ) : avatarLoading ? (
            <div
              className={classNames(
                avatarClassNames,
                'flex justify-center items-center'
              )}
            >
              <LoadingSpinner />
            </div>
          ) : (
            // There was an error, so just show default avatar
            <Avatar className={avatarClassNames} />
          )}
          <div className="my-5 text-base break-all">{email}</div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="email" className="hidden" value={email} disabled />

          {isPasswordNeeded && (
            <InputPassword
              name="password"
              anchorPosition="start"
              className="mb-5 text-start"
              label={localizedPasswordFormLabel}
              hasErrors={error.length > 0}
              errorText={error}
              tooltipPosition="bottom"
              required
              autoFocus
              onChange={(e) => setPassword(e.currentTarget.value)}
              inputRef={register()}
            />
          )}
          {/* This non-fulfilled input tricks the browser, when trying to
              sign in with the wrong password, into not showing the doorhanger.
              TODO: this no work
           */}
          {/* <input className="hidden" required /> */}

          <div className="flex">
            <FtlMsg id="signin-button">
              <button
                className="cta-primary cta-xl"
                type="submit"
                disabled={signinLoading}
              >
                Sign in
              </button>
            </FtlMsg>
          </div>
        </form>

        {showThirdPartyAuth && (
          <ThirdPartyAuth showSeparator={!hasLinkedAccountAndNoPassword} />
        )}

        <TermsPrivacyAgreement {...{ isPocketClient, isMonitorClient }} />

        <div className="flex justify-between mt-5">
          <FtlMsg id="signin-use-a-different-account">
            <a
              href="/"
              className="text-sm link-blue"
              onClick={(e) => {
                e.preventDefault();
                const params = new URLSearchParams(location.search);
                // Tell content-server to stay on index and prefill the email
                params.set('prefillEmail', email);
                // Passing back the 'email' param causes various behaviors in
                // content-server since it marks the email as "coming from a RP".
                // Also remove other params that are passed when coming
                // from content-server to Backbone, see Signup container component
                // for more info.
                params.delete('email');
                params.delete('hasLinkedAccount');
                params.delete('hasPassword');
                params.delete('showReactApp');
                hardNavigateToContentServer(`/?${params.toString()}`);
              }}
            >
              Use a different account
            </a>
          </FtlMsg>
          {!hasLinkedAccountAndNoPassword && (
            <FtlMsg id="signin-forgot-password">
              <Link
                // TODO, pass params?
                to="/reset_password"
                className="text-sm link-blue"
                onClick={() => GleanMetrics.login.forgotPassword}
              >
                Forgot password?
              </Link>
            </FtlMsg>
          )}
        </div>
      </section>
    </AppLayout>
  );
};

export default Signin;
