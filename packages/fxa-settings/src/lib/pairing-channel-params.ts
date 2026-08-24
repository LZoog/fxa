/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Gets the pairing channel parameters out of the URL fragment before anything
 * can read the URL and report it.
 *
 * Firefox opens the supplicant at `/pair#channel_id=…&channel_key=…&v=2`, and
 * `channel_key` is the pre-shared key that encrypts the pairing channel. Glean's
 * automatic instrumentation records `window.location.href` — fragment included —
 * as the `url` extra on its page-load event and on *every* element-click event,
 * so leaving the key in the URL ships it to telemetry. It cannot be scrubbed at
 * the Glean layer: glean.js reads `href` itself inside `handleClickEvent`, so
 * there is no seam to substitute a sanitized value into.
 *
 * So the fragment is captured once at startup and removed from the URL. The
 * values move to `sessionStorage`, which is a deliberate trade: the key stays
 * readable by any script on this origin, exactly as it was in the fragment, but
 * it is no longer part of the URL and so no longer reaches telemetry. It is not
 * held only in memory because this flow reloads — a post-OAuth webview reload
 * (FXA-13616) has to find the channel still there.
 */

/** Namespaced so it cannot collide with the pair-complete markers. */
const STORAGE_KEY = 'fxa.pairing.channel.hash';

/**
 * Presence of the key is what triggers a capture. Gating on it — rather than on
 * any fragment at all — keeps ordinary in-page anchors (`#connected-services`,
 * `#secondary-email`) untouched.
 */
const SECRET_PARAM = 'channel_key';

export type PairingChannelParams = {
  channelId: string;
  channelKey: string;
};

/** Serialized hash params, without the leading `#`. */
let snapshot: string | null = null;

function readStorage(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // sessionStorage throws outright in some sandboxed WebViews.
    return null;
  }
}

function writeStorage(value: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Unavailable storage degrades to in-memory only, which still covers
    // everything except a reload.
  }
}

/**
 * Capture and strip the pairing fragment. Call once, before React renders, so it
 * lands ahead of the `useLayoutEffect` in App that initializes Glean — that
 * effect runs before any child effect, so stripping from inside the supplicant
 * page would be too late for the first page-load event.
 *
 * Safe to call more than once and safe on a URL with no fragment.
 */
export function capturePairingChannelParams(): void {
  const hash = window.location.hash.replace(/^#/, '');

  if (hash && new URLSearchParams(hash).has(SECRET_PARAM)) {
    snapshot = hash;
    writeStorage(hash);

    // Keep the path and query exactly as they were; only the fragment goes.
    try {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    } catch {
      // If the URL cannot be rewritten the snapshot is still correct, so the
      // flow works — this run just keeps leaking the key to telemetry.
    }
    return;
  }

  // No fragment: either this is not a pairing URL, or we already stripped it and
  // the page has since reloaded.
  if (snapshot === null) {
    snapshot = readStorage();
  }
}

/**
 * The captured fragment as params, or null when this is not a pairing flow.
 * Falls back to storage so a reload before any capture still resolves.
 */
export function getPairingChannelHashParams(): URLSearchParams | null {
  const hash = snapshot ?? readStorage();
  return hash === null ? null : new URLSearchParams(hash);
}

/**
 * Write back to the capture instead of the URL. Nothing writes pairing params
 * today, but the store backing them exposes a generic `set()`, and routing it
 * here is what stops a future caller from quietly returning the key to the URL.
 */
export function updatePairingChannelHashParams(params: URLSearchParams): void {
  snapshot = params.toString();
  writeStorage(snapshot);
}

/** Whether a pairing channel was ever present in this tab's URL. */
export function hasPairingChannelParams(): boolean {
  return getPairingChannelHashParams() !== null;
}

/**
 * The two values the supplicant needs, or null when either is missing — callers
 * treat a partial fragment the same as no fragment at all.
 */
export function getPairingChannelParams(): PairingChannelParams | null {
  const params = getPairingChannelHashParams();
  const channelId = params?.get('channel_id');
  const channelKey = params?.get('channel_key');
  return channelId && channelKey ? { channelId, channelKey } : null;
}

/** Test seam. Not for production use. */
export function resetPairingChannelParamsForTest(): void {
  snapshot = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to reset
  }
}
