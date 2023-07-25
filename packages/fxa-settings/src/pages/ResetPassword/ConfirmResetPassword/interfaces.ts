/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { IntegrationType, OAuthIntegration } from '../../../models';

export interface ConfirmResetPasswordOAuthIntegration {
  type: IntegrationType.OAuth;
  getRedirectUri: () => ReturnType<OAuthIntegration['getRedirectUri']>;
  getService: () => ReturnType<OAuthIntegration['getService']>;
}

export interface ConfirmResetPasswordBaseIntegration {
  type: IntegrationType;
}

export type ConfirmResetPasswordIntegration =
  | ConfirmResetPasswordOAuthIntegration
  | ConfirmResetPasswordBaseIntegration;

export interface ConfirmResetPasswordLocationState {
  email: string;
  passwordForgotToken: string;
}
