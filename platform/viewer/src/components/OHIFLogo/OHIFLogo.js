import './OHIFLogo.css';
// import logo from './logo.svg';
const logo = require('./logo.svg');

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
      <img src="${logo}" width="83" />
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
