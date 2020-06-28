import './OHIFLogo.css';

import { Icon } from '@ohif/ui';
import React from 'react';

function OHIFLogo() {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="header-brand"
      href="/"
    >
      <img src="https://photo.zastatic.com/images/common-cms/it/20200628/1593313626305_353793_t.png" width="83" />
      {/* Logo text would fit smaller displays at two lines:
       *
       * Open Health
       * Imaging Foundation
       *
       * Or as `OHIF` on really small displays
       */}
      &nbsp;&nbsp;&nbsp; Angel Soft &nbsp;&nbsp;&nbsp;
    </a>
  );
}

export default OHIFLogo;
