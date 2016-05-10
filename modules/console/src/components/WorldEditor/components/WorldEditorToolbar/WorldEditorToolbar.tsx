import * as React from 'react';
import { WorldEditorState } from '../../types';
import ModeSwitch from '../ModeSwitch';

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
  onChange: (state: WorldEditorState) => any;
}

const WorldEditorToolbar: React.StatelessComponent<WorldEditorToolbarProps> = props => {
  return (
    <div style={styles.toolbarContainer}>
      <ModeSwitch
        mode={props.editorState.mode}
        onModeChange={mode => props.onChange({ mode })}
      />
    </div>
  );
};

export default WorldEditorToolbar;
