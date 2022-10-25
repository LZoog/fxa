/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EmailClient } from '../../lib/email';
import { test, expect, newPagesForSync } from '../../lib/fixtures/standard';
import { testIsBrowserNotifiedOfLogin } from '../../lib/fx-browser';
import { UA_STRINGS } from '../../lib/ua-strings';

test.use({ userAgent: UA_STRINGS['ios_firefox_11_0'] });

test.describe('FxiOS v1 sign up', () => {
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

  test('sign up + CWTS, verify same browser', async ({ target }, testInfo) => {
    const { page, login } = await newPagesForSync(target);
    await page.goto(
      `${target.contentServerUrl}?context=fx_ios_v1&service=sync`
    );

    const email = EmailClient.emailFromTestTitle(testInfo.title);
    const password = 'asdzxcasd';
    await login.fillOutFirstSignUp(email, password, false);

    // In Fx for iOS >= 11.0, user should be transitioned to the choose what to Sync page
    expect(await login.isCWTSHeader()).toBe(true);

    // await Promise.all([
    //   await page.click(selectors.CWTS_ENGINE_HISTORY),
    //   await page.click(selectors.CWTS_ENGINE_PASSWORDS),
    // ]);

    // the login message is only sent after the sync preferences screen
    // has been cleared.
    // await testIsBrowserNotifiedOfLogin(email);

    // test email is sent
  });
});
