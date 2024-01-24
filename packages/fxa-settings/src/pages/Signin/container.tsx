/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useLocation, useNavigate } from '@reach/router';
import Signin from '.';
import {
  Integration,
  isOAuthIntegration,
  isSyncDesktopV3Integration,
  useAuthClient,
} from '../../models';
import { MozServices } from '../../lib/types';
import { useValidatedQueryParams } from '../../lib/hooks/useValidate';
import { SigninQueryParams } from '../../models/pages/signin';
import { useEffect, useState } from 'react';
import firefox from '../../lib/channels/firefox';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import { currentAccount } from '../../lib/cache';
import { useQuery } from '@apollo/client';
import { AVATAR_QUERY } from './gql';
import { hardNavigateToContentServer } from 'fxa-react/lib/utils';
import { AvatarResponse } from './interfaces';

/*
 * In content-server, the `email` param is optional. If it's provided, we
 * check against it to see if the account exists and if it doesn't, we redirect
 * users to `/signup`.
 *
 * In the React version, we're temporarily always passing the `email` param over
 * from the Backbone index page until the index page is converted over, in which case
 * we can pass the param with router state. Since we already perform this account exists
 * check on the Backbone index page, which is rate limited since it doesn't require a
 * session token, we also temporarily pass `emailStatusChecked=true` to signal not to perform
 * the check again. If this param is not passed and `email` is, we perform the check and
 * redirect existing user emails to `/signup` to match content-server functionality.
 *
 *
 */

export type SigninContainerIntegration = Pick<
  Integration,
  'type' | 'getService' | 'features' | 'isSync'
>;

type LocationState = {
  email?: string;
  hasLinkedAccount?: boolean;
  hasPassword?: boolean;
};

const SigninContainer = ({
  integration,
  serviceName,
}: {
  integration: SigninContainerIntegration;
  serviceName: MozServices;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  const navigate = useNavigate();
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state?: LocationState;
  };
  const { queryParamModel, validationError } =
    useValidatedQueryParams(SigninQueryParams);

  // email with either come from React signup (router state),
  // Backbone index (query param), or will be cached (local storage)
  const {
    email: emailFromLocationState,
    hasLinkedAccount: hasLinkedAccountFromLocationState,
    hasPassword: hasPasswordFromLocationState,
  } = location.state || {};

  const [accountStatus, setAccountStatus] = useState({
    hasLinkedAccount:
      queryParamModel.hasLinkedAccount || hasLinkedAccountFromLocationState,
    hasPassword: queryParamModel.hasPassword || hasPasswordFromLocationState,
  });
  const { hasLinkedAccount, hasPassword } = accountStatus;

  const nonCachedEmail = queryParamModel.email || emailFromLocationState;
  let email = nonCachedEmail;
  let sessionToken: string | undefined;
  // only read from local storage if email isn't provided via query param or router state
  if (!nonCachedEmail) {
    const storedLocalAccount = currentAccount();
    email = storedLocalAccount?.email;
    sessionToken = storedLocalAccount?.sessionToken;
    // uid = storedLocalAccount?.uid;
  }

  const isOAuth = isOAuthIntegration(integration);
  const isSyncOAuth = isOAuth && integration.isSync();
  const isSyncDesktopV3 = isSyncDesktopV3Integration(integration);
  const isSyncWebChannel = isSyncOAuth || isSyncDesktopV3;

  // On click of "Sign in" we update isPasswordNeeded and display error message: "Session expired. Sign in to continue."
  const isPasswordNeeded =
    !sessionToken ||
    !hasPassword ||
    (isOAuth && (integration.wantsKeys() || integration.wantsLogin()));

  useEffect(() => {
    (async () => {
      // Tweak this once index page is converted to React
      if (!validationError && email) {
        // if you directly hit /signin with email param or we read from localstorage
        // this means the account status hasn't been checked
        if (
          accountStatus.hasLinkedAccount === undefined ||
          accountStatus.hasPassword === undefined
        ) {
          const { exists, hasLinkedAccount, hasPassword } =
            await authClient.accountStatusByEmail(email, {
              thirdPartyAuthStatus: true,
            });
          if (!exists) {
            // For now, just pass back emailStatusChecked. When we convert the Index page
            // we'll want to read from router state.
            navigate(`/signup?email=${email}&emailStatusChecked=true`);
            // TODO: Probably move this to the Index page onsubmit once
            // the index page is converted to React, we need to run it in
            // signup and signin for Sync
          } else {
            setAccountStatus({
              hasLinkedAccount,
              hasPassword,
            });
            if (isSyncWebChannel) {
              firefox.fxaCanLinkAccount({ email: queryParamModel.email });
            }
          }
        } else if (isSyncWebChannel) {
          // TODO: Probably move this to the Index page onsubmit once
          // the index page is converted to React, we need to run it in
          // signup and signin for Sync
          firefox.fxaCanLinkAccount({ email: queryParamModel.email });
        }
      }
    })();
  });

  const { data: avatarData, loading: avatarLoading } =
    useQuery<AvatarResponse>(AVATAR_QUERY);

  // const beginSignupHandler: BeginSignupHandler = useCallback(
  //   async (email, password) => {
  //     try {
  //       const { data } = await beginSignup({
  //         variables: {
  //           input: {
  //             email,
  //             authPW,
  //           },
  //         },
  //       });
  //       return data ? { data: { ...data, unwrapBKey } } : { data: null };
  //     } catch (error) {
  //       const graphQLError: GraphQLError = error.graphQLErrors?.[0];
  //       if (graphQLError && graphQLError.extensions?.errno) {
  //         const { errno } = graphQLError.extensions as { errno: number };
  //         return {
  //           error: {
  //             errno,
  //             message: AuthUiErrorNos[errno].message,
  //             ftlId: composeAuthUiErrorTranslationId({ errno }),
  //           },
  //         };
  //       } else {
  //         // TODO: why is `errno` in `AuthServerError` possibly undefined?
  //         // might want to grab from `ERRORS.UNEXPECTED_ERROR` instead
  //         const { errno = 999, message } = AuthUiErrors.UNEXPECTED_ERROR;
  //         return {
  //           data: null,
  //           error: {
  //             errno,
  //             message,
  //             ftlId: composeAuthUiErrorTranslationId({ errno }),
  //           },
  //         };
  //       }
  //     }
  //   },
  //   [beginSignup, integration, isSyncDesktopV3, isOAuth]
  // );

  if (!email) {
    hardNavigateToContentServer('/');
    return <LoadingSpinner fullScreen />;
  }

  // Wait for async call (if needed) to complete
  if (hasLinkedAccount === undefined || hasPassword === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Signin
      {...{
        integration,
        serviceName,
        email,
        isPasswordNeeded,
        hasLinkedAccount,
        hasPassword,
        avatarData,
        avatarLoading,
      }}
    />
  );
};

export default SigninContainer;
