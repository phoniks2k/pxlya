/*
 * espand menu / show other menu buttons
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdExpandMore, MdExpandLess } from 'react-icons/md';
import { t } from 'ttag';

import { toggleOpenMenu } from '../actions';

const ExpandMenuButton = ({ menuOpen, expand }) => (
  <div
    id="menubutton"
    className="actionbuttons"
    role="button"
    title={(menuOpen) ? t`Close Menu` : t`Open Menu`}
    tabIndex={-1}
    onClick={expand}
  >
    {(menuOpen) ? <MdExpandLess /> : <MdExpandMore /> }
  </div>
);

function mapStateToProps(state: State) {
  const { menuOpen } = state.gui;
  return { menuOpen };
}

function mapDispatchToProps(dispatch) {
  return {
    expand() {
      dispatch(toggleOpenMenu());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExpandMenuButton);
