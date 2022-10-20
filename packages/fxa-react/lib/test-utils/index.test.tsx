/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FtlMsg, FtlMsgProps } from '../utils';
import { getFtlBundle, testL10n } from '.';

const simpleComponent = (id: string, fallbackText = '') => (
  <FtlMsg {...{ id }}>{fallbackText}</FtlMsg>
);

const componentWithAttrs = (id: string, fallbackText = '') => (
  <FtlMsg {...{ id }} attrs={{ header: true }}>
    <h2>{fallbackText}</h2>
  </FtlMsg>
);

const componentWithVar = (fallbackText: string, name: string) => (
  <FtlMsg id="test-var" vars={{ name }}>
    <p>{fallbackText}</p>
  </FtlMsg>
);

// TODO: add this to fxa-react and fxa-payments-server setupTests when we use it in those files
jest.mock('fxa-react/lib/utils', () => ({
  FtlMsg: (props: FtlMsgProps) => (
    <div data-testid="ftlmsg-mock" id={props.id}>
      {props.children}
    </div>
  ),
}));

describe('testL10n', () => {
  const bundle = getFtlBundle(null);

  it('throws if FTL ID is not found', () => {
    expect(() => {
      render(simpleComponent('not-in-bundle'));

      const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
      testL10n(ftlMsgMock, bundle);
    }).toThrowError(
      'Could not retrieve Fluent message tied to ID: not-in-bundle'
    );
  });

  it('throws if FTL ID is present, but message is not found', () => {
    expect(() => {
      render(simpleComponent('test-missing-message'));

      const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
      testL10n(ftlMsgMock, bundle);
    }).toThrowError(
      'Could not retrieve Fluent message tied to ID: test-missing-message'
    );
  });

  it('throws if FTL ID and attributes are present, but message is not found', () => {
    expect(() => {
      render(componentWithAttrs('test-missing-message-attrs'));

      const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
      testL10n(ftlMsgMock, bundle);
    }).toThrowError(
      'Could not retrieve Fluent message tied to ID: test-missing-message-attrs'
    );
  });

  it('tests for message attributes', () => {
    expect(() => {
      render(componentWithAttrs('test-attrs', 'When you walk away'));

      const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
      testL10n(ftlMsgMock, bundle);
    }).not.toThrow();
  });

  describe('testMessage', () => {
    it('throws if FTL message does not match fallback text', () => {
      expect(() => {
        render(simpleComponent('test-simple', 'testing 123'));

        const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
        testL10n(ftlMsgMock, bundle);
      }).toThrowError('Fallback text does not match Fluent message');
    });

    it('throws if FTL message contains straight apostrophe', () => {
      expect(() => {
        render(
          simpleComponent('test-straight-apostrophe', "you don't hear me say")
        );

        const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
        testL10n(ftlMsgMock, bundle);
      }).toThrowError('Fluent message contains a straight apostrophe');
    });

    it('throws if FTL message contains straight quote', () => {
      expect(() => {
        render(simpleComponent('test-straight-quote', '"please, don’t go"'));

        const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
        testL10n(ftlMsgMock, bundle);
      }).toThrowError('Fluent message contains a straight quote');
    });

    it('throws if FTL message expects variable not provided', () => {
      const name = 'Sora';
      expect(() => {
        render(componentWithVar(`${name} smiled at me`, name));

        const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
        testL10n(ftlMsgMock, bundle);
      }).toThrowError('Unknown variable: $name');
    });

    it('tests for message variables', () => {
      const name = 'Sora';
      expect(() => {
        render(componentWithVar(`${name} smiled at me`, name));

        const ftlMsgMock = screen.getByTestId('ftlmsg-mock');
        testL10n(ftlMsgMock, bundle, { name });
      }).not.toThrow();
    });
  });
});
