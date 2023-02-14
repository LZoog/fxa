/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import LegalTerms, { viewName } from '.';
import { screen, render, fireEvent } from '@testing-library/react';
import { usePageViewEvent, logViewEvent } from '../../../lib/metrics';
import { FluentBundle } from '@fluent/bundle';
import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
import { REACT_ENTRYPOINT } from '../../../constants';
import { navigate } from '@reach/router';

jest.mock('../../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
}));

// there's not a good way to use react-markdown in tests until we use jest ESM
// https://github.com/remarkjs/react-markdown/issues/635
// https://jestjs.io/docs/ecmascript-modules
// jest.mock('react-markdown', () => {
//   const originalModule = jest.requireActual('react-markdown');

//   return {
//     __esModule: true,
//     ...originalModule,
//     ReactMarkdown: (props: any) => <>{props.children}</>,
//   };
// });

describe('Legal/Terms', () => {
  let bundle: FluentBundle;
  beforeAll(async () => {
    bundle = await getFtlBundle('settings');
  });

  it('renders as expected when markdown has h1', () => {
    beforeAll(() => {
      jest.mock('../../../lib/file-utils-legal.tsx', () => ({
        fetchLegalMd: jest
          .fn()
          .mockResolvedValue({ markdown: '# H1 from markdown' }),
      }));
    });
    afterAll(() => {
      jest.resetAllMocks();
    });
    render(<LegalTerms />);
    testAllL10n(screen, bundle);

    // heading is hidden when the markdown contains one
    expect(
      screen.queryByRole('heading', {
        name: 'Terms of Service',
      })
    ).not.toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'H1 from markdown'
    );
  });

  it('renders as expected when markdown does not have an h1', () => {
    beforeAll(() => {
      jest.mock('../../../lib/file-utils-legal.tsx', () => ({
        fetchLegalMd: jest
          .fn()
          .mockResolvedValue({ markdown: '## An h1 header does not exist' }),
      }));
    });
    afterAll(() => {
      jest.resetAllMocks();
    });
    render(<LegalTerms />);
    testAllL10n(screen, bundle);

    // heading is hidden when the markdown contains one
    expect(
      screen.queryByRole('heading', {
        name: 'Terms of Service',
      })
    ).not.toBeInTheDocument();
  });

  it('shows error message', () => {
    // const error = 'Something went wrong. Please try again later.';
    // beforeAll(() => {
    //   jest.mock('../../../lib/file-utils-legal.tsx', () => ({
    //     fetchLegalMd: jest.fn().mockResolvedValue({
    //       error,
    //     }),
    //   }));
    // });
    // afterAll(() => {
    //   jest.resetAllMocks();
    // });
    render(<LegalTerms />);
    testAllL10n(screen, bundle);

    screen.getByText('Something went wrong. Please try again later.');
  });

  it('can go back, and emits expected metrics events', async () => {
    beforeAll(() => {
      jest.mock('../../../lib/file-utils-legal.tsx', () => ({
        fetchLegalMd: jest
          .fn()
          .mockResolvedValue({ markdown: '# H1 from markdown' }),
      }));
      jest.mock('@reach/router', () => ({
        navigate: jest.fn(),
      }));
    });
    afterAll(() => {
      jest.resetAllMocks();
    });

    console.log('viewName!!', viewName);

    expect(usePageViewEvent).toHaveBeenCalledWith(viewName, REACT_ENTRYPOINT);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(navigate).toHaveBeenCalledWith(-1);
    expect(logViewEvent).toHaveBeenCalledWith(
      `flow.${viewName}`,
      'back',
      REACT_ENTRYPOINT
    );
  });
});
