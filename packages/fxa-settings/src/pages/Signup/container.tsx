/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useLocation } from '@reach/router';
import { Integration } from '../../models';
import Signup from '.';
import { useValidatedQueryParams } from '../../lib/hooks/useValidate';
import { SignupQueryParams } from '../../models/pages/signup';
import { hardNavigateToContentServer } from 'fxa-react/lib/utils';
import { useMutation } from '@apollo/client';
import { BeginSignupResponse } from './interfaces';
import { BEGIN_SIGNUP_MUTATION } from './gql';

/*
 * In content-server, the `email` param is optional. If it's provided, we
 * check against it to see if the account exists and if it does, we redirect
 * users to `/signin`.
 *
 * In the React version, we're temporarily always passing the `email` param over
 * from the Backbone index page until the index page is converted over, in which case
 * we can pass the param with router state. Since we already perform this account exists
 * check on the Backbone index page, which is rate limited since it doesn't require a
 * session token, we also temporarily pass `emailFromContent=true` to signal not to perform
 * the check again. If this param is not passed and `email` is, we perform the check and
 * redirect existing user emails to `/signin` to match content-server functionality.
 *
 * If the account exists when signup is attempted, the user will be shown an "Account
 * already exists" error message. In content-server, we attempt to redirect users that are
 * on `/signup` with an account that already exists to where they need to go (Settings or
 * RP redirect) if for example, a user begins signup in one tab and then begins and
 * completes it in another tab. The "Account already exists" error message is only shown
 * when we can't automatically redirect, e.g. if they sign up on another browser or device.
 * If we want to mimic this functionality we can once index is converted. [TODO: file issue]
 */

const SignupContainer = ({
  integration,
}: {
  integration: Integration;
} & RouteComponentProps) => {
  const location = useLocation();

  const [beginSignup] = useMutation<BeginSignupResponse>(BEGIN_SIGNUP_MUTATION);

  const begin;

  const { queryParams, queryParamErrors } =
    useValidatedQueryParams(SignupQueryParams);

  // TODO
  if (queryParamErrors?.email) {
    hardNavigateToContentServer(`/${location.search}`);
  }

  return <Signup {...{ integration, queryParams }} />;
};

export default SignupContainer;
