/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import path from 'path';
import { readFileSync } from 'fs';
import { FluentBundle, FluentResource, FluentVariable } from '@fluent/bundle';
import { Pattern } from '@fluent/bundle/esm/ast';
import { queries, Screen } from '@testing-library/react';

type PackageName = 'settings' | 'payments' | null;

function getFtlFromPackage(packageName: PackageName, locale: string) {
  let ftlPath: string;
  switch (packageName) {
    case 'settings':
      ftlPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'fxa-settings',
        'public',
        'locales',
        locale,
        'settings.ftl'
      );
      break;
    case 'payments':
      ftlPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'fxa-payments-server',
        'public',
        'locales',
        locale,
        'main.ftl'
      );
      break;
    default:
      ftlPath = path.join(__dirname, 'test.ftl');
      break;
  }
  return readFileSync(ftlPath).toString();
}

export function getFtlBundle(
  packageName: PackageName,
  locale = 'en'
): FluentBundle {
  const messages = getFtlFromPackage(packageName, locale);
  const resource = new FluentResource(messages);
  const bundle = new FluentBundle(locale, { useIsolating: false });
  bundle.addResource(resource);
  return bundle;
}

function testMessage(
  bundle: FluentBundle,
  pattern: Pattern,
  fallbackText: string | null,
  ftlArgs?: Record<string, FluentVariable>
) {
  const ftlMsg = bundle.formatPattern(pattern, ftlArgs);

  // We allow for .includes because fallback text comes from `textContent` within the
  // `FtlMsg` wrapper which may contain more than one component and string
  if (ftlMsg !== fallbackText && !fallbackText?.includes(ftlMsg)) {
    throw Error(
      `Fallback text does not match Fluent message.\nFallback text: ${fallbackText}\nFluent message: ${ftlMsg}`
    );
  }

  if (ftlMsg.includes("'")) {
    throw Error(
      `Fluent message contains a straight apostrophe (') or ") and must be updated to its curly equivalent (’). Fluent message: ${ftlMsg}`
    );
  }

  if (ftlMsg.includes('"')) {
    throw Error(
      `Fluent message contains a straight quote (") and must be updated to its curly equivalent (“”). Fluent message: ${ftlMsg}`
    );
  }
}

/**
 * Convenience function for running `testL10n` against all mocked `FtlMsg`s
 * (`data-testid='ftlmsg-mock'`) found.
 * @param screen
 * @param bundle Fluent bundle created during test setup
 */
export function testAllL10n(
  { getAllByTestId }: Screen<typeof queries>,
  bundle: FluentBundle
) {
  const ftlMsgMocks = getAllByTestId('ftlmsg-mock');
  ftlMsgMocks.forEach((ftlMsgMock) => {
    testL10n(ftlMsgMock, bundle);
  });
}

/**
 * Takes in a mocked FtlMsg and tests that:
 *  * Fluent IDs and message are present in the Fluent bundle
 *  * Fluent messages match fallback text
 *  * Fluent messages don't contain any straight apostrophes or quotes
 *  * Variables are provided
 * @param ftlMsgMock Mocked version of `FtlMsg` (`data-testid='ftlmsg-mock'`)
 * @param bundle Fluent bundle created during test setup
 * @param ftlArgs Optional Fluent variables to be passed into the message
 */
export function testL10n(
  ftlMsgMock: HTMLElement,
  bundle: FluentBundle,
  ftlArgs?: Record<string, FluentVariable>
) {
  const ftlId = ftlMsgMock.getAttribute('id')!;
  const fallbackText = ftlMsgMock.textContent;
  const ftlBundleMsg = bundle.getMessage(ftlId);

  // nested attributes can happen when we define something like:
  // `profile-picture =
  //   .header = Picture`
  const nestedAttrValues = Object.values(ftlBundleMsg?.attributes || {});

  // TODO: this shouldn't run in CI because IDs or ID updates may not have made their way
  // into the l10n repo yet, should test against `merge-ftl:test` quivalent, aka when
  // the merge script is out of webpack
  if (
    ftlBundleMsg === undefined ||
    (ftlBundleMsg.value === null && nestedAttrValues.length === 0)
  ) {
    throw Error(`Could not retrieve Fluent message tied to ID: ${ftlId}`);
  }

  if (ftlBundleMsg.value) {
    testMessage(bundle, ftlBundleMsg.value, fallbackText, ftlArgs);
  }

  if (nestedAttrValues) {
    nestedAttrValues.forEach((nestedAttrValue) =>
      testMessage(bundle, nestedAttrValue, fallbackText, ftlArgs)
    );
  }
}
