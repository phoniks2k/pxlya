import React from 'react';

const Tab = ({ onClick, activeTab, label }) => {
  let className = 'tab-list-item';
  if (activeTab === label) {
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
