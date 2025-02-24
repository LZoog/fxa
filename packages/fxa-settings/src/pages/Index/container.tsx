/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps, useNavigate } from '@reach/router';
import Index from '.';
import { IndexContainerProps } from './interfaces';
import { useCallback } from 'react';
import { useAuthClient } from '../../models';

export const IndexContainer = ({
  integration,
  serviceName,
}: IndexContainerProps & RouteComponentProps) => {
  const authClient = useAuthClient();
  // TODO, check BB route definition. If using fx_desktop_v1 etc., navigate to update_firefox
  const navigate = useNavigate();

  // send fxa status here (web channel message) or in App
  // send up can_link_account

  const signUpOrSignInHandler = useCallback(async (email: string) => {
    //

    try {
      const { exists, hasLinkedAccount, hasPassword } =
        await authClient.accountStatusByEmail(email, {
          thirdPartyAuthStatus: true,
        });
      if (!exists) {
        navigate('/signup', {
          state: {
            email,
            emailStatusChecked: true,
          },
        });
      } else {
        navigate('/signin', {
          state: {
            email,
            hasLinkedAccount,
            hasPassword,
          },
        });
      }
    } catch (error) {
      // handle ze error
      // Passing back the 'email' param causes various behaviors in
      // content-server since it marks the email as "coming from a RP".
      // queryParams.delete('email');
      // if (isEmailValid(email)) {
      //   queryParams.set('prefillEmail', email);
      // }
      // hardNavigate(`/?${queryParams}`);
    }
  }, []);

  return <Index {...{ integration, serviceName, signUpOrSignInHandler }} />;
};
