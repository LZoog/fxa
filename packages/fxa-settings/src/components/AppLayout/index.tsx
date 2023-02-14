/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import mozLogo from 'fxa-react/images/moz-logo.svg';
import LinkExternal from 'fxa-react/components/LinkExternal';
import { useLocalization } from '@fluent/react';
import classNames from 'classnames';

type AppLayoutProps = {
  children: React.ReactNode;
  widthClass?: string;
};

export const AppLayout = ({
  children,
  // HACK: this overwrites a class; if we use it often, consider pulling
  // `.card` classes out into this component and give it a default value
  widthClass,
}: AppLayoutProps) => {
  const { l10n } = useLocalization();
  return (
    <div className="flex min-h-screen flex-col items-center" data-testid="app">
      <main className="mobileLandscape:flex mobileLandscape:items-center mobileLandscape:flex-1">
        <section>
          <div className={classNames('card', widthClass)}>{children}</div>
        </section>
      </main>
      <footer className="hidden mobileLandscape:block w-full p-8">
        <LinkExternal
          rel="author"
          href="https://www.mozilla.org/about/?utm_source=firefox-accounts&amp;utm_medium=Referral"
        >
          <img
            src={mozLogo}
            alt={l10n.getString(
              'app-footer-mozilla-logo-label',
              null,
              'Mozilla logo'
            )}
            className="w-32"
          />
        </LinkExternal>
      </footer>
    </div>
  );
};

export default AppLayout;
