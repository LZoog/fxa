/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import Portal from 'fxa-react/components/Portal';

type AlertBarProps = {
  isRoot?: boolean;
  children?: any;
};

// export const AlertBar = ({isRoot = false, children}: AlertBarProps) => {
//   const alertBarRef = useRef(null);

//   if (isRoot) {
//     return(
//       <div data-id="alert-bar" ref={alertBarRef}></div>
//     )
//   }

//   return createPortal(children, alertBarRef.current);
// }

// export const AlertBar = React.forwardRef({ children, ref }: AlertBarProps) => (
//   createPortal(
//     <div>{children}</div>,
//     ref
//   );
// );

export const AlertBar = ({ children }: any) => {
  console.log('the children', children);
  console.log('woo', document.getElementById('alert-bar-root'));
  if (document.getElementById('alert-bar-root') === null) {
    return null;
  } else {
    return createPortal(
      <>{children}</>,
      document.getElementById('alert-bar-root')!
    );
  }
};

export default AlertBar;
