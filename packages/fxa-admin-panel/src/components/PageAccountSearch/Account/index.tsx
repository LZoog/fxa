/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import dateFormat from 'dateformat';
import { gql, useMutation } from '@apollo/client';
import {
  Account as AccountType,
  EmailBounce as EmailBounceType,
  Email as EmailType,
  SecurityEvents as SecurityEventsType,
  Totp as TotpType,
  RecoveryKeys as RecoveryKeysType,
  LinkedAccount as LinkedAccountType,
} from 'fxa-admin-server/src/graphql';
import { AdminPanelFeature } from 'fxa-shared/guards';
import Guard from '../../Guard';
import Subscription from '../Subscription';
import { ConnectedServices } from '../ConnectedServices';
import { ReactElement } from 'react';
import getEmailBounceDescription from '../EmailBounces/getBounceDescription';
import { TableRowYHeader, TableYHeaders } from '../../TableYHeaders';
import { TableRowXHeader, TableXHeaders } from '../../TableXHeaders';
import { EmailBounces } from '../EmailBounces';

export type AccountProps = AccountType & {
  onCleared: () => void;
  query: string;
};

type DangerZoneProps = {
  uid: string;
  email: EmailType;
  disabledAt: number | null;
  onCleared: Function;
};

export const DATE_FORMAT = 'yyyy-mm-dd @ HH:MM:ss Z';

export const RECORD_ADMIN_SECURITY_EVENT = gql`
  mutation recordAdminSecurityEvent($uid: String!, $name: String!) {
    recordAdminSecurityEvent(uid: $uid, name: $name)
  }
`;

export const DISABLE_ACCOUNT = gql`
  mutation disableAccount($uid: String!) {
    disableAccount(uid: $uid)
  }
`;

export const EDIT_LOCALE = gql`
  mutation editLocale($uid: String!, $locale: String!) {
    editLocale(uid: $uid, locale: $locale)
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

export const UNLINK_ACCOUNT = gql`
  mutation unlinkAccount($uid: String!) {
    unlinkAccount(uid: $uid)
  }
