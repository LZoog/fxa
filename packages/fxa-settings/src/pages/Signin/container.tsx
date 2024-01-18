/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import Signin from '.';
import { Integration } from '../../models';

export type SigninContainerIntegration = Pick<
  Integration,
  'type' | 'getService' | 'features' | 'isSync'
>;

const SigninContainer = ({
  integration,
}: {
  integration: SigninContainerIntegration;
} & RouteComponentProps) => {
  return <Signin />;
};

export default SigninContainer;
