/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import express from 'express';
import path from 'path';
import config from '../config';
import serveStatic from 'serve-static';

const STATIC_DIRECTORY = path.join(
  __dirname,
  '..',
  '..',
  config.get('staticResources.directory')
);
const proxyUrl = config.get('proxyStaticResourcesFrom');

const app = express();

if (proxyUrl) {
  // logger.info('static.proxying', { url: proxyUrl });
  const proxy = require('express-http-proxy');
  app.use('/', proxy(proxyUrl));
} else {
  // logger.info('static.directory', { directory: STATIC_DIRECTORY });
  app.use(
    serveStatic(STATIC_DIRECTORY, {
      maxAge: config.get('staticResources.maxAge'),
    })
  );
  // TODO routes
}

export async function createServer() {
  const port = config.get('listen.port');
  const host = config.get('listen.host');
  // logger.info('server.starting', { port });
  app.listen(port, host, error => {
    if (error) {
      // logger.error('server.start.error', { error });
      return;
    }

    // logger.info('server.started', { port });
  });
}
