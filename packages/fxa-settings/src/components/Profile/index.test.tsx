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

jest.mock('fxa-react/lib/utils', () => ({
  FtlMsg: (props: FtlMsgProps) => (
    <div data-testid="ftlmsg-mock" id={props.id}>
      {props.children}
    </div>
  ),
}));

// export function getLocalizedMessage(
//   bundle: FluentBundle,
//   msgId: string,
//   args: any
// ): string {
//   let localizedMessage = bundle.getMessage(msgId);
//   if (localizedMessage === undefined || localizedMessage.value === null) {
//     throw Error(`unable to locate fluent message with id: ${msgId}`);
//   }

//   return bundle.formatPattern(localizedMessage.value, { ...args });
// }

export function getFtlBundle(locale = 'en'): FluentBundle {
  const ftlPath = path.join(
    __dirname,
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

// const ftlBundleMsg = ftlBundle.getMessage(props.id);
// const ftlMsg = ftlBundleMsg?.value;

// // assert the bundle contains the Fluent ID and message
// if (!ftlMsg) {
//   throw Error(`Unable to locate Fluent message with id: ${props.id} `);
// }
// // assert the Fluent message and fallback text match
// if (ftlMsg !== props.children) {
//   throw Error(
//     `Fallback text does not match Fluent message.\n\nFallback text: ${props.children}\nFluent message: ${ftlMsg}`
//   );
// }
// // assert the Fluent message doesn't contain straight quotes
// if (ftlMsg.includes("'" || '"')) {
//   throw Error(
//     `Fluent message contains a straight single or double quote and must be updated to its curly quote equivalent.\n\nFluent message: ${ftlMsg}`
//   );
// }

function testL10n() {
  // todo
}

describe('Profile', () => {
  // const ftlBundle = getFtlBundle();

  it('renders "fresh load" <Profile/> with correct content', async () => {
    renderWithRouter(
      <AppContext.Provider
        value={mockAppContext({ account: MOCK_PROFILE_EMPTY })}
      >
        <Profile />
      </AppContext.Provider>
    );

    const mocks = screen.getAllByTestId('ftlmsg-mock');
    mocks.forEach((mock) => {
      console.log('mock text', mock.textContent);
      console.log('id attribute of mock', mock.getAttribute('id'));
    });

    await screen.findByAltText('Default avatar');
    expect(await screen.findAllByText('None')).toHaveLength(2);
    await screen.findByText('johndope@example.com');
  });
});
