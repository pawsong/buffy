import * as React from 'react';
import IconButton from 'material-ui/lib/icon-button';
const ModeEdit = require('material-ui/lib/svg-icons/editor/mode-edit');
const PlayArrow = require('material-ui/lib/svg-icons/av/play-arrow');

import {
  EditorMode,
  PlayModeState,
  CameraMode,
  WorldEditorState,
} from '../../types';

const styles = {
  tool: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
};

interface ModeRadioButtonProps {
  label: string;
  icon: any;
  selected: boolean;
  onTouchTap: () => any;
}

// --palette-cyan-500: rgb(0, 188, 212);
// --palette-pink-A200: rgb(255, 64, 129);
const ModeRadioButton: React.StatelessComponent<ModeRadioButtonProps> = props => {
  const icon = React.createElement(props.icon, {
    color: '#ffffff',
  });

  const style = Object.assign({}, styles.tool, props.selected ? {
    backgroundColor: `rgba(0, 188, 212, 0.6)`,
  } : {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  });

  return (
      <IconButton
        style={style}
        onTouchTap={props.onTouchTap}
        tooltipPosition="bottom-center"
        tooltip={props.label}
      >{icon}</IconButton>
  );
}

interface ModeSwitchProps {
  mode: EditorMode;
  onEnterEditMode: () => any;
  onEnterPlayMode: () => any;
}

const ModeSwitch: React.StatelessComponent<ModeSwitchProps> = props => {
  return (
    <div style={{
      position: 'absolute',
      margin: 'auto',
      height: 48,
      top: 0,
      bottom: 0,
      right: 7,
    }}>
      <ModeRadioButton
        label="Edit Mode"
        icon={ModeEdit}
        selected={props.mode === EditorMode.EDIT}
        onTouchTap={props.onEnterEditMode}
      />
      <ModeRadioButton
        label="Play Mode"
        icon={PlayArrow}
        selected={props.mode === EditorMode.PLAY}
        onTouchTap={props.onEnterPlayMode}
      />
    </div>
  );
}

export default ModeSwitch;
