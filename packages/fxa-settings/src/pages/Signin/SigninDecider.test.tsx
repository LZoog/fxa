/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import { LocationProvider } from '@reach/router';

import SigninDecider from './SigninDecider';
import {
  createMockSigninWebIntegration,
  createMockSigninOAuthIntegration,
  createMockSigninOAuthNativeIntegration,
  createCachedSigninResponseError,
  CACHED_SIGNIN_HANDLER_RESPONSE,
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
import { OAuthNativeServices } from '@fxa/accounts/oauth';
import { MozServices } from '../../lib/types';
import { SigninDeciderProps } from './SigninDecider';

const renderDecider = (overrides: Partial<SigninDeciderProps> = {}) => {
  const props: SigninDeciderProps = {
    integration: createMockSigninWebIntegration(),
    email: MOCK_EMAIL,
    sessionToken: undefined,
    serviceName: MozServices.Default,
    hasLinkedAccount: false,
    hasPassword: true,
    avatarData: { account: { avatar: MOCK_AVATAR_NON_DEFAULT } },
    avatarLoading: false,
    finishOAuthFlowHandler: mockFinishOAuthFlowHandler,
    beginSigninHandler: mockBeginSigninHandler,
    cachedSigninHandler: jest
      .fn()
      .mockResolvedValue(CACHED_SIGNIN_HANDLER_RESPONSE),
    sendUnblockEmailHandler: mockSendUnblockEmailHandler,
    useFxAStatusResult: mockUseFxAStatus({ supportsKeysOptionalLogin: false }),
    ...overrides,
  };
  renderWithLocalizationProvider(
    <LocationProvider>
      <AppContext.Provider value={mockAppContext()}>
        <SigninDecider {...props} />
      </AppContext.Provider>
    </LocationProvider>
  );
  return { props };
};

describe('SigninDecider', () => {
  describe('routing decision', () => {
    it('renders SigninCached when sessionToken present, hasPassword true, no password needed', () => {
      // Web integration: requiresKeys=false, wantsKeysIfPasswordEntered=false,
      // wantsKeys=false, wantsLogin=false. passwordNeeded reduces to !hasCachedSession.
      // With sessionToken set, hasCachedSession=true → passwordNeeded=false → cached.
      renderDecider({
        sessionToken: MOCK_SESSION_TOKEN,
        hasPassword: true,
      });
      // SigninCached renders "Sign in" header (signin-header), not "Enter your password"
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('renders SigninCached when !hasPassword && sessionToken (passwordless cached)', () => {
      renderDecider({
        sessionToken: MOCK_SESSION_TOKEN,
        hasPassword: false,
      });
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
    });

    it('renders SigninCached when keys_optional capability is set + cached session', () => {
      // Even if integration would otherwise need keys (Relay non-Sync),
      // keys_optional lets us defer and route to cached.
      const integration = createMockSigninOAuthNativeIntegration({
        service: OAuthNativeServices.Relay,
        isSync: false,
      });
      renderDecider({
        integration,
        sessionToken: MOCK_SESSION_TOKEN,
        hasPassword: true,
        useFxAStatusResult: mockUseFxAStatus({
          supportsKeysOptionalLogin: true,
        }),
      });
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('renders Signin (password view) when no cached session', () => {
      renderDecider({
        sessionToken: undefined,
        hasPassword: true,
      });
      // Signin renders "Enter your password" header
      expect(
        screen.getByRole('heading', { name: /Enter your password/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders Signin (password view) for Sync (requiresKeys forces password)', () => {
      const integration = createMockSigninOAuthNativeIntegration({
        service: 'sync',
        isSync: true,
      });
      renderDecider({
        integration,
        sessionToken: MOCK_SESSION_TOKEN,
        hasPassword: true,
      });
      expect(
        screen.getByRole('heading', { name: /Enter your password/i })
      ).toBeInTheDocument();
    });

    it('renders Signin (password view) when OAuth requests prompt=login', () => {
      const integration = createMockSigninOAuthIntegration();
      // override wantsLogin
      (integration as any).wantsLogin = () => true;
      renderDecider({
        integration,
        sessionToken: MOCK_SESSION_TOKEN,
        hasPassword: true,
      });
      expect(
        screen.getByRole('heading', { name: /Enter your password/i })
      ).toBeInTheDocument();
    });
  });

  describe('SESSION_EXPIRED end-to-end carry-over', () => {
    it('flips from cached to password view AND surfaces the localized error in the password banner', async () => {
      const expiredResponse = createCachedSigninResponseError({
        errno: AuthUiErrors.SESSION_EXPIRED.errno!,
      });
      const cachedSigninHandler = jest.fn().mockResolvedValue(expiredResponse);

      renderDecider({
        sessionToken: MOCK_SESSION_TOKEN,
        hasPassword: true,
        cachedSigninHandler,
      });

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
      // (Banner heading element renders the localized error text.)
      const banners = screen.queryAllByText(
        /session expired|session has expired|sign in again/i
      );
      expect(banners.length).toBeGreaterThan(0);
    });
  });
});
