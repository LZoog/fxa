/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Decide whether an OAuth signin is the *first* time a user has used a given
// service / relying party, from the existing accountAuthorizations consent rows
// read just before this authorization's rows are written.
//
// Two grains, because the ledger keys on (uid, scope, service, clientId):
//  - Browser service (an OAuthNative service): Firefox shares a client ID across all
//    OAuth Native services for that client, so "new to the service" must key on `service`.
//  - Web RP (service=''): the clientId *is* the RP, so key on clientId.
//
// `sync` is included but NOT currently reliable: Desktop always creates a sync-scoped
// access token even when signing into another service, so a first sync can't be told apart
// from a first use of that other service. Native clients with no resolved service are
// ambiguous and excluded (return false).

export type ConsentRowLike = {
  service: string;
  /** Hex-encoded OAuth client id (the caller normalizes Buffer rows to hex). */
  clientId: string;
};

export function deriveFirstAuthorization(params: {
  /** Resolved native service for this authorization ('' for web RPs). */
  serviceValue: string;
  /** Hex OAuth client id for this authorization. */
  clientIdHex: string;
  /** Whether clientIdHex is a native (browser) client. */
  isNativeClient: boolean;
  /** The user's accountAuthorizations rows read *before* this auth's writes. */
  existingConsents: ConsentRowLike[];
}): boolean {
  const { serviceValue, clientIdHex, isNativeClient, existingConsents } =
    params;

  if (serviceValue) {
    // OAuthNative: new to the service= query param passed in
    return !existingConsents.some((r) => r.service === serviceValue);
  }

  if (!serviceValue && !isNativeClient) {
    // Web RP: new to the RP, identified by clientId.
    return !existingConsents.some((r) => r.clientId === clientIdHex);
  }

  // Native client with no resolved service: ambiguous
  return false;
}
