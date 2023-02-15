/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import LegalTerms, { viewName } from '.';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import { usePageViewEvent, logViewEvent } from '../../../lib/metrics';
import { FluentBundle } from '@fluent/bundle';
import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
import { REACT_ENTRYPOINT } from '../../../constants';
import { fetchLegalMd } from '../../../lib/file-utils-legal';
import { navigate } from '@reach/router';

jest.mock('../../../lib/file-utils-legal');
jest.mock('../../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
}));
jest.mock('@reach/router', () => ({
  navigate: jest.fn(),
}));

// There's not a good way to use react-markdown in tests until we use jest ESM. Using the jest
// config recommended in this issue is fragile and causes other tests to fail. We could
// alternatively use react-markdown @ 6.0.3. and rehype-raw @5.1.0, but these packages are already
// a couple years old at the time of writing and requires at least one other workaround.
// https://github.com/remarkjs/react-markdown/issues/635
// https://jestjs.io/docs/ecmascript-modules
jest.mock('react-markdown', () => {
  return {
    ReactMarkdown: (props: any) => <>{props.children}</>,
  };
});
jest.mock('rehype-raw', () => {
  return {
    rehypeRaw: (props: any) => <>{props.children}</>,
  };
});

describe('Legal/Terms', () => {
  let bundle: FluentBundle;
  beforeAll(async () => {
    bundle = await getFtlBundle('settings');
  });

  describe('with terms returned from fetchLegalMd', () => {
    beforeEach(() => {
      (fetchLegalMd as jest.Mock).mockImplementation(() => ({
        terms: '## Some markdown',
      }));
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    // note: in practice, if the markdown contains an H1, we hide CardHeader.
    // we can't mock that properly due to note above.
    it('renders as expected', async () => {
      render(<LegalTerms />);
      testAllL10n(screen, bundle);
      await waitFor(() => {
        expect(fetchLegalMd).toHaveBeenCalled();
      });

      screen.getByRole('heading', {
        name: 'Terms of Service',
      });
    });

    it('can go back, and emits metrics events as expected', async () => {
      render(<LegalTerms />);
      expect(usePageViewEvent).toHaveBeenCalledWith(viewName, REACT_ENTRYPOINT);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      await waitFor(() => {
        expect(navigate).toHaveBeenCalledWith(-1);
      });
      expect(logViewEvent).toHaveBeenCalledWith(
        `flow.${viewName}`,
        'back',
        REACT_ENTRYPOINT
      );
    });
  });

  it('displays a loading state', () => {
    render(<LegalTerms />);
    screen.getByTestId('loading-spinner');
  });

  describe('with error returned from fetchLegalMd', () => {
    beforeEach(() => {
      (fetchLegalMd as jest.Mock).mockImplementation(() => ({
        error: 'boop',
      }));
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('displays an error state', async () => {
      render(<LegalTerms />);
      await screen.findByText('boop');
    });
  });
});
