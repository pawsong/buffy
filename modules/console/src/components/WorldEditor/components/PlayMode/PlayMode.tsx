import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./PlayMode.css');

import { WorldEditorState, PlayModeState } from '../../types';

import PlayModeSwitch from './PlayModeSwitch';

interface PlayModeProps extends React.Props<PlayMode> {
  canvasElement: HTMLElement;
  playModeState: PlayModeState;
  onChange: (state: WorldEditorState) => any;
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
      <PlayModeSwitch
        canvasElement={this.props.canvasElement}
        onChange={this.props.onChange}
      />
    ) : null;

    return (
      <div>
        {blocker}
      </div>
    );
  }
}

export default PlayMode;
