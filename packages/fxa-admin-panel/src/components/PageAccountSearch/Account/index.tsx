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
  BounceType,
  BounceSubType,
} from 'fxa-admin-server/src/graphql';

import { AdminPanelFeature } from 'fxa-shared/guards';
import BOUNCE_DESCRIPTIONS from './bounce-descriptions';
import Guard from '../../Guard';
import Subscription from '../Subscription';
import { ConnectedServices } from '../ConnectedServices';
import { ReactElement } from 'react';

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

export const CLEAR_BOUNCES_BY_EMAIL = gql`
  mutation clearBouncesByEmail($email: String!) {
    clearEmailBounce(email: $email)
  }
`;

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
    <tr key={`${authAt}-${providerId}`}>
      <td>{providerId}</td>
      <td className="text-left pl-8">
        {dateFormat(new Date(authAt!), DATE_FORMAT)}
      </td>
      <td className="pl-4 align-middle">
        <button
          className="p-1 text-red-700 border-2 rounded border-grey-100 bg-grey-10 hover:border-2 hover:border-grey-10 hover:bg-grey-50 hover:text-red-700"
          type="button"
          onClick={handleUnlinkAccount}
        >
          Unlink
        </button>
      </td>
    </tr>
  );
};

export const ClearButton = ({
  emails,
  onCleared,
  uid,
}: {
  emails: string[];
  onCleared: Function;
  uid: string;
}) => {
  const [clearBounces] = useMutation(CLEAR_BOUNCES_BY_EMAIL);
  const [recordAdminSecurityEvent] = useMutation(RECORD_ADMIN_SECURITY_EVENT);

  const handleClear = () => {
    if (!window.confirm('Are you sure? This cannot be undone.')) {
      return;
    }

    // This could be improved to clear bounces for individual email
    // addresses, but for now it seems satisfactory to clear all bounces
    // for all emails, since they own all of the addresses
    emails.forEach((email) => clearBounces({ variables: { email } }));
    recordAdminSecurityEvent({
      variables: { uid: uid, name: 'emails.clearBounces' },
    });
    onCleared();
  };

  return (
    <>
      <Guard features={[AdminPanelFeature.ClearEmailBounces]}>
        <button
          data-testid="clear-button"
          className="bg-red-600 border-0 rounded-md text-base mx-0 mb-6 px-4 py-3 text-white transition duration-200 hover:bg-red-700"
          onClick={handleClear}
        >
          Clear all bounces
        </button>
      </Guard>
    </>
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
        <h2 className="result-header">Email Confirmation</h2>
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
        <h2 className="result-header">Disable Login</h2>
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
        <h2 className="result-header">Send Password Reset Email</h2>
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
          <h2 className="result-header">Enable Login</h2>
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
        <h3 className="result-header">Account Details</h3>
        <table className="result-table">
          <tbody>
            <ResultTableRow
              label="Sign-up Email"
              value={<span className={highlight(email)}>{email}</span>}
              testId="sign-up-email"
            />
            <ResultTableRow
              label="uid"
              value={<span className={highlight(uid)}>{uid}</span>}
              testId="account-uid"
            />
            <ResultTableRow
              label="Created At"
              value={
                <>
                  {createdAtDate} ({createdAt})
                </>
              }
              testId="account-created-at"
            />
            <ResultTableRow
              label="Locale"
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
            {lockedAt != null && (
              <ResultTableRow
                label="Locked At"
                className="bg-yellow-100"
                value={
                  <>
                    {lockedAtDate} ({lockedAt})
                  </>
                }
                testId="account-locked-at"
              />
            )}
            {disabledAt != null && (
              <ResultTableRow
                label="Disabled At"
                className="bg-yellow-100"
                value={
                  <>
                    {disabledAtDate} ({disabledAt})
                  </>
                }
                testId="account-disabled-at"
              />
            )}
          </tbody>
        </table>

        <h3 className="result-header">Primary Email</h3>
        <table className="result-table" data-testid="primary-section">
          <tbody>
            <ResultTableRow
              label="Email"
              value={
                <span
                  data-testid="primary-email"
                  className={highlight(primaryEmail.email)}
                >
                  {primaryEmail.email}
                </span>
              }
            />
            <ResultTableRow
              label="Status"
              value={
                primaryEmail.isVerified ? (
                  <span className="confirmed">confirmed</span>
                ) : (
                  <span className="unconfirmed">unconfirmed</span>
                )
              }
            />
          </tbody>
        </table>

        <h3 className="result-header">Secondary Emails</h3>
        {secondaryEmails.length > 0 ? (
          <>
            {secondaryEmails.map((secondaryEmail) => (
              <table
                className="result-table"
                data-testid="secondary-section"
                key={secondaryEmail.createdAt}
              >
                <tbody>
                  <ResultTableRow
                    label="Email"
                    value={
                      <span
                        data-testid="secondary-email"
                        className={highlight(secondaryEmail.email)}
                      >
                        {secondaryEmail.email}
                      </span>
                    }
                  />
                  <ResultTableRow
                    label="Status"
                    value={
                      secondaryEmail.isVerified ? (
                        <span className="confirmed">confirmed</span>
                      ) : (
                        <span className="unconfirmed">unconfirmed</span>
                      )
                    }
                  />
                </tbody>
              </table>
            ))}
          </>
        ) : (
          <p>This account doesn't have any secondary emails.</p>
        )}

        <h3 className="result-header">Email Bounces</h3>
        {emailBounces && emailBounces.length > 0 ? (
          <>
            <ClearButton
              {...{
                uid,
                emails: emails!.map((emails) => emails.email),
                onCleared,
              }}
            />
            {emailBounces.map((emailBounce: EmailBounceType) => (
              <EmailBounce key={emailBounce.createdAt} {...emailBounce} />
            ))}
          </>
        ) : (
          <p
            data-testid="no-bounces-message"
            className="account-li account-border-info"
          >
            This account doesn't have any bounced emails.
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

export const HIDE_ROW = 'N/A';

const getEmailBounceDescription = (
  bounceType: string,
  bounceSubType: string
) => {
  let description: string[] | string = HIDE_ROW;
  switch (bounceType) {
    case BounceType.Undetermined: {
      if (bounceSubType === BounceSubType.Undetermined) {
        description = BOUNCE_DESCRIPTIONS.undetermined;
      }
      break;
    }

    case BounceType.Permanent: {
      if (bounceSubType === BounceSubType.General) {
        description = BOUNCE_DESCRIPTIONS.permanentGeneral;
      } else if (bounceSubType === BounceSubType.NoEmail) {
        description = BOUNCE_DESCRIPTIONS.permanentNoEmail;
      } else if (bounceSubType === BounceSubType.Suppressed) {
        description = BOUNCE_DESCRIPTIONS.permanentSuppressed;
      } else if (bounceSubType === BounceSubType.OnAccountSuppressionList) {
        description = BOUNCE_DESCRIPTIONS.permanentOnAccountSuppressionList;
      }
      break;
    }

    case BounceType.Transient: {
      if (bounceSubType === BounceSubType.General) {
        description = BOUNCE_DESCRIPTIONS.transientGeneral;
      } else if (bounceSubType === BounceSubType.MailboxFull) {
        description = BOUNCE_DESCRIPTIONS.transientMailboxFull;
      } else if (bounceSubType === BounceSubType.MessageTooLarge) {
        description = BOUNCE_DESCRIPTIONS.transientMessageTooLarge;
      } else if (bounceSubType === BounceSubType.ContentRejected) {
        description = BOUNCE_DESCRIPTIONS.transientContentRejected;
      } else if (bounceSubType === BounceSubType.AttachmentRejected) {
        description = BOUNCE_DESCRIPTIONS.transientAttachmentRejected;
      }
      break;
    }

    case BounceType.Complaint: {
      if (bounceSubType === BounceSubType.Abuse) {
        description = BOUNCE_DESCRIPTIONS.complaintAbuse;
      } else if (bounceSubType === BounceSubType.AuthFailure) {
        description = BOUNCE_DESCRIPTIONS.complaintAuthFailure;
      } else if (bounceSubType === BounceSubType.Fraud) {
        description = BOUNCE_DESCRIPTIONS.complaintFraud;
      } else if (bounceSubType === BounceSubType.NotSpam) {
        description = BOUNCE_DESCRIPTIONS.complaintNotSpam;
      } else if (bounceSubType === BounceSubType.Other) {
        description = BOUNCE_DESCRIPTIONS.complaintOther;
      } else if (bounceSubType === BounceSubType.Virus) {
        description = BOUNCE_DESCRIPTIONS.complaintVirus;
      }
      break;
    }

    default: {
    }
  }

  if (Array.isArray(description))
    return description.map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  return description;
};

const EmailBounce = ({
  email,
  templateName,
  createdAt,
  bounceType,
  bounceSubType,
  diagnosticCode,
}: EmailBounceType) => {
  const date = dateFormat(new Date(createdAt), DATE_FORMAT);
  const bounceDescription = getEmailBounceDescription(
    bounceType,
    bounceSubType
  );
  return (
    <table className="result-table" data-testid={'bounce-group'}>
      <tbody>
        <ResultTableRow label="email" value={email} testId={'bounce-email'} />
        <ResultTableRow
          label="template"
          value={templateName}
          testId={'bounce-template'}
        />
        <ResultTableRow
          label="created at"
          value={`${createdAt} (${date})`}
          testId={'bounce-createdAt'}
        />
        <ResultTableRow
          label="bounce type"
          value={bounceType}
          testId={'bounce-type'}
        />
        <ResultTableRow
          label="bounce subtype"
          value={bounceSubType}
          testId={'bounce-subtype'}
        />
        <ResultTableRow
          label="bounce description"
          value={bounceDescription}
          testId={'bounce-description'}
        />
        <ResultTableRow
          label="diagnostic code"
          value={diagnosticCode?.length ? diagnosticCode : HIDE_ROW}
          testId={'bounce-diagnostic-code'}
        />
      </tbody>
    </table>
  );
};

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

export const ResultTableRow = ({
  label,
  value,
  testId,
  className,
}: {
  label: string | ReactElement;
  value?: null | string | ReactElement | ReactElement[];
  testId?: string;
  className?: string;
}) => {
  console.log('value', value);
  if (!value || value === 'Unknown' || value === HIDE_ROW) {
    return null;
  }

  return (
    <tr {...{ className }}>
      <th>{label}</th>
      <td data-testid={testId} className="px-2 py-1 border-b border-grey-10">
        {value}
      </td>
    </tr>
  );
};

export default Account;
