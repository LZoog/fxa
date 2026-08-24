/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { UrlData } from './url-data';
import { RouterWindow } from '../../window';
import {
  getPairingChannelHashParams,
  updatePairingChannelHashParams,
} from '../../pairing-channel-params';

/**
 * Creates a data store from the current URL state.
 * Uses window.location.hash to hold state.
 */
export class UrlHashData extends UrlData {
  constructor(public readonly window: RouterWindow) {
    super(window);
  }

  protected getParams() {
    // The pairing fragment is taken out of the URL at startup so its channel key
    // cannot reach telemetry, so for that one flow the captured copy is the only
    // remaining source. Every other fragment is still read live.
    const pairingParams = getPairingChannelHashParams();
    if (pairingParams) {
      return pairingParams;
    }
    return new URLSearchParams(this.window.location.hash?.replace(/^#/, ''));
  }

  protected setParams(params: URLSearchParams) {
    // Mirror of getParams: while the pairing fragment is captured, writes go
    // back to the capture. Writing them to the URL would undo the scrub.
    if (getPairingChannelHashParams()) {
      updatePairingChannelHashParams(params);
      return;
    }
    const hash = '#' + params.toString();
    this.window.location.hash = hash;
  }
}
