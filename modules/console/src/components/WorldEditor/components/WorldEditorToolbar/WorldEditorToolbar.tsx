import * as React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import {
  WorldEditorState,
  EditorMode,
} from '../../types';
import ModeSwitch from './ModeSwitch';

import { TOOLBAR_HEIGHT } from '../../Constants';

// --palette-cyan-100: rgb(178, 235, 242);
// --palette-cyan-200: rgb(128, 222, 234);
// --palette-cyan-300: rgb(77, 208, 225);
// --palette-cyan-400: rgb(38, 198, 218);
// --palette-cyan-500: rgb(0, 188, 212);

const styles = {
  toolbarContainer: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: TOOLBAR_HEIGHT,
    zIndex: 1,
    backgroundColor: 'rgba(128, 222, 234, 0.6)',
  },
};

interface WorldEditorToolbarProps {
  editorState: WorldEditorState;
  onScriptRun: () => any;
  onScriptStop: () => any;
  onEnterEditMode: () => any;
  onEnterPlayMode: () => any;
}

// --palette-cyan-500: rgb(0, 188, 212);
// --palette-pink-A200: rgb(255, 64, 129);
const WorldEditorToolbar: React.StatelessComponent<WorldEditorToolbarProps> = props => {
  let button = null;

  if (props.editorState.common.mode === EditorMode.EDIT) {
    if (props.editorState.editMode.scriptIsRunning) {
      button = (
        <FlatButton
          style={{ marginLeft: 14 }}
          label={'Stop'}
          labelStyle={{
            color: 'white',
          }}
          backgroundColor={`rgba(255, 64, 129, 0.6)`}
          hoverColor={`rgba(255, 64, 129, 0.9)`}
          onTouchTap={props.onScriptStop}
        />
      );
    } else {
      button = (
        <FlatButton
          style={{ marginLeft: 14 }}
          label={'Run'}
          labelStyle={{
            color: 'white',
          }}
          backgroundColor={`rgba(0, 188, 212, 0.6)`}
          hoverColor={`rgba(0, 188, 212, 0.9)`}
          onTouchTap={props.onScriptRun}
        />
      );
    }
  }

  return (
    <div style={styles.toolbarContainer}>
      {button}
      <ModeSwitch
        mode={props.editorState.common.mode}
        onEnterEditMode={props.onEnterEditMode}
        onEnterPlayMode={props.onEnterPlayMode}
      />
    </div>
  );
};

export default WorldEditorToolbar;
