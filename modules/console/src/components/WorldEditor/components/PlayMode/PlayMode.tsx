import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./PlayMode.css');

import { WorldEditorState, PlayModeState } from '../../types';
import { TOOLBAR_HEIGHT } from '../../Constants';

import PlayModeSwitch from './PlayModeSwitch';

interface PlayModeProps extends React.Props<PlayMode> {
  canvasElement: HTMLElement;
  playModeState: PlayModeState;
  onChange: (state: WorldEditorState) => any;
}

const inlineStyles = {
  blocker: {
    position: 'absolute',
    top: TOOLBAR_HEIGHT,
    left: 0,
    bottom: 0,
    right: 0,
  },
}

@withStyles(styles)
class PlayMode extends React.Component<PlayModeProps, {}> {
  handleKeyDown = (event: KeyboardEvent) => {
    switch(event.keyCode) {
      case 27: {
        this.props.onChange({ playMode: PlayModeState.READY });
        break;
      }
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown, false);
  }

  render() {
    const blocker = this.props.playModeState === PlayModeState.READY? (
      <div style={inlineStyles.blocker}>
        <PlayModeSwitch
          canvasElement={this.props.canvasElement}
          onChange={this.props.onChange}
        />
      </div>
    ) : null;

    return (
      <div>
        {blocker}
      </div>
    );
  }
}

export default PlayMode;
