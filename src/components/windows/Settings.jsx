/**
 *
 * @flow
 */

import React from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
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

function Settings() {
  const [
    isGridShown,
    isPixelNotifyShown,
    autoZoomIn,
    compactPalette,
    isPotato,
    isLightGrid,
    selectedStyle,
    isMuted,
    chatNotify,
    isHistoricalView,
  ] = useSelector((state) => [
    state.gui.showGrid,
    state.gui.showPixelNotify,
    state.gui.autoZoomIn,
    state.gui.compactPalette,
    state.gui.isPotato,
    state.gui.isLightGrid,
    state.gui.style,
    state.audio.mute,
    state.audio.chatNotify,
    state.canvas.isHistoricalView,
  ], shallowEqual);
  const dispatch = useDispatch();

  return (
    <div style={{ paddingLeft: '5%', paddingRight: '5%', paddingTop: 30 }}>
      <SettingsItem
        title={t`Show Grid`}
        description={t`Turn on grid to highlight pixel borders.`}
        keyBind={c('keybinds').t`G`}
        value={isGridShown}
        onToggle={() => dispatch(toggleGrid())}
      />
      <SettingsItem
        title={t`Show Pixel Activity`}
        description={t`Show circles where pixels are placed.`}
        keyBind={c('keybinds').t`X`}
        value={isPixelNotifyShown}
        onToggle={() => dispatch(togglePixelNotify())}
      />
      <SettingsItem
        title={t`Disable Game Sounds`}
        // eslint-disable-next-line max-len
        description={t`All sound effects will be disabled.`}
        keyBind={c('keybinds').t`M`}
        value={isMuted}
        onToggle={() => dispatch(toggleMute())}
      />
      <SettingsItem
        title={t`Enable chat notifications`}
        description={t`Play a sound when new chat messages arrive`}
        value={chatNotify}
        onToggle={() => dispatch(toggleChatNotify())}
      />
      <SettingsItem
        title={t`Auto Zoom In`}
        // eslint-disable-next-line max-len
        description={t`Zoom in instead of placing a pixel when you tap the canvas and your zoom is small.`}
        value={autoZoomIn}
        onToggle={() => dispatch(toggleAutoZoomIn())}
      />
      <SettingsItem
        title={t`Compact Palette`}
        // eslint-disable-next-line max-len
        description={t`Display Palette in a compact form that takes less screen space.`}
        value={compactPalette}
        onToggle={() => dispatch(toggleCompactPalette())}
      />
      <SettingsItem
        title={t`Potato Mode`}
        description={t`For when you are playing on a potato.`}
        value={isPotato}
        onToggle={() => dispatch(togglePotatoMode())}
      />
      <SettingsItem
        title={t`Light Grid`}
        description={t`Show Grid in white instead of black.`}
        value={isLightGrid}
        onToggle={() => dispatch(toggleLightGrid())}
      />
      {(window.ssv && window.ssv.backupurl) && (
      <SettingsItem
        title={t`Historical View`}
        description={t`Check out past versions of the canvas.`}
        value={isHistoricalView}
        keyBind={c('keybinds').t`H`}
        onToggle={() => dispatch(toggleHistoricalView())}
      />
      )}
      {(window.ssv && window.ssv.availableStyles) && (
        <SettingsItemSelect
          title={t`Themes`}
          description={t`How pixelplanet should look like.`}
          values={Object.keys(window.ssv.availableStyles)}
          selected={selectedStyle}
          onSelect={(style) => dispatch(selectStyle(style))}
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

export default React.memo(Settings);
