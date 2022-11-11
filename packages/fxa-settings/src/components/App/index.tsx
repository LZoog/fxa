/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps, Router } from '@reach/router';
import Head from 'fxa-react/components/Head';
import { ScrollToTop } from '../Settings/ScrollToTop';
import Settings from '../Settings';
import { QueryParams } from '../..';
import PageCannotCreateAccount from '../PageCannotCreateAccount';

export const App = ({
  flowQueryParams,
}: { flowQueryParams: QueryParams } & RouteComponentProps) => {
  // const { showNewReactApp } = flowQueryParams;

  return (
    <>
      <Head />
      <Router basepath={'/'}>
        <ScrollToTop default>
          {/* TODO: setup guard around simpleRoutes, checking for `showNewReactApp`
           * and if config flag is on  */}
          <PageCannotCreateAccount path="/cannot_create_account/*" />

          <Settings path="/settings/*" {...{ flowQueryParams }} />
        </ScrollToTop>
      </Router>
    </>
  );
};

export default App;
