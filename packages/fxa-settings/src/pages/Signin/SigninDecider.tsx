/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useCallback, useRef, useState } from 'react';
import Signin from '.';
import SigninCached from './SigninCached';
import SigninThirdParty from './SigninThirdParty';
import { isOAuthIntegration, isOAuthWebIntegration } from '../../models';
import { UseFxAStatusResult } from '../../lib/hooks/useFxAStatus';
import { MozServices } from '../../lib/types';
import { useFinishOAuthFlowHandler } from '../../lib/oauth/hooks';
import { QueryParams } from '../..';
import {
  AvatarResponse,
  BeginSigninHandler,
  CachedSigninHandler,
  SendUnblockEmailHandler,
  SigninIntegration,
} from './interfaces';

export interface SigninDeciderProps {
  integration: SigninIntegration;
  serviceName: MozServices;
  email: string;
  beginSigninHandler: BeginSigninHandler;
  cachedSigninHandler: CachedSigninHandler;
  sendUnblockEmailHandler: SendUnblockEmailHandler;
  sessionToken?: hexstring;
  hasLinkedAccount: boolean;
  hasPassword: boolean;
  avatarData: AvatarResponse | undefined;
  avatarLoading: boolean;
  localizedErrorFromLocationState?: string;
  finishOAuthFlowHandler: ReturnType<
    typeof useFinishOAuthFlowHandler
  >['finishOAuthFlowHandler'];
  localizedSuccessBannerHeading?: string;
  localizedSuccessBannerDescription?: string;
  flowQueryParams?: QueryParams;
  useFxAStatusResult: UseFxAStatusResult;
  isSignedIntoFirefox?: boolean;
  setCurrentSplitLayout?: (value: boolean) => void;
}

/**
 * Decides which of the three signin views the user sees:
 *  - `<SigninCached>`     — has a valid cached session, 1-click sign in
 *  - `<SigninThirdParty>` — linked third-party provider, no password, no session
 *  - `<Signin>`           — password entry (default)
 *
 * Also owns the SESSION_EXPIRED handoff: if `<SigninCached>` reports an
 * expired session, this component flips state and the next render falls
 * through to `<Signin>`, carrying the localized error message forward via
 * a ref so the password view can surface it in its banner.
 */
export const SigninDecider = ({
  integration,
  serviceName,
  email,
  beginSigninHandler,
  cachedSigninHandler,
  sendUnblockEmailHandler,
  sessionToken,
  hasLinkedAccount,
  hasPassword,
  avatarData,
  avatarLoading,
  localizedErrorFromLocationState,
  finishOAuthFlowHandler,
  localizedSuccessBannerHeading,
  localizedSuccessBannerDescription,
  flowQueryParams,
  useFxAStatusResult,
  isSignedIntoFirefox,
  setCurrentSplitLayout,
}: SigninDeciderProps) => {
  // Tracks whether the cached session is still considered valid. Initialized
  // from `!!sessionToken`; flipped to false by SigninCached when it receives
  // a SESSION_EXPIRED error from the server.
  const [hasCachedSession, setHasCachedSession] =
    useState<boolean>(!!sessionToken);

  // Carries a localized error message forward when SigninCached hands off to
  // Signin. Using a ref (not state) keeps the container free of UI concerns
  // — the password view reads the ref on first render and renders its own
  // banner. Persists across the unmount/mount of SigninCached → Signin.
  const sessionExpiredErrorRef = useRef<string | null>(null);

  const onSessionExpired = useCallback((localizedErrorMessage: string) => {
    sessionExpiredErrorRef.current = localizedErrorMessage;
    setHasCachedSession(false);
  }, []);

  const isOAuth = isOAuthIntegration(integration);

  // Relay browser service login launched in Firefox desktop 135, and the "keys optional"
  // capability (Sync decoupling) launched in Fx desktop 147, meaning all Relay service users
  // in those Fx versions require a password.
  // This also covers Mobile until Sync has been decoupled.
  const syncNotDecoupledRequiresPassword =
    !useFxAStatusResult.supportsKeysOptionalLogin &&
    integration.wantsKeysIfPasswordEntered();

  // Redirect-based RPs (OAuthWeb) that request scoped keys always need a password for key
  // derivation. In practice today, we don't have RPs that need this, but we do support it.
  const redirectRpRequiresKeys =
    isOAuthWebIntegration(integration) && integration.wantsKeys();

  const passwordNeeded =
    !hasCachedSession ||
    integration.requiresKeys() ||
    syncNotDecoupledRequiresPassword ||
    redirectRpRequiresKeys ||
    // The password is forced when the RP requests prompt=login
    (isOAuth && integration.wantsLogin());

  // Do we have a session token, and can we defer the key fetch?
  const keysOptional =
    hasCachedSession && useFxAStatusResult.supportsKeysOptionalLogin;

  // Determine whether to show the cached view (no password input). Keys always
  // require a password for derivation, but we can skip it when:
  // - The user is already signed into Firefox (authorization flow) AND the
  //   service doesn't require keys (Sync always requires them), OR
  // - The browser supports "keys optional" (Sync decoupled from other services)
  //
  // Passwordless users always see cached sign-in and are redirected to set a
  // password after signing in, if a password is required (e.g. for Sync).
  const showCached =
    !!sessionToken &&
    hasCachedSession &&
    (!hasPassword || !passwordNeeded || keysOptional);

  if (showCached) {
    return (
      <SigninCached
        {...{
          integration,
          serviceName,
          email,
          sessionToken: sessionToken!,
          cachedSigninHandler,
          hasLinkedAccount,
          hasPassword,
          avatarData,
          avatarLoading,
          localizedErrorFromLocationState,
          finishOAuthFlowHandler,
          localizedSuccessBannerHeading,
          localizedSuccessBannerDescription,
          flowQueryParams,
          isSignedIntoFirefox,
          setCurrentSplitLayout,
          onSessionExpired,
        }}
      />
    );
  }

  // When falling through from cached → another view (SESSION_EXPIRED), surface
  // the carried-over error message as the initial banner. The ref is read
  // once on the child's mount; subsequent re-renders don't reset the child's
  // banner state because each child owns its own useState.
  const initialBannerError =
    sessionExpiredErrorRef.current ?? localizedErrorFromLocationState;

  // Linked-account-passwordless without a cached session (or after a cached
  // session expired): nothing to enter, the user authenticates via their
  // third-party provider (Google/Apple).
  if (hasLinkedAccount && !hasPassword) {
    return (
      <SigninThirdParty
        {...{
          integration,
          serviceName,
          email,
          hasLinkedAccount,
          hasPassword,
          avatarData,
          avatarLoading,
          localizedErrorFromLocationState: initialBannerError,
          finishOAuthFlowHandler,
          localizedSuccessBannerHeading,
          localizedSuccessBannerDescription,
          flowQueryParams,
          isSignedIntoFirefox,
          setCurrentSplitLayout,
        }}
      />
    );
  }

  return (
    <Signin
      {...{
        integration,
        serviceName,
        email,
        beginSigninHandler,
        sendUnblockEmailHandler,
        hasLinkedAccount,
        hasPassword,
        avatarData,
        avatarLoading,
        localizedErrorFromLocationState: initialBannerError,
        finishOAuthFlowHandler,
        localizedSuccessBannerHeading,
        localizedSuccessBannerDescription,
        flowQueryParams,
        useFxAStatusResult,
        isSignedIntoFirefox,
        setCurrentSplitLayout,
      }}
    />
  );
};

export default SigninDecider;
