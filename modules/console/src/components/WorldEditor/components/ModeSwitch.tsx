import * as React from 'react';
import IconButton from 'material-ui/lib/icon-button';
const ModeEdit = require('material-ui/lib/svg-icons/editor/mode-edit');
const PlayArrow = require('material-ui/lib/svg-icons/av/play-arrow');
const objectAssign = require('object-assign');

import { EditorMode } from '../types';

const styles = {
  wrapper: {
    position: 'absolute',
    left: 30,
    top: 30,
  },
  tool: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
};

interface ModeRadioButtonProps extends React.Props<ModeRadioButton> {
  label: string;
  icon: any;
  selected: boolean;
  onTouchTap: () => any;
}

class ModeRadioButton extends React.Component<ModeRadioButtonProps, {}> {
  render() {
    const icon = React.createElement(this.props.icon, {
      color: '#ffffff',
    });

    const style = objectAssign({}, styles.tool, this.props.selected ? {
      backgroundColor: `rgba(${22}, ${165}, ${165}, 0.5)`,
    } : {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });

    return (
        <IconButton
          style={style}
          onTouchTap={this.props.onTouchTap}
          tooltipPosition="bottom-center"
          tooltip={this.props.label}
        >{icon}</IconButton>
    );
  }
}

interface ModeSwitchProps extends React.Props<ModeSwitch> {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => any;
}

class ModeSwitch extends React.Component<ModeSwitchProps, {}> {
  render() {
    return (
      <div style={styles.wrapper}>
        <ModeRadioButton
          label="Edit Mode"
          icon={ModeEdit}
          selected={this.props.mode === EditorMode.EDIT}
          onTouchTap={() => this.props.onModeChange(EditorMode.EDIT)}
        />
        <ModeRadioButton
          label="Play Mode"
          icon={PlayArrow}
          selected={this.props.mode === EditorMode.PLAY}
          onTouchTap={() => this.props.onModeChange(EditorMode.PLAY)}
        />
      </div>
    );
  }
}

export default ModeSwitch;
