import React from 'react';

const Tab = ({ onClick, active, label }) => {
  let className = 'tab-list-item';
  if (active) {
    className += ' tab-list-active';
  }

  return (
    <li
      role="presentation"
      className={className}
      onClick={() => onClick(label)}
    >
      {label}
    </li>
  );
};

export default Tab;
