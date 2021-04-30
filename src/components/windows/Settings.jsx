/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { c, t } from 'ttag';

import LanguageSelect from '../LanguageSelect';
import MdToggleButtonHover from '../MdToggleButtonHover';
import {
  toggleGrid,
  togglePixelNotify,
  toggleMute,
  toggleAutoZoomIn,
  toggleCompactPalette,
  toggleChatNotify,
  togglePotatoMode,
  toggleLightGrid,
  toggleHistoricalView,
  selectStyle,
} from '../../actions';

import type { State } from '../../reducers';


const flexy = {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  flexWrap: 'nowrap',
  boxSizing: 'border-box',
  flex: '1 1 auto',
};

const itemStyles = {
  ...flexy,
  flexDirection: 'column',
  marginBottom: 20,
};

const titleStyles = {
  flex: '1 1 auto',
};

const rowStyles = {
  ...flexy,
  flexDirection: 'row',
};

const SettingsItemSelect = ({
  title, description, values, selected, onSelect, icon,
}) => (
  <div style={itemStyles}>
    <div style={rowStyles}>
      <h3 style={titleStyles} className="modaltitle">{title}</h3>
      {(icon) && <img alt="" src={icon} />}
      <select
        onChange={(e) => {
          const sel = e.target;
          onSelect(sel.options[sel.selectedIndex].value);
        }}
      >
        {
          values.map((value) => (
            <option
              selected={value === selected}
              value={value}
            >
              {value}
            </option>
          ))
        }
      </select>
    </div>
    {description && <div className="modaldesc">{description} </div>}
    <div className="modaldivider" />
  </div>
);

const SettingsItem = ({
  title, description, keyBind, value, onToggle,
}) => (
  <div style={itemStyles}>
    <div style={rowStyles}>
      <h3
        style={titleStyles}
        className="modaltitle"
      >
        {title} {keyBind && <kbd>{keyBind}</kbd>}
      </h3>
      <MdToggleButtonHover value={value} onToggle={onToggle} />
    </div>
    {description && <div className="modaldesc">{description} </div>}
    <div className="modaldivider" />
  </div>
);

function Settings({
  isMuted,
  isGridShown,
  isPixelNotifyShown,
  isPotato,
  isLightGrid,
  isHistoricalView,
  onMute,
  autoZoomIn,
  compactPalette,
  selectedStyle,
  onToggleGrid,
  onTogglePixelNotify,
  onToggleAutoZoomIn,
  onToggleCompactPalette,
  onToggleChatNotify,
  onTogglePotatoMode,
  onToggleLightGrid,
  onToggleHistoricalView,
  onSelectStyle,
  chatNotify,
}) {
  return (
    <div style={{ paddingLeft: '5%', paddingRight: '5%', paddingTop: 30 }}>
      <SettingsItem
        title={t`Show Grid`}
        description={t`Turn on grid to highlight pixel borders.`}
        keyBind={c('keybinds').t`G`}
        value={isGridShown}
        onToggle={onToggleGrid}
      />
      <SettingsItem
        title={t`Show Pixel Activity`}
        description={t`Show circles where pixels are placed.`}
        keyBind={c('keybinds').t`X`}
        value={isPixelNotifyShown}
        onToggle={onTogglePixelNotify}
      />
      <SettingsItem
        title={t`Disable Game Sounds`}
        // eslint-disable-next-line max-len
        description={t`All sound effects will be disabled.`}
        keyBind={c('keybinds').t`M`}
        value={isMuted}
        onToggle={onMute}
      />
      <SettingsItem
        title={t`Enable chat notifications`}
        description={t`Play a sound when new chat messages arrive`}
        value={chatNotify}
        onToggle={onToggleChatNotify}
      />
      <SettingsItem
        title={t`Auto Zoom In`}
        // eslint-disable-next-line max-len
        description={t`Zoom in instead of placing a pixel when you tap the canvas and your zoom is small.`}
        value={autoZoomIn}
        onToggle={onToggleAutoZoomIn}
      />
      <SettingsItem
        title={t`Compact Palette`}
        // eslint-disable-next-line max-len
        description={t`Display Palette in a compact form that takes less screen space.`}
        value={compactPalette}
        onToggle={onToggleCompactPalette}
      />
      <SettingsItem
        title={t`Potato Mode`}
        description={t`For when you are playing on a potato.`}
        value={isPotato}
        onToggle={onTogglePotatoMode}
      />
      <SettingsItem
        title={t`Light Grid`}
        description={t`Show Grid in white instead of black.`}
        value={isLightGrid}
        onToggle={onToggleLightGrid}
      />
      {(window.ssv && window.ssv.backupurl) && (
      <SettingsItem
        title={t`Historical View`}
        description={t`Check out past versions of the canvas.`}
        value={isHistoricalView}
        keyBind={c('keybinds').t`H`}
        onToggle={onToggleHistoricalView}
      />
      )}
      {(window.ssv && window.ssv.availableStyles) && (
        <SettingsItemSelect
          title={t`Themes`}
          description={t`How pixelplanet should look like.`}
          values={Object.keys(window.ssv.availableStyles)}
          selected={selectedStyle}
          onSelect={onSelectStyle}
        />
      )}
      {(window.ssv && navigator.cookieEnabled && window.ssv.langs) && (
        <div style={itemStyles}>
          <div style={rowStyles}>
            <h3 style={titleStyles} className="modaltitle">
              {t`Select Language`}
            </h3>
            <LanguageSelect />
          </div>
        </div>
      )}
    </div>
  );
}

function mapStateToProps(state: State) {
  const { mute, chatNotify } = state.audio;
  const {
    showGrid,
    showPixelNotify,
    autoZoomIn,
    compactPalette,
    isPotato,
    isLightGrid,
    style: selectedStyle,
  } = state.gui;
  const isMuted = mute;
  const {
    isHistoricalView,
  } = state.canvas;
  const isGridShown = showGrid;
  const isPixelNotifyShown = showPixelNotify;
  return {
    isMuted,
    isGridShown,
    isPixelNotifyShown,
    autoZoomIn,
    compactPalette,
    chatNotify,
    isPotato,
    isLightGrid,
    isHistoricalView,
    selectedStyle,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onMute() {
      dispatch(toggleMute());
    },
    onToggleGrid() {
      dispatch(toggleGrid());
    },
    onTogglePixelNotify() {
      dispatch(togglePixelNotify());
    },
    onToggleAutoZoomIn() {
      dispatch(toggleAutoZoomIn());
    },
    onToggleCompactPalette() {
      dispatch(toggleCompactPalette());
    },
    onToggleChatNotify() {
      dispatch(toggleChatNotify());
    },
    onTogglePotatoMode() {
      dispatch(togglePotatoMode());
    },
    onToggleLightGrid() {
      dispatch(toggleLightGrid());
    },
    onToggleHistoricalView() {
      dispatch(toggleHistoricalView());
    },
    onSelectStyle(style) {
      dispatch(selectStyle(style));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
