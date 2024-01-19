/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useNavigate } from '@reach/router';
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

const SigninContainer = ({
  integration,
  serviceName,
}: {
  integration: SigninContainerIntegration;
  serviceName: MozServices;
} & RouteComponentProps) => {
  const authClient = useAuthClient();
  const navigate = useNavigate();

  const { queryParamModel, validationError } =
    useValidatedQueryParams(SigninQueryParams);

  // Since we may perform an async call on initial render that can affect what is rendered,
  // return a spinner on first render.
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(true);

  const isOAuth = isOAuthIntegration(integration);
  const isSyncOAuth = isOAuth && integration.isSync();
  const isSyncDesktopV3 = isSyncDesktopV3Integration(integration);
  const isSyncWebChannel = isSyncOAuth || isSyncDesktopV3;

  useEffect(() => {
    (async () => {
      if (!validationError) {
        // Remove this once index is converted to React
        if (!queryParamModel.emailStatusChecked) {
          const { exists } = await authClient.accountStatusByEmail(
            queryParamModel.email
          );
          if (!exists) {
            // TODO? append all query params here and in signup container?
            navigate(
              `/signin?email=${queryParamModel.email}&emailStatusChecked=true`
            );
            // TODO: Probably move this to the Index page onsubmit once
            // the index page is converted to React, we need to run it in
            // signup and signin for Sync
          } else if (isSyncWebChannel) {
            firefox.fxaCanLinkAccount({ email: queryParamModel.email });
          }
        } else if (isSyncWebChannel) {
          // TODO: Probably move this to the Index page onsubmit once
          // the index page is converted to React, we need to run it in
          // signup and signin for Sync
          firefox.fxaCanLinkAccount({ email: queryParamModel.email });
        }
      }
      setShowLoadingSpinner(false);
    })();
  });

  return <Signin {...{ serviceName }} />;
};

export default SigninContainer;
