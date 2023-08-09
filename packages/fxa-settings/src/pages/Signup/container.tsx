/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RouteComponentProps } from '@reach/router';
import { Integration } from '../../models';
import Signup from '.';

// TODO: if email param is provided, check if it exists. If it does,
// redirect to `/signin`

const SignupContainer = ({
  integration,
}: {
  integration: Integration;
} & RouteComponentProps) => {
  console.log('in signup container');
  return <Signup {...{ integration }} email="test@gmail.com" />;
};

export default SignupContainer;
