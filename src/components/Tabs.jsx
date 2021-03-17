import React, { useState } from 'react';

import Tab from './Tab';

const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState(children[0].props.label);

  return (
    <div className="tabs">
      <ol className="tab-list">
        {children.map((child) => {
          if (!child.props) {
            return undefined;
          }
          const { label } = child.props;

          return (
            <Tab
              activeTab={activeTab}
              key={label}
              label={label}
              onClick={(tab) => setActiveTab(tab)}
            />
          );
        })}
      </ol>
      <div className="tab-content">
        {children.map((child) => {
          if (!child.props || child.props.label !== activeTab) {
            return undefined;
          }
          return child.props.children;
        })}
      </div>
    </div>
  );
};

export default Tabs;
