/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import path from 'path';
import { readFileSync } from 'fs';
import { FluentBundle, FluentResource, FluentVariable } from '@fluent/bundle';
import { Pattern } from '@fluent/bundle/esm/ast';

export function getFtlBundle(locale = 'en'): FluentBundle {
  const ftlPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'packages',
    'fxa-settings',
    'public',
    'locales',
    locale,
    'settings.ftl'
  );
  const messages = readFileSync(ftlPath).toString();
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

  // assert the Fluent message is in the fallback text
  if (ftlMsg !== fallbackText && !fallbackText?.includes(ftlMsg)) {
    throw Error(
      `Fallback text does not match Fluent message.\n\nFallback text: ${fallbackText}\nFluent message: ${ftlMsg}`
    );
  }
  // assert the Fluent message doesn't contain straight quotes
  if (ftlMsg.includes("'" || '"')) {
    throw Error(
      `Fluent message contains a straight single or double quote and must be updated to its curly quote equivalent.\n\nFluent message: ${ftlMsg}`
    );
  }
}

export function testL10n(ftlMsgMock: HTMLElement, bundle: FluentBundle) {
  const ftlId = ftlMsgMock.getAttribute('id')!;
  const fallbackText = ftlMsgMock.textContent;

  const ftlBundleMsg = bundle.getMessage(ftlId);

  if (ftlBundleMsg === undefined) {
    throw Error(`Unable to locate Fluent message with id: ${ftlId}`);
  }

  // nested attributes can happen when we define something like:
  // `profile-picture =
  //   .header = Picture`
  const nestedAttrValues = Object.values(ftlBundleMsg.attributes);

  if (ftlBundleMsg.value === null && nestedAttrValues === null) {
    throw Error(
      `The Fluent ID ${ftlId} was found in the bundle, but the message value is null`
    );
  }

  if (ftlBundleMsg.value) {
    testMessage(bundle, ftlBundleMsg.value, fallbackText);
  }

  if (nestedAttrValues) {
    nestedAttrValues.forEach((nestedAttrValue) =>
      testMessage(bundle, nestedAttrValue, fallbackText)
    );
  }
}
