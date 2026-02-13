/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { RouteComponentProps } from '@reach/router';
import AppLayout from '../../../components/AppLayout';
import Banner from '../../../components/Banner';
import CardHeader from '../../../components/CardHeader';
import { useFtlMsgResolver } from '../../../models';
import { FtlMsg } from 'fxa-react/lib/utils';
import { ServiceWelcomeProps } from './interfaces';
import { HeartsVerifiedImage } from '../../../components/images';

const ServiceWelcome = ({
  integration,
}: ServiceWelcomeProps & RouteComponentProps) => {
  const ftlMsgResolver = useFtlMsgResolver();

  return (
    <AppLayout>
      <Banner
        type="success"
        textAlignClassName="text-center"
        content={{
          localizedHeading: ftlMsgResolver.getMsg(
            'service-welcome-success-banner',
            'Mozilla account confirmed'
          ),
        }}
      />

      <HeartsVerifiedImage className="mx-auto mt-4 max-h-44" ariaHidden />

      <CardHeader
        headingTextFtlId="service-welcome-vpn-heading"
        headingText="Next: Turn on VPN"
      />

      <FtlMsg id="service-welcome-vpn-description">
        <p className="mt-2 mb-7 text-sm">
          One more step to boost your browser's privacy. Go to the open panel
          and turn it on.
        </p>
      </FtlMsg>
    </AppLayout>
  );
};

export default ServiceWelcome;
