import * as React from 'react';
import IconButton from 'material-ui/lib/icon-button';
const ModeEdit = require('material-ui/lib/svg-icons/editor/mode-edit');
const PlayArrow = require('material-ui/lib/svg-icons/av/play-arrow');
const objectAssign = require('object-assign');

import { EditorMode } from '../types';

const styles = {
  tool: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
};

interface ModeRadioButtonProps {
  label: string;
  icon: any;
  selected: boolean;
  onTouchTap: () => any;
}

const ModeRadioButton: React.StatelessComponent<ModeRadioButtonProps> = props => {
  const icon = React.createElement(props.icon, {
    color: '#ffffff',
  });

  const style = objectAssign({}, styles.tool, props.selected ? {
    backgroundColor: `rgba(${22}, ${165}, ${165}, 0.5)`,
  } : {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  onModeChange: (mode: EditorMode) => any;
}

const ModeSwitch: React.StatelessComponent<ModeSwitchProps> = props => {
  return (
    <div style={{ marginLeft: 7 }}>
      <ModeRadioButton
        label="Edit Mode"
        icon={ModeEdit}
        selected={props.mode === EditorMode.EDIT}
        onTouchTap={() => props.onModeChange(EditorMode.EDIT)}
      />
      <ModeRadioButton
        label="Play Mode"
        icon={PlayArrow}
        selected={props.mode === EditorMode.PLAY}
        onTouchTap={() => props.onModeChange(EditorMode.PLAY)}
      />
    </div>
  );
}

export default ModeSwitch;
