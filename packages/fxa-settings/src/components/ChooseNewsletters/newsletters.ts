/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Fields available in each newsletter:
 * - `label` is the label shown to the user.
 * - `slug` is the id passed to Basket
 * - 'ftlId' is the string id for localization
 */
export type Newsletter = {
  label: string;
  slug: string;
  ftlId: string;
};

export const newsletters: Newsletter[] = [
  {
    label: 'Be safer and smarter online',
    slug: 'knowledge-is-power',
    ftlId: 'choose-newsletters-option-knowledge-is-power',
  },
  {
    label: 'Test new Firefox products',
    slug: 'test-pilot',
    ftlId: 'choose-newsletters-option-test-products',
  },
  {
    label: 'Take action to keep the internet healthy',
    slug: 'take-action-for-the-internet',
    ftlId: 'choose-newsletters-option-take-action-for-the-internet',
  },
];
