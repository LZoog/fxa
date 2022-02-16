/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DOMLocalization, Localization } from '@fluent/dom';
import { RendererBindings, TemplateContext } from './bindings';
import Localizer from '../../l10n';

const RTL_LOCALES = [
  'ar',
  'ckb',
  'dv',
  'he',
  'ks',
  'ps',
  'fa',
  'syr',
  'ur',
  'ug',
];

class Renderer extends Localizer {
  protected readonly bindings: RendererBindings;

  constructor(bindings: RendererBindings) {
    super(bindings);
    this.bindings = bindings;
  }

  async localizeEmail(context: TemplateContext) {
    const { acceptLanguage, template, layout } = context;
    const { l10n, selectedLocale } = await super.setupLocalizer(
      acceptLanguage,
      true
    );
    // emails are sent with a `templateValues` object, Storybook does not
    context = { ...context, ...context.templateValues };
    context.cssPath = this.bindings.opts.templates.cssPath;
    if (template !== '_storybook') {
      if (template === 'verify') {
        const {
          includes: { subject, action },
        } = await this.bindings.getIncludes(template);

        context.subject =
          (await l10n.formatValue(subject.id, context)) || subject.message;
        context.action =
          (await l10n.formatValue(action.id, context)) || action.message;
      }

      // TODO: #11471 Improve dynamically rendered actions & subjects in email.js, etc.
      if (
        template === 'postRemoveTwoStepAuthentication' ||
        template === 'verifyLoginCode'
      ) {
        context.subject = await l10n.formatValue(
          `${template}-subject-line`,
          context
        );
      } else {
        context.subject = await l10n.formatValue(
          `${template}-subject`,
          context
        );
      }
    }

    // metadata.mjml needs a localized version of `action`,
    // but only if oneClickLink is present.
    if (context.oneClickLink) {
      // This is another gross hack due to dynamically rendering l10n IDs and will be fixed in #11471
      if (template === 'downloadSubscription') {
        context.action = await l10n.formatValue(
          `${template}-link-action`,
          context
        );
      } else {
        context.action = await l10n.formatValue(`${template}-action`, context);
      }
    }

    const { text, rootElement } = await this.bindings.renderTemplate(
      template,
      context,
      layout
    );

    l10n.connectRoot(rootElement);
    await l10n.translateRoots();

    const isLocaleRenderedRtl = RTL_LOCALES.includes(selectedLocale);
    if (isLocaleRenderedRtl) {
      const body = rootElement.getElementsByTagName('body')[0];
      body.classList.add('rtl');
    }

    const localizedPlaintext = await this.localizePlaintext(
      text,
      context,
      l10n
    );

    return {
      html: rootElement.outerHTML,
      text: localizedPlaintext,
      subject: context.subject,
    };
  }

  // NOTE: We don't currently send any SMS messages. This will be removed later.
  async localizeSms(context: TemplateContext) {
    const { acceptLanguage, template } = context;
    const { l10n } = await super.setupLocalizer(acceptLanguage);

    const text = await this.bindings.renderSms(template, context);
    return this.localizePlaintext(text, context, l10n);
  }

  protected async localizePlaintext(
    text: string,
    context: TemplateContext,
    l10n?: DOMLocalization | Localization
  ): Promise<string> {
    if (!l10n) {
      l10n = (await super.setupLocalizer(context.acceptLanguage)).l10n;
    }
    const plainTextArr = text.split('\n');
    for (let i in plainTextArr) {
      // match the lines that are of format key = "value" since we will be extracting the key
      // to pass down to fluent
      const { key, val } = splitPlainTextLine(plainTextArr[i]);

      if (key && val) {
        plainTextArr[i] = (await l10n.formatValue(key, context)) || val;
      }
    }
    // convert back to string and strip excessive line breaks
    return plainTextArr.join('\n').replace(/(\n){2,}/g, '\n\n');
  }
}

const reSplitLine = /(?<key>[a-zA-Z0-9-_]+)\s*=\s*"(?<val>.*)?"/;
export function splitPlainTextLine(plainText: string) {
  const matches = reSplitLine.exec(plainText);
  const key = matches?.groups?.key;
  const val = matches?.groups?.val;

  return { key, val };
}

export default Renderer;
