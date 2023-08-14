/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  IntegrationType,
  OAuthIntegration,
} from '../../models';
import { SignupQueryParams } from '../../models/pages/signup';

export interface BeginSignupResponse {
  Signup: {
    uid: string;
    sessionToken: hexstring;
    authAt: number;
  };
}

export interface SignupProps {
  integration: SignupIntegration;
  queryParams: SignupQueryParams;
}

type SignupIntegration = SignupOAuthIntegration | SignupBaseIntegration;

export interface SignupOAuthIntegration {
  type: IntegrationType.OAuth;
  getRedirectUri: () => ReturnType<OAuthIntegration['getRedirectUri']>;
  saveOAuthState: () => ReturnType<OAuthIntegration['saveOAuthState']>;
  getServiceName: () => ReturnType<OAuthIntegration['getServiceName']>;
}

export interface SignupBaseIntegration {
  type: IntegrationType;
  getServiceName: () => ReturnType<BaseIntegration['getServiceName']>;
}

export interface SignupFormData {
  newPassword: string;
  confirmPassword: string;
  userAge: string;
}
