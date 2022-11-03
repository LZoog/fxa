/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MozSubscription } from 'fxa-admin-server/src/graphql';
import LinkExternal from 'fxa-react/components/LinkExternal';
import { ReactComponent as IconExternalLink } from '../../../images/icon-external-link.svg';
import { getFormattedDate } from '../../../lib/utils';

const Subscription = ({
  created,
  currentPeriodEnd,
  currentPeriodStart,
  cancelAtPeriodEnd,
  endedAt,
  latestInvoice,
  manageSubscriptionLink,
  planId,
  productName,
  productId,
  status,
  subscriptionId,
}: MozSubscription) => {
  return (
    <ul className="account-border-info">
      <li className="account-li">
        Product name: <span>{productName}</span>
      </li>
      <li className="account-li">
        Status: <span>{status}</span>
      </li>
      <li className="account-li">
        Created at: <span>{getFormattedDate(created)}</span>
      </li>
      {endedAt != null && (
        <li className="account-li">
          Ended at: <span>{getFormattedDate(endedAt)}</span>
        </li>
      )}
      <li className="account-li">
        Current period start:{' '}
        <span>{getFormattedDate(currentPeriodStart)}</span>
      </li>
      <li className="account-li">
        Current period end: <span>{getFormattedDate(currentPeriodEnd)}</span>
      </li>
      <li className="account-li">
        Cancel at period end? <span>{cancelAtPeriodEnd ? 'Yes' : 'No'}</span>
      </li>

      <li className="account-li mt-2">
        Subscription ID: <span>{subscriptionId}</span>
      </li>
      <li className="account-li">
        Product ID: <span>{productId}</span>
      </li>
      <li className="account-li">
        Plan ID: <span>{planId}</span>
      </li>

      {!!latestInvoice && (
        <li className="account-li mt-2">
          <LinkExternal href={latestInvoice} className="underline">
            Latest invoice
            <IconExternalLink className="ml-2 w-4 inline-block icon-dark" />
          </LinkExternal>
        </li>
      )}

      {!!manageSubscriptionLink && (
        <li className="account-li mt-2">
          <LinkExternal href={manageSubscriptionLink} className="underline">
            Manage Subscription
            <IconExternalLink className="ml-2 w-4 inline-block icon-dark" />
          </LinkExternal>
        </li>
      )}
    </ul>
  );
};

export default Subscription;
