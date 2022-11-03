/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { gql, useMutation } from '@apollo/client';
import { Email } from 'fxa-admin-server/src/graphql';
import { RECORD_ADMIN_SECURITY_EVENT } from '../Account';
import { AdminPanelFeature } from 'fxa-shared/guards';
import Guard from '../../Guard';
import { getFormattedDate } from '../../../lib/utils';

type DangerZoneProps = {
  uid: string;
  email: Email;
  disabledAt: number | null;
  onCleared: Function;
};

export const UNVERIFY_EMAIL = gql`
  mutation unverify($email: String!) {
    unverifyEmail(email: $email)
  }
`;

export const DISABLE_ACCOUNT = gql`
  mutation disableAccount($uid: String!) {
    disableAccount(uid: $uid)
  }
`;

export const ENABLE_ACCOUNT = gql`
  mutation enableAccount($uid: String!) {
    enableAccount(uid: $uid)
  }
`;

export const SEND_PASSWORD_RESET_EMAIL = gql`
  mutation sendPasswordResetEmail($email: String!) {
    sendPasswordResetEmail(email: $email)
  }
`;

export const DangerZone = ({
  uid,
  email,
  disabledAt,
  onCleared,
}: DangerZoneProps) => {
  const [unverify, { loading: unverifyLoading }] = useMutation(UNVERIFY_EMAIL, {
    onCompleted: () => {
      window.alert("The user's email has been unconfirmed.");
      onCleared();
    },
    onError: () => {
      window.alert('Error in unconfirming email');
    },
  });

  const handleUnverify = () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) {
      return;
    }
    unverify({ variables: { email: email.email } });
  };

  const [disableAccount] = useMutation(DISABLE_ACCOUNT, {
    onCompleted: () => {
      window.alert('The account has been disabled.');
      onCleared();
    },
    onError: () => {
      window.alert('Error disabling account');
    },
  });

  const [enableAccount] = useMutation(ENABLE_ACCOUNT, {
    onCompleted: () => {
      window.alert('The account has been enabled.');
      onCleared();
    },
    onError: () => {
      window.alert('Error enabling account');
    },
  });

  const [sendPasswordResetEmail] = useMutation(SEND_PASSWORD_RESET_EMAIL, {
    onCompleted: () => {
      window.alert(`Password reset email sent to ${email.email}`);
      onCleared();
    },
    onError: () => {
      window.alert('Error sending password reset email.');
    },
  });

  const [recordAdminSecurityEvent] = useMutation(RECORD_ADMIN_SECURITY_EVENT);

  const handleDisable = () => {
    if (!window.confirm('Are you sure?')) {
      return;
    }
    disableAccount({ variables: { uid } });
    recordAdminSecurityEvent({ variables: { uid, name: 'account.disable' } });
  };

  const handleEnable = () => {
    if (!window.confirm('Are you sure?')) {
      return;
    }
    enableAccount({ variables: { uid } });
    recordAdminSecurityEvent({ variables: { uid, name: 'account.enable' } });
  };

  const handleSendPasswordReset = () => {
    if (!window.confirm('Are you sure?')) {
      return;
    }
    sendPasswordResetEmail({ variables: { email: email.email } });
  };

  // define loading messages
  const loadingMessage = 'Please wait a moment...';
  let unverifyMessage = '';

  if (unverifyLoading) unverifyMessage = loadingMessage;

  return (
    <section className="mt-8">
      <Guard
        features={[
          AdminPanelFeature.UnverifyEmail,
          AdminPanelFeature.DisableAccount,
          AdminPanelFeature.EnableAccount,
        ]}
      >
        <h3 className="mt-0 mb-1 bg-red-600 font-medium h-8 pb-8 pl-1 pt-1 rounded-sm text-lg text-white">
          Danger Zone
        </h3>
        <p className="text-base leading-6 mb-4 mt-2">
          Please run these commands with caution — some actions are
          irreversible.
        </p>
      </Guard>
      <Guard features={[AdminPanelFeature.UnverifyEmail]}>
        <h2 className="header-lg">Email Confirmation</h2>
        <div className="border-l-2 border-red-600 mb-4 pl-4">
          <p className="text-base leading-6">
            Reset email confirmation. User needs to re-confirm on next login.
          </p>
          <button
            className="bg-grey-10 border-2 border-grey-100 font-medium h-12 leading-6 mt-4 mr-4 rounded text-red-700 w-40 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
            type="button"
            onClick={handleUnverify}
          >
            Unconfirm Email
          </button>
          <br />
          <p className="text-base">{unverifyMessage}</p>
        </div>
      </Guard>
      <Guard features={[AdminPanelFeature.DisableAccount]}>
        <h2 className="header-lg">Disable Login</h2>
        <div className="border-l-2 border-red-600 mb-4 pl-4">
          <p className="text-base leading-6 ">
            Stops this account from logging in.
          </p>
          {disabledAt ? (
            <div>{getFormattedDate(disabledAt)}</div>
          ) : (
            <button
              className="bg-grey-10 border-2 border-grey-100 font-medium h-12 leading-6 mt-4 mr-4 rounded text-red-700 w-40 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
              type="button"
              onClick={handleDisable}
            >
              Disable
            </button>
          )}
        </div>
      </Guard>
      <Guard features={[AdminPanelFeature.SendPasswordResetEmail]}>
        <h2 className="header-lg">Send Password Reset Email</h2>
        <div className="border-l-2 border-red-600 mb-4 pl-4">
          <p className="text-base leading-6 ">
            Send the user a password reset email to all verified emails. For
            Sync users this will also reset their encryption key so make sure
            they have a backup of Sync data.
          </p>
          <button
            className="bg-grey-10 border-2 border-grey-100 font-medium h-12 leading-6 mt-4 mr-4 rounded text-red-700 w-40 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
            type="button"
            onClick={handleSendPasswordReset}
            data-testid="password-reset-button"
          >
            Password Reset
          </button>
        </div>
      </Guard>
      {disabledAt && (
        <Guard features={[AdminPanelFeature.EnableAccount]}>
          <h2 className="header-lg">Enable Login</h2>
          <div className="border-l-2 border-red-600 mb-4 pl-4">
            <p className="text-base leading-6">
              Allows this account to log in.
            </p>
            <button
              className="bg-grey-10 border-2 border-grey-100 font-medium h-12 leading-6 mt-4 mr-4 rounded text-red-700 w-40 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
              type="button"
              onClick={handleEnable}
            >
              Enable
            </button>
          </div>
        </Guard>
      )}
    </section>
  );
};

export default DangerZone;
