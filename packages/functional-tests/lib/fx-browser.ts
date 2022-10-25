/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Page } from '@playwright/test';

/**
 * Test if the browser has been notified of a CustomEvent login message.
 */
export async function testIsBrowserNotifiedOfLogin(
  page: Page,
  email: string,
  expectVerified = false
) {
  const data = await JSON.parse(
    await page.locator('#message-login').innerText()
  );
  expect(data.email).toEqual(email);
  expect(data.unwrapBKey).toBeTruthy();
  expect(data.keyFetchToken).toBeTruthy();

  if (expectVerified) {
    expect(data.verified).toBeTruthy();
  } else {
    expect(data.verified).toBeFalsy();
  }
}
