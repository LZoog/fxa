/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { gql, useMutation } from '@apollo/client';
import {
  Account as AccountType,
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
import { getFormattedDate, HIDE_ROW } from '../../../lib/utils';
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

const ResultBoolean = ({ value, testId }: { value: any; testId?: string }) => {
  if (!value) {
    return (
      <span className="font-semibold text-red-600" data-testid={testId}>
        No
      </span>
    );
  }

  return (
    <span className="font-semibold text-green-900" data-testid={testId}>
      Yes
    </span>
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
      const newLocale = window.prompt('Enter a new locale.');
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
      <hr />
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

        <TableXHeaders
          header="Primary Email"
          rowHeaders={['Email', 'Confirmed']}
        >
          <TableRowXHeader>
            <span
              data-testid="primary-email"
              className={highlight(primaryEmail.email)}
            >
              {primaryEmail.email}
            </span>

            <ResultBoolean value={primaryEmail.isVerified} />
          </TableRowXHeader>
        </TableXHeaders>

        <h3 className="header-lg">Secondary Emails</h3>
        {secondaryEmails.length > 0 ? (
          <TableXHeaders
            rowHeaders={['Email', 'Confirmed']}
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
                <ResultBoolean value={secondaryEmail.isVerified} />
              </TableRowXHeader>
            ))}
          </TableXHeaders>
        ) : (
          <p className="result-none">
            This account doesn't have any secondary emails.
          </p>
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
                <ResultBoolean value={totp.enabled} testId="totp-enabled" />
                <ResultBoolean value={totp.verified} testId="totp-verified" />
              </TableRowXHeader>
            ))}
          </TableXHeaders>
        ) : (
          <p className="result-none">
            This account hasn't started 2FA / TOTP setup.
          </p>
        )}

        <h3 className="header-lg">Account Recovery Key</h3>
        {recoveryKeys && recoveryKeys.length > 0 ? (
          <>
            {recoveryKeys.map((recoveryKey: RecoveryKeysType) => (
              <TableYHeaders key={createdAt}>
                <TableRowYHeader
                  header="Created At"
                  value={getFormattedDate(recoveryKey.createdAt)}
                  testId="recovery-keys-created-at"
                />
                <TableRowYHeader
                  header="Enabled"
                  value={<ResultBoolean value={recoveryKey.enabled} />}
                  testId="recovery-keys-enabled"
                />
                <TableRowYHeader
                  header="Confirmed"
                  value={<ResultBoolean value={recoveryKey.verifiedAt} />}
                  testId="recovery-keys-verified"
                />
                <TableRowYHeader
                  header="Confirmed At"
                  value={
                    recoveryKey.verifiedAt
                      ? getFormattedDate(recoveryKey.verifiedAt)
                      : HIDE_ROW
                  }
                />
              </TableYHeaders>
            ))}
          </>
        ) : (
          <p className="result-none">
            This account doesn't have an account recovery key created.
          </p>
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
          <p className="result-none">
            This account doesn't have any subscriptions.
          </p>
        )}

        <Guard features={[AdminPanelFeature.ConnectedServices]}>
          <h3 className="header-lg">Connected Services</h3>
          <ConnectedServices services={attachedClients} />
        </Guard>

        <h3 className="header-lg">Account History</h3>
        {securityEvents && securityEvents.length > 0 ? (
          <TableXHeaders rowHeaders={['Event', 'Timestamp']}>
            {securityEvents.map((securityEvents: SecurityEventsType) => (
              <TableRowXHeader>
                <>{securityEvents.name}</>
                <>{getFormattedDate(securityEvents.createdAt)}</>
              </TableRowXHeader>
            ))}
          </TableXHeaders>
        ) : (
          <p data-testid="account-security-events" className="result-none">
            This account doesn't have any linked accounts.
          </p>
        )}

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
          <p data-testid="account-security-events" className="result-none">
            This account doesn't have any linked accounts.
          </p>
        )}
      </section>

      <DangerZone
        {...{
          uid,
          disabledAt: disabledAt!,
          email: primaryEmail, // only the primary for now
          onCleared: onCleared,
        }}
      />
    </>
  );
};

export default Account;
