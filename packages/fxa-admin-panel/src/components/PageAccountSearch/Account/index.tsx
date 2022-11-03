/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
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
import { TableRowYHeader, TableYHeaders } from '../../TableYHeaders';
import { TableRowXHeader, TableXHeaders } from '../../TableXHeaders';
import EmailBounces from '../EmailBounces';
import { getFormattedDate } from '../../../lib/utils';
import DangerZone from '../DangerZone';

export type AccountProps = AccountType & {
  onCleared: () => void;
  query: string;
};

export const RECORD_ADMIN_SECURITY_EVENT = gql`
  mutation recordAdminSecurityEvent($uid: String!, $name: String!) {
    recordAdminSecurityEvent(uid: $uid, name: $name)
  }
`;

export const EDIT_LOCALE = gql`
  mutation editLocale($uid: String!, $locale: String!) {
    editLocale(uid: $uid, locale: $locale)
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
      <>{getFormattedDate(authAt)}</>
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

export const Account = ({
  uid,
  email,
  emails,
  createdAt,
  disabledAt,
  locale,
  lockedAt,
  emailBounces,
  totp: totps,
  recoveryKeys,
  attachedClients,
  subscriptions,
  onCleared,
  query,
  securityEvents,
  linkedAccounts,
}: AccountProps) => {
  const createdAtDate = getFormattedDate(createdAt);
  const disabledAtDate = getFormattedDate(disabledAt);
  const lockedAtDate = getFormattedDate(lockedAt);
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
                value={`${lockedAtDate} (${lockedAt})`}
                testId="account-locked-at"
              />
            )}
          </>
          <>
            {disabledAt != null && (
              <TableRowYHeader
                header="Disabled At"
                className="bg-yellow-100"
                value={`${disabledAtDate} (${disabledAt})`}
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
          <TableXHeaders
            rowHeaders={['Email', 'Status']}
            testId="secondary-section"
          >
            {secondaryEmails.map((secondaryEmail) => (
              <TableRowXHeader key={secondaryEmail.createdAt}>
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
            ))}
          </TableXHeaders>
        ) : (
          <p>This account doesn't have any secondary emails.</p>
        )}

        <EmailBounces {...{ emailBounces, uid, emails, onCleared }} />

        <h3 className="header-lg">
          2FA / TOTP (Time-Based One-Time Passwords)
        </h3>
        {totps && totps.length > 0 ? (
          <TableXHeaders rowHeaders={['Created At', 'Enabled', 'Confirmed']}>
            {totps.map((totp: TotpType) => (
              <TableRowXHeader key={totp.createdAt}>
                <span data-testid="totp-created-at">
                  {getFormattedDate(totp.createdAt)}
                </span>
                <span data-testid="totp-enabled">
                  {totp.enabled ? 'enabled' : 'not enabled'}
                </span>
                <span data-testid="totp-verified">
                  {totp.verified ? 'confirmed' : 'unconfirmed'}
                </span>
              </TableRowXHeader>
            ))}
          </TableXHeaders>
        ) : (
          <p>This account doesn't have 2FA / TOTP created.</p>
        )}

        <h3 className="header-lg">Account Recovery Key</h3>
        {recoveryKeys && recoveryKeys.length > 0 ? (
          <TableXHeaders rowHeaders={['Created At', 'Enabled', 'Confirmed At']}>
            {recoveryKeys.map((recoveryKey: RecoveryKeysType) => (
              <TableRowXHeader key={recoveryKey.createdAt}>
                <span data-testid="recovery-keys-created-at">
                  {getFormattedDate(recoveryKey.createdAt)}
                </span>
                <span data-testid="recovery-keys-enabled">
                  {recoveryKey.enabled ? 'enabled' : 'not enabled'}
                </span>
                <span data-testid="recovery-keys-verified">
                  {recoveryKey.verifiedAt
                    ? getFormattedDate(recoveryKey.verifiedAt)
                    : 'unconfirmed'}
                </span>
              </TableRowXHeader>
            ))}
          </TableXHeaders>
        ) : (
          <p>This account doesn't have an account recovery key created.</p>
        )}

        <h3 className="header-lg">Subscriptions</h3>
        {subscriptions && subscriptions.length > 0 ? (
          <>
            {subscriptions.map((subscription) => (
              <Subscription
                key={subscription.subscriptionId}
                {...subscription}
              />
            ))}
          </>
        ) : (
          <p>This account doesn't have any subscriptions.</p>
        )}

        <Guard features={[AdminPanelFeature.ConnectedServices]}>
          <h3 className="header-lg">Connected Services</h3>
          <ConnectedServices services={attachedClients} />
        </Guard>

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
          <p data-testid="account-security-events">
            This account doesn't have any linked accounts.
          </p>
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

export default Account;
