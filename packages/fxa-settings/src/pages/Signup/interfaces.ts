/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  BaseIntegration,
  IntegrationType,
  OAuthIntegration,
} from '../../models';

export interface SignupProps {
  integration: SignupIntegration;
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
