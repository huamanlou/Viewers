import React from 'react';
import PropTypes from 'prop-types';

import './LanguageSwitcher.styl';

const LanguageSwitcher = ({ language, onLanguageChange, languages }) => {
  const onChange = event => {
    const { value } = event.target;
    onLanguageChange(value);
  };
  let langArr = [];
  languages.map(item=>{
    if(item.value=='zh' || item.value=='en-US'){ //zh,en
      langArr.push(item);
    }
  })
  return (
    <select
      name="language-select"
      id="language-select"
      className="language-select"
      value={language}
      onChange={onChange}
    >
      {langArr.map(lng => (
        <option key={lng.value} value={lng.value}>
          {lng.label}
        </option>
      ))}
    </select>
  );
};

LanguageSwitcher.propTypes = {
  language: PropTypes.string.isRequired,
  languages: PropTypes.array.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
};

export { LanguageSwitcher };