`;

export const LinkedAccount = ({
  uid,
  authAt,
  providerId,
  onCleared,
}: {
  uid: string;
  authAt: number;
  providerId: string;
  onCleared: () => void;
}) => {
  const [unlinkAccount] = useMutation(UNLINK_ACCOUNT, {
    onCompleted: () => {
      window.alert('The linked account has been removed.');
    },
    onError: () => {
      window.alert('Error unlinking account');
    },
  });

  const handleUnlinkAccount = async () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) {
      return;
    }
    await unlinkAccount({ variables: { uid } });

    onCleared();
  };

  return (
    <TableRowXHeader>
      <>{providerId}</>
      <>{dateFormat(new Date(authAt!), DATE_FORMAT)}</>
      <button
        className="p-1 text-red-700 border-2 rounded border-grey-100 bg-grey-10 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
        type="button"
        onClick={handleUnlinkAccount}
      >
        Unlink
      </button>
    </TableRowXHeader>
  );
};

// gql mutation to update emails table and unverify user's email
export const UNVERIFY_EMAIL = gql`
  mutation unverify($email: String!) {
    unverifyEmail(email: $email)
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
    <section>
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
            <div>
              Disabled at: {dateFormat(new Date(disabledAt), DATE_FORMAT)}
            </div>
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

export const Account = ({
  uid,
  email,
  emails,
  createdAt,
  disabledAt,
  locale,
  lockedAt,
  emailBounces,
  totp,
  recoveryKeys,
  attachedClients,
  subscriptions,
  onCleared,
  query,
  securityEvents,
  linkedAccounts,
}: AccountProps) => {
  const createdAtDate = dateFormat(new Date(createdAt), DATE_FORMAT);
  const disabledAtDate = dateFormat(new Date(disabledAt || 0), DATE_FORMAT);
  const lockedAtDate = dateFormat(new Date(lockedAt || 0), DATE_FORMAT);
  const primaryEmail = emails!.find((email) => email.isPrimary)!;
  const secondaryEmails = emails!.filter((email) => !email.isPrimary);

  const [editLocale] = useMutation(EDIT_LOCALE, {});
  const handleEditLocale = async () => {
    try {
      const newLocale = window.prompt('Enter a new local.');
      if (!newLocale) {
        return;
      }

      const res = await editLocale({
        variables: {
          uid,
          locale: newLocale,
        },
      });

      if (res.data?.editLocale) {
        onCleared();
      } else {
        window.alert(`Edit unsuccessful.`);
      }
    } catch (err) {
      window.alert(`An unexpected error was encountered. Edit unsuccessful.`);
    }
  };

  function highlight(val: string) {
    return query === val ? 'bg-yellow-100' : undefined;
  }

  return (
    <>
      <hr className="mt-4" />
      <section data-testid="account-data">
        <TableYHeaders header="Account Details">
          <TableRowYHeader
            header="Sign-up Email"
            value={<span className={highlight(email)}>{email}</span>}
            testId="sign-up-email"
          />
          <TableRowYHeader
            header="uid"
            value={<span className={highlight(uid)}>{uid}</span>}
            testId="account-uid"
          />
          <TableRowYHeader
            header="Created At"
            value={
              <>
                {createdAtDate} ({createdAt})
              </>
            }
            testId="account-created-at"
          />
          <TableRowYHeader
            header="Locale"
            value={
              <>
                {locale}

                <Guard features={[AdminPanelFeature.EditLocale]}>
                  <button
                    className="bg-grey-10 border-2 border-grey-100 font-small leading-6 ml-2 rounded text-red-700 w-10 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
                    type="button"
                    onClick={handleEditLocale}
                    data-testid="edit-account-locale"
                  >
                    Edit
                  </button>
                </Guard>
              </>
            }
            testId="account-locale"
          />
          <>
            {lockedAt != null && (
              <TableRowYHeader
                header="Locked At"
                className="bg-yellow-100"
                value={
                  <>
                    {lockedAtDate} ({lockedAt})
                  </>
                }
                testId="account-locked-at"
              />
            )}
          </>
          <>
            {disabledAt != null && (
              <TableRowYHeader
                header="Disabled At"
                className="bg-yellow-100"
                value={
                  <>
                    {disabledAtDate} ({disabledAt})
                  </>
                }
                testId="account-disabled-at"
              />
            )}
          </>
        </TableYHeaders>

        <TableXHeaders header="Primary Email" rowHeaders={['Email', 'Status']}>
          <TableRowXHeader>
            <span
              data-testid="primary-email"
              className={highlight(primaryEmail.email)}
            >
              {primaryEmail.email}
            </span>
            <>
              {primaryEmail.isVerified ? (
                <span className="confirmed">confirmed</span>
              ) : (
                <span className="unconfirmed">unconfirmed</span>
              )}
            </>
          </TableRowXHeader>
        </TableXHeaders>

        <h3 className="header-lg">Secondary Emails</h3>
        {secondaryEmails.length > 0 ? (
          <>
            {secondaryEmails.map((secondaryEmail) => (
              <TableXHeaders
                rowHeaders={['Email', 'Status']}
                testId="secondary-section"
                key={secondaryEmail.createdAt}
              >
                <TableRowXHeader>
                  <span
                    data-testid="secondary-email"
                    className={highlight(secondaryEmail.email)}
                  >
                    {secondaryEmail.email}
                  </span>
                  <>
                    {secondaryEmail.isVerified ? (
                      <span className="confirmed">confirmed</span>
                    ) : (
                      <span className="unconfirmed">unconfirmed</span>
                    )}
                  </>
                </TableRowXHeader>
              </TableXHeaders>
            ))}
          </>
        ) : (
          <p>This account doesn't have any secondary emails.</p>
        )}

        <EmailBounces {...{ emailBounces, uid, emails, onCleared }} />

        <h3 className="header-lg">Linked Accounts</h3>
        {linkedAccounts && linkedAccounts.length > 0 ? (
          <TableXHeaders rowHeaders={['Event', 'Timestamp', 'Action']}>
            {linkedAccounts.map((linkedAccount: LinkedAccountType) => (
              <LinkedAccount
                {...{
                  uid,
                  providerId: linkedAccount.providerId,
                  authAt: linkedAccount.authAt,
                  onCleared: onCleared,
                }}
              />
            ))}
          </TableXHeaders>
        ) : (
          <p data-testid="account-security-events">No linked accounts.</p>
        )}
      </section>
      <hr />

      <section>
        <DangerZone
          {...{
            uid,
            disabledAt: disabledAt!,
            email: primaryEmail, // only the primary for now
            onCleared: onCleared,
          }}
        />
      </section>
    </>
  );
};

export const HIDE_ROW = 'N/A';

const TotpEnabled = ({ verified, createdAt, enabled }: TotpType) => {
  const totpDate = dateFormat(new Date(createdAt), DATE_FORMAT);
  return (
    <li className="account-li">
      <ul className="account-border-info">
        <li className="account-li">
          TOTP Created At: <span data-testid="totp-created-at">{totpDate}</span>
        </li>
        <li className="account-li">
          TOTP Confirmed:{' '}
          <span
            data-testid="totp-verified"
            className={`ml-3 text-base ${
              verified ? 'confirmed' : 'unconfirmed'
            }`}
          >
            {verified ? 'confirmed' : 'unconfirmed'}
          </span>
        </li>
        <li className="account-li">
          TOTP Enabled:{' '}
          <span
            data-testid="totp-enabled"
            className={`ml-3 text-base ${
              enabled ? 'confirmed' : 'unconfirmed'
            }`}
          >
            {enabled ? 'enabled' : 'not-enabled'}
          </span>
        </li>
      </ul>
    </li>
  );
};

const RecoveryKeys = ({ verifiedAt, createdAt, enabled }: RecoveryKeysType) => {
  const recoveryKeyCreatedDate = dateFormat(new Date(createdAt!), DATE_FORMAT);
  const recoveryKeyVerifiedDate = dateFormat(
    new Date(verifiedAt!),
    DATE_FORMAT
  );
  return (
    <li className="account-li">
      <ul className="account-border-info">
        <li className="account-li">
          Account Recovery Key Created At:{' '}
          <span data-testid="recovery-keys-created-at">
            {recoveryKeyCreatedDate}
          </span>
        </li>
        <li className="account-li">
          Account Recovery Key Confirmed At:{' '}
          <span
            data-testid="recovery-keys-verified"
            className={`ml-3 text-base ${
              verifiedAt ? 'confirmed' : 'unconfirmed'
            }`}
          >
            {verifiedAt ? recoveryKeyVerifiedDate : 'unconfirmed'}
          </span>
        </li>
        <li className="account-li">
          Account Recovery Key Enabled:{' '}
          <span
            data-testid="recovery-keys-enabled"
            className={`ml-3 text-base ${
              enabled ? 'confirmed' : 'unconfirmed'
            }`}
          >
            {enabled ? 'enabled' : 'not-enabled'}
          </span>
        </li>
      </ul>
    </li>
  );
};

export default Account;
