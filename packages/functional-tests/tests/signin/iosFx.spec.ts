/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EmailClient } from '../../lib/email';
import { test, expect } from '../../lib/fixtures/standard';
import { UA_STRINGS } from '../../lib/ua-strings';

test.use({ userAgent: UA_STRINGS['ios_firefox_11_0'] });

test.describe('FxiOS v1 sign up', () => {
  // test.beforeEach(async () => {
  //   test.use({ userAgent: UA_STRINGS['ios_firefox_11_0'] });
  // });

  test('opening directly to /signup redirects to /', async ({
    target,
    page,
    pages: { login },
  }) => {
    await page.goto(
      `${target.contentServerUrl}/signup?context=fx_ios_v1&service=sync`
    );
    expect(await login.isEnterEmailHeader()).toBe(true);
  });

  test('sign up + CWTS, verify same browser', async ({
    target,
    page,
    pages: { login },
  }, testInfo) => {
    await page.goto(
      `${target.contentServerUrl}?context=fx_ios_v1&service=sync`
    );
    // In Fx for iOS >= 11.0, user should be transitioned to the choose what to Sync page
    expect(await login.isCWTSHeader()).toBe(true);

    await Promise.all([
      await page.click(login.selectors.CWTS_ENGINE_HISTORY),
      await page.click(login.selectors.CWTS_ENGINE_PASSWORDS),
    ]);

    const email = EmailClient.emailFromTestTitle(testInfo.title);
    const password = 'asdzxcasd';

    await login.fillOutFirstSignUp(email, password);
  });
});
