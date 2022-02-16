/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type FtlOpts = {
  basePath: string;
};
export type L10nOpts = {
  ftl: FtlOpts;
};

export type LocalizerOpts = L10nOpts;

export class LocalizerBindings {
  readonly opts: LocalizerOpts;
  constructor(opts?: LocalizerOpts) {
    this.opts = Object.assign(
      {
        ftl: {
          basePath: join(__dirname, '../../public/locales'),
        },
      },
      opts
    );

    // Make sure config is legit
    this.validateConfig();
  }

  protected validateConfig() {
    if (!existsSync(this.opts.ftl.basePath)) {
      throw new Error('Invalid ftl basePath');
    }
  }

  async fetchResource(path: string): Promise<string> {
    const raw = readFileSync(path, {
      encoding: 'utf8',
    });

    return raw;
  }
}
