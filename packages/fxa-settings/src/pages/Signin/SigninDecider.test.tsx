/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import { LocationProvider } from '@reach/router';

import SigninDecider, { SigninDeciderProps } from './SigninDecider';
import {
  createMockSigninWebIntegration,
  createCachedSigninResponseError,
  mockBeginSigninHandler,
  mockSendUnblockEmailHandler,
} from './mocks';
import {
  MOCK_AVATAR_NON_DEFAULT,
  MOCK_EMAIL,
  MOCK_SESSION_TOKEN,
  mockFinishOAuthFlowHandler,
} from '../mocks';
import { AppContext } from '../../models';
import { mockAppContext } from '../../models/mocks';
import { mockUseFxAStatus } from '../../lib/hooks/useFxAStatus/mocks';
import { AuthUiErrors } from '../../lib/auth-errors/auth-errors';
import { MozServices } from '../../lib/types';

// Routing decisions are already exercised end-to-end by `Signin/index.test.tsx`
// (which renders via `Subject` → `SigninDecider`). This file covers only the
// SESSION_EXPIRED hand-off — the one decider behavior the page-level tests
// can't reach because it requires the cached → password view transition.

describe('SigninDecider SESSION_EXPIRED carry-over', () => {
  it('flips from cached to password view AND surfaces the localized error in the password banner', async () => {
    const expiredResponse = createCachedSigninResponseError({
      errno: AuthUiErrors.SESSION_EXPIRED.errno!,
    });
    const cachedSigninHandler = jest.fn().mockResolvedValue(expiredResponse);

    const props: SigninDeciderProps = {
      integration: createMockSigninWebIntegration(),
      email: MOCK_EMAIL,
      sessionToken: MOCK_SESSION_TOKEN,
      serviceName: MozServices.Default,
      hasLinkedAccount: false,
      hasPassword: true,
      avatarData: { account: { avatar: MOCK_AVATAR_NON_DEFAULT } },
      avatarLoading: false,
      finishOAuthFlowHandler: mockFinishOAuthFlowHandler,
      beginSigninHandler: mockBeginSigninHandler,
      cachedSigninHandler,
      sendUnblockEmailHandler: mockSendUnblockEmailHandler,
      useFxAStatusResult: mockUseFxAStatus({
        supportsKeysOptionalLogin: false,
      }),
    };
    renderWithLocalizationProvider(
      <LocationProvider>
        <AppContext.Provider value={mockAppContext()}>
          <SigninDecider {...props} />
        </AppContext.Provider>
      </LocationProvider>
    );

    // Initially the cached view is rendered.
    expect(
      screen.getByRole('heading', { name: 'Sign in' })
    ).toBeInTheDocument();

    // Click Sign in → cached handler returns SESSION_EXPIRED → decider flips
    // to password view and surfaces the error message in the banner.
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Enter your password/i })
      ).toBeInTheDocument();
    });

    // The banner shows the localized SESSION_EXPIRED message — the user is
    // informed why they were asked to enter their password.
    const banners = screen.queryAllByText(
      /session expired|session has expired|sign in again/i
    );
    expect(banners.length).toBeGreaterThan(0);
  });
});
