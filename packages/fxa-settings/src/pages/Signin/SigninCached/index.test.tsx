/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import { LocationProvider } from '@reach/router';

import SigninCached from '.';
import {
  createMockSigninWebIntegration,
  createMockSigninOAuthNativeIntegration,
  CACHED_SIGNIN_HANDLER_RESPONSE,
  createCachedSigninResponseError,
} from '../mocks';
import {
  MOCK_AVATAR_NON_DEFAULT,
  MOCK_EMAIL,
  MOCK_SESSION_TOKEN,
  mockFinishOAuthFlowHandler,
} from '../../mocks';
import { AppContext } from '../../../models';
import { mockAppContext } from '../../../models/mocks';
import { AuthUiErrors } from '../../../lib/auth-errors/auth-errors';
import { OAuthNativeServices } from '@fxa/accounts/oauth';
import { MozServices } from '../../../lib/types';
import GleanMetrics from '../../../lib/glean';
import { SigninCachedProps } from '../interfaces';

jest.mock('../../../lib/glean', () => ({
  __esModule: true,
  default: {
    cachedLogin: {
      view: jest.fn(),
      submit: jest.fn(),
      success: jest.fn(),
      forgotPassword: jest.fn(),
    },
    login: {
      diffAccountLinkClick: jest.fn(),
    },
  },
}));

const renderSigninCached = (overrides: Partial<SigninCachedProps> = {}) => {
  const onSessionExpired = jest.fn();
  const cachedSigninHandler = jest
    .fn()
    .mockResolvedValue(CACHED_SIGNIN_HANDLER_RESPONSE);
  const props: SigninCachedProps = {
    integration: createMockSigninWebIntegration(),
    email: MOCK_EMAIL,
    sessionToken: MOCK_SESSION_TOKEN,
    serviceName: MozServices.Default,
    hasLinkedAccount: false,
    hasPassword: true,
    avatarData: { account: { avatar: MOCK_AVATAR_NON_DEFAULT } },
    avatarLoading: false,
    finishOAuthFlowHandler: mockFinishOAuthFlowHandler,
    cachedSigninHandler,
    onSessionExpired,
    ...overrides,
  };
  renderWithLocalizationProvider(
    <LocationProvider>
      <AppContext.Provider value={mockAppContext()}>
        <SigninCached {...props} />
      </AppContext.Provider>
    </LocationProvider>
  );
  return { props, cachedSigninHandler, onSessionExpired };
};

describe('SigninCached', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the Sign in heading (not Enter your password)', () => {
      renderSigninCached();
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    });

    it('renders email and Sign in button', () => {
      renderSigninCached();
      expect(screen.getByText(MOCK_EMAIL)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Sign in' })
      ).toBeInTheDocument();
    });

    it('does not render the Forgot password link', () => {
      renderSigninCached();
      expect(
        screen.queryByRole('link', { name: 'Forgot password?' })
      ).not.toBeInTheDocument();
    });

    it('fires cachedLogin.view Glean event on mount', () => {
      renderSigninCached();
      expect(GleanMetrics.cachedLogin.view).toHaveBeenCalledWith({
        event: { thirdPartyLinks: false },
      });
    });
  });

  describe('"Use a different account" link visibility', () => {
    it('hides the link when signed into Firefox Desktop with a service', () => {
      const integration = createMockSigninOAuthNativeIntegration({
        service: OAuthNativeServices.Vpn,
        isSync: false,
        isMobile: false,
      });
      renderSigninCached({ integration, isSignedIntoFirefox: true });
      expect(
        screen.queryByRole('link', { name: 'Use a different account' })
      ).not.toBeInTheDocument();
    });

    it('hides the link when signed into Firefox Mobile with a service', () => {
      const integration = createMockSigninOAuthNativeIntegration({
        service: OAuthNativeServices.Vpn,
        isSync: false,
        isMobile: true,
      });
      renderSigninCached({ integration, isSignedIntoFirefox: true });
      expect(
        screen.queryByRole('link', { name: 'Use a different account' })
      ).not.toBeInTheDocument();
    });

    it('shows the link when not signed into Firefox', () => {
      const integration = createMockSigninOAuthNativeIntegration({
        service: OAuthNativeServices.Vpn,
        isSync: false,
      });
      renderSigninCached({ integration, isSignedIntoFirefox: false });
      expect(
        screen.getByRole('link', { name: 'Use a different account' })
      ).toBeInTheDocument();
    });

    it('shows the link when integration is not a Firefox client', () => {
      // Default web integration: isFirefoxClient() returns false
      renderSigninCached({ isSignedIntoFirefox: true });
      expect(
        screen.getByRole('link', { name: 'Use a different account' })
      ).toBeInTheDocument();
    });
  });

  describe('SESSION_EXPIRED carry-over', () => {
    it('invokes onSessionExpired with the localized error when cached signin returns SESSION_EXPIRED', async () => {
      const expiredResponse = createCachedSigninResponseError({
        errno: AuthUiErrors.SESSION_EXPIRED.errno!,
      });
      const cachedSigninHandler = jest.fn().mockResolvedValue(expiredResponse);
      const onSessionExpired = jest.fn();

      renderSigninCached({ cachedSigninHandler, onSessionExpired });

      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(onSessionExpired).toHaveBeenCalledTimes(1);
      });
      // The callback receives a non-empty localized error message string —
      // the container stashes this in a ref and surfaces it as the password
      // view's initial banner error.
      expect(onSessionExpired.mock.calls[0][0]).toEqual(expect.any(String));
      expect(onSessionExpired.mock.calls[0][0].length).toBeGreaterThan(0);
    });

    it('does not invoke onSessionExpired for other errors (shows banner instead)', async () => {
      const otherErrorResponse = createCachedSigninResponseError({
        errno: AuthUiErrors.UNEXPECTED_ERROR.errno!,
      });
      const cachedSigninHandler = jest
        .fn()
        .mockResolvedValue(otherErrorResponse);
      const onSessionExpired = jest.fn();

      renderSigninCached({ cachedSigninHandler, onSessionExpired });

      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(cachedSigninHandler).toHaveBeenCalled();
      });
      expect(onSessionExpired).not.toHaveBeenCalled();
    });
  });
});
