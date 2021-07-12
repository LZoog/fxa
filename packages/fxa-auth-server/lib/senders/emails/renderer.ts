/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import ejs = require('ejs');
import mjml2html = require('mjml');
import * as templates from './templates';
import * as layouts from './layouts';

const mjmlConfig: Record<any, any> = {
  validationLevel: 'strict',
};

function compile(
  context: Record<any, any>,
  templateName: string,
  subTemplate?: string
) {
  // Ignore MJML includes since we don't test the styles of the templates.
  // Futher context in PR #10018
  const ignoreIncludes = typeof global.it === 'function';

  let template: ejs.TemplateFunction;
  if (subTemplate) {
    template = ejs.compile(
      layouts[templateName as keyof typeof layouts].render(subTemplate)
    );
  } else {
    template = ejs.compile(
      templates[templateName as keyof typeof templates].render()
    );
  }
  const mjmlTemplate = template(context);
  const htmlTemplate = mjml2html(mjmlTemplate, {
    ...mjmlConfig,
    ignoreIncludes,
  }).html;

  return htmlTemplate;
}

export function renderWithOptionalLayout(
  templateName: string,
  context: Record<any, any>,
  layoutName?: string
) {
  context.templateName = templateName;
  if (layoutName) {
    const subTemplate =
      templates[templateName as keyof typeof templates].render();
    return compile(context, layoutName, subTemplate);
  } else return compile(context, templateName);
}
