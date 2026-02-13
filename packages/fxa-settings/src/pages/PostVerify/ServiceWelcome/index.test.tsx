/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalizationProvider } from 'fxa-react/lib/test-utils/localizationProvider';
import { Subject } from './mocks';

describe('ServiceWelcome', () => {
  it('renders the success banner', () => {
    renderWithLocalizationProvider(<Subject />);
    expect(
      screen.getByText('Mozilla account confirmed')
    ).toBeInTheDocument();
  });

  it('renders the VPN heading', () => {
    renderWithLocalizationProvider(<Subject />);
    expect(
      screen.getByRole('heading', { name: 'Next: Turn on VPN' })
    ).toBeInTheDocument();
  });

  it('renders the VPN description', () => {
    renderWithLocalizationProvider(<Subject />);
    expect(
      screen.getByText(
        'One more step to boost your browser's privacy. Go to the open panel and turn it on.'
      )
    ).toBeInTheDocument();
  });
});
