/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { Profile } from '.';
import { mockAppContext, renderWithRouter } from '../../models/mocks';
import { AppContext } from '../../models';
import { MOCK_PROFILE_EMPTY } from './mocks';
import { FtlMsgProps } from 'fxa-react/lib/utils';
import { screen } from '@testing-library/react';
import path from 'path';
import { readFileSync } from 'fs';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { Pattern } from '@fluent/bundle/esm/ast';

jest.mock('fxa-react/lib/utils', () => ({
  FtlMsg: (props: FtlMsgProps) => (
    <div data-testid="ftlmsg-mock" id={props.id}>
      {props.children}
    </div>
  ),
}));

export function getFtlBundle(locale = 'en'): FluentBundle {
  const ftlPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
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
  fallbackText: string | null
) {
  const ftlMsg = bundle.formatPattern(pattern);

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

function testL10n(ftlMsgMock: HTMLElement, bundle: FluentBundle) {
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

describe('Profile', () => {
  const bundle = getFtlBundle();

  it('renders "fresh load" <Profile/> with correct content', async () => {
    renderWithRouter(
      <AppContext.Provider
        value={mockAppContext({ account: MOCK_PROFILE_EMPTY })}
      >
        <Profile />
      </AppContext.Provider>
    );

    const ftlMsgMocks = screen.getAllByTestId('ftlmsg-mock');
    ftlMsgMocks.forEach((ftlMsgMock) => {
      testL10n(ftlMsgMock, bundle);
    });

    await screen.findByAltText('Default avatar');
    expect(await screen.findAllByText('None')).toHaveLength(2);
    await screen.findByText('johndope@example.com');
  });
});
