/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { MozSubscription } from 'fxa-admin-server/src/graphql';
import LinkExternal from 'fxa-react/components/LinkExternal';
import { ReactComponent as IconExternalLink } from '../../../images/icon-external-link.svg';
import { getFormattedDate, HIDE_ROW } from '../../../lib/utils';
import { TableRowYHeader, TableYHeaders } from '../../TableYHeaders';

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
}: MozSubscription) => (
  <TableYHeaders>
    <TableRowYHeader header="Product name" value={productName} />
    <TableRowYHeader header="Status" value={status} />
    <TableRowYHeader header="Created at" value={getFormattedDate(created)} />
    <TableRowYHeader
      header="Ended at"
      value={endedAt ? getFormattedDate(endedAt) : HIDE_ROW}
    />
    <TableRowYHeader
      header="Current period start"
      value={getFormattedDate(currentPeriodStart)}
    />
    <TableRowYHeader
      header="Current period end"
      value={getFormattedDate(currentPeriodEnd)}
    />
    <TableRowYHeader
      header="Cancel at period end?"
      value={cancelAtPeriodEnd ? 'Yes' : 'No'}
    />

    <TableRowYHeader header="Subscription ID" value={subscriptionId} />
    <TableRowYHeader header="Product ID" value={productId} />
    <TableRowYHeader header="Plan ID" value={planId} />

    <TableRowYHeader
      header="Links"
      value={
        <>
          {!!latestInvoice && (
            <LinkExternal href={latestInvoice} className="underline block">
              Latest invoice
              <IconExternalLink className="ml-2 w-4 inline-block icon-dark" />
            </LinkExternal>
          )}

          {!!manageSubscriptionLink && (
            <LinkExternal
              href={manageSubscriptionLink}
              className="underline block"
            >
              Manage Subscription
              <IconExternalLink className="ml-2 w-4 inline-block icon-dark" />
            </LinkExternal>
          )}
        </>
      }
    />
  </TableYHeaders>
);

export default Subscription;
