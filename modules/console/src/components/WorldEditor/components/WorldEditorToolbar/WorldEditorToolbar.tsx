import * as React from 'react';
import RaisedButton from 'material-ui/lib/raised-button';
import FlatButton from 'material-ui/lib/flat-button';
import {
  WorldEditorState,
  EditorMode,
} from '../../types';
import ModeSwitch from './ModeSwitch';

import { TOOLBAR_HEIGHT } from '../../Constants';

const styles = {
  toolbarContainer: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: TOOLBAR_HEIGHT,
    zIndex: 1,
    backgroundColor: 'rgba(121,121,121,0.7)',
  },
};

interface WorldEditorToolbarProps {
  editorState: WorldEditorState;
  onScriptRun: () => any;
  onScriptStop: () => any;
  onEnterEditMode: () => any;
  onEnterPlayMode: () => any;
}

// --palette-cyan-400: rgb(38, 198, 218);
// --palette-pink-400: rgb(236, 64, 122);
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
          backgroundColor={`rgba(236, 64, 122, 0.5)`}
          hoverColor={`rgba(236, 64, 122, 0.9)`}
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
          backgroundColor={`rgba(38, 198, 218, 0.5)`}
          hoverColor={`rgba(38, 198, 218, 0.9)`}
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
