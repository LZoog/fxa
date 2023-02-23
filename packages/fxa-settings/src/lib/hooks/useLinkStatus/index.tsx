/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { useEffect, useState } from 'react';
import { searchParams } from '../../utilities';

export enum LinkStatus {
  damaged = 'damaged',
  expired = 'expired',
  valid = 'valid',
}

function useLinkStatus() {
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(LinkStatus.valid);
  const { email, token, code, uid, emailToHashWith } = searchParams(
    window.location.search
  );

  return {
    linkStatus,
    setLinkStatus,
    email,
    token,
    code,
    uid,
    emailToHashWith,
  };
}

export function useCompleteResetPasswordLinkStatus() {
  const { linkStatus, setLinkStatus, token, code, email, emailToHashWith } =
    useLinkStatus();

  useEffect(() => {
    if (!token || !code || !email || !emailToHashWith) {
      setLinkStatus(LinkStatus.damaged);
    } else {
      setLinkStatus(LinkStatus.valid);
    }
  }, [token, code, email, emailToHashWith, setLinkStatus]);

  return {
    linkStatus,
    setLinkStatus,
    token,
    code,
    email,
  };
}

export function useAccountRecoveryConfirmKeyLinkStatus() {
  const { linkStatus, setLinkStatus, token, code, email, uid } =
    useLinkStatus();

  useEffect(() => {
    if (!token || !code || !email) {
      setLinkStatus(LinkStatus.damaged);
    }
  }, [token, code, email, setLinkStatus]);

  return {
    linkStatus,
    setLinkStatus,
    token,
    code,
    email,
    uid,
  };
}
