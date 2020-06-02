/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_ACCOUNT, accountData } from './gql';
import LoadingSpinner from 'fxa-react/components/LoadingSpinner';
import AppErrorDialog from 'fxa-react/components/AppErrorDialog';
import HeaderLockup from '../HeaderLockup';
import Nav from '../Nav';

type AppLayoutProps = {
  children: React.ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { loading, error, data } = useQuery(GET_ACCOUNT);

  if (loading) {
    return (
      <LoadingSpinner className="bg-grey-20 flex items-center flex-col justify-center h-screen select-none" />
    );
  }

  if (error) {
    return <AppErrorDialog data-testid="error-dialog" {...{ error }} />;
  }

  const account: accountData = data.account;
  const primaryEmail = account.emails.find((email) => email.isPrimary)!;
  // const hasSubscription = account.subscriptions ?

  return (
    <>
      <HeaderLockup avatarUrl={account.avatarUrl} {...{ primaryEmail }} />
      <div className="max-w-screen-desktopXl mx-auto flex flex-1 tablet:px-20 desktop:px-12">
        <Nav />
        <main className="flex-grow" data-testid="main">
          {children}
        </main>
      </div>

      {/*TO DO: pull `Footer` in from `fxa-admin-panel` into
      `fxa-react` and replace this*/}
      <footer></footer>
    </>
  );
};

export default AppLayout;
