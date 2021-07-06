import React from 'react';
import { Story, Meta } from '@storybook/react';
import RenderedEmail, { RenderedEmailProps } from '../../RenderedEmail';

type CadReminderProps = {
  buttonText: string;
  anotherDeviceURL: string;
  onDesktopOrTabletDevice: boolean;
  iosURL: string;
  androidURL: string;
};

export default {
  title: 'Emails/cadReminder',
} as Meta;

const Template: Story<RenderedEmailProps> = (args) => {
  return <RenderedEmail {...args} />;
};

const commonPropsWithOverrides = (overrides: Partial<CadReminderProps> = {}) =>
  Object.assign({
    template: 'cadReminder',
    description:
      'The Connect Another Device Reminder is sent when [TODO: documentation].',
    variables: {
      buttonText: 'Sync device',
      anotherDeviceURL: '#',
      iosURL: '#',
      androidURL: '#',
      ...overrides,
    },
  });

export const CadReminderDesktopTablet = Template.bind({});
CadReminderDesktopTablet.args = commonPropsWithOverrides({
  onDesktopOrTabletDevice: true,
});
CadReminderDesktopTablet.storyName = 'User is on desktop or tablet device';

export const CadReminderMobile = Template.bind({});
CadReminderMobile.args = commonPropsWithOverrides({
  onDesktopOrTabletDevice: false,
});
CadReminderMobile.storyName = 'User is on mobile device';
