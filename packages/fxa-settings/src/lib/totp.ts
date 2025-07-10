/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { authenticator } from '@otplib/preset-browser';

import random from './random';

// Configure otplib to match server-side settings
authenticator.options = {
  ...authenticator.options,
  step: 30, // 30 seconds, matching server config
  window: 1, // 1 window, matching server config
};

export async function getCode(
  secret: string,
  digits: number = 6,
  timestamp: number = Date.now()
): Promise<string> {
  return authenticator.generate(secret);
}

export async function checkCode(
  secret: string,
  code: string,
  timestamp: number = Date.now(),
  tries = 2
): Promise<boolean> {
  // otplib handles window checking internally, so we just verify once
  return authenticator.verify({ token: code, secret });
}

export function copyRecoveryCodes(event: React.ClipboardEvent<HTMLElement>) {
  const selection = document.getSelection();
  if (selection) {
    event.clipboardData.setData(
      'text/plain',
      selection.toString().replace(/\s/g, '\n')
    );
    event.preventDefault();
  }
}

export async function generateRecoveryCodes(count: number, length: number) {
  const recoveryCodes: string[] = [];
  const gen = random.base32(length);
  while (recoveryCodes.length < count) {
    const rc = (await gen()).toLowerCase();
    if (recoveryCodes.indexOf(rc) === -1) {
      recoveryCodes.push(rc);
    }
  }
  return recoveryCodes;
}
