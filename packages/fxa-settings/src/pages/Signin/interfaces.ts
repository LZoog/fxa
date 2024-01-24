/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AccountAvatar } from '../../lib/interfaces';
import { MozServices } from '../../lib/types';
import { Integration } from '../../models';

export interface AvatarResponse {
  account: {
    avatar: AccountAvatar;
  };
}

export type SigninIntegration = Pick<Integration, 'type' | 'isSync'>;

export interface SigninProps {
  integration: SigninIntegration;
  email: string;
  isPasswordNeeded: boolean;
  hasLinkedAccount: boolean;
  hasPassword: boolean;
  serviceName: MozServices;
  avatarData: AvatarResponse | undefined;
  avatarLoading: boolean;
}
